import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Life Cycle hub — map for the advanced-trader sub-process and
 * courseware backlog. Two-column cards under section headers throughout.
 * Workspace product ships later; this page orients members and curriculum.
 */

export const metadata: Metadata = {
  title: "Strategy Life Cycle",
  description:
    "Build, Prove, Paper, Run — the FatTail path for validating strategies before capital. Courseware hub and practice map. Process over profit claims.",
  alternates: { canonical: siteUrl("/app/strategy-lab") },
};

// --- Content ------------------------------------------------------------------

const STAGES = [
  {
    id: "build",
    n: "1",
    name: "Build",
    oneLiner: "Turn an idea into written, tradable rules.",
    learn: [
      "Write a Spec card a peer can understand",
      "Attach a Risk Shell (max loss per trade and day)",
      "Kill ideas that need discretionary fog",
    ],
  },
  {
    id: "prove",
    n: "2",
    name: "Prove",
    oneLiner: "Test history fairly — with costs — then freeze.",
    learn: [
      "Baseline with fees and conservative slippage",
      "Freeze parameters (tweaks = new version)",
      "Out-of-sample / walk-forward honesty",
    ],
  },
  {
    id: "paper",
    n: "3",
    name: "Paper",
    oneLiner: "Live market, no (or tiny) capital — does the path continue?",
    learn: [
      "Run a fixed paper window on live data",
      "Journal every signal: taken, skipped, why",
      "Measure adherence — no mid-window retunes",
    ],
  },
  {
    id: "run",
    n: "4",
    name: "Run",
    oneLiner: "Real capital as a time-boxed campaign — then prune or retire.",
    learn: [
      "Start a campaign with dates and size policy",
      "Daily brakes, logging, and sick-strategy prune",
      "Retrospective → one lesson back into Build",
    ],
  },
] as const;

const ENTRY_PATHS = [
  {
    title: "Validate what you already trade",
    overview:
      "Import today’s rules into a Spec, run an honest Prove (costs on), then Paper before you scale size.",
    learn: [
      "Separate “I trade this” from “this earned capital”",
      "Find where the current edge fails OOS or on adherence",
      "Write a kill-or-keep decision with reasons",
    ],
  },
  {
    title: "Develop a new edge",
    overview:
      "Hypothesis first, Risk Shell always, many candidates, few survivors. Throughput is a feature.",
    learn: [
      "Generate simple, style-fit ideas without shiny-object chase",
      "Use the full Build → Prove → Paper filter",
      "Keep a small live book under a hard limit",
    ],
  },
] as const;

const CONNECTIONS = [
  {
    href: "/app/practice",
    title: "Practice Log",
    overview:
      "Trade Log and Journal — evidence for Paper and Run (fills, adherence, daily routine).",
    status: "live" as const,
  },
  {
    href: "/app/journey",
    title: "Journey",
    overview:
      "Curriculum progress. Life-cycle courseware will deep-link into each stage.",
    status: "live" as const,
  },
  {
    href: "/app",
    title: "Playbook",
    overview:
      "The rule book of allowed setups. Lab strategies should match what you actually trade.",
    status: "soon" as const,
  },
  {
    href: "/app",
    title: "Statistics",
    overview:
      "Process metrics — adherence and discipline, never profit claims as the headline.",
    status: "soon" as const,
  },
] as const;

/**
 * Courseware backlog — not yet in the catalog. Cards define intent for
 * development; no public course links until published.
 */
const COURSES = [
  {
    code: "SLC-01",
    title: "Strategy Life Cycle Overview",
    overview:
      "The whole map in one course: why most ideas die, how the four stages work together, and how this sits on FatTail doctrine (capital preservation first).",
    learn: [
      "Name and explain Build, Prove, Paper, and Run",
      "Use the one rule: kill early, capital only after paper",
      "Place the Lab next to Practice Log and Playbook",
    ],
  },
  {
    code: "SLC-02",
    title: "Build — Spec & Risk Shell",
    overview:
      "From raw idea to a written, tradable specification. Emphasis on explainability, defined risk, and style fit.",
    learn: [
      "Complete a Spec card a peer can follow",
      "Attach a Risk Shell with hard loss bounds",
      "Reject multi-timeframe / look-ahead structures",
    ],
  },
  {
    code: "SLC-03",
    title: "Prove — Fair History",
    overview:
      "Backtesting without fooling yourself: costs, freeze, out-of-sample checks, and metrics that matter (drawdown and expectancy over win rate).",
    learn: [
      "Run a costed baseline before optimizing",
      "Freeze params and document a version",
      "Read IS vs OOS degradation and decide kill or paper",
    ],
  },
  {
    code: "SLC-04",
    title: "Paper — Incubation",
    overview:
      "Forward test on live data with no (or tiny) capital. Adherence and path continuity beat a pretty historical curve.",
    learn: [
      "Design a paper window (sessions + min signals)",
      "Journal taken/skipped signals with reasons",
      "Pass or kill without mid-window retuning",
    ],
  },
  {
    code: "SLC-05",
    title: "Run — Campaigns & Prune",
    overview:
      "Real capital as a time-boxed campaign: size policy, daily brakes, logging, prune, and retrospective into the next Build cycle.",
    learn: [
      "Open and close a campaign with dates",
      "Apply a written size policy and risk brakes",
      "Retire sick strategies and extract one process lesson",
    ],
  },
  {
    code: "SLC-06",
    title: "Validate a Live Strategy",
    overview:
      "For traders who already run an edge: import current rules, stress-test honesty, and decide keep, paper, or kill — without building from zero.",
    learn: [
      "Capture what you actually trade today as a Spec",
      "Find the weakest gate (Prove vs Paper vs adherence)",
      "Produce a written keep / paper / kill decision",
    ],
  },
] as const;

// --- UI bits ------------------------------------------------------------------

function SectionHeader({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-5 max-w-2xl">
      <h2
        id={id}
        className="text-xl font-semibold tracking-tight text-[var(--color-label)]"
      >
        {title}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
        {children}
      </p>
    </header>
  );
}

function StatusBadge({ status }: { status: "live" | "soon" | "backlog" }) {
  if (status === "live") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Live
      </span>
    );
  }
  if (status === "backlog") {
    return (
      <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        In backlog
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
      Coming soon
    </span>
  );
}

export default function StrategyLifeCycleLandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 pb-16">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <span className="text-[var(--color-label)]">Strategy Life Cycle</span>
      </nav>

      {/* Hero — full width */}
      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Advanced trader · Apps
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-label)] sm:text-4xl">
          Strategy Life Cycle
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-[var(--color-label-secondary)]">
          Develop and validate strategies before they earn capital.{" "}
          <strong className="font-medium text-[var(--color-label)]">
            Most ideas die. Survivors get a campaign.
          </strong>
        </p>
        <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
          Four stages on the surface. Complete gates underneath. Process
          outcomes only — never profit promises.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[var(--color-fill)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
            Workspace coming soon
          </span>
          <span className="text-xs text-[var(--color-label-tertiary)]">
            This hub is the map · tool + courses ship from backlog
          </span>
        </div>
      </header>

      {/* —— The path —— */}
      <section className="mt-14" aria-labelledby="path-heading">
        <SectionHeader id="path-heading" title="The path">
          Four stages. Kill is normal at every gate — professional hygiene, not
          a failure of nerve.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          {STAGES.map((s) => (
            <li key={s.id} id={`stage-${s.id}`} className="scroll-mt-24">
              <article className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Stage {s.n}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-label)]">
                  {s.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                  {s.oneLiner}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  You will practice
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {s.learn.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* —— How you enter —— */}
      <section className="mt-14" aria-labelledby="enter-heading">
        <SectionHeader id="enter-heading" title="How you enter">
          Same four stages either way — different front door when the workspace
          ships.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          {ENTRY_PATHS.map((p) => (
            <li key={p.title}>
              <article className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <h3 className="text-lg font-semibold text-[var(--color-label)]">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {p.overview}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  You will learn
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {p.learn.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* —— The one rule —— */}
      <section className="mt-14" aria-labelledby="rule-heading">
        <SectionHeader id="rule-heading" title="The one rule">
          The scoreboard is process — not win rate.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <article className="surface-card h-full border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25">
              <h3 className="font-semibold text-[var(--color-label)]">
                Kill early
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                Most ideas die. A kill with a written reason is success of the
                filter. Capital only after Paper.
              </p>
            </article>
          </li>
          <li>
            <article className="surface-card h-full border border-[var(--color-separator)] p-5">
              <h3 className="font-semibold text-[var(--color-label)]">
                Metrics that matter
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                Drawdown bounds, expectancy / profit factor, adherence, and
                honest out-of-sample checks. Win rate is never the headline.
              </p>
            </article>
          </li>
        </ul>
      </section>

      {/* —— Connected tools —— */}
      <section className="mt-14" aria-labelledby="connect-heading">
        <SectionHeader id="connect-heading" title="Connected tools">
          The Life Cycle sits above Practice Log and Playbook — it does not
          replace them.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          {CONNECTIONS.map((c) => (
            <li key={c.title}>
              <article className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[var(--color-label)]">
                    {c.title}
                  </h3>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {c.overview}
                </p>
                {c.status === "live" ? (
                  <Link
                    href={c.href}
                    className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
                  >
                    Open →
                  </Link>
                ) : (
                  <p className="mt-4 text-xs text-[var(--color-label-tertiary)]">
                    On the Apps board when it ships.
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* —— Courseware hub (backlog) —— */}
      <section className="mt-14" aria-labelledby="courseware-heading">
        <SectionHeader id="courseware-heading" title="Courseware">
          Courses for this app — defined for the development backlog. Each card
          is an overview of what students will learn. Catalog links appear when
          a course is published.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          {COURSES.map((c) => (
            <li key={c.code}>
              <article className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-[var(--color-label-tertiary)]">
                    {c.code}
                  </span>
                  <StatusBadge status="backlog" />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[var(--color-label)]">
                  {c.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {c.overview}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Students will learn
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {c.learn.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          These titles are the backlog for course development. Assessment will
          stay process-only (gates, kills, adherence) — never P&amp;L grades.
          Published courses will appear in the{" "}
          <Link
            href="/course"
            className="text-[var(--color-tint)] hover:underline"
          >
            course library
          </Link>
          .
        </p>
      </section>

      <p className="mt-12 text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="text-[var(--color-tint)] hover:underline">
          ← All Apps
        </Link>
        {" · "}
        <Link
          href="/app/practice"
          className="text-[var(--color-tint)] hover:underline"
        >
          Practice Log
        </Link>
      </p>
    </main>
  );
}
