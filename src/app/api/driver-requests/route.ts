import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (user.role === "driver") {
      const profile = await prisma.driverInfo.findUnique({ where: { userId: user.id } });
      if (!profile) return NextResponse.json([]);
      return NextResponse.json(await prisma.driverBookingRequest.findMany({
        where: { driverId: profile.id },
        include: { customer: { select: { id: true, nickname: true, email: true } } },
        orderBy: { createdAt: "desc" },
      }));
    }
    return NextResponse.json(await prisma.driverBookingRequest.findMany({
      where: { customerId: user.id },
      include: { driver: true },
      orderBy: { createdAt: "desc" },
    }));
  } catch (error) {
    console.error("GET /api/driver-requests failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (user.role !== "customer") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const payload = (await request.json()) as Record<string, unknown>;
    const driverId = typeof payload.driverId === "string" ? payload.driverId : "";
    const departLocation = typeof payload.departLocation === "string" ? payload.departLocation.trim() : "";
    const destination = typeof payload.destination === "string" ? payload.destination.trim() : "";
    const departTime = new Date(typeof payload.departTime === "string" ? payload.departTime : "");
    const totalSeats = Number(payload.totalSeats);
    const estimatedPrice = Number(payload.estimatedPrice);
    const customerContactType = payload.customerContactType === "phone" ? "phone" : payload.customerContactType === "wechat" ? "wechat" : "";
    const customerContactValue = typeof payload.customerContactValue === "string" ? payload.customerContactValue.trim() : "";
    const remark = typeof payload.remark === "string" ? payload.remark.trim() : "";
    if (!driverId || !departLocation || !destination || Number.isNaN(departTime.getTime()) || departTime <= new Date() || !Number.isInteger(totalSeats) || totalSeats < 1 || totalSeats > 20 || !Number.isFinite(estimatedPrice) || estimatedPrice < 0 || !customerContactType || !customerContactValue) {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }
    const driver = await prisma.driverInfo.findUnique({ where: { id: driverId } });
    if (!driver) return NextResponse.json({ error: "driver_not_found" }, { status: 404 });
    if (!driver.userId) return NextResponse.json({ error: "driver_not_online" }, { status: 400 });
    const booking = await prisma.driverBookingRequest.create({
      data: { customerId: user.id, driverId, departLocation, destination, departTime, totalSeats, estimatedPrice, customerContactType, customerContactValue, remark: remark || null },
    });
    return NextResponse.json({ booking, driverContact: { phone: driver.phone, wechat: driver.wechat } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/driver-requests failed:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
