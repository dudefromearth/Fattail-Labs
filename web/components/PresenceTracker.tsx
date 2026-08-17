"use client";

// Member presence heartbeat. While a signed-in member has the site open and the
// tab is visible, pings POST /api/presence every 60s so the admin Users page can
// show an accurate "online now" status. Stops itself for anonymous visitors (the
// first ping returns authed:false) and pauses while the tab is hidden. Silent on
// failure — presence must never affect the member experience.

import { useEffect } from "react";

const HEARTBEAT_MS = 60_000;

export default function PresenceTracker() {
  useEffect(() => {
    let stopped = false; // set once we learn the visitor is anonymous — ping() no-ops

    const ping = async () => {
      if (stopped) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return; // don't count a backgrounded tab as "online"
      }
      try {
        const r = await fetch("/api/presence", {
          method: "POST",
          credentials: "same-origin",
          keepalive: true,
        });
        if (r.ok) {
          const body = (await r.json().catch(() => null)) as { authed?: boolean } | null;
          if (body && body.authed === false) stopped = true; // anonymous — stop recording
        }
      } catch {
        /* ignore */
      }
    };

    void ping(); // immediate, so a just-arrived member shows online at once
    const timer = window.setInterval(() => void ping(), HEARTBEAT_MS);

    // Ping right away when the member returns to the tab (don't wait a full cycle).
    const onVisible = () => {
      if (!stopped && document.visibilityState === "visible") void ping();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
