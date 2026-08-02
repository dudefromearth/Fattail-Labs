"use client";

/**
 * Toughness hub — intentionally sparse for returners.
 * Text: short admin-editable blurb (site_pages) + today's daily rules list.
 * Programs / enroll / long about → suite nav + About this program link.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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

const DEFAULT_DAILY_RULES_MD = `- Movement / workout
- Reading (10 pages non-fiction)
- Diet integrity
- Water (body-weight scaled)
- Progress record
- No alcohol

Miss or fail any required activity → restart from day one.`;

const FALLBACK_PAGE: SitePage = {
  slug: "toughness",
  title: "Toughness",
  description_md:
    "Complete every required activity every day. Miss one → restart day one.",
  daily_rules_md: DEFAULT_DAILY_RULES_MD,
  intro_video_id: null,
  intro_video_title: "How Toughness programs work",
  faq_title: "Toughness FAQ",
  faq_description_md: null,
  faq_items: [],
};

const AFFORDANCE =
  "cursor-pointer rounded outline-dashed outline-1 outline-offset-4 outline-emerald-400/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30";

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
 * Daily rules slot — CMS site_pages.daily_rules_md (markdown).
 * Edit mode: click to open textarea; Save on the bar.
 */
function DailyRulesSlot({ fallbackMd }: { fallbackMd: string }) {
  const edit = useSectionHubEdit();
  const display =
    edit?.value("daily_rules_md", fallbackMd) ?? fallbackMd;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(display);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  const body = (
    <>
      <h2
        id="daily-rules-heading"
        className="text-base font-semibold text-[var(--color-label)]"
      >
        Daily rules
      </h2>
      {display.trim() ? (
        <div className="prose prose-zinc dark:prose-invert mt-3 max-w-none text-[15px] leading-relaxed text-[var(--color-label)] [&_ul]:my-2 [&_li]:my-1">
          <Markdown>{display}</Markdown>
        </div>
      ) : (
        <p className="mt-3 text-sm italic text-[var(--color-label-secondary)]">
          {edit?.editMode
            ? "Click to add daily rules (markdown list)…"
            : "Daily rules not set yet."}
        </p>
      )}
    </>
  );

  if (!edit?.editMode) {
    if (!display.trim() && !edit?.isAdmin) return null;
    return (
      <section
        className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]"
        aria-labelledby="daily-rules-heading"
        data-testid="toughness-daily-rules"
      >
        {body}
        {edit?.isAdmin && !display.trim() ? (
          <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
            Click Edit to fill this daily rules slot.
          </p>
        ) : null}
      </section>
    );
  }

  if (!editing) {
    return (
      <section
        role="button"
        tabIndex={0}
        className={`${AFFORDANCE} rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)]`}
        aria-labelledby="daily-rules-heading"
        data-testid="toughness-daily-rules"
        title="Click to edit daily rules"
        onClick={() => {
          setDraft(display);
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDraft(display);
            setEditing(true);
          }
        }}
      >
        {body}
        <p className="mt-3 text-[10px] font-medium uppercase tracking-wide text-emerald-600">
          Click to edit daily rules (markdown)
        </p>
      </section>
    );
  }

  const commit = () => {
    edit.setField("daily_rules_md", draft);
    setEditing(false);
  };

  return (
    <section
      className="rounded-2xl border border-emerald-500/50 bg-[var(--color-surface)] p-5 shadow-[var(--elevation-1)] ring-2 ring-emerald-500"
      aria-labelledby="daily-rules-heading"
      data-testid="toughness-daily-rules"
    >
      <h2
        id="daily-rules-heading"
        className="text-base font-semibold text-[var(--color-label)]"
      >
        Daily rules
      </h2>
      <textarea
        ref={areaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(display);
            setEditing(false);
          }
        }}
        rows={Math.max(8, draft.split("\n").length + 2)}
        placeholder={"- Movement / workout\n- Reading\n- …"}
        className="mt-3 w-full resize-y rounded-lg border-0 bg-transparent p-2 font-mono text-sm leading-relaxed text-[var(--color-label)] outline-none"
      />
      <p className="mt-2 text-xs text-[var(--color-label-secondary)]">
        Markdown list. Blur to apply, then <strong>Save</strong> on the bar.
      </p>
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

  const rulesFallback =
    page.daily_rules_md?.trim() || DEFAULT_DAILY_RULES_MD;

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
