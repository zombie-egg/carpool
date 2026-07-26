import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterPayload {
  email?: string;
  code?: string;
  nickname?: string;
  password?: string;
}

// POST /api/auth/register — verify the emailed code and create the account.
export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RegisterPayload;
    const email = payload.email?.trim().toLowerCase() ?? "";
    const code = payload.code?.trim() ?? "";
    const nickname = payload.nickname?.trim() ?? "";
    const password = payload.password ?? "";

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    if (!nickname) {
      return NextResponse.json({ error: "nickname_required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "password_too_short" },
        { status: 400 }
      );
    }

    const validCode = await prisma.emailCode.findFirst({
      where: { email, code, expiresAt: { gt: new Date() } },
    });
    if (!validCode) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { email, nickname, passwordHash: hashPassword(password) },
    });
    await prisma.emailCode.deleteMany({ where: { email } });

    setSessionCookie(user.id);
    return NextResponse.json(
      { id: user.id, email: user.email, nickname: user.nickname },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json({ error: "register_failed" }, { status: 500 });
  }
}
