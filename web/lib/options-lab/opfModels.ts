/**
 * OPF model catalog for Analyzer — the only pricing models the UI may offer.
 * MSC regime / Heston / Monte Carlo are not supported and not listed.
 */

export type OpfUseCase = "day_trade" | "outlook" | "backtest";

export type OpfModelOption = {
  useCase: OpfUseCase;
  packId: string;
  /** Short UI name */
  label: string;
  /** One-line description for the control */
  description: string;
  /** Curve series label for T+0 / scenario */
  theoLegend: string;
  /** Whether dense dual curves are expected */
  dualCurves: boolean;
};

/** Canonical Analyzer models — exercise OPF L3 packs only. */
export const OPF_ANALYZER_MODELS: OpfModelOption[] = [
  {
    useCase: "day_trade",
    packId: "day_trade.mark_hybrid@1.0.0",
    label: "Day trade · mark hybrid",
    description: "Live mids + T+0 named engine (BSM/CRR) · per-leg chain IV · RECON",
    theoLegend: "T+0 (mark hybrid)",
    dualCurves: true,
  },
  {
    useCase: "day_trade",
    packId: "day_trade.surface@1.0.0",
    label: "Day trade · surface",
    description: "Live mids + T+0 from total-variance / log-moneyness surface",
    theoLegend: "T+0 (surface)",
    dualCurves: true,
  },
  {
    useCase: "outlook",
    packId: "outlook.scenario_surface@1.0.0",
    label: "Outlook · scenario",
    description: "Time roll + vol scenarios — labeled scenario, not live mark",
    theoLegend: "Scenario",
    dualCurves: true,
  },
  {
    useCase: "outlook",
    packId: "outlook.dynamics@1.0.0",
    label: "Outlook · dynamics",
    description: "SABR smile morph with fit gate → scenario fallback",
    theoLegend: "Scenario (dynamics)",
    dualCurves: true,
  },
  {
    useCase: "backtest",
    packId: "backtest.chain_replay@1.0.0",
    label: "Backtest · chain replay",
    description: "Cold archive generations (fail loud without archive)",
    theoLegend: "Historical",
    dualCurves: false,
  },
  {
    useCase: "backtest",
    packId: "backtest.surface_reconstruct@1.0.0",
    label: "Backtest · surface reconstruct",
    description: "Weaker parametric reconstruct — labeled historical",
    theoLegend: "Historical (reconstruct)",
    dualCurves: false,
  },
];

export const DEFAULT_OPF_MODEL = OPF_ANALYZER_MODELS[0];

export function findOpfModel(packId: string | null | undefined): OpfModelOption {
  if (!packId) return DEFAULT_OPF_MODEL;
  return (
    OPF_ANALYZER_MODELS.find(
      (m) => m.packId === packId || packId.startsWith(m.packId.split("@")[0]),
    ) ?? DEFAULT_OPF_MODEL
  );
}
