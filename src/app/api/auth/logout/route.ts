import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

// POST /api/auth/logout — clear the session cookie.
export async function POST() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
