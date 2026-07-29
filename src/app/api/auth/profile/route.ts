import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_AVATAR_DATA_URL_LENGTH = 1_500_000;
const AVATAR_DATA_URL = /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

// PATCH /api/auth/profile — update the current user's nickname/avatar.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const payload = (await request.json()) as {
      nickname?: string;
      avatarUrl?: string | null;
    };
    const nickname = payload.nickname?.trim() ?? "";
    if (!nickname || nickname.length > 40) {
      return NextResponse.json({ error: "invalid_nickname" }, { status: 400 });
    }
    if (
      payload.avatarUrl &&
      (payload.avatarUrl.length > MAX_AVATAR_DATA_URL_LENGTH ||
        (!AVATAR_DATA_URL.test(payload.avatarUrl) &&
          !/^https:\/\//i.test(payload.avatarUrl)))
    ) {
      return NextResponse.json({ error: "invalid_avatar" }, { status: 400 });
    }

    const user = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: session.id },
        data: { nickname, avatarUrl: payload.avatarUrl || null },
      select: { id: true, email: true, nickname: true, avatarUrl: true, wechatOpenId: true, isAdmin: true },
      });
      await tx.carpoolOrder.updateMany({
        where: { organizerId: session.id },
        data: { organizerName: nickname },
      });
      return updated;
    });
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      loginMethod: user.wechatOpenId ? "wechat" : "email",
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error("PATCH /api/auth/profile failed:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
