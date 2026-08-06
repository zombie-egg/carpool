import { createHmac, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function signState(nonce: string) {
  const secret = process.env.AUTH_SECRET || process.env.WECHAT_APP_SECRET || "wechat-state";
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

const STATE_COOKIE = "wechat_oauth_state";

// Starts WeChat Official Account OAuth. First authorization also registers.
export async function GET(request: NextRequest) {
  const appId = process.env.WECHAT_APP_ID?.trim();
  if (!appId) {
    return NextResponse.json({ error: "wechat_not_configured" }, { status: 503 });
  }

  const locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "zh";
  const ticket = request.nextUrl.searchParams.get("ticket")?.trim();
  const role = request.nextUrl.searchParams.get("role") === "driver" ? "driver" : "customer";
  const requestedReturnTo = request.nextUrl.searchParams.get("returnTo")?.trim();
  const returnTo =
    requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo.slice(0, 1000)
      : undefined;
  // Include a signature in the state so WeChat's in-app browser can complete
  // the callback even when it does not retain the temporary cookie.
  const nonce = randomBytes(24).toString("hex");
  const state = `${nonce}.${signState(nonce)}`;
  const publicOrigin = (process.env.APP_URL?.trim() || request.nextUrl.origin).replace(/\/$/, "");
  const callbackUrl = new URL(`${publicOrigin}/api/auth/wechat/callback`);
  callbackUrl.searchParams.set("locale", locale);
  if (ticket) callbackUrl.searchParams.set("ticket", ticket);
  callbackUrl.searchParams.set("role", role);
  if (returnTo) callbackUrl.searchParams.set("returnTo", returnTo);
  const authorize = new URL("https://open.weixin.qq.com/connect/oauth2/authorize");
  authorize.searchParams.set("appid", appId);
  authorize.searchParams.set("redirect_uri", callbackUrl.toString());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "snsapi_userinfo");
  authorize.searchParams.set("state", state);

  const response = NextResponse.redirect(`${authorize.toString()}#wechat_redirect`);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
