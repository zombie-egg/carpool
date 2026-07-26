import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Automatically routes / to /zh or /en and keeps the locale prefix in sync.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next.js internals and static files.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
