"use client";

// Capsule-style app switcher for the Links/QR family (Links/QR,
// Affiliates, Partners) — sits at the top of every page across these
// three admin apps. In-app hierarchy (a specific link, a breakdown
// dimension) is shown by each page's own breadcrumb underneath this,
// not folded into the capsule.

import Link from "next/link";

export type LinksFamilyApp = "links" | "affiliates" | "partners";

const APPS: { id: LinksFamilyApp; href: string; label: string }[] = [
  { id: "links", href: "/admin/links", label: "Links / QR" },
  { id: "affiliates", href: "/admin/affiliates", label: "Affiliates" },
  { id: "partners", href: "/admin/partners", label: "Partners" },
];

export default function AppCapsuleNav({ active }: { active: LinksFamilyApp }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Link
        href="/admin"
        className="text-[length:var(--text-footnote)] text-[var(--color-label-secondary)] hover:underline"
      >
        ← Admin
      </Link>
      <nav
        aria-label="Links/QR family"
        className="flex rounded-[var(--radius-full)] bg-[var(--color-fill)] p-0.5"
      >
        {APPS.map((app) => {
          const on = app.id === active;
          return (
            <Link
              key={app.id}
              href={app.href}
              aria-current={on ? "page" : undefined}
              className={
                "min-h-[var(--hit-min)] rounded-[var(--radius-full)] px-3 py-1.5 text-[length:var(--text-footnote)] font-medium transition " +
                (on
                  ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                  : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]")
              }
            >
              {app.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
