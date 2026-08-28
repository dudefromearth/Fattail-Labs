/**
 * IKI Runner URL gate — administrator-only, server-enforced.
 * Role SoR is GET /api/auth/me `role` (same as fetchMe() / useIsAdmin).
 * Redirect target is the existing public IKI door — do not invent a page.
 */

export const IKI_PUBLIC_DOOR = "/app/iki/about";

export function isIkiAdministratorRole(
  role: string | null | undefined,
): boolean {
  return role === "administrator";
}

/** Labs API /api/auth/me. Fail loud when API base is missing (config doctrine). */
export function labsAuthMeUrl(): string {
  const internal = process.env.LABS_API_INTERNAL_URL?.trim();
  const pub = process.env.NEXT_PUBLIC_LABS_API_URL?.trim();
  const base = (internal || pub || "").replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_LABS_API_URL is not set (optional: LABS_API_INTERNAL_URL)",
    );
  }
  return `${base}/api/auth/me`;
}

/**
 * Resolve the session role from Labs /api/auth/me.
 * Missing/invalid session or upstream failure → null (fail closed: not admin).
 */
export async function fetchLabsSessionRole(
  cookieHeader: string,
): Promise<string | null> {
  if (!cookieHeader) return null;
  try {
    const res = await fetch(labsAuthMeUrl(), {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    const me = (await res.json()) as { role?: string };
    return typeof me.role === "string" ? me.role : null;
  } catch {
    return null;
  }
}
