"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchGen, peek } from "@/lib/saDelivery";
import { resolveLiveBind } from "@/lib/saDevLiveBind";
import { SA_DEV_TERRITORY, type TerritoryEntry } from "@/lib/saDevTerritory";
import { servedFromHealth, targetForSource, type SaStructure } from "@/lib/saSurface";
import SaPriceChart from "@/components/sa/SaPriceChart";
import SaPartDialog from "@/components/sa/SaPartDialog";
import SaUtilityBar from "@/components/sa/SaUtilityBar";
import { SaCanvasProvider } from "@/components/sa/SaCanvasContext";

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
      continuous?: { adjusted?: boolean; method?: string; rolls?: number };
    }
  >;
};

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

export default function SaDevCanvas() {
  const [mode, setMode] = useState<"live" | "fixtures">("live");
  const [fixtureId, setFixtureId] = useState<(typeof FIXTURES)[number]["id"]>("f1");
  const [liveSource, setLiveSource] = useState<string>("ES");
  const [focus, setFocus] = useState<TerritoryEntry>(SA_DEV_TERRITORY[0]);
  const [data, setData] = useState<Structure | null>(null);
  const [shownLabel, setShownLabel] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fixture = FIXTURES.find((f) => f.id === fixtureId) ?? FIXTURES[0];
  const served = servedFromHealth(health);
  const liveSrc =
    served.find((s) => s.source === liveSource)?.source ||
    served[0]?.source ||
    liveSource;
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const healthP = fetchGen("/api/dev/sa/v1/health").then((r) => {
        if (r.body) setHealth(r.body as Health);
        return r.body as Health | null;
      });
      const fetchStructure = async (params: URLSearchParams, target: string) => {
        params.set("include_bins", "true");
        const url = `/api/dev/sa/v1/structure/${target}?${params.toString()}`;
        const cached = peek(url);
        if (cached?.body) setData(cached.body as Structure);
        const r = await fetchGen(url);
        if (!r.body) {
          throw new Error(`${r.status} structure`);
        }
        return r.body as Structure;
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

      const hb = await healthP;
      const servedNow = servedFromHealth(hb);
      const src =
        servedNow.find((s) => s.source === liveSource)?.source ||
        servedNow[0]?.source ||
        liveSource;
      const tgt = targetForSource(src);
      const devQs = new URLSearchParams({
        harness: "live",
        source: src,
        kind: "developing",
      });
      const developingP = fetchStructure(devQs, tgt);
      const ceiling =
        hb?.coverage?.[src]?.ceiling_session ?? null;
      const tradingDate = hb?.today || "";
      const developing = await developingP;
      const bind = resolveLiveBind({
        tradingDate,
        ceilingSession: ceiling,
        developing,
      });
      setShownLabel(bind.label);
      if (bind.kind === "session" && bind.sessionDate) {
        const sessQs = new URLSearchParams({
          harness: "live",
          source: src,
          kind: "session",
          session_date: bind.sessionDate,
        });
        const closed = await fetchStructure(sessQs, tgt);
        setData(closed);
        return;
      }
      setData(developing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "load failed");
    } finally {
      setLoading(false);
    }
  }, [mode, fixture.source, fixture.session_date, fixture.target, liveSource]);

  useEffect(() => {
    void load();
  }, [load]);

  const sources =
    mode === "live"
      ? served.map((s) => ({ id: s.id, label: s.label }))
      : FIXTURES.map((s) => ({ id: s.id, label: s.label }));

  const covSrc = mode === "live" ? liveSrc : fixture.source;
  const cov = health?.coverage?.[covSrc];
  const spanFloor = cov?.floor_session ?? null;
  const spanCeiling = cov?.ceiling_session ?? null;
  const spanTruncated =
    mode === "live" &&
    Boolean(spanCeiling && health?.today && spanCeiling < health.today);

  return (
    <SaCanvasProvider>
    <div
      className="relative flex h-full min-h-0 flex-1 flex-col bg-[#131722] text-zinc-200"
      data-testid="sa-dev-canvas"
    >
      <SaUtilityBar
        title="SA"
        shownLabel={
          shownLabel || (mode === "fixtures" ? "Fixture harness" : null)
        }
        data={(data as SaStructure | null) ?? null}
        sources={sources}
        sourceId={mode === "live" ? liveSrc : fixtureId}
        onSource={(id) => {
          if (mode === "live") setLiveSource(id);
          else setFixtureId(id as (typeof FIXTURES)[number]["id"]);
        }}
        focus={focus}
        onFocus={setFocus}
        spanFloor={spanFloor}
        spanCeiling={spanCeiling}
        spanTruncated={spanTruncated}
        continuous={cov?.continuous}
        extra={
          <>
            <button
              type="button"
              data-testid="sa-dev-mode-live"
              onClick={() => setMode("live")}
              className={`h-8 shrink-0 rounded px-2 text-[11px] ${
                mode === "live"
                  ? "bg-[var(--color-fill)] text-[var(--color-label)]"
                  : "text-[var(--color-label-secondary)]"
              }`}
            >
              Live
            </button>
            <button
              type="button"
              data-testid="sa-dev-mode-fixtures"
              onClick={() => setMode("fixtures")}
              className={`h-8 shrink-0 rounded px-2 text-[11px] ${
                mode === "fixtures"
                  ? "bg-[var(--color-fill)] text-[var(--color-label)]"
                  : "text-[var(--color-label-secondary)]"
              }`}
            >
              Fixture
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="h-8 shrink-0 rounded px-2 text-[11px] text-[var(--color-label-secondary)]"
            >
              {loading ? "…" : "↻"}
            </button>
          </>
        }
      />

      {error ? (
        <p className="shrink-0 px-2 text-xs text-[var(--color-label)]" data-testid="sa-dev-error">
          {error}
        </p>
      ) : null}
      <SaPriceChart
        source={covSrc}
        target={mode === "live" ? targetForSource(liveSrc) : fixture.target}
        spanFloor={mode === "fixtures" ? fixture.session_date : spanFloor}
        spanCeiling={mode === "fixtures" ? fixture.session_date : spanCeiling}
        harness={mode === "fixtures" ? "fixture" : "live"}
      />
      <SaPartDialog />
      <div className="sr-only" data-testid="sa-dev-health-line">
        base {health?.vp_api_base ?? "…"}
      </div>
    </div>
    </SaCanvasProvider>
  );
}
