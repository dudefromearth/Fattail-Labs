import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { sessionCookieHeader } from "@/lib/api";
import {
  IKI_PUBLIC_DOOR,
  fetchLabsSessionRole,
  isIkiAdministratorRole,
} from "@/lib/ikiAdminGate";

/**
 * Authoritative render gate (Next.js 16: proxy is not the only line).
 * Same SoR as proxy: /api/auth/me role === administrator.
 * Non-admin never reaches the client workspace.
 */
export const dynamic = "force-dynamic";

export default async function IkiRunnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  let cookie = "";
  try {
    cookie = await sessionCookieHeader();
  } catch {
    cookie = "";
  }
  const role = await fetchLabsSessionRole(cookie);
  if (!isIkiAdministratorRole(role)) {
    redirect(IKI_PUBLIC_DOOR);
  }
  return children;
}
