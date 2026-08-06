import { createHmac, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TICKET_TTL_MS = 5 * 60 * 1000;

function signState(nonce: string) {
  const secret = process.env.AUTH_SECRET || process.env.WECHAT_APP_SECRET || "wechat-state";
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

// POST creates a one-time desktop login ticket and its mobile authorization URL.
export async function POST(request: NextRequest) {
  if (!process.env.WECHAT_APP_ID || !process.env.WECHAT_APP_SECRET) {
    return NextResponse.json({ error: "wechat_not_configured" }, { status: 503 });
  }
  const payload = (await request.json().catch(() => ({}))) as { locale?: string; role?: string };
  const locale = payload.locale === "en" ? "en" : "zh";
  const role = payload.role === "driver" ? "driver" : "customer";
  const token = randomBytes(32).toString("hex");
  await prisma.wechatLoginTicket.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  await prisma.wechatLoginTicket.create({
    data: {
      token,
      expiresAt: new Date(Date.now() + TICKET_TTL_MS),
    },
  });
  const configuredOrigin = process.env.APP_URL?.trim();
  const origin = (configuredOrigin && !/localhost|127\.0\.0\.1/i.test(configuredOrigin)
    ? configuredOrigin
    : "https://carpools.zeabur.app").replace(/\/$/, "");
  const nonce = randomBytes(24).toString("hex");
  const state = `${nonce}.${signState(nonce)}`;
  const callback = new URL(`${origin}/api/auth/wechat/callback`);
  callback.searchParams.set("locale", locale);
  callback.searchParams.set("ticket", token);
  callback.searchParams.set("role", role);
  const authorize = new URL("https://open.weixin.qq.com/connect/oauth2/authorize");
  authorize.searchParams.set("appid", process.env.WECHAT_APP_ID.trim());
  authorize.searchParams.set("redirect_uri", callback.toString());
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("scope", "snsapi_userinfo");
  authorize.searchParams.set("state", state);
  return NextResponse.json({
    token,
    authorizeUrl: `${authorize.toString()}#wechat_redirect`,
    expiresIn: TICKET_TTL_MS / 1000,
  });
}

// GET is polled by the desktop. The token itself is the one-time capability.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) {
    return NextResponse.json({ error: "invalid_ticket" }, { status: 400 });
  }
  const ticket = await prisma.wechatLoginTicket.findUnique({ where: { token } });
  if (!ticket || ticket.expiresAt <= new Date()) {
    if (ticket) await prisma.wechatLoginTicket.delete({ where: { id: ticket.id } });
    return NextResponse.json({ status: "expired" }, { status: 410 });
  }
  if (ticket.status !== "authorized" || !ticket.userId) {
    return NextResponse.json({ status: "pending" });
  }
  setSessionCookie(ticket.userId);
  await prisma.wechatLoginTicket.delete({ where: { id: ticket.id } });
  return NextResponse.json({ status: "authorized" });
}
