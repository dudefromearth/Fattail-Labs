/**
 * Session-sticky Heatmap inspector prefs.
 * sessionStorage so leaving for other apps/suites and returning in this
 * tab restores choices; a new tab/session starts clean.
 */

import { STRIKE_WING_CHOICES, type StrikeWings } from "@/lib/chainLadderApi";
import {
  BW_STRIKE_COUNT_CHOICES,
  BW_STRIKE_COUNT_DEFAULT,
  BW_WING_SIDE_DEFAULT,
} from "@/lib/options-lab/templates/bwFly";
import { DEFAULT_ROC_SENSITIVITY } from "@/lib/options-lab/templates/color";
import {
  getTemplate,
  HEATMAP_TEMPLATES,
} from "@/lib/options-lab/templates/registry";
import type {
  BwWingSide,
  ValueModeId,
  VerticalKind,
  WidthFitWeights,
} from "@/lib/options-lab/templates/types";
import { verticalKindFromMode } from "@/lib/options-lab/templates/vertical";
import {
  DEFAULT_WIDTH_FIT_WEIGHTS,
  resolveWidthFitWeights,
} from "@/lib/options-lab/templates/widthFit";
import {
  clampBudgetMib,
  clampWindow,
  DEFAULT_BUDGET_MIB,
  type AverageWindow,
  type BudgetStopMib,
} from "@/lib/runner/streamBook";

export const HEATMAP_SESSION_KEY = "ft_labs_heatmap_session";

export type HeatmapSessionPrefs = {
  symbol: string;
  expiration: string;
  side: "call" | "put";
  wings: StrikeWings;
  templateId: string;
  valueMode: ValueModeId;
  verticalKind: VerticalKind;
  rocSensitivity: number;
  bwStrikeCount: number;
  bwWingSide: BwWingSide;
  widthFitWeights: WidthFitWeights;
  widthFitExpanded: boolean;
  wfIface: "heatmap" | "ranking";
  wfTime: "live" | "average" | "replay";
  wfWindow: AverageWindow;
  cacheBudgetMib: BudgetStopMib;
};

type Store = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function sessionStore(): Store | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function parseHeatmapSession(raw: unknown): HeatmapSessionPrefs | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const symbol = String(o.symbol || "").trim().toUpperCase();
  if (!symbol) return null;
  const templateId = HEATMAP_TEMPLATES.some((t) => t.id === o.templateId)
    ? String(o.templateId)
    : "";
  if (!templateId) return null;
  const tpl = getTemplate(templateId);
  const valueMode = tpl.valueModes.some((m) => m.id === o.valueMode)
    ? (o.valueMode as ValueModeId)
    : tpl.defaultValueMode;
  const side = o.side === "put" ? "put" : "call";
  const wingsRaw = Number(o.wings);
  const wings = (
    STRIKE_WING_CHOICES.includes(wingsRaw as StrikeWings)
      ? wingsRaw
      : STRIKE_WING_CHOICES[0]
  ) as StrikeWings;
  const roc = Number(o.rocSensitivity);
  const bwN = Number(o.bwStrikeCount);
  const bwStrikeCount = BW_STRIKE_COUNT_CHOICES.includes(
    bwN as (typeof BW_STRIKE_COUNT_CHOICES)[number],
  )
    ? bwN
    : BW_STRIKE_COUNT_DEFAULT;
  const bwWingSide: BwWingSide =
    o.bwWingSide === "furthest" || o.bwWingSide === "closest"
      ? o.bwWingSide
      : BW_WING_SIDE_DEFAULT;
  return {
    symbol,
    expiration: String(o.expiration || ""),
    side,
    wings,
    templateId,
    valueMode,
    verticalKind: verticalKindFromMode(
      valueMode,
      o.verticalKind === "credit" ? "credit" : "debit",
    ),
    rocSensitivity: Number.isFinite(roc)
      ? Math.max(0, Math.min(100, roc))
      : DEFAULT_ROC_SENSITIVITY,
    bwStrikeCount,
    bwWingSide,
    widthFitWeights: resolveWidthFitWeights(
      o.widthFitWeights as Partial<WidthFitWeights>,
    ),
    widthFitExpanded: o.widthFitExpanded === true,
    wfIface: o.wfIface === "ranking" ? "ranking" : "heatmap",
    wfTime:
      o.wfTime === "average"
        ? "average"
        : o.wfTime === "replay"
          ? "replay"
          : "live",
    wfWindow: clampWindow(Number(o.wfWindow) || 10),
    cacheBudgetMib: clampBudgetMib(
      Number(o.cacheBudgetMib) || DEFAULT_BUDGET_MIB,
    ),
  };
}

export function readHeatmapSession(
  store: Store | null = sessionStore(),
): HeatmapSessionPrefs | null {
  if (!store) return null;
  try {
    const raw = store.getItem(HEATMAP_SESSION_KEY);
    if (raw) return parseHeatmapSession(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return migrateLegacy(store);
}

function migrateLegacy(store: Store): HeatmapSessionPrefs | null {
  if (typeof window === "undefined") return null;
  let ls: Store | null = null;
  try {
    ls = window.localStorage;
  } catch {
    return null;
  }
  if (!ls) return null;
  try {
    const t = ls.getItem("ft_labs_width_fit_time");
    const i = ls.getItem("ft_labs_width_fit_interface");
    const w = ls.getItem("ft_labs_width_fit_avg_window");
    const b = ls.getItem("ft_labs_runner_cache_budget_mb");
    if (t == null && i == null && w == null && b == null) return null;
    const partial = parseHeatmapSession({
      symbol: "SPX",
      expiration: "",
      side: "call",
      wings: 25,
      templateId: "width-fit",
      valueMode: "width_fit",
      rocSensitivity: DEFAULT_ROC_SENSITIVITY,
      bwStrikeCount: BW_STRIKE_COUNT_DEFAULT,
      bwWingSide: BW_WING_SIDE_DEFAULT,
      widthFitWeights: DEFAULT_WIDTH_FIT_WEIGHTS,
      widthFitExpanded: false,
      wfIface: i,
      wfTime: t,
      wfWindow: w,
      cacheBudgetMib: b,
    });
    return partial;
  } catch {
    return null;
  }
}

export function writeHeatmapSession(
  prefs: HeatmapSessionPrefs,
  store: Store | null = sessionStore(),
): void {
  if (!store) return;
  try {
    store.setItem(HEATMAP_SESSION_KEY, JSON.stringify(prefs));
  } catch {
    /* quota / private */
  }
}
