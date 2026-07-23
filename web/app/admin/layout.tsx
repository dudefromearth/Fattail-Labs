import Link from "next/link";
import type { ReactNode } from "react";
import AdminNotifications from "@/components/admin/AdminNotifications";

export const metadata = {
  robots: { index: false, follow: false },
};

const NAV: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/board", label: "Board" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/ai", label: "AI workbench" },
  { href: "/admin/agents", label: "Agent keys" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50 dark:bg-zinc-950" data-testid="admin-shell">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
          <Link
            href="/admin"
            className="text-sm font-semibold tracking-tight"
            data-testid="admin-brand"
          >
            FatTail Labs · Admin
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm" data-testid="admin-nav">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <AdminNotifications />
            <Link
              href="/courses"
              className="text-zinc-500 underline-offset-2 hover:underline"
              data-testid="admin-view-site"
            >
              View site
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[100vw] flex-1">{children}</div>
      <footer className="border-t border-zinc-200 px-4 py-3 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Operator control plane — in-place editing stays on production pages. Noindex.
      </footer>
    </div>
  );
}
