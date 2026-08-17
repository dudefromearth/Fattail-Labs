/**
 * Options Lab suite — Market / analyzer parent.
 * Nav: Volume Profile · Heatmap · Analyzer · Surface.
 * Shared symbol selection across apps (Admin universe).
 */

export type OptionsLabAppId =
  | "volume-profile"
  | "heatmap"
  | "analyzer"
  | "surface";

export type OptionsLabAppItem = {
  id: OptionsLabAppId;
  label: string;
  href: string;
  blurb: string;
  status: "live" | "soon";
};

export const OPTIONS_LAB_SUITE: OptionsLabAppItem[] = [
  {
    id: "volume-profile",
    label: "Volume Profile",
    href: "/app/options-lab/volume-profile",
    blurb:
      "Volume-by-price bins (profile only — no candles) — session structure before structure.",
    status: "live",
  },
  {
    id: "heatmap",
    label: "Heatmap",
    href: "/app/options-lab/heatmap",
    blurb:
      "Options chain / convexity views — ladder now; butterfly and vertical templates later.",
    status: "live",
  },
  {
    id: "analyzer",
    label: "Analyzer",
    href: "/app/options-lab/analyzer",
    blurb:
      "Exercise OPF model packs on live dual-side chain — expiration + T+0/scenario curves; ToS paste or Heatmap ⌥-click.",
    status: "live",
  },
  {
    id: "surface",
    label: "Surface",
    href: "/app/options-lab/surface",
    blurb:
      "3D P&L tent of the shown listed book — exact or locked IV, or a named hole.",
    status: "live",
  },
];

export function optionsLabApp(id: OptionsLabAppId): OptionsLabAppItem {
  const item = OPTIONS_LAB_SUITE.find((a) => a.id === id);
  if (!item) throw new Error(`Unknown Options Lab app: ${id}`);
  return item;
}
