import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

// The member-facing User's Guide: every claim here mirrors shipped behavior.
// Static, indexable — help content doubles as answer-engine content.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "User's Guide",
  description:
    "How FatTail Labs works: free accounts and previews, taking courses, " +
    "progress tracking, quizzes, the live schedule, resources, and membership.",
  alternates: { canonical: siteUrl("/guide") },
};

const SECTIONS = [
  ["getting-started", "Getting started"],
  ["finding-courses", "Finding courses"],
  ["taking-a-course", "Taking a course"],
  ["quizzes", "Quizzes"],
  ["your-progress", "Your progress"],
  ["live-sessions", "Live sessions"],
  ["resources", "Resources"],
  ["membership", "Membership & the trial"],
  ["billing", "Billing"],
] as const;

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-24 text-xl font-semibold">
      {children}
    </h2>
  );
}

export default function GuidePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">User&apos;s Guide</h1>
      <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">
        Everything the Lab does and how to use it. Five minutes here saves an
        hour of poking around.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-zinc-300 px-3 py-1 text-sm text-zinc-600 transition-colors hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="text-zinc-700 dark:text-zinc-300 [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
        <H2 id="getting-started">Getting started</H2>
        <p>
          Browsing is open to everyone — the course catalog, lesson pages, the
          live schedule, and this guide. Watching anything requires a free
          account:{" "}
          <Link href="/signup" className="text-emerald-600 underline">
            create one
          </Link>{" "}
          in about thirty seconds.
        </p>
        <ul>
          <li>
            <strong>Free account:</strong> watch the free-preview lessons in
            every course, and download resources marked{" "}
            <em>Free</em> in the library.
          </li>
          <li>
            <strong>Membership:</strong> every lesson, every resource, the live
            sessions, Discord, and the FatTail app. See{" "}
            <a href="#membership" className="text-emerald-600 underline">
              Membership
            </a>{" "}
            below.
          </li>
        </ul>

        <H2 id="finding-courses">Finding courses</H2>
        <p>
          The{" "}
          <Link href="/courses" className="text-emerald-600 underline">
            catalog
          </Link>{" "}
          shows every published course. Filter by category or level, or search.
          Each category also has its own page — Butterflies, Risk &amp; Sizing,
          0-DTE, and so on — linked at the bottom of the catalog.
        </p>
        <p>
          Hover a course card or open it to see the full description, module
          list, ratings, and reviews. If a course has a trailer, press play on
          the course page hero to watch it — trailers are open to everyone.
        </p>
        <p>
          Not sure where to start? Start where the doctrine starts:{" "}
          <Link
            href="/courses/first-stop-the-bleeding"
            className="text-emerald-600 underline"
          >
            First, Stop the Bleeding
          </Link>
          .
        </p>

        <H2 id="taking-a-course">Taking a course</H2>
        <ul>
          <li>
            <strong>Enroll</strong> from the course page — enrollment is what
            turns on progress tracking for that course.
          </li>
          <li>
            Lessons marked <em>Free preview</em> are watchable with any
            account; the rest unlock with membership.
          </li>
          <li>
            The player <strong>remembers your position</strong> — leave
            mid-lesson and you resume where you stopped.
          </li>
          <li>
            A lesson marks itself <strong>complete automatically</strong> once
            you&apos;ve watched about 90% of it. No checkbox hunting.
          </li>
          <li>
            Many lessons have written notes below the video — summaries,
            charts, and checklists worth reading.
          </li>
        </ul>

        <H2 id="quizzes">Quizzes</H2>
        <p>
          Some modules end with a quiz — multiple choice, true/false, and short
          answer. Submit and you&apos;re scored immediately, with explanations
          where the author added them. Your results live on your{" "}
          <Link href="/me" className="text-emerald-600 underline">
            My Learning
          </Link>{" "}
          page.
        </p>

        <H2 id="your-progress">Your progress</H2>
        <p>
          Click your avatar (top right) for the quick menu:{" "}
          <strong>Continue Learning</strong> jumps straight to your next
          unfinished lesson. Two pages keep the full picture:
        </p>
        <ul>
          <li>
            <Link href="/me" className="text-emerald-600 underline">
              My Learning
            </Link>{" "}
            — every enrollment with completion percentages, quiz results, and
            your recent activity.
          </li>
          <li>
            <Link href="/dashboard" className="text-emerald-600 underline">
              Dashboard
            </Link>{" "}
            — the day&apos;s view: pick up where you left off, and see the next
            live session.
          </li>
        </ul>

        <H2 id="live-sessions">Live sessions</H2>
        <p>
          The{" "}
          <Link href="/live" className="text-emerald-600 underline">
            live calendar
          </Link>{" "}
          shows the month at a glance. Click any session for details. All times
          shown in your local timezone; the standing schedule (US Eastern):
        </p>
        <ul>
          <li>
            <strong>0DTE Live Show</strong> — Mon/Wed/Fri 3:00 PM ET. Public,
            on YouTube — no account needed.
          </li>
          <li>
            <strong>Daily Livestream</strong> — Mon–Fri 11:00 AM–12:30 PM ET.
            Coaching members (Navigator, and Observer trials).
          </li>
          <li>
            <strong>Friday Morning Coach Call</strong> — Fri 9:30 AM ET. All
            members.
          </li>
          <li>
            <strong>Sunday Evening Retrospective</strong> — Sun 9:00 PM ET.
            Coaching members.
          </li>
        </ul>
        <p>
          The <strong>Join</strong> button appears 15 minutes before start.
          <strong> Add to Calendar</strong> downloads a calendar file — for
          recurring sessions it&apos;s a true repeating event: add it once and
          it holds, daylight-saving shifts included. Replays of special
          sessions land in the course library.
        </p>

        <H2 id="resources">Resources</H2>
        <p>
          The{" "}
          <Link href="/resources" className="text-emerald-600 underline">
            library
          </Link>{" "}
          collects downloads and links from every course — checklists,
          worksheets, tools. Items marked <em>Free</em> download with any
          account; <em>Members</em> items need a membership (current or
          alumni). Filter by category, or by downloads vs. links.
        </p>

        <H2 id="membership">Membership &amp; the trial</H2>
        <ul>
          <li>
            <strong>Navigator</strong> — $250/month or $2,500/year. Everything:
            all courses, the daily live room, coach calls, resources, Discord,
            and the FatTail app.
          </li>
          <li>
            <strong>Observer trial</strong> — $20/week for four weeks, with
            full Navigator access. Nothing held back.
          </li>
          <li>
            <strong>The alumni year:</strong> complete the full four-week
            trial — or be a paying member for at least a month — and if you
            leave, you keep access to every course for a full year. Live
            sessions, Discord, and the app are for active members.
          </li>
        </ul>
        <p>
          Full details and sign-up on the{" "}
          <Link href="/membership" className="text-emerald-600 underline">
            membership page
          </Link>
          , including the FAQ.
        </p>

        <H2 id="billing">Billing</H2>
        <p>
          Subscriptions are handled by Stripe. From{" "}
          <Link href="/me" className="text-emerald-600 underline">
            My Learning
          </Link>
          , <strong>Manage billing</strong> opens your secure billing portal —
          update cards, download invoices, or cancel there. Members who joined
          through fattail.ai or 0-dte.com sign in with the same account and
          manage billing where they subscribed.
        </p>

        <p className="mt-12 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800">
          Something not covered here? Ask in the Discord, or bring it to a
          coach call — the guide grows from real questions.
        </p>
      </div>
    </main>
  );
}
