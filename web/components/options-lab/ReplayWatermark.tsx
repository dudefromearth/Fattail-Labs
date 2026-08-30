"use client";

/**
 * Time Machine tell — TMI-25 / TMI-27 / TMI-40.
 * Behind the plot. Not green. Not any P&L colour. Never interactive.
 * Always static (reduced-motion = no pulse because there is no motion).
 */

export default function ReplayWatermark(props: {
  testId: string;
  /** Analyzer/Surface canvases are opaque — sit above the paint, still under HUD. */
  layer?: "behind" | "over-canvas";
}) {
  const z = props.layer === "over-canvas" ? "z-[2]" : "z-0";
  return (
    <div
      aria-hidden
      data-testid={props.testId}
      data-replay=""
      className={
        "pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden " +
        z
      }
    >
      <span
        className="select-none text-[clamp(3rem,16vw,9rem)] font-semibold tracking-[0.28em] text-white/[0.09]"
        data-replay-mark=""
      >
        REPLAY
      </span>
    </div>
  );
}
