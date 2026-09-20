/** Registry API rows — spec v0.2.1 §2 / §4. Surfaces render these; they do not invent rows. */

export type SymbologyRowType =
  | "root"
  | "contract"
  | "continuity-alias"
  | "cash"
  | "stock"
  | "index";

export type SymbologyRole = "options" | "price-structure" | "volume-source";

export type SymbologyState = "ACTIVE" | "COMING" | "INELIGIBLE" | "STALE";

export type GrayReason = {
  reason_code: string;
  copy: string;
};

export type SymbologyRow = {
  type: SymbologyRowType;
  symbol: string;
  root: string;
  roles: string[];
  state: SymbologyState | null;
  member_visible: boolean;
  has_chains: boolean;
  may_be_active: boolean;
  metadata_ref: string | null;
  gray: GrayReason | null;
  bound_symbol?: string;
  /** Plain-English name from the registry. Surfaces do not invent membership. */
  display_name?: string;
};

export type UniverseGroup = {
  root: string;
  rows: SymbologyRow[];
  /** Dated long form as-of strip_generation_id. Futures groups only. */
  front?: string | null;
  /** Next contract after front on the live strip. Futures groups only. */
  forward?: string | null;
};

export type UniversePayload = {
  strip_generation_id: string;
  house_preset_id: string;
  roles: string[];
  groups: UniverseGroup[];
};

export type ResolvePayload = {
  strip_generation_id: string;
  house_preset_id: string;
  type: "binding" | "matches" | "miss";
  q: string;
  preset_applied?: string;
  binding: (SymbologyRow & { bound_symbol?: string }) | null;
  matches?: SymbologyRow[];
  miss?: GrayReason;
};

export type DisplayShape = {
  kind: "decimal" | "fractional";
  precision: number;
  fraction?: { denominator: number; separator: string; width: number };
};

export type ContractSpec = {
  symbol: string;
  queried_symbol: string;
  title: string;
  spec_version: number;
  as_of: string;
  citation: {
    exchange: string;
    title: string;
    url: string;
    retrieved_at: string;
    snapshot: string;
  };
  exchange: string;
  product_codes: { globex: string; clearport: string; clearing: string };
  tick_size: number;
  big_point_value: number;
  tick_value: number;
  display_shape: DisplayShape;
  months: string[];
  periodicity: string;
  settlement: string;
  calendar_id: string;
  state: string | null;
  roles: string[];
  member_visible: boolean;
  session_summary?: string;
};

export type SymbolBind = {
  /** Dated long form or cash/index identity the surface may mount. */
  boundSymbol: string;
  queried: string;
  type: SymbologyRowType;
  root: string;
  roles: string[];
  continuity: boolean;
  /** Interim continuity caption — empty when the member picked a dated contract. */
  continuityCaption: string;
  state: SymbologyState | null;
  gray: GrayReason | null;
};

export type ClassChipId = "all" | "futures" | "stocks" | "indices";

export const CLASS_CHIPS: { id: ClassChipId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "futures", label: "Futures" },
  { id: "stocks", label: "Stocks" },
  { id: "indices", label: "Indices" },
];

export const CONTINUITY_CAPTION = "opens front contract · continuous coming";

export const SYM_ROLES_VP: readonly SymbologyRole[] = [
  "options",
  "price-structure",
];

/** Options-lab apps later: futures gray via resolve miss copy. */
export const SYM_ROLES_OPTIONS: readonly SymbologyRole[] = ["options"];
