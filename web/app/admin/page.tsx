import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin overview",
  robots: { index: false, follow: false },
};

const CARDS: { href: string; title: string; body: string; testId: string }[] = [
  {
    href: "/admin/board",
    title: "Production board",
    body: "Kanban of work-product cards — draft → queue → production → approval.",
    testId: "admin-card-board",
  },
  {
    href: "/admin/agents",
    title: "Agent keys",
    body: "Mint and revoke API keys so agents authenticate as themselves (Phase A).",
    testId: "admin-card-agents",
  },
  {
    href: "/admin/ai",
    title: "AI workbench",
    body: "Run studio agent tasks with Grok (primary). Human session or agent bearer.",
    testId: "admin-card-ai",
  },
  {
    href: "/admin/media",
    title: "Media library",
    body: "Upload banners and public images; copy URLs into in-place editors.",
    testId: "admin-card-media",
  },
  {
    href: "/courses",
    title: "In-place content editing",
    body: "Edit courses, hub, and live on production URLs — the learner page is the editor.",
    testId: "admin-card-inplace",
  },
];

export default function AdminPage() {
  return (
    <main className="space-y-8 p-8" data-testid="admin-overview">
      <header>
        <h1 className="text-2xl font-semibold">Operator cockpit</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Dedicated admin surface (no member header). Content editing stays{" "}
          <strong>in-place</strong> on production pages; this app is the control
          plane for media, agents, and AI.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            data-testid={c.testId}
            className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <h2 className="font-medium">{c.title}</h2>
            <p className="mt-2 text-sm text-zinc-500">{c.body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
