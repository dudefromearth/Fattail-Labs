import type { Metadata } from "next";
import Link from "next/link";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import { PRACTICE_NESTED_SLUGS as NESTED_UNDER_PRACTICE } from "@/lib/practiceSuite";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

export const revalidate = 3600;

const FALLBACK: SitePage = {
  slug: "labs",
  title: "Apps",
  description_md:
    "Member practice tools: Journey, Practice Log, Strategy Lab, and more — process over P&L theater.",
  intro_video_id: null,
  intro_video_title: null,
  faq_title: "Apps FAQ",
  faq_description_md: null,
  faq_items: [],
};

type AppRow = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  status: string;
  href: string;
};

/**
 * Top-level Apps grid (2-col). Practice suite tools are nested under Practice
 * (Trade Log · Reports · Journal · Playbook) — not listed individually here.
 */
const TOP_LEVEL_ORDER = [
  "journey",
  "practice-log",
  "toughness",
  "strategy-lab",
  "community",
  "wiki",
] as const;

const FALLBACK_APPS: AppRow[] = [
  {
    id: 0,
    slug: "journey",
    title: "Journey",
    blurb:
      "Your enrollments and lesson progress in one place — process over pace, no leaderboards.",
    status: "live",
    href: "/app/journey",
  },
  {
    id: 0,
    slug: "practice-log",
    title: "Practice",
    blurb:
      "Reports home (equity & drawdown), Trade Log, Journal, and Playbook — process first.",
    status: "live",
    href: "/app/practice",
  },
  {
    id: 0,
    slug: "toughness",
    title: "Toughness",
    blurb:
      "FatTail Hard and True 75 Hard — voluntary capacity training for mental toughness under load (aMCC / willpower).",
    status: "live",
    href: "/app/toughness",
  },
  {
    id: 0,
    slug: "strategy-lab",
    title: "Strategy Lab",
    blurb:
      "Design → Curate → Deploy. Strategies on your account. Validate edges before capital; process over profit claims.",
    status: "soon",
    href: "/app/strategy-lab",
  },
  {
    id: 0,
    slug: "community",
    title: "Community",
    blurb:
      "Process peers and FatTail bots — same conversation as Discord, plus shared designs. No P&L theater.",
    status: "live",
    href: "/app/community",
  },
  {
    id: 0,
    slug: "wiki",
    title: "Wiki",
    blurb:
      "The compiled map of everything we teach — courses, live sessions, and videos, cross-linked and searchable.",
    status: "soon",
    href: "/app/wiki",
  },
];

async function fetchApps(): Promise<AppRow[]> {
  try {
    const data = await apiGet<{ apps: AppRow[] }>("/api/apps");
    return data.apps?.length ? data.apps : FALLBACK_APPS;
  } catch {
    return FALLBACK_APPS;
  }
}

/**
 * Build the top-level catalog: drop nested trade-log/journal, inject Practice,
 * Toughness, Strategy Lab, Community cards — even when API has not seeded them yet.
 */
function buildTopLevelCatalog(apiApps: AppRow[]): AppRow[] {
  const bySlug = new Map(apiApps.map((a) => [a.slug, a]));

  const practice: AppRow = {
    id: 0,
    slug: "practice-log",
    title: "Practice",
    blurb:
      "Reports home (equity & drawdown), Trade Log, Journal, and Playbook — process first.",
    status: "live",
    href: "/app/practice",
  };

  const toughnessFromApi = bySlug.get("toughness");
  const toughness: AppRow = toughnessFromApi
    ? {
        ...toughnessFromApi,
        title: toughnessFromApi.title || "Toughness",
        href: toughnessFromApi.href || "/app/toughness",
        status: "live",
      }
    : (FALLBACK_APPS.find((a) => a.slug === "toughness") as AppRow);

  const strategyFromApi = bySlug.get("strategy-lab");
  const strategy: AppRow = strategyFromApi
    ? {
        ...strategyFromApi,
        title: "Strategy Lab",
        // Prefer three-step life-cycle blurb if API still has legacy stage lines.
        blurb:
          strategyFromApi.blurb &&
          !/Prove|Paper, Run|Build, Prove|Build, Test|Run bots/i.test(
            strategyFromApi.blurb,
          )
            ? strategyFromApi.blurb
            : (FALLBACK_APPS.find((a) => a.slug === "strategy-lab") as AppRow)
                .blurb,
        href: strategyFromApi.href || "/app/strategy-lab",
      }
    : (FALLBACK_APPS.find((a) => a.slug === "strategy-lab") as AppRow);

  const communityFromApi = bySlug.get("community");
  const community: AppRow = communityFromApi
    ? {
        ...communityFromApi,
        title: communityFromApi.title || "Community",
        blurb:
          communityFromApi.blurb ||
          (FALLBACK_APPS.find((a) => a.slug === "community") as AppRow).blurb,
        href: communityFromApi.href || "/app/community",
        status: "live",
      }
    : (FALLBACK_APPS.find((a) => a.slug === "community") as AppRow);

  const composed = new Map<string, AppRow>();
  for (const a of apiApps) {
    if (NESTED_UNDER_PRACTICE.has(a.slug)) continue;
    if (a.slug === "strategy-lab") continue; // use composed title below
    if (a.slug === "toughness") continue; // use composed row below
    if (a.slug === "community") continue; // use composed row below
    composed.set(a.slug, a);
  }
  composed.set("practice-log", practice);
  composed.set("toughness", toughness);
  composed.set("strategy-lab", strategy);
  composed.set("community", community);

  const ordered: AppRow[] = [];
  for (const slug of TOP_LEVEL_ORDER) {
    const row = composed.get(slug);
    if (row) {
      ordered.push(row);
      composed.delete(slug);
    }
  }
  // Any other apps (future) append in API order
  for (const a of apiApps) {
    if (composed.has(a.slug)) {
      ordered.push(composed.get(a.slug)!);
      composed.delete(a.slug);
    }
  }
  for (const row of composed.values()) ordered.push(row);

  return ordered;
}

function collectionJsonLd(page: SitePage) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.title} — FatTail Labs`,
    description: metaDescriptionFromMd(page.description_md, page.title),
    url: siteUrl("/app"),
    isPartOf: { "@type": "WebSite", name: "FatTail Labs", url: siteUrl("/") },
    about: {
      "@type": "Thing",
      name: "Member practice tools for options trading education",
    },
  };
}

function normalizeAppsPage(page: SitePage): SitePage {
  if (page.title === "Labs" || page.title === "labs") {
    return {
      ...page,
      title: "Apps",
      faq_title:
        page.faq_title === "Labs FAQ" ? "Apps FAQ" : page.faq_title,
    };
  }
  return page;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "soon") {
    return (
      <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Coming soon
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Live
      </span>
    );
  }
  return null;
}

function AppCard({ t }: { t: AppRow }) {
  // Wiki + Strategy Lab landing: open while workspace is still "soon".
  // Practice Log hub is live when Trade Log is.
  const canOpen =
    t.status === "live" ||
    t.slug === "wiki" ||
    t.slug === "practice-log" ||
    t.slug === "toughness" ||
    t.slug === "strategy-lab" ||
    t.slug === "community";
  const badgeStatus =
    t.slug === "practice-log" ||
    t.slug === "toughness" ||
    t.slug === "community"
      ? "live"
      : t.slug === "strategy-lab"
        ? "soon"
        : t.slug === "wiki"
          ? t.status
          : t.status;
  return (
    <div className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          {t.title}
        </h2>
        <StatusBadge status={badgeStatus} />
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
        {t.blurb}
      </p>
      {canOpen ? (
        <Link
          href={t.href || `/app/${t.slug}`}
          className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
        >
          Open →
        </Link>
      ) : (
        <p className="mt-4 text-xs text-[var(--color-label-tertiary)]">
          Ships with the practice stack — process-first, not P&L theater.
        </p>
      )}
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const page = normalizeAppsPage(
    await fetchSitePage("labs").catch(() => FALLBACK),
  );
  const description = metaDescriptionFromMd(
    page.description_md,
    "Member tools: Journey, Practice suite, Strategy Lab, Wiki, and more.",
  );
  return {
    title: page.title,
    description,
    alternates: { canonical: siteUrl("/app") },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url: siteUrl("/app"),
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

export default async function AppsPage() {
  const [page, appsRaw] = await Promise.all([
    fetchSitePage("labs")
      .then(normalizeAppsPage)
      .catch(() => FALLBACK),
    fetchApps(),
  ]);
  const apps = buildTopLevelCatalog(appsRaw);
  const jsonLd = collectionJsonLd(page);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionHubShell page={page}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {apps.map((t) => (
            <li key={t.slug}>
              <AppCard t={t} />
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-[var(--color-label-secondary)]">
          Looking for courses?{" "}
          <Link
            href="/course"
            className="text-[var(--color-tint)] hover:underline"
          >
            Course library
          </Link>
          . Live sessions stay on{" "}
          <Link
            href="/live"
            className="text-[var(--color-tint)] hover:underline"
          >
            Live
          </Link>
          .
        </p>
      </SectionHubShell>
    </main>
  );
}
