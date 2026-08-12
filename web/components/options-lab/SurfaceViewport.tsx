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
  notice,
}: {
  hasTrade: boolean;
  symbol: string;
  packLabel: string;
  loading?: boolean;
  error?: string | null;
  /** OT-EF Law B notice — never cryptic internal codes */
  notice?: { title: string; detail: string } | null;
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
      {notice ? (
        <div
          className="max-w-sm rounded-2xl border border-white/12 bg-black/45 px-5 py-4"
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
        <p className="text-xs text-white/40">
          Focus a position or load a structure to drive the surface.
        </p>
      ) : loading ? (
        <p className="text-xs text-white/50">
          Preparing the surface mesh for this structure…
        </p>
      ) : error ? (
        <div className="max-w-sm rounded-2xl border border-white/12 bg-black/45 px-5 py-4">
          <div className="text-[13px] font-semibold tracking-wide text-white/90">
            CHECK LEGS
          </div>
          <p className="mt-1.5 text-[12px] leading-snug text-white/55">
            Could not build a package surface yet. Confirm every leg is listed
            and try again.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-white/35">
          3D mesh port next (MSC scene · OPF feed). Risk graph remains 2D OPF
          curves.
        </p>
      )}
    </div>
  );
}
