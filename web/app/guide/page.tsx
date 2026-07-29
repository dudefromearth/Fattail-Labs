import type { Metadata } from "next";
import Link from "next/link";
import {
  GuideContentsMobile,
  GuideSidebar,
} from "@/components/guide/GuideOutline";
import { siteUrl } from "@/lib/catalog";

// The member-facing User's Guide: every claim here mirrors shipped behavior.
// Static, indexable — help content doubles as answer-engine content.
// Layout: HIG help pattern — sticky hierarchical outline + article column.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "User's Guide",
  description:
    "How FatTail Labs works: free accounts and previews, taking courses, " +
    "progress tracking, quizzes, the live schedule, resources, and membership.",
  alternates: { canonical: siteUrl("/guide") },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="scroll-under-header mt-10 text-xl font-semibold text-[var(--color-label)] first:mt-0"
    >
      {children}
    </h2>
  );
}

const link = "text-[var(--color-tint)] underline underline-offset-2";

export default function GuidePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
          User&apos;s Guide
        </h1>
        <p className="mt-2 text-[var(--color-label-secondary)]">
          Everything the Lab does and how to use it. Five minutes here saves an
          hour of poking around.
        </p>
        <div className="mt-4">
          <GuideContentsMobile />
        </div>
      </header>

      <div className="mt-8 flex gap-8 lg:mt-10 lg:gap-10">
        <GuideSidebar />

        <article className="surface-card min-w-0 flex-1 border border-[var(--color-separator)] p-6 sm:p-8">
          <div className="max-w-prose text-[var(--color-label-secondary)] [&_p]:mt-3 [&_p]:leading-relaxed [&_strong]:text-[var(--color-label)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6">
            <H2 id="getting-started">Getting started</H2>
            <p>
              Browsing is open to everyone — the course catalog, lesson pages,
              the live schedule, and this guide. Watching anything requires a
              free account:{" "}
              <Link href="/signup" className={link}>
                create one
              </Link>{" "}
              in about thirty seconds.
            </p>
            <ul>
              <li>
                <strong>Free account:</strong> watch the free-preview lessons
                in every course, and download resources marked <em>Free</em> in
                the library.
              </li>
              <li>
                <strong>Membership:</strong> every lesson, every resource, the
                live sessions, Discord, and the FatTail app. See{" "}
                <a href="#membership" className={link}>
                  Membership
                </a>{" "}
                below.
              </li>
            </ul>

            <H2 id="finding-courses">Finding courses</H2>
            <p>
              The{" "}
              <Link href="/course" className={link}>
                catalog
              </Link>{" "}
              shows every published course. Filter by category or level, or
              search. Each category also has its own page — Butterflies, Risk
              &amp; Sizing, 0-DTE, and so on — linked at the bottom of the
              catalog.
            </p>
            <p>
              Open a course to see the full description, module list, ratings,
              and reviews. If a course has a trailer, press play on the course
              page hero to watch it — trailers are open to everyone.
            </p>
            <p>
              Not sure where to start? Start where the doctrine starts:{" "}
              <Link
                href="/course/first-stop-the-bleeding"
                className={link}
              >
                First, Stop the Bleeding
              </Link>
              .
            </p>

            <H2 id="taking-a-course">Taking a course</H2>
            <ul>
              <li>
                <strong>Enroll</strong> from the course page — enrollment is
                what turns on progress tracking for that course.
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
                A lesson marks itself <strong>complete automatically</strong>{" "}
                once you&apos;ve watched about 90% of it. No checkbox hunting.
              </li>
              <li>
                Many lessons have written notes below the video — summaries,
                charts, and checklists worth reading.
              </li>
            </ul>

            <H2 id="quizzes">Quizzes</H2>
            <p>
              Some modules end with a quiz — multiple choice, true/false, and
              short answer. Submit and you&apos;re scored immediately, with
              explanations where the author added them. Your results live on
              your{" "}
              <Link href="/app/journey" className={link}>
                Journey
              </Link>{" "}
              page.
            </p>

            <H2 id="your-progress">Your progress</H2>
            <p>
              Click your avatar (top right) for the quick menu:{" "}
              <strong>Continue Learning</strong> jumps straight to your next
              unfinished lesson. From the same menu:
            </p>
            <ul>
              <li>
                <Link href="/app/journey" className={link}>
                  Journey
                </Link>{" "}
                — enrollments, quiz results, activity, and{" "}
                <strong>My presence</strong> process scores (reputation, personal
                growth, attendance streak, contribution). The{" "}
                <strong>Community board</strong> shows peers who opt in so you can
                compare participation — never profit.
              </li>
              <li>
                <Link href="/me" className={link}>
                  Profile
                </Link>{" "}
                — display name, profile photo, and Journey board visibility.
              </li>
            </ul>

            <H2 id="live-sessions">Live sessions</H2>
            <p>
              The{" "}
              <Link href="/live" className={link}>
                live calendar
              </Link>{" "}
              shows the month at a glance. Click any session for details. All
              times shown in your local timezone; the standing schedule (US
              Eastern):
            </p>
            <ul>
              <li>
                <strong>0DTE Live Show</strong> — Mon/Wed/Fri 3:00 PM ET.
                Public, on YouTube — no account needed.
              </li>
              <li>
                <strong>Daily Livestream</strong> — Mon–Fri 11:00 AM–12:30 PM
                ET. Coaching members (Navigator, and Observer trials).
              </li>
              <li>
                <strong>Friday Morning Coach Call</strong> — Fri 9:30 AM ET.
                All members.
              </li>
              <li>
                <strong>Sunday Evening Retrospective</strong> — Sun 9:00 PM ET.
                Coaching members.
              </li>
            </ul>
            <p>
              The <strong>Join</strong> button appears 15 minutes before start.
              <strong> Add to Calendar</strong> downloads a calendar file — for
              recurring sessions it&apos;s a true repeating event: add it once
              and it holds, daylight-saving shifts included. Replays of special
              sessions land in the course library.
            </p>

            <H2 id="resources">Resources</H2>
            <p>
              The{" "}
              <Link href="/resource" className={link}>
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
                <strong>Navigator</strong> — $250/month or $2,500/year.
                Everything: all courses, the daily live room, coach calls,
                resources, Discord, and the FatTail app.
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
              <Link href="/membership" className={link}>
                membership page
              </Link>
              , including the FAQ.
            </p>

            <H2 id="billing">Billing</H2>
            <p>
              Subscriptions are handled by Stripe. From{" "}
              <Link href="/me" className={link}>
                Profile
              </Link>
              , <strong>Manage billing</strong> opens your secure billing
              portal — update cards, download invoices, or cancel there.
              Members who joined through fattail.ai or 0-dte.com sign in with
              the same account and manage billing where they subscribed.
            </p>

            <p className="mt-12 border-t border-[var(--color-separator)] pt-6 text-sm text-[var(--color-label-tertiary)]">
              Something not covered here? Ask in the Discord, or bring it to a
              coach call — the guide grows from real questions. New sections
              land in the outline on the left (or under Contents on mobile).
            </p>
          </div>
        </article>
      </div>
    </main>
  );
}
