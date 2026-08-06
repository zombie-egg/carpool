import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const role = body.role === "driver" ? "driver" : body.role === "customer" ? "customer" : null;
  if (!role) return NextResponse.json({ error: "invalid_role" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (user.isAdmin) return NextResponse.json({ error: "admin_role_locked" }, { status: 403 });
  if (user.role === role && user.roleChosen) return NextResponse.json({ ok: true, remaining: 3 - user.roleChangeCount });
  const month = new Date().toISOString().slice(0, 7);
  const count = user.roleChangeMonth === month ? user.roleChangeCount : 0;
  if (user.roleChosen && count >= 3) return NextResponse.json({ error: "monthly_limit" }, { status: 429 });
  const nextCount = user.roleChosen ? count + 1 : count;
  await prisma.user.update({ where: { id: session.id }, data: { role, roleChosen: true, roleChangeMonth: month, roleChangeCount: nextCount } });
  return NextResponse.json({ ok: true, remaining: 3 - nextCount });
}
