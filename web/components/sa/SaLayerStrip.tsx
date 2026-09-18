"use client";

import { LAYER_REGISTRY } from "@/lib/saLayerStore";
import { useSaCanvas } from "./SaCanvasContext";

export default function SaLayerStrip() {
  const { prefs, open, dismissFirstRun } = useSaCanvas();
  return (
    <div className="relative flex h-8 shrink-0 items-center gap-0.5" data-testid="sa-layer-strip">
      {LAYER_REGISTRY.map((L) => (
        <button
          key={L.id}
          type="button"
          title={L.note}
          data-testid={`sa-layer-${L.id}`}
          data-on={prefs.visible[L.id] ? "1" : "0"}
          data-reserved={L.reserved ? "1" : "0"}
          data-dev={L.inDevelopment ? "1" : "0"}
          onClick={() => {
            if (L.id === "L3") dismissFirstRun();
            open(L.id);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (L.id === "L3") dismissFirstRun();
            open(L.id);
          }}
          className={`h-7 rounded px-1.5 text-[10px] font-semibold ${
            prefs.visible[L.id]
              ? "bg-zinc-200 text-zinc-900"
              : "border border-zinc-600 text-zinc-400"
          } ${L.reserved || L.inDevelopment ? "opacity-70" : ""}`}
        >
          {L.id === "LP" ? "LP" : L.id}
          {L.inDevelopment ? (
            <span className="ml-0.5 text-[8px] uppercase">·dev</span>
          ) : null}
        </button>
      ))}
      {!prefs.firstRunSeen ? (
        <span
          className="absolute -bottom-7 left-16 whitespace-nowrap rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200"
          data-testid="sa-first-run-pointer"
        >
          Analysis overlay is here — off until you switch it on
        </span>
      ) : null}
    </div>
  );
}
