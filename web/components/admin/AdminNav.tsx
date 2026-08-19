"use client";

// Admin header navigation. Flat links plus dropdown groups (e.g. "Users & Support").
// A group's trigger highlights when the current page lives inside it. Dropdowns close
// on outside-click, Escape, and route change.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Item = { href: string; label: string };
type Group = { label: string; items: Item[] };
type Entry = Item | Group;

const isGroup = (e: Entry): e is Group => "items" in e;

const NAV: Entry[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/board", label: "Board" },
  { href: "/admin/cast", label: "Cast" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/market-universe", label: "Market universe" },
  { href: "/admin/journal-prompts", label: "Journal prompts" },
  { href: "/admin/ai", label: "AI workbench" },
  { href: "/admin/agents", label: "Agent keys" },
  { href: "/admin/appearance", label: "Appearance" },
  { href: "/admin/gates", label: "Gates" },
  { href: "/admin/access", label: "Access" },
  {
    label: "Users & Support",
    items: [
      { href: "/admin/users", label: "Users" },
      { href: "/admin/flow", label: "Flow" },
      { href: "/admin/help", label: "Help" },
      { href: "/admin/community", label: "Community" },
      { href: "/admin/apply-slots", label: "Apply slots" },
      { href: "/admin/stats", label: "Stats" },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  // Overview (/admin) is a prefix of everything — match it exactly.
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active: boolean) =>
  active
    ? "font-semibold text-zinc-900 dark:text-white"
    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white";

export default function AdminNav() {
  const pathname = usePathname() || "";
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);

  // Close any open dropdown when the route changes (a link was followed). Resetting
  // during render — React's recommended pattern for deriving state from a changed prop.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpenGroup(null);
  }

  // Close on outside click + Escape.
  useEffect(() => {
    if (!openGroup) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenGroup(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openGroup]);

  return (
    <nav
      ref={rootRef}
      className="flex flex-wrap items-center gap-3 text-sm"
      data-testid="admin-nav"
    >
      {NAV.map((entry) => {
        if (!isGroup(entry)) {
          return (
            <Link key={entry.href} href={entry.href} className={linkClass(isActive(pathname, entry.href))}>
              {entry.label}
            </Link>
          );
        }

        const groupActive = entry.items.some((it) => isActive(pathname, it.href));
        const open = openGroup === entry.label;
        return (
          <div key={entry.label} className="relative">
            <button
              type="button"
              className={`inline-flex items-center gap-1 ${linkClass(groupActive)}`}
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpenGroup((g) => (g === entry.label ? null : entry.label))}
              data-testid={`admin-nav-group-${entry.label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "")}`}
            >
              {entry.label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                aria-hidden="true"
                className={`transition-transform ${open ? "rotate-180" : ""}`}
              >
                <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {open && (
              <div
                role="menu"
                className="absolute left-0 z-50 mt-2 min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
              >
                {entry.items.map((it) => {
                  const active = isActive(pathname, it.href);
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      role="menuitem"
                      onClick={() => setOpenGroup(null)}
                      className={`block px-3 py-1.5 text-sm ${
                        active
                          ? "bg-zinc-100 font-semibold text-zinc-900 dark:bg-zinc-800 dark:text-white"
                          : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
