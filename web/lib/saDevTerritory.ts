/** SA-L11 — the map shows the whole territory. Doctrine from SA v0.4 §8a / §1. */

export type TerritoryStatus = "shipping" | "in-development";

export type TerritoryEntry = {
  id: string;
  label: string;
  status: TerritoryStatus;
  doctrine: string;
};

export const SA_DEV_TERRITORY: TerritoryEntry[] = [
  {
    id: "structure",
    label: "Structure",
    status: "shipping",
    doctrine:
      "Nodes, edges, crevasses, groupings, uncharted — terrain context for positioning defined-risk structures (SA spec §1).",
  },
  {
    id: "replay",
    label: "Replay",
    status: "in-development",
    doctrine:
      "TPO / market-profile replay of how a session unfolded — useful because a volume profile flattens time away; never day-typing (SA-L12). Data requirement already satisfied: prints stored with timestamps.",
  },
  {
    id: "footprint",
    label: "Footprint / Market Delta",
    status: "in-development",
    doctrine:
      "Bid/ask-classified volume at each price inside a time-sliced bar. The Market Profile lineage that survives the doctrine filter (aggression, not a named shape). No fabricated delta.",
  },
  {
    id: "gex-overlay",
    label: "GEX Overlay",
    status: "in-development",
    doctrine:
      "GEX (fast, daily) beside structure (slow) for legibility. A disagreement alert would be a forecast and a third product — out of scope (SA-L5 / SA-L10).",
  },
  {
    id: "characterization",
    label: "Characterization",
    status: "in-development",
    doctrine:
      "Distributions over published objects (provenance, recency, test-history). Served only after the §12a validation study populates it. No forecast language (SA-L5).",
  },
  {
    id: "exploration",
    label: "Exploration",
    status: "in-development",
    doctrine:
      "Click-and-drag over price/date translates to VP /range queries surfaced through this service. Pane content is undecided (SA-Q11, Coach); objects-only is the standing law until his word (VP-L18).",
  },
];

export const SA_L11_RESERVED = [
  "replay",
  "footprint",
  "market_delta",
  "gex_overlay",
  "characterization",
  "exploration",
] as const;
