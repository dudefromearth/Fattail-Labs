# VP Data Delivery — Spec v1.0

**Status:** BINDING deliverable spec (Coach directive: at least 3
months of downloadable price history, and live prices — which are
already ours, relayed at zero marginal cost). Consolidates the
backfill, hot-tier, and streaming directives into one testable
contract of delivery.
**Date:** 2026-09-18
**Parents:** VP Service Spec v0.6.1 (ingest/tranche law), Contract
v1.3 (stream), Contract v1.2.1 (payloads), amendments A12/A14/A17.

## 1. History deliverable

- **D1 — Minimum member-visible history: 3 months (~63 RTH
  sessions) per served ticker**, pannable on the chart per the
  hydration law, at every timeframe (1m…1d) and in the profile's
  full-history attribution. 3 months is the FLOOR of acceptable,
  not the target.
- **D2 — Standing target: 6 months per stable ticker**, primaries
  (ES, MES, SPY) continuing to vendor floors (2017-04 / 2019-05 /
  equities floor). Floors advance nightly; they never retreat.
- **D3 — Vendor fetch is real code:** date-addressed vendor day
  files, manifest/checksum verified, resumable, strictly
  contiguous descending; land → bin → buckets → hot-tier warm →
  coverage floor advances on /health, per tranche, automatically.

## 2. Catch-up schedule (until D1, then D2, is met)

- **S1 —** The overnight window is 16:05 ET → 08:30 ET hard stop
  (CP-1: vendor REST shares the chain_feed account, so pulls run
  only in this window, politely rate-limited; the account is
  never contended during RTH).
- **S2 —** Each window runs tranches CONTINUOUSLY until the
  window closes or targets are met — not a fixed small batch.
  Expected: D1 (3 months, 3 sources) within 1–3 windows pending
  vendor rate limits; D2 within the week; report actual sessions/
  hour from night one and restate the ETA with evidence.
- **S3 —** Every window's report states floors per source vs D1/D2
  targets. A vendor-side limit is named with numbers, never
  absorbed silently.

## 3. Live prices deliverable

- **D4 —** Every served ticker streams live per Contract v1.3
  (ticks ≤ ~4 Hz display cadence, bar-closes, gen events,
  heartbeat), relayed from OUR capture — the streamer tails the
  store; collectors untouched; zero added vendor cost by
  construction.
- **D5 —** On the canvas: the developing bar and last-price line
  tick live during market hours; the utility bar carries an
  honest LIVE/STALE indicator from the heartbeat's last-print
  age. Streamed data reconciles to authoritative payloads
  (v1.3 rule 1).

## 4. Acceptance (Coach's hands, on the member route)

- **T1 —** Select ES: pan left through ≥ 3 months of candles at 5m
  with no blank past inside coverage; the honest floor edge sits
  at the true floor.
- **T2 —** Profile chip reads "Full history · since <floor>" with
  the floor ≥ 3 months back; the terrain reflects it.
- **T3 —** During RTH: last-price line ticks within ~1 s of the
  tape; developing bar moves; indicator reads LIVE.
- **T4 —** Same three tests on MES and one non-primary stable
  ticker (A18 uniformity).
Acceptance is Coach performing T1–T4 on the glass; reports may
attest readiness but never substitute.

## 5. Round log

- v1.0 — this document. Binds INFRA (fetch, schedule, hot tier,
  streamer) and APPS (hydration depth, live rendering, indicator).
  Supersedes no law; it makes the delivery testable.
