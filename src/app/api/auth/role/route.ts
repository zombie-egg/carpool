import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const role = body.role === "driver" ? "driver" : body.role === "customer" ? "customer" : null;
  if (!role) return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.id }, select: { roleChosen: true } });
  if (user?.roleChosen) return NextResponse.json({ error: "role_locked" }, { status: 409 });
  await prisma.user.update({ where: { id: session.id }, data: { role, roleChosen: true } });
  return NextResponse.json({ ok: true });
}
