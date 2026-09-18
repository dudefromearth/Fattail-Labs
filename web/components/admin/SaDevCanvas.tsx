"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { resolveLiveBind } from "@/lib/saDevLiveBind";
import { SA_DEV_TERRITORY, type TerritoryEntry } from "@/lib/saDevTerritory";

type Edge = { price: number; direction: string; contrast: number; span: number };
type Node = { span: [number, number]; attributed_volume: number; median: number };
type Crevasse = { span: [number, number]; floor: number; tag: string };
type Structure = {
  source?: string;
  target_symbol?: string;
  session_date?: string | null;
  status?: string;
  caption?: string;
  flags?: { mapping?: string };
  mapping?: { offset_published?: number; mark_source?: string };
  named_state?: string | null;
  vp_api_base?: string | null;
  harness?: string | null;
  bin_count?: number;
  attributed_volume?: number;
  coverage?: unknown;
  detail?: string;
  edges?: Edge[];
  nodes?: Node[];
  crevasses?: Crevasse[];
  uncharted?: { span: [number, number] }[];
  groupings?: { span: [number, number] }[];
};

type Health = {
  mock?: boolean;
  live_coverage?: boolean;
  vp_api_base?: string;
  today?: string;
  collectors?: Record<string, { live?: boolean; last_print_ns?: number }>;
  coverage?: Record<
    string,
    {
      floor_session?: string | null;
      ceiling_session?: string | null;
      sessions_binned?: number;
    }
  >;
};

const LIVE_SESSIONS = [
  { id: "es", label: "ES → SPX", target: "SPX", source: "ES" },
  { id: "mes", label: "MES → XSP", target: "XSP", source: "MES" },
  { id: "spy", label: "SPY (no coverage on this store)", target: "XSP", source: "SPY" },
] as const;

const FIXTURES = [
  {
    id: "f1",
    label: "F1 GAPPED",
    target: "XSP",
    source: "SPY",
    session_date: "2026-09-16",
  },
  {
    id: "f2",
    label: "F2 zero-row",
    target: "XSP",
    source: "SPY",
    session_date: "2026-09-15",
  },
  {
    id: "f5",
    label: "F5 GAPPED",
    target: "XSP",
    source: "SPY",
    session_date: "2026-09-17",
  },
  {
    id: "stale",
    label: "STALE mapping",
    target: "SPX",
    source: "ES",
    session_date: "2026-09-14",
  },
] as const;

function yFor(price: number, lo: number, hi: number, h: number, pad: number) {
  if (hi === lo) return h / 2;
  return pad + ((hi - price) / (hi - lo)) * (h - pad * 2);
}

function SaAxis({ data }: { data: Structure }) {
  const width = 520;
  const height = 560;
  const pad = 28;
  const prices: number[] = [];
  for (const e of data.edges || []) prices.push(e.price);
  for (const n of data.nodes || []) prices.push(n.span[0], n.span[1]);
  for (const c of data.crevasses || []) prices.push(c.span[0], c.span[1]);
  if (prices.length === 0) {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]" data-testid="sa-dev-empty-named">
        No structure detected on this histogram. DRAFT thresholds; not a blank pane.
      </p>
    );
  }
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const maxC = Math.max(3, ...(data.edges || []).map((e) => e.contrast));

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      role="img"
      aria-label="Structural objects on the price axis"
      data-testid="sa-dev-axis"
    >
      <rect width={width} height={height} fill="var(--color-surface)" />
      {(data.nodes || []).map((n) => {
        const y1 = yFor(n.span[1], lo, hi, height, pad);
        const y0 = yFor(n.span[0], lo, hi, height, pad);
        return (
          <rect
            key={`n-${n.span[0]}-${n.span[1]}`}
            x={80}
            y={y1}
            width={width - 140}
            height={Math.max(2, y0 - y1)}
            fill="var(--color-fill)"
          />
        );
      })}
      {(data.crevasses || []).map((c) => {
        const y1 = yFor(c.span[1], lo, hi, height, pad);
        const y0 = yFor(c.span[0], lo, hi, height, pad);
        return (
          <rect
            key={`c-${c.span[0]}-${c.span[1]}`}
            x={80}
            y={y1}
            width={width - 140}
            height={Math.max(2, y0 - y1)}
            fill="var(--color-separator)"
          />
        );
      })}
      {(data.edges || []).map((e) => {
        const y = yFor(e.price, lo, hi, height, pad);
        const sw = 1 + (3 * (e.contrast - 3)) / (maxC - 3 || 1);
        return (
          <g key={`e-${e.price}-${e.direction}`}>
            <line
              x1={80}
              x2={width - 60}
              y1={y}
              y2={y}
              stroke="var(--color-label)"
              strokeWidth={sw}
            />
            <text
              x={width - 56}
              y={y + 4}
              fontSize={11}
              fill="var(--color-label-secondary)"
              fontFamily="var(--font-mono)"
            >
              {e.price.toFixed(2)} {e.direction} {e.contrast.toFixed(2)}
            </text>
          </g>
        );
      })}
      <line
        x1={80}
        x2={80}
        y1={pad}
        y2={height - pad}
        stroke="var(--color-separator)"
        strokeWidth={1}
      />
    </svg>
  );
}

export default function SaDevCanvas() {
  const [mode, setMode] = useState<"live" | "fixtures">("live");
  const [fixtureId, setFixtureId] = useState<(typeof FIXTURES)[number]["id"]>("f1");
  const [liveId, setLiveId] = useState<(typeof LIVE_SESSIONS)[number]["id"]>("es");
  const [focus, setFocus] = useState<TerritoryEntry>(SA_DEV_TERRITORY[0]);
  const [data, setData] = useState<Structure | null>(null);
  const [shownLabel, setShownLabel] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fixture = FIXTURES.find((f) => f.id === fixtureId) ?? FIXTURES[0];
  const liveSess = LIVE_SESSIONS.find((s) => s.id === liveId) ?? LIVE_SESSIONS[0];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await fetch("/api/dev/sa/v1/health", { credentials: "same-origin" });
      let hb: Health | null = null;
      if (h.ok) {
        hb = (await h.json()) as Health;
        setHealth(hb);
      }
      const fetchStructure = async (params: URLSearchParams, target: string) => {
        const r = await fetch(
          `/api/dev/sa/v1/structure/${target}?${params.toString()}`,
          { credentials: "same-origin" },
        );
        if (!r.ok) {
          const t = await r.text();
          throw new Error(`${r.status} ${t.slice(0, 180)}`);
        }
        const body = (await r.json()) as Structure;
        if ("bins" in body) {
          throw new Error("structure payload contained bins — VP-L18 violation");
        }
        return body;
      };

      if (mode === "fixtures") {
        const qs = new URLSearchParams({
          harness: "fixture",
          source: fixture.source,
          session_date: fixture.session_date,
        });
        const body = await fetchStructure(qs, fixture.target);
        setShownLabel(null);
        setData(body);
        return;
      }

      const ceiling =
        hb?.coverage?.[liveSess.source]?.ceiling_session ?? null;
      const tradingDate = hb?.today || "";
      const devQs = new URLSearchParams({
        harness: "live",
        source: liveSess.source,
        kind: "developing",
      });
      const developing = await fetchStructure(devQs, liveSess.target);
      const bind = resolveLiveBind({
        tradingDate,
        ceilingSession: ceiling,
        developing,
      });
      setShownLabel(bind.label);
      if (bind.kind === "session" && bind.sessionDate) {
        const sessQs = new URLSearchParams({
          harness: "live",
          source: liveSess.source,
          kind: "session",
          session_date: bind.sessionDate,
        });
        const closed = await fetchStructure(sessQs, liveSess.target);
        setData(closed);
        return;
      }
      setData(developing);
    } catch (err) {
      setData(null);
      setShownLabel(null);
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, [mode, fixture.source, fixture.session_date, fixture.target, liveSess.source, liveSess.target]);

  useEffect(() => {
    void load();
  }, [load]);

  const mapping = data?.flags?.mapping || "FAILED";
  const live = useMemo(() => focus.status === "shipping", [focus]);

  return (
    <div className="flex min-h-[70vh] flex-col gap-6 p-6" data-testid="sa-dev-canvas">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
          DEV-ONLY · SA-DEV-W0 · members denied · SA objects only · mock is the
          fixture harness
        </p>
        <h1 className="text-2xl font-semibold text-[var(--color-label)]">
          Structural Analysis · territory
        </h1>
        <p className="max-w-2xl text-sm text-[var(--color-label-secondary)]">
          SA-L11: the map shows the whole territory. Replay, Footprint /
          Market Delta, GEX Overlay, Characterization, and Exploration sit as
          labeled IN-DEVELOPMENT entries. Structure lines stay live. No fake
          data. No empty widgets. Alerts are not a view (SA-L10).
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav
          className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-3"
          data-testid="sa-dev-territory"
        >
          <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
            Territory
          </p>
          <ul className="space-y-1">
            {SA_DEV_TERRITORY.map((entry) => {
              const active = focus.id === entry.id;
              return (
                <li key={entry.id}>
                  <button
                    type="button"
                    data-testid={`sa-dev-nav-${entry.id}`}
                    onClick={() => setFocus(entry)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                      active
                        ? "bg-[var(--color-fill)] text-[var(--color-label)]"
                        : "text-[var(--color-label-secondary)] hover:bg-[var(--color-surface-secondary)]"
                    }`}
                  >
                    <span className="block font-medium text-[var(--color-label)]">
                      {entry.label}
                    </span>
                    <span className="mt-0.5 block text-[11px] uppercase tracking-wide text-[var(--color-label-tertiary)]">
                      {entry.status === "shipping" ? "shipping" : "in-development"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <section className="space-y-4">
          <div
            className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-4"
            data-testid="sa-dev-doctrine"
          >
            <p className="text-xs uppercase tracking-wide text-[var(--color-label-tertiary)]">
              {focus.status === "shipping" ? "Shipping" : "IN-DEVELOPMENT"} · {focus.label}
            </p>
            <p className="mt-1 text-sm text-[var(--color-label)]">{focus.doctrine}</p>
            {!live ? (
              <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
                Named state only — reserved unserved. Structure lines remain on
                the axis. No invented marks.
              </p>
            ) : null}
          </div>

          <p className="text-xs text-[var(--color-label-secondary)]" data-testid="sa-dev-health-line">
            base {health?.vp_api_base ?? "…"} · live coverage{" "}
            {health?.live_coverage ? "yes" : "no"}
            {health?.mock ? " · health is mock" : ""}
            {health?.collectors
              ? ` · ${Object.entries(health.collectors)
                  .map(
                    ([k, v]) =>
                      `${k}:${v.live ? "live" : "off"}`,
                  )
                  .join(" ")}`
              : ""}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="sa-dev-mode-live"
              onClick={() => setMode("live")}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                mode === "live"
                  ? "border-[var(--color-label)] bg-[var(--color-fill)]"
                  : "border-[var(--color-separator)]"
              }`}
            >
              Live sessions
            </button>
            <button
              type="button"
              data-testid="sa-dev-mode-fixtures"
              onClick={() => setMode("fixtures")}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                mode === "fixtures"
                  ? "border-[var(--color-label)] bg-[var(--color-fill)]"
                  : "border-[var(--color-separator)]"
              }`}
            >
              Fixture harness
            </button>
            {(mode === "fixtures" ? FIXTURES : LIVE_SESSIONS).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() =>
                  mode === "fixtures"
                    ? setFixtureId(f.id as (typeof FIXTURES)[number]["id"])
                    : setLiveId(f.id as (typeof LIVE_SESSIONS)[number]["id"])
                }
                data-testid={`sa-dev-session-${f.id}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  (mode === "fixtures" ? fixtureId : liveId) === f.id
                    ? "border-[var(--color-label)] bg-[var(--color-fill)]"
                    : "border-[var(--color-separator)]"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-md border border-[var(--color-separator)] px-3 py-1.5 text-sm"
            >
              Refresh
            </button>
            {loading ? (
              <span className="text-xs text-[var(--color-label-tertiary)]">loading</span>
            ) : null}
          </div>

          {error ? (
            <p className="text-sm text-[var(--color-label)]" data-testid="sa-dev-error">
              {error}
            </p>
          ) : null}

          {data ? (
            <div className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
              <p
                className="text-sm font-medium text-[var(--color-label)]"
                data-testid="sa-dev-shown-label"
              >
                {shownLabel || (mode === "fixtures" ? "Fixture harness" : "")}
              </p>
              <p className="text-sm text-[var(--color-label)]" data-testid="sa-dev-caption">
                {data.caption || data.named_state || "Structure"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-label-secondary)]">
                {data.named_state ? `${data.named_state} · ` : ""}
                status {data.status ?? "—"} · mapping {mapping}
                {data.session_date ? ` · payload session ${data.session_date}` : ""}
                {typeof data.bin_count === "number" ? ` · bins ${data.bin_count}` : ""}
                {typeof data.attributed_volume === "number"
                  ? ` · attributed ${data.attributed_volume} (this histogram only)`
                  : ""}
                {data.detail ? ` · ${data.detail}` : ""}
                {data.vp_api_base ? ` · VP API ${data.vp_api_base}` : ""}
              </p>
              <div className="mt-3">
                <SaAxis data={data} />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
