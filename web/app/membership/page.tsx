import type { Metadata } from "next";
import { Suspense } from "react";
import MembershipPlans from "@/components/MembershipPlans";
import { siteUrl } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Membership",
  description:
    "FatTail Labs membership: every course, the daily live trading room, " +
    "coach calls, resources, Discord, and the FatTail app. $20/week trial " +
    "with full access.",
  alternates: { canonical: siteUrl("/membership") },
};

// FAQ content (SEO spec v1.3): one source renders the visible block AND the
// FAQPage JSON-LD — the schema can never drift from what the page says.
const FAQ: { q: string; a: string }[] = [
  {
    q: "What does membership include?",
    a: "Navigator membership includes every course, the daily live trading room (Mon–Fri, 11:00 AM–12:30 PM ET), the Friday morning coach call, the Sunday evening retrospective, the full resource library, the private Discord, and the FatTail app.",
  },
  {
    q: "How does the $20/week trial work?",
    a: "The Observer trial runs four weeks at $20 per week with full Navigator access — coaching, live sessions, Discord, the app, and every course. Nothing is held back during the trial.",
  },
  {
    q: "What happens when my trial ends?",
    a: "Complete the full four weeks and you keep access to every course for a full year, even if you don't continue. Live sessions, Discord, and the app are for active members only.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. And if you've been a paying member for at least a month, you keep course access for a full year after leaving — you only lose the live sessions, Discord, and the app.",
  },
  {
    q: "What's the difference between Activator and Navigator?",
    a: "Navigator is the complete membership, including the daily live trading room and coaching. Activator — offered through promotions — includes the courses, Discord, the app, and the Friday coach call, but not the daily room or the Sunday retrospective.",
  },
  {
    q: "Do I need trading experience to start?",
    a: "The curriculum starts where survival starts: the flagship course, First, Stop the Bleeding, assumes losses, not expertise. Options Foundations covers the mechanics from zero.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function MembershipPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h1 className="text-3xl font-semibold tracking-tight">Membership</h1>
      <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
        Unlock every course, quiz, resource, and live session. First lesson of the
        doctrine either way: stop the bleeding.
      </p>
      <div className="mt-8">
        <Suspense>
          <MembershipPlans />
        </Suspense>
      </div>

      <section className="mt-14">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <dl className="mt-5 space-y-6">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-medium">{f.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
