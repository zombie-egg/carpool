import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as { token?: string; role?: string };
    const token = payload.token?.trim() || "";
    const role = payload.role === "driver" ? "driver" : "customer";
    if (!token) return NextResponse.json({ error: "invalid_ticket" }, { status: 400 });
    const ticket = await prisma.wechatRegistrationTicket.findUnique({ where: { token } });
    if (!ticket || ticket.expiresAt <= new Date()) return NextResponse.json({ error: "expired_ticket" }, { status: 410 });
    const existing = await prisma.user.findUnique({ where: { wechatOpenId: ticket.openId } });
    if (existing) {
      await prisma.wechatRegistrationTicket.delete({ where: { id: ticket.id } });
      setSessionCookie(existing.id);
      return NextResponse.json({ user: existing, existing: true });
    }
    const user = await prisma.user.create({ data: { wechatOpenId: ticket.openId, nickname: ticket.nickname || `微信用户${ticket.openId.slice(-6)}`, avatarUrl: ticket.avatarUrl, role, isAdmin: false } });
    if (ticket.loginTicket) {
      await prisma.wechatLoginTicket.updateMany({ where: { token: ticket.loginTicket, status: "pending", expiresAt: { gt: new Date() } }, data: { status: "authorized", userId: user.id } });
    }
    await prisma.wechatRegistrationTicket.delete({ where: { id: ticket.id } });
    setSessionCookie(user.id);
    return NextResponse.json({ user, existing: false }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/wechat/register failed:", error);
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }
}
