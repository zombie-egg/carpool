import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateMerchantPromotion } from "@/lib/promotion-validation";
import type { MerchantPromotionPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const merchants = await prisma.merchantPromotion.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(merchants);
  } catch (error) {
    console.error("GET /api/promotions/merchants failed:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (!user.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    const payload = (await request.json()) as MerchantPromotionPayload;
    const validationError = validateMerchantPromotion(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const posters = payload.posters.slice(0, 3);
    const merchant = await prisma.merchantPromotion.create({
      data: {
        merchantName: payload.merchantName.trim(),
        content: payload.content.trim(),
        poster1: posters[0] || null,
        poster2: posters[1] || null,
        poster3: posters[2] || null,
      },
    });
    return NextResponse.json(merchant, { status: 201 });
  } catch (error) {
    console.error("POST /api/promotions/merchants failed:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
