import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

// The entity page (SEO spec v1.3): who is behind FatTail Labs, in machine-
// readable form. Person + Organization with sameAs links are what E-E-A-T
// signals and AI answer engines consume.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "FatTail Labs is the trading-education arm of FatTail: capital " +
    "preservation first, convex asymmetric structures second. Founded by " +
    "Ernie Varitimos, host of the 0DTE Live Show.",
  alternates: { canonical: siteUrl("/about") },
};

const SAME_AS = [
  "https://www.youtube.com/@0dte",
  "https://0-dte.com",
  "https://fattail.ai",
];

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Ernie Varitimos",
  url: siteUrl("/about"),
  jobTitle: "Founder & Head Coach",
  worksFor: { "@type": "Organization", name: "FatTail Labs" },
  sameAs: SAME_AS,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FatTail Labs",
  url: siteUrl("/"),
  founder: { "@type": "Person", name: "Ernie Varitimos" },
  sameAs: SAME_AS,
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <h1 className="text-3xl font-semibold tracking-tight">
        About FatTail Labs
      </h1>

      <div className="mt-6 space-y-5 leading-relaxed text-zinc-700 dark:text-zinc-300">
        <p>
          FatTail Labs is the trading-education arm of FatTail. The premise is
          blunt: most trading accounts don&apos;t die from missing the big
          winner — they die from unbounded losers. So the curriculum starts
          where survival starts.{" "}
          <strong>First, stop the bleeding.</strong> For many traders, that is
          the only lesson they ever needed.
        </p>
        <p>
          From there, the method builds toward convexity: defined-risk
          structures — butterflies above all — that cost what they cost,
          nothing more, ever, and pay asymmetrically when they pay. Small known
          risks, repeatedly taken, with the magnitude of wins carrying the
          account. That is the fat-tail doctrine, and every course, live
          session, and tool here serves it.
        </p>
        <p>
          The Labs are led by <strong>Ernie Varitimos</strong> — founder of
          FatTail and{" "}
          <a
            href="https://0-dte.com"
            className="text-emerald-600 underline"
            rel="me"
          >
            0-DTE.com
          </a>
          , and host of the{" "}
          <a
            href="https://www.youtube.com/@0dte"
            className="text-emerald-600 underline"
            rel="me"
          >
            0DTE Live Show
          </a>{" "}
          on YouTube — where the method is practiced in public, live, on
          same-day expiration index options.
        </p>
        <p>
          Members trade alongside the team in the daily livestream, work
          through the course library, and keep the practice honest with
          journaling and routine. Everything teaches capacity, not dependency:
          the goal is that you need us less over time, not more.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link
          href="/courses"
          className="rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
        >
          Browse the Courses
        </Link>
        <Link
          href="/membership"
          className="rounded-full border border-zinc-300 px-6 py-2.5 font-medium transition-colors hover:border-zinc-500 dark:border-zinc-700"
        >
          Membership
        </Link>
      </div>
    </main>
  );
}
