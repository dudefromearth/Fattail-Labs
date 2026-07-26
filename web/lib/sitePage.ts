import { apiGet } from "./api";

/** CMS-backed section hub (labs | resources | live | hub). */
export type SitePage = {
  slug: string;
  title: string;
  description_md: string | null;
  intro_video_id: string | null;
  intro_video_title: string | null;
  faq_title: string;
  faq_description_md: string | null;
  faq_items: {
    id: number;
    sort_order: number;
    question: string;
    answer_md: string;
  }[];
};

export async function fetchSitePage(slug: string): Promise<SitePage> {
  return apiGet<SitePage>(`/api/site-pages/${slug}`);
}

/** Plain-text lead for meta description (first ~300 chars). */
export function metaDescriptionFromMd(md: string | null | undefined, fallback: string): string {
  if (!md?.trim()) return fallback;
  const plain = md
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*?|__?/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  return plain.slice(0, 300) || fallback;
}
