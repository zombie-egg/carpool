import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// DELETE /api/carpool/:id — remove a trip. Only its organizer (or the admin)
// may delete it.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const order = await prisma.carpoolOrder.findUnique({
      where: { id: params.id },
      select: { organizerId: true },
    });
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (order.organizerId !== user.id && !user.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.carpoolOrder.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/carpool/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
