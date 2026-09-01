# IKI Labs — GEX Toolset · Document Set README

**Date:** 2026-09-01 · **Status:** reference set, complete. **Nothing here is build authority until
Coach GO at GX0.**

Six GEX tools, built as subscribable components running in the **Runner** (formerly Options Lab
Heatmap), entering the Factory pipeline **immediately before staging**. The Factory pipeline itself
is out of scope for this project.

---

## Read in this order

| # | Document | What it is |
|---|---|---|
| 1 | **GEX Toolset Foundation Spec v0.1** | The shared law: what IKI Labs is, the component model, the formula freeze, shared inputs, hygiene, `GexPolicy`, session windows, the pipeline, plane assignment, the coverage contract, copy law, Analyzer handoff |
| 2 | **Foundation Spec v0.2** *(amendment)* | Scope boundary and the **twelve-row staging insertion contract**. Amends §0, §2, §18, §19 of v0.1 only |
| 3 | **Known Anomalies Register v0.1** | 24 declared anomalies across vendor, network, market-structure and assumption classes. **Normative** — the coverage contract is its L1 |
| 4–9 | **Six tool specs** — GEX Profile · GEX Surface · Pressure Field · Node Tape · Session GEX Path · Node Card | Per-tool contracts. Each references the Foundation and does not restate it |
| 10 | **Acceptance Suite v1.0** | Fixture inventory, gate map, cross-tool invariance set, law-coverage audit |
| 11 | **Execution Plan v1.0** | Phases GX-R → GX-S with exit criteria, probe schedule, misread gate, named risks |
| 12 | **Seed Book v1.0** | Thirteen cold-executable work packets plus the Oscar handoff |

**Background, not authority:** *GEX Tool Family Source Note* (Coach's framing, verbatim) ·
*GEX Toolset Spec Review v0.3* (review of Coach's product specification; G1–G16)

---

## The eight things that carry the most weight

1. **`gex_v1` is unchanged.** `Γ·OI·multiplier·S²·0.01` equals `Γ·OI·S²` — the ×100 and ×0.01
   cancel. Nothing recomputes. The units freeze (`gex_v2`) is owned by the Heatmap and **consumed**
   here, never redefined.
2. **Roll detection runs before the clamp.** The vendor's cumulative volume does not reset at the
   open; it carries yesterday's total until ~09:31 and rolls per contract over seconds. A naive
   `max(0, …)` reports that nothing traded through the open. **The one blocking defect.**
3. **The Flow lens is unsigned.** Volume has no side and no open/close flag, so `Γ·Δvolume·S²` is
   gamma-weighted flow, not exposure — which means no flip, no wall, no regime under that lens.
4. **Volume accounting bypasses quote hygiene.** A dropped quote is not an absence of trading. The
   error is a bounded time-shift, not a magnitude error, and it touches two of six tools.
5. **The window belongs to (instrument, expiring-or-not).** Expiring SPXW closes 16:00 (13:00 half
   days); the rest of the book runs to 16:15. That fifteen-minute divergence is a real state and
   gets rendered, not averaged.
6. **Absence is never zero.** Any gap, dropped row, null greek or out-of-band strike renders an
   invalid marker. The single most important rendering rule in the toolset.
7. **The banned step is mechanism → outcome**, not a word list. A tool may state what hedging
   *requires* under the stated convention; it may never claim what price *does* as a result.
8. **Declaration is layered, and the guide is the weakest layer.** Coverage in every payload,
   a persistent strip on every surface, and only then the guide. Deterministic facts stated
   permanently; stochastic anomalies counted per session.

---

## Open before GX0

| | |
|---|---|
| **OD tables** | Every row in the Foundation and six tool specs must be **disposed** — Accept or Override. None carried |
| **P-GX4** | Vendor reconcile widened to ≥5 contracts × ≥3 days. **If the sign inverts, GX0 does not close** |
| **OD-GXF1** | The Options Lab Heatmap → Runner rename, as its own decision-log entry, before seven documents are written against two names |
| **OD-GXF2** | Member-facing component names — Echo + Tango. The category's vocabulary carries the readings the specs remove |
| **SVP erratum** | `SV64` / `OD-SV35` are defective — the expiring window is 16:00, not 16:15, and post-close accrual is a revision, not trading. Needs a decision-log entry, not a quiet edit |

---

## Two gates that are not waivable

- **GX7** (Flow lens) waits on **P-GX2** — the day roll confirmed on a dated expiration, so the
  roll law rests on fact rather than inference.
- **GX8** (Node Card) waits on the **misread metric**: near-zero wall/magnet/pin misreads in
  support, Discord and journal for two weeks after the Profile ships. If members are reading the
  family wrongly, the component that most efficiently propagates a misread does not ship.