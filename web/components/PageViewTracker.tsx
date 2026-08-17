"use client";

// Fires best-effort beacons on every client navigation:
//   /api/pageview — member engagement (recorded server-side only for authed members).
//   /api/landing  — site traffic for the admin Stats page: recorded for EVERYONE
//                   (anonymous included), with a first-party visitor id, a session
//                   "landing" flag, the referrer, and any UTM params on the entry URL.
// Both are silent on failure — analytics must never affect the visitor experience.
// Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0 (+ traffic/Stats).

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VID_KEY = "ft_vid";
const SESSION_KEY = "ft_sess";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

function getVisitorId(): string | null {
  try {
    let id = window.localStorage.getItem(VID_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      id = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 32);
      window.localStorage.setItem(VID_KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked (private mode) — visitor stays uncounted, no error
  }
}

// True once per browsing session (first page after a fresh tab/session start).
function takeLandingFlag(): boolean {
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return false;
    window.sessionStorage.setItem(SESSION_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

function readUtm(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const q = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = q.get(k);
      if (v) out[k] = v.slice(0, 128);
    }
  } catch {
    /* ignore */
  }
  return out;
}

export default function PageViewTracker() {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    // Member engagement beacon (unchanged; server records authed members only).
    try {
      fetch("/api/pageview", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    // Site-traffic beacon (everyone, incl. anonymous).
    try {
      fetch("/api/landing", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          is_landing: takeLandingFlag(),
          visitor_id: getVisitorId(),
          referrer: typeof document !== "undefined" ? document.referrer || null : null,
          utm: readUtm(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [pathname]);

  return null;
}
