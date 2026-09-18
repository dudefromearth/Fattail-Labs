/** SA-L11 §8.1 — the map shows the whole territory. Doctrine verbatim. */

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
      "Nodes, edges, crevasses, groupings, uncharted — terrain context for defined-risk structures.",
  },
  {
    id: "replay",
    label: "Replay",
    status: "in-development",
    doctrine:
      "How a session unfolded in time — a volume profile flattens that away. Market-profile / TPO-style replay. Not live until capture time-resolution is confirmed to support brackets.",
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
      "Distributions over published objects (provenance, recency, test-history). Build the view; let the data speak. No forecast language (SA-L5).",
  },
  {
    id: "exploration",
    label: "Exploration",
    status: "in-development",
    doctrine:
      "Click-and-drag over price/date translates to VP /range queries surfaced through this service; objects-first, this service's summary, not raw bins (VP-L18).",
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
