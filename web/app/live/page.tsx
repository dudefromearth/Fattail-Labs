import type { Metadata } from "next";
import LiveSessions from "@/components/LiveSessions";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";
import {
  fetchSitePage,
  metaDescriptionFromMd,
  type SitePage,
} from "@/lib/sitePage";

// Event JSON-LD for PUBLIC sessions (SEO spec v1.3) + CollectionPage for hub.
export const revalidate = 3600;

const FALLBACK: SitePage = {
  slug: "live",
  title: "Live Sessions",
  description_md:
    "The FatTail Labs live schedule: the public 0DTE Live Show, member livestreams, coach calls, and the Sunday retrospective.",
  intro_video_id: null,
  intro_video_title: null,
  faq_title: "Live FAQ",
  faq_description_md: null,
  faq_items: [],
};

type PublicSession = {
  title: string;
  category: string;
  starts_at: string;
  ends_at?: string;
  recurring: boolean;
};

async function publicEventsJsonLd() {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const data = await apiGet<{ sessions: PublicSession[] }>(
    `/api/live/sessions?month=${month}`,
  ).catch(() => null);
  if (!data) return null;
  const upcoming = data.sessions
    .filter((s) => s.category === "public" && new Date(s.starts_at) > now)
    .slice(0, 10);
  if (upcoming.length === 0) return null;
  return upcoming.map((s) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${s.title} — FatTail Labs`,
    startDate: s.starts_at,
    ...(s.ends_at ? { endDate: s.ends_at } : {}),
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    location: { "@type": "VirtualLocation", url: siteUrl("/live") },
    organizer: {
      "@type": "Organization",
      name: "FatTail Labs",
      url: siteUrl("/"),
    },
  }));
}

function collectionJsonLd(page: SitePage) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${page.title} — FatTail Labs`,
    description: metaDescriptionFromMd(page.description_md, page.title),
    url: siteUrl("/live"),
    isPartOf: { "@type": "WebSite", name: "FatTail Labs", url: siteUrl("/") },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchSitePage("live").catch(() => FALLBACK);
  const description = metaDescriptionFromMd(
    page.description_md,
    "The FatTail Labs live schedule: public 0DTE Live Show, livestreams, and coach calls.",
  );
  return {
    title: page.title,
    description,
    alternates: { canonical: siteUrl("/live") },
    openGraph: {
      title: `${page.title} — FatTail Labs`,
      description,
      url: siteUrl("/live"),
      siteName: "FatTail Labs",
      type: "website",
    },
  };
}

export default async function LivePage() {
  const [page, events] = await Promise.all([
    fetchSitePage("live").catch(() => FALLBACK),
    publicEventsJsonLd(),
  ]);
  const collection = collectionJsonLd(page);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }}
      />
      {events && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(events) }}
        />
      )}
      <SectionHubShell page={page}>
        <LiveSessions />
      </SectionHubShell>
    </main>
  );
}
