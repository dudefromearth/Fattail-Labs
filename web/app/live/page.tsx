import type { Metadata } from "next";
import LiveSessions from "@/components/LiveSessions";
import { apiGet } from "@/lib/api";
import { siteUrl } from "@/lib/catalog";

// Event JSON-LD for PUBLIC sessions (SEO spec v1.3): the 0DTE Live Show is a
// genuinely public recurring event — rare, and rankable. Member sessions stay
// out of the schema. Hourly revalidation keeps the window rolling.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Live Sessions",
  description:
    "The FatTail Labs live schedule: the public 0DTE Live Show, the daily " +
    "livestream, coach calls, and the Sunday retrospective.",
  alternates: { canonical: siteUrl("/live") },
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

export default async function LivePage() {
  const events = await publicEventsJsonLd();
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      {events && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(events) }}
        />
      )}
      <h1 className="text-3xl font-semibold tracking-tight">Live Sessions</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        The live trading room and weekly workshops — trade and build alongside the
        FatTail team. Replays land in the course library.
      </p>
      <div className="mt-8">
        <LiveSessions />
      </div>
    </main>
  );
}
