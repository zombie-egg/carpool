import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import type { DriverPayload } from "@/lib/types";
import {
  driverDataFromPayload,
  validateDriverPayload,
} from "@/lib/driver-validation";

export const dynamic = "force-dynamic";

function isNotFoundError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
}

// PUT /api/drivers/:id — update an existing driver record (admin only).
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const existing = await prisma.driverInfo.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    if (!user.isAdmin && existing.userId !== user.id) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const payload = (await request.json()) as DriverPayload;
    const validationError = validateDriverPayload(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const driver = await prisma.driverInfo.update({
      where: { id: params.id },
      data: driverDataFromPayload(payload),
    });
    return NextResponse.json(driver);
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    console.error(`PUT /api/drivers/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 }
    );
  }
}

// DELETE /api/drivers/:id — remove a driver record (admin only).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!user.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await prisma.driverInfo.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    console.error(`DELETE /api/drivers/${params.id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 }
    );
  }
}
