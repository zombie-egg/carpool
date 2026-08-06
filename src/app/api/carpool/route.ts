import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PHONE_REGEX } from "@/lib/constants";
import type { CarpoolCreatePayload, ContactType } from "@/lib/types";

export const dynamic = "force-dynamic";

const CONTACT_TYPES: ReadonlyArray<ContactType> = ["wechat", "phone", "both"];

function validatePayload(payload: CarpoolCreatePayload): string | null {
  if (!payload.organizerName?.trim()) return "organizerName is required";
  if (!payload.departLocation?.trim()) return "departLocation is required";
  if (!payload.destination?.trim()) return "destination is required";
  if (!payload.departTime || Number.isNaN(Date.parse(payload.departTime))) {
    return "departTime must be a valid date";
  }
  if (
    !Number.isInteger(payload.totalSeats) ||
    payload.totalSeats < 2 ||
    payload.totalSeats > 50
  ) {
    return "totalSeats must be an integer between 2 and 50";
  }
  if (
    typeof payload.totalPrice !== "number" ||
    Number.isNaN(payload.totalPrice) ||
    payload.totalPrice < 0
  ) {
    return "totalPrice must be a non-negative number";
  }
  if (!CONTACT_TYPES.includes(payload.contactType)) {
    return "contactType must be wechat, phone or both";
  }
  const needsWechat =
    payload.contactType === "wechat" || payload.contactType === "both";
  const needsPhone =
    payload.contactType === "phone" || payload.contactType === "both";
  if (needsWechat && !payload.wechatId?.trim()) return "wechatId is required";
  if (needsPhone && !PHONE_REGEX.test(payload.phoneNumber ?? "")) {
    return "phoneNumber must be a valid 11-digit mobile number";
  }
  return null;
}

// GET /api/carpool — list all trips, newest first.
// With ?mine=1, returns only the logged-in user's own published trips.
// Trips whose departure time has passed are auto-marked as finished.
export async function GET(request: NextRequest) {
  try {
    await prisma.carpoolOrder.updateMany({
      where: {
        departTime: { lt: new Date() },
        status: { not: "finished" },
      },
      data: { status: "finished" },
    });

    const mine = request.nextUrl.searchParams.get("mine") === "1";
    if (mine) {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      }
      const own = await prisma.carpoolOrder.findMany({
        where: { organizerId: user.id, ...(user.isAdmin ? {} : { hiddenByOrganizer: false, OR: [{ deletedByCustomer: false }, { deletedByDriver: false }] }) },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(own);
    }

    const user = await getSessionUser();
    let where = { status: "recruiting", hiddenByOrganizer: false, OR: [{ deletedByCustomer: false }, { deletedByDriver: false }] } as Record<string, unknown>;
    if (user?.isAdmin) {
      where = {};
    } else if (user?.role === "driver") {
      where = { driverRequest: { driver: { userId: user.id } }, OR: [{ deletedByCustomer: false }, { deletedByDriver: false }] };
    }
    const orders = await prisma.carpoolOrder.findMany({ where, orderBy: { createdAt: "desc" } });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/carpool failed:", error);
    return NextResponse.json(
      { error: "Failed to load carpool orders" },
      { status: 500 }
    );
  }
}

// POST /api/carpool — publish a new trip (login required).
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as CarpoolCreatePayload;
    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const order = await prisma.carpoolOrder.create({
      data: {
        organizerName: payload.organizerName.trim(),
        departLocation: payload.departLocation.trim(),
        destination: payload.destination.trim(),
        departTime: new Date(payload.departTime),
        totalSeats: payload.totalSeats,
        // The organizer is the first rider and occupies one seat immediately.
        remainingSeats: payload.totalSeats - 1,
        totalPrice: payload.totalPrice,
        organizerId: user.id,
        contactType: payload.contactType,
        wechatId: payload.wechatId?.trim() || null,
        phoneNumber: payload.phoneNumber?.trim() || null,
        remark: payload.remark?.trim() || null,
        status: "recruiting",
      },
    });
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/carpool failed:", error);
    return NextResponse.json(
      { error: "Failed to create carpool order" },
      { status: 500 }
    );
  }
}
