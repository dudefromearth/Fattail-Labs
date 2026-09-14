# Practice position lifecycle — source-of-truth audit

**Date:** 2026-09-13  
**Machine:** StudioTwo (`StudioTwo.local`) — development working tree. Not DudeTwo. Not MiniTwo.  
**HEAD:** `87ab8748` (`docs(options-lab): XS4 live recapture, FI-050, XS0–XS5 gates PASS`, 2026-09-13 09:37 −0400)  
**GitHub `origin/main`:** same SHA (0 behind, 0 ahead after `git fetch --all` / `git pull origin main`)  
**Type:** Read-only source audit. Nothing was modified, fixed, or opened as a PR.  
**Standing freeze:** `web/components/options-lab/AnalyzerPositionsList.tsx` was not opened.

**Scope:** two circumstances of the Practice trade-log position lifecycle:

1. Closing and deleting positions.  
2. Imported positions with no defined end state.

**Eight claims** (C1-1 … C2-4) were confirmed, refuted, or corrected against code + tests.

**Working tree:** dirty, **outside** audit scope (`CLAUDE.md`, `web/next.config.ts`, session-volume-profile evidence, untracked LIM/agents files). Trade-log domain, routes, `web/lib/tradeLog.ts`, and `server/tests/test_trade_log*.py` matched HEAD.

**Dev stack after pull + migrate + restart (same session):** API `:4000` `{"status":"ok","env":"dev","git_sha":"87ab8748…"}`; Next `:3000` `/login` 200. No pending migrations.

---

## Pre-flight

```
git -C <repo> rev-parse --short HEAD          →  87ab8748
git -C <repo> status --porcelain | head       →  dirty (none under trade_log)
ls server/trade_log_domain/                   →  matching.py pnl.py structure.py day_book.py …
ls server/routes/trade_log/                   →  trades.py io.py accounts.py analytics.py commit.py common.py
rg -n "matchOpenClose|canDeleteTrade" web/lib/tradeLog.ts
  491:export function matchOpenClose(
  601:export function canDeleteTrade(
```

---

## Verdict table

| Finding | Severity (as claimed) | Verdict | One-line why | Test exists? |
|---------|----------------------|---------|--------------|--------------|
| **C1-1** 1-of-5 renders as Orphan close + Open at original size 5 | Critical | **CONFIRMED** | Matcher keeps remaining 4 but `m.close` stays `None`; badge/positions use original `unit_qty` | Y matcher / N render |
| **C1-2** API does not enforce the four close gates | High | **CONFIRMED** | Gates only in `TradeSheet.save`; POST insert is unguarded | N |
| **C1-3** Delete-order is client-only (no 409) | High | **CONFIRMED** | `DELETE` is identity+id. Client block misses partials | N |
| **C1-4** Hard delete; `trash_reason` unused | High | **CONFIRMED** | In-drawer confirm → hard `DELETE` + CASCADE. Column never written. Import-batch is a different soft path | N (row) / Y (import recycle) |
| **C2-1** Orphan close has no “open outside import window” flag; batch has no date range | Critical | **CONFIRMED** | Orphan = unpaired close; table is `member_trade_log_imports` (not `*_import_batches`); no from/to | N |
| **C2-2** Terminal states are exactly Open / Complete / Orphan-close | High | **CONFIRMED** | Plus client `neutral` for no-legs. No unfinished/incomplete/pending/dangling position state | Y |
| **C2-3** Held past `MAX_STRUCTURE_HOLD_DAYS` → eternal open + Complete on close | Critical | **PARTIAL** | Pairing refused → **Orphan**, not Complete. Options past expiry become synthetic Complete. Day-book drops OI at 30d | Y hold-refuse / N “Complete” myth |
| **C2-4** Synthetic expire is derived-only; imports emit expire as close fills | Medium | **CONFIRMED** | Never persisted. ToS `EXPIRED`/`ASSIGN`/`EXERCISE` → `TO_CLOSE` fills. No IB adapter | Y |

**Worse than the claims:** C1-3 on partials (client `canDeleteTrade` does not see `closes[]`, so a 1-of-5 open is deletable while the close row remains) and C1-1’s positions book (open qty stays 5, so capital/marks overstate the residual).

**Better than the claims:** the matcher itself is already quantity-aware (Arch 15 §9 “multi-lot still future” is stale), client/server pairing **rules** are aligned (Arch 15 drift-as-defect is not present as a rule split), and a close past 30 days does **not** mint a second Complete — it orphans. ToS expiration is not dropped; it is a real close fill.

---

## Part A — the matcher (grounds every finding)

### A1. `match_open_close`

The pairer is `server/trade_log_domain/matching.py`. The structure key is built in `structure.py`:

```70:101:server/trade_log_domain/structure.py
def structure_key(trade: dict[str, Any]) -> str:
    """Match open fills to close fills; sides/pos_effect ignored; qty/GCD normalized."""
    ...
    return f"{trade.get('account_id')}|{trade.get('strategy')}|{under}|{exp}|{struct}"
```

Leg token is `{qty/GCD}@{strike}{right}:{asset_class}`, then sorted.

**Key pairs on:** account · strategy · underlier · expiry · GCD-normalized legs.  
**Ignored:** side and `pos_effect` (so a reverse-leg close matches the open).

It is **quantity-aware FIFO**, not one-open-to-one-close:

```101:165:server/trade_log_domain/matching.py
        remaining_close = units
        ...
            take = min(leftover, remaining_close)
            open_slot["closed_units"] = int(open_slot["closed_units"]) + take
            remaining_close -= take
            open_slot["closes"].append({"close": t, "close_day": day, "units": take})
            if slot_remaining(open_slot) <= 0:
                open_slot["close"] = t
                open_slot["close_day"] = day
```

**Partial case (close unit qty < open):** one `closes[]` slice with `units = take`; `open_units` stays the original size; `closed_units` increases; **`m["close"]` stays `None` until remaining hits 0.** Close units that never find an open slot are not recorded as a match row — that close fill is simply unpaired.

`MAX_STRUCTURE_HOLD_DAYS = 30` at `matching.py:30`. Same name and value on the client (`web/lib/tradeLog.ts:430`).

Hold window: a close whose calendar span from the open exceeds 30 days is **not paired** (orphaned close; open stays unmatched unless it later synthetic-expires).

### A2. Client `matchOpenClose` vs server

```396:428:web/lib/tradeLog.ts
export function structureKey(trade: Trade): string {
  ...
  return `${trade.account_id}|${trade.strategy}|${under}|${exp}|${parts.join("|")}`;
}
```

```490:568:web/lib/tradeLog.ts
export function matchOpenClose(trades, asOf?): OpenCloseMatch[] {
  // same FIFO: remainingClose, take = min(leftover, remainingClose),
  // m.close set only when slotRemaining <= 0,
  // then synthetic expire-worthless for leftover with expiry <= asOf
}
```

**Diff (prose)**

| Rule | Server | Client | Drift? |
|------|--------|--------|--------|
| Key: `account\|strategy\|under\|exp\|GCD legs` | yes | yes | no |
| Side / `pos_effect` ignored | yes | yes | no |
| FIFO + partial consumption | yes | yes | no |
| `m.close` only when fully consumed | yes | yes | no (shared grain) |
| Hold window 30 calendar days | `date.fromisoformat` | `Date.parse` + round days | no material calendar drift |
| Synthetic expire-worthless | derived, `id = -open.id` | same | no |
| `as_of` default | `date.today()` | `todayYmdLocal()` | possible TZ edge |
| `unit_qty` | `int(quantity)` | `Number(quantity)` | possible non-integer qty |

Arch 15 (`Architecture/15-trade-log-manual-management.md:48–50`):

> Client match helpers exist for **interactive UX** … and must use the same structure-key / FIFO rules as `trade_log_domain`. Drift between them is a defect.

**That defect does not exist today for the pairing rules.** Two copies still exist; they currently implement the same key and FIFO. The shared `m.close`-only status grain is a **joint display bug**, not matcher drift.

---

## Part B — Circumstance 1: closing and deleting

### B1 / C1-1 — Partial close of a multi-lot structure (open 5, close 1)

**Critical. CONFIRMED for render.**

Matcher (`as_of` before expiry), locked by test:

```303:336:server/tests/test_trade_log_domain.py
def test_partial_close_leaves_remaining_units_open():
    """Close 1 unit of a 5-unit fly — open stays unmatched with 4 remaining."""
    ...
    assert matched[0]["close"] is None
    assert matched[0]["open_units"] == 5
    assert matched[0]["closed_units"] == 1
```

- Close of 1: one slice `{close: t, units: 1}` on the open slot; **`m.close is None`**.  
- Remaining 4: `open_units=5`, `closed_units=1`, `slot_remaining=4`. Not a split open, not an orphan open.

**What the member sees is not remaining 4.**

Status (`blotter_status_by_id` and client `positionBadge`) only treats a close as paired when `m.close is not None`. Slice IDs are walked only **inside** that branch (`matching.py:204–212`). The 1-lot `TO_CLOSE` is therefore **Orphan close**; the open is **Open**.

Positions qty ignores `slot_remaining`:

```196:244:server/capital_positions.py
    matched = match_open_close(trades)
    opens = [m for m in matched if m.get("close") is None]
    ...
        qty, avg_cost, cost_basis = open_qty_and_avg_cost(t)  # t = m["open"]
```

```153:159:server/capital_positions.py
    uq = float(unit_qty(trade))
    ...
        return uq, avg, basis   # original 5, not remaining 4
```

Client `positionBadge` / `tradeRowIssues` / `findPairedClose` all key off `m.close`, not `m.closes[]` (`web/lib/tradeLog.ts:760–805`).

Arch 15 §9 still lists “Partial close residual units in domain” as future work — **stale vs the matcher**, still true of status and the positions read model.

### B2 / C1-2 — Four close gates on POST create

**High. CONFIRMED.**

`create_trade` (`server/routes/trade_log/trades.py:374–559`) validates strategy, `asset_class`, `net_side`, account ownership, playbook/campaign. It does **not** call `match_open_close`, does not require a matched open, does not compare open vs close account, does not require unit-qty equal, does not check structure drift. Legs are inserted as sent.

The four gates live only in `TradeSheet.save()` and are all bypassable with local flags:

```973:1015:web/components/trade-log/TradeSheet.tsx
    if (mode === "close" && trade) {
      if (Number(account_id) !== trade.account_id && !allowAccountMismatch) { ... }
      const matched = findOpenForCloseDraft(...)
      if (!matched && !allowOrphanClose) { ... }
      if (closeUnits !== openUnits && !allowPartialUnits) { ... }
      if (drifts.length && !allowDrift) { ... }
    }
```

**Bypass:** `POST /api/me/trade-log/trades` (or `POST /api/me/trade-log`) with `legs[].pos_effect = "TO_CLOSE"`. Import commit is the same: no match gates.

### B3 / C1-3 — Delete a `TO_OPEN` that still has a paired `TO_CLOSE`

**High. CONFIRMED, and worse on partials.**

Client:

```597:617:web/lib/tradeLog.ts
export function canDeleteTrade(trade, all) {
  if (tradeIsCloseFill(trade)) return { ok: true };
  const close = findPairedClose(all, trade.id);
  if (close && !close.synthetic) {
    return { ok: false, reason: `Delete the TO CLOSE fill (#${close.id}) first. ...` };
  }
  return { ok: true };
}
```

`findPairedClose` reads `m.close` only. After a **partial** close, `m.close` is null → the client **allows deleting the `TO_OPEN` while the 1-lot `TO_CLOSE` still exists.**

API (`trades.py:775–797`):

```python
cur.execute("""DELETE FROM member_trade_log_trades
               WHERE id = %s AND identity_id = %s""", (trade_id, iid))
# 404 if missing; never 409
return {"ok": True, "id": trade_id}
```

No match check. Legs follow the trade via FK `ON DELETE CASCADE` (`migrations/040_trade_log_v11.sql:77–78`).

### B4 / C1-4 — Delete UI, hard vs soft, `trash_reason`

**High. CONFIRMED** for blotter-row delete.

| Question | Answer |
|----------|--------|
| Confirm UI | In-drawer `trashConfirm` state in `TradeSheet.tsx`. **Not** `window.confirm`, **not** kit `AlertDialog`, **not** `useConfirm`. |
| Hard or soft? | **Hard** `DELETE /api/me/trade-log/trades/{id}`. Legs CASCADE. |
| `trash_reason` | Column exists (`081_trade_log_entry_source.sql:7`). Read in `_trade_row` (`common.py:273`). UI chips set React state only; `trashOpen()` does not send it. **No writer** in `*.py` / `*.ts` / `*.tsx`. |

Separate path: **import-batch** delete is soft (`member_trade_log_trades_trash`, 30-day restore, `server/routes/trade_log/io.py:537–577`, migration `121_trade_log_import_recycle.sql`). That is not the blotter-row delete.

---

## Part C — Circumstance 2: imported positions with no defined end state

### C1 / C2-1 — Orphan close vs import coverage window

**Critical. CONFIRMED.**

An orphan close is a `TO_CLOSE` fill with no paired open (`positionBadge` / `blotter_status_by_id`). There is **no field** distinguishing “open is outside the imported window” from “open never existed.”

The 119 table is **`member_trade_log_imports`**, not `member_trade_log_import_batches`. Schema (`119_trade_log_import_batches.sql:17–32` + `121` `deleted_at`):

`id, identity_id, account_id, adapter, source_filename, practice_campaign_id, trade_count, skipped_count, label, created_at, deleted_at`

**No coverage-window / from-date / to-date columns.**

### C2 / C2-2 and C2-3 — Terminal states and the 30-day hold

**C2-2 CONFIRMED. C2-3 PARTIAL.**

Named derivation states are exactly three:

```183:185:server/trade_log_domain/matching.py
STATUS_OPEN = "Open"
STATUS_COMPLETE = "Complete"
STATUS_ORPHAN = "Orphan close"
```

Client badges: `open | complete | orphan_close | neutral` (`neutral` = no legs, not a position state). Autofilter tokens: Open / Complete / Orphan close (`web/lib/tradeLogAutofilter.ts:7–11`).

Grep of `trade_log_domain` + `web/lib/tradeLog.ts`: no unfinished / incomplete / pending / dangling **position** state.

Past `MAX_STRUCTURE_HOLD_DAYS` (30):

- A close after day 30 is **not paired** (`hold_within_limit` false) → **Orphan close**. The open stays unmatched unless expiry ≤ `as_of` triggers synthetic expire → **Complete** at 0.  
- `opens_on_day` **drops** the open from journal open interest after 30 days (`day_book.py:46–50`) even while the blotter can still say Open.  
- A late real close is **not** “a separate realized Complete.” It is Orphan. PnL on that close can still synthesize from cash points (`pnl.py:103–111` unmatched-close fallback).

So: not an eternal open plus Complete. Options past expiry become synthetic Complete; a close past 30 days is Orphan; day-book already hid the open.

### C3 / C2-4 — `SYNTHETIC_EXPIRED_WORTHLESS` and import adapters

**Medium. CONFIRMED.**

```75:98:server/trade_log_domain/matching.py
def _synthetic_expire_close(...):
    """Virtual TO_CLOSE at 0 on the expiry date (not persisted)."""
    ...
    "synthetic": SYNTHETIC_EXPIRED_WORTHLESS,
```

`enrich_trades_with_synthetic_pnl` appends those rows in memory (`pnl.py:40–42`, `81–87`). Never `INSERT`ed.

Import adapters, all in **`server/trade_log_io.py`** (`parse()` at 945–956):

| Adapter | Exists? | Expire / assign / exercise |
|---------|---------|----------------------------|
| `thinkorswim` | yes | **Emitted as `TO_CLOSE` fills** (`EXPIRED` / `EXERCISE` / `ASSIGNMENT` / `REMOVAL` → `pos_effect=TO_CLOSE`, fill 0) |
| `csv_generic` | yes | Generic CSV; no special expire grammar |
| `native` | yes | Canonical JSON |
| `tradier` | yes | CSV / OCC |
| `tradestation` | yes | CSV |
| Interactive Brokers | **no adapter** | — |

ToS path is fills, not a separate activity ledger, and not dropped:

```158:168:server/trade_log_io.py
_EXPIRE_POS_EFFECTS = frozenset({
    "EXPIRED", "EXPIRE", "EXPIRED_WORTHLESS",
    "EXERCISE", "EXERCISED", "ASSIGNMENT", "ASSIGNED", "REMOVAL",
})
```

Locked by `test_parse_tos_expired_pos_effect_is_to_close`. That is why an imported book can look Complete even when the opening window was never imported: the broker’s expire row **is** a close fill.

---

## Part D — Kilo hole map (what a B0 change would break or must add)

Files matching `server/tests/test_trade_log*.py`:

| File | What it covers |
|------|----------------|
| `test_trade_log.py` | CRUD, accounts, autofilter, campaign stamp |
| `test_trade_log_domain.py` | Matcher, blotter status, partial, hold window, synthetic expire |
| `test_trade_log_import.py` | ToS parse, expire→`TO_CLOSE`, import batches, delete-all |
| `test_trade_log_broker_formats.py` | ToS / Tradier / TradeStation roundtrip |
| `test_trade_log_analytics.py` | Reports / day-book API |

| Finding | Characterization already locking the behavior? |
|---------|-----------------------------------------------|
| C1-1 partial → orphan + size 5 | **Y** for matcher remaining (`test_partial_close_leaves_remaining_units_open`). **N** for orphan badge / positions qty 5 |
| C1-2 API has no close gates | **N** |
| C1-3 API delete never 409 | **N** (no delete-order test; `test_delete_all_*` only) |
| C1-4 hard delete; `trash_reason` unwritten | **N** for `trash_reason`; import recycle is separately tested |
| C2-1 no import coverage window | **N** (batch list/delete exists; no window columns to test) |
| C2-2 only Open / Complete / Orphan | **Y** `test_blotter_status_open_complete_orphan` |
| C2-3 30-day hold | **Y** `test_match_refuses_year_long_hold` (refuses pair; day-book empty). **N** for “late close becomes Complete” (it does not) |
| C2-4 synthetic never persisted; ToS expire→close fill | **Y** `test_expired_worthless_closes_unmatched_open` + `test_parse_tos_expired_pos_effect_is_to_close` |

A B0 that taught the matcher to split lots would **break** `test_partial_close_leaves_remaining_units_open` (`close is None`, `open_units == 5`). A B0 that only fixed badge/positions to use `closes[]` / `slot_remaining` would need **new** tests; the existing blotter-status test uses a fully unmatched orphan, not a partial.

---

## Reading for a later B0 (not work in this audit)

These are observations, not a plan and not a GO.

1. **Status and positions still treat a lot as atomic** even though the matcher already consumes by unit. The cheapest honest fix is to derive badge + open qty from `closes[]` / `slot_remaining`, not to re-split fills in MySQL.  
2. **Close gates and delete-order are UX only.** Any B0 that cares about book integrity has to sit on `POST` / `DELETE`, or the sheet check is theater.  
3. **Imported orphans cannot be labeled “open was before the file.”** The batch row has no coverage window; synthetic expire is a derived Complete, not a persisted end.  
4. **Arch 15 §9 is stale** on “partial close residual units in domain” — the engine has them; the read models do not.

---

## Document history

| Date | Note |
|------|------|
| 2026-09-13 | First filing. StudioTwo. HEAD `87ab8748`. Read-only. |
