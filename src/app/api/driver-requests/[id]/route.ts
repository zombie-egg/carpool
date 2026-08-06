import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (user.role !== "driver") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const profile = await prisma.driverInfo.findUnique({ where: { userId: user.id } });
    if (!profile) return NextResponse.json({ error: "driver_profile_required" }, { status: 400 });
    const booking = await prisma.driverBookingRequest.findUnique({ where: { id: params.id }, include: { customer: true } });
    if (!booking || booking.driverId !== profile.id) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (booking.status !== "pending") return NextResponse.json({ error: "already_processed" }, { status: 409 });
    const payload = (await request.json()) as { action?: string; finalPrice?: number };
    if (payload.action === "reject") {
      return NextResponse.json(await prisma.driverBookingRequest.update({ where: { id: booking.id }, data: { status: "rejected" } }));
    }
    const finalPrice = Number(payload.finalPrice);
    if (payload.action !== "confirm" || !Number.isFinite(finalPrice) || finalPrice < 0) return NextResponse.json({ error: "invalid_price" }, { status: 400 });
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.carpoolOrder.create({
        data: {
          organizerName: booking.customer.nickname,
          organizerId: booking.customerId,
          departLocation: booking.departLocation,
          destination: booking.destination,
          departTime: booking.departTime,
          totalSeats: booking.totalSeats,
          remainingSeats: Math.max(0, booking.totalSeats - 1),
          totalPrice: finalPrice,
          contactType: booking.customerContactType,
          wechatId: booking.customerContactType === "wechat" ? booking.customerContactValue : null,
          phoneNumber: booking.customerContactType === "phone" ? booking.customerContactValue : null,
          remark: booking.remark,
          status: booking.totalSeats <= 1 ? "full" : "recruiting",
        },
      });
      return tx.driverBookingRequest.update({ where: { id: booking.id }, data: { status: "confirmed", finalPrice, carpoolOrderId: trip.id } });
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error(`PATCH /api/driver-requests/${params.id} failed:`, error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
