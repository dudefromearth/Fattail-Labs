// Single API access point. Base URL comes from env — never hardcoded in components.
//
// Server components (SSR/RSC) should prefer LABS_API_INTERNAL_URL when the public
// URL is not reachable from the Next process (common on MiniTwo / container hosts).
// Browser code still uses NEXT_PUBLIC_LABS_API_URL (or same-origin /api rewrites).

function resolveApiBase(): string {
  const internal = process.env.LABS_API_INTERNAL_URL?.trim();
  const pub = process.env.NEXT_PUBLIC_LABS_API_URL?.trim();
  // Prefer internal only on the server (Node). Browser has no LABS_API_INTERNAL_URL.
  if (typeof window === "undefined" && internal) return internal.replace(/\/$/, "");
  if (pub) return pub.replace(/\/$/, "");
  throw new Error(
    "NEXT_PUBLIC_LABS_API_URL is not set" +
      (typeof window === "undefined"
        ? " (optional: LABS_API_INTERNAL_URL for server-side fetches)"
        : ""),
  );
}

export function apiUrl(path: string): string {
  const base = resolveApiBase();
  if (!path.startsWith("/")) {
    throw new Error(`apiUrl path must start with / (got ${JSON.stringify(path)})`);
  }
  return `${base}${path}`;
}

export async function apiGet<T>(
  path: string,
  init?: { cache?: RequestCache },
): Promise<T> {
  const res = await fetch(apiUrl(path), init);
  if (!res.ok) {
    throw new Error(`API ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

/** Serialize request cookies for server→API session forwarding (raw values). */
export async function sessionCookieHeader(): Promise<string> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  // Do not encodeURIComponent values — JWTs must be forwarded as stored.
  return store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}
