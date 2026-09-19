"use client";

import { useEffect, useState } from "react";
import { fetchGen, peek } from "@/lib/saDelivery";
import { SA_DEV_TERRITORY, type TerritoryEntry } from "@/lib/saDevTerritory";
import {
  servedFromHealth,
  sourceForUnderlier,
  type SaStructure,
} from "@/lib/saSurface";
import SaPriceChart from "@/components/sa/SaPriceChart";
import SaPartDialog from "@/components/sa/SaPartDialog";
import SaUtilityBar from "@/components/sa/SaUtilityBar";
import { SaCanvasProvider } from "@/components/sa/SaCanvasContext";
import { useOptionsLab } from "@/lib/optionsLabContext";

type Health = {
  today?: string;
  vp_api_base?: string;
  coverage?: Record<
    string,
    {
      floor_session?: string | null;
      ceiling_session?: string | null;
      continuous?: {
        adjusted?: boolean;
        method?: string;
        rolls?: number;
      };
    }
  >;
};

export default function VolumeProfileSaSurface({
  paused = false,
}: {
  paused?: boolean;
}) {
  const { symbol } = useOptionsLab();
  const pair = sourceForUnderlier(symbol);
  const [source, setSource] = useState(pair.source);
  const [data, setData] = useState<SaStructure | null>(null);
  const [shownLabel, setShownLabel] = useState<string | null>(null);
  const [focus, setFocus] = useState<TerritoryEntry>(SA_DEV_TERRITORY[0]);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    setError(null);
    const qs = new URLSearchParams({
      harness: "live",
      source: pair.source,
      kind: "developing",
      include_bins: "true",
    });
    const structUrl = `/api/app/vp/v1/structure/${pair.target}?${qs}`;
    const hit = peek(structUrl);
    if (hit?.body) setData(hit.body as SaStructure);
    void fetchGen("/api/app/vp/v1/health").then((r) => {
      if (r.body) {
        setHealth(r.body as Health);
        const served = servedFromHealth(r.body as Health);
        setSource((cur) =>
          served.some((s) => s.source === cur)
            ? cur
            : served[0]?.source || cur,
        );
      }
    });
    void fetchGen(structUrl)
      .then((r) => {
        if (!r.body) throw new Error(`${r.status}`);
        setData(r.body as SaStructure);
        setShownLabel((r.body.session_date as string) || "Developing");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "load failed");
      });
  }, [pair.source, pair.target]);

  const served = servedFromHealth(health);
  const cov = health?.coverage?.[source];
  const spanFloor = cov?.floor_session ?? null;
  const spanCeiling = cov?.ceiling_session ?? null;
  const spanTruncated = Boolean(
    spanCeiling && health?.today && spanCeiling < health.today,
  );

  return (
    <SaCanvasProvider>
    <div
      className="relative flex min-h-0 flex-1 flex-col bg-[#131722] text-zinc-200"
      data-testid="volume-profile-sa-surface"
      data-paused={paused ? "1" : "0"}
    >
      <SaUtilityBar
        title="Volume Profile"
        pendingName
        shownLabel={shownLabel}
        data={data}
        sources={served.map((s) => ({ id: s.id, label: s.label }))}
        sourceId={source}
        onSource={setSource}
        focus={focus}
        onFocus={setFocus}
        spanFloor={spanFloor}
        spanCeiling={spanCeiling}
        spanTruncated={spanTruncated}
        continuous={cov?.continuous}
      />
      {error ? (
        <p className="px-2 text-xs text-[var(--color-label)]">{error}</p>
      ) : null}
      <SaPriceChart
        source={source}
        target={served.find((s) => s.source === source)?.target}
        spanFloor={spanFloor}
        spanCeiling={spanCeiling}
      />
      <SaPartDialog />
    </div>
    </SaCanvasProvider>
  );
}
