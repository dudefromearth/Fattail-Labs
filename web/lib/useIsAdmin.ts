"use client";

// One in-flight /api/auth/me per cache generation. AppChrome-lifetime
// consumers (Wiki agent dock) must refetch when the session changes —
// clearMeCache notifies subscribers. Failures are not cached.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type Me = {
  role?: string;
  identity_id?: number;
  iki_lab?: boolean;
  iki_lab_only?: boolean;
  memberships?: { slug: string; name?: string }[];
} | null;

let mePromise: Promise<Me> | null = null;
let meEpoch = 0;
const meListeners = new Set<() => void>();

export function fetchMe(): Promise<Me> {
  if (mePromise) return mePromise;
  mePromise = fetch("/api/auth/me", { credentials: "same-origin" })
    .then((r) => {
      if (!r.ok) {
        mePromise = null;
        return null;
      }
      return r.json() as Promise<Me>;
    })
    .catch(() => {
      mePromise = null;
      return null;
    });
  return mePromise;
}

/** Call after login/logout so the next fetch re-hits /api/auth/me. */
export function clearMeCache(): void {
  mePromise = null;
  meEpoch += 1;
  meListeners.forEach((fn) => fn());
}

export function useIsAdmin(): boolean {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [epoch, setEpoch] = useState(meEpoch);

  useEffect(() => {
    const onChange = () => setEpoch(meEpoch);
    meListeners.add(onChange);
    return () => {
      meListeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMe().then((me) => {
      if (!cancelled) setIsAdmin(me?.role === "administrator");
    });
    return () => {
      cancelled = true;
    };
  }, [epoch, pathname]);

  return isAdmin;
}
