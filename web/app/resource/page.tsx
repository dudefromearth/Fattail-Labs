import type { Metadata } from "next";
import ResourcesHub from "@/components/resources/ResourcesHub";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { siteUrl } from "@/lib/catalog";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

export const revalidate = 3600;

const FALLBACK: SitePage = {
  slug: "resources",
  title: "Resources",
  description_md:
    "Worksheets, templates, and the shared process lexicon — the Trade Lab resources hub.",
  intro_video_id: null,
  intro_video_title: null,
  faq_title: "Resources FAQ",
  faq_description_md: null,
  faq_items: [],
};

function collectionJsonLd(page: SitePage) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.title} — FatTail Labs`,
    description: metaDescriptionFromMd(page.description_md, page.title),
    url: siteUrl("/resource"),
    isPartOf: { "@type": "WebSite", name: "FatTail Labs", url: siteUrl("/") },
    about: {
      "@type": "Thing",
      name: "Trading education worksheets and process tools",
    },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchSitePage("resources").catch(() => FALLBACK);
  const description = metaDescriptionFromMd(
    page.description_md,
    "Worksheets, templates, and tools from FatTail Labs courses.",
  );
  return {
    title: page.title,
    description,
    alternates: { canonical: siteUrl("/resource") },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url: siteUrl("/resource"),
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

export default async function ResourcesPage() {
  const page = await fetchSitePage("resources").catch(() => FALLBACK);
  const jsonLd = collectionJsonLd(page);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SectionHubShell page={page}>
        <ResourcesHub />
      </SectionHubShell>
    </main>
  );
}
