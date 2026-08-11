/**
 * Chain IV map interface — MSC shape (no poller in Labs Analyzer v1).
 * Pass null to useRiskGraphCalculations to fall through to VIX/regime IV.
 */

export interface ChainIVMap {
  get(strike: number, type: "call" | "put", expiration: string): number | null;
  getNearest(
    strike: number,
    type: "call" | "put",
    expiration: string,
  ): number | null;
  getClosestDTE(
    strike: number,
    type: "call" | "put",
    targetExpiration: string,
  ): number | null;
}
