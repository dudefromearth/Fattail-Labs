/** IKI Lab plan flags from /api/auth/me (DL-604). */

import type { Me } from "@/lib/useIsAdmin";

export type IkiAccess = {
  isAdmin: boolean;
  hasIkiLab: boolean;
  ikiLabOnly: boolean;
};

export function ikiAccessFromMe(me: Me): IkiAccess {
  const isAdmin = me?.role === "administrator";
  const hasIkiLab = isAdmin || !!me?.iki_lab;
  const ikiLabOnly = !isAdmin && !!me?.iki_lab_only;
  return { isAdmin, hasIkiLab, ikiLabOnly };
}

export const IKI_ONLY_PATHS = [
  "/app/iki/about",
  "/app/iki/catalog",
  "/app/iki/your-lab",
  "/app/iki/analyzer",
  "/me",
  "/settings",
  "/membership",
  "/login",
] as const;

export function ikiOnlyPathAllowed(pathname: string): boolean {
  return IKI_ONLY_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}
