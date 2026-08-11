"use client";

/**
 * Analyzer Surface viewport (3D) — AZ-VP-S1…S6.
 *
 * Same session as Risk graph: positions, alerts, models, time machine, OPF.
 * Presentation only differs. MSC RiskGraph3DView is scene heritage; pricing
 * remains OPF (never MSC client theo).
 *
 * Full Three.js mesh port: strategy-lab-proto/msc-risk-graph-ui
 *   src/components/risk-graph/RiskGraph3DView.tsx + src/3d/*
 */

export default function SurfaceViewport({
  hasTrade,
  symbol,
  packLabel,
  loading,
  error,
}: {
  hasTrade: boolean;
  symbol: string;
  packLabel: string;
  loading?: boolean;
  error?: string | null;
}) {
  return (
    <div
      className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 bg-[#0a0a0e] px-6 text-center"
      data-testid="analyzer-surface-viewport"
    >
      <p className="text-sm font-semibold text-white/85">Surface · 3D</p>
      <p className="max-w-md text-xs leading-relaxed text-white/45">
        Mirror of the Risk graph for{" "}
        <span className="font-mono text-white/70">{symbol}</span>
        {" · "}
        <span className="text-white/60">{packLabel}</span>
        . Same Positions, Alerts, and OPF data plane — mesh presentation only.
      </p>
      {!hasTrade ? (
        <p className="text-xs text-white/40">
          Focus a position or load a structure to drive the surface.
        </p>
      ) : loading ? (
        <p className="text-xs text-white/50">OPF samples · preparing mesh…</p>
      ) : error ? (
        <p className="text-xs text-amber-400/90">{error}</p>
      ) : (
        <p className="text-[11px] text-white/35">
          3D mesh port next (MSC scene · OPF feed). Risk graph remains 2D OPF
          curves.
        </p>
      )}
    </div>
  );
}
