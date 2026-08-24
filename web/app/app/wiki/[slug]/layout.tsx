import type { Metadata } from "next";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import { wikiArticleJsonLd } from "@/lib/wiki/articleJsonLd";

type WikiPageMeta = {
  slug: string;
  title: string;
  lead?: string;
  status: string;
  updated?: string;
};

async function loadPublished(slug: string): Promise<WikiPageMeta | null> {
  try {
    const page = await apiGet<WikiPageMeta>(
      `/api/wiki/pages/${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (page.status !== "published") return null;
    return page;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decoded = decodeURIComponent(slug || "");
  const page = await loadPublished(decoded);
  if (!page) {
    return { title: "Wiki", robots: { index: false, follow: false } };
  }
  const description =
    (page.lead || "").trim() ||
    "A page in the compiled FatTail Labs wiki map.";
  const url = siteUrl(`/app/wiki/${encodeURIComponent(page.slug)}`);
  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url,
      siteName: "FatTail Labs",
      type: "article",
    },
  };
}

export default async function WikiArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await loadPublished(decodeURIComponent(slug || ""));
  const blocks = page ? wikiArticleJsonLd({
    slug: page.slug,
    title: page.title,
    lead: page.lead || "",
    updated: page.updated,
  }) : [];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
      {children}
    </>
  );
}
