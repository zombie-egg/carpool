import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/carpool/:id — organizer/admin view with participant contacts.
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const trip = await prisma.carpoolOrder.findUnique({
      where: { id: params.id },
      include: {
        organizer: { select: { id: true, nickname: true, email: true } },
        participants: {
          include: {
            user: { select: { id: true, nickname: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        driverRequest: { include: { driver: true } },
      },
    });
    if (!trip) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (trip.organizerId !== user.id && !user.isAdmin && trip.driverRequest?.driver.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json(trip);
  } catch (error) {
    console.error(`GET /api/carpool/${params.id} failed:`, error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

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
      select: { organizerId: true, driverRequest: { select: { customerId: true, driver: { select: { userId: true } } } } },
    });
    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const isDriver = order.driverRequest?.driver.userId === user.id;
    const isCustomer = order.driverRequest?.customerId === user.id;
    if (order.organizerId !== user.id && !isDriver && !isCustomer && !user.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (user.isAdmin) await prisma.carpoolOrder.delete({ where: { id: params.id } });
    else if (order.driverRequest) await prisma.carpoolOrder.update({ where: { id: params.id }, data: isDriver ? { deletedByDriver: true } : { deletedByCustomer: true } });
    else await prisma.carpoolOrder.update({ where: { id: params.id }, data: { hiddenByOrganizer: true } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`DELETE /api/carpool/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
}
