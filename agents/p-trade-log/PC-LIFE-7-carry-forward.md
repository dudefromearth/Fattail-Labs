# Carry-forward from Position Control PC9b

**Revision:** 1  
**Date:** 2026-09-11  
**From:** `p-options-lab-position-control`

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-09-11 | First note. Four findings. Snapshot deferred. Mapper already landed. |  
**Coach:** do not bolt a JSON snapshot onto `member_trade_log_trades` — this program is the next refactor. PC-LIFE-7 snapshot is **deferred here**, not unfinished there.

Pointer: `agents/p-options-lab-position-control/DIVERGENCES.md` **D-PC-8**.

---

## What already landed (mapper only)

Analyzer promotion now:

- `order_type` from `lockSource` — `user_limit` / `tos_limit` → `LMT`; unlocked / `natural_mid` → `MKT`
- no fill from stored `entry_price` (`fill_price` is 0)
- actual `legs.quantity`, not leftover `contracts` × ratio
- `net_price` is the current package price at Log (same as the ToS script copy)
- Log gated `!tmActive && !rehearsal`; residual does not block

No schema change in that program.

---

## Four findings for the refactor

### 1. Two shared vocabularies with no shared definition

The Analyzer derives structure names from a **twelve-token classifier** on signed patterns in strike order (`web/lib/options-lab/structureClassifier.ts`). The Trade Log stores `strategy VARCHAR(64)` free text.

They agree today only because `FAMILY_TO_STRATEGY` in `web/lib/options-lab/analyzerToTradeLog.ts` maps by convention (Butterfly → `BUTTERFLY`, BWB → `BROKEN_WING_FLY`, …). Add a structure on either side and they diverge silently — a query returns the wrong trades and nothing errors.

**Fix:** one taxonomy, one definition. Cheap in a refactor. Do not grow a second map.

### 2. Residual-leg state at Log has no home

A residual contract (past its session, before midnight ET) is still a legal member and still promotes. That fact is **not stored** on the trade and is not recoverable afterward without historical chain data. It is the only genuinely new field in the PC-LIFE-7 snapshot payload. If the refactor wants it, give it a durable column (or per-leg flag) — do not bury it in notes.

### 3. Ratio and POS are derivable

PC2: POS = GCD of absolute `legs.quantity`; ratio is what remains. Confirm before relying on it:

| Legs (actual) | POS | Ratio | Name |
|---------------|-----|-------|------|
| 3 / 6 / 3 | 3 | 1-2-1 | Butterfly |
| 3 / 7 / 3 | 1 | 3-7-3 | CUSTOM |
| 1 / 2 / 1 unequal wings | 1 | 1-2-1 | BWB (wing distance, not ratio) |

BWB shares the butterfly signed pattern; wing equality is strike distance, not quantity. CUSTOM is anything that is not a catalogued signed pattern. Do not infer BWB from ratio alone.

### 4. The reverse link is the weak direction

`trade_id` written onto the Analyzer card works because the trade is durable (MySQL). A card id stored on a trade points into **browser-local** `ft_options_lab_analyzer_positions_v2`, which may be long gone.

If the refactor wants a hypothesis link, it needs something durable on **both** ends — not an Analyzer localStorage id.

---

## Snapshot field map (so you do not re-investigate)

| PC-LIFE-7 | Today |
|-----------|--------|
| Catalogue name | `trades.strategy` |
| Ratio | derivable from `legs.quantity` |
| POS | derivable GCD |
| `lockSource` | coarse `order_type` LMT / MKT |
| Basis at Log | `trades.net_price` |
| AnalyzerPosition id | reverse only (`tradeLogTradeId` on the card) |
| CHECK PRICE | not stored |
| Residual-leg | **no home** |
