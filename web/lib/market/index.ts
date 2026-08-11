/**
 * Market data client — one plane for the whole site.
 *
 * Live underliers (SITE STANDARD): `liveUnderlierPattern` + `useLiveUnderlierMarks` +
 *   `<LiveMid />` / `LiveUnderliersTable` — Arch 28 §4.4 · AGENTS.md invariant 9 · DL-300
 * Chain: `useOptionChainBus` / `MarketSocket`
 * Low-level WS only: `useSymbolMarks` (prefer the hook above for product mids)
 */

export {
  bindUnderlierMark,
  formatDayPct,
  formatUnderlierMid,
  LIVE_UNDERLIER_POLL_MS,
  LIVE_UNDERLIER_SERVER_MAX_AGE_S,
  type BoundUnderlierMark,
} from "./liveUnderlierPattern";

export {
  useLiveUnderlierMarks,
  useLiveUniverseMarks,
  type LiveUnderlierRow,
} from "./useLiveUnderlierMarks";

export { useSymbolMarks, type SymbolMark } from "./useSymbolMarks";
export { getMarketSocket, MarketSocket } from "./MarketSocket";
export { subscribeSharedUniverse } from "./sharedUniversePoll";
