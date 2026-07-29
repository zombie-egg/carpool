import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

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

function loginRedirect(request: NextRequest, locale: string, error?: string) {
  const url = new URL(`/${locale}/login`, request.nextUrl.origin);
  if (error) url.searchParams.set("wechatError", error);
  return NextResponse.redirect(url);
}

// Exchanges the OAuth code, loads the WeChat profile and logs in or registers.
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "zh";
  const ticket = request.nextUrl.searchParams.get("ticket")?.trim();
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

    if (ticket) {
      await prisma.wechatLoginTicket.updateMany({
        where: {
          token: ticket,
          status: "pending",
          expiresAt: { gt: new Date() },
        },
        data: { status: "authorized", userId: user.id },
      });
    }

    setSessionCookie(user.id);
    const response = NextResponse.redirect(new URL(`/${locale}`, request.nextUrl.origin));
    response.cookies.set(STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("GET /api/auth/wechat/callback failed:", error);
    return loginRedirect(request, locale, "login_failed");
  }
}
