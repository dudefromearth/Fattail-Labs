"use client";

/**
 * Toughness hub — intentionally sparse for returners.
 * Text: short admin-editable blurb (site_pages) + today's daily rules list.
 * Programs / enroll / long about → suite nav + About this program link.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Markdown from "@/components/Markdown";
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

/** Empty until CMS loads / admin writes — never force product copy. */
const FALLBACK_PAGE: SitePage = {
  slug: "toughness",
  title: "Toughness",
  description_md: "",
  daily_rules_md: "",
  intro_video_id: null,
  intro_video_title: "How Toughness programs work",
  faq_title: "Toughness FAQ",
  faq_description_md: null,
  faq_items: [],
};

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

/**
 * Daily rules — fully CMS-owned (site_pages.daily_rules_md).
 * In Edit mode the textarea is always open so you can replace the list freely.
 */
function DailyRulesSlot({ fallbackMd }: { fallbackMd: string }) {
  const edit = useSectionHubEdit();
  const display =
    edit?.value("daily_rules_md", fallbackMd) ?? fallbackMd;

  // --- Admin edit mode: always-open textarea (your rules, not hard-coded) ---
  if (edit?.editMode) {
    return (
      <section
        className="rounded-2xl border border-emerald-500/40 bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] ring-1 ring-emerald-500/30"
        aria-labelledby="daily-rules-heading"
        data-testid="toughness-daily-rules"
      >
        <h2
          id="daily-rules-heading"
          className="text-base font-semibold text-[var(--color-label)]"
        >
          Daily rules
        </h2>
        <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
          Edit freely (markdown). Replace every line if you want — then{" "}
          <strong>Save</strong> on the bar below.
        </p>
        <textarea
          value={display}
          onChange={(e) => edit.setField("daily_rules_md", e.target.value)}
          rows={Math.max(10, display.split("\n").length + 3)}
          placeholder={
            "- First daily requirement\n- Second…\n\nAny notes you want members to see."
          }
          className="mt-3 w-full resize-y rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-3 font-mono text-sm leading-relaxed text-[var(--color-label)] outline-none focus:ring-2 focus:ring-emerald-500"
          data-testid="toughness-daily-rules-editor"
        />
      </section>
    );
  }

  // --- Member / view mode ---
  if (!display.trim()) {
    if (!edit?.isAdmin) return null;
    return (
      <section
        className="rounded-2xl border border-dashed border-emerald-400/50 bg-[var(--color-fill)]/30 p-5"
        data-testid="toughness-daily-rules-slot"
      >
        <h2 className="text-base font-semibold text-[var(--color-label)]">
          Daily rules
        </h2>
        <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
          Empty slot. Click <strong>Edit</strong> and type the rules members
          should follow each day.
        </p>
      </section>
    );
  }

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
      <div className="prose prose-zinc dark:prose-invert mt-3 max-w-none text-[15px] leading-relaxed text-[var(--color-label)] [&_ul]:my-2 [&_li]:my-1">
        <Markdown>{display}</Markdown>
      </div>
    </section>
  );
}

/**
 * Intro video slot under the short blurb.
 * CMS: site_pages.intro_video_id (Edit → YouTube URL/id on the hub).
 */
function HubVideo({
  pageVideoId,
  pageVideoTitle,
  snapshotVideoId,
}: {
  pageVideoId: string | null;
  pageVideoTitle: string | null;
  snapshotVideoId?: string | null;
}) {
  const edit = useSectionHubEdit();
  const raw =
    edit?.value("intro_video_id", pageVideoId ?? "") ||
    pageVideoId ||
    snapshotVideoId ||
    "";
  const title =
    edit?.value(
      "intro_video_title",
      pageVideoTitle ?? "About this program",
    ) ||
    pageVideoTitle ||
    "About this program";
  const videoId = parseYoutubeVideoId(raw);

  if (videoId) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-[var(--color-separator)] bg-black shadow-[var(--elevation-1)]"
        data-testid="toughness-hub-video"
      >
        <iframe
          title={title}
          src={youtubeEmbedUrl(videoId)}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  // Reserved slot so admins know where the video goes (and members see nothing noisy).
  if (edit?.editMode || edit?.isAdmin) {
    return (
      <div
        className="flex aspect-video flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/50 bg-[var(--color-fill)]/40 px-6 text-center"
        data-testid="toughness-hub-video-slot"
      >
        <p className="text-sm font-medium text-[var(--color-label)]">
          Video slot
        </p>
        <p className="mt-1 max-w-sm text-xs text-[var(--color-label-secondary)]">
          {edit?.editMode
            ? "Paste a YouTube URL in the Intro video fields above the title area, then Save."
            : "Click Edit, then set Intro video (YouTube URL or id)."}
        </p>
      </div>
    );
  }

  return null;
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

  const rulesFallback = page.daily_rules_md ?? "";

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
          <div className="space-y-6">
            <HubVideo
              pageVideoId={page.intro_video_id}
              pageVideoTitle={page.intro_video_title}
            />
            <DailyRulesSlot fallbackMd={rulesFallback} />
            <p className="text-sm text-[var(--color-label-secondary)]">
              <Link
                href="/login"
                className="font-medium text-[var(--color-tint)] hover:underline"
              >
                Log in
              </Link>{" "}
              to enroll and log today.
            </p>
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
        Title + short blurb → video → status → daily rules (CMS) → about.
      */}
      <SectionHubShell page={page}>
        <div className="space-y-6">
          <HubVideo
            pageVideoId={page.intro_video_id}
            pageVideoTitle={page.intro_video_title}
            snapshotVideoId={data.how_it_works?.intro_video_id}
          />

          {data.restart?.restarted ? (
            <p
              className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-[var(--color-label)]"
              role="status"
            >
              Restarted at <strong>day one</strong> after a missed or failed day.
            </p>
          ) : null}

          <CompactStatus data={data} />

          <DailyRulesSlot fallbackMd={rulesFallback} />

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
