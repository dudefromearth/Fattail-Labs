"use client";

// Global header — one centered cluster: logo + nav + auth together,
// evenly spaced across the bar (Human Interface Spec / apple1.png density).

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Account menu: Continue Learning + Profile + Journey (My Learning / Dashboard retired).

type Me = {
  identity_id: number;
  role: string;
  /** Live membership elevation (Observer trial ≡ navigator). Prefer for gates. */
  access_role?: string;
  memberships?: { slug: string; name: string; grants_role?: string }[];
  email: string;
  display_name: string;
  avatar_url?: string | null;
};

type EnrollmentSummary = {
  course: { slug: string; title: string };
  completed_at: string | null;
  progress: { percent: number; done: number; total: number };
  resume: {
    module_slug: string;
    lesson_slug: string;
    title: string;
  } | null;
};

const ROLE_LABELS: Record<string, string> = {
  observer: "Free account",
  alumni: "Course alumni",
  activator: "Activator",
  navigator: "Navigator",
  administrator: "Admin",
};

/** Prefer membership product name when /me returns memberships. */
function membershipLabel(me: Me): string {
  const mems = me.memberships;
  if (mems?.length) {
    const order = [
      "coaching",
      "navigator",
      "observer-trial",
      "activator",
      "labs-membership",
    ];
    const ranked = [...mems].sort((a, b) => {
      const ia = order.indexOf(a.slug);
      const ib = order.indexOf(b.slug);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    const top = ranked[0];
    if (top?.slug === "observer-trial") return "Observer";
    if (top?.slug === "coaching") return "Coaching";
    if (top?.slug === "activator" || top?.slug === "labs-membership")
      return "Activator";
    if (top?.slug === "navigator") return "Navigator";
    if (top?.name) return top.name;
  }
  return ROLE_LABELS[gateRole(me)] ?? gateRole(me);
}

/** Prefer access_role (Observer membership ≡ navigator) for chrome + CTAs. */
function gateRole(me: Me): string {
  return me.access_role || me.role;
}

/** Primary chrome only — Pathway is a funnel surface, not a top tab. */
const NAV: { href: string; label: string }[] = [
  { href: "/course", label: "Courses" },
  { href: "/app", label: "Apps" },
  { href: "/resource", label: "Resources" },
  { href: "/live", label: "Live" },
  { href: "/about", label: "About" },
  { href: "/guide", label: "Guide" },
];

function initials(me: Me): string {
  const source = me.display_name || me.email;
  const parts = source.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function navActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() || "";
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [learning, setLearning] = useState<EnrollmentSummary[] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="site-header">
      {/*
        Sizes/gaps live in tokens.css + globals.css (.site-header-*).
        Cluster: logo + links + auth, centered, Apple-like density.
      */}
      <div className="site-header-bar">
        <nav className="site-header-cluster" aria-label="Primary">
          <Link
            href="/"
            className="site-header-logo-link"
            aria-label="FatTail Labs home"
          >
            <Image
              src="/brand/fattail-labs-logo.jpg"
              alt="FatTail Labs"
              width={96}
              height={96}
              className="site-header-logo"
              priority
            />
          </Link>

          {NAV.map((item) => {
            const active = navActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "site-header-link site-header-link-desktop",
                  active ? "site-header-link-active" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            className="site-header-menu-btn"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className="text-base leading-none" aria-hidden>
              {mobileOpen ? "✕" : "☰"}
            </span>
          </button>

          {checked && me === null && (
            <>
              <Link
                href="/login"
                className="site-header-link hidden sm:inline"
              >
                Log In
              </Link>
              <Link href="/signup" className="site-header-signup">
                Sign Up
              </Link>
            </>
          )}

          {me && (
            <div className="relative shrink-0" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={`Account menu — ${membershipLabel(me)}`}
                className="flex items-center gap-2 rounded-full outline-offset-2"
              >
                {me.avatar_url ? (
                  <Image
                    src={me.avatar_url}
                    alt=""
                    width={32}
                    height={32}
                    unoptimized
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-[var(--color-separator)]"
                  />
                ) : (
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white",
                      gateRole(me) === "observer" || gateRole(me) === "alumni"
                        ? "bg-[var(--color-label-tertiary)]"
                        : "bg-[var(--color-tint)]",
                    ].join(" ")}
                  >
                    {initials(me)}
                  </span>
                )}
              </button>
              {menuOpen && (
                <div className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]">
                  <div className="border-b border-[var(--color-separator)] px-4 py-3">
                    <p className="truncate text-sm font-medium">
                      {me.display_name || me.email}
                    </p>
                    <p className="text-xs text-[var(--color-label-secondary)]">
                      {membershipLabel(me)}
                    </p>
                  </div>
                  {learning !== null &&
                    learning.filter((e) => !e.completed_at && e.resume).length >
                      0 && (
                      <div className="border-b border-[var(--color-separator)] px-4 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                          Continue learning
                        </p>
                        <ul className="mt-2 space-y-2">
                          {learning
                            .filter((e) => !e.completed_at && e.resume)
                            .slice(0, 3)
                            .map((e) => (
                              <li key={e.course.slug}>
                                <Link
                                  href={`/course/${e.course.slug}/${e.resume!.module_slug}/${e.resume!.lesson_slug}`}
                                  onClick={() => setMenuOpen(false)}
                                  className="block rounded-[var(--radius-md)] p-1.5 -mx-1.5 hover:bg-[var(--color-fill)]"
                                >
                                  <span className="block truncate text-sm font-medium">
                                    {e.course.title}
                                  </span>
                                  <span className="mt-1 flex items-center gap-2">
                                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-fill)]">
                                      <span
                                        className="block h-full rounded-full bg-[var(--color-tint)]"
                                        style={{
                                          width: `${e.progress.percent}%`,
                                        }}
                                      />
                                    </span>
                                    <span className="text-[10px] text-[var(--color-label-secondary)]">
                                      {e.progress.percent}%
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  <div className="py-1 text-sm">
                    <Link
                      href="/home"
                      className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      href="/me"
                      className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/app/journey"
                      className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Journey
                    </Link>
                    <Link
                      href="/app/toughness"
                      className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Toughness
                    </Link>
                    <Link
                      href="/app/practice"
                      className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                      onClick={() => setMenuOpen(false)}
                    >
                      Practice
                    </Link>
                    {gateRole(me) === "observer" && (
                      <Link
                        href="/membership"
                        className="block px-4 py-2 font-medium text-[var(--color-tint)] hover:bg-[var(--color-fill)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        Become a member
                      </Link>
                    )}
                    {me.role === "administrator" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 hover:bg-[var(--color-fill)]"
                        onClick={() => setMenuOpen(false)}
                      >
                        Admin
                      </Link>
                    )}
                    <a
                      href="/api/auth/logout"
                      className="block px-4 py-2 text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
                      onClick={() => {
                        setMenuOpen(false);
                        setMe(null);
                      }}
                    >
                      Sign out
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Mobile: remaining destinations in a single list under the bar */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-separator)] bg-[var(--color-surface)] md:hidden">
          <div className="mx-auto flex max-w-[72rem] flex-col px-4 py-2">
            {NAV.map((item) => {
              const active = navActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-[var(--radius-md)] px-3 py-2.5 text-[15px]",
                    active
                      ? "bg-[var(--color-fill)] font-medium text-[var(--color-label)]"
                      : "text-[var(--color-label-secondary)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
            {checked && me === null && (
              <Link
                href="/login"
                className="rounded-[var(--radius-md)] px-3 py-2.5 text-[15px] text-[var(--color-label-secondary)] sm:hidden"
              >
                Log In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
