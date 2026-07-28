"use client";

// Fires a best-effort page-view beacon on every client navigation. The backend
// records it only for authenticated members (POST /api/pageview; anonymous
// visitors and /admin routes are ignored server-side). Failures are silent —
// analytics must never affect the member experience.
// Spec: FatTail-Labs-User-Activity-Analytics-Spec-v1.0.

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageViewTracker() {
  const pathname = usePathname() || "";

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
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
  }, [pathname]);

  return null;
}
