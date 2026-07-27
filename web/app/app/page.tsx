import type { Metadata } from "next";
import Link from "next/link";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

export const revalidate = 3600;

const FALLBACK: SitePage = {
  slug: "labs", // site_pages key (stable); public UI/URL is Apps /app
  title: "Apps",
  description_md:
    "Member practice tools: Journey, Trade Log, and more — process over P&L theater.",
  intro_video_id: null,
  intro_video_title: null,
  faq_title: "Apps FAQ",
  faq_description_md: null,
  faq_items: [],
};

/** Fallback if API/apps table unavailable — same seed as migration 033. */
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
    slug: "trade-log",
    title: "Trade Log",
    blurb:
      "Record fills and structure outcomes — process first, not P&L theater.",
    status: "live",
    href: "/app/trade-log",
  },
  {
    id: 0,
    slug: "journal",
    title: "Journal",
    blurb:
      "Daily notes tied to the routine: preparation, selection, and review.",
    status: "soon",
    href: "/app/journal",
  },
  {
    id: 0,
    slug: "playbook",
    title: "Playbook",
    blurb:
      "Your defined-risk setups and rules — the book you actually trade from.",
    status: "soon",
    href: "/app/playbook",
  },
  {
    id: 0,
    slug: "statistics",
    title: "Statistics",
    blurb:
      "Adherence and process metrics — streaks and discipline, never profit claims.",
    status: "soon",
    href: "/app/statistics",
  },
  {
    id: 0,
    slug: "vexy",
    title: "Vexy",
    blurb:
      "Cognitive partner for structure and doctrine — when the practice stack is wired.",
    status: "soon",
    href: "/app/vexy",
  },
];

type AppRow = {
  id: number;
  slug: string;
  title: string;
  blurb: string;
  status: string;
  href: string;
};

async function fetchApps(): Promise<AppRow[]> {
  try {
    const data = await apiGet<{ apps: AppRow[] }>("/api/apps");
    return data.apps?.length ? data.apps : FALLBACK_APPS;
  } catch {
    return FALLBACK_APPS;
  }
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

export async function generateMetadata(): Promise<Metadata> {
  const page = normalizeAppsPage(
    await fetchSitePage("labs").catch(() => FALLBACK),
  );
  const description = metaDescriptionFromMd(
    page.description_md,
    "Member tools for practice: Trade Log, Journal, Playbook, Statistics, and Vexy.",
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
  const [page, apps] = await Promise.all([
    fetchSitePage("labs")
      .then(normalizeAppsPage)
      .catch(() => FALLBACK),
    fetchApps(),
  ]);
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
            <li key={t.id || t.slug}>
              <div className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-label)]">
                    {t.title}
                  </h2>
                  {t.status === "soon" && (
                    <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                      Coming soon
                    </span>
                  )}
                  {t.status === "live" && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Live
                    </span>
                  )}
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {t.blurb}
                </p>
                {t.status === "live" ? (
                  <Link
                    href={t.href || `/app/${t.slug}`}
                    className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
                  >
                    Open →
                  </Link>
                ) : (
                  <p className="mt-4 text-xs text-[var(--color-label-tertiary)]">
                    Ships with the practice stack — not a survey-driven pathway.
                  </p>
                )}
              </div>
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
          <Link href="/live" className="text-[var(--color-tint)] hover:underline">
            Live
          </Link>
          .
        </p>
      </SectionHubShell>
    </main>
  );
}
