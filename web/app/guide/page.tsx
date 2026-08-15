import type { Metadata } from "next";
import Link from "next/link";
import {
  GuideContentsMobile,
  GuideSidebar,
} from "@/components/guide/GuideOutline";
import { siteUrl } from "@/lib/catalog";

// The member-facing User's Guide: process doctrine + product model.
// Keep aligned with Practice-Charter-Day-Implementation-Plan and as-built after each PR.
// Static, indexable — help content doubles as answer-engine content.
// Layout: HIG help pattern — sticky hierarchical outline + article column.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "User's Guide",
  description:
    "How FatTail Labs works: courses, Practice (daily protocol, Trade Log, Journal, Campaign), " +
    "Journey Process Flow, Toughness, Wiki, live sessions, resources, and membership. Process over P&L theater.",
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
          Courses, live sessions, Practice, Journey, Toughness, Wiki, and what is
          coming next. Five minutes here saves an hour of poking around.
          Process over P&amp;L theater — always.
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

            <H2 id="why-we-practice">Why we practice</H2>
            <p>
              Labs is here to help you become more{" "}
              <strong>present, aware, and integrated</strong> with a real
              methodology — not to walk through a trading career oblivious to the
              habits that actually compound. Markets evolve with{" "}
              <strong>right-skewed, fat-tailed</strong> distributions; we train
              process, size, and review so you can stay in the game. Capital
              doctrine remains{" "}
              <strong>stop the bleeding</strong> — process outcomes, never profit
              claims.
            </p>
            <ul>
              <li>
                <strong>Journal</strong> — daily evidence: analysis, execution,
                reflection.
              </li>
              <li>
                <strong>Trade Log</strong> — fills as process evidence, not a
                P&amp;L scoreboard.
              </li>
              <li>
                <strong>Retrospective</strong> — weekly honesty: what was hard,
                what caused it, what replacement habit you install next.
              </li>
              <li>
                <strong>Journey</strong> — Process Flow map of practice pillars
                (process standing, not profit ranking).
              </li>
              <li>
                <strong>Toughness</strong> — capacity in body, mind, and spirit
                so the path holds under stress.
              </li>
            </ul>
            <p>
              Start where the pathway starts:{" "}
              <Link
                href="/course/first-stop-the-bleeding"
                className={link}
              >
                First, Stop the Bleeding
              </Link>
              .
            </p>

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
                — your path and process standing across the whole Lab (courses,
                live, practice, and optional Toughness). See{" "}
                <a href="#journey" className={link}>
                  Journey
                </a>{" "}
                below.
              </li>
              <li>
                <Link href="/me" className={link}>
                  Profile
                </Link>{" "}
                — display name, profile photo, and Journey board visibility.
              </li>
            </ul>

            <H2 id="apps-overview">Apps at a glance</H2>
            <p>
              Open{" "}
              <Link href="/app" className={link}>
                Apps
              </Link>{" "}
              for the tools that sit beside courses and live sessions. They share
              one job: help you keep an honest practice and see progress without
              turning Labs into a P&amp;L scoreboard.
            </p>
            <ul>
              <li>
                <strong>Practice</strong> — Trade Log, Journal, Reports,
                Retrospective, Playbook, optional Campaign.
              </li>
              <li>
                <strong>Journey</strong> — Process Flow compass + learning path
                (process standing, not profit ranking).
              </li>
              <li>
                <strong>Toughness</strong> — optional Hard programs; can feed
                Journey when you enroll.
              </li>
              <li>
                <strong>Wiki</strong> — the growing map of what we teach.
              </li>
              <li>
                <strong>Strategy Lab</strong> — build, curate, Deploy strategies
                (automated); separate from Practice Campaigns.
              </li>
            </ul>

            <H2 id="practice">Practice suite</H2>
            <p>
              <Link href="/app/practice" className={link}>
                Practice
              </Link>{" "}
              is the human trading desk: Trade Log, Reports, Journal,
              Retrospective, Playbook, and optional Campaign. Shared nav keeps
              your place; <strong>Practice Context</strong> (account + date)
              sits in the chrome of every Practice app.
            </p>
            <ul>
              <li>
                <strong>Account = book.</strong> One-for-one. The book is the
                contents of that account. Trades and reports follow this
                account. Journal is still <em>you</em>, not a separate journal
                per account. A campaign is a badge, not a book.
              </li>
              <li>
                <strong>Date</strong> — year / month / week / day. Journal uses
                it as “which day,” Trade Log as a list filter, Reports as the
                analysis window.
              </li>
            </ul>
            <p>
              Use Journal and Trade Log together for plan, execute, and review —
              process-first: clean execution matters even when a stop is hit;
              P&amp;L is not self-worth. Campaign is an optional charter wrapper,
              never required.
            </p>

            <H2 id="trade-log">Trade Log</H2>
            <p>
              <Link href="/app/trade-log" className={link}>
                Trade Log
              </Link>{" "}
              is your options-first blotter — multi-leg fills and structure as
              process evidence.
            </p>
            <ul>
              <li>
                <strong>Table-first:</strong> permanent log; right sheet to
                create, edit, or review.
              </li>
              <li>
                <strong>Accounts:</strong> each account is one book; active
                account from Practice Context.
              </li>
              <li>
                <strong>Import &amp; export:</strong> bring fills in (optional
                campaign badge or none) and export a portable
                copy.
              </li>
              <li>
                <strong>Optional campaign stamp:</strong> link a fill to a
                Campaign when you want; unstamped is always valid.
              </li>
              <li>
                <strong>Framing:</strong> process and structure first — not a
                theater of profits. Adherence tags feed Journey’s process map —
                not a grade for money made.
              </li>
              <li>
                <strong>Campaign / playbook filters:</strong>{" "}
                <em>All</em> means every trade. Each trade account has at most
                one <em>default</em> campaign (import + new-fill home); pick that
                default to see its stamps plus unstamped fills on that account.
                Playbook filter default is <em>Unaffiliated</em> (no playbook
                link). Named campaigns/playbooks narrow to exact stamps.
              </li>
              <li>
                <strong>Living log:</strong> record when experience happens;
                pair meaningful days with Journal on the same date.
              </li>
            </ul>

            <H2 id="journal">Journal</H2>
            <p>
              <Link href="/app/journal" className={link}>
                Journal
              </Link>{" "}
              is <strong>not</strong> an end-of-day chore. Calendar-first
              conversation for each day: write{" "}
              <strong>with every experience</strong> — pre-market analysis,
              mid-session decisions, trade moments, and a post-market exhale.
              One thread per date; every message is timestamped.
            </p>
            <ul>
              <li>
                <strong>Calendar navigation</strong> aligned with Practice date
                context (keep <strong>today</strong> when the day is live).
              </li>
              <li>
                <strong>Day session</strong> — one conversation for that date;
                composer always ready (capacity building, not stock tips).
              </li>
              <li>
                <strong>Pre-market &amp; post-market</strong> — plan and
                invalidation before the open; process exhale after the close —
                not a P&amp;L scorecard. Week view shows when you wrote across
                the day.
              </li>
              <li>
                <strong>Soft beats</strong> — optional Hypothesis and Reflection
                scaffolds on an empty day (IF/THEN, variance capture). They never
                block freeform writing. End-of-day records variance; it does not
                rewrite today&apos;s plan (weekly pivot is for structural change).
              </li>
              <li>
                <strong>Tags</strong> — label what happened so later
                retrospectives and Process Flow stay honest.
              </li>
              <li>
                <strong>Trades on this day</strong> — from the active account
                (Trade Log holds structure; Journal holds mind).
              </li>
              <li>
                <strong>Retrospective</strong> uses this living thread —
                including pre-market intent vs what you actually did.
              </li>
            </ul>

            <H2 id="retrospective">Retrospective</H2>
            <p>
              <Link href="/app/retrospective" className={link}>
                Retrospective
              </Link>{" "}
              is the structured weekly review: what was hard, what got in the
              way, what can change, and the{" "}
              <strong>one checkable habit</strong> you install next — not a
              P&amp;L scorecard.
            </p>
            <ul>
              <li>
                <strong>Library</strong> of past retrospectives.
              </li>
              <li>
                <strong>Scope</strong> — from last review (or your maiden
                journey).
              </li>
              <li>
                <strong>Ceremony</strong> — commitments, practice, obstacles,
                cause you name, what worked, one replacement habit.
              </li>
              <li>
                <strong>Gaps</strong> — habits that never showed up in Journal
                become visible here.
              </li>
              <li>
                <strong>Cadence</strong> — gentle nudges when a review is due,
                including from Journey.
              </li>
            </ul>

            <H2 id="reports">Reports</H2>
            <p>
              <Link href="/app/reports" className={link}>
                Reports
              </Link>{" "}
              is objective book aggregate from Trade Log: path, drawdown, and
              tables for the selected account — capital path risk, not a trophy.
              Process repair lives in Trade Log, Journal, and Playbook, not as a
              scoreboard on Reports.
            </p>
            <ul>
              <li>
                Equity-style path and <strong>drawdown</strong> for the active
                account.
              </li>
              <li>
                Drill into fills when you need the blotter behind a number.
              </li>
            </ul>

            <H2 id="playbook">Playbook</H2>
            <p>
              <Link href="/app/playbook" className={link}>
                Playbook
              </Link>{" "}
              is who you are under risk — the rules and setups you will not
              break. Keep capacity with you; pair with Journal and Trade Log.
            </p>

            <H2 id="campaign">Campaigns</H2>
            <p>
              <Link href="/app/practice/campaign" className={link}>
                Campaigns
              </Link>{" "}
              is an <strong>optional charter</strong> for practice context —
              capital, goals, multi-active campaigns, optional account default
              for import. It is <strong>never required</strong> to log trades,
              journal, or show Process Flow standing. The day stays the atom:
              Hypothesis → Experiment → Reflection.
            </p>
            <ul>
              <li>
                Library has <strong>Open</strong> and <strong>Archive</strong>{" "}
                views (completed and ended-early seasons). The Lab archives
                strategies; Practice archives seasons.
              </li>
              <li>
                Lifecycle: <strong>Active</strong> (in force),{" "}
                <strong>Pause</strong> / <strong>Resume</strong> (reversible),{" "}
                <strong>Complete</strong> (finished on terms),{" "}
                <strong>End campaign</strong> (early close, incomplete — not
                Pause). First activate <strong>signs</strong> the charter;
                mid-season edits are dated amendments (no judgment chrome).
                Closed seasons can <strong>Renew</strong> into a new draft cycle
                with lineage.
              </li>
              <li>
                Optional <strong>starting frames</strong> pre-draft goals only —
                skip anytime; title + activate is enough.
              </li>
              <li>
                Optional account scope, starting capital, start/end dates, and
                charter text; open a campaign for full edit; stamp trades when
                you choose.
              </li>
              <li>
                Import can target an account default campaign or another
                campaign — unstamped fills stay valid.
              </li>
              <li>
                Not a daily checklist and not a profit plan. Creating a campaign
                does not boost Journey standing. Cycle count and amendments
                never feed Journey meters.
              </li>
              <li>
                <strong>Find and Badge</strong> (on this same Campaigns page) is
                the one place to search every account and assign or clear a
                campaign badge. A campaign is not a book. AutoFilter stays hidden
                until you turn it on. Select positions, then clear or assign. A
                fill outside the campaign dates is rejected and stays unbadged.
                Clear a badge before assigning another. The found set is a date
                range plus a position count (not raw fills). The table pages 50.
                Five undos. Search is not inside each campaign and not on the
                Trade Log.
              </li>
            </ul>

            <H2 id="journey">Journey</H2>
            <p>
              <Link href="/app/journey" className={link}>
                Journey
              </Link>{" "}
              is where you keep close track of{" "}
              <strong>practice and progress</strong> across the Lab — process
              standing, not a second login.
            </p>
            <p>
              <strong>Process Flow (the compass)</strong> is a map of practice
              pillars (routine, learning, live presence, persistence, adherence,
              retrospectives, and toughness when enrolled). Alignment, not a test
              score and never a profit ranking. Grades respect tenure; new
              members are not labeled “Poor” for starting.{" "}
              <strong>P&amp;L never draws the path.</strong> A time-path scrub
              lets you look back across practice start → today as the shape of
              the map updates; click the path or drag the slider (bidirectional).
            </p>
            <p>
              <strong>Review your own evidence:</strong> each metered pillar
              links to the place that evidence lives (Trade Log, Journal,
              Retrospective, live schedule, Toughness when enrolled).{" "}
              <strong>Adhere</strong> deep-links into Trade Log with a temporary
              locate view (trades that are <em>not</em> followed and <em>not</em>{" "}
              partial in the adherence window). Clear returns to the full blotter
              — there is no standing process filter on Trade Log. Partial credit
              stays in the meter good set.
            </p>
            <p>
              When the time path shows a recovery toward a healthy heading, a
              quiet line may invite plan-accessible next steps (Journal,
              Retrospective, Trade Log). You can dismiss that invite; the
              preference is stored on your profile (not only this browser). No
              unlocks, badges, or score-gated content.
            </p>
            <p>
              <strong>Also on Journey:</strong> community presence (opt-in,
              never profit ranking), learning path, pathway and next live.
              Courses, live check-in, Practice (Trade Log, Journal,
              Retrospective), and Toughness (when enrolled) feed Process Flow.
              Creating a Campaign is <strong>not</strong> required for standing.
            </p>
            <p>
              In short: Journey answers “am I doing the work?” — process over
              pace, capacity over dependency — not a fix prescription and not
              unlocks for scores.
            </p>

            <H2 id="toughness">Toughness</H2>
            <p>
              <Link href="/app/toughness" className={link}>
                Toughness
              </Link>{" "}
              is <strong>optional</strong> capacity training under voluntary load
              — FatTail Hard and True 75 Hard. It is never a membership gate and
              never required to use the rest of Labs.
            </p>
            <ul>
              <li>
                <strong>How it works:</strong> complete every required activity
                every day for the full length of the program you chose. Miss or
                fail any required task and you restart at day one. Life still
                happens (travel, weddings); the rules do not pause.
              </li>
              <li>
                <strong>True 75 Hard</strong> — Andy Frisella’s program as-is,
                with full credit; optional honor-system tracking in Labs.
              </li>
              <li>
                <strong>FatTail Hard</strong> — 20-, 40-, and 75-day programs
                (breakthrough periods). Many people complete 20 twice before 40
                feels possible; at 40 many hit a hard stretch of despair — getting
                through it under the rules makes the end reachable.
              </li>
              <li>
                <strong>Today’s log</strong> — daily checklist while enrolled;
                pause or exit anytime.
              </li>
              <li>
                <strong>Journey:</strong> when a challenge is <em>active</em>,
                Mental Toughness enters Process Flow. When you are not enrolled,
                that dimension stays empty — it does not count as a zero or
                punish you for opting out.
              </li>
            </ul>

            <H2 id="wiki">Wiki</H2>
            <p>
              The{" "}
              <Link href="/app/wiki" className={link}>
                Wiki
              </Link>{" "}
              is the compiled map of everything we teach — concepts, courses, and
              live material, cross-linked and searchable. It is{" "}
              <strong>always growing</strong> as new teaching lands.
            </p>
            <ul>
              <li>
                <strong>Search first</strong> — find pages in your own words.
              </li>
              <li>
                <strong>Start here</strong> and <strong>new this week</strong> —
                orientation and recently updated pages.
              </li>
              <li>
                Use it when a lesson or live session points at a concept you want
                to hold onto outside the video.
              </li>
            </ul>

            <H2 id="strategy-lab">Strategy Lab (coming)</H2>
            <p>
              <Link href="/app/strategy-lab" className={link}>
                Strategy Lab
              </Link>{" "}
              will be a large surface for developing edges with discipline:{" "}
              <strong>Build, Test, Run bots — live and paper</strong>, with
              process gates (most ideas die; survivors earn a campaign). Execution
              is aimed at <strong>Tradier</strong>; market data stays separate
              from the broker so you are not paying twice for the same tape.
            </p>
            <p>
              Today the page is an orientation map and courseware backlog. The
              full workspace (historical tests, live tests, bot runs, paper then
              live) ships in later waves. Until then, validate edges with
              Practice, courses, and honest journaling — not with silent
              automation.
            </p>

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
                <strong>Navigator</strong> — $267/month or $2,997/year.
                Everything: all courses, the daily live room, coach calls,
                resources, Discord, and the FatTail app.
              </li>
              <li>
                <strong>Observer membership</strong> — 6 weeks at{" "}
                <strong>$17/wk or $102</strong> total, with full Navigator access.
                Nothing held back. Six weeks (not four) so process habits have
                room to form — experts often cite about 33–66 days for a habit to
                hold.
              </li>
              <li>
                <strong>The alumni year:</strong> complete the full six-week
                membership — or be a paying member for at least a month — and if you
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
