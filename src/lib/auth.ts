import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "lian_session";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
}

// Password hashing with Node's built-in scrypt: "saltHex$hashHex".
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

// Signed session token: base64url(payload).hmacSha256(payload).
interface SessionPayload {
  sub: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    } satisfies SessionPayload)
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function parseSessionToken(token: string): string | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof parsed.sub !== "string") return null;
    if (typeof parsed.exp !== "number" || parsed.exp < Date.now() / 1000) {
      return null;
    }
    return parsed.sub;
  } catch {
    return null;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

// Only the configured admin account may manage drivers.
export function isAdminEmail(email: string): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(admin) && email.trim().toLowerCase() === admin;
}

// Reads the session cookie and loads the current user (null when logged out).
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = parseSessionToken(token);
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nickname: true },
  });
  if (!user) return null;
  return { ...user, isAdmin: isAdminEmail(user.email) };
}

export function setSessionCookie(userId: string): void {
  cookies().set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export function clearSessionCookie(): void {
  cookies().set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
}
