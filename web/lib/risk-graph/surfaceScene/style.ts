export type SurfaceDrawStyle = "solid" | "ghost";

/** Expired ghost is wire only — Analyzer equivalent (DL-446). */
export function surfaceFillEnabled(style: SurfaceDrawStyle): boolean {
  return style === "solid";
}
