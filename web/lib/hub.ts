import { apiUrl } from "./api";

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
  // Tag so admin save can revalidateTag("hub") and force a fresh fetch on
  // the next static regeneration (avoids serving a stale Data Cache entry).
  const res = await fetch(apiUrl("/api/hub"), {
    next: { tags: ["hub"] },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status} for /api/hub`);
  }
  return res.json() as Promise<HubPage>;
}

/**
 * Extract an 11-char YouTube video id from a bare id or common URL shapes.
 * Mirrors server `routes.hub._normalize_intro_video_id` so the hub player
 * previews correctly while the admin still pastes full watch/share links.
 */
export function parseYoutubeVideoId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const withScheme = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withScheme);
    const host = (u.hostname || "").replace(/^www\./, "");
    if (host === "youtu.be") {
      const cand = u.pathname.replace(/^\//, "").split("/")[0] || "";
      return /^[\w-]{11}$/.test(cand) ? cand : null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[\w-]{11}$/.test(v)) return v;
      const m = u.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function youtubeEmbedUrl(videoIdOrUrl: string): string {
  const videoId = parseYoutubeVideoId(videoIdOrUrl) || videoIdOrUrl.trim();
  const q = new URLSearchParams({
    rel: "0",
    playsinline: "1",
    modestbranding: "1",
  });
  return `https://www.youtube-nocookie.com/embed/${videoId}?${q.toString()}`;
}
