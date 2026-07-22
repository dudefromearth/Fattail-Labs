// Crawl policy (SEO spec v1.0 §2): public surfaces open, member/admin/API
// surfaces excluded. AI crawlers get the same welcome as search engines —
// the site is full-HTML prerendered specifically so they can read it.

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/catalog";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/me", "/dashboard", "/admin/", "/api/", "/login"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
  };
}
