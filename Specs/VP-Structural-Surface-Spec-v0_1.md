# VP Structural Product — Member Surface Spec v0.1 (DRAFT)

**Version:** v0.1 (DRAFT — first version; supersedes nothing)
**Date:** 2026-09-19
**Machine:** StudioTwo (dev) — specification only; files/trees touched by this document: NONE
**Scope:** Member-facing chart surface of the structural product. Rendering and surface law only. No data-plane, ingest, Engine, or EVENT-compute law lives here.
**Status:** DRAFT. **BUILD AUTHORITY: none.** No component work proceeds from this file.
**Canonical filename:** provisional — assigned the house `FatTail-Labs-…` pattern name at DL seating, per the construction spec's M1 convention. Header, filename, and footer change together when it lands.

**Parents (cited, not amended):**
- `Specs/AZ-VP-9-A23.md` — VP Chart Primitive Migration (stamped; W1–W4 in flight). This spec inherits its acceptance as foundation law.
- `VP-Overlay-Spec-v0_2.md` — Contract Overlay Construction (DRAFT, pending DL seat). Cited as VP-OVL-#; this file maps those laws to rendering and adds no construction law.
- VPS v0.2.1 — histogram data plane, `vp_row` grid (cited via the construction spec).
- Structural Analysis Service — separately commissioned downstream owner of nodes/crevices/structural levels; this surface consumes, never computes.

**Does not supersede:** anything. **Does not decide:** Q1 (participation set), Q2 (sequential join) — both fenced upstream and untouched here.

---

## §0 Dependency gates — nothing builds until all clear

| Gate | What it is | State at writing |
|---|---|---|
| G-A | AZ-VP-9-A23 W4-G final report, GO | Pending — build in flight |
| G-B | Construction spec DL seat (its M2) + Coach's §4.2 reversal stamp | Pending |
| G-C | VPS Q1 — per-contract ES/MES prints in native prices | Pending |
| G-D | Structural Analysis Service commissioned (for SRF-5 overlay data only; other components do not wait on it) | Not commissioned |

This spec may be iterated, ID'd, and even Phase-5 reviewed while gates are pending; no work packet dispatches until G-A through G-C are GO (G-D gates only the structural overlay component).

---

## §1 Purpose

Define the member surface: a TradingView-style chart (Lightweight Charts engine) limited strictly to specified VP features, serving the three governing uses — the morning routine, trade entry, and trade management. The actual volume profile is the primary view; structural analysis is an overlay, off by default. The profile always shows full-history volume constrained only by the visible price axis — explicitly not visible-time-range (VRVP) behavior.

---

## §2 Component inventory

This surface is a family of primitives sharing one chart shell — not one primitive, and never a sibling canvas.

| # | Component | Kind | Cardinality | Construction law it embodies |
|---|---|---|---|---|
| C1 | Contract histogram primitive | `ISeriesPrimitive` on a contract's own series | **One instance per contract** | VP-OVL-1, -10, -11 |
| C2 | Event marker primitive | `ISeriesPrimitive` on the cash (SPX/XSP) series | One per cash series | VP-OVL-6 |
| C3 | Structural-analysis overlay primitive | `ISeriesPrimitive`, off by default | One per chart | Doctrine (overlay, not primary) |
| C4 | Chart shell | Surface chrome: symbol/pair staging, rollover view settings, pane layout | One | VP-OVL-8 |
| C5 | Future-scope entries | Visible "in development" panels with doctrine text | Per future view | Standing directive |

---

## §3 Surface laws

**SRF-1 — Primitives only.** Every profile-related visual renders through an `ISeriesPrimitive` attached to a series, inside the engine's paint loop. Sibling canvases and manual redraw plumbing are prohibited. Inherits AZ-VP-9-A23's acceptance: the profile is exactly as reliable as the candlesticks because the same engine paints both.

**SRF-2 — One contract, one primitive, native prices.** Each C1 instance attaches to exactly one contract's series and draws only that contract's RAW-derived bins in that contract's native prices. A primitive holding bins from more than one contract is structurally prohibited — this is VP-OVL-10's "no merged picture" made physically impossible at the render layer, since each primitive draws only in its own series' coordinate space. Overlapping contracts render as separate primitive instances; how their panes/scales are arranged is §5-D1, but never one histogram on one price axis.

**SRF-3 — Events carry time and evidence, never a price.** C2 renders event records as time-axis markers on the cash series. The record's fields available to the renderer are: timestamp, contributing contracts, referenced bins (VP-OVL-4, -6). No price field exists to draw; the member reads the cash level live off the chart at the marked moment. An ES number therefore cannot be quoted as an SPX level by this surface — the old §3.5 failure mechanism has no rendering path.

**SRF-4 — Full history, price-axis constrained.** C1 renders full-history volume for its contract, constrained only by the visible price axis. Visible-time-range profiles (TV VRVP behavior) are prohibited. Band fetch against `/range` follows the A23-migrated path unchanged.

**SRF-5 — Structure is an overlay, off by default.** C3 draws nodes, crevices, and structural levels computed by the Structural Analysis Service — this surface never computes structure from bins. Default state: off. The display shows only the high/low range the member's current strategy requires; the analysis layer upstream always works the entire archive.

**SRF-6 — View-only coarsening.** RAW grain (`vp_row`, integer half-up snap, inherited grid) reaches the primitive untouched; any coarsening happens at render time inside the primitive (VP-OVL-5). Nothing the renderer does is ever written back toward the store.

**SRF-7 — Rollover settings are chart furniture.** C4's rollover configuration (vendor-named presets, manual configuration, sane silent default) affects chart display only and has no path to the model or the stores (VP-OVL-8).

**SRF-8 — Pairs stay parallel on screen.** ES→SPX and MES→XSP are parallel pair surfaces. MES bins never render on an XSP number line unscaled, and no cross-pair co-rendering onto one axis exists (VP-OVL-11 render corollary).

**SRF-9 — Future scope stays visible and honest.** Replay, footprint/market delta, GEX overlay, characterization, and click-drag exploration appear as C5 entries: visible, marked in development, carrying doctrine text, never hidden, never faked with placeholder data. Removing a C5 entry requires a DL entry.

**SRF-10 — Sequential display is not sequential voting.** Rendering an expired contract's C1 primitive alongside a live one (member scrolls back through a revisited region) is display, not computation, and is permitted. No surface affordance implies cross-contract agreement for sequentially-revisiting contracts until VP-OVL-3's fence lifts by a v0.3 construction law.

---

## §4 What this surface does not do

- Compute events, agreement, or structure (Engine/Service work)
- Store, tag, or amend RAW or EVENT data (VPS/construction scope)
- Apply any price adjustment — splice, back-adjust, ratio, basis subtraction (VP-OVL-1)
- Decide Q1 or Q2
- Deliver notifications — badge/notify delivery mechanics are a later section of this spec or a delivery spec, written when C2 exists to deliver from

---

## §5 Open decisions

**D1 — Pane and scale layout for concurrent contracts** (Coach, at review). Options: (a) one pane, per-contract price scales, primitives visually overlaid but each on its own scale; (b) stacked panes, one per contract; (c) front-contract pane primary with back-contract toggle. Consequence: (a) is densest and closest to the trading read but must be visibly per-scale so it cannot be mistaken for a merged histogram; (b) is unambiguous but eats vertical space; (c) is simplest and matches the single-contract passthrough (VP-OVL-7). No default taken.

**D2 — Event marker visual grammar** (deferrable to build). Marker form, evidence-on-click behavior (VP-OVL-4 reversibility surfaced to the member or admin-only). Deferrable because SRF-3 fixes the data contract regardless.

**D3 — Which contracts render by default** (blocked). Downstream of Q1's participation set; inherits its fence. No default taken.

---

## §6 Intake path

Iterate as DRAFT beside the construction spec. When G-A through G-C are GO and Coach directs: Juliet intake per house process — series ID assignment, freeze, Phase-5 BUILD AUTHORITY, work packets drafted at that point against the then-current A23 as-built architecture docs (not against this file's assumptions about them).

---

Version: v0.1 (DRAFT) — header, filename, and this line must agree.
