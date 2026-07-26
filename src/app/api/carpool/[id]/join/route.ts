import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/carpool/:id/join — atomically claim one seat (login required).
// The conditional updateMany guarantees the seat count never goes negative
// even under concurrent join requests.
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.carpoolOrder.updateMany({
        where: {
          id: params.id,
          status: "recruiting",
          remainingSeats: { gt: 0 },
        },
        data: { remainingSeats: { decrement: 1 } },
      });

      if (claimed.count === 0) {
        return null;
      }

      const order = await tx.carpoolOrder.findUniqueOrThrow({
        where: { id: params.id },
      });

      if (order.remainingSeats <= 0 && order.status === "recruiting") {
        return tx.carpoolOrder.update({
          where: { id: params.id },
          data: { status: "full" },
        });
      }
      return order;
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Trip is full, finished or does not exist" },
        { status: 409 }
      );
    }
    return NextResponse.json(updated);
  } catch (error) {
    console.error(`POST /api/carpool/${params.id}/join failed:`, error);
    return NextResponse.json({ error: "Failed to join trip" }, { status: 500 });
  }
}
