"use client";

// Global header: brand + auth state on every page. Static pages render the
// logged-out shell; the session check upgrades it client-side after hydration.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Me = {
  identity_id: number;
  role: string;
  email: string;
  display_name: string;
};

type EnrollmentSummary = {
  course: { slug: string; title: string };
  completed_at: string | null;
  progress: { percent: number; done: number; total: number };
  resume: { lesson_slug: string; title: string } | null;
};

const ROLE_LABELS: Record<string, string> = {
  observer: "Free account",
  activator: "Member",
  navigator: "Coaching member",
  administrator: "Admin",
};

function initials(me: Me): string {
  const source = me.display_name || me.email;
  const parts = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export default function SiteHeader() {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [learning, setLearning] = useState<EnrollmentSummary[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Lazy-load the My Learning summary when the menu opens.
  useEffect(() => {
    if (!menuOpen || learning !== null) return;
    fetch("/api/me/enrollments", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLearning(d?.enrollments ?? []))
      .catch(() => setLearning([]));
  }, [menuOpen, learning]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setMe(data);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/courses" className="font-semibold tracking-tight">
          FatTail <span className="text-emerald-500">Labs</span>
        </Link>
        <nav className="hidden gap-5 text-sm text-zinc-600 dark:text-zinc-400 sm:flex">
          <Link href="/courses" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Courses
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {/* Logged out: login/signup buttons. Logged in: both replaced by the avatar. */}
          {checked && me === null && (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
              >
                Sign Up
              </Link>
            </>
          )}

          {me && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={`Account menu — ${ROLE_LABELS[me.role] ?? me.role}`}
                className="flex items-center gap-2"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white ${
                    me.role === "observer" ? "bg-zinc-400" : "bg-emerald-500"
                  }`}
                >
                  {initials(me)}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                    <p className="truncate text-sm font-medium">
                      {me.display_name || me.email}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {ROLE_LABELS[me.role] ?? me.role}
                    </p>
                  </div>
                  {learning !== null &&
                    learning.filter((e) => !e.completed_at && e.resume).length > 0 && (
                      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                          Continue learning
                        </p>
                        <ul className="mt-2 space-y-2">
                          {learning
                            .filter((e) => !e.completed_at && e.resume)
                            .slice(0, 3)
                            .map((e) => (
                              <li key={e.course.slug}>
                                <Link
                                  href={`/courses/${e.course.slug}/lessons/${e.resume!.lesson_slug}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="block rounded-lg p-1.5 -mx-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                                >
                                  <span className="block truncate text-sm font-medium">
                                    {e.course.title}
                                  </span>
                                  <span className="mt-1 flex items-center gap-2">
                                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                      <span
                                        className="block h-full rounded-full bg-emerald-500"
                                        style={{ width: `${e.progress.percent}%` }}
                                      />
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                      {e.progress.percent}%
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  <nav className="py-1 text-sm">
                    <Link
                      href="/me"
                      className="block px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() => setMenuOpen(false)}
                    >
                      My Learning
                    </Link>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                      onClick={() => setMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {me.role === "observer" && (
                      <Link
                        href="/signup"
                        className="block px-4 py-2 font-medium text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        onClick={() => setMenuOpen(false)}
                      >
                        Become a member
                      </Link>
                    )}
                    <a
                      href="/api/auth/logout"
                      className="block px-4 py-2 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      Sign out
                    </a>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
