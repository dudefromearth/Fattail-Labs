"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchGen } from "@/lib/saDelivery";
import { servedFromHealth, sourceForUnderlier } from "@/lib/saSurface";
import SaPriceChart from "@/components/sa/SaPriceChart";
import SaPartDialog from "@/components/sa/SaPartDialog";
import { SaCanvasProvider, useSaCanvas } from "@/components/sa/SaCanvasContext";
import SymbolSearchTile from "@/components/symbology/SymbolSearchTile";
import { useOptionsLab } from "@/lib/optionsLabContext";
import { SYM_ROLES_VP, type SymbolBind } from "@/lib/symbology/types";
import { SA_INTERVAL_GROUPS, SA_INTERVALS } from "@/lib/saTheme";
import { FORCE_VP_EVENT } from "@/lib/saVpBand";
import type { PriceTf } from "@/lib/saLayerStore";

type Health = {
  coverage?: Record<
    string,
    {
      floor_session?: string | null;
      ceiling_session?: string | null;
    }
  >;
};

function VpBar({
  picker,
}: {
  picker: ReactNode;
}) {
  const { prefs, patch, open } = useSaCanvas();
  return (
    <div
      className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-[#131722] px-2"
      data-testid="sa-utility-bar"
    >
      <span className="shrink-0 text-sm font-semibold text-zinc-100">
        Volume Profile
      </span>
      {picker}
      <select
        className="h-8 shrink-0 rounded border border-zinc-700 bg-[#1e222d] px-1.5 text-xs text-zinc-200"
        value={prefs.priceTf}
        onChange={(e) => patch({ priceTf: e.target.value as PriceTf })}
        aria-label="Interval"
        data-testid="sa-interval"
      >
        {SA_INTERVALS.includes(prefs.priceTf) ? null : (
          <option value={prefs.priceTf}>{prefs.priceTf}</option>
        )}
        {SA_INTERVAL_GROUPS.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="button"
        data-testid="sa-vp-refresh"
        className="h-8 shrink-0 rounded border border-zinc-700 bg-[#1e222d] px-2 text-xs text-zinc-200"
        onClick={() =>
          window.dispatchEvent(new Event(FORCE_VP_EVENT))
        }
      >
        Refresh
      </button>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        data-testid="sa-settings-open"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-zinc-700 bg-[#1e222d] text-zinc-200"
        onClick={() => open("L0")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M19.4 13a7.8 7.8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 4h-6l-.4 2.5a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a7.8 7.8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1L9 20h6l.4-2.5a8 8 0 0 0 1.7-1l2.4 1 2-3.5-2-1.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      </button>
    </div>
  );
}

export default function VolumeProfileSaSurface({
  paused = false,
}: {
  paused?: boolean;
}) {
  const { symbol, setSymbol } = useOptionsLab();
  const pair = sourceForUnderlier(symbol);
  const [source, setSource] = useState(pair.source);
  const [health, setHealth] = useState<Health | null>(null);
  const [contract, setContract] = useState<string>("");
  const [pickerLabel, setPickerLabel] = useState<string>("");

  useEffect(() => {
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
  }, [pair.source]);

  useEffect(() => {
    let cancel = false;
    void fetch(`/api/app/vp/v1/contracts/${source}`, {
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : { contracts: [] }))
      .then((body) => {
        if (cancel) return;
        const rows = (body.contracts || []) as {
          id: string;
          last_trade_date?: string;
        }[];
        const today = new Date().toISOString().slice(0, 10);
        setContract((cur) => {
          if (rows.some((x) => x.id === cur)) return cur;
          const live = rows.find((x) => (x.last_trade_date || "") >= today);
          return live?.id || rows[0]?.id || cur;
        });
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [source]);

  function onSymbolBind(bind: SymbolBind) {
    if (
      bind.type === "contract" ||
      bind.type === "continuity-alias" ||
      bind.continuity
    ) {
      if (bind.root) setSource(bind.root);
      setContract(bind.boundSymbol);
      setPickerLabel(bind.boundSymbol);
      return;
    }
    setSymbol(bind.boundSymbol);
    setPickerLabel(bind.boundSymbol);
  }

  const served = servedFromHealth(health);
  const cov = health?.coverage?.[source];

  return (
    <SaCanvasProvider>
      <div
        className="relative flex min-h-0 flex-1 flex-col bg-[#131722] text-zinc-200"
        data-testid="volume-profile-sa-surface"
        data-paused={paused ? "1" : "0"}
      >
        <VpBar
          picker={
            <SymbolSearchTile
              label={pickerLabel || contract || symbol}
              caption=""
              roles={SYM_ROLES_VP}
              onBind={onSymbolBind}
            />
          }
        />
        <SaPriceChart
          source={source}
          target={served.find((s) => s.source === source)?.target}
          spanFloor={cov?.floor_session ?? null}
          spanCeiling={cov?.ceiling_session ?? null}
          contract={contract || null}
        />
        <SaPartDialog />
      </div>
    </SaCanvasProvider>
  );
}
