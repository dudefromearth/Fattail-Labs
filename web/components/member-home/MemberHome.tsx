"use client";

// Member login-landing — /home.
// Layout reference only (landing.png): main = personal path; rail = standing
// (private personal scores + community presence you chose to share).

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CourseCard } from "@/lib/types";
import ProcessMeter, { type ProcessPayload } from "@/components/ProcessMeter";
import RetroCadenceNudge from "@/components/RetroCadenceNudge";

type Me = {
  display_name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
};

type Scores = {
  reputation: number;
  personal_growth: number;
  attendance_streak: number;
  contribution: number;
  journey_visible: boolean;
  rank: number | null;
  process?: ProcessPayload;
};

type Enrollment = {
  course: { slug: string; title: string; level: string };
  enrolled_at: string;
  completed_at: string | null;
  progress: { total: number; done: number; percent: number };
  resume: {
    module_slug: string;
    lesson_slug: string;
    title: string;
  } | null;
};

type BoardRow = {
  rank: number;
  display_name: string;
  avatar_url: string | null;
  reputation: number | null;
  personal_growth: number | null;
  attendance_streak: number | null;
  contribution: number;
  is_self: boolean;
};

type PathwayStep = { slug: string; title: string; percent: number; done: boolean };

function firstName(me: Me | null): string {
  if (!me) return "there";
  const n = (me.display_name || me.email || "").trim();
  if (!n) return "there";
  return n.split(/[\s@._-]+/)[0] || "there";
}

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function bannerStyle(c: CourseCard): React.CSSProperties {
  if (c.hero_image_url) {
    return {
      backgroundImage: `linear-gradient(120deg, rgba(6,78,59,0.75), rgba(16,185,129,0.35)), url(${c.hero_image_url})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  if (c.card_color) {
    return {
      background: `linear-gradient(135deg, ${c.card_color} 0%, #064e3b 100%)`,
    };
  }
  return {
    background: "linear-gradient(135deg, #064e3b 0%, #10b981 100%)",
  };
}

export default function MemberHome() {
  const [me, setMe] = useState<Me | null | "anon">(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
  const [catalog, setCatalog] = useState<CourseCard[]>([]);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [pathway, setPathway] = useState<PathwayStep[] | null>(null);
  const [tab, setTab] = useState<"progress" | "completed">("progress");
  const [boardSort, setBoardSort] = useState<"contribution" | "reputation" | "streak">(
    "contribution"
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/auth/me", { credentials: "same-origin" }),
      fetch("/api/me/journey/scores", { credentials: "same-origin" }),
      fetch("/api/me/enrollments", { credentials: "same-origin" }),
      fetch("/api/courses", { credentials: "same-origin" }),
      fetch("/api/journey/leaderboard", { credentials: "same-origin" }),
      fetch("/api/me/pathway", { credentials: "same-origin" }),
    ])
      .then(async ([mr, sr, er, cr, br, pr]) => {
        if (cancelled) return;
        if (mr.status === 401) {
          setMe("anon");
          return;
        }
        if (mr.ok) setMe(await mr.json());
        if (sr.ok) setScores(await sr.json());
        if (er.ok) {
          const e = await er.json();
          setEnrollments(e.enrollments ?? []);
        } else setEnrollments([]);
        if (cr.ok) {
          const c = await cr.json();
          setCatalog(c.courses ?? []);
        }
        if (br.ok) {
          const b = await br.json();
          setBoard(b.members ?? []);
        }
        if (pr.ok) {
          const p = await pr.json();
          setPathway(p?.pathway?.steps ?? []);
        } else setPathway([]);
      })
      .catch(() => {
        if (!cancelled) setMe("anon");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inProgress = useMemo(
    () =>
      (enrollments ?? []).filter(
        (e) => !e.completed_at && e.progress.percent < 100
      ),
    [enrollments]
  );
  const completed = useMemo(
    () => (enrollments ?? []).filter((e) => e.completed_at || e.progress.percent >= 100),
    [enrollments]
  );
  const primary = inProgress[0] ?? null;

  const enrolledSlugs = useMemo(
    () => new Set((enrollments ?? []).map((e) => e.course.slug)),
    [enrollments]
  );
  const recommended = useMemo(
    () => catalog.filter((c) => !enrolledSlugs.has(c.slug)).slice(0, 6),
    [catalog, enrolledSlugs]
  );

  const sortedBoard = useMemo(() => {
    const rows = [...board];
    rows.sort((a, b) => {
      if (boardSort === "reputation") {
        return (b.reputation ?? -1) - (a.reputation ?? -1);
      }
      if (boardSort === "streak") {
        return (b.attendance_streak ?? -1) - (a.attendance_streak ?? -1);
      }
      return b.contribution - a.contribution;
    });
    return rows.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));
  }, [board, boardSort]);

  const nextPathway = (pathway ?? []).find((s) => !s.done) ?? null;
  const meterProfileId = scores?.process?.profile?.id;
  /** G1: maximize Observer → Navigator + continued practice */
  const isG1Audience =
    meterProfileId === "observer_trial" ||
    meterProfileId === "free_observer" ||
    me === null ||
    (typeof me === "object" && me.role === "observer");

  if (me === null) {
    return (
      <p className="py-16 text-center text-sm text-[var(--color-label-tertiary)]">
        Loading your home…
      </p>
    );
  }
  if (me === "anon") {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-semibold">Sign in to open your home</h1>
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Your continue card, progress, and community board live here after login.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-full bg-[var(--color-tint)] px-6 py-2.5 text-sm font-medium text-white"
        >
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="lg:grid lg:grid-cols-[1fr_17.5rem] lg:gap-8">
        {/* ── Main column: personal path ── */}
        <div className="min-w-0 space-y-8">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-label)] sm:text-3xl">
              Welcome back, {firstName(me)}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-[var(--color-label-secondary)]">
              {isG1Audience && typeof me === "object" ? (
                <>
                  Your trial path: install a weekly practice habit and trust the
                  coaching. We&apos;re here to help you{" "}
                  <strong className="font-medium text-[var(--color-label)]">
                    continue as Navigator
                  </strong>{" "}
                  with that practice intact — process first, never P&amp;L theater.
                </>
              ) : (
                <>
                  Your learning path on the left. On the right: how you stand{" "}
                  <strong className="font-medium text-[var(--color-label)]">
                    personally
                  </strong>{" "}
                  (always private) and in the{" "}
                  <strong className="font-medium text-[var(--color-label)]">
                    community
                  </strong>{" "}
                  (only what you share on Profile).
                </>
              )}
            </p>
          </header>

          {/* Continue Learning hero */}
          <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-1)]">
            {primary ? (
              <div className="flex flex-col sm:flex-row">
                <div
                  className="relative h-36 w-full shrink-0 bg-emerald-900 sm:h-auto sm:w-44"
                  style={
                    catalog.find((c) => c.slug === primary.course.slug)
                      ? bannerStyle(
                          catalog.find((c) => c.slug === primary.course.slug)!
                        )
                      : undefined
                  }
                >
                  <div className="absolute inset-0 flex items-center justify-center text-white/80">
                    <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide">
                      Continue learning
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)]">
                    Pick up where you left off
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-[var(--color-label)]">
                    {primary.course.title}
                  </h2>
                  {primary.resume && (
                    <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                      Next: {primary.resume.title}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-fill)]">
                      <div
                        className="h-full rounded-full bg-[var(--color-tint)]"
                        style={{ width: `${primary.progress.percent}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-[var(--color-label-secondary)]">
                      {primary.progress.percent}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-label-tertiary)]">
                    {primary.progress.done}/{primary.progress.total} lessons
                    {primary.progress.percent >= 90
                      ? " — you're almost there"
                      : ""}
                  </p>
                  <div className="mt-4">
                    {primary.resume ? (
                      <Link
                        href={`/course/${primary.course.slug}/${primary.resume.module_slug}/${primary.resume.lesson_slug}`}
                        className="inline-block rounded-full bg-[var(--color-label)] px-5 py-2 text-sm font-medium text-[var(--color-surface)] hover:opacity-90"
                      >
                        Resume lesson
                      </Link>
                    ) : (
                      <Link
                        href={`/course/${primary.course.slug}`}
                        className="inline-block rounded-full bg-[var(--color-label)] px-5 py-2 text-sm font-medium text-[var(--color-surface)]"
                      >
                        Open course
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center sm:text-left">
                <p className="text-sm font-medium text-[var(--color-label)]">
                  Nothing in progress yet
                </p>
                <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                  Start with the flagship — capital preservation first.
                </p>
                <Link
                  href="/course"
                  className="mt-4 inline-block rounded-full bg-[var(--color-tint)] px-5 py-2 text-sm font-medium text-white"
                >
                  Browse courses
                </Link>
              </div>
            )}
          </section>

          {/* My Learning Progress */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-label)]">
                  My learning progress
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-label-secondary)]">
                  Personal path — enrollments and completion. Not shared unless
                  you opt in to personal growth on Profile.
                </p>
              </div>
              <Link
                href="/app/journey"
                className="text-xs font-medium text-[var(--color-tint)] hover:underline"
              >
                View all on Journey →
              </Link>
            </div>
            <div className="mt-3 flex gap-2">
              {(
                [
                  ["progress", "In progress", inProgress.length],
                  ["completed", "Completed", completed.length],
                ] as const
              ).map(([id, label, n]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    tab === id
                      ? "bg-[var(--color-tint)] text-white"
                      : "bg-[var(--color-fill)] text-[var(--color-label-secondary)] hover:bg-[var(--color-separator)]",
                  ].join(" ")}
                >
                  {label} ({n})
                </button>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(tab === "progress" ? inProgress : completed).slice(0, 4).map((e) => {
                const card = catalog.find((c) => c.slug === e.course.slug);
                return (
                  <article
                    key={e.course.slug}
                    className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)]"
                  >
                    <div
                      className="relative h-32"
                      style={card ? bannerStyle(card) : bannerStyle({
                        slug: e.course.slug,
                        title: e.course.title,
                        subtitle: "",
                        description_md: "",
                        hero_image_url: null,
                        card_color: null,
                        level: (e.course.level as CourseCard["level"]) || "beginner",
                        certification_enabled: false,
                        published_at: null,
                        enrolled_count: 0,
                        lesson_count: e.progress.total,
                        total_duration_seconds: 0,
                        review_count: 0,
                        avg_rating: null,
                        categories: [],
                        instructors: [],
                      })}
                    >
                      <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {tab === "progress" ? "In progress" : "Completed"}
                      </span>
                      <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">
                        {e.progress.percent}%
                      </span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold leading-snug text-[var(--color-label)]">
                        <Link
                          href={`/course/${e.course.slug}`}
                          className="hover:underline"
                        >
                          {e.course.title}
                        </Link>
                      </h3>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-fill)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-tint)]"
                          style={{ width: `${e.progress.percent}%` }}
                        />
                      </div>
                      <div className="mt-3">
                        {tab === "progress" && e.resume ? (
                          <Link
                            href={`/course/${e.course.slug}/${e.resume.module_slug}/${e.resume.lesson_slug}`}
                            className="text-sm font-medium text-[var(--color-tint)] hover:underline"
                          >
                            Resume learning →
                          </Link>
                        ) : (
                          <Link
                            href={`/course/${e.course.slug}`}
                            className="text-sm font-medium text-[var(--color-tint)] hover:underline"
                          >
                            Review course →
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {(tab === "progress" ? inProgress : completed).length === 0 && (
                <p className="col-span-full text-sm text-[var(--color-label-secondary)]">
                  {tab === "progress"
                    ? "No courses in progress."
                    : "No completed courses yet."}
                </p>
              )}
            </div>
          </section>

          {/* Recommended */}
          <section>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-label)]">
                  Recommended courses
                </h2>
                <p className="mt-0.5 text-sm text-[var(--color-label-secondary)]">
                  From the catalog — stop the bleeding first when you&apos;re new.
                </p>
              </div>
              <Link
                href="/course"
                className="text-xs font-medium text-[var(--color-tint)] hover:underline"
              >
                Browse course catalog →
              </Link>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((c) => (
                <article
                  key={c.slug}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)]"
                >
                  <div className="relative h-28" style={bannerStyle(c)}>
                    {c.categories[0] && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white">
                        {c.categories[0].name}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-semibold leading-snug">
                      <Link href={`/course/${c.slug}`} className="hover:underline">
                        {c.title}
                      </Link>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--color-label-secondary)]">
                      {c.subtitle || c.level}
                    </p>
                    <Link
                      href={`/course/${c.slug}`}
                      className="mt-2 inline-block text-xs font-medium text-[var(--color-tint)] hover:underline"
                    >
                      Learn more →
                    </Link>
                  </div>
                </article>
              ))}
              {recommended.length === 0 && (
                <p className="col-span-full text-sm text-[var(--color-label-secondary)]">
                  You&apos;re enrolled in everything we&apos;ve recommended — nice work.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* ── Right rail: dual standing ── */}
        <aside className="mt-10 space-y-5 lg:mt-0">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-label)]">
              Personal standing
            </h2>
            <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
              Private process meter — persistence with practice tools, daily
              routine, learning, live presence, plan adherence. Not trophies.
            </p>
            <div className="mt-3">
              {scores?.process ? (
                <ProcessMeter process={scores.process} compact />
              ) : (
                <p className="text-xs text-[var(--color-label-tertiary)]">
                  Loading process meter…
                </p>
              )}
            </div>
            {scores?.process && (
              <RetroCadenceNudge
                process={scores.process}
                className="mt-3"
              />
            )}
            <Link
              href="/app/journey"
              className="mt-3 block text-xs font-medium text-[var(--color-tint)] hover:underline"
            >
              Full Journey →
            </Link>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[var(--color-label)]">
                Community standing
              </h2>
              <Link
                href="/app/journey"
                className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-tint)] hover:underline"
              >
                View all
              </Link>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-label-tertiary)]">
              {scores?.journey_visible
                ? scores.rank != null
                  ? `You're on the board · rank #${scores.rank} (shared pillars only)`
                  : "You're visible — scores update as you contribute"
                : "Private by default — opt in on Profile to appear"}
            </p>
            <Link
              href="/me"
              className="mt-1 block text-[11px] font-medium text-[var(--color-tint)] hover:underline"
            >
              Tailor what you share →
            </Link>
            <div className="mt-2 flex flex-wrap gap-1">
              {(
                [
                  ["contribution", "Contribution"],
                  ["reputation", "Reputation"],
                  ["streak", "Streak"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setBoardSort(id)}
                  className={[
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    boardSort === id
                      ? "bg-[var(--color-tint)] text-white"
                      : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
            <ol className="mt-3 space-y-2">
              {sortedBoard.map((m) => (
                <li
                  key={`${m.rank}-${m.display_name}`}
                  className={[
                    "flex items-center gap-2 text-sm",
                    m.is_self ? "font-medium text-[var(--color-tint)]" : "",
                  ].join(" ")}
                >
                  <span className="w-5 text-xs text-[var(--color-label-tertiary)]">
                    #{m.rank}
                  </span>
                  {m.avatar_url ? (
                    <Image
                      src={m.avatar_url}
                      alt=""
                      width={24}
                      height={24}
                      unoptimized
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-tint)] text-[9px] font-semibold text-white">
                      {initials(m.display_name)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{m.display_name}</span>
                  <span className="tabular-nums text-xs text-[var(--color-label-secondary)]">
                    {boardSort === "reputation"
                      ? (m.reputation ?? "—")
                      : boardSort === "streak"
                        ? m.attendance_streak != null
                          ? `${m.attendance_streak}w`
                          : "—"
                        : m.contribution}
                  </span>
                </li>
              ))}
              {sortedBoard.length === 0 && (
                <li className="text-xs text-[var(--color-label-secondary)]">
                  No one on the board yet.{" "}
                  <Link href="/me" className="text-[var(--color-tint)] hover:underline">
                    Opt in
                  </Link>
                </li>
              )}
            </ol>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
            <h2 className="text-sm font-semibold text-[var(--color-label)]">
              Next steps
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {nextPathway ? (
                <li>
                  <Link
                    href={`/course/${nextPathway.slug}`}
                    className="text-[var(--color-tint)] hover:underline"
                  >
                    Pathway: {nextPathway.title} →
                  </Link>
                </li>
              ) : (
                <li>
                  <Link
                    href="/pathway"
                    className="text-[var(--color-tint)] hover:underline"
                  >
                    Take the pathway assessment →
                  </Link>
                </li>
              )}
              <li>
                <Link
                  href="/live"
                  className="text-[var(--color-tint)] hover:underline"
                >
                  Live sessions &amp; check-in →
                </Link>
              </li>
              <li>
                <Link
                  href="/app"
                  className="text-[var(--color-tint)] hover:underline"
                >
                  Practice apps →
                </Link>
              </li>
            </ul>
          </div>

          {isG1Audience && typeof me === "object" && (
            <div className="rounded-[var(--radius-lg)] border border-emerald-200/80 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/40">
              <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                Continue as Navigator
              </h2>
              <p className="mt-1 text-xs leading-snug text-emerald-900/80 dark:text-emerald-100/80">
                Your process meter tracks the habits that make coaching stick.
                When you&apos;re ready, Navigator keeps the continuous improvement
                path open — same practice, longer arc. No profit promises; fair
                course access if you leave after a full trial.
              </p>
              <Link
                href="/membership"
                className="mt-3 inline-block rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                See Navigator membership →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
