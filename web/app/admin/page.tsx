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
    body: "Kanban of work-product cards — cast, HeyGen produce, Quebec tick, packages, approve → place.",
    testId: "admin-card-board",
  },
  {
    href: "/admin/cast",
    title: "Studio cast",
    body: "HeyGen presenters (AVATAR registry). Assign cast_id on board cards before produce.",
    testId: "admin-card-cast",
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
    href: "/admin/journal-prompts",
    title: "Journal prompts",
    body: "Versioned agent system prompts for Journal Session. New sessions stamp the active version.",
    testId: "admin-card-journal-prompts",
  },
  {
    href: "/admin/tags",
    title: "Tag Manager",
    body: "System-wide process vocabulary — create, merge, retire. Members only assign.",
    testId: "admin-card-tags",
  },
  {
    href: "/admin/market-universe",
    title: "Market universe",
    body: "Shared underliers for live marks — Practice Positions and Strategy Lab. Massive-validated CRUD.",
    testId: "admin-card-market-universe",
  },
  {
    href: "/admin/appearance",
    title: "Appearance & chrome",
    body: "Brand tint, density, announcements — publish major interface elements without deploys (HIG v1.0).",
    testId: "admin-card-appearance",
  },
  {
    href: "/admin/gates",
    title: "Feature gates",
    body: "Edit the home landing: markdown body, intro video, countdown, waitlist, CTAs. Hide any surface until ready.",
    testId: "admin-card-gates",
  },
  {
    href: "/admin/access",
    title: "Access Control",
    body: "Gate lessons, apps, and surfaces by role/plan/time for campaigns — no deploy. Expand-at-evaluate; audit trail.",
    testId: "admin-card-access",
  },
  {
    href: "/admin/community",
    title: "Community · Discord map",
    body: "Map Labs Community channels to FatTail AI Discord channel IDs. Member connect stays on fattail.ai.",
    testId: "admin-card-community",
  },
  {
    href: "/course",
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
          plane for the production board, cast, media, agents, and AI.
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
