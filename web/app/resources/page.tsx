import type { Metadata } from "next";
import ResourceLibrary from "@/components/ResourceLibrary";
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
    "Worksheets, templates, and tools from every course — the Trade Lab library.",
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
    url: siteUrl("/resources"),
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
    alternates: { canonical: siteUrl("/resources") },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url: siteUrl("/resources"),
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
        <ResourceLibrary />
      </SectionHubShell>
    </main>
  );
}
