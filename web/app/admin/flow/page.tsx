"use client";

// Admin Flow — aggregate member journey across the whole platform.
// "Where do members naturally flow, and where do they drop off." Read-only.
// Data: /api/admin/flow (sessionised page_views mapped to readable areas).
//
// The hero is a step-based Sankey: column N = the Nth page of a session. Sessions
// that end are carried into a growing "Left" lane along the bottom, so every column
// is the same height (all sessions) and drop-off is the widening grey band. Below it:
// a drop-off table (biggest leak points) and the most common journeys.
// Spec: FatTail-Labs-User-Flow-Spec-v1.0.

import { useCallback, useEffect, useMemo, useState } from "react";

type StepNode = { area: string; count: number };
type Step = {
  step: number;
  nodes: StepNode[];
  exit: number;
  exit_by_area: StepNode[];
  total: number;
};
type StepLink = { step: number; from: string; to: string; count: number };
type DropRow = { area: string; reached: number; exits: number; exit_rate: number };
type Journey = { areas: string[]; count: number };
type FlowData = {
  filters: { days: number; tier: string };
  totals: { sessions: number; views: number; members: number };
  steps: Step[];
  step_links: StepLink[];
  dropoff: DropRow[];
  entries: StepNode[];
  journeys: Journey[];
  max_steps: number;
};

const EXIT = "__exit__";

// Stable per-area colour (hue from a cheap string hash). Fixed S/L reads on both themes.
function areaHue(area: string): number {
  let h = 0;
  for (let i = 0; i < area.length; i++) h = (h * 31 + area.charCodeAt(i)) % 360;
  return h;
}
function nodeFill(area: string): string {
  if (area === EXIT) return "hsl(220 9% 62%)";
  return `hsl(${areaHue(area)} 58% 55%)`;
}
function linkFill(area: string): string {
  if (area === EXIT) return "hsl(220 9% 62%)";
  return `hsl(${areaHue(area)} 58% 55%)`;
}

const DAYS: { key: number; label: string }[] = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
  { key: 0, label: "All time" },
];
const TIERS: { key: string; label: string }[] = [
  { key: "all", label: "All members" },
  { key: "paid", label: "Paid" },
  { key: "free", label: "Free" },
];

export default function AdminFlowPage() {
  const [data, setData] = useState<FlowData | null>(null);
  const [days, setDays] = useState(30);
  const [tier, setTier] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (d: number, t: string) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/flow?days=${d}&tier=${t}`, {
        credentials: "same-origin",
      });
      if (!r.ok) {
        setError(r.status === 403 ? "Administrator sign-in required." : await r.text());
        setData(null);
        return;
      }
      setData(await r.json());
    } catch (e) {
      setError(String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(days, tier);
  }, [load, days, tier]);

  const empty = data && data.totals.sessions === 0;

  return (
    <main className="space-y-6 p-6" data-testid="admin-flow">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Flow</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            How members move through Labs in aggregate — the paths they take and where
            they drop off. Each session is sessionised (30-min gaps) and its pages
            grouped into areas.{" "}
            {data && (
              <span className="text-zinc-600 dark:text-zinc-300">
                {data.totals.sessions.toLocaleString()} sessions ·{" "}
                {data.totals.members.toLocaleString()} members ·{" "}
                {data.totals.views.toLocaleString()} views
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => (
              <Pill key={d.key} active={days === d.key} onClick={() => setDays(d.key)}>
                {d.label}
              </Pill>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TIERS.map((t) => (
              <Pill key={t.key} active={tier === t.key} onClick={() => setTier(t.key)}>
                {t.label}
              </Pill>
            ))}
          </div>
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-zinc-400">Loading…</p>}

      {empty && !loading && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No member navigation recorded in this window yet. This view comes alive on
          production traffic — try a wider window, or check back once members are active.
        </div>
      )}

      {data && !empty && (
        <>
          <section className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Journey flow
              </h2>
              <span className="text-xs text-zinc-400">
                Grey = left the platform · step = Nth page in a session
              </span>
            </div>
            <Sankey data={data} />
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <DropOff rows={data.dropoff} />
            <Journeys journeys={data.journeys} />
          </div>
        </>
      )}
    </main>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

// ---- Sankey ---------------------------------------------------------------

type LaidNode = {
  col: number;
  area: string;
  count: number;
  x: number;
  y: number;
  h: number;
  outCursor: number; // consumed height on right edge
  inCursor: number; // consumed height on left edge
};
type Band = {
  key: string;
  from: LaidNode;
  to: LaidNode;
  sy: number;
  ty: number;
  th: number;
  area: string;
  count: number;
};

const NODE_W = 13;
const COL_STRIDE = 168;
const SVG_H = 560;
const TOP_PAD = 26;
const BOT_PAD = 16;
const NODE_GAP = 3;

function Sankey({ data }: { data: FlowData }) {
  const layout = useMemo(() => buildLayout(data), [data]);
  if (!layout) return null;
  const { nodes, bands, width, cols } = layout;

  return (
    <div className="overflow-x-auto">
      <svg
        width={width}
        height={SVG_H}
        viewBox={`0 0 ${width} ${SVG_H}`}
        className="min-w-full"
        style={{ display: "block" }}
      >
        {/* column headers */}
        {cols.map((c) => (
          <text
            key={`h${c.col}`}
            x={c.x + NODE_W / 2}
            y={14}
            textAnchor="middle"
            className="fill-zinc-400"
            fontSize={11}
            fontWeight={600}
          >
            Step {c.col + 1}
          </text>
        ))}
        {/* bands under nodes */}
        <g>
          {bands.map((b) => (
            <path
              key={b.key}
              d={bandPath(b)}
              fill={linkFill(b.area)}
              fillOpacity={b.area === EXIT ? 0.18 : 0.32}
            >
              <title>
                {b.from.area === EXIT ? "Left" : b.from.area} →{" "}
                {b.to.area === EXIT ? "Left" : b.to.area}: {b.count.toLocaleString()}
              </title>
            </path>
          ))}
        </g>
        {/* nodes + labels */}
        <g>
          {nodes.map((n) => (
            <g key={`${n.col}:${n.area}`}>
              <rect
                x={n.x}
                y={n.y}
                width={NODE_W}
                height={Math.max(1, n.h)}
                rx={2}
                fill={nodeFill(n.area)}
                stroke={n.area === EXIT ? "hsl(220 9% 50%)" : "rgba(0,0,0,0.15)"}
                strokeWidth={0.5}
              >
                <title>
                  {n.area === EXIT ? "Left the platform" : n.area}:{" "}
                  {n.count.toLocaleString()}
                </title>
              </rect>
              {n.h >= 11 && (
                <text
                  x={n.x + NODE_W + 4}
                  y={n.y + n.h / 2}
                  dominantBaseline="middle"
                  fontSize={11}
                  className="fill-zinc-600 dark:fill-zinc-300"
                  style={{ paintOrder: "stroke" }}
                >
                  {n.area === EXIT ? "Left" : n.area}
                  <tspan className="fill-zinc-400" dx={4} fontSize={10}>
                    {n.count.toLocaleString()}
                  </tspan>
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function buildLayout(data: FlowData) {
  const steps = data.steps;
  if (!steps.length) return null;
  const S = steps[0].total || 1;
  const nCols = steps.length;
  const availH = SVG_H - TOP_PAD - BOT_PAD;

  // Cumulative exits BEFORE reaching each column (the size of that column's "Left" node).
  const exitCumBefore: number[] = [];
  let acc = 0;
  for (let i = 0; i < nCols; i++) {
    exitCumBefore.push(acc);
    acc += steps[i].exit || 0;
  }

  // Scale: whole-column height (S sessions) fills availH minus inter-node gaps.
  // Use a modest fixed scale off S so later, thinner columns visibly narrow.
  const perColMaxNodes = Math.max(...steps.map((s) => s.nodes.length)) + 1;
  const scale = (availH - perColMaxNodes * NODE_GAP) / S;

  const nodeMap = new Map<string, LaidNode>();
  const nodesArr: LaidNode[] = [];
  const cols: { col: number; x: number }[] = [];

  for (let i = 0; i < nCols; i++) {
    const x = 8 + i * COL_STRIDE;
    cols.push({ col: i, x });
    let y = TOP_PAD;
    // real area nodes (desc by count), then the "Left" lane at the bottom
    const entries: StepNode[] = [...steps[i].nodes];
    const exitH = exitCumBefore[i];
    for (const nd of entries) {
      const h = nd.count * scale;
      const ln: LaidNode = {
        col: i,
        area: nd.area,
        count: nd.count,
        x,
        y,
        h,
        outCursor: 0,
        inCursor: 0,
      };
      nodeMap.set(`${i}:${nd.area}`, ln);
      nodesArr.push(ln);
      y += h + NODE_GAP;
    }
    if (exitH > 0) {
      const h = exitH * scale;
      const ln: LaidNode = {
        col: i,
        area: EXIT,
        count: exitH,
        x,
        y,
        h,
        outCursor: 0,
        inCursor: 0,
      };
      nodeMap.set(`${i}:${EXIT}`, ln);
      nodesArr.push(ln);
    }
  }

  // Bands between consecutive columns. Order matters for tidy stacking:
  // outgoing bands from a node are consumed top→down in the order of the target's
  // vertical position; incoming likewise by source position. Build a per-column
  // ordered link list, then allocate cursors.
  const bands: Band[] = [];
  const linksByStep = new Map<number, StepLink[]>();
  for (const l of data.step_links) {
    const arr = linksByStep.get(l.step) || [];
    arr.push(l);
    linksByStep.set(l.step, arr);
  }

  const yOf = (col: number, area: string) => nodeMap.get(`${col}:${area}`)?.y ?? 0;

  for (let i = 0; i < nCols - 1; i++) {
    const step = i + 1; // backend step_links use 1-based step = source column+1
    const real = (linksByStep.get(step) || []).map((l) => ({
      from: l.from,
      to: l.to,
      count: l.count,
      area: l.from,
    }));
    // real → Left (this step's drop-off), lands in next column's Left node
    const exitLinks = (steps[i].exit_by_area || []).map((e) => ({
      from: e.area,
      to: EXIT,
      count: e.count,
      area: e.area,
    }));
    // Left → Left carry-forward (already-exited sessions ride the bottom lane)
    const carry =
      exitCumBefore[i] > 0
        ? [{ from: EXIT, to: EXIT, count: exitCumBefore[i], area: EXIT }]
        : [];

    const all = [...real, ...exitLinks, ...carry];
    // order by (source y, target y) so bands don't cross needlessly
    all.sort(
      (a, b) =>
        yOf(i, a.from) - yOf(i, b.from) ||
        yOf(i + 1, a.to) - yOf(i + 1, b.to),
    );
    for (const lk of all) {
      const from = nodeMap.get(`${i}:${lk.from}`);
      const to = nodeMap.get(`${i + 1}:${lk.to}`);
      if (!from || !to) continue;
      const th = lk.count * scale;
      const sy = from.y + from.outCursor;
      const ty = to.y + to.inCursor;
      from.outCursor += th;
      to.inCursor += th;
      bands.push({
        key: `${i}:${lk.from}->${lk.to}`,
        from,
        to,
        sy,
        ty,
        th,
        area: lk.area,
        count: lk.count,
      });
    }
  }

  const width = 8 + (nCols - 1) * COL_STRIDE + NODE_W + 120; // room for last labels
  return { nodes: nodesArr, bands, width, cols };
}

function bandPath(b: Band): string {
  const sx = b.from.x + NODE_W;
  const tx = b.to.x;
  const mx = (sx + tx) / 2;
  const sy0 = b.sy;
  const sy1 = b.sy + b.th;
  const ty0 = b.ty;
  const ty1 = b.ty + b.th;
  return [
    `M ${sx} ${sy0}`,
    `C ${mx} ${sy0}, ${mx} ${ty0}, ${tx} ${ty0}`,
    `L ${tx} ${ty1}`,
    `C ${mx} ${ty1}, ${mx} ${sy1}, ${sx} ${sy1}`,
    "Z",
  ].join(" ");
}

// ---- Drop-off table -------------------------------------------------------

function DropOff({ rows }: { rows: DropRow[] }) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => b.exits - a.exits),
    [rows],
  );
  const maxExits = Math.max(1, ...sorted.map((r) => r.exits));
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Where people leave
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          Of the sessions that reached each area, how many left from it.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-400 dark:bg-zinc-900/40">
            <tr>
              <th className="px-4 py-2">Area</th>
              <th className="px-4 py-2 text-right">Reached</th>
              <th className="px-4 py-2 text-right">Left here</th>
              <th className="px-4 py-2">Exit rate</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.area}
                className="border-t border-zinc-100 dark:border-zinc-800/70"
              >
                <td className="px-4 py-2">
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ background: nodeFill(r.area) }}
                  />
                  {r.area}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-zinc-500">
                  {r.reached.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">
                  {r.exits.toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-1.5 rounded-full bg-rose-400/80"
                        style={{ width: `${Math.round(r.exit_rate * 100)}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-zinc-500">
                      {Math.round(r.exit_rate * 100)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-zinc-400">
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---- Top journeys ---------------------------------------------------------

function Journeys({ journeys }: { journeys: Journey[] }) {
  const max = Math.max(1, ...journeys.map((j) => j.count));
  return (
    <section className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Most common journeys
        </h2>
        <p className="mt-0.5 text-xs text-zinc-400">
          The ordered paths members take most often (first {6} steps).
        </p>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
        {journeys.map((j, i) => (
          <li key={i} className="px-4 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1 text-xs">
                {j.areas.map((a, k) => (
                  <span key={k} className="flex items-center gap-1">
                    {k > 0 && <span className="text-zinc-300">→</span>}
                    <span
                      className="rounded px-1.5 py-0.5"
                      style={{
                        background: `hsl(${areaHue(a)} 58% 55% / 0.14)`,
                        color: `hsl(${areaHue(a)} 45% 40%)`,
                      }}
                    >
                      {a}
                    </span>
                  </span>
                ))}
              </div>
              <span className="shrink-0 text-xs tabular-nums text-zinc-400">
                {j.count.toLocaleString()}
              </span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-1 rounded-full bg-emerald-400/70"
                style={{ width: `${Math.round((j.count / max) * 100)}%` }}
              />
            </div>
          </li>
        ))}
        {journeys.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-400">No data.</li>
        )}
      </ul>
    </section>
  );
}
