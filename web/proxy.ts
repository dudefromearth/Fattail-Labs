/**
 * Next.js 16 request proxy (middleware.ts is deprecated).
 * Matcher is IKI Runner only — not a site-wide gate.
 *
 * First response for a non-admin GET /app/iki/runner must be a redirect
 * (Location: /app/iki/about). A client effect redirect still serves 200 + workspace.
 */

import { NextResponse, type NextRequest } from "next/server";
import {
  IKI_PUBLIC_DOOR,
  fetchLabsSessionRole,
  isIkiAdministratorRole,
} from "@/lib/ikiAdminGate";

export async function proxy(request: NextRequest) {
  const cookie = request.headers.get("cookie") ?? "";
  const role = await fetchLabsSessionRole(cookie);
  if (!isIkiAdministratorRole(role)) {
    return NextResponse.redirect(new URL(IKI_PUBLIC_DOOR, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/iki/runner", "/app/iki/runner/:path*"],
};
