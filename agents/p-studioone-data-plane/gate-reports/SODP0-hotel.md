# SODP0 — Hotel (trading-domain honesty)

**Date:** 2026-09-19  
**Agent:** Hotel  
**Machine:** StudioTwo, read-only. No `server/` `web/` product edits.  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-hotel.md`  
**Review object:** spec **§5** history provider + design **§1 / §4**  
**Parents read:** spec v0.1 full (laws SODP-5…9, as-built §3, hop §6, out-of-program §8, acceptance §9) · design 36 full · Arch 36 §§2, 5–6 · plan v1.0 Hotel seat · token `SODP0-W0` hard holds · DL-777 TS-1 record · SYM-9 / SYM-10 (chart-grade aggs vs model-grade prints; VPS Q1) · REQ-001 row (OPEN) · as-built `_aggs_price_fill` / `ohlc_for_source` (characterization only)

**Coach Content Law:** nothing of Coach’s or Juliet’s review-object text was removed or rewritten. Objections sit here, labeled Hotel’s. This file does **not** edit the spec, design, or Arch 36.

**Not touched:** LIM, QFRIC, XS, PPL, Help Watch, IKI, D6/D7/D8, MiniTwo, StudioOne install, history rewrite.

---

## Verdict

| Gate | Verdict |
|------|---------|
| **Trading honesty** (series = the contract they picked; empty Massive-then-prints is a false instrument; Massive-first + named failure; ES/MES **model** ACTIVE not granted) | **APPROVED** |
| **RETURNED / BLOCK** | **No.** |

The review object names the false instrument and forbids it. Chart-grade Massive per-contract aggs are not a grant of model-kind ACTIVE. REQ-001 / 002 / 003 stay **OPEN**. Hotel does not write “done.”

This is **not** BUILD AUTHORITY. SODP2 does not start on this file.

---

## Up front

Hotel gates **instrument identity** of the series the member pans — not hop auth, not launchd, not banner chrome (Echo/Tango), not CP-1 dress (Foxtrot).

The struck object is already cited (DL-777 · SODP-7): `_aggs_price_fill`. Two AP-1 strikes. Not repaired. Hotel does not reopen WHETHER to keep that fill.

---

## What was checked (evidence of review)

| Check | Against | Result |
|-------|---------|--------|
| Series = selected contract (Labs `bound_symbol`, e.g. ESZ2026) | spec §5.1–5.2 · SODP-5 · design §1 first bullet | **Holds.** Wire dialect `ESZ6` is server translation of **that** dated contract, not a second instrument and not member chrome. |
| Empty Massive → print-store mix is a false instrument | spec §3 proven defect · §5.6 · design §1 “not a silent mix of prints and a different vendor key” · design §4 MASSIVE EMPTY | **Named and forbidden.** |
| Massive-first + named failure | spec §5.3 BASE = native per-contract aggs · §5.6 empty = named failure, not silent print fallback · design §4 table | **Honest path.** |
| SHORT HISTORY ≠ quiet Sep-6 wall | SODP-6 · spec §5.5 payload flag · design §1 / §4 | **Holds** for the short-but-real case. Empty is a **different** named state (honor H-H4). |
| Prints are tail only, never BASE | SODP-5 · spec §5.4 · Arch 36 §4.1 | **Holds** on the success path. |
| Continuous / `1!` not laundered into the series | SYM-10 · spec SODP-5 per-contract · §8 D6 unanswered | **Holds.** Massive `ESZ6` here is the vendor ticker for ESZ2026, not a front-month stitch. |
| ES/MES **model** ACTIVE (VPS Q1) | spec §5 VPS Q1 sentence · spec §8 · Arch 36 §6 · token hold · SYM-10 | **Not granted.** Chart-grade aggs ≠ model-grade prints. Flipping capture to 90-day primary is a **new DL**. |
| MES vs ES substitution | spec §5 “ES, MES, later NQ…” keyed by `bound_symbol` · PP-1 MES equivalent · AP-1 both | **Intended independent.** Honor H-H2 — prices coincide; a mix is invisible. |
| Profit / lift / process-outcome claims | design §1/§4 · spec §5 | **None.** Tape-honesty only. |
| REQ-001/002/003 | SODP-9 · ledger | **OPEN.** Pan-to-June is Coach AP-1, not this seat. |
| As-built fill (read-only) | `server/sa_dev/service.py` `_aggs_price_fill` · `ohlc_for_source` | Confirms the lie: Labs identity `ESZ2026` → Massive empty → swallow → `vp_prints` from 2026-09-06, or root-default ticker `ESZ6`/`MESZ6` when `ticker` is omitted. Struck. |

Sources actually read (doctrine §11.3): spec v0.1 §§2–9; design 36 §§1–6; Arch 36 §§1–7; plan v1.0 seats + isolation FAIL; `SODP0-W0`; DL-777; SYM v0.2.1 SYM-9/SYM-10 and VPS Q1 fence; `ohlc_for_source` / `_aggs_price_fill` (lines 307–459); lead-contract OHLC note (print path, not this provider).

---

## The seed asks

### 1. Does the member pan the contract they picked?

**Yes, as written.** Input is Labs `bound_symbol` (ESZ2026). BASE is Massive native **per-contract** aggs after a server translation to the ticker Massive actually serves for **that** contract (example: ESZ6). Payload keeps `bound_symbol` and `vendor_ticker`. Design §1: the chart is price for the contract they picked, not a silent mix.

Vendor ticker in chrome is Echo’s lane (design §1 last sentence). Hotel only requires the **series** behind the pan to be that dated contract.

### 2. Is empty Massive-then-prints a false instrument?

**Yes — and the object forbids it.**

As-built (spec §3, confirmed in `ohlc_for_source`): picker binds ESZ2026; `/futures/v1/aggs/ESZ2026` empty; fill swallows; print store from 2026-09-06 is served as the 90-day chart. That is not Dec-2026 Massive history. It is a short local tape presented as the selected contract’s range. **False series. Severity high** (capital-adjacent judgment: VP cross-check against the wrong price window).

Replacement law: spec §5.6 empty Massive = **named failure**, not a silent print fallback. Design §4: MASSIVE EMPTY / UNAVAILABLE, calm, **not yesterday’s short prints**.

### 3. Is Massive-first + named failure the honest path?

**Yes.** BASE = Massive per-contract aggs for the full window, disk-cached on StudioOne. Local capture overlays **only** bars newer than the last Massive bar. SHORT HISTORY is a payload flag the surface must draw. Empty / unavailable is named. NO STORE is named and is not a BASE failure.

### 4. Does this grant ES/MES model ACTIVE (VPS Q1)?

**No.** Spec §8 lists it out of program. Spec §5: when per-contract prints reach 90-day local depth, flipping capture to primary is a **new DL**, not a silent revert. SYM-10: chart-grade (native per-contract aggs) and model-grade (prints) are distinct; model-grade stays gated on VPS Q1. A passing June pan on Massive aggs is **not** model ACTIVE and **not** REQ-001 closed.

---

## Honors (Hotel · SODP2 locks · not a RETURN)

Coach may discard shape. **Do not discard the false-series bar.** These are HOW locks for Alpha on SODP2, not a spec rewrite and not a WHETHER veto.

| # | Honor | Why |
|---|-------|-----|
| **H-H1** | Vendor translation is a function of **`bound_symbol`** (root + month + full year → the ticker Massive serves for **that** contract). Never a **root-default** `ESZ6` / `MESZ6`. Never “chop the year to one digit” without a dated, verified map (ESZ2036 must not become ESZ6). Unknown / empty translation = named failure, not the Dec-2026 ticker. Client still never hardcodes `FGHJKMNQUVXZ` (`web/lib/symbology`). | Struck fill: `ticker or ("ESZ6" if src == "ES" else "MESZ6")`. Spec says “never hardcode ESZ6 **in the client**”; the lie was on the **server**. Spec §5.1–5.2 already keys by `bound_symbol`; this honor stops a copy of the constant. |
| **H-H2** | **MES empty ≠ ES fill.** ES and MES print at the same index level; substituting ESZ6 aggs for MESZ2026 would look correct and be the wrong contract (multiplier, volume, identity). Each product Massive-first, independently. Same for later NQ. | AP-1 is ES **and** MES. A silent cross-fill would pass a glance pan. |
| **H-H3** | Print **tail** overlay is the **same `bound_symbol` only**. Mixed-root or other-contract prints (roll-week ESU6+ESZ6 in the ES store) on an ESZ2026 Massive BASE are a false **right edge**. Missing tail = design §4 NO STORE — not a BASE failure, not a print BASE. | Spec §5.4 “newer than the last Massive bar” does not restated the contract key. Roll-week bins still mix (VPS courier); that mix must not ride the chart tail. |
| **H-H4** | **Empty ≠ short.** MASSIVE EMPTY / UNAVAILABLE is not SHORT HISTORY. If Massive returns no bars, there is no “last Massive bar”; §5.4 must not vacuously serve the whole print store. Payload: empty bars + named empty/unavailable. Do not label print bars `price_source=massive_futures_aggs`. | Spec §5.5 “always” `price_source=massive_futures_aggs` plus §5.4 tail, ordered wrong, recreates the struck fill. §5.6 wins. |
| **H-H5** | Do **not** stamp as-built D6.5 `continuous.adjusted=true` / `method=back-adjust` on this per-contract series. Member picked a dated contract. Back-adjust on that pane would teach a continuous. **D6 stays open.** | `ohlc_for_source` still attaches `_continuous_block` today. SODP-5 replacement must not inherit it. |
| **H-H6** | Chart-grade Massive aggs do **not** grant **model-kind ACTIVE**. VPS Q1 (per-contract prints, native prices, timestamps and size) remains blocked. Do not treat a 90-day agg window as print-depth evidence. | Spec §5 / §8 already. Restated so SODP2 close-out cannot “flip ACTIVE” in a sidecar. |

---

## Design §1 adjacency (Hotel opinion · not a block)

“Volume profile on the same page is the same StudioOne home” is **topology** honesty (one data building). It is **not** “the histogram is the same contract series as the pan.” Source-space session bins still mix contracts in roll week (out of this program; D6 / VPS Q1). Do not teach the member that June on the ESZ2026 chart means the VP is that contract. Echo/Tango banner lane; Hotel flags the instrument reading only.

---

## Blocks (false instrument or reckless claim only)

**None** in spec §5 or design §1/§4 as written.

The as-built fill remains a false instrument **until SODP2 deletes it** (SODP-7 · TS-1). That is the program, not a defect of this draft.

---

## Coach content intact?

**Yes.** Clean-separation wording untouched. TS-1 both strikes cited, not repaired. SODP-5 Massive-first + prints-as-tail intact. Named SHORT HISTORY intact. VPS Q1 “new DL” intact. Model ACTIVE stays out of program. REQ-001/002/003 OPEN. AP-1 remains Coach’s pan to June on ES and MES.

---

## Open REQs (SODP-9)

REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN. Hotel does not close range, VP cross-check, or picker on this review.

---

## Bench delta

What SODP0-G / Coach stamp / SODP2 Alpha gain that this invocation did not have:

1. **Hotel honesty verdict on disk** — **APPROVED**. False series named; empty-then-prints forbidden; model ACTIVE not granted.  
2. **Six SODP2 honors (H-H1…H-H6)** — per-`bound_symbol` translation; no ES-for-MES; same-contract tail only; empty ≠ short; no D6.5 back-adjust stamp; no model ACTIVE sidecar.  
3. **Struck mechanism cited with code** — root-default ticker + empty-swallow in `_aggs_price_fill` / `ohlc_for_source`, so replacement cannot copy it.

---

## Build disposition

**APPROVED** for trading-domain honesty of spec §5 + design §1/§4.

Not BUILD. Not AP-1. Not a grant of ES/MES model ACTIVE. Feeds **SODP0-G**.
