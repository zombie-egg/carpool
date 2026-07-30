import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const STATE_COOKIE = "wechat_oauth_state";

interface TokenResponse {
  access_token?: string;
  openid?: string;
  errcode?: number;
}

interface WechatProfile {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  errcode?: number;
}

function qrSuccessResponse(locale: string, userId: string) {
  const isZh = locale === "zh";
  const home = `/${locale}`;
  const title = isZh ? "微信授权成功" : "WeChat authorization complete";
  const message = isZh
    ? "电脑已自动登录，正在进入手机网站…"
    : "Your computer is signed in. Opening the mobile website…";
  const action = isZh ? "立即进入网站" : "Open website now";
  const html = `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta http-equiv="refresh" content="1;url=${home}">
  <title>${title}</title>
  <style>
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#f7f7f7;color:#171717;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.card{width:100%;max-width:420px;padding:36px 24px;border-radius:18px;background:#fff;text-align:center;box-shadow:0 10px 35px rgba(0,0,0,.08)}.icon{display:flex;width:64px;height:64px;margin:0 auto 20px;align-items:center;justify-content:center;border-radius:50%;background:#07c160;color:#fff;font-size:38px}.title{margin:0 0 12px;font-size:24px}.message{margin:0 0 24px;color:#666;line-height:1.6}.button{display:block;padding:13px 18px;border-radius:9px;background:#07c160;color:#fff;text-decoration:none;font-weight:600}
  </style>
</head>
<body><main class="card"><div class="icon">✓</div><h1 class="title">${title}</h1><p class="message">${message}</p><a class="button" href="${home}">${action}</a></main></body>
</html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
  response.cookies.set("lian_session", createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}

function loginRedirect(request: NextRequest, locale: string, error?: string) {
  const url = new URL(`/${locale}/login`, request.nextUrl.origin);
  if (error) url.searchParams.set("wechatError", error);
  return NextResponse.redirect(url);
}

// Exchanges the OAuth code, loads the WeChat profile and logs in or registers.
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "zh";
  const ticket = request.nextUrl.searchParams.get("ticket")?.trim();
  const requestedReturnTo = request.nextUrl.searchParams.get("returnTo")?.trim();
  const returnTo =
    requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo.slice(0, 1000)
      : `/${locale}`;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return loginRedirect(request, locale, "invalid_state");
  }

  const appId = process.env.WECHAT_APP_ID?.trim();
  const appSecret = process.env.WECHAT_APP_SECRET?.trim();
  if (!appId || !appSecret) {
    return loginRedirect(request, locale, "not_configured");
  }

  try {
    const tokenUrl = new URL("https://api.weixin.qq.com/sns/oauth2/access_token");
    tokenUrl.searchParams.set("appid", appId);
    tokenUrl.searchParams.set("secret", appSecret);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("grant_type", "authorization_code");
    const tokenResponse = await fetch(tokenUrl, { cache: "no-store" });
    const token = (await tokenResponse.json()) as TokenResponse;
    if (!token.access_token || !token.openid || token.errcode) {
      return loginRedirect(request, locale, "authorization_failed");
    }

    const profileUrl = new URL("https://api.weixin.qq.com/sns/userinfo");
    profileUrl.searchParams.set("access_token", token.access_token);
    profileUrl.searchParams.set("openid", token.openid);
    profileUrl.searchParams.set("lang", locale === "zh" ? "zh_CN" : "en");
    const profileResponse = await fetch(profileUrl, { cache: "no-store" });
    const profile = (await profileResponse.json()) as WechatProfile;
    if (profile.errcode || !profile.openid) {
      return loginRedirect(request, locale, "profile_failed");
    }

    const existing = await prisma.user.findUnique({
      where: { wechatOpenId: profile.openid },
    });
    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: {
            // Preserve user-edited values; fill only values that are missing.
            ...(!existing.nickname && profile.nickname
              ? { nickname: profile.nickname }
              : {}),
            ...(!existing.avatarUrl && profile.headimgurl
              ? { avatarUrl: profile.headimgurl }
              : {}),
          },
        })
      : await prisma.user.create({
          data: {
            wechatOpenId: profile.openid,
            nickname: profile.nickname?.trim() || `微信用户${profile.openid.slice(-6)}`,
            avatarUrl: profile.headimgurl || null,
            isAdmin: false,
          },
        });

    let qrAuthorized = false;
    if (ticket) {
      const updatedTicket = await prisma.wechatLoginTicket.updateMany({
        where: {
          token: ticket,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
        data: { status: "authorized", userId: user.id },
      });
      qrAuthorized = updatedTicket.count > 0;
    }

    if (qrAuthorized) {
      return qrSuccessResponse(locale, user.id);
    }

    setSessionCookie(user.id);
    const response = NextResponse.redirect(
      new URL(returnTo, request.nextUrl.origin)
    );
    response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("GET /api/auth/wechat/callback failed:", error);
    return loginRedirect(request, locale, "login_failed");
  }
}
