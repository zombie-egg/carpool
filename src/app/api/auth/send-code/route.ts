import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationCode } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_TTL_MS = 10 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;

// POST /api/auth/send-code — email a 6-digit registration code.
export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const normalized = email?.trim().toLowerCase() ?? "";
    if (!EMAIL_REGEX.test(normalized)) {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email: normalized },
    });
    if (existing) {
      return NextResponse.json({ error: "email_exists" }, { status: 409 });
    }

    const recent = await prisma.emailCode.findFirst({
      where: {
        email: normalized,
        createdAt: { gt: new Date(Date.now() - RESEND_INTERVAL_MS) },
      },
    });
    if (recent) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const code = String(randomInt(100000, 1000000));
    await prisma.emailCode.deleteMany({ where: { email: normalized } });
    await prisma.emailCode.create({
      data: {
        email: normalized,
        code,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    await sendVerificationCode(normalized, code);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/send-code failed:", error);
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
