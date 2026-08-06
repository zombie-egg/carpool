import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// WeChat service-account/menu links should authorize automatically. Ordinary
// browsers continue through the normal email/QR login page.
export default function middleware(request: NextRequest) {
  const inWechat = /MicroMessenger/i.test(request.headers.get("user-agent") ?? "");
  const hasSession = Boolean(request.cookies.get("lian_session")?.value);
  const oauthFailed = request.nextUrl.searchParams.has("wechatError");
  const hasRegistrationTicket = request.nextUrl.searchParams.has("wechatTicket");
  const hasRoleChoice = request.nextUrl.searchParams.get("wechatRole") === "1";

  if (inWechat && !hasSession && !oauthFailed && !hasRegistrationTicket && !hasRoleChoice) {
    const firstSegment = request.nextUrl.pathname.split("/")[1];
    const locale = firstSegment === "en" ? "en" : "zh";
    const returnTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    const authorize = new URL("/api/auth/wechat", request.url);
    authorize.searchParams.set("locale", locale);
    authorize.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(authorize);
  }

  return intlMiddleware(request);
}

export const config = {
  // Skip API routes, Next.js internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
