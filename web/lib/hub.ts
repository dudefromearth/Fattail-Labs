import { apiGet } from "./api";

export type HubFaqItem = {
  id: number;
  sort_order: number;
  question: string;
  answer_md: string;
};

export type HubPage = {
  slug: string;
  title: string;
  description_md: string | null;
  intro_video_id: string | null;
  intro_video_title: string | null;
  faq_title: string;
  faq_description_md: string | null;
  faq_items: HubFaqItem[];
};

export async function fetchHub(): Promise<HubPage> {
  return apiGet<HubPage>("/api/hub");
}

export function youtubeEmbedUrl(videoId: string): string {
  const q = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}
