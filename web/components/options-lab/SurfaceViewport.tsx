"use client";

/**
 * Analyzer Surface viewport — AZ-VP-S1…S6.
 *
 * Same session as Risk graph. The **sheet** is the shared Strategy Lab
 * calculator (`surfaceModel.ts`). Presentation only differs (mesh vs 2D).
 */

import SurfaceScene3D from "@/components/options-lab/SurfaceScene3D";
import { fractionalT } from "@/lib/risk-graph/blackScholes";
import { legsFromTos, type SurfaceLeg } from "@/lib/risk-graph/surfaceModel";
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
}: {
  hasTrade: boolean;
  symbol: string;
  packLabel: string;
  loading?: boolean;
  error?: string | null;
  notice?: { title: string; detail: string } | null;
  trade?: ParsedTosTrade | null;
  spot?: number | null;
}) {
  const S = spot && spot > 0 ? spot : 0;
  let legs: SurfaceLeg[] = [];
  let quality: "per_leg_iv" | "sticky_cli" = "sticky_cli";
  if (hasTrade && trade?.legs?.length && S > 0) {
    legs = legsFromTos(trade.legs, {
      spot: S,
      ivFor: () => 0.2,
      tauFor: (exp) => fractionalT(exp || trade.expiration),
    });
    quality = "sticky_cli";
  }

  return (
    <div
      className="flex h-full min-h-[420px] flex-col bg-[#0a0a0e]"
      data-testid="analyzer-surface-viewport"
    >
      {notice ? (
        <div
          className="m-4 max-w-sm rounded-2xl border border-white/12 bg-black/45 px-5 py-4"
          data-testid="analyzer-viewport-notice"
        >
          <div className="text-[13px] font-semibold tracking-wide text-white/90">
            {notice.title}
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">
            {notice.detail}
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
          quality={quality}
          ivSource="cli"
          label={`${symbol} · ${packLabel}`}
        />
      )}
    </div>
  );
}
