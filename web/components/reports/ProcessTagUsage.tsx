"use client";

/**
 * Process/behavior tag counts for Reports — Phase 0.
 * Never shows P&L or win-rate by tag (Spec §6.2 adjacency ban).
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchTagUsage,
  type TagUsageResponse,
} from "@/lib/tagsApi";

type Props = {
  fromDay?: string;
  toDay?: string;
  dateFilterActive: boolean;
};

export default function ProcessTagUsage({
  fromDay,
  toDay,
  dateFilterActive,
}: Props) {
  const [data, setData] = useState<TagUsageResponse | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "err" | "empty">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      const res = await fetchTagUsage({
        fromDay: dateFilterActive ? fromDay : undefined,
        toDay: dateFilterActive ? toDay : undefined,
        categories: "process,behavior",
      });
      setData(res);
      setState(res.tags.length === 0 ? "empty" : "ok");
    } catch (e) {
      setData(null);
      setState("err");
      setError(e instanceof Error ? e.message : "Could not load tag usage");
    }
  }, [fromDay, toDay, dateFilterActive]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section
      className="surface-card border border-[var(--color-separator)] p-4 sm:p-5"
      data-testid="process-tag-usage"
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2
            className="font-semibold text-[var(--color-label)]"
            style={{ fontSize: "var(--text-headline)" }}
          >
            Process labels
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-label-tertiary)]">
            How often you tagged behavior and process in this window — counts
            only, never P&amp;L.
          </p>
        </div>
        <Link
          href="/resource"
          className="text-xs font-medium text-[var(--color-tint)] hover:underline"
        >
          Lexicon
        </Link>
      </div>

      {state === "loading" && (
        <p className="text-sm text-[var(--color-label-tertiary)]">Loading…</p>
      )}
      {state === "err" && (
        <div className="text-sm text-[var(--color-label-secondary)]">
          <p data-testid="process-tag-usage-error">
            Could not load process labels.
          </p>
          {error && (
            <p className="mt-1 font-mono text-xs opacity-70">{error}</p>
          )}
          <button
            type="button"
            className="mt-2 text-[var(--color-tint)] underline"
            onClick={() => void load()}
          >
            Retry
          </button>
        </div>
      )}
      {state === "empty" && (
        <p
          className="text-sm text-[var(--color-label-tertiary)]"
          data-testid="process-tag-usage-empty"
        >
          No matches for process/behavior tags in this window. Label trades in
          the Trade Log sheet or journal days — optional, never required.
        </p>
      )}
      {state === "ok" && data && (
        <>
          <p className="mb-3 text-xs text-[var(--color-label-tertiary)]">
            {data.labeled_trade_assignments} trade label
            {data.labeled_trade_assignments === 1 ? "" : "s"}
            {" · "}
            {data.labeled_journal_session_assignments} journal label
            {data.labeled_journal_session_assignments === 1 ? "" : "s"}
          </p>
          <ul className="divide-y divide-[var(--color-separator)]">
            {data.tags.map((t) => (
              <li
                key={t.tag_id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-[var(--color-label)]">
                    {t.label}
                  </span>
                  <span className="ml-2 text-xs text-[var(--color-label-tertiary)]">
                    {t.category_key}
                  </span>
                </span>
                <span className="tabular-nums text-[var(--color-label-secondary)]">
                  {t.trade_count} trade
                  {t.trade_count === 1 ? "" : "s"}
                  {" · "}
                  {t.journal_session_count} day
                  {t.journal_session_count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
