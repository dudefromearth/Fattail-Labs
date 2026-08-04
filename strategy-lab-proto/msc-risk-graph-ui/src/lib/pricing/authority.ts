/**
 * Risk Graph pricing authority flag.
 *
 * Labs: default OFF (legacy client BS via useRiskGraphCalculations).
 * MSC production uses server realtime authority; without chain/SSE that path
 * returns empty curves ("Add a position" / flat $0 chart).
 *
 * Override: ?priceMode=authority → enable MSC server path (needs APIs).
 */
export const USE_REALTIME_AUTHORITY: boolean =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('priceMode') === 'authority'
    : false;

if (typeof window !== 'undefined') {
  console.info(
    `[RiskGraph Labs] USE_REALTIME_AUTHORITY=${USE_REALTIME_AUTHORITY} (client BS curves)`,
  );
}
