import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  driverDataFromPayload,
  validateDriverPayload,
} from "@/lib/driver-validation";
import type { DriverPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/drivers — list all drivers, newest first.
export async function GET() {
  try {
    const user = await getSessionUser();
    const drivers = await prisma.driverInfo.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(drivers.map((driver) => user?.isAdmin || driver.userId === user?.id ? driver : { ...driver, phone: "", wechat: null }));
  } catch (error) {
    console.error("GET /api/drivers failed:", error);
    return NextResponse.json(
      { error: "Failed to load drivers" },
      { status: 500 }
    );
  }
}

// POST /api/drivers — register a new driver (admin only).
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin && user.role !== "driver") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const payload = (await request.json()) as DriverPayload;
    const validationError = validateDriverPayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    if (!user.isAdmin) {
      const existing = await prisma.driverInfo.findUnique({ where: { userId: user.id } });
      if (existing) return NextResponse.json({ error: "profile_exists" }, { status: 409 });
    }
    const driver = await prisma.driverInfo.create({
      data: { ...driverDataFromPayload(payload), ...(!user.isAdmin ? { userId: user.id } : {}) },
    });
    return NextResponse.json(driver, { status: 201 });
  } catch (error) {
    console.error("POST /api/drivers failed:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 }
    );
  }
}
