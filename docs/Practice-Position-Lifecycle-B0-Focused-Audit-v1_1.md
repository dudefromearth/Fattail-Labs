# Practice Position Lifecycle — Focused B0 Audit v1.1

**Status:** **AUDIT / NOTE** — analysis, not a Spec, not BUILD AUTHORITY, not a GO.
**Date:** 2026-09-14
**Filename:** `Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md`
**Supersedes:** `Practice-Position-Lifecycle-B0-Focused-Audit-v1_0.md` (2026-09-14). **v1.1 is law.**
v1.0 was written from the specs by inference; v1.1 reconciles it against source.
**Verified against:** `Practice-Position-Lifecycle-Source-Audit-2026-09-13.md` (Grok Build, StudioTwo,
HEAD `87ab8748`, read-only). Every finding below now carries a source verdict.
**Scope:** unchanged — the **B0 correctness layer**, two circumstances: **(1) closing and deleting**,
**(2) imported positions with no defined end state.**

### Changed from v1.0

| § | Change |
|---|---|
| §0.5 | **New.** Reconciliation scorecard against the source audit — six CONFIRMED, one PARTIAL, two "worse than claimed," four "better than claimed" |
| §1.3 | **C1-1 fix corrected.** The matcher is **already quantity-aware** — a rewrite is wrong and would break a passing test. The real fix is in the **read models**, which is cheaper and lower-risk |
| §1.1 | **C1-3 upgraded** — the partial-close case opens a delete-order hole (worse than claimed) |
| §2.1 | **C2-3 corrected.** "Eternal open + fake Complete" was **wrong**. A late close **orphans**, it does not mint a second Complete |
| §2.3 | Import table named correctly: **`member_trade_log_imports`** (not `*_import_batches`) |
| §3 | Shared-root fix reframed around the read-model change |
| §6 | Now records what source **confirmed**, not what was unverified |

---

## 0. The mechanism today — corrected against source

- **A position is derived.** `server/trade_log_domain/matching.py` (`match_open_close`) pairs fills by
  a structure key from `structure.py`: `{account_id}|{strategy}|{underlier}|{expiry}|{GCD legs}`,
  side and `pos_effect` ignored.
- **The matcher is quantity-aware FIFO** — confirmed at `matching.py:101–165`. One open is consumed
  by close slices (`closes[]`, `closed_units`, `slot_remaining`). **`m["close"]` stays `None` until
  the open is fully consumed.** This is better than v1.0 assumed.
- **Three terminal states, and only three:** `STATUS_OPEN` / `STATUS_COMPLETE` / `STATUS_ORPHAN`
  (`matching.py:183–185`); client adds `neutral` for a no-legs row (not a position state).
- **`MAX_STRUCTURE_HOLD_DAYS = 30`** (`matching.py:30`, mirrored `tradeLog.ts:430`). A close beyond
  the 30-day span from its open is **not paired → the close orphans**.
- **Close gates live only in `TradeSheet.save()`.** `POST` create is unguarded.
- **Delete is hard**, identity+id, legs CASCADE. Delete-order is `canDeleteTrade` (client) only.
- **Expire-worthless is synthetic**, `id = -open.id`, never persisted.

**The whole of B0's weakness restated with source in hand:** the matcher is right; **the read models
and the write endpoints are wrong.** Status, positions-qty, and the delete guard all read `m.close`
and ignore `closes[]` / `slot_remaining`; the gates that keep the book honest live in the browser.

---

## 0.5 Reconciliation with the source audit

| Finding | v1.0 claim | Source verdict | What moved |
|---|---|---|---|
| **C1-1** | Partial close → orphan + open at original size | **CONFIRMED (render)** | Matcher is fine; the **read models** misreport. Fix is cheaper than v1.0 said |
| **C1-2** | Close gates UI-only | **CONFIRMED** | — |
| **C1-3** | Delete-order UI-only | **CONFIRMED, worse** | On a **partial** close `m.close` is null, so the guard lets you delete the open while its partial close still exists |
| **C1-4** | Hard delete, `trash_reason` unused | **CONFIRMED** | Confirm is a bespoke in-drawer state, **not** `window.confirm` and **not** a kit dialog. `trash_reason` column exists, never written |
| **C2-1** | No coverage window; orphan indistinguishable | **CONFIRMED** | Table is **`member_trade_log_imports`**; no date-range columns |
| **C2-2** | Exactly Open / Complete / Orphan | **CONFIRMED** | — |
| **C2-3** | 30-day hold → eternal open + fake Complete | **PARTIAL — the "Complete" half is wrong** | A late close **orphans**; it does not mint a Complete. Options past expiry go synthetic-Complete at 0; day-book already drops the open at 30d |
| **C2-4** | Synthetic derived-only; imports emit expire as close fills; no IB | **CONFIRMED** | ToS `EXPIRED/ASSIGN/EXERCISE` → `TO_CLOSE`. **No IB adapter exists** |

**Better than v1.0 claimed** (record these so they are not re-litigated):
1. The **matcher is already quantity-aware** — Arch 15 §9's "multi-lot still future" is stale.
2. **No client/server matcher drift** on the pairing rules — my A2 worry is resolved; the shared
   `m.close`-only status grain is a *joint display bug*, not drift.
3. A close past 30 days **orphans**, it does not fabricate a second realized Complete.
4. ToS expiration is **not dropped** — it is a real close fill.

**Worse than v1.0 claimed:**
1. **C1-3 on partials** — the delete guard reads `m.close`, which is null mid-partial, so a 1-of-5
   open is deletable while its close row remains. A delete can orphan a real partial close.
2. **C1-1 positions book** — open qty stays 5 after a 1-of-5 close, so capital and marks **overstate
   the residual**. The lie is not only cosmetic; it feeds valuation.

---

## 1. Circumstance 1 — Closing and deleting

### 1.1 Findings (source-verified)

| ID | Weakness | Severity | Source |
|---|---|---|---|
| **C1-1** | Partial close: the **read models** report orphan-close + open-at-original-size, though the matcher tracks the remainder correctly. Positions reports qty 5 after a 1-of-5 close — **overstating residual capital** | **Critical** | `test_partial_close_leaves_remaining_units_open`; `capital_positions.py:153–159, 196–244`; `tradeLog.ts:760–805` |
| **C1-2** | `POST /trades` enforces **none** of the four close gates; they live only in `TradeSheet.save()` and are bypassable by a direct `TO_CLOSE` post or an import commit | **High** | `trades.py:374–559`; `TradeSheet.tsx:973–1015` |
| **C1-3** | Delete-order is client-only; **the API never returns 409**. On a partial close the client guard also fails (reads `m.close`, null mid-partial), so the open is deletable under an outstanding close | **High → elevated** | `tradeLog.ts:597–617`; `trades.py:775–797` |
| **C1-4** | Hard `DELETE` + CASCADE, behind a bespoke in-drawer confirm (not `window.confirm`, not a kit dialog). `trash_reason` column exists but no path writes it. Soft-trash exists **only** for import-batch delete, not blotter rows | **High** | `trades.py:775–797`; `common.py:273`; `081_*.sql:7`; `io.py:537–577` |

### 1.2 The correction that changes the plan

v1.0 proposed "make the matcher quantity-aware." **The matcher already is.** Rewriting it would break
`test_partial_close_leaves_remaining_units_open` (which asserts `close is None`, `open_units == 5`)
and reintroduce risk into the one component that is currently correct. That is the wrong move.

The defect is entirely downstream: **status, positions-qty, and the delete guard read `m.close` and
ignore `closes[]` / `slot_remaining`.** So the fix is a read-model change, not an engine change.

### 1.3 Fixes (corrected)

| Fix | What it changes | Cost / risk |
|---|---|---|
| **Derive status, open-qty, and the delete guard from `closes[]` / `slot_remaining`,** not from `m.close` alone. A partially-closed open renders as a **partial-residual** state at qty 4; positions report 4, not 5; `canDeleteTrade` / `findPairedClose` see the outstanding partial and block the delete | `blotter_status_by_id`, `positionBadge`, `capital_positions.open_qty_and_avg_cost`, `findPairedClose`, `canDeleteTrade` — **the matcher is untouched** | **Low.** No engine rewrite; the risky component stays frozen and green |
| **Move the four close gates to the API** (fail-loud 422, overrides in the payload) | `trades.py` create + domain validators; new tests | Medium |
| **Server-enforce delete-order (409)** — and, because the client guard is now `closes[]`-aware, the two agree | delete route; new test | Medium |
| **Split close from delete**, destructive act behind a kit `AlertDialog`; consider soft-trash for blotter rows (the `trash_reason` column and a recycle table already exist) | W3 design — **OD-19** | B1 |

**This is the single highest-value line in the reconciliation:** one read-model change closes **C1-1
render, the C1-1 positions overstatement, and the C1-3 partial-delete hole** at once, without touching
the matcher. Cheaper, safer, and higher-leverage than v1.0's framing.

**Acceptance:** a 1-of-5 close → status partial-residual, positions qty 4, no orphan badge, and the
open is **not** deletable while the partial close exists; a gate-violating close is refused by the API
without the override; deleting a paired open before its close returns 409.

---

## 2. Circumstance 2 — Imported positions with no defined end state

### 2.1 Findings (source-verified)

| ID | Weakness | Severity | Source |
|---|---|---|---|
| **C2-1** | An orphan close (unpaired `TO_CLOSE`) is indistinguishable from one whose open predates the imported file. The import table **`member_trade_log_imports`** has no from/to coverage columns | **Critical** (trust) | `119_*.sql:17–32`; `positionBadge` |
| **C2-2** | Terminal states are exactly Open / Complete / Orphan-close. No unfinished / incomplete / pending / dangling **position** state exists in domain or client | **High** | `matching.py:183–185`; `tradeLogAutofilter.ts:7–11` |
| **C2-3** | The 30-day hold refuses to pair a late close → it **orphans**. *(Corrected: it does not create an eternal-open-plus-Complete.)* Day-book drops the open from open-interest at 30d while the blotter can still say Open — a **surface disagreement** | **High** *(down from Critical on the corrected half)* | `matching.py` hold; `day_book.py:46–50`; `pnl.py:103–111` |
| **C2-4** | Synthetic expire is derived-only, never persisted. ToS `EXPIRED/ASSIGN/EXERCISE` import as `TO_CLOSE` fills — so an imported book can read **Complete even when the opening window was never imported** | **Medium** | `matching.py:75–98`; `trade_log_io.py:158–168`; no IB adapter |

### 2.2 The root is unchanged, and now sharper

C2-2 is still the root: three states cannot describe a legitimately-incomplete cycle. But source
sharpens *which* symptom matters. The 30-day "fake Complete" fear was wrong — the honest gaps are:

- **the truncated-import orphan** (C2-1) — the member's most common false defect; and
- **the day-book / blotter disagreement** at 30d (C2-3) — the open shows in one surface and not the
  other, which is its own small dishonesty.

### 2.3 Fixes (corrected)

| Fix | What it changes | Note |
|---|---|---|
| **Coverage window on `member_trade_log_imports`.** A new migration adds from/to. An orphan close whose open would fall before the window renders as *"opened before your imported history."* Highest-leverage C2 fix | new migration; derivation reads the window — **OD-9** | Table name corrected |
| **The fourth state — "unfinished cycle"** — a representable derived state absorbing the truncated-import orphan and the partial-residual. Fail-loud; resolvable by member declarations (new object, never a fill) | `matching.py` states + declarations store — **OD-21 / OD-22** | — |
| **Reconcile day-book with the blotter** at the 30-day boundary — one hold rule, one answer on every surface | `day_book.py:46–50` vs blotter status | New; surfaced by source |
| **Expiry/assignment already import as close fills** — so C2-4 needs *labelling*, not new plumbing: the imported real close should be distinguishable from a synthetic one, and from a genuine member close | import provenance on the fill | Narrower than v1.0 |

**Acceptance:** an import covering 60 days shows no broken book for a position opened on day −90; a
position at day 30 reads the same on the blotter and in the day-book; every genuinely-incomplete cycle
renders in one honest state; and an imported expiration is distinguishable from a synthetic one.

---

## 3. The shared root — one read-model change pays most of it

Source collapses the fix surface further than v1.0 did. The matcher is correct; the dishonesty is in
what reads it. So B0's spine is:

> **Teach the read models to consume `closes[]` / `slot_remaining` and a coverage window, add the
> fourth state, and move the integrity gates to the API. Do not touch the matcher.**

That single read-model change is the cheapest honest fix for the worst findings (C1-1 both halves,
C1-3 partials), and it is the correction Grok's own "Reading #1" points at. It clears Hotel's block
because it makes the partial-residual and the truncated-import orphan **representable and honest** —
which is exactly what the block demands.

Nothing here stores a position or a status (audit §14.1 intact); the coverage window and the
declarations store are member-supplied inputs to the derivation, not a second truth.

---

## 4. What B0 must deliver — the correctness contract (revised)

1. **Read models consume `closes[]` / `slot_remaining`:** partial-residual is a rendered state;
   positions report the remainder, not the original size; the delete guard sees outstanding partials.
   **Matcher unchanged.**
2. **Close gates enforced at the API** (fail-loud, overrides explicit).
3. **Delete-order enforced at the API (409);** client guard already agrees once (1) lands.
4. **Close and delete are distinct transitions;** destructive act behind a real dialog; soft-trash
   considered for blotter rows.
5. **Coverage window** on `member_trade_log_imports`; orphan-before-window renders as an explained
   boundary.
6. **Day-book and blotter agree** at the 30-day hold boundary.
7. **The fourth state — "unfinished cycle"** — derived, fail-loud, resolvable by declarations.
8. **Declarations store** as a new object; **imported expiry closes carry provenance** distinct from
   synthetic and from member closes.

**Test impact (from Grok's Part D):** a matcher rewrite would break
`test_partial_close_leaves_remaining_units_open` — the revised plan does **not** rewrite the matcher,
so that test stays green. New characterization needed for: orphan/partial badge, positions-qty on
partial, API close gates, API delete 409, coverage window, day-book/blotter agreement.

---

## 5. Open decisions (unchanged set, one narrowed)

| # | Question | Owner |
|---|---|---|
| **OD-19** | W3: close vs delete as one wizard with a hard fork, or two? Soft-trash or hard delete for blotter rows? | Hotel · Mike · Echo → Coach |
| **OD-21** | Does Hotel accept **"unfinished cycle"** as the fourth-state vocabulary? | Hotel |
| **OD-9** | Coverage window on `member_trade_log_imports` (name corrected) | India · Alpha → Coach |
| **OD-22** | Shape of the **declarations store** | India · Alpha |
| **OD-23** | Is `MAX_STRUCTURE_HOLD_DAYS = 30` curriculum-owned or a technical cap? Now doubly relevant given the day-book/blotter disagreement at that boundary | Hotel · Coach |
| **OD-24** | FIFO lot selection across multiple opens at one structure key — member-visible on partials? | Hotel · India |

---

## 6. Confirmed against source (v1.0's "not verified" section, closed)

- The matcher, structure key, hold window, three-state set, gate locations, delete path, synthetic
  expiry, and import adapters were all **read from source** at HEAD `87ab8748` (Grok, StudioTwo).
- **Matcher / client drift:** checked — **none** on the pairing rules. The shared `m.close`-only
  status grain is a joint display bug.
- **`fill_price: 0` promotion (Stamp S-3)** remains out of this note's scope — it corrupts PnL, not
  cycle state, and has its own verification.
- **Residual unknowns:** the `as_of` timezone edge and non-integer `unit_qty` (Grok A2, minor) are not
  B0-blocking but should be noted for the spec.

---

## Document control

| Ver | Date | Note |
|---|---|---|
| 1.0 | 2026-09-14 | First focused audit, inferred from specs. C1-1…4, C2-1…4; B0 contract; OD-23/24 |
| **1.1** | **2026-09-14** | Reconciled against Grok source audit (HEAD `87ab8748`). Matcher confirmed already quantity-aware → C1-1 fix moved to read models; C1-3 elevated (partial-delete hole); C2-3 "fake Complete" corrected to orphan; import table renamed `member_trade_log_imports`; day-book/blotter disagreement surfaced; B0 contract revised |
