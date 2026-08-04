"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import StrategyLabPortability from "@/components/strategy-lab/StrategyLabPortability";
import {
  listStrategies,
  moveStrategy,
  type StrategyLabStrategy,
} from "@/lib/strategyLabApi";

type Notice = { level: "info" | "success" | "warning" | "error"; message: string };

function phaseOf(s: StrategyLabStrategy): string {
  const p = (s.phase || "").toLowerCase();
  if (p === "design") return "development";
  return p || "development";
}

function badgeClass(state: string): string {
  if (state === "trashed") {
    return "bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200";
  }
  if (state === "retired" || state === "pruned") {
    return "bg-neutral-200 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
  }
  return "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
}

export default function StrategyLabArchiveApp() {
  const [strategies, setStrategies] = useState<StrategyLabStrategy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);

  const pushNotice = useCallback((level: Notice["level"], message: string) => {
    setNotices((n) => [...n.slice(-6), { level, message }]);
  }, []);

  const reload = useCallback(async () => {
    setError(null);
    const list = await listStrategies();
    if (!list) {
      setError("Sign in required — Archive strategies belong to your account.");
      setLoading(false);
      return;
    }
    const archived = list.strategies.filter((s) => phaseOf(s) === "bin");
    setStrategies(archived);
    if (selectedId && !archived.some((s) => s.id === selectedId)) {
      setSelectedId(archived[0]?.id ?? null);
    } else if (!selectedId && archived.length) {
      setSelectedId(archived[0].id);
    }
    setLoading(false);
  }, [selectedId]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount load
  }, []);

  const selected = useMemo(
    () => strategies.find((s) => s.id === selectedId) || null,
    [strategies, selectedId],
  );

  const q = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return strategies;
    return strategies.filter((s) => {
      const hay =
        `${s.name} ${s.description} ${s.id} ${s.version} ${s.phase_state} ${s.phase_state_label}`.toLowerCase();
      return hay.includes(q);
    });
  }, [strategies, q]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-24 sm:px-6">
        <StrategyLabChrome active="archive" hideTitle>
          <p className="mt-6 text-[var(--color-label-secondary)]">
            Loading Archive…
          </p>
        </StrategyLabChrome>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-10">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          Archive
        </h1>
        <p className="mt-3 text-[var(--color-label-secondary)]">{error}</p>
        <Link
          href="/app"
          className="mt-4 inline-block text-sm text-blue-600 hover:underline"
        >
          ← Apps
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-24 sm:px-6">
      <StrategyLabChrome active="archive">
        {/* Notices */}
        <div className="mt-4 min-h-[2.5rem] rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 shadow-sm">
          {notices.length === 0 ? (
            <p className="text-sm text-[var(--color-label-secondary)]">
              Archive holds retired and trashed strategies. Restore sends a strategy
              back to Development.{" "}
              <Link href="/app/strategy-lab" className="underline">
                ← Phase board
              </Link>
            </p>
          ) : (
            <div className="space-y-1">
              {notices.slice(-4).map((n, i) => (
                <p
                  key={`${n.message}-${i}`}
                  className={
                    "text-sm " +
                    (n.level === "error"
                      ? "text-red-600"
                      : n.level === "warning"
                        ? "text-amber-700"
                        : n.level === "success"
                          ? "text-emerald-700"
                          : "text-[var(--color-label)]")
                  }
                >
                  {n.message}
                </p>
              ))}
              <button
                type="button"
                className="text-xs text-[var(--color-label-secondary)] underline"
                onClick={() => setNotices([])}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="mt-4">
          <StrategyLabPortability
            onImported={() => {
              setLoading(true);
              void reload();
            }}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Retired strategies */}
          <section>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-label)]">
                  Retired strategies
                </h2>
                <p className="text-xs text-[var(--color-label-secondary)]">
                  Formerly the Receptacle Bin — off the phase board until restored.
                </p>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search archive…"
                className="w-full max-w-xs rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
              />
            </div>

            <div className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-sm">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-[var(--color-label-secondary)]">
                  {filtered.length} strateg
                  {filtered.length === 1 ? "y" : "ies"}
                </span>
              </div>

              <div className="max-h-[420px] space-y-1.5 overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-10 text-center text-sm text-[var(--color-label-secondary)]">
                    No retired strategies yet. Retire from a phase bin on the board.
                  </div>
                ) : (
                  filtered.map((s) => {
                    const active = s.id === selectedId;
                    const desc =
                      (s.description || "No description.").slice(0, 90) +
                      ((s.description || "").length > 90 ? "…" : "");
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedId(s.id)}
                        className={
                          "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left transition " +
                          (active
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                            : "border-[var(--color-separator)] bg-[var(--color-fill)] hover:border-blue-300")
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="truncate text-sm font-semibold text-[var(--color-label)]">
                              {s.name}
                            </span>
                            <span className="text-[0.7rem] font-semibold tabular-nums text-[var(--color-label-secondary)]">
                              v{s.version}
                            </span>
                          </div>
                          <p className="truncate text-xs text-[var(--color-label-secondary)]">
                            {desc}
                          </p>
                        </div>
                        <span
                          className={
                            "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold " +
                            badgeClass(s.phase_state)
                          }
                        >
                          {s.phase_state_label}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              {selected && (
                <div className="mt-4 border-t border-[var(--color-separator)] pt-4">
                  <h3 className="text-base font-semibold text-[var(--color-label)]">
                    {selected.name}
                  </h3>
                  <p className="font-mono text-xs text-[var(--color-label-secondary)]">
                    {selected.id} · v{selected.version} ·{" "}
                    {selected.phase_state_label}
                  </p>
                  {selected.description && (
                    <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                      {selected.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                      onClick={async () => {
                        const res = await moveStrategy(selected.id, {
                          phase: "development",
                        });
                        if (res.error) pushNotice("error", res.error);
                        else {
                          pushNotice(
                            "success",
                            `Restored “${selected.name}” → Development.`,
                          );
                          setSelectedId(null);
                          await reload();
                        }
                      }}
                    >
                      Restore → Development
                    </button>
                    <Link
                      href="/app/strategy-lab?phase=development"
                      className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-fill)]"
                    >
                      Open board
                    </Link>
                  </div>

                  {selected.lifecycle_log?.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-semibold">
                        Lifecycle log
                      </summary>
                      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-[var(--color-label-secondary)]">
                        {[...selected.lifecycle_log]
                          .reverse()
                          .slice(0, 30)
                          .map((e, i) => (
                            <li key={i} className="font-mono">
                              {String(e.at || "—")} · {String(e.event || "—")}
                              {e.from_phase != null &&
                                ` · ${String(e.from_phase)} → ${String(e.to_phase)}`}
                              {e.reason != null && ` · ${String(e.reason)}`}
                            </li>
                          ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Reports + Logs placeholders */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--color-label)]">
                Reports
              </h2>
              <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                Lifecycle and performance summaries for archived strategies —
                coming next.
              </p>
              <div className="mt-4 rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-8 text-center text-sm text-[var(--color-label-secondary)]">
                No archive reports yet.
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--color-label)]">
                Logs
              </h2>
              <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                System and lifecycle event streams across your Strategy Lab
                account.
              </p>
              <div className="mt-4 max-h-64 space-y-1 overflow-y-auto">
                {strategies.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-8 text-center text-sm text-[var(--color-label-secondary)]">
                    No log entries yet.
                  </div>
                ) : (
                  strategies
                    .flatMap((s) =>
                      (s.lifecycle_log || []).map((e) => ({
                        strategy: s.name,
                        at: String(e.at || ""),
                        event: String(e.event || "—"),
                        detail:
                          e.reason != null
                            ? String(e.reason)
                            : e.from_phase != null
                              ? `${String(e.from_phase)} → ${String(e.to_phase)}`
                              : "",
                      })),
                    )
                    .sort((a, b) => b.at.localeCompare(a.at))
                    .slice(0, 40)
                    .map((row, i) => (
                      <div
                        key={i}
                        className="rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-xs"
                      >
                        <span className="font-mono text-[var(--color-label-secondary)]">
                          {row.at || "—"}
                        </span>
                        <span className="mx-1.5 text-[var(--color-label)]">
                          {row.strategy}
                        </span>
                        <span className="text-[var(--color-label-secondary)]">
                          {row.event}
                          {row.detail ? ` · ${row.detail}` : ""}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </section>
          </div>
        </div>
      </StrategyLabChrome>
    </main>
  );
}
