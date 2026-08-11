"use client";

// Idle session timeout — all signed-in roles except administrator.
// Default 30 min; member preference 15–60 via Profile /api/me/profile.
// On timeout: clear cookie via logout redirect → /login.
//
// Crash / freeze hardening:
// - Wall-clock check when the timer fires (frozen tabs can delay setTimeout)
// - last activity persisted so a hard reload after browser crash does not
//   immediately treat the session as idle
// - Market Bus / live marks touch session activity (watching counts as use)

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearMeCache, fetchMe } from "@/lib/useIsAdmin";
import { clearLabDeskPlace } from "@/lib/strategyLabPlace";
import {
  clearSessionActivity,
  getLastSessionActivityMs,
  subscribeSessionActivity,
  touchSessionActivity,
} from "@/lib/sessionActivity";

const DEFAULT_MINUTES = 30;
const MIN_MINUTES = 15;
const MAX_MINUTES = 60;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
  "wheel",
];

function clampMinutes(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_MINUTES;
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(n)));
}

export default function IdleSessionGuard() {
  const pathname = usePathname() || "";
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutesRef = useRef(DEFAULT_MINUTES);
  const enabledRef = useRef(false);
  const loggingOutRef = useRef(false);
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    // Public/auth pages: no idle guard
    if (
      pathname === "/login" ||
      pathname === "/signup" ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password")
    ) {
      enabledRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    let cancelled = false;

    function clearTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }

    function markActivity() {
      const now = Date.now();
      lastActivityRef.current = now;
      touchSessionActivity("ui");
    }

    function schedule() {
      clearTimer();
      if (!enabledRef.current || loggingOutRef.current) return;
      const limitMs = minutesRef.current * 60 * 1000;
      const last = Math.max(
        lastActivityRef.current,
        getLastSessionActivityMs(),
      );
      lastActivityRef.current = last;
      const elapsed = Date.now() - last;
      const remaining = Math.max(1_000, limitMs - elapsed);
      timerRef.current = setTimeout(() => {
        // Wall-clock re-check: after tab freeze/crash recovery, setTimeout may
        // fire late; do not log out if activity (incl. market tape) was recent.
        const lastNow = Math.max(
          lastActivityRef.current,
          getLastSessionActivityMs(),
        );
        const idleFor = Date.now() - lastNow;
        if (idleFor < minutesRef.current * 60 * 1000) {
          lastActivityRef.current = lastNow;
          schedule();
          return;
        }
        void logoutForIdle();
      }, remaining);
    }

    async function logoutForIdle() {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      enabledRef.current = false;
      clearTimer();
      try {
        await fetch("/api/auth/logout", {
          credentials: "same-origin",
          redirect: "manual",
        }).catch(() => {});
      } finally {
        clearMeCache();
        clearLabDeskPlace();
        clearSessionActivity();
        window.location.href = "/login?idle=1";
      }
    }

    function onActivity() {
      if (!enabledRef.current || loggingOutRef.current) return;
      markActivity();
      schedule();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") onActivity();
    }

    Promise.all([
      fetchMe(),
      fetch("/api/me/profile", { credentials: "same-origin" }).then((r) =>
        r.ok ? r.json() : null,
      ),
    ])
      .then(([me, profile]) => {
        if (cancelled) return;
        if (!me || me.role === "administrator") {
          enabledRef.current = false;
          clearTimer();
          return;
        }
        if (me.identity_id === 0) {
          enabledRef.current = false;
          clearTimer();
          return;
        }
        const fromProfile =
          profile && typeof profile.session_idle_minutes === "number"
            ? profile.session_idle_minutes
            : (me as { session_idle_minutes?: number }).session_idle_minutes;
        minutesRef.current = clampMinutes(
          typeof fromProfile === "number" ? fromProfile : DEFAULT_MINUTES,
        );
        // Warm last activity from storage (post-crash restore)
        const stored = getLastSessionActivityMs();
        if (stored > 0) lastActivityRef.current = stored;
        else markActivity();
        enabledRef.current = true;
        schedule();
      })
      .catch(() => {
        if (!cancelled) enabledRef.current = false;
      });

    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibility);
    const unsubMarket = subscribeSessionActivity(() => {
      if (!enabledRef.current || loggingOutRef.current) return;
      lastActivityRef.current = getLastSessionActivityMs();
      schedule();
    });

    return () => {
      cancelled = true;
      clearTimer();
      unsubMarket();
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, router]);

  return null;
}
