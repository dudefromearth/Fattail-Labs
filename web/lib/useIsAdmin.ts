"use client";

// One admin check per page load (refactor step 3/4). Previously seven
// components each fired their own /api/auth/me effect; the module-level
// promise cache collapses them into a single request.

import { useEffect, useState } from "react";

type Me = { role?: string; identity_id?: number } | null;

let mePromise: Promise<Me> | null = null;

export function fetchMe(): Promise<Me> {
  mePromise ??= fetch("/api/auth/me", { credentials: "same-origin" })
    .then((r) => (r.ok ? (r.json() as Promise<Me>) : null))
    .catch(() => null);
  return mePromise;
}

export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled && me?.role === "administrator") setIsAdmin(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return isAdmin;
}
