# VP Chart Primitive Migration — Spec v1.0

**Version:** v1.0 (first numbered version; supersedes nothing — prior drafts were unnumbered chat iterations)
**Date:** 2026-09-19
**Machine:** StudioTwo (dev)
**Scope:** FatTail Labs — VP/structure app, Lightweight Charts widget only
**Basis:** `Volume-Profile-Lightweight-Charts-Rendering-Audit-2026-09-19.md` (GO verdict)
**Series ID:** AZ-VP-9-A23 — assigned 2026-09-19 on intake (next free after A22). Source file `Specs/VP-Chart-Primitive-Migration-Spec-v1_0.md` unchanged.
**Status:** BUILD AUTHORITY — Coach stamp 2026-09-19 (zOrder `"top"`; overlay flag W1-G→W3 only). Source sha1 `3880bb2b7aba10586188a409515a07b751f44cbd` verified.

---

## Objective

Make the volume profile a first-class citizen of the chart's paint loop: attach the existing `VpHistogramPrimitive` (`web/lib/saVpSeries.ts`) to the candlestick series via `attachPrimitive()`, and delete the sibling-canvas overlay (`sa-vp-overlay`) and all of its manual redraw plumbing. The chart engine — not app code — drives every repaint from then on.

## Invariants (do not violate)

- **Doctrine:** the profile always shows full-history volume constrained only by the visible price axis. Fetch-band behavior in `saVpBand.ts` and the `/api/app/vp/v1/range/…` contract are unchanged.
- **Guest-layer law:** the primitive adds to the pane; it never overrides autoscale or mutates series data.
- **Widget-only:** no changes to the VP service, API, or ingest side.
- **Structural-analysis hooks** stay intact (overlay feature, off by default).

## Audit finding traceability

Every ranked fragility from the audit is dispositioned below. None dropped.

| # | Audit finding | Disposition |
|---|---------------|-------------|
| 1 | Profile not in chart paint loop; every event must remember to call `redrawVp` | **W1** — `attachPrimitive()`; engine drives all repaints |
| 2 | Coordinate math against host box including time-axis pixels | **W1** — corrected to pane-only extent inside the renderer |
| 3 | Independent `/range` fetch blits outside paint loop, possibly before price scale has a range | **W1** — fetch completion routes through `requestUpdate()`; engine repaints when the scale is ready |
| 4 | Silent `redrawVp` abort on sub-8px host or unset refs | **W3** — `redrawVp` deleted; paint conditions become the engine's problem |
| 5 | Three time-range subscriptions, one never unsubscribed | **W3** — consolidated; every subscription unsubscribed in its own effect |
| 6 | 250 ms poll + `inflightRef` can drop a needed band fetch | **W2** — inflight fixed (queue or re-check on completion); **W3** — poll deleted |
| 7 | Stale bins shown across symbol/TF change | **W2** — bins cleared or flagged stale before the new fetch dispatches |
| 8 | Dead primitive beside live overlay; stale "L2 custom series" comments | **W1** — primitive becomes the live path; **W3** — overlay and stale comments removed |

## Work packets

### W1 — Attach and wire the primitive

- In `SaPriceChart.tsx`, attach `VpHistogramPrimitive` to the candle series via `attachPrimitive()` at series creation.
- Implement the missing `updateAllViews()` on the primitive.
- Route `/range` fetch completion through the primitive: set bins, then `requestUpdate()` — no direct 2D blits from the fetch path.
- Coordinate math moves inside the renderer using the coordinate space the engine hands it. The host-box `coordinateToPrice(0)` / `coordinateToPrice(clientHeight)` band calculation is corrected to pane-only extent (audit finding 2).
- zOrder stays `"top"`. *Recorded decision, Coach may override:* no evidence a different layer is needed; change only with a stated reason in the gate report.

**Gate W1-G:** Profile renders via the primitive with the overlay still present but disabled behind a flag. Pan, zoom, and resize repaint the profile with zero app-side redraw calls.

*Recorded decision, Coach may override:* the disabled overlay is kept behind a flag only between W1-G and W3, within this build — one-gate rollback insurance, then demolished. It does not survive to production.

### W2 — Lifecycle hygiene

- On symbol or timeframe change: clear the primitive's bins (or mark stale) **before** the new `/range` fetch dispatches. No ghost histogram on new candles (audit finding 7).
- Fix `inflightRef` so a band request landing during an open request cannot drop a needed refetch — queue or re-check on completion (audit finding 6).
- Verify Strict Mode double-mount: primitive attaches once per live chart instance; `chart.remove()` cleans it.

**Gate W2-G:** Rapid symbol flips and TF changes show either fresh bins or an explicit empty state — never the previous symbol's histogram.

### W3 — Demolition

- Delete the overlay canvas (`sa-vp-overlay`), `overlayRef`, `redrawVp`, and every manual poke: the ResizeObserver redraw hook (`chart.resize` stays), the unsubscribed time-range subscription at the chart-create effect, the 250 ms `setInterval` poll, and the post-`setData` / prefs / stream redraw calls.
- Consolidate the remaining time-range subscriptions (refetch + H/L lines); every subscription unsubscribed in its own effect.
- Re-point hit-testing (`hitRects` / context menu) at the primitive's geometry, or use the primitive `hitTest` interface if LWC 4.2.3 supports it. *Implementer's choice; record which in the gate report.*
- Remove the stale "L2 custom series" comments; the file reflects what runs.

**Gate W3-G:** `git grep` shows no `redrawVp`, no overlay canvas, no poll. Context menu on a histogram bar still resolves correctly.

### W4 — Verification and doc close-out

- Regression pass on both mounts: member route `/app/options-lab/volume-profile` and admin twin `SaDevCanvas`.
- Exercise: cold load, load with throttled `/range`, resize to tiny and back, pan/zoom storms, symbol flip mid-fetch, TF change, Strict Mode remount.
- Confirm audit finding 4 is gone: a sub-8px host or late scale resolves on the next engine frame without app intervention.
- Per the amend flow: same-day decision-log entry (DL-###), owning architecture doc updated, India drift check against the as-built code.

**Gate W4-G (final):** Full report to Coach with explicit GO / NO-GO, files changed, line counts deleted vs added, and any deviation from this spec.

## Acceptance

The profile is exactly as reliable as the candlesticks, because the same engine paints both. Deleted plumbing exceeds added code.

## Open decisions requiring Coach

None beyond the Phase-5 BUILD AUTHORITY stamp itself. Two decisions are recorded above with rationale (zOrder, overlay-flag lifespan) and may be overridden at approval.
