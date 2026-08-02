"use client";

/**
 * Toughness hub — intentionally sparse for returners.
 * Text: short admin-editable blurb (site_pages) + today's daily rules list.
 * Programs / enroll / long about → suite nav + About this program link.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ToughnessShell from "@/components/hard/ToughnessShell";
import SectionHubShell from "@/components/section-hub/SectionHubShell";
import {
  enrollHard,
  exitHard,
  fetchHard,
  type HardSnapshot,
  type HardTask,
  type HardVariant,
  pauseHard,
} from "@/lib/hardApi";
import type { SitePage } from "@/lib/sitePage";

const FALLBACK_PAGE: SitePage = {
  slug: "toughness",
  title: "Toughness",
  description_md:
    "Complete every required activity every day. Miss one → restart day one.",
  intro_video_id: null,
  intro_video_title: "How Toughness programs work",
  faq_title: "Toughness FAQ",
  faq_description_md: null,
  faq_items: [],
};

/** Daily required activities for the active program (or FatTail default). */
function dailyTasksFromSnapshot(data: HardSnapshot): HardTask[] {
  if (data.variant?.tasks?.length) return data.variant.tasks;
  const en = data.active_enrollment;
  if (en) {
    const match = data.variants.find((v) => v.variant_id === en.variant_id);
    if (match?.tasks?.length) return match.tasks;
  }
  const fattail = data.variants.find((v) => v.program_kind === "fattail_hard");
  if (fattail?.tasks?.length) return fattail.tasks;
  return data.variants[0]?.tasks ?? [];
}

function CompactStatus({ data }: { data: HardSnapshot }) {
  const en = data.active_enrollment;
  if (!en) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/app/toughness/fattail-hard">
          <Button type="button">Start FatTail Hard</Button>
        </Link>
        <Link href="/app/toughness/true-75">
          <Button type="button" variant="secondary">
            True 75 Hard
          </Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-label)]">
      <span className="text-[var(--color-label-secondary)]">
        {en.program_kind === "true_75" ? "True 75" : "FatTail Hard"}
        {data.compliance
          ? ` · ${data.compliance.streak_days}d streak`
          : ""}
        {data.compliance?.today_complete ? " · today done" : ""}
      </span>
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
  );
}

function DailyRules({ tasks }: { tasks: HardTask[] }) {
  return (
    <section
      className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]"
      aria-labelledby="daily-rules-heading"
      data-testid="toughness-daily-rules"
    >
      <h2
        id="daily-rules-heading"
        className="text-base font-semibold text-[var(--color-label)]"
      >
        Daily rules
      </h2>
      {tasks.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
          Enroll in a program to see its daily checklist.
        </p>
      ) : (
        <ul className="mt-3 list-inside list-disc space-y-2 text-[15px] leading-relaxed text-[var(--color-label)]">
          {tasks.map((t) => (
            <li key={t.id}>{t.label}</li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-sm text-[var(--color-label-secondary)]">
        Miss or fail any required activity → restart from day one.
      </p>
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

  const tasks = useMemo(
    () => (data && typeof data === "object" ? dailyTasksFromSnapshot(data) : []),
    [data],
  );

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
          <DailyRules tasks={[]} />
          <p className="mt-6 text-sm text-[var(--color-label-secondary)]">
            <Link
              href="/login"
              className="font-medium text-[var(--color-tint)] hover:underline"
            >
              Log in
            </Link>{" "}
            to enroll and log today.
          </p>
          <p className="mt-4 text-sm">
            <Link
              href="/app/toughness/about"
              className="text-[var(--color-tint)] hover:underline"
            >
              About this program →
            </Link>
          </p>
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
      {/*
        Title + short admin-editable paragraph = SectionHubShell.
        Body: daily rules only (+ compact actions, about link).
      */}
      <SectionHubShell page={page}>
        <div className="space-y-6">
          {data.restart?.restarted ? (
            <p
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--color-label)]"
              role="status"
            >
              Restarted at <strong>day one</strong> after a missed or failed day.
            </p>
          ) : null}

          <CompactStatus data={data} />

          <DailyRules tasks={tasks} />

          <p className="text-center text-sm">
            <Link
              href="/app/toughness/about"
              className="font-medium text-[var(--color-tint)] hover:underline"
            >
              About this program →
            </Link>
          </p>
        </div>
      </SectionHubShell>
    </ToughnessShell>
  );
}

/** Enroll UI for FatTail variants (sub-page) */
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
      {err ? (
        <p className="text-sm text-[var(--color-destructive)]">{err}</p>
      ) : null}
      <ul className="space-y-3">
        {fattail.map((v) => (
          <li
            key={v.variant_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-separator)] p-4"
          >
            <div>
              <p className="font-medium text-[var(--color-label)]">{v.label}</p>
              {v.ladder_blurb ? (
                <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
                  {v.ladder_blurb}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              disabled={busy}
              onClick={() => void onEnroll(v)}
            >
              Enroll
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
