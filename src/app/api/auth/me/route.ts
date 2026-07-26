import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/auth/me — current session user, or null when logged out.
export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/auth/me failed:", error);
    return NextResponse.json({ user: null });
  }
}
