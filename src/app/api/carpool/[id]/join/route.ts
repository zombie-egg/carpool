import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { PHONE_REGEX } from "@/lib/constants";
import type { TripJoinPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

function validationError(payload: TripJoinPayload): string | null {
  if (!Number.isInteger(payload.partySize) || payload.partySize < 1) {
    return "invalid_party_size";
  }
  if (payload.contactType !== "wechat" && payload.contactType !== "phone") {
    return "invalid_contact_type";
  }
  const contact = payload.contactValue?.trim();
  if (!contact) return "contact_required";
  if (payload.contactType === "phone" && !PHONE_REGEX.test(contact)) {
    return "invalid_phone";
  }
  return null;
}

// POST /api/carpool/:id/join — create one tracked signup per account.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = (await request.json()) as TripJoinPayload;
    const invalid = validationError(payload);
    if (invalid) {
      return NextResponse.json({ error: invalid }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.carpoolOrder.findUnique({
        where: { id: params.id },
        select: {
          organizerId: true,
          remainingSeats: true,
          status: true,
          departTime: true,
        },
      });
      if (!trip) return { error: "not_found" } as const;
      if (trip.organizerId === user.id) return { error: "own_trip" } as const;

      const existing = await tx.tripParticipant.findUnique({
        where: { tripId_userId: { tripId: params.id, userId: user.id } },
      });
      if (existing) return { error: "already_joined" } as const;
      if (
        trip.status !== "recruiting" ||
        trip.departTime <= new Date() ||
        trip.remainingSeats < payload.partySize
      ) {
        return { error: "insufficient_seats" } as const;
      }

      const claimed = await tx.carpoolOrder.updateMany({
        where: {
          id: params.id,
          status: "recruiting",
          remainingSeats: { gte: payload.partySize },
        },
        data: { remainingSeats: { decrement: payload.partySize } },
      });
      if (claimed.count === 0) {
        return { error: "insufficient_seats" } as const;
      }

      const participation = await tx.tripParticipant.create({
        data: {
          tripId: params.id,
          userId: user.id,
          partySize: payload.partySize,
          contactType: payload.contactType,
          contactValue: payload.contactValue.trim(),
        },
        include: {
          user: { select: { id: true, nickname: true, email: true } },
        },
      });
      let updatedTrip = await tx.carpoolOrder.findUniqueOrThrow({
        where: { id: params.id },
      });
      if (updatedTrip.remainingSeats === 0) {
        updatedTrip = await tx.carpoolOrder.update({
          where: { id: params.id },
          data: { status: "full" },
        });
      }
      return { trip: updatedTrip, participation } as const;
    });

    if ("error" in result) {
      const status = result.error === "not_found" ? 404 : 409;
      return NextResponse.json({ error: result.error }, { status });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "already_joined" }, { status: 409 });
    }
    console.error(`POST /api/carpool/${params.id}/join failed:`, error);
    return NextResponse.json({ error: "join_failed" }, { status: 500 });
  }
}

// DELETE /api/carpool/:id/join — cancel the current user's signup.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const participation = await tx.tripParticipant.findUnique({
        where: { tripId_userId: { tripId: params.id, userId: user.id } },
        include: { trip: { select: { departTime: true, status: true } } },
      });
      if (!participation) return null;

      await tx.tripParticipant.delete({ where: { id: participation.id } });
      const shouldRecruit =
        participation.trip.departTime > new Date() &&
        participation.trip.status === "full";
      return tx.carpoolOrder.update({
        where: { id: params.id },
        data: {
          remainingSeats: { increment: participation.partySize },
          ...(shouldRecruit ? { status: "recruiting" } : {}),
        },
      });
    });

    if (!result) {
      return NextResponse.json({ error: "not_joined" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, trip: result });
  } catch (error) {
    console.error(`DELETE /api/carpool/${params.id}/join failed:`, error);
    return NextResponse.json({ error: "cancel_failed" }, { status: 500 });
  }
}
