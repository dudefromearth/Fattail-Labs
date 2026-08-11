/**
 * Options Lab suite — Market / analyzer parent.
 * Nav: Volume Profile · Heatmap · Analyzer (risk graph).
 * Shared symbol selection across apps (Admin universe).
 */

export type OptionsLabAppId = "volume-profile" | "heatmap" | "analyzer";

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
      "Candlestick chart of the underlier with volume profile — session structure before structure.",
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
];

export function optionsLabApp(id: OptionsLabAppId): OptionsLabAppItem {
  const item = OPTIONS_LAB_SUITE.find((a) => a.id === id);
  if (!item) throw new Error(`Unknown Options Lab app: ${id}`);
  return item;
}
