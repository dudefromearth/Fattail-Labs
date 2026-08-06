"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import StrategyLabChrome from "@/components/strategy-lab/StrategyLabChrome";
import DevelopmentValidation from "@/components/strategy-lab/DevelopmentValidation";
import CurateRuntimePanel from "@/components/strategy-lab/CurateRuntimePanel";
import CuratePhaseDashboard from "@/components/strategy-lab/CuratePhaseDashboard";
import DeployPhaseDashboard from "@/components/strategy-lab/DeployPhaseDashboard";
import StrategyDesigner from "@/components/strategy-lab/StrategyDesigner";
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
import {
  loadLabDeskPlace,
  rememberStrategyInPhase,
  setActivePhase as persistActivePhase,
  type LabDeskPlace,
} from "@/lib/strategyLabPlace";

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
  const [deskPlace, setDeskPlace] = useState<LabDeskPlace>(() =>
    loadLabDeskPlace(),
  );
  const [search, setSearch] = useState("");
  const [sortByPhase, setSortByPhase] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [renameName, setRenameName] = useState("");
  const [binReason, setBinReason] = useState("Lifecycle complete");

  const pushNotice = useCallback((level: Notice["level"], message: string) => {
    setNotices((n) => [...n.slice(-6), { level, message }]);
  }, []);

  /** Restore selection for phase P from place memory (or clear work area). */
  const restorePlaceForPhase = useCallback(
    (
      phase: BoardPhaseKey,
      list: StrategyLabStrategy[],
      place: LabDeskPlace,
    ): { selectedId: string | null; place: LabDeskPlace } => {
      const remembered = place.places[phase]?.strategy_id ?? null;
      const stillThere =
        !!remembered &&
        list.some((s) => s.id === remembered && phaseOf(s) === phase);
      if (stillThere) {
        return {
          selectedId: remembered,
          place: persistActivePhase(place, phase),
        };
      }
      // Continuity break: no memory or card left this phase → empty work area
      const cleared = rememberStrategyInPhase(place, phase, null);
      return { selectedId: null, place: cleared };
    },
    [],
  );

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

    const place = loadLabDeskPlace();
    const phaseFromUrl =
      phaseParam === "development" ||
      phaseParam === "curation" ||
      phaseParam === "deployment"
        ? phaseParam
        : place.active_phase;

    setNavPhase(phaseFromUrl);
    const restored = restorePlaceForPhase(
      phaseFromUrl,
      list.strategies,
      place,
    );
    setDeskPlace(restored.place);
    setSelectedId(restored.selectedId);
    setLoading(false);
  }, [phaseParam, restorePlaceForPhase]);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount load
  }, []);

  // Top suite nav uses ?phase= links — restore place when URL phase changes
  useEffect(() => {
    if (
      phaseParam !== "development" &&
      phaseParam !== "curation" &&
      phaseParam !== "deployment"
    ) {
      return;
    }
    if (phaseParam === navPhase && selectedId !== undefined) {
      // Still re-run restore when strategies just loaded into same phase
    }
    setNavPhase(phaseParam);
    setDeskPlace((prev) => {
      const restored = restorePlaceForPhase(phaseParam, strategies, prev);
      setSelectedId(restored.selectedId);
      return restored.place;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional URL-driven restore
  }, [phaseParam]);

  const selected = useMemo(() => {
    const s = strategies.find((x) => x.id === selectedId) || null;
    if (!s) return null;
    // Work area only for the active phase — never show another bin's card
    const ph = phaseOf(s);
    if (isBoardPhase(ph) && ph !== navPhase) return null;
    return s;
  }, [strategies, selectedId, navPhase]);

  /** Active board strategies only (exclude archive/bin from work-area default). */
  const boardStrategies = useMemo(
    () => strategies.filter((s) => isBoardPhase(phaseOf(s))),
    [strategies],
  );

  useEffect(() => {
    if (selected) {
      setRenameName(selected.name);
    } else {
      setRenameName("");
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
    if (isBoardPhase(ph)) {
      setNavPhase(ph);
      setDeskPlace((prev) => rememberStrategyInPhase(prev, ph, s.id));
      router.replace(`/app/strategy-lab?phase=${ph}`, { scroll: false });
    }
  }

  /**
   * Focus a phase bin (title bar, empty body, or chrome).
   * Restores last strategy in that phase, or clears work area if none remembered.
   */
  function focusPhase(phase: BoardPhaseKey) {
    setNavPhase(phase);
    router.replace(`/app/strategy-lab?phase=${phase}`, { scroll: false });
    setDeskPlace((prev) => {
      const restored = restorePlaceForPhase(phase, strategies, prev);
      setSelectedId(restored.selectedId);
      return restored.place;
    });
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
      setDeskPlace((prev) => {
        // Clear this id from all board places
        let next = prev;
        for (const p of BOARD_PHASE_ORDER) {
          if (next.places[p]?.strategy_id === id) {
            next = rememberStrategyInPhase(next, p, null);
          }
        }
        return next;
      });
      await reload();
      router.push("/app/strategy-lab/archive");
      return;
    }
    pushNotice("success", `Moved to ${phase}.`);
    const toPhase = phase as BoardPhaseKey;
    if (isBoardPhase(toPhase) && res.strategy) {
      // Follow the card into the destination phase (continuity spec default)
      setDeskPlace((prev) => {
        let next = prev;
        for (const p of BOARD_PHASE_ORDER) {
          if (p !== toPhase && next.places[p]?.strategy_id === id) {
            next = rememberStrategyInPhase(next, p, null);
          }
        }
        return rememberStrategyInPhase(next, toPhase, res.strategy!.id);
      });
      setNavPhase(toPhase);
      setSelectedId(res.strategy.id);
      router.replace(`/app/strategy-lab?phase=${toPhase}`, { scroll: false });
    }
    await reload();
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
      <StrategyLabChrome
        active={suiteActive}
        designSub={navPhase === "development" ? "board" : undefined}
      >
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

      {/* Curate / Deploy: high-visibility run dashboards (shared layout) */}
      {navPhase === "curation" && (
        <section className="mt-6">
          <CuratePhaseDashboard pushNotice={pushNotice} />
        </section>
      )}
      {navPhase === "deployment" && (
        <section className="mt-6">
          <DeployPhaseDashboard />
        </section>
      )}

      {/* Phase bins — strategy cards (Design primary; Curate/Deploy secondary to dashboard) */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-label)]">
              {navPhase === "curation" || navPhase === "deployment"
                ? "Bot cards"
                : "Phase bins"}
            </h2>
            <p className="text-xs text-[var(--color-label-secondary)]">
              {navPhase === "curation" || navPhase === "deployment"
                ? "Select a bot for the work area below. Running bots are on the dashboard above."
                : "Design · Curate · Deploy. Archive is under the suite nav."}
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
                role="button"
                tabIndex={0}
                aria-pressed={here}
                aria-label={`${label} phase bin${here ? " (active)" : ""}`}
                onClick={() => focusPhase(phase)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    focusPhase(phase);
                  }
                }}
                className={
                  "relative flex max-h-[380px] min-h-[280px] cursor-pointer flex-col rounded-2xl border bg-[var(--color-surface)] p-4 transition-[box-shadow,opacity,filter] duration-200 " +
                  (here
                    ? [
                        "z-10 border-blue-600",
                        "shadow-[0_12px_40px_rgba(0,0,0,0.22),0_4px_12px_rgba(0,0,0,0.12),0_0_0_3px_rgba(0,113,227,0.45)]",
                        "ring-2 ring-blue-500/50",
                        "dark:border-blue-400 dark:shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_0_3px_rgba(96,165,250,0.45)]",
                      ].join(" ")
                    : [
                        "border-[var(--color-separator)] shadow-sm opacity-[0.72]",
                        "brightness-[0.97] dark:brightness-90",
                        // Soft “not here” wash — keeps content readable, clicks work
                        "after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl",
                        "after:bg-zinc-500/[0.08] dark:after:bg-black/35",
                      ].join(" "))
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
                  className="mb-2 cursor-pointer rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs"
                  value={sort}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSortByPhase((prev) => ({
                      ...prev,
                      [phase]: e.target.value,
                    }));
                  }}
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
                      const ph = phaseOf(s);
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
                          {active && (
                            <div className="flex flex-wrap gap-1 px-0.5">
                              {ph !== "development" && (
                                <button
                                  type="button"
                                  className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.65rem] font-medium hover:bg-[var(--color-fill)]"
                                  onClick={() =>
                                    void onMove(s.id, "development")
                                  }
                                >
                                  → Design
                                </button>
                              )}
                              {ph !== "curation" && (
                                <button
                                  type="button"
                                  className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.65rem] font-medium hover:bg-[var(--color-fill)]"
                                  onClick={() => void onMove(s.id, "curation")}
                                >
                                  → Curate
                                </button>
                              )}
                              {ph !== "deployment" && (
                                <button
                                  type="button"
                                  className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.65rem] font-medium hover:bg-[var(--color-fill)]"
                                  onClick={() =>
                                    void onMove(s.id, "deployment")
                                  }
                                >
                                  → Deploy
                                </button>
                              )}
                              <button
                                type="button"
                                className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.65rem] font-medium hover:bg-[var(--color-fill)]"
                                onClick={async () => {
                                  const res = await promoteStrategy(s.id);
                                  if (res.error) pushNotice("warning", res.error);
                                  else {
                                    pushNotice("success", "Promoted.");
                                    await reload();
                                  }
                                }}
                              >
                                Promote
                              </button>
                              <button
                                type="button"
                                className="rounded border border-[var(--color-separator)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.65rem] font-medium hover:bg-[var(--color-fill)]"
                                onClick={async () => {
                                  const res = await binStrategy(s.id, {
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
                                Archive
                              </button>
                            </div>
                          )}
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

      {/* Work area — Design tools or Curate instance controls */}
      <section className="mt-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-label)]">
            Work area
          </h2>
          <button
            type="button"
            className="rounded-lg border border-[var(--color-separator)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
            onClick={async () => {
              const s = await createStrategy({ name: "Untitled strategy" });
              if (!s) pushNotice("error", "Could not create bot");
              else {
                pushNotice("success", "Created blank bot.");
                setSelectedId(s.id);
                await reload();
              }
            }}
          >
            + New
          </button>
        </div>

        {!selected ? (
          <p className="text-sm text-[var(--color-label-secondary)]">
            {navPhase === "development" && "Design"}
            {navPhase === "curation" && "Curate"}
            {navPhase === "deployment" && "Deploy"}
            {" — "}
            no bot selected. Click a card in this bin, or create one with + New.
            Moves live on the card.
          </p>
        ) : (
          <div className="rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 shadow-sm">
            {/* Line 1: title (in-place) · version counter · phase */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                aria-label="Strategy title"
                className="min-w-[10rem] flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-base font-semibold text-[var(--color-label)] outline-none hover:border-[var(--color-separator)] focus:border-blue-500 focus:bg-[var(--color-fill)]"
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                onBlur={async () => {
                  if (!renameName.trim() || renameName === selected.name) return;
                  const res = await patchStrategy(selected.id, {
                    name: renameName.trim(),
                  });
                  if (res.error) pushNotice("error", res.error);
                  else await reload();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
              />
              <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-1 py-0.5">
                <button
                  type="button"
                  title="Bump patch version"
                  className="rounded px-1.5 text-sm font-bold text-[var(--color-label-secondary)] hover:bg-[var(--color-surface)]"
                  onClick={async () => {
                    const res = await patchStrategy(selected.id, {
                      name: renameName || selected.name,
                      bump_version: true,
                      bump_part: "patch",
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      pushNotice(
                        "success",
                        `Version → ${res.strategy?.version}`,
                      );
                      await reload();
                    }
                  }}
                >
                  −
                </button>
                <span className="min-w-[3.25rem] text-center text-xs font-semibold tabular-nums text-[var(--color-label)]">
                  v{selected.version}
                </span>
                <button
                  type="button"
                  title="Bump minor version"
                  className="rounded px-1.5 text-sm font-bold text-[var(--color-label-secondary)] hover:bg-[var(--color-surface)]"
                  onClick={async () => {
                    const res = await patchStrategy(selected.id, {
                      name: renameName || selected.name,
                      bump_version: true,
                      bump_part: "minor",
                    });
                    if (res.error) pushNotice("error", res.error);
                    else {
                      pushNotice(
                        "success",
                        `Version → ${res.strategy?.version}`,
                      );
                      await reload();
                    }
                  }}
                >
                  +
                </button>
              </div>
              <select
                aria-label="Phase"
                className="rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs font-semibold"
                value={phaseOf(selected) === "bin" ? "bin" : phaseOf(selected)}
                onChange={(e) => {
                  const p = e.target.value;
                  if (p === phaseOf(selected)) return;
                  if (p === "bin") {
                    void binStrategy(selected.id, {
                      disposition: "retired",
                      reason: binReason || "Retired",
                    }).then(async (res) => {
                      if (res.error) pushNotice("error", res.error);
                      else {
                        setSelectedId(null);
                        router.push("/app/strategy-lab/archive");
                      }
                    });
                    return;
                  }
                  void onMove(selected.id, p);
                }}
              >
                {BOARD_PHASE_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {meta.find((m) => m.key === p)?.label || p}
                  </option>
                ))}
                <option value="bin">Archive</option>
              </select>
              <span className="hidden font-mono text-[0.65rem] text-[var(--color-label-secondary)] sm:inline">
                {selected.id}
              </span>
            </div>

            {/* Line 2: phase state · advance */}
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <select
                aria-label="Phase state"
                className="rounded-md border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs"
                value={selected.phase_state}
                onChange={async (e) => {
                  const res = await patchStrategy(selected.id, {
                    phase_state: e.target.value,
                  });
                  if (res.error) pushNotice("error", res.error);
                  else await reload();
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
                className="rounded-md border border-[var(--color-separator)] px-2 py-1 text-xs font-semibold hover:bg-[var(--color-fill)]"
                onClick={async () => {
                  const res = await advanceState(selected.id);
                  if (res.error) pushNotice("warning", res.error);
                  else await reload();
                }}
              >
                Advance →
              </button>
              {phaseOf(selected) === "development" &&
                selected.phase_state === "deployed" && (
                  <span className="text-[0.7rem] text-emerald-700">
                    Ready for Curate (Promote in bin)
                  </span>
                )}
            </div>

            {phaseOf(selected) === "development" && (
              <div className="mt-3 space-y-3 border-t border-[var(--color-separator)] pt-3">
                <StrategyDesigner
                  strategyId={selected.id}
                  strategyName={selected.name}
                  initialConfig={
                    (selected.attributes?.["butterfly_config@1"] as
                      | Record<string, unknown>
                      | undefined) ?? null
                  }
                  onSaved={() => void reload()}
                />
                <DevelopmentValidation
                  strategy={selected}
                  onUpdated={() => void reload()}
                />
              </div>
            )}

            {phaseOf(selected) === "curation" && (
              <div className="mt-3 border-t border-[var(--color-separator)] pt-3">
                <CurateRuntimePanel
                  strategy={selected}
                  pushNotice={pushNotice}
                />
              </div>
            )}

            {selected.lifecycle_log?.length > 0 && (
              <details className="mt-3 border-t border-[var(--color-separator)] pt-2">
                <summary className="cursor-pointer text-xs font-semibold text-[var(--color-label-secondary)]">
                  Lifecycle log
                </summary>
                <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-[0.7rem] text-[var(--color-label-secondary)]">
                  {[...selected.lifecycle_log]
                    .reverse()
                    .slice(0, 12)
                    .map((e, i) => (
                      <li key={i} className="font-mono">
                        {String(e.at || "—")} · {String(e.event || "—")}
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
      </StrategyLabChrome>
    </main>
  );
}
