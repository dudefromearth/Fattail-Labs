import type { Metadata } from "next";
import Link from "next/link";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { siteUrl } from "@/lib/catalog";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

export const revalidate = 3600;

const FALLBACK: SitePage = {
  slug: "labs",
  title: "Labs",
  description_md:
    "Member practice tools: Journey, Trade Log, and more — process over P&L theater.",
  intro_video_id: null,
  intro_video_title: null,
  faq_title: "Labs FAQ",
  faq_description_md: null,
  faq_items: [],
};

/**
 * Labs hub — primary tab between Courses and Resources.
 * CMS title + description_md for SEO/AEO; tools grid is product chrome.
 */
const TOOLS: {
  id: string;
  name: string;
  blurb: string;
  status: "soon" | "live" | "external";
  href?: string;
}[] = [
  {
    id: "journey",
    name: "Journey",
    blurb:
      "Your enrollments and lesson progress in one place — process over pace, no leaderboards.",
    status: "live",
    href: "/labs/journey",
  },
  {
    id: "tradelog",
    name: "Trade Log",
    blurb:
      "Record fills and structure outcomes — process first, not P&L theater.",
    status: "live",
    href: "/labs/trade-log",
  },
  {
    id: "journal",
    name: "Journal",
    blurb:
      "Daily notes tied to the routine: preparation, selection, and review.",
    status: "soon",
  },
  {
    id: "playbook",
    name: "Playbook",
    blurb:
      "Your defined-risk setups and rules — the book you actually trade from.",
    status: "soon",
  },
  {
    id: "statistics",
    name: "Statistics",
    blurb:
      "Adherence and process metrics — streaks and discipline, never profit claims.",
    status: "soon",
  },
  {
    id: "vexy",
    name: "Vexy",
    blurb:
      "Cognitive partner for structure and doctrine — when the practice stack is wired.",
    status: "soon",
  },
];

function collectionJsonLd(page: SitePage) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.title} — FatTail Labs`,
    description: metaDescriptionFromMd(page.description_md, page.title),
    url: siteUrl("/labs"),
    isPartOf: { "@type": "WebSite", name: "FatTail Labs", url: siteUrl("/") },
    about: {
      "@type": "Thing",
      name: "Member practice tools for options trading education",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchSitePage("labs").catch(() => FALLBACK);
  const description = metaDescriptionFromMd(
    page.description_md,
    "Member tools for practice: Trade Log, Journal, Playbook, Statistics, and Vexy.",
  );
  return {
    title: page.title,
    description,
    alternates: { canonical: siteUrl("/labs") },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url: siteUrl("/labs"),
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

export default async function LabsPage() {
  const page = await fetchSitePage("labs").catch(() => FALLBACK);
  const jsonLd = collectionJsonLd(page);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionHubShell page={page}>
        <ul className="grid gap-4 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.id}>
              <div className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-[var(--color-label)]">
                    {t.name}
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
                {t.href ? (
                  <Link
                    href={t.href}
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
            href="/courses"
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
