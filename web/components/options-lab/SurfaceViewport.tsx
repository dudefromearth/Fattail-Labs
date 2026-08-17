"use client";

/**
 * Analyzer Surface viewport — AZ-VP-S1…S6.
 *
 * Same session as Risk graph. The **sheet** is the shared Strategy Lab
 * calculator (`surfaceModel.ts`). Per-leg IV is OPF truth only
 * (`exact` / `locked`). No sticky smile.
 */

import SurfaceScene3D from "@/components/options-lab/SurfaceScene3D";
import { fractionalT } from "@/lib/risk-graph/blackScholes";
import {
  bindListedSurfaceLegs,
  type OpfLegMarkForSheet,
  type SurfaceLeg,
} from "@/lib/risk-graph/surfaceModel";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";

export default function SurfaceViewport({
  hasTrade,
  symbol,
  packLabel,
  loading,
  error,
  notice,
  trade,
  spot,
  legMarks,
}: {
  hasTrade: boolean;
  symbol: string;
  packLabel: string;
  loading?: boolean;
  error?: string | null;
  notice?: { title: string; detail: string } | null;
  trade?: ParsedTosTrade | null;
  spot?: number | null;
  legMarks?: OpfLegMarkForSheet[] | null;
}) {
  const S = spot && spot > 0 ? spot : 0;
  let legs: SurfaceLeg[] = [];
  let ivHole: { title: string; detail: string } | null = null;
  let ivSource = "per_leg";
  if (hasTrade && trade?.legs?.length && S > 0) {
    const bound = bindListedSurfaceLegs(trade.legs, legMarks, {
      spot: S,
      tauFor: (exp) => fractionalT(exp || trade.expiration),
    });
    if (bound.ok) {
      legs = bound.legs;
      ivSource = bound.ivSources.join("+") || "exact";
    } else {
      ivHole = { title: bound.hole, detail: bound.detail };
    }
  }

  const fail = notice || ivHole;

  return (
    <div
      className="flex h-full min-h-[420px] flex-col bg-[#0a0a0e]"
      data-testid="analyzer-surface-viewport"
      data-iv-source={legs.length ? ivSource : fail?.title || "none"}
    >
      {fail ? (
        <div
          className="m-4 max-w-sm rounded-2xl border border-white/12 bg-black/45 px-5 py-4"
          data-testid="analyzer-viewport-notice"
        >
          <div className="text-[13px] font-semibold tracking-wide text-white/90">
            {fail.title}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">
            {fail.detail}
          </p>
        </div>
      ) : !hasTrade ? (
        <p className="flex flex-1 items-center justify-center px-6 text-center text-xs text-white/40">
          Focus a position or load a structure to drive the surface.
        </p>
      ) : loading ? (
        <p className="flex flex-1 items-center justify-center text-xs text-white/50">
          Preparing the surface mesh for this structure…
        </p>
      ) : error ? (
        <div className="m-4 max-w-sm rounded-2xl border border-white/12 bg-black/45 px-5 py-4">
          <div className="text-[13px] font-semibold tracking-wide text-white/90">
            CHECK LEGS
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">
            Could not build a package surface yet. Confirm every leg is listed
            and try again.
          </p>
        </div>
      ) : (
        <SurfaceScene3D
          legs={legs}
          spot={S}
          quality="per_leg_iv"
          ivSource={ivSource}
          label={`${symbol} · ${packLabel}`}
        />
      )}
    </div>
  );
}
