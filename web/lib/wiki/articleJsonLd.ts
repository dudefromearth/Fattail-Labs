/** Article + BreadcrumbList JSON-LD for public wiki pages (Sierra WU-2-0).
 * Not Course. Not Offer. Reuses siteUrl from the catalog stack. */

import { siteUrl } from "@/lib/catalog";

export type WikiArticleMeta = {
  slug: string;
  title: string;
  lead: string;
  updated?: string;
};

export function wikiArticleJsonLd(page: WikiArticleMeta): object[] {
  const url = siteUrl(`/app/wiki/${encodeURIComponent(page.slug)}`);
  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    description: page.lead,
    url,
    dateModified: page.updated || undefined,
    isPartOf: {
      "@type": "WebSite",
      name: "FatTail Labs",
      url: siteUrl("/"),
    },
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Wiki", item: siteUrl("/app/wiki") },
      { "@type": "ListItem", position: 3, name: page.title, item: url },
    ],
  };
  return [article, crumbs];
}
