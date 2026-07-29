"use client";

// Idle session timeout — all signed-in roles except administrator.
// Default 30 min; member preference 15–60 via Profile /api/me/profile.
// On timeout: clear cookie via logout redirect → /login.

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearMeCache, fetchMe } from "@/lib/useIsAdmin";

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

    function schedule() {
      clearTimer();
      if (!enabledRef.current || loggingOutRef.current) return;
      const ms = minutesRef.current * 60 * 1000;
      timerRef.current = setTimeout(() => {
        void logoutForIdle();
      }, ms);
    }

    async function logoutForIdle() {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      enabledRef.current = false;
      clearTimer();
      try {
        // Hit logout to clear session cookie, then land on login
        await fetch("/api/auth/logout", {
          credentials: "same-origin",
          redirect: "manual",
        }).catch(() => {});
      } finally {
        clearMeCache();
        // Force login with reason for optional UI copy
        window.location.href = "/login?idle=1";
      }
    }

    function onActivity() {
      if (!enabledRef.current || loggingOutRef.current) return;
      schedule();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") onActivity();
    }

    Promise.all([
      fetchMe(),
      fetch("/api/me/profile", { credentials: "same-origin" }).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([me, profile]) => {
        if (cancelled) return;
        if (!me || me.role === "administrator") {
          enabledRef.current = false;
          clearTimer();
          return;
        }
        // identity_id 0 internal admin also exempt if role not set that way
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
          typeof fromProfile === "number" ? fromProfile : DEFAULT_MINUTES
        );
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

    return () => {
      cancelled = true;
      clearTimer();
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, onActivity);
      }
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, router]);

  return null;
}
