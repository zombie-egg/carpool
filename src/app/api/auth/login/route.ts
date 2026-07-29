import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/login — email + password login, sets the session cookie.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const normalized = email?.trim().toLowerCase() ?? "";

    const user = normalized
      ? await prisma.user.findUnique({ where: { email: normalized } })
      : null;
    if (
      !user ||
      !password ||
      !user.passwordHash ||
      !verifyPassword(password, user.passwordHash)
    ) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    setSessionCookie(user.id);
    return NextResponse.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
    });
  } catch (error) {
    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json({ error: "login_failed" }, { status: 500 });
  }
}
