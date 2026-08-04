import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateVipAdvertisement } from "@/lib/promotion-validation";
import type { VipAdvertisementPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const advertisements = await prisma.vipAdvertisement.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(advertisements);
  } catch (error) {
    console.error("GET /api/promotions/vip failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const payload = (await request.json()) as VipAdvertisementPayload;
    const validationError = validateVipAdvertisement(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const advertisement = await prisma.vipAdvertisement.create({
      data: { title: payload.title.trim(), content: payload.content.trim() },
    });
    return NextResponse.json(advertisement, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions/vip failed:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
