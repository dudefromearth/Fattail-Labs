"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { postJSON, putJSON, revalidate } from "@/lib/client";
import { appAlert } from "@/lib/dialogs";
import { IconButton, IconChevronLeft, IconChevronRight } from "@/components/ui";
import { walkCatalogOrder, type AppRow } from "@/lib/appsCatalog";

const HIGHLIGHT_ON =
  "border-[3px] border-[#1B4F8B] bg-[#EEF4FB] dark:border-[#7BA7D9] dark:bg-[#1B2C42]";
const HIGHLIGHT_OFF = "border border-[var(--color-separator)]";
const IOS_TRACK_OFF = "bg-[#E9E9EA] dark:bg-[#39393D]";
const IOS_TRACK_ON = "bg-[#1B4F8B] dark:bg-[#7BA7D9]";

function StatusBadge({ status }: { status: string }) {
  if (status === "soon") {
    return (
      <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
        Coming soon
      </span>
    );
  }
  if (status === "live") {
    return (
      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
        Live
      </span>
    );
  }
  return null;
}

function HighlightSwitch({
  title,
  on,
  disabled,
  onToggle,
}: {
  title: string;
  on: boolean;
  disabled: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`Highlight ${title}`}
      disabled={disabled}
      onClick={() => onToggle(!on)}
      className={[
        "relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4F8B]/40",
        disabled ? "cursor-wait opacity-70" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "pointer-events-none relative block h-[31px] w-[51px] rounded-full",
          "transition-colors duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]",
          on ? IOS_TRACK_ON : IOS_TRACK_OFF,
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[2px] left-[2px] box-border h-[27px] w-[27px] rounded-full bg-white",
            "shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]",
            "transition-transform duration-200 ease-[cubic-bezier(0.4,0.0,0.2,1)]",
            on ? "translate-x-[20px]" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function AppCard({
  t,
  highlightControl,
}: {
  t: AppRow;
  highlightControl?: React.ReactNode;
}) {
  // Wiki + Strategy Lab landing: open while workspace is still "soon".
  // Practice Log hub is live when Trade Log is.
  const canOpen =
    t.status === "live" ||
    t.slug === "wiki" ||
    t.slug === "practice-log" ||
    t.slug === "toughness" ||
    t.slug === "strategy-lab";
  const badgeStatus =
    t.slug === "practice-log" || t.slug === "toughness"
      ? "live"
      : t.slug === "strategy-lab"
        ? "soon"
        : t.status;
  return (
    <div
      data-highlighted={t.highlighted ? "true" : "false"}
      className={[
        "surface-card flex h-full flex-col p-5",
        t.highlighted ? HIGHLIGHT_ON : HIGHLIGHT_OFF,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2 pr-10">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">
          {t.title}
        </h2>
        <StatusBadge status={badgeStatus} />
      </div>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-label-secondary)]">
        {t.blurb}
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        {canOpen ? (
          <Link
            href={t.href || `/app/${t.slug}`}
            className="text-sm font-medium text-[var(--color-tint)] hover:underline"
          >
            Open →
          </Link>
        ) : (
          <p className="text-xs text-[var(--color-label-tertiary)]">
            Ships with the practice stack — process-first, not P&L theater.
          </p>
        )}
        {highlightControl}
      </div>
    </div>
  );
}

export default function AppsGrid({ apps }: { apps: AppRow[] }) {
  const isAdmin = useIsAdmin();
  const [orderBusy, setOrderBusy] = useState(false);
  const [highlightBusy, setHighlightBusy] = useState<string | null>(null);
  const [items, setItems] = useState(apps);
  useEffect(() => {
    setItems(apps);
  }, [apps]);

  const canReorder = isAdmin && items.length > 1 && items.every((a) => a.id > 0);

  async function moveApp(slug: string, dir: -1 | 1) {
    const i = items.findIndex((x) => x.slug === slug);
    if (i < 0 || items.length < 2) return;
    const walked = walkCatalogOrder(items, i, dir);
    const ids = walked.map((x) => x.id);
    if (ids.some((id) => !id)) return;
    const next = walked.map((x, pos) => ({ ...x, sort_order: (pos + 1) * 10 }));
    const prev = items;
    setItems(next);
    setOrderBusy(true);
    const r = await postJSON("/api/admin/apps/reorder", {
      app_ids: ids,
    }).catch(() => null);
    setOrderBusy(false);
    if (!r || !r.ok) {
      setItems(prev);
      await appAlert({
        title: "Reorder failed",
        message: r ? await r.text() : "Network error.",
      });
      return;
    }
    await revalidate(["/app"]);
  }

  async function setHighlighted(slug: string, next: boolean) {
    const row = items.find((x) => x.slug === slug);
    if (!row || row.id <= 0) return;
    const prev = items;
    setItems((cur) =>
      cur.map((x) => (x.slug === slug ? { ...x, highlighted: next } : x)),
    );
    setHighlightBusy(slug);
    const r = await putJSON(`/api/admin/apps/${row.id}`, {
      highlighted: next,
    }).catch(() => null);
    setHighlightBusy(null);
    if (!r || !r.ok) {
      setItems(prev);
      await appAlert({
        title: "Highlight failed",
        message: r ? await r.text() : "Network error.",
      });
      return;
    }
    await revalidate(["/app"]);
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {items.map((t) => (
        <li key={t.slug} className="relative">
          <AppCard
            t={t}
            highlightControl={
              isAdmin && t.id > 0 ? (
                <HighlightSwitch
                  title={t.title}
                  on={!!t.highlighted}
                  disabled={highlightBusy === t.slug}
                  onToggle={(next) => void setHighlighted(t.slug, next)}
                />
              ) : null
            }
          />
          {canReorder && (
            <div className="absolute right-2 top-2 z-20 flex overflow-hidden rounded-full bg-white/90 shadow dark:bg-zinc-900/90">
              <IconButton
                label={`Move ${t.title} left`}
                disabled={orderBusy}
                onClick={() => void moveApp(t.slug, -1)}
                className="!h-7 !w-7 !min-h-7 !min-w-7"
              >
                <IconChevronLeft size={14} />
              </IconButton>
              <IconButton
                label={`Move ${t.title} right`}
                disabled={orderBusy}
                onClick={() => void moveApp(t.slug, 1)}
                className="!h-7 !w-7 !min-h-7 !min-w-7"
              >
                <IconChevronRight size={14} />
              </IconButton>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
