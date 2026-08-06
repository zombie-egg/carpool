import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  await prisma.carpoolOrder.updateMany({ where: { departTime: { lt: new Date() }, status: { not: "finished" } }, data: { status: "finished" } });
  const [drivers, customers, total, finished, full, expired, revenue] = await Promise.all([
    prisma.driverInfo.count(),
    prisma.user.count({ where: { role: "customer" } }),
    prisma.carpoolOrder.count(),
    prisma.carpoolOrder.count({ where: { status: "finished" } }),
    prisma.carpoolOrder.count({ where: { status: "full" } }),
    prisma.carpoolOrder.count({ where: { departTime: { lt: new Date() } } }),
    prisma.carpoolOrder.aggregate({ where: { status: "finished", driverRequest: { isNot: null } }, _sum: { totalPrice: true } }),
  ]);
  return NextResponse.json({ drivers, customers, total, completed: finished, pending: total - finished, full, expired, totalRevenue: Number(revenue._sum.totalPrice || 0) });
}
