"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import StrategyLabPortability from "@/components/strategy-lab/StrategyLabPortability";
import {
  BOARD_PHASE_ORDER,
  PHASE_HINTS,
  advanceState,
  binStrategy,
  createStrategy,
  listStrategies,
  moveStrategy,
  patchStrategy,
  promoteStrategy,
  type BoardPhaseKey,
  type PhaseKey,
  type PhaseMeta,
  type StrategyLabStrategy,
  fetchStrategyLabMeta,
} from "@/lib/strategyLabApi";
import type { StrategyLabSuiteId } from "@/lib/strategyLabSuite";

type Notice = { level: "info" | "success" | "warning" | "error"; message: string };

function phaseOf(s: StrategyLabStrategy): PhaseKey {
  const p = (s.phase || "development").toLowerCase();
  if (p === "design") return "development";
  if (
    p === "development" ||
    p === "curation" ||
    p === "deployment" ||
    p === "bin"
  ) {
    return p;
  }
  return "development";
}

function isBoardPhase(p: PhaseKey): p is BoardPhaseKey {
  return (
    p === "development" || p === "curation" || p === "deployment"
  );
}

function suiteActiveFromPhase(p: PhaseKey): StrategyLabSuiteId {
  if (p === "bin") return "archive";
  if (isBoardPhase(p)) return p;
  return "development";
}

function sortStrategies(
  items: StrategyLabStrategy[],
  mode: string,
  meta: PhaseMeta | undefined,
): StrategyLabStrategy[] {
  const order = new Map(
    (meta?.states || []).map((st, i) => [st.key, i] as const),
  );
  const ts = (s: StrategyLabStrategy) => s.updated_at || s.created_at || "";
  if (mode === "oldest") {
    return [...items].sort((a, b) => ts(a).localeCompare(ts(b)));
  }
  if (mode === "state") {
    const newest = [...items].sort((a, b) => ts(b).localeCompare(ts(a)));
    return newest.sort(
      (a, b) =>
        (order.get(a.phase_state) ?? 99) - (order.get(b.phase_state) ?? 99),
    );
  }
  return [...items].sort((a, b) => ts(b).localeCompare(ts(a)));
}

function badgeClass(state: string): string {
  const map: Record<string, string> = {
    hypothesis: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
    model: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    is_test: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    oos_test: "bg-cyan-50 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200",
    deployed: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    categorized: "bg-blue-50 text-blue-700",
    grouped: "bg-amber-50 text-amber-800",
    position_sized: "bg-cyan-50 text-cyan-800",
    monitored: "bg-emerald-50 text-emerald-800",
    strategy: "bg-blue-50 text-blue-700",
    capital_allocation: "bg-sky-50 text-sky-800",
    scheduled: "bg-amber-50 text-amber-800",
    started: "bg-emerald-50 text-emerald-800",
    paused: "bg-red-50 text-red-800",
    stopped: "bg-red-50 text-red-700",
    ended: "bg-emerald-50 text-emerald-800",
    pruned: "bg-neutral-200 text-neutral-700",
    retrospective: "bg-violet-50 text-violet-800",
    retired: "bg-neutral-200 text-neutral-700",
    trashed: "bg-red-50 text-red-800",
  };
  return map[state] || "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200";
}

export default function StrategyLabApp() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phaseParam = searchParams.get("phase");

  const [strategies, setStrategies] = useState<StrategyLabStrategy[]>([]);
  const [meta, setMeta] = useState<PhaseMeta[]>([]);
  const [maxPer, setMaxPer] = useState(100);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [navPhase, setNavPhase] = useState<BoardPhaseKey>("development");
  const [search, setSearch] = useState("");
  const [sortByPhase, setSortByPhase] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [renameName, setRenameName] = useState("");
  const [bumpVersion, setBumpVersion] = useState(false);
  const [bumpPart, setBumpPart] = useState<"minor" | "patch" | "major">("minor");
  const [binReason, setBinReason] = useState("Lifecycle complete");

  const pushNotice = useCallback((level: Notice["level"], message: string) => {
    setNotices((n) => [...n.slice(-6), { level, message }]);
  }, []);

  // Sync nav highlight from ?phase=
  useEffect(() => {
    if (
      phaseParam === "development" ||
      phaseParam === "curation" ||
      phaseParam === "deployment"
    ) {
      setNavPhase(phaseParam);
    }
  }, [phaseParam]);

  const reload = useCallback(async () => {
    setError(null);
    const [list, m] = await Promise.all([
      listStrategies(),
      fetchStrategyLabMeta(),
    ]);
    if (!list) {
      setError("Sign in required — Strategy Lab strategies belong to your account.");
      setLoading(false);
      return;
    }
    setStrategies(list.strategies);
    setMaxPer(list.max_per_phase || 100);
    if (m?.phases) setMeta(m.phases);
    // Prefer a strategy in an active board phase (not archive/bin)
    const board = list.strategies.filter((s) => isBoardPhase(phaseOf(s)));
    if (!selectedId && board.length) {
      const prefer =
        board.find((s) => phaseOf(s) === (phaseParam as BoardPhaseKey)) ||
        board[0];
      setSelectedId(prefer.id);
      const ph = phaseOf(prefer);
      if (isBoardPhase(ph)) setNavPhase(ph);
    } else if (
      selectedId &&
      !list.strategies.some((s) => s.id === selectedId)
    ) {
      if (board.length) setSelectedId(board[0].id);
      else setSelectedId(null);
    }
    setLoading(false);
  }, [selectedId, phaseParam]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount load
  }, []);

  const selected = useMemo(
    () => strategies.find((s) => s.id === selectedId) || null,
    [strategies, selectedId],
  );

  /** Active board strategies only (exclude archive/bin from work-area default). */
  const boardStrategies = useMemo(
    () => strategies.filter((s) => isBoardPhase(phaseOf(s))),
    [strategies],
  );

  useEffect(() => {
    if (selected) {
      setRenameName(selected.name);
      const ph = phaseOf(selected);
      if (isBoardPhase(ph)) setNavPhase(ph);
    }
  }, [selected]);

  const q = search.trim().toLowerCase();

  function matches(s: StrategyLabStrategy): boolean {
    if (!q) return true;
    const hay = `${s.name} ${s.description} ${s.id} ${s.version} ${s.phase_state} ${s.phase_state_label}`.toLowerCase();
    return hay.includes(q);
  }

  async function selectStrategy(s: StrategyLabStrategy) {
    setSelectedId(s.id);
    const ph = phaseOf(s);
    if (isBoardPhase(ph)) setNavPhase(ph);
  }

  async function onMove(
    id: string,
    phase: string,
    extra?: { reason?: string; phase_state?: string },
  ) {
    const res = await moveStrategy(id, { phase, ...extra });
    if (res.error) {
      pushNotice("error", res.error);
      return;
    }
    if (phase === "bin") {
      pushNotice("success", "Sent to Archive (Bin).");
      await reload();
      router.push("/app/strategy-lab/archive");
      return;
    }
    pushNotice("success", `Moved to ${phase}.`);
    await reload();
    if (res.strategy) setSelectedId(res.strategy.id);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-24 sm:px-6">
        <StrategyLabChrome active="development" hideTitle>
          <p className="mt-6 text-[var(--color-label-secondary)]">
            Loading Strategy Lab…
          </p>
        </StrategyLabChrome>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[640px] px-4 py-10">
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          Strategy Lab
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

  const suiteActive = suiteActiveFromPhase(navPhase);

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-24 sm:px-6">
      <StrategyLabChrome active={suiteActive}>
      {/* Notices */}
      <div className="mt-4 min-h-[2.5rem] rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 shadow-sm">
        {notices.length === 0 ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            Notifications — moves, renames, and blocks appear here. Strategies are
            stored on your account. Retired strategies live in{" "}
            <Link href="/app/strategy-lab/archive" className="underline">
              Archive
            </Link>
            .
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

      {/* Phase bins — three wide columns (Archive is a separate page) */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-label)]">
              Phase bins
            </h2>
            <p className="text-xs text-[var(--color-label-secondary)]">
              Development · Curation · Deployment. Archive is under the suite nav.
            </p>
          </div>
          <div className="flex w-full max-w-xl flex-col items-stretch gap-2 sm:items-end">
            <StrategyLabPortability
              onImported={() => {
                setLoading(true);
                void reload();
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, description…"
              className="w-full max-w-xs rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {BOARD_PHASE_ORDER.map((phase) => {
            const label =
              meta.find((m) => m.key === phase)?.label ||
              phase.charAt(0).toUpperCase() + phase.slice(1);
            const phaseMeta = meta.find((m) => m.key === phase);
            const allInPhase = boardStrategies.filter((s) => phaseOf(s) === phase);
            const filtered = allInPhase.filter(matches);
            const sort = sortByPhase[phase] || "newest";
            const items = sortStrategies(filtered, sort, phaseMeta);
            const here = navPhase === phase;

            return (
              <div
                key={phase}
                className={
                  "flex max-h-[380px] min-h-[280px] flex-col rounded-2xl border bg-[var(--color-surface)] p-4 shadow-sm " +
                  (here
                    ? "border-blue-500 shadow-[0_0_0_2px_rgba(0,113,227,0.25)]"
                    : "border-[var(--color-separator)]")
                }
              >
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <h3 className="text-[0.95rem] font-semibold tracking-tight text-[var(--color-label)]">
                    {label}
                    {here ? " · here" : ""}
                  </h3>
                  <span className="rounded-full bg-[var(--color-fill)] px-2 py-0.5 text-[0.7rem] font-semibold tabular-nums text-[var(--color-label-secondary)]">
                    {allInPhase.length}/{maxPer}
                  </span>
                </div>
                <p className="mb-2 text-[0.7rem] text-[var(--color-label-secondary)]">
                  {PHASE_HINTS[phase]}
                </p>
                <select
                  className="mb-2 rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs"
                  value={sort}
                  onChange={(e) =>
                    setSortByPhase((prev) => ({ ...prev, [phase]: e.target.value }))
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="state">Phase state · newest</option>
                </select>

                <div className="flex-1 space-y-1.5 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-6 text-center text-xs text-[var(--color-label-secondary)]">
                      Empty — no strategies.
                    </div>
                  ) : (
                    items.map((s) => {
                      const active = s.id === selectedId;
                      const desc =
                        (s.description || "No description yet.").slice(0, 72) +
                        ((s.description || "").length > 72 ? "…" : "");
                      return (
                        <div key={s.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => void selectStrategy(s)}
                            className={
                              "flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition " +
                              (active
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                : "border-[var(--color-separator)] bg-[var(--color-fill)] hover:border-blue-300")
                            }
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-1.5">
                                <span className="truncate text-[0.82rem] font-semibold text-[var(--color-label)]">
                                  {s.name}
                                </span>
                                <span className="text-[0.68rem] font-semibold tabular-nums text-[var(--color-label-secondary)]">
                                  v{s.version}
                                </span>
                              </div>
                              <p className="truncate text-[0.7rem] text-[var(--color-label-secondary)]">
                                {desc}
                              </p>
                            </div>
                            <span
                              className={
                                "shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold " +
                                badgeClass(s.phase_state)
                              }
                            >
                              {s.phase_state_label}
                            </span>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Work area */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--color-label)]">Work area</h2>
        <p className="text-xs text-[var(--color-label-secondary)]">
          Selected strategy on your account — rename, phase state, move.
        </p>

        {!selected ? (
          <p className="mt-3 text-sm text-[var(--color-label-secondary)]">
            Select a strategy from a phase bin.
          </p>
        ) : (
          <div className="mt-3 rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <h3 className="text-xl font-semibold text-[var(--color-label)]">
                  {selected.name}
                </h3>
                <p className="font-mono text-xs text-[var(--color-label-secondary)]">
                  {selected.id} · yours
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-label-secondary)]">Version</p>
                <p className="font-semibold tabular-nums">{selected.version}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--color-label-secondary)]">Phase</p>
                <p className="font-semibold">
                  {meta.find((m) => m.key === phaseOf(selected))?.label ||
                    selected.phase}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-[var(--color-label-secondary)]">Phase state</p>
                <p className="font-semibold">{selected.phase_state_label}</p>
              </div>
            </div>

            {/* Rename */}
            <div className="mt-4 border-t border-[var(--color-separator)] pt-4">
              <p className="mb-2 text-sm font-semibold">Rename strategy</p>
              <div className="flex flex-wrap items-end gap-2">
                <label className="min-w-[12rem] flex-1 text-xs">
                  Title
                  <input
                    className="mt-0.5 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-1.5 text-sm"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={bumpVersion}
                    onChange={(e) => setBumpVersion(e.target.checked)}
                  />
                  Advance version?
                </label>
                <select
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-xs"
                  value={bumpPart}
                  disabled={!bumpVersion}
                  onChange={(e) =>
                    setBumpPart(e.target.value as "minor" | "patch" | "major")
                  }
                >
                  <option value="minor">minor</option>
                  <option value="patch">patch</option>
                  <option value="major">major</option>
                </select>
                <button
                  type="button"
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  onClick={async () => {
                    const res = await patchStrategy(selected.id, {
                      name: renameName,
                      bump_version: bumpVersion,
                      bump_part: bumpPart,
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      pushNotice(
                        "success",
                        bumpVersion
                          ? `Renamed; version → ${res.strategy?.version}`
                          : "Renamed (version unchanged).",
                      );
                      setBumpVersion(false);
                      await reload();
                    }
                  }}
                >
                  Save title
                </button>
              </div>
            </div>

            {/* Phase state */}
            <div className="mt-4 border-t border-[var(--color-separator)] pt-4">
              <p className="mb-2 text-sm font-semibold">Phase state</p>
              <div className="flex flex-wrap items-end gap-2">
                <select
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-3 py-1.5 text-sm"
                  value={selected.phase_state}
                  onChange={async (e) => {
                    const res = await patchStrategy(selected.id, {
                      phase_state: e.target.value,
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      pushNotice("success", `State → ${res.strategy?.phase_state_label}`);
                      await reload();
                    }
                  }}
                >
                  {(
                    meta.find((m) => m.key === phaseOf(selected))?.states || []
                  ).map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-fill)]"
                  onClick={async () => {
                    const res = await advanceState(selected.id);
                    if (res.error) pushNotice("warning", res.error);
                    else {
                      pushNotice(
                        "success",
                        `Advanced → ${res.strategy?.phase_state_label}`,
                      );
                      await reload();
                    }
                  }}
                >
                  Advance →
                </button>
                {phaseOf(selected) === "development" &&
                  selected.phase_state === "deployed" && (
                    <span className="text-xs text-emerald-700">
                      Deployed — ready for Curation
                    </span>
                  )}
              </div>
            </div>

            {/* Move */}
            <div className="mt-4 border-t border-[var(--color-separator)] pt-4">
              <p className="mb-2 text-sm font-semibold">Move strategy</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                  disabled={phaseOf(selected) === "curation"}
                  onClick={() => void onMove(selected.id, "curation")}
                >
                  → Curation
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                  disabled={phaseOf(selected) === "deployment"}
                  onClick={() => void onMove(selected.id, "deployment")}
                >
                  → Deployment
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
                  disabled={phaseOf(selected) === "development"}
                  onClick={() => void onMove(selected.id, "development")}
                >
                  → Development
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold"
                  onClick={async () => {
                    const res = await promoteStrategy(selected.id);
                    if (res.error) pushNotice("warning", res.error);
                    else {
                      pushNotice("success", "Promoted to next phase.");
                      await reload();
                    }
                  }}
                >
                  Promote
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="text-xs">
                  Archive reason
                  <input
                    className="mt-0.5 block w-56 rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                    value={binReason}
                    onChange={(e) => setBinReason(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold"
                  onClick={async () => {
                    const res = await binStrategy(selected.id, {
                      disposition: "retired",
                      reason: binReason || "Retired",
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      setSelectedId(null);
                      router.push("/app/strategy-lab/archive");
                    }
                  }}
                >
                  Retire → Archive
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-700"
                  onClick={async () => {
                    const res = await binStrategy(selected.id, {
                      disposition: "trashed",
                      reason: binReason || "Trashed",
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      setSelectedId(null);
                      router.push("/app/strategy-lab/archive");
                    }
                  }}
                >
                  Trash → Archive
                </button>
              </div>
            </div>

            {selected.lifecycle_log?.length > 0 && (
              <details className="mt-4 border-t border-[var(--color-separator)] pt-3">
                <summary className="cursor-pointer text-sm font-semibold">
                  Lifecycle log
                </summary>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--color-label-secondary)]">
                  {[...selected.lifecycle_log].reverse().slice(0, 20).map((e, i) => (
                    <li key={i} className="font-mono">
                      {String(e.at || "—")} · {String(e.event || "—")}
                      {e.from_name != null &&
                        ` · ${JSON.stringify(e.from_name)} → ${JSON.stringify(e.to_name)}`}
                      {e.from_state != null &&
                        ` · ${String(e.from_label || e.from_state)} → ${String(e.to_label || e.to_state)}`}
                      {e.from_phase != null &&
                        ` · ${String(e.from_phase)} → ${String(e.to_phase)}`}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-separator)] pt-3">
              <button
                type="button"
                className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold"
                onClick={async () => {
                  const s = await createStrategy({ name: "Untitled strategy" });
                  if (!s) pushNotice("error", "Could not create strategy");
                  else {
                    pushNotice("success", "Created blank strategy on your account.");
                    setSelectedId(s.id);
                    await reload();
                  }
                }}
              >
                + New strategy
              </button>
            </div>
          </div>
        )}
      </section>
      </StrategyLabChrome>
    </main>
  );
}
