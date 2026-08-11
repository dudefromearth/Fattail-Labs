/**
 * Market data client — one plane for the whole site.
 *
 * Live underliers: `liveUnderlierPattern` + `useLiveUnderlierMarks` + `<LiveMid />`
 * Chain: `useOptionChainBus` / `MarketSocket`
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
