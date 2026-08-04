import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await prisma.vipAdvertisement.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/promotions/vip/${params.id} failed:`, error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
