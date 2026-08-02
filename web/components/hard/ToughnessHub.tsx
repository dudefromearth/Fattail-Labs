"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ToughnessShell from "@/components/hard/ToughnessShell";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import { useSectionHubEdit } from "@/components/section-hub/SectionHubEditContext";
import {
  enrollHard,
  exitHard,
  fetchHard,
  type HardSnapshot,
  type HardVariant,
  pauseHard,
} from "@/lib/hardApi";
import { parseYoutubeVideoId, youtubeEmbedUrl } from "@/lib/hub";
import type { SitePage } from "@/lib/sitePage";

const FALLBACK_PAGE: SitePage = {
  slug: "toughness",
  title: "Toughness",
  description_md:
    "Voluntary capacity training under load. Process only — never required for membership.",
  intro_video_id: null,
  intro_video_title: "How Toughness programs work",
  faq_title: "Toughness FAQ",
  faq_description_md: null,
  faq_items: [],
};

function StatusCard({ data }: { data: HardSnapshot }) {
  const mt = data.mental_toughness;
  const en = data.active_enrollment;
  return (
    <section className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]">
      <h2 className="text-base font-semibold text-[var(--color-label)]">
        Your status
      </h2>
      {!en ? (
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Not enrolled. Mental Toughness is empty until you start a challenge —
          it does not score zero.
        </p>
      ) : (
        <div className="mt-3 space-y-2 text-sm text-[var(--color-label)]">
          <p>
            <span className="text-[var(--color-label-secondary)]">Program:</span>{" "}
            {en.program_kind === "true_75" ? "True 75 Hard" : "FatTail Hard"} ·{" "}
            {data.variant?.label ?? en.variant_id}
          </p>
          <p>
            <span className="text-[var(--color-label-secondary)]">Status:</span>{" "}
            {en.status}
          </p>
          {data.compliance ? (
            <p>
              <span className="text-[var(--color-label-secondary)]">
                Streak:
              </span>{" "}
              {data.compliance.streak_days}d · completion{" "}
              {Math.round(data.compliance.completion_rate * 100)}% (window) ·
              today{" "}
              {data.compliance.today_complete ? "complete" : "not complete"}
            </p>
          ) : null}
          <p>
            <span className="text-[var(--color-label-secondary)]">
              Mental Toughness:
            </span>{" "}
            {mt.empty
              ? "empty"
              : `${mt.raw_percent ?? "—"}% process compliance`}
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/app/toughness/today">
              <Button type="button">Today&apos;s log</Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await pauseHard();
                window.location.reload();
              }}
            >
              Pause
            </Button>
            <Button
              type="button"
              variant="plain"
              onClick={async () => {
                if (
                  !window.confirm(
                    "Exit this challenge? Mental Toughness returns to empty.",
                  )
                )
                  return;
                await exitHard();
                window.location.reload();
              }}
            >
              Exit
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function ProgramCard({
  title,
  blurb,
  href,
  credit,
  badge = "Live",
}: {
  title: string;
  blurb: string;
  href: string;
  credit?: string | null;
  badge?: string;
}) {
  return (
    <div
      className="surface-card flex h-full flex-col border border-[var(--color-separator)] p-5"
      data-testid="toughness-program-card"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-[var(--color-label)]">
          {title}
        </h3>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {badge}
        </span>
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
        {blurb}
      </p>
      {credit ? (
        <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
          {credit}
        </p>
      ) : null}
      <Link
        href={href}
        className="mt-4 text-sm font-medium text-[var(--color-tint)] hover:underline"
      >
        Open →
      </Link>
    </div>
  );
}

/**
 * Compact hub explainer: video (if set) + link to the full guide.
 * Long rules / ladder / physiology live on /app/toughness/about.
 */
function IntroStrip({
  snapshotVideoId,
  fallbackVideoId,
  fallbackVideoTitle,
}: {
  snapshotVideoId: string | null;
  fallbackVideoId: string | null;
  fallbackVideoTitle: string | null;
}) {
  const edit = useSectionHubEdit();
  const rawId =
    edit?.value("intro_video_id", fallbackVideoId ?? "") ||
    fallbackVideoId ||
    snapshotVideoId ||
    null;
  const title =
    edit?.value(
      "intro_video_title",
      fallbackVideoTitle ?? "How Toughness programs work",
    ) ||
    fallbackVideoTitle ||
    "How Toughness programs work";
  const videoId = parseYoutubeVideoId(rawId);

  return (
    <section
      className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 sm:p-5"
      data-testid="toughness-intro-strip"
      aria-labelledby="toughness-intro-heading"
    >
      <h2
        id="toughness-intro-heading"
        className="sr-only"
      >
        Program intro
      </h2>
      {videoId ? (
        <div className="aspect-video overflow-hidden rounded-xl border border-[var(--color-separator)] bg-black">
          <iframe
            title={title}
            src={youtubeEmbedUrl(videoId)}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : null}
      <p className="mt-3 text-center text-sm">
        <Link
          href="/app/toughness/about"
          className="font-medium text-[var(--color-tint)] hover:underline"
        >
          About this program →
        </Link>
      </p>
      {!videoId ? (
        <p className="mt-1 text-center text-xs text-[var(--color-label-secondary)]">
          Rules, ladder, and physiology on the about page.
        </p>
      ) : null}
    </section>
  );
}

export default function ToughnessHub() {
  const [data, setData] = useState<HardSnapshot | null | "anon" | "err">(null);
  const [page, setPage] = useState<SitePage>(FALLBACK_PAGE);

  const load = useCallback(() => {
    fetch("/api/site-pages/toughness", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p: SitePage | null) => {
        if (p?.slug) setPage(p);
      })
      .catch(() => {});

    fetchHard()
      .then((d) => {
        if (!d) {
          return fetch("/api/me/hard", { credentials: "same-origin" }).then(
            (r) => {
              if (r.status === 401) setData("anon");
              else setData("err");
            },
          );
        } else setData(d);
      })
      .catch(() => setData("err"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (data === null) {
    return (
      <ToughnessShell>
        <p className="mt-8 text-sm text-[var(--color-label-secondary)]">
          Loading…
        </p>
      </ToughnessShell>
    );
  }
  if (data === "anon") {
    return (
      <ToughnessShell>
        <SectionHubShell page={page}>
          <p className="text-[var(--color-label-secondary)]">
            Sign in to enroll in FatTail Hard or True 75 Hard.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-[var(--color-tint)] hover:underline"
          >
            Log in
          </Link>
        </SectionHubShell>
      </ToughnessShell>
    );
  }
  if (data === "err") {
    return (
      <ToughnessShell>
        <SectionHubShell page={page}>
          <p className="text-sm text-[var(--color-destructive)]">
            Could not load Toughness. Try again later.
          </p>
        </SectionHubShell>
      </ToughnessShell>
    );
  }

  return (
    <ToughnessShell>
      <SectionHubShell page={page}>
        {/*
          Returner-first layout: status + programs first.
          Long explanation is video + link to /about — not a wall of text.
        */}
        <div className="space-y-6">
          {data.restart?.restarted ? (
            <p
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--color-label)]"
              role="status"
            >
              Missed or failed day — your program restarted at{" "}
              <strong>day one</strong>. Complete every required activity each
              day without fail.
            </p>
          ) : null}

          <StatusCard data={data} />

          <section aria-labelledby="toughness-programs-heading">
            <h2
              id="toughness-programs-heading"
              className="text-base font-semibold text-[var(--color-label)]"
            >
              Programs
            </h2>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2">
              <li>
                <ProgramCard
                  title="True 75 Hard"
                  blurb="75 days. Andy Frisella’s program, as-is with full credit. Optional honor tracking."
                  href="/app/toughness/true-75"
                  credit="Credit: Andy Frisella · True 75 Hard"
                />
              </li>
              <li>
                <ProgramCard
                  title="FatTail Hard"
                  blurb="20 → 40 → 75 ladder. Fail a day → restart day one."
                  href="/app/toughness/fattail-hard"
                />
              </li>
            </ul>
          </section>

          <IntroStrip
            snapshotVideoId={data.how_it_works?.intro_video_id ?? null}
            fallbackVideoId={page.intro_video_id}
            fallbackVideoTitle={page.intro_video_title}
          />

          <p className="text-center text-sm text-[var(--color-label-secondary)]">
            <Link href="/app" className="hover:underline">
              ← All Apps
            </Link>
            {" · "}
            <Link href="/app/journey" className="hover:underline">
              Journey
            </Link>
            {" · "}
            <Link href="/app/toughness/about" className="hover:underline">
              About this program
            </Link>
          </p>
        </div>
      </SectionHubShell>
    </ToughnessShell>
  );
}

/** Enroll UI for FatTail variants */
export function FatTailEnrollPanel() {
  const [data, setData] = useState<HardSnapshot | null | "err">(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchHard()
      .then((d) => setData(d ?? "err"))
      .catch(() => setData("err"));
  }, []);

  if (data === null) {
    return (
      <p className="mt-6 text-sm text-[var(--color-label-secondary)]">
        Loading…
      </p>
    );
  }
  if (data === "err") {
    return (
      <p className="mt-6 text-sm text-[var(--color-destructive)]">
        Could not load variants.
      </p>
    );
  }

  const fattail = data.variants.filter((v) => v.program_kind === "fattail_hard");

  async function onEnroll(v: HardVariant) {
    setBusy(true);
    setErr(null);
    const r = await enrollHard(v.program_kind, v.variant_id);
    setBusy(false);
    if (!r.ok) {
      const j = (await r.json().catch(() => ({}))) as { detail?: string };
      setErr(j.detail || `Enroll failed (${r.status})`);
      return;
    }
    window.location.href = "/app/toughness/today";
  }

  return (
    <div className="mt-6 space-y-4">
      {data.active_enrollment ? (
        <p className="text-sm text-[var(--color-label-secondary)]">
          You already have an active challenge.{" "}
          <Link href="/app/toughness/today" className="text-[var(--color-tint)]">
            Go to today&apos;s log
          </Link>{" "}
          or exit from the hub first.
        </p>
      ) : (
        fattail.map((v) => (
          <div
            key={v.variant_id}
            className="rounded-2xl border border-[var(--color-separator)] p-5"
          >
            <h3 className="font-semibold text-[var(--color-label)]">{v.label}</h3>
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              {v.sprint_days}-day program · all required tasks every day · miss
              → restart day one ·{" "}
              {v.tasks.filter((t) => t.required).length} daily required tasks
            </p>
            {v.ladder_blurb ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-label)]">
                {v.ladder_blurb}
              </p>
            ) : null}
            <ul className="mt-3 list-inside list-disc text-sm text-[var(--color-label-secondary)]">
              {v.tasks.map((t) => (
                <li key={t.id}>{t.label}</li>
              ))}
            </ul>
            <div className="mt-4">
              <Button
                type="button"
                disabled={busy}
                onClick={() => onEnroll(v)}
              >
                Enroll voluntarily
              </Button>
            </div>
          </div>
        ))
      )}
      {err ? (
        <p className="text-sm text-[var(--color-destructive)]" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
