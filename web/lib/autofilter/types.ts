/** Shared Autofilter types. Nothing Trade-Log-specific. */

export const NONE_TOKEN = "none";

export type FilterType = "value" | "date";

export type ColumnDef<R> = {
  key: string;
  label: string;
  type: FilterType;
  /**
   * null / empty → NONE_TOKEN so nullable columns stay reachable.
   * An array is OR within the row (e.g. every leg symbol on a trade block).
   */
  read: (row: R) => string | string[] | null;
};

/** Applied picks per column. Missing or empty = no filter on that column. */
export type FilterMap = Record<string, string[] | undefined>;

export type FilterResult<R> = {
  rows: R[];
  shown: number;
  total: number;
  /** True when any column has an applied pick list. */
  filterOn: boolean;
};

export type SelectionGate = {
  disabled: boolean;
  reason: string | null;
};

/** Optional structural impossibility (e.g. campaign window vs selected days). */
export type Incompatibility = (filters: FilterMap) => string | null;

export type DateWindow = {
  id: string;
  start: string | null;
  end: string | null;
};
