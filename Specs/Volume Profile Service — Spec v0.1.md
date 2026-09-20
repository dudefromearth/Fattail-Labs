# Volume Profile Service — Spec v0.1

**Status:** DRAFT
**Date:** 2026-09-16
**Supersedes:** none (initial version)
**Service host:** StudioOne (ingest, alongside FatTail-Intelligence feeds);
compute + API co-located there for Stage A, migration to Dude two permitted
later without contract change.
**Consumers:** Options Lab (Volume Profile view, heat map context, Analyzer
overlays), Strategy Lab, IKI Lab templates.

---

## 0. Shape of the service — three parts

1. **Volume Ingest** — captures trade prints (or finest available aggregates)
   for the *volume-source* instruments.
2. **Profile Engine** — turns captured volume into profiles: session,
   composite, and developing; POC / Value Area / HVN / LVN; plus the
   proxy-to-target price mapping.
3. **Profile API** — serves computed profiles and level sets to consumers.
   Consumers never compute; they render.

Each part is independently testable and independently restartable. The Engine
reads only what Ingest wrote; the API reads only what the Engine wrote.

## 1. Purpose

Volume Profile is the third piece of the Options Lab trifecta (heat map,
analyzer, profile). The service answers *where the terrain is* — acceptance,
liquidity, likely rotation vs break — as positioning context for defined-risk
structures. Doctrine invariant: context, never forecast. No output of this
service may be labeled or described predictively.

## 2. Symbol staging

The instruments members trade options on (XSP, SPX) print no usable volume
themselves. The service therefore computes profiles on a **volume source** and
maps the result onto a **target** price scale.

| Stage | Volume source | Target | Notes |
|-------|--------------|--------|-------|
| A | SPY (trade prints) | XSP | ~1:1 price scale (both ≈ SPX/10); residual basis handled by mapping (§5) |
| B | ES futures | SPX | 1:1 point scale; futures basis handled by mapping; data-vendor coverage to be confirmed (§9 Q1) |

A profile is always published under its **target** symbol, with the source and
mapping method carried in metadata (proxy-honesty).

## 3. Part 1 — Volume Ingest

- Extends the existing StudioOne collection pattern (sym_feed / chain_feed
  under launchd KeepAlive).
- Captures per-source-symbol: trade price, size, timestamp, exchange
  condition codes sufficient to exclude non-regular prints (odd-lot policy
  is a named parameter, vp.include_oddlots, default include).
- Granularity: trade prints preferred; if the feed tier only exposes
  aggregates, finest available bars are stored and the approximation is
  carried in metadata end-to-end.
- Sessioning: RTH 09:30–16:00 ET for SPY. ES (Stage B) stores the full
  Globex session tagged by segment (overnight / RTH), so the Engine can build
  RTH-only and full-session profiles from the same store.
- Storage: append-only, compressed, same archive-and-nightly-backup regime
  as the chain-data archive on StudioOne's second volume; the archive-health
  watcher covers these files too.
- Fail loud: gaps in capture are recorded as explicit gap markers, never
  silently absent.

## 4. Part 2 — Profile Engine

4.1 **Histogram.** Volume-at-price rows over the requested window, computed
    in the source's own price space first.
    Default row size (source space): SPY $0.10; ES 0.25 pt.
    Row size is a parameter (vp.row_size), auto by default.
4.2 **POC.** Max-volume row; ties resolve to the row nearest session VWAP.
4.3 **Value Area.** Standard 70% expansion from POC (larger adjacent
    row-pair first) until ≥70% of window volume is enclosed → VAH/VAL.
4.4 **HVN/LVN.** Local extrema with prominence filter; LVN = local minimum
    < 40% of the smaller neighboring peak (vp.lvn_prominence), HVN inverse.
4.5 **Profile kinds.**
    - *Session*: one RTH session.
    - *Composite*: rolling N RTH sessions (N ∈ {5, 10, 20}, configurable).
    - *Developing*: current session, recomputed on vp.update_cadence
      (default 15 s). Composite recomputes at session close.
4.6 **Determinism.** Same stored data + same parameters ⇒ identical levels.
    All parameters versioned; every published profile records the parameter
    set that produced it.

## 5. Price mapping (Engine responsibility)

- Profiles are computed in source space, then mapped to target space by a
  per-session **basis model**: target ≈ source × ratio + offset, fitted from
  synchronized source prints and target quotes (ChainStore underlying marks)
  over the session, refreshed on the same cadence as the developing profile.
- Stage A (SPY→XSP): ratio ≈ 1, offset absorbs dividend/NAV drift.
- Stage B (ES→SPX): ratio = 1, offset = futures basis, decaying to 0 at
  expiry of the front contract; roll handling specified before Stage B ships.
- Mapped levels round to the target's natural row grid (target strike
  step ÷ 5 — SPX: 1.0 pt, XSP: 0.1 pt), consistent with the heat map's
  symbol-metadata evaluation. No per-symbol constants in code (metadata
  service only).
- Every mapped level carries: source symbol, basis parameters, fit timestamp.

## 6. Part 3 — Profile API

- Read-only HTTP API on StudioOne, same access pattern as the existing
  chain-snapshot API feeding Options Lab and Strategy Lab.
- Endpoints (shape, not final naming):
  - `GET /profile/{target}/{kind}` — kind ∈ session | composite | developing;
    query: date or Time Machine timestamp, lookback N, row size override.
  - `GET /levels/{target}` — compact level set only (POC, VAH, VAL, HVN[],
    LVN[], prior-session VA) for overlay consumers (heat map, Analyzer).
  - `GET /health` — ingest liveness, last print per source, gap report.
- Time Machine: any stored timestamp renders the profile as of that moment,
  consistent with the heat map's view of the same moment.
- Responses always include: source symbol, mapping metadata, parameter set,
  approximation flags, gap flags.

## 7. Invariants

- **VP-L1** No predictive language in any served label or metadata.
- **VP-L2** All numbers computed inside the service from captured data;
  consumers render only.
- **VP-L3** Symbol behavior (row grids, scaling) derives from the shared
  symbol-metadata evaluation; no hardcoded per-symbol constants.
- **VP-L4** Proxy-honesty: source instrument and mapping parameters travel
  with every profile and level set, end to end.
- **VP-L5** Fail loud: capture gaps and mapping-fit failures surface in the
  API response; a partial profile is never served as whole.
- **VP-L6** Determinism per §4.6.
- **VP-L7** Part isolation: Ingest, Engine, and API restart independently;
  no part reaches around another's store.

## 8. Acceptance tests

- **AT-1** SPY session POC/VAH/VAL for a completed session match an
  independent reference computation within one row.
- **AT-2** Mapped XSP levels reprice against XSP marks within one target row
  across a full session (basis model sanity).
- **AT-3** Value Area encloses ≥70%; removing its outermost pair drops below.
- **AT-4** Same window + parameters twice ⇒ byte-identical level sets (VP-L6).
- **AT-5** Kill test per part: each of Ingest/Engine/API restarts under
  supervision without corrupting the others' stores (VP-L7), matching the
  launchd KeepAlive pattern already proven for sym_feed/chain_feed.
- **AT-6** A ≥5-min capture gap inside a window yields an explicit gap flag
  in the API response and the view (VP-L5).
- **AT-7** Time Machine parity with the heat map for the same timestamp.
- **AT-8** XSP and SPX row grids resolve through the metadata service with
  zero per-symbol constants in service code (VP-L3).

## 9. Open questions

- **Q1 (blocks Stage B only):** Does the Massive subscription tier include
  CME futures (ES) trade data? If not, Stage B needs a second feed decision.
  Stage A is unaffected.
- **Q2:** Does sym_feed as running today already capture SPY trade prints,
  or quotes/bars only? Determines whether Ingest extends sym_feed or adds a
  sibling collector. (Verifiable on StudioOne before implementation.)
- **Q3:** For ES in Stage B, is the default member-facing profile RTH-only
  or full Globex? Both are computable from the same store (§3); this only
  sets the default toggle.

## 10. Change log

- v0.1 — initial draft (Claude). Structure assumption on record: three parts
  = Ingest / Engine / API.