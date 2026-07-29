import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/carpool/joined — current user's tracked trip signups.
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const joined = await prisma.tripParticipant.findMany({
      where: { userId: user.id },
      include: {
        trip: {
          include: {
            organizer: { select: { nickname: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(joined);
  } catch (error) {
    console.error("GET /api/carpool/joined failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}
