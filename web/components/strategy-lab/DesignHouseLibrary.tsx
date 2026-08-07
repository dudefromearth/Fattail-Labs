"use client";

/**
 * FatTail house strategies — immutable managed list.
 * Admin versions only. Members apply or copy-and-rebuild.
 * Course refs link to curriculum.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  applyHouseDesign,
  fetchDesignLibrary,
  type HouseDesign,
} from "@/lib/strategyLabDesignsApi";
import type { StrategyConfig } from "@/lib/strategyPacks";

type Props = {
  strategyId: string;
  onApplied: (config: StrategyConfig, mode: "apply" | "copy_rebuild") => void;
  pushNotice?: (level: "info" | "success" | "warning" | "error", msg: string) => void;
};

export default function DesignHouseLibrary({
  strategyId,
  onApplied,
  pushNotice,
}: Props) {
  const [house, setHouse] = useState<HouseDesign[]>([]);
  const [note, setNote] = useState<string>("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [localOk, setLocalOk] = useState<string | null>(null);

  const load = useCallback(async () => {
    const lib = await fetchDesignLibrary("butterfly");
    if (!lib) {
      setErr("Could not load house design library");
      return;
    }
    setHouse(lib.house || []);
    setNote(lib.note || "");
    setErr(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onAction(d: HouseDesign, mode: "apply" | "copy_rebuild") {
    if (!strategyId?.trim()) {
      const m =
        "Select a bot in the Design board first — Apply / Copy & rebuild loads a house design onto that bot (it does not create a new board card).";
      setErr(m);
      pushNotice?.("warning", m);
      return;
    }
    setBusy(`${d.key}:${mode}`);
    setErr(null);
    setLocalOk(null);
    try {
      const res = await applyHouseDesign({
        strategyId,
        houseKey: d.key,
        houseVersion: d.version,
        mode,
      });
      if (res.error) {
        setErr(res.error);
        pushNotice?.("error", res.error);
        return;
      }
      const cfg = { ...d.config } as StrategyConfig;
      if (mode === "copy_rebuild") {
        cfg.name = `${d.name} (rebuild)`;
      }
      onApplied(cfg, mode);
      const ok =
        mode === "apply"
          ? `Applied house “${d.name}” v${d.version} to this bot (config + house binding saved; version bumped). Open the form steps or Choices panel to see fields.`
          : `Copy-rebuild of “${d.name}” v${d.version} loaded onto this bot — you may diverge; house list is unchanged.`;
      pushNotice?.("success", ok);
      setErr(null);
      setLocalOk(ok);
    } catch (e) {
      const m =
        e instanceof Error ? e.message : "House design action failed (network or server).";
      setErr(m);
      pushNotice?.("error", m);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3"
      data-testid="design-house-library"
    >
      <p className="mb-2 rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-[0.7rem] text-[var(--color-label-secondary)]">
        To <strong>mint a new bot</strong> from a house strategy, use{" "}
        <strong>+ Create bot</strong> on the Design bin (prefill Identity &amp;
        Structure, open at Risk &amp; Capital). Apply / Copy &amp; rebuild below
        load a house design onto the <em>selected</em> bot — they do not create
        a new card.
      </p>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            FatTail house strategies
          </h3>
          <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
            {note ||
              "Taught in courses. Versioned. Admin-maintained. Apply or copy-and-rebuild — cannot remove from this list."}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
          Admin versions only
        </span>
      </div>

      <p className="mb-2 text-[11px] text-[var(--color-label-secondary)]">
        <strong className="text-[var(--color-label)]">How this works:</strong>{" "}
        Apply / Copy &amp; rebuild write onto the <em>selected</em> Design bot — they
        do not add a new card to the left bin. Select a bot first, then use a button.
      </p>

      {err ? (
        <p className="mb-2 text-xs font-medium text-rose-600" role="alert">
          {err}
        </p>
      ) : null}
      {localOk && !err ? (
        <p className="mb-2 text-xs font-medium text-emerald-700" role="status">
          {localOk}
        </p>
      ) : null}

      <ul className="space-y-2">
        {house.map((d) => (
          <li
            key={`${d.key}@${d.version}`}
            className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]/40 p-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-semibold text-[var(--color-label)]">
                    {d.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-label-secondary)]">
                    v{d.version}
                  </span>
                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                    {d.dte_label}
                  </span>
                  <span className="text-[10px] text-[var(--color-label-secondary)]">
                    {d.family_label}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-[var(--color-label-secondary)]">
                  {d.summary}
                </p>
                {d.course_refs?.length ? (
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="text-[10px] font-semibold uppercase text-[var(--color-label-secondary)]">
                      Courses
                    </span>
                    {d.course_refs.map((c) => (
                      <Link
                        key={c.href + c.lesson_title}
                        href={c.href}
                        className="text-[10px] font-semibold text-blue-600 hover:underline"
                      >
                        {c.lesson_title || c.course_title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-1">
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void onAction(d, "apply")}
                  className="rounded-md bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy === `${d.key}:apply` ? "…" : "Apply"}
                </button>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void onAction(d, "copy_rebuild")}
                  className="rounded-md border border-[var(--color-separator)] px-2 py-1 text-[11px] font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
                >
                  {busy === `${d.key}:copy_rebuild` ? "…" : "Copy & rebuild"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
