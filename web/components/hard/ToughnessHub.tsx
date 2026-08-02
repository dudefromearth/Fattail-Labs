"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import HowItWorks from "@/components/hard/HowItWorks";
import PhysiologyCite from "@/components/hard/PhysiologyCite";
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
import type { SitePage } from "@/lib/sitePage";

const FALLBACK_PAGE: SitePage = {
  slug: "toughness",
  title: "Toughness",
  description_md:
    "Voluntary capacity training for persistence under load — part of Process Integrity's Mental Toughness story. Never a membership requirement; never P&L theater.",
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

/** Prefer CMS intro video (live edit value) over hard snapshot / env. */
function HowItWorksWithCms({
  block,
  fallbackVideoId,
  fallbackVideoTitle,
}: {
  block?: HardSnapshot["how_it_works"] | null;
  fallbackVideoId: string | null;
  fallbackVideoTitle: string | null;
}) {
  const edit = useSectionHubEdit();
  const cmsId =
    edit?.value("intro_video_id", fallbackVideoId ?? "") ||
    fallbackVideoId ||
    null;
  const cmsTitle =
    edit?.value("intro_video_title", fallbackVideoTitle ?? "") ||
    fallbackVideoTitle ||
    null;
  const base = block ?? undefined;
  const merged = {
    ...(base || {}),
    intro_video_id: (cmsId || base?.intro_video_id || null) as string | null,
    intro_video_title: (cmsTitle ||
      base?.intro_video_title ||
      null) as string | null,
  };
  return <HowItWorks block={merged as HardSnapshot["how_it_works"]} />;
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

  const phys = data.physiology;

  return (
    <ToughnessShell>
      <SectionHubShell page={page}>
        <div className="space-y-6">
          <HowItWorksWithCms
            block={data.how_it_works}
            fallbackVideoId={page.intro_video_id}
            fallbackVideoTitle={page.intro_video_title}
          />

          <PhysiologyCite
            citation={phys.primary.citation}
            doi={phys.primary.doi}
            note={phys.note}
          />

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
            <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
              These programs develop Mental Toughness. Pick a length, enroll,
              and complete every required activity every day — or start over at
              day one.
            </p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              <li>
                <ProgramCard
                  title="True 75 Hard"
                  blurb="75 days. The original free program by Andy Frisella — offered as-is with full credit. Optional honor-system tracking so Mental Toughness can reflect your show-up."
                  href="/app/toughness/true-75"
                  credit="Credit: Andy Frisella · True 75 Hard"
                />
              </li>
              <li>
                <ProgramCard
                  title="FatTail Hard"
                  blurb="20 → 40 → 75. Finish 20 and you may stop or continue; many need 20 twice before 40 feels possible. At 40 most hit despair — get through it and the end is reachable. Fail a day → day one."
                  href="/app/toughness/fattail-hard"
                />
              </li>
            </ul>
          </section>

          <p className="text-center text-sm text-[var(--color-label-secondary)]">
            <Link href="/app" className="hover:underline">
              ← All Apps
            </Link>
            {" · "}
            <Link href="/app/journey" className="hover:underline">
              Journey
            </Link>
            {" · "}
            <Link href="/app/practice" className="hover:underline">
              Practice
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
