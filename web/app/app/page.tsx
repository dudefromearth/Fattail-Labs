import type { Metadata } from "next";
import Link from "next/link";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import AppsGrid from "@/components/apps/AppsGrid";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import {
  buildTopLevelCatalog,
  FALLBACK_APPS,
  type AppRow,
} from "@/lib/appsCatalog";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

// Admin order/highlight writes must appear on the next load (Catalog-Order v1.1.2).
export const dynamic = "force-dynamic";

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

async function fetchApps(): Promise<AppRow[]> {
  try {
    const data = await apiGet<{ apps: AppRow[] }>("/api/apps", {
      cache: "no-store",
    });
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
        <AppsGrid apps={apps} />

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
