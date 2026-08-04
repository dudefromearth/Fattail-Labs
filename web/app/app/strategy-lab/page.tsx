import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/catalog";

/**
 * Strategy Lab hub — three-step life cycle:
 * Design → Curation → Deployment
 * Modes: Basic | Pro (same spine; Pro = progressive power)
 * (LifeCycle.pdf: Development / Curation / Live Campaign)
 * Workspace product ships later; this page orients members and curriculum.
 */

export const metadata: Metadata = {
  title: "Strategy Lab",
  description:
    "Design, Curation, Deployment — Basic or Pro. FatTail Strategy Lab for disciplined strategy books. Process over profit claims.",
  alternates: { canonical: siteUrl("/app/strategy-lab") },
};

// --- Content ------------------------------------------------------------------

/** Dual mode — same life cycle; different surface area. */
const MODES = [
  {
    id: "basic",
    name: "Basic",
    badge: "Default",
    oneLiner:
      "Templates, few choices, one-button tests, one strategy in the book. Finish the cycle without drowning.",
    design: [
      "Start from a template (e.g. afternoon iron condor)",
      "Few fields: structure, time, size, simple exit",
      "One-click test — costs on, holdout automatic",
      "Five numbers + plain-language verdict",
    ],
    curation: [
      "Focus on one strategy at a time",
      "Simple health: active or sick",
      "Size: 1 contract or fixed dollars",
    ],
    deployment: [
      "Guided paper-first campaign",
      "Clear start and end dates",
      "Log + short retrospective checklist",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Opt-in",
    oneLiner:
      "Full Spec power, variations, multi-strategy book, denser metrics — still the same three gates.",
    design: [
      "Blank Spec or templates; full strike recipes",
      "Stack filters, custom exits, slip stress",
      "A/B variations and richer metric pack",
      "Optional quant labels (train vs holdout, PF, …)",
    ],
    curation: [
      "Book limit (e.g. up to 3) with health labels",
      "Group / diversify notes",
      "Size policies: fixed risk, % capital, per strategy",
    ],
    deployment: [
      "Multi-strategy campaigns",
      "Prune tools and fuller campaign log",
      "Automation / bots later — frozen Spec only",
    ],
  },
] as const;

/** Primary spine — always three steps. */
const STAGES = [
  {
    id: "design",
    n: "1",
    name: "Design",
    oneLiner:
      "Turn a simple idea into written rules, then prove them honestly on history before they touch a book.",
    inside: [
      "Hypothesis — simple, style-fit, explainable in 30 seconds",
      "Model — market, structure, entry, exit, risk shell",
      "Test — costed backtest with a holdout the strategy never saw",
      "Sim check — optional paper on live data before the book",
    ],
    learn: [
      "Write a Spec a peer can follow",
      "Kill ideas that need discretionary fog",
      "Costs on, freeze params, read holdout honestly",
    ],
  },
  {
    id: "curation",
    n: "2",
    name: "Curation",
    oneLiner:
      "Choose which survivors join a small book — health, grouping, and size — not every design that “worked once.”",
    inside: [
      "Categorize — new, in-process, mature, or sick",
      "Group — low correlation, balanced risk, diversified where it helps",
      "Size — fixed dollar, fixed risk, or proportional to capital",
      "Monitor — quiet book vs signals that need attention",
    ],
    learn: [
      "Keep a hard book limit (few strategies, not dozens)",
      "Mark sick strategies early — RIP is professional hygiene",
      "Size from risk shell, not hope",
    ],
  },
  {
    id: "deployment",
    n: "3",
    name: "Deployment",
    oneLiner:
      "Run a time-boxed campaign: capital, dates, log, prune, retrospective — then feed lessons back into Design.",
    inside: [
      "Strategies in the campaign (frozen Specs only)",
      "Capital allocation across the book",
      "Start / end dates — campaigns end on purpose",
      "Log, prune, retrospective → next Design cycle",
    ],
    learn: [
      "Paper or tiny size before full capital",
      "No mid-campaign rule rewrites (new version = new Design)",
      "One written lesson after every campaign",
    ],
  },
] as const;

const ENTRY_PATHS = [
  {
    title: "Validate what you already trade",
    overview:
      "Capture today’s rules as a Design Spec, test honestly, then decide if it earns a Curation slot — or dies with a reason.",
    learn: [
      "Separate “I trade this” from “this earned a book slot”",
      "Find the weak gate: Design test vs adherence vs sick performance",
      "Write a keep / curate / kill decision",
    ],
  },
  {
    title: "Develop a new edge",
    overview:
      "Hypothesis first, many Designs, few curated. Throughput of honest kills is a feature.",
    learn: [
      "Generate simple, style-fit ideas without shiny-object chase",
      "Use Design → Curation → Deployment as the only path to capital",
      "Keep the live book under a hard limit",
    ],
  },
] as const;

const CONNECTIONS = [
  {
    href: "/app/practice",
    title: "Practice Log",
    overview:
      "Trade Log and Journal — evidence during Deployment (fills, adherence, daily routine).",
    status: "live" as const,
  },
  {
    href: "/app/journey",
    title: "Journey",
    overview:
      "Curriculum progress. Strategy Lab courseware deep-links into each of the three steps.",
    status: "live" as const,
  },
  {
    href: "/app",
    title: "Playbook",
    overview:
      "Allowed setups. Curated strategies should match what you actually trade.",
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

const COURSES = [
  {
    code: "SLC-01",
    title: "Strategy Lab Overview",
    overview:
      "The whole map: Design → Curation → Deployment, plus Basic vs Pro. Why most ideas die, why the book stays small, and how this sits on FatTail doctrine.",
    learn: [
      "Name and explain the three steps and when to use Basic vs Pro",
      "Use the one rule: kill early; capital only after Design gates",
      "Place the Lab next to Practice Log and Playbook",
    ],
  },
  {
    code: "SLC-02",
    title: "Design — Spec, Risk Shell & Test",
    overview:
      "Idea → model → costed history with holdout. Emphasis on explainability, defined risk, and honest kills.",
    learn: [
      "Complete a Spec and Risk Shell",
      "Run a costed test and read train vs holdout",
      "Freeze a version or kill with a written reason",
    ],
  },
  {
    code: "SLC-03",
    title: "Curation — Book & Health",
    overview:
      "Assemble a small team of strategies: health labels, grouping, and position sizing — not a pile of backtests.",
    learn: [
      "Categorize new / in-process / mature / sick",
      "Apply a hard book limit",
      "Choose a size policy aligned to risk tolerance",
    ],
  },
  {
    code: "SLC-04",
    title: "Deployment — Campaigns",
    overview:
      "Time-boxed live or paper campaigns: capital, log, prune, retrospective back into Design.",
    learn: [
      "Open and close a campaign with dates",
      "Log every session; prune sick strategies mid-campaign if needed",
      "Extract one process lesson for the next Design cycle",
    ],
  },
  {
    code: "SLC-05",
    title: "Validate a Live Strategy",
    overview:
      "For traders who already run an edge: import rules, re-run Design honesty, then curate or kill.",
    learn: [
      "Capture what you actually trade as a Spec",
      "Find the weakest gate",
      "Produce a written keep / curate / kill decision",
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

export default function StrategyLabLandingPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 pb-16">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        <span className="text-[var(--color-label)]">Strategy Lab</span>
      </nav>

      <header className="mt-4 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Advanced trader · Apps
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-label)] sm:text-4xl">
          Strategy Lab
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-[var(--color-label-secondary)]">
          The Strategy Life Cycle as software.{" "}
          <strong className="font-medium text-[var(--color-label)]">
            Design → Curation → Deployment.
          </strong>{" "}
          Two modes:{" "}
          <strong className="font-medium text-[var(--color-label)]">
            Basic
          </strong>{" "}
          and{" "}
          <strong className="font-medium text-[var(--color-label)]">Pro</strong>.
        </p>
        <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
          Same three steps for everyone. Basic keeps the path short. Pro opens
          power tools without skipping gates. Most ideas die in Design. Process
          outcomes only — never profit promises.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--color-label-secondary)]">
          <strong className="font-medium text-[var(--color-label)]">
            Execution partner:
          </strong>{" "}
          Tradier — paper/virtual first, then live. Optional TradingView alerts
          can feed signals; Labs owns Spec, brakes, and logs.
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

      {/* —— Modes —— */}
      <section className="mt-14" aria-labelledby="modes-heading">
        <SectionHeader id="modes-heading" title="Basic and Pro">
          One product, two surfaces. Toggle anytime — Pro is progressive
          disclosure, not a free pass past Design honesty.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          {MODES.map((m) => (
            <li key={m.id} id={`mode-${m.id}`} className="scroll-mt-24">
              <article
                className={
                  m.id === "basic"
                    ? "surface-card flex h-full flex-col border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25"
                    : "surface-card flex h-full flex-col border border-[var(--color-separator)] p-5"
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-[var(--color-label)]">
                    {m.name}
                  </h3>
                  <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
                    {m.badge}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {m.oneLiner}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Design
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {m.design.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Curation
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {m.curation.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Deployment
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {m.deployment.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
          <strong className="font-medium text-[var(--color-label)]">
            Rules both modes share:
          </strong>{" "}
          Risk Shell required · costs stay on for tests · no mid-campaign rule
          rewrites · kill with a written reason is success of the filter.
        </p>
      </section>

      {/* —— Three-step spine (visual) —— */}
      <section className="mt-14" aria-labelledby="spine-heading">
        <SectionHeader id="spine-heading" title="The three steps">
          One path in Basic and Pro. Kill is normal at every step — professional
          hygiene, not a failure of nerve.
        </SectionHeader>
        <ol className="flex flex-col gap-3 sm:flex-row sm:items-stretch sm:gap-2">
          {STAGES.map((s, i) => (
            <li key={s.id} className="flex min-w-0 flex-1 items-stretch gap-2">
              <a
                href={`#stage-${s.id}`}
                className="surface-card flex flex-1 flex-col border border-[var(--color-separator)] p-4 transition-colors hover:border-emerald-500/40"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Step {s.n}
                </p>
                <p className="mt-1 text-lg font-semibold text-[var(--color-label)]">
                  {s.name}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-label-secondary)]">
                  {s.id === "design" && "Idea · model · test · sim"}
                  {s.id === "curation" && "Health · group · size · monitor"}
                  {s.id === "deployment" && "Campaign · log · prune · retro"}
                </p>
              </a>
              {i < STAGES.length - 1 ? (
                <span
                  className="hidden self-center text-[var(--color-label-tertiary)] sm:inline"
                  aria-hidden
                >
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* —— Step detail —— */}
      <section className="mt-14" aria-labelledby="path-heading">
        <SectionHeader id="path-heading" title="Inside each step">
          Design is where the builder and backtester live. Curation protects the
          book. Deployment is a campaign with an end date.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          {STAGES.map((s) => (
            <li key={s.id} id={`stage-${s.id}`} className="scroll-mt-24">
              <article className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  Step {s.n}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--color-label)]">
                  {s.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                  {s.oneLiner}
                </p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-label-tertiary)]">
                  Includes
                </p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                  {s.inside.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
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

      {/* —— Execution rails —— */}
      <section className="mt-14" aria-labelledby="rails-heading">
        <SectionHeader id="rails-heading" title="Execution rails">
          Used mainly in Deployment (and optional Design sim). One broker target
          in v1 so the path is dogfoodable end-to-end.
        </SectionHeader>
        <ul className="grid gap-4 sm:grid-cols-2">
          <li>
            <article className="surface-card h-full border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900 dark:bg-emerald-950/25">
              <h3 className="font-semibold text-[var(--color-label)]">
                Tradier (target)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                Primary venue for paper and live campaigns. API-first, options
                multi-leg. Partnership path for distribution — not a black-box
                money machine.
              </p>
            </article>
          </li>
          <li>
            <article className="surface-card h-full border border-[var(--color-separator)] p-5">
              <h3 className="font-semibold text-[var(--color-label)]">
                TradingView (reach + funnel)
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                Charts, ideas, and optional alerts into Labs. Not the risk
                system of record. Webhooks create candidates; they do not
                silently size live capital.
              </p>
            </article>
          </li>
        </ul>
      </section>

      {/* —— How you enter —— */}
      <section className="mt-14" aria-labelledby="enter-heading">
        <SectionHeader id="enter-heading" title="How you enter">
          Same three steps either way — different front door when the workspace
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
                Most ideas die in Design. A kill with a written reason is the
                filter working. Capital only after Curation — never from a hot
                backtest alone.
              </p>
            </article>
          </li>
          <li>
            <article className="surface-card h-full border border-[var(--color-separator)] p-5">
              <h3 className="font-semibold text-[var(--color-label)]">
                Metrics that matter
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label-secondary)]">
                Drawdown bounds, expectancy, adherence, honest holdout checks,
                book health. Win rate is never the headline.
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

      {/* —— Courseware —— */}
      <section className="mt-14" aria-labelledby="courseware-heading">
        <SectionHeader id="courseware-heading" title="Courseware">
          Courses for this app — backlog. Assessment stays process-only (gates,
          kills, adherence) — never P&amp;L grades.
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
