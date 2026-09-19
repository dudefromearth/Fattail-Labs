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
};

export type UniverseGroup = {
  root: string;
  rows: SymbologyRow[];
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
