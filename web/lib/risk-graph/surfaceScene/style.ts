export type SurfaceDrawStyle = "solid" | "ghost";

/** $0 plane opacity on first paint / HUD default. */
export const SURFACE_VALUE_PLANE_OPACITY_DEFAULT = 0.4;

/** Expired ghost is wire only — Analyzer equivalent (DL-446). */
export function surfaceFillEnabled(style: SurfaceDrawStyle): boolean {
  return style === "solid";
}
