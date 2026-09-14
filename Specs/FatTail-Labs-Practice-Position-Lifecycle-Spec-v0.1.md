# FatTail Labs — Practice Position Lifecycle Spec v0.1.1

**Status:** **BUILD AUTHORITY** (v0.1.1) — Coach stamped `PPL0-W0` **2026-09-14** (**DL-702**). India Phase 2 **APPROVED** on return. Echo Phase 3 **APPROVED** on return. Tango Phase 3 **APPROVED**. Hotel Phase 4 **APPROVED**. Plan **v1.1**. Product code still waits on **PPL0-G** then PPL1 characterization before PPL2. No MiniTwo.
**Date:** 2026-09-14 (audit-law date). StudioTwo drafting session 2026-09-13.
**Filename:** `FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` (content **v0.1.1**)
**Type:** Product + domain spec — Practice trade-log **position lifecycle correctness** (close / delete / import end-state).
**Law-ID prefix:** **PPL-1…**
**Route:** `/app/trade-log` (blotter, sheet, Positions) · Accounts & Capital / Positions valuation consume the same open book.
**Family:** B (member-private) · **Entitlement:** Observer trial / Navigator Practice gate (DL-193) — unchanged.

**This document is BUILD AUTHORITY for the PPL program** after Coach Phase 5 / `PPL0-W0`. Juliet does **not** answer remaining OPEN ODs (OD-9, OD-22, FI-PPL-1). Packets that depend on those cannot start.

---

### Juliet drafting notes (Coach Content Law · doctrine §11)

Stated **up front**, not only in §14.

1. **Nothing of Coach / Claude’s B0 v1.1 contract was dropped.** Findings C1-1…4 and C2-1…4, the corrected C1-1 fix (read models, not matcher), the C1-3 partial-delete elevation, the C2-3 “fake Complete” correction, the reconciliation scorecard, the better/worse-than-v1.0 lists, the shared-root spine, the §4 correctness contract, the Kilo hole map, residual unknowns (`as_of` TZ, non-integer `unit_qty`), and Stamp S-3 out-of-scope all remain.
2. **Organization, not de-scope.** B0 is an audit. This file is a Spec. Section numbers follow the Phase 1 template Coach named; B0 prose is transcribed into those sections rather than pasted as a second audit. Every B0 requirement has a home.
3. **Fourth-state vocabulary — both Coach phrases kept; neither collapsed; no third English word invented as law.** B0 §2.3 calls the fourth state **“unfinished cycle”** and says it absorbs the truncated-import orphan **and** the partial-residual. Coach Phase 0 says the audit uses **both** **“partial-residual” (C1)** and **“unfinished cycle” (C2)**, and **OD-21 is Hotel’s vocabulary**. This Spec keeps **both phrases**, specs the *need* and the *derivation*, and locks the **member-facing token only as OD-21 OPEN**. The B0 “absorbing” sentence is transcribed in **§4.4** and again in **§6.2**. Juliet does not pick one word.
4. **ODs.** Coach **2026-09-14** (`PPL0-W0`): OD-21 / 23 / 24 / 25 / 19 take silent defaults (two words; 30 stays; FIFO oldest-first no picker; import not 422 on orphan; permanent + kit dialog). **OD-9, OD-22, FI-PPL-1 remain OPEN** — PPL4 cannot start. Packets that depend on an OPEN OD cannot start.
5. **Not invented as law (sketches / opinions labeled):** SQL types for the coverage-window columns; declarations-store schema; API JSON keys for close-gate overrides (as-built UI flag names are cited as source, not locked); a `close_kind` column; which way day-book and blotter move in order to agree. PATCH and import-commit are **enumerated** in the §5.2 / §7.1 write-path table as gated **or** excepted-pending-OD (India B1); application of gates to import commit is **OD-25**, not Juliet law.
6. **Parent files are named for amendment, not edited.** This Spec is the only file written in this pass.
7. **Tempted to drop — and did not:** collapsing “partial-residual” into “unfinished cycle”; treating matcher quantity-awareness as still-future (it is not); restoring v1.0’s “eternal open + fake Complete”; inventing an IB adapter; rewriting `match_open_close`; deciding soft-trash (OD-19); deciding coverage-window shape (OD-9).

**Juliet Phase 2 return (India B1–B3 only — not a rewrite):** write-path table + **OD-25**; Privacy Spec §2.1 DS-4 named later amend for declarations; §5.1 exhaustive PPL-2 consumers + qty SoR = match slot. FI-PPL-1 and FI-PPL-2 added to §11. Hold-boundary **direction** not picked. Hotel vocabulary not invented.

**Juliet Phase 3/4 return (Echo B1–B2 + Hotel OD recs — not a rewrite, not OD disposal):** PPL-5 confirm surfaces enumerated — TradeSheet in-drawer `trashConfirm` **and** blotter bulk `window.confirm` on `web/app/app/trade-log/page.tsx`; kit `AlertDialog` / `useConfirm` for **both**; do not port unused `trash_reason` chips; do not restyle Import Manager. §8 named-state chrome grammar (existing Status badge only; **partial-residual** is not Orphan amber; coverage sentence is a calm named state). Autofilter **English** waits on OD-21; W1 may use a machine key; no new Autofilter token as law. Hotel OD-21 / OD-23 / OD-24 sit beside those ODs as **labeled Hotel opinion**; Coach Phase 5 disposes. Both Coach phrases kept. **OD-19 not answered.** Tango opinions not promoted to law (B0 coverage sentence already Coach; Echo B2 + Tango lock it as calm copy).

---

**Parents (normative; this Spec amends them in a later versioned pass — see §0.3):**

| Spec / doc | Role |
|------------|------|
| [`FatTail-Labs-Trade-Log-Spec-v1.1.md`](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Fills, legs, accounts, adapters, API, **§16 manual management** (gates, delete order, partial close). Especially **§4 domain, §8 adapters, §9 API, §16**. |
| [`Architecture/15-trade-log-manual-management.md`](../Architecture/15-trade-log-manual-management.md) | As-built manual-management design. **§9 “Partial close residual units in domain” is STALE** (this Spec). |
| [`FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0.md`](./FatTail-Labs-Trade-Log-Import-Batches-Spec-v1.0.md) | File may say **v1.1 as-built**. Table is **`member_trade_log_imports`**. Coverage window columns are this Spec (OD-9). |
| [`FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md`](./FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md) | Open book qty / valuation. **Open qty = remaining units** (this Spec). |
| [`FatTail-Labs-Human-Interface-Spec-v1.0.md`](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Kit **`AlertDialog` / `useConfirm`**. No ad-hoc chrome. Destructive pattern §6.3. |
| [`FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | **Cite as analogy** for honest named states (Law B). **Do not import OPF** into Practice. No OPF store, no Analyzer cards, no OPF named-state catalog on the blotter. |
| [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) | Family B. **§2.1 DS-4** named later amend when OD-22 lands (declarations). See §0.3. |

**Siblings / consumers (read-only to this program):** Journal and Reports consume `trade_log_domain` (Trade Log §10, Arch 15). They must see the same derived remainder and the same hold-boundary answer once read models change. This Spec does not restyle those apps.

**Source of truth for the analysis (v1.1 is law for the analysis; this Spec is DRAFT until Coach Phase 5):**

| Artifact | Path | Role |
|----------|------|------|
| **B0 focused audit v1.1** | [`docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md`](../docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md) | **Product intent.** Nothing of Coach/Claude’s in that file may be removed. Objections sit beside text, labeled Juliet. |
| **Source audit** | [`docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md`](../docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md) | Read-only facts. HEAD **`87ab8748`**, StudioTwo. Not DudeTwo. Not MiniTwo. |

**v1.0 of the B0 audit is superseded** as analysis. Do not re-litigate claims v1.1 already corrected against source.

---

## 0. Agent bench + isolation

### 0.1 Agent bench (this program)

This Spec, when Coach stamps BUILD AUTHORITY, is implemented **only** through the FatTail Labs Agent Bench ([`agents/README.md`](../agents/README.md), doctrine in [`agents/bench/`](../agents/bench/)). **This draft does not create a board, seeds, or GO token.**

| Role | Callsign | Duty on Practice Position Lifecycle |
|------|----------|-------------------------------------|
| Final authority | **Coach** | Phase 0 intent, Phase 5 stamp, OD disposal, ship/no-ship |
| Orchestration | **Juliet** | This draft (Phase 1). Execution plan / seeds **only after** Phase 5. Does not code packets. Does not answer ODs. |
| Spec / architecture | **India** | Phase 2: domain model, coverage-window shape (OD-9), declarations shape (OD-22), parent-amend honesty, product boundary, Family B |
| Backend | **Alpha** | After GO: API gates, 409, read models, migrations (sketched here, not applied), `capital_positions` qty |
| Frontend | **Charlie** | After GO: blotter / sheet / badges / Autofilter **machine keys** (English waits on OD-21) / kit confirm on **TradeSheet and** `web/app/app/trade-log/page.tsx` bulk trash |
| Design | **Echo** | Phase 3 **RETURNED** (B1–B2 landed): HIG `AlertDialog` / `useConfirm` on **both** delete surfaces; named-state chrome grammar §8.6 |
| Member psychology | **Tango** | Phase 3 **APPROVED**. Process-first copy; no profit theater; capacity over dependency. Opinions labeled in Tango’s review — not spec law unless already Coach/B0. Coverage sentence APPROVED as calm copy. |
| Curriculum / trading honesty | **Hotel** | Phase 4 **APPROVED**. **OD-21 / OD-23 / OD-24 recommendations** transcribed in §12 — **not disposed**. No false book. |
| Security / privacy | **Mike** | Phase 4 as applicable: Family B isolation on new writes (declarations, coverage window); delete/409; OD-19 soft-trash if Coach adopts |
| Tests | **Kilo** | Characterization from source-audit Part D; matcher test stays green; new tests for read models, gates, 409, window, day-book/blotter |
| Gates | **Delta** | Phase-end evidence after GO. Isolation FAIL if frozen trees appear in the diff. |
| Memory | **Lima** | Decision log + Spec status flip **after** Coach Phase 5. Parent amends in the same body of work as implementation, never “later”. |

**Hierarchy on this project:** Coach → Juliet (plan, after stamp) → India / Echo+Tango / Hotel+Mike → specialists. Coordination through Coach or Juliet. Direct agent-to-agent scope expansion is prohibited.

### 0.2 Program isolation (DL-539 · doctrine §15) — **invariant PPL-11**

This program is a **third tree** next to the currently active engineering programs. It does **not** ride those programs. It does **not** “need” them.

**Do not touch:**

| Frozen / other program | Why |
|------------------------|-----|
| Options Lab Heatmap **LIM** | Active program. Not this tree. |
| Quant Lab fill-friction **QFRIC** | Active program. Not this tree. |
| Options Lab **XSP/SPY scale (XS)** | Active program. Not this tree. |
| `web/components/options-lab/AnalyzerPositionsList.tsx` | **Standing freeze.** Do not open. |
| Market Bus, OPF store/builder, Template Runner, IKI | Existing work. Not this tree. |
| Production **MiniTwo** / staging **DudeTwo** | Not this tree. StudioTwo development only if/when a GO names it. |

**In-scope trees (when stamped — listed now so India can review the seam, not so anyone edits them in this Phase 1):**

- `server/trade_log_domain/`
- `server/routes/trade_log/`
- `server/capital_positions.py`
- `web/lib/tradeLog.ts`
- `web/components/trade-log/*`
- `web/lib/tradeLogAutofilter.ts`
- `web/app/app/trade-log/page.tsx` — **bulk-confirm consumer only** (replace `window.confirm` for bulk unmatched-open delete). Do **not** restyle the rest of the page. Do **not** restyle Import Manager.
- Related tests `server/tests/test_trade_log*.py` + `test_capital_positions.py`
- Migrations (sketched in §7, **not applied** in this draft)
- Parent Spec / Arch amends named in §0.3 (versioned later, same body of work as implementation)

**Matcher freeze (PPL-1, also isolation):** do **not** rewrite `match_open_close` FIFO / quantity consumption. See §3 and §5.

If existing work *feels* necessary, raise it to Coach **three times** and obtain **three successive OKs** on a GO token **before** the first edit. One OK is not three. A break resets the count. Juliet will not seed frozen paths.

### 0.3 Parent amendments this Spec will require (named, not silently edited)

When Coach stamps BUILD AUTHORITY, Lima/India version the parents. **This draft does not edit those files.**

| Parent | What is stale or incomplete | What this Spec requires |
|--------|-----------------------------|-------------------------|
| Trade Log v1.1 **§16.5** | Gates are “**Before `POST` close fill**” and live in `TradeSheet.save()` | The four close gates become **API-enforced** (fail-loud **422**; explicit overrides in the payload). UI checkboxes remain member chrome; they are not the SoR. |
| Trade Log v1.1 **§16.6** | “**Domain FIFO still pairs one open to one close** by structure key (GCD-normalized).” | **STALE vs source.** Matcher is already quantity-aware FIFO (`closes[]`, `closed_units`, `slot_remaining`; `m.close` only when fully consumed). This Spec **corrects** that sentence. Full-structure close remains the **UI default**; partial units remain override-gated. |
| Trade Log v1.1 **§8** | Already says quantity-aware partials (close 1 of 5 leaves 4 open). | Keep. Harmonize §16.6 with §8 — do not re-introduce one-open-to-one-close as domain law. |
| Trade Log v1.1 **§4.6** | Lists table `member_trade_log_import_batches`. | Source table is **`member_trade_log_imports`** (Import Batches Spec + migration `119`). Honesty amend when that parent is versioned. |
| Trade Log v1.1 **§5 Status column** | Badges **Open · Complete · Orphan close** only. | Grows with the derived state set in §4.4. Member-facing fourth token is **OD-21**. C1 render uses **partial-residual** until Hotel disposes OD-21. |
| Arch 15 **§9** | “**Partial close residual units in domain**” listed as future work (“match engine multi-lot”). | **STALE.** Engine already has residual units. Read models do not. Evolution row becomes “read models consume `closes[]` / `slot_remaining`” (this Spec). |
| Arch 15 **§4.3 / §8** | Close pairing gates described as **UI**; delete is `DELETE /trades/{id}`. | Gates + delete-order move to the API (this Spec §5). |
| Positions View v0.2 **§5.1** | Qty · Avg cost · Cost basis = “fills over **remaining open qty**”. | **Law here:** remaining units = `slot_remaining` (e.g. 4 after a 1-of-5 close), not original `unit_qty`. As-built `open_qty_and_avg_cost` / `positions_valuation` currently overstate. |
| Import Batches Spec | No from/to coverage columns on `member_trade_log_imports`. | Additive coverage window (this Spec §6 / §7). **OD-9** owns shape. Recycle-bin path (§6a of that Spec) is **not** blotter-row delete and is not redesigned here. |
| Member Data Privacy Spec v0.1 **§2.1 DS-4** | Named-consumers table does not list a declarations artifact | **Named later amend when OD-22 is disposed:** add the declarations object as a Family B named consumer (table row + retention / export / admin). DS-4: new Family B artifacts **must** be added to that table before production write. **Do not design the declarations table in this Spec.** Coverage-window columns on existing `member_trade_log_imports` are additive on an already-listed Family B table and do **not** themselves trigger DS-4. |

### 0.4 Invariants for all future seeds (preview — not a plan)

1. Touch **only** files listed in the active seed (change control).  
2. Evidence over assertion.  
3. **PPL-1:** matcher FIFO / quantity consumption frozen. `test_partial_close_leaves_remaining_units_open` stays green (`close is None`, `open_units == 5` at the matcher grain).  
4. Family B: never leak cross-identity.  
5. No stored position row and no stored status column (**PPL-12**). Coverage window and declarations are **member-supplied inputs to derivation**, not a second truth.  
6. Isolation **PPL-11**.  
7. Packets that **depend on an OPEN OD cannot start** until Coach disposes that OD. **OD-25:** W2 import-commit gate packets cannot start until disposed.

---

## 1. Intent / problem (two circumstances)

The Trade Log already **stores fills**, not positions. A position is **derived** by `match_open_close`. That is correct and stays.

What is not correct: **the read models and the write endpoints** that sit on that matcher. Status, open-qty, and the delete guard all read `m.close` and ignore `closes[]` / `slot_remaining`. The gates that keep the book honest live in the browser. An imported book has no coverage window, so a truncated-history orphan looks like a broken book.

**B0’s weakness restated with source in hand (v1.1 §0, transcribed):** the matcher is right; **the read models and the write endpoints are wrong.**

Two circumstances, unchanged from Coach Phase 0 / B0:

### Circumstance 1 — Closing and deleting

A member who **partially closes** (close 1 of a 5-unit structure) is shown an **Orphan close** plus an **Open at original size 5**. Positions and capital **overstate residual**. The open is **deletable** while that partial close still exists. Close gates and delete-order are UX theater: `POST /trades` and `DELETE /trades/{id}` do not enforce them.

### Circumstance 2 — Imported positions with no defined end state

An orphan close whose open **predates the imported file** is indistinguishable from a close that never had an open. Terminal states are exactly Open / Complete / Orphan-close. Day-book and blotter **disagree** at `MAX_STRUCTURE_HOLD_DAYS` (30). Imported expiry/assignment/exercise already arrive as `TO_CLOSE` fills; synthetic expire-worthless is derived-only. The member cannot tell those apart.

**Spine (B0 §3, transcribed — this is the program):**

> **Teach the read models to consume `closes[]` / `slot_remaining` and a coverage window, add the fourth state, and move the integrity gates to the API. Do not touch the matcher.**

**Highest-value line (B0 §1.3, transcribed):** one read-model change closes **C1-1 render, the C1-1 positions overstatement, and the C1-3 partial-delete hole** at once, without touching the matcher. Cheaper, safer, and higher-leverage than v1.0’s “make the matcher quantity-aware” framing (which would have been wrong).

Nothing here stores a position or a status (audit §14.1 intact / **PPL-12**).

---

## 2. Non-goals

This Spec does **not**:

- Rewrite `match_open_close` / `matchOpenClose` FIFO or quantity consumption (**PARKED** — rejected by source).  
- Add an Interactive Brokers adapter (**DEFERRED** — does not exist; Trade Log §8 already says ibkr is later).  
- Promote `fill_price: 0` Stamp **S-3** (**DEFERRED** — corrupts PnL, not cycle state; own verification).  
- Import OPF, Options Lab Analyzer, Market Bus, Template Runner, or IKI into Practice.  
- Soft-trash blotter rows as law (**OD-19 OPEN** — considered, not decided).  
- Decide Hotel’s member-facing fourth-state word (**OD-21 OPEN**).  
- Decide coverage-window column shape (**OD-9 OPEN**).  
- Shape the declarations store beyond “new object, never a fake fill” (**OD-22 OPEN**).  
- Change `MAX_STRUCTURE_HOLD_DAYS` ownership or value (**OD-23 OPEN**). Agreement at the **current** 30-day boundary is in-scope; who owns the number is not decided here.  
- Make FIFO lot selection across multiple opens member-visible (**OD-24 OPEN**).  
- Live broker sync, cross-account netting, profit-ranked queues, or a stored position table.  
- Merge Trade Log + Journal (Trade Log v1.1 non-goal).  
- Touch MiniTwo / DudeTwo, LIM, QFRIC, XS, or `AnalyzerPositionsList.tsx`.  
- Grant BUILD AUTHORITY, write seeds, or open a PR.

---

## 3. As-built mechanism (source-verified)

Verified against [`docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md`](../docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md), HEAD **`87ab8748`**, StudioTwo, read-only. Working tree was dirty **outside** trade-log domain. Standing freeze `AnalyzerPositionsList.tsx` was not opened.

### 3.1 Position is derived

`server/trade_log_domain/matching.py` (`match_open_close`) pairs fills by a structure key from `structure.py`:

```
{account_id}|{strategy}|{underlier}|{expiry}|{GCD legs}
```

**Side and `pos_effect` ignored** so reverse-leg closes match. Client mirror: `web/lib/tradeLog.ts` `structureKey` / `matchOpenClose`.

Arch 15: client match helpers exist for interactive UX and must use the same structure-key / FIFO rules. **Pairing-rule drift does not exist today.** Two copies still exist; they implement the same key and FIFO. The shared `m.close`-only **status grain** is a **joint display bug**, not matcher drift. Do not re-litigate A2 as a rule split.

Residual unknowns (B0 §6, not B0-blocking): `as_of` default (`date.today()` vs `todayYmdLocal()`) is a possible TZ edge; `unit_qty` is `int(quantity)` server-side vs `Number(quantity)` client-side (non-integer qty). Note for the spec; do not block B0 on them.

### 3.2 Matcher is quantity-aware FIFO — **frozen (PPL-1)**

Confirmed at `matching.py:101–165` (source audit A1). One open is consumed by close slices:

- `closes[]` — slices `{close, close_day, units}`
- `closed_units` — sum of takes
- `slot_remaining` — remainder
- **`m["close"]` stays `None` until the open is fully consumed**

Partial case (close unit qty < open): one slice; `open_units` stays the **original** size (e.g. 5); `closed_units` increases; remaining is `slot_remaining` (e.g. 4). Not a split open, not an orphan open **at the matcher grain**.

Locked by `test_partial_close_leaves_remaining_units_open`:

- `close is None`
- `open_units == 5`
- `closed_units == 1`

**A rewrite of this matcher is the wrong move** and would break that test. v1.0 proposed it; v1.1 retracted it. This Spec **PARKs** matcher rewrite.

### 3.3 Three terminal states today, and only three

```
STATUS_OPEN = "Open"
STATUS_COMPLETE = "Complete"
STATUS_ORPHAN = "Orphan close"
```

(`matching.py:183–185`.) Client badges: `open | complete | orphan_close | neutral`. **`neutral` = no-legs row, not a position state.** Autofilter tokens: Open / Complete / Orphan close (`web/lib/tradeLogAutofilter.ts:7–11`).

No unfinished / incomplete / pending / dangling **position** state exists in domain or client (**C2-2 CONFIRMED**).

### 3.4 Hold window

`MAX_STRUCTURE_HOLD_DAYS = 30` (`matching.py:30`, mirrored `tradeLog.ts:430`). A close whose calendar span from its open exceeds 30 days is **not paired → the close orphans**. The open stays unmatched unless expiry ≤ `as_of` triggers synthetic expire.

**C2-3 PARTIAL vs v1.0:** a late close **orphans**; it does **not** mint a second realized Complete. Options past expiry go synthetic-Complete at 0. Day-book already **drops** the open from open-interest at 30d (`day_book.py:46–50`) while the blotter can still say Open — a **surface disagreement**.

### 3.5 Close gates live only in `TradeSheet.save()`

Four gates (Trade Log §16.5), all bypassable with local flags:

| Gate | As-built UI override |
|------|----------------------|
| Structure pairs intended open | `allowOrphanClose` |
| Same `account_id` as open | `allowAccountMismatch` |
| Unit qty (GCD) equals open | `allowPartialUnits` |
| No structure drift vs open | `allowDrift` |

`POST /api/me/trade-log/trades` (`trades.py` create) validates strategy, `asset_class`, `net_side`, account ownership, playbook/campaign. It does **not** call `match_open_close`, does not require a matched open, does not compare accounts, does not require unit-qty equal, does not check structure drift. Legs insert as sent.

**Bypass:** direct `POST` with `legs[].pos_effect = "TO_CLOSE"`, or **import commit** (same: no match gates). **C1-2 CONFIRMED.**

### 3.6 Delete is hard; delete-order is client-only

- `DELETE /api/me/trade-log/trades/{id}` — identity+id. **Never 409.** Legs `ON DELETE CASCADE`.
- Client `canDeleteTrade` / `findPairedClose` read **`m.close` only**. On a **partial** close `m.close` is null → the guard **lets you delete the open while its partial close still exists**. A delete can orphan a real partial close. **C1-3 CONFIRMED, worse than v1.0 claimed.**
- Confirm UI (sheet): bespoke in-drawer `trashConfirm` in `TradeSheet.tsx`. **Not** kit `AlertDialog`, **not** `useConfirm`. B0/C1-4 named this surface.
- Confirm UI (blotter bulk): `window.confirm` on `web/app/app/trade-log/page.tsx` (~652). **Echo B1:** this surface was missing from C1-4’s “not `window.confirm`” line. Same kit-violation class. PPL-5 covers **both**.
- `trash_reason` column exists (`081_trade_log_entry_source.sql`). Read in `_trade_row`. **No writer** in `*.py` / `*.ts` / `*.tsx`. Unused chips on the in-drawer farm — **do not port** into kit `AlertDialog`.
- Soft-trash exists **only** for **import-batch** delete (`member_trade_log_trades_trash`, 30-day restore, Import Batches Spec §6a). That is **not** blotter-row delete. Import Manager already uses kit `useConfirm` — **prior art, not redesigned**. **C1-4 CONFIRMED** (sheet); bulk `window.confirm` added from Echo as-built.

### 3.7 Expire-worthless is synthetic; ToS expire is a real close fill

- Synthetic expire: `id = -open.id`, `synthetic = SYNTHETIC_EXPIRED_WORTHLESS`, never persisted. `enrich_trades_with_synthetic_pnl` appends in memory.
- ToS `EXPIRED` / `ASSIGN` / `EXERCISE` (and synonyms) import as **`TO_CLOSE` fills** at fill 0 (`trade_log_io.py`, locked by `test_parse_tos_expired_pos_effect_is_to_close`).
- Adapters in `server/trade_log_io.py`: `thinkorswim`, `csv_generic`, `native`, `tradier`, `tradestation`. **No IB adapter.**
- An imported book can read **Complete even when the opening window was never imported**, because the broker’s expire row **is** a close fill. **C2-4 CONFIRMED.** Labelling/provenance, not new plumbing.

### 3.8 Import table has no coverage window

Table is **`member_trade_log_imports`** (not `*_import_batches`). Columns today: `id, identity_id, account_id, adapter, source_filename, practice_campaign_id, trade_count, skipped_count, label, created_at, deleted_at`. **No from/to.** An orphan close is indistinguishable from “open predates the file.” **C2-1 CONFIRMED.**

### 3.9 Read models that ignore `closes[]` / `slot_remaining`

| Consumer | What it does today | Lie |
|----------|--------------------|-----|
| `blotter_status_by_id` | Treats a close as paired only when `m.close is not None` | Partial close → **Orphan close** + **Open** |
| `positionBadge` / `tradeRowIssues` | Same `m.close` grain | Same |
| `findPairedClose` / `canDeleteTrade` | `m.close` only | Partial open is deletable |
| `capital_positions.open_qty_and_avg_cost` | Returns original `unit_qty` | Qty **5** after a 1-of-5 close |
| `positions_valuation` | `opens = [m for m in matched if m.get("close") is None]` then original qty | Capital and marks **overstate residual** |

**C1-1 CONFIRMED (render) and worse on the positions book** — the lie feeds valuation, not only chrome.

### 3.10 Reconciliation scorecard (B0 §0.5 — do not re-litigate)

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

**Better than v1.0 claimed** (record so they are not re-litigated):

1. The **matcher is already quantity-aware** — Arch 15 §9's "multi-lot still future" is stale.  
2. **No client/server matcher drift** on the pairing rules; the shared `m.close`-only status grain is a *joint display bug*, not drift.  
3. A close past 30 days **orphans**, it does not fabricate a second realized Complete.  
4. ToS expiration is **not dropped** — it is a real close fill.

**Worse than v1.0 claimed:**

1. **C1-3 on partials** — the delete guard reads `m.close`, which is null mid-partial, so a 1-of-5 open is deletable while its close row remains. A delete can orphan a real partial close.  
2. **C1-1 positions book** — open qty stays 5 after a 1-of-5 close, so capital and marks **overstate the residual**. The lie is not only cosmetic; it feeds valuation.

---

## 4. Domain model

### 4.1 What is stored vs what is derived (**PPL-12**)

| Kind | What | Notes |
|------|------|--------|
| Stored | Fills (`member_trade_log_trades` + legs), accounts, import batches (`member_trade_log_imports`) | Unchanged |
| Stored (new, OD-9) | Coverage window on the **import batch** (from/to) | Member-supplied (or derived-at-commit) **input** to derivation. Not a position. Shape **OD-9 OPEN**. |
| Stored (new, OD-22) | **Declarations** as a **new object** | Never a fake fill. Member-supplied input to derivation. Shape **OD-22 OPEN**. |
| Derived | Position, status, open qty, pairing, day-book open interest | Matcher grain frozen. **Read models** consume `closes[]` / `slot_remaining` + coverage window + declarations. |
| Never stored | Position row, status column, synthetic expire-worthless fill | Synthetic remains `id = -open.id` in memory |

**Do not** persist a status. **Do not** insert a synthetic fill to “complete” a truncated import. **Do not** mint a close fill from a declaration.

### 4.2 Matcher grain (unchanged — PPL-1)

At the matcher:

| Field | Meaning |
|-------|---------|
| `open_units` | Original open size (e.g. 5) |
| `closed_units` | Units consumed by slices |
| `slot_remaining` | Remainder (e.g. 4 after close 1 of 5) |
| `closes[]` | Every consuming slice, including partials |
| `m.close` | Set **only** when fully consumed; else `None` |

`test_partial_close_leaves_remaining_units_open` continues to assert this grain. Read models **must not** require `m.close` to notice a partial.

### 4.3 Open quantity for capital and Positions (**PPL-2**)

**Law:** open qty = **remaining units**. **Qty SoR is the match slot** (`closes[]` / `slot_remaining`), not `open_qty_and_avg_cost(trade)` — that helper sees only the fill and cannot see remainder.

Worked example (B0 / source test): open 5, close 1 → remaining **4**. Positions report **4**. Cost basis / avg cost scale to the remainder (India/Alpha: same formula as today, over remaining units — do not invent a second cost model in this draft).

`positions_valuation` must not treat “`m.close is None`” as “fully open at original size.” A slot with `closes[]` and `slot_remaining > 0` is an open **remainder**.

Valuation still consumes shared marks per Positions View V3 — this Spec does not open a new mark path.

### 4.4 Derived cycle states

**Today (three, plus client `neutral`):** Open · Complete · Orphan close.

**Need (B0 contract items 1 and 7, Coach Phase 0 item 8):** the three-state set cannot describe a legitimately incomplete cycle. Source sharpens two honest gaps that must become **representable**:

| Coach phrase | Circumstance | Derivation need (law) | Member-facing token |
|--------------|--------------|------------------------|---------------------|
| **partial-residual** | C1 — close 1 of 5, remainder 4 | Open slot with `closes[]` non-empty and `slot_remaining > 0`. **Not** an orphan close. **Not** Open-at-original-size. Qty = remainder. | Used in C1 acceptance as **partial-residual**. Whether this is its own Autofilter token or shares the fourth-state word is **OD-21**. |
| **unfinished cycle** | C2 — genuinely incomplete cycles (truncated-import orphan; representable incomplete book) | A derived state for a cycle the three-state set cannot tell the truth about. Fail-loud. Resolvable by **declarations** (new object, never a fill). | **OD-21 OPEN** — Hotel accepts or rejects **“unfinished cycle”** as the fourth-state vocabulary. |

**B0 §2.3 transcribed (Coach/Claude — not dropped):**

> The fourth state — **"unfinished cycle"** — a representable derived state absorbing the truncated-import orphan and the partial-residual. Fail-loud; resolvable by member declarations (new object, never a fill).

**Juliet (not a block, not a collapse):** Coach Phase 0 requires **both** phrases to remain and forbids inventing a **third** English word as law. This Spec therefore:

- Specs the **need** (representable incomplete cycle; partial remainder; truncated-import orphan).  
- Specs the **derivation inputs** (`closes[]` / `slot_remaining`, coverage window, declarations).  
- Leaves the **member-facing token** as **OD-21 OPEN**.  
- Does **not** pick a third word (no “dangling,” no “pending,” no “incomplete” as law — those strings appeared in the source audit as *absent* greps, not as product names).  
- Does **not** treat B0’s “absorbing” sentence as deletion of “partial-residual.”

**Hotel Phase 4 (recommendation, not disposal — OD-21 remains OPEN):** see §12. Hotel **rejects** “unfinished cycle” as the *absorbing* fourth-state word; **accepts** it for **C2 only**; **keeps** **partial-residual** for **C1**; two predicates, two member words; no third English word. B0 absorbing sentence **stays transcribed**. Coach Phase 5 disposes.

**Still derived, still fail-loud:** every cycle is representable **or** named. Never a silent blank. Never a lying Open-at-5. Never a lying Complete.

**OPF analogy (not import):** Options Lab Law B — prefer a **named, calm state** to silence or a numeric lie. Practice blotter/positions are **not** OPF cards. Do **not** reuse EXPIRED / HELD/RESIDUAL / NOT TRADED / IV NO / CHECK LEGS as Practice cycle states. Practice names its own derived states; Echo owns chrome; Hotel owns OD-21 vocabulary.

**Orphan close remains.** A `TO_CLOSE` with no paired open **inside** the coverage window, and no declaration that explains it, is still Orphan close. An orphan whose open would fall **before** the window is **not** a broken book — it is an explained boundary (§6.1).

**Complete remains** full consumption (`m.close` set, or synthetic expire-worthless for leftover with expiry ≤ `as_of` — existing path, not redesigned).

**Open remains** a slot with no consuming slices and still inside the hold window (and not yet synthetically expired).

### 4.5 Coverage window (PPL-6 · OD-9 OPEN)

On **`member_trade_log_imports`**, a from/to coverage window. An orphan close whose open would fall **before** the window renders as an **explained boundary**, not a broken book.

B0 copy for the member sentence — **Echo B2 / Tango APPROVED as a calm named state, not error chrome:** *"opened before your imported history."*

**OD-9** (India · Alpha → Coach) owns column names, types, nullability, backfill of existing batches, and whether from/to is member-declared, inferred from min/max `exec_at` in the file, or both. This Spec does **not** lock SQL.

Coverage window is an input to derivation. It does **not** invent an open fill.

### 4.6 Declarations store (PPL-9 · OD-22 OPEN)

**Law:** declarations store as a **new object**, **never a fake fill**.

They are member-supplied inputs so a genuinely incomplete cycle can resolve honestly (e.g. “this close’s open is outside my imported history,” or other declarations Hotel/India later name). They do **not**:

- Insert `TO_OPEN` / `TO_CLOSE` rows  
- Set `m.close` in the matcher  
- Bypass FIFO  
- Fabricate a debit/credit  

**OD-22** (India · Alpha) owns table/shape, identity scoping, and how derivation reads them. Packets that persist declarations **cannot start** until OD-22 is disposed.

### 4.7 Provenance of close fills (PPL-10 · C2-4)

Imported expiry / assignment / exercise **already import as `TO_CLOSE` fills**. C2-4 is **labelling / provenance**, not new plumbing. No IB adapter in this Spec.

The member (and the Autofilter / issue chips) must be able to distinguish:

| Kind | As-built | This Spec |
|------|----------|-----------|
| **Imported expire / assign / exercise close** | ToS adapter emits `TO_CLOSE` at 0; `entry_source=import` | Must be distinguishable from the other two |
| **Synthetic expire-worthless** | Derived, `id = -open.id`, never persisted | Remains derived; labelled as synthetic, not a blotter row |
| **Member close** | `entry_source=manual` (or `automated` when Strategy Lab writes) `TO_CLOSE` | Remains a member (or automated) fill |

Juliet does **not** invent a `close_kind` column. India may use existing `entry_source` + adapter + synthetic flag **if** that is sufficient to distinguish imported expire from imported regular close; if it is not, the distinguishability requirement still stands and the column is OD-adjacent architecture, not a silent fake fill.

### 4.8 Hold boundary — one answer (PPL-7 · OD-23 OPEN)

`MAX_STRUCTURE_HOLD_DAYS = 30` stays the as-built number unless Coach changes it via **OD-23**.

**Law:** day-book and blotter **agree** at that boundary. Today day-book drops the open from OI at 30d while the blotter can still say Open.

**Not decided here:** whether agreement means “both still show Open (named),” “both drop / explain hold-boundary,” or a named fourth-state. **OD-23** (Hotel · Coach) asks whether 30 is curriculum-owned or a technical cap — now doubly relevant given this disagreement.

**Hotel Phase 4 (recommendation, not disposal):** `30` is a **year-typo pairing cap**, not curriculum. **Do not change the number.** Do not teach “close by day 30.” See §12. Direction of agreement remains **FI-PPL-1**.

Juliet does **not** pick the direction. The law is **one hold rule, one answer on every surface**.

---

## 5. Circumstance 1 — close / delete

### 5.1 Read models consume `closes[]` / `slot_remaining` (**PPL-2**)

**Qty SoR is the match slot** (`closes[]` / `slot_remaining`), not `open_qty_and_avg_cost(trade)`. That helper sees only the fill. Callers that need remaining units read the slot; they do **not** invent a parallel remaining-qty function on the fill.

**One grain, three call-site families** (PPL0-A1 — do not walk back): pairing of the close fill · remaining qty / still-open · delete guard. Same slot SoR; not one function change.

This table is **exhaustive** for in-scope product surfaces (blotter, sheet, GET `/opens`, Positions / `positions_valuation`, day-book). Change these — **not** the matcher FIFO:

| Surface | Consumer | After |
|---------|----------|--------|
| **Blotter** | `blotter_status_by_id` (`matching.py` — **read model**, not PPL-1 FIFO) | A slot with partial slices is **not** Orphan close + Open-at-original-size. It renders **partial-residual** at remaining qty. The close slice is **paired** (as a partial), not orphaned. |
| **Blotter** | `positionBadge` | Same grain as server status. |
| **Blotter** | `tradeRowIssues` | Does not flag a true partial as orphan. |
| **Blotter / sheet** | `findPairedClose` | Sees outstanding partials in `closes[]`, not only `m.close`. |
| **Blotter / sheet** | `findPairedOpen` | A partial close id returns the open it sliced (not only `m.close`). |
| **Blotter / sheet** | `listUnmatchedOpens` | Remainder is not a fully unmatched open. Same grain as GET `/opens`. |
| **Blotter / sheet** | `canDeleteTrade` | Open is **not** deletable while a partial (or full) close exists. |
| **Sheet** | `TradeSheet` close/delete chrome | Same `closes[]` grain as the API; kit confirm remains §5.4. |
| **GET `/api/me/trade-log/opens`** | `server/routes/trade_log/trades.py` (~329): today `opens = [m["open"] for m in matched if m.get("close") is None]` | Named. A 1-of-5 remainder is still `m.close is None` at the matcher grain and must **not** be listed as a fully unmatched open (not bulk-deletable, not Close-listed as size 5). Filter / payload consume `closes[]` / `slot_remaining`. |
| **Positions** | `capital_positions.positions_valuation` | Open book qty = **slot remainder**; does not overstate residual capital. Does not treat `m.close is None` as fully open at original size. |
| **Positions** | `open_qty_and_avg_cost(trade)` | **Not qty SoR.** Sees the fill only. Remaining units come from the match slot, then this helper may scale cost over that remainder. Do not teach it `slot_remaining` by hiding the slot. |
| **Day-book** | `server/trade_log_domain/day_book.py` | Same remainder / hold-boundary answer as the blotter (**PPL-7**). Direction of agreement is **not** picked here (FI-PPL-1). |

**Bulk select / “Select opens”:** only opens with **no** outstanding close slices (full unmatched). A partial-residual open is **not** bulk-deletable. GET `/opens` is the server unmatched-open SoR for that selection — it is in this table so it cannot stay `m.close`-only.

Client and server stay aligned on this **display** grain the way they already align on pairing rules. Drift between badge and `blotter_status_by_id` is a defect.

**Leftover `m.close`-only callers** (source grep, not silent):

| Caller | Disposition |
|--------|-------------|
| `server/campaign_phase_reports.py` `_open_structures` / free-cash | **GO-allowlist candidate** for residual **capital** (worse half of C1-1). Same `m.close is None` plus `open_qty_and_avg_cost(trade)`. **Not** Campaign UI; do **not** open Campaign chrome; not a DL-539 three-OK into Campaigns. If free-cash must stop overstating remainder, the GO names this file as a PPL-2 allowlist path. |
| `server/trade_log_domain/pnl.py` | **Inherit-via-domain.** Reports/Journal consume domain; this Spec does not restyle those apps. Pairing grain stays; display/qty honesty follows PPL-2 when those readers use the slot. |
| `server/trade_log_domain/day_net_calendar.py` | **Inherit-via-domain.** Journal calendar. Same as pnl: not a second matcher. |
| `server/trade_log_domain/matching.py` FIFO loop (`m["close"]` set only when fully consumed) | **Out-of-scope / PPL-1 freeze.** Matcher grain. `blotter_status_by_id` in the same file is the **read model** (this table), not the FIFO. |
| `server/activate_demo_integrity.py`, `seed_trade_linked_journals.py`, `seed_weekly_retrospectives.py` | **Out-of-scope** (demo / seed). |
| `server/market_data/trade_chart_service.py` | **Out-of-scope** (Market Bus freeze). |

### 5.2 Four close gates move to the API (**PPL-3**)

SoR is the API, fail-loud **422**, explicit overrides **in the payload**. Today they live only in `TradeSheet.save()`.

| Gate | Default | Override |
|------|---------|----------|
| Structure pairs intended open | Required | “Allow orphan / unexpected pair” |
| Same `account_id` as open | Required | “Allow different account” |
| Unit qty (GCD) equals open | Required | “Allow unit size ≠ open” |
| No structure drift vs open | Required | “Allow structure drift” |

UI checkboxes (as-built names: `allowOrphanClose`, `allowAccountMismatch`, `allowPartialUnits`, `allowDrift`) remain member chrome and must **round-trip** as explicit payload fields. **API key names are India’s** (as-built UI names are source, not locked JSON). A gate-violating close without the override is **refused by the API**. The sheet must not present a successful save when the API refused.

**Write-path table (India B1 — every path that can insert or re-key a `TO_CLOSE`):** an unenumerated path is a C1-2 hole. Each row is **gated** or **excepted-pending-OD** — Juliet does **not** pick.

| Path | Close-gate application | Notes |
|------|------------------------|--------|
| `POST /api/me/trade-log/trades` (member close) | gated **or** excepted-pending-OD | PPL-3 / C1-2: the path Coach named. W2 may seed **this** path. |
| `PATCH /api/me/trade-log/trades/{id}` (becomes / re-keys a close) | gated **or** excepted-pending-OD | Enumerated so create-then-PATCH is not a silent bypass. Not left as Juliet opinion. |
| `POST /api/me/trade-log/import/commit` | gated **or** excepted-pending-OD | **OD-25 OPEN.** Packets that seed **W2 import-commit gates cannot start** until Coach disposes OD-25. |

Same table in §7.1. Domain validators live with Alpha in `trade_log_domain` / `trades.py` so a path classified **gated** cannot be skipped by omitting the sheet.

**OD-25** (import commit vs coverage-window orphans) is in §12. Juliet does not answer it.

Partial units: v1 UI default remains **full structure close**; partial only with explicit override. Domain already consumes partials; the gate is honesty, not engine capability. §16.6’s “one open to one close” sentence is **STALE** and is corrected by this Spec (parent amend).

### 5.3 Delete-order on the API (**PPL-4**)

**409** when deleting a `TO_OPEN` that still has a paired (including **partial**) `TO_CLOSE`.

Order rule (Trade Log §16.4 / Arch 15 §4.4, now server-enforced): **close first, then open** when both exist.

| Target | API |
|--------|-----|
| `TO_CLOSE` | May `DELETE`. Paired `TO_OPEN` becomes unmatched (or partial-residual if other slices remain). |
| `TO_OPEN` with any `closes[]` slice (full **or** partial), non-synthetic | **409**. Body names the close id (fail-loud). |
| `TO_OPEN` unmatched (no slices) | May `DELETE`. |
| Bulk opens | Only unmatched opens. |

Once read models consume `closes[]`, the client guard **agrees** with the API. Client agreement is not a substitute for 409.

Synthetic expire-worthless is **not** a stored close and does **not** 409-block delete of the open (it is not a row).

### 5.4 Close and delete are distinct transitions (**PPL-5**)

Closing a structure is not deleting it.

- **Close** = write a `TO_CLOSE` fill (gated).  
- **Delete** = remove a fill row (hard today; 409 when order is wrong).

**Every blotter-row destructive delete in this program** uses kit **`AlertDialog` / `useConfirm`** (Human Interface Spec §6.3). Echo B1: two surfaces, not one. A W2 seed that only kills the drawer leaves banned `window.confirm` on the log.

| Surface | As-built | This Spec |
|---------|----------|-----------|
| Sheet delete (`TradeSheet` `trashConfirm`) | In-drawer red box + unused reason chips | Replace `trashConfirm` (open **and** close fills) with kit `AlertDialog` / `useConfirm` |
| Blotter **bulk trash** (`web/app/app/trade-log/page.tsx`) | **`window.confirm`** | Replace with the **same** kit primitive. File is in §0.2 as **bulk-confirm consumer only** — do **not** restyle the rest of the page |
| Import Manager batch delete | Kit `useConfirm` already | **Prior art. Not redesigned.** Do **not** apply PPL-4 blotter 409 to import recycle |

Grammar (HI Spec §6.3 — **both** surfaces): item **name** or count, consequence sentence, **Cancel** + named **Delete** (sentence case), `destructive: true`, Cancel default-focused / Esc cancels, confirm is the **only** path that calls `DELETE`. Busy state on the kit dialog (`AlertDialog` already has `busy`). **Not** bespoke in-drawer forever. **Not** `window.confirm`.

**Do not** port the unused `trash_reason` chip farm into `AlertDialog`. Kit dialog is title + message + two actions — not a picker. `trash_reason` remains unwritten until OD-19 (or a later Spec) writes it. This Spec does not invent a writer.

**Soft-trash for blotter rows is OD-19 — do not decide it.** Soft vs hard changes only the **consequence sentence** (cannot-be-undone vs restore-from-recent). It does **not** change the primitive. Import-batch recycle remains the Import Batches Spec path and is out of this Circumstance 1 chrome except as that prior art.

---

## 6. Circumstance 2 — import end-state

C2-2 is still the root: three states cannot describe a legitimately incomplete cycle. Source sharpens *which* symptom matters. The 30-day “fake Complete” fear was **wrong**. The honest gaps are:

- **the truncated-import orphan (C2-1)** — the member’s most common false defect; and  
- **the day-book / blotter disagreement at 30d (C2-3)** — the open shows in one surface and not the other.

### 6.1 Coverage window (**PPL-6** · OD-9)

Highest-leverage C2 fix. New migration adds from/to on **`member_trade_log_imports`**. An orphan close whose open would fall before the window renders as *"opened before your imported history."* **Calm named state, not error chrome** (Echo B2; Tango APPROVED this sentence). Not a broken book.

Existing Import Manager / recycle-bin behavior stays. This Spec adds window columns and derivation that **reads** them. Backfill of historical batches is OD-9 (do not invent min/max `exec_at` as law).

**Acceptance fragment (B0 §2.3):** an import covering 60 days shows no broken book for a position opened on day −90.

### 6.2 Fourth state — genuinely incomplete cycles (**PPL-8** · OD-21)

See §4.4 for derivation. Fail-loud. Resolvable by declarations (**PPL-9**, OD-22). Member-facing token is **OD-21 OPEN**.

**B0 §2.3 transcribed (not dropped):** The fourth state — **"unfinished cycle"** — a representable derived state absorbing the truncated-import orphan and the partial-residual.

Coach Phase 0 keeps **both** **partial-residual** (C1) and **unfinished cycle** (C2). Juliet does not collapse them and does not invent a third English word as law.

**Hotel Phase 4 (recommendation, not disposal):** reject **unfinished cycle** as the *absorbing* fourth-state word; accept it for **C2 only**; keep **partial-residual** for **C1**. Two predicates, two member words. See §12 OD-21. Coach Phase 5 disposes.

**Acceptance fragment:** every genuinely incomplete cycle renders in **one honest state**.

### 6.3 Day-book and blotter agree at 30 days (**PPL-7**)

One hold rule, one answer on every surface at `MAX_STRUCTURE_HOLD_DAYS` (30). See §4.8. OD-23 remains OPEN for ownership of the number.

**Acceptance fragment:** a position at day 30 reads the **same** on the blotter and in the day-book.

### 6.4 Expiry / assignment already import as close fills (**PPL-10**)

C2-4 needs **labelling**, not new plumbing. Distinguish imported expire close vs synthetic expire-worthless vs member close (§4.7). No IB adapter.

**Acceptance fragment:** an imported expiration is distinguishable from a synthetic one.

---

## 7. API / schema

Migrations are **sketched, not applied**. No `migrate.py` run in this Phase 1.

### 7.1 Close create — gates (indicative)

Write-path table (same as §5.2; India B1):

| Path | Close-gate application |
|------|------------------------|
| `POST /api/me/trade-log/trades` (member close) | gated **or** excepted-pending-OD |
| `PATCH /api/me/trade-log/trades/{id}` (becomes / re-keys a close) | gated **or** excepted-pending-OD |
| `POST /api/me/trade-log/import/commit` | gated **or** excepted-pending-OD |

On a path classified **gated**:

- Without overrides: four gates; **422** naming the failed gate.  
- With explicit override fields in the JSON payload: the named gate may pass. Overrides are **opt-in per request**, never ambient config, never a cookie.  
- 422 body is fail-loud (which gate, which open id when known). Shape is Alpha/India.

As-built UI flags (source, not locked keys): `allowOrphanClose`, `allowAccountMismatch`, `allowPartialUnits`, `allowDrift`.

Import commit stays **OD-25**. W2 import-commit gate packets **cannot start** until Coach disposes.

### 7.2 Delete — 409 (indicative)

`DELETE /api/me/trade-log/trades/{id}`:

- Unmatched open or any close: **200** `{ok, id}` as today (hard delete unless OD-19 later changes this).  
- Open with paired/partial close: **409**. Names the blocking close id.  
- Missing / wrong identity: **404** as today.

### 7.3 Coverage window (sketch · OD-9)

Additive columns on `member_trade_log_imports`, **names not locked**:

```sql
-- SKETCH ONLY. OD-9 owns names, types, nullability, backfill.
-- ALTER TABLE member_trade_log_imports
--   ADD coverage_from DATE NULL,
--   ADD coverage_to   DATE NULL;
```

`GET /api/me/trade-log/imports` grows the window fields when OD-9 lands. Commit may accept and/or infer them — **not locked**.

### 7.4 Declarations (sketch · OD-22)

New object / table, identity-scoped, Family B. **No schema in this draft.** Never a row in `member_trade_log_trades`.

### 7.5 Status / Autofilter

List endpoints that emit blotter status (`statuses=`, `blotter_status_by_id`, Autofilter distincts) consume the **new derivation**. **Autofilter English** waits on **OD-21**. W1 may emit a **machine key** so C1 remainder rows are queryable; do **not** lock a new `TL_STATUS` string as law. Do not put partial-residual or explained-boundary in the Orphan filter bucket. Budget `_BLOTTER_STATUS_BUDGET` unchanged in spirit (full-book, 422 over budget — Autofilter as-built).

### 7.6 Positions valuation

`GET /api/me/capital/positions-valuation` (and Trade Log Positions open book): qty = remaining units from the **match slot** (`slot_remaining`), not from `open_qty_and_avg_cost(trade)` alone. No new mark fetch. No second valuation store.

---

## 8. Member experience

### 8.1 Honest named states (PPL-13)

Process-first (Trade Log T-D5). P&L optional and neutral — **never** the product headline. No profit-claim marketing. No valence color on G/L (Positions View V8 / V15 remain).

When the cycle is incomplete, the member sees a **named, calm state** and a short truthful explanation — not a blank, not a lying Open-at-5, not a lying Complete, not a raw “broken” that blames them for a truncated import.

OPF Law B is the **honesty analogy**. Practice does not wear OPF chrome.

B0 member sentence for truncated import — **Echo B2 / Tango APPROVED; calm named state, not error chrome:** *"opened before your imported history."*

### 8.2 Close vs delete

Close is a fill. Delete is destruction. The sheet does not collapse them into one unmarked control. Destructive confirm is kit `AlertDialog` / `useConfirm` on **both** surfaces in §5.4 (sheet `trashConfirm` **and** blotter bulk `page.tsx`). Close vs delete as **one wizard with a hard fork, or two** is **OD-19** — **not answered**.

### 8.3 Partial-residual

A 1-of-5 close does **not** look like an orphan. Remaining **4** is visible on blotter and Positions. The open cannot be deleted until the partial close is removed (or OD-19’s later policy). Full-close remains the default path; partial is explicit.

**Chrome (Echo B2):** **partial-residual is not Orphan amber** and not Open-at-original-size. Qty **4** lives in the **qty / Positions** column, not stuffed into the badge string. Visual family: Open-remainder (calm, process), never amber “broken,” never destructive.

### 8.4 Capacity (Tango)

Do not hide process behind magic. Do not manufacture a “Complete” to soothe a truncated file. Teach the member what the book actually knows. Suggestions (declarations) teach; they do not invent fills.

### 8.5 Autofilter / badges

Do **not** lock a new Autofilter **English** token as law. Visible filter label waits on **OD-21** (Hotel recommendation in §12; Coach Phase 5 disposes). W1 may emit a **machine key** so C1 remainder rows are queryable (acceptance §9.1 / “filter can name the state” = **selectability**, not copy-as-law). Until Coach disposes OD-21, C1 acceptance copy may use Coach’s **partial-residual** as a temporary label **without** becoming Autofilter law.

**Do not** ship explained-boundary or partial-residual in the **Orphan** filter bucket. That would keep the C1-1 / C2-1 lie in the chrome.

### 8.6 Named-state chrome grammar (Echo B2)

This **is** the Echo/Tango review §4.5 / §8.1 previously deferred. Charlie does not invent chrome to “finish” W1.

1. **Status column stays the existing blotter badge** — one badge per row, existing density. No second badge farm. No toolbar pills for the fourth state. No OPF named-state catalog (EXPIRED / HELD/RESIDUAL / NOT TRADED / CHECK LEGS / …). **Do not restyle Options Lab.**
2. **Open / Complete / Orphan close** keep their as-built badge slots. This program does **not** restyle those three (existing work). Orphan amber remains for a true unpaired close **inside** the coverage window (§4.4).
3. **partial-residual (C1)** is **not** Orphan chrome and **not** Open-at-original-size. Honest remainder. Qty **4** (1-of-5) lives in the **qty / Positions** column, not stuffed into the badge string. Visual family: Open-remainder (calm, process), never amber “broken,” never destructive.
4. **Coverage-window explained boundary (C2-1)** is a **calm named state**, not error chrome. Coach’s sentence is kept: *"opened before your imported history."* Tango **APPROVED** this sentence. Not `color.destructive`, not issue-chip “broken,” not Orphan badge, not a blocking Banner. Caption / secondary label on the existing issues or status slot is enough. Fail-loud and calm are compatible. Show this sentence **only** when derivation actually has a window that explains the boundary (NULL window ≠ this sentence; `import_id IS NULL` stays Orphan close).
5. **unfinished cycle (C2)** remains a Coach phrase for the genuinely incomplete cycle. Member-facing **English token** is **OD-21 OPEN**. Echo does not pick the word. Hotel recommendation (not disposal) is in §12. Do not invent a third English word as law (“dangling,” “pending,” “incomplete”).
6. **Autofilter English waits on Hotel / OD-21.** W1 may use a machine key. Do not invent a new Autofilter token as law. See §8.5.
7. **Do not** put explained-boundary or partial-residual in the Orphan filter bucket.

---

## 9. Acceptance criteria

From B0 §1.3 and §2.3, plus source tests that **must stay green**. Evidence over assertion when a GO lands.

### 9.1 Circumstance 1 (B0 §1.3)

1. A **1-of-5 close** → status **partial-residual**, positions qty **4**, **no** orphan badge, and the open is **not** deletable while the partial close exists.  
2. A **gate-violating close** is refused by the **API** without the override (**422**).  
3. Deleting a paired open before its close returns **409** (including the partial-close case).  
4. Close and delete remain distinct; destructive delete uses kit **AlertDialog / useConfirm** on **both** TradeSheet `trashConfirm` **and** blotter bulk trash (`web/app/app/trade-log/page.tsx`). Do **not** port unused `trash_reason` chips. Do **not** restyle Import Manager.

### 9.2 Circumstance 2 (B0 §2.3)

5. An import covering **60 days** shows **no broken book** for a position opened on day **−90** (explained boundary via coverage window).  
6. A position at **day 30** reads the **same** on the blotter and in the day-book.  
7. Every **genuinely incomplete** cycle renders in **one honest state**.  
8. An **imported expiration** is distinguishable from a **synthetic** one (and from a member close).

### 9.3 Matcher / isolation

9. `test_partial_close_leaves_remaining_units_open` stays **green** (`close is None`, `open_units == 5` at the matcher grain).  
10. Diff does **not** include LIM, QFRIC, XS, Market Bus, OPF store/builder, Template Runner, IKI, MiniTwo/DudeTwo, or `AnalyzerPositionsList.tsx`.  
11. No stored position table; no stored status column; declarations are not fills.

### 9.4 Existing Trade Log §16.9 still holds

Structure-first create, unmatched-open Close/Trash, fail-loud orphan unless allowed, trash-close restores unmatched, `entry_source` chips honest, no win-rate chrome — **except** where this Spec **corrects** status/qty/delete-order. Process notes remain optional.

### 9.5 Positions View

12. Open qty on valuation / Positions = **remaining units** (4, not 5, in the 1-of-5 case). Capital does not overstate residual.

---

## 10. Test impact (Kilo hole map — source audit Part D)

Files matching `server/tests/test_trade_log*.py` plus `test_capital_positions.py`.

| File | What it covers today |
|------|----------------------|
| `test_trade_log.py` | CRUD, accounts, autofilter, campaign stamp |
| `test_trade_log_domain.py` | Matcher, blotter status, partial, hold window, synthetic expire |
| `test_trade_log_import.py` | ToS parse, expire→`TO_CLOSE`, import batches, delete-all |
| `test_trade_log_broker_formats.py` | ToS / Tradier / TradeStation roundtrip |
| `test_trade_log_analytics.py` | Reports / day-book API |
| `test_capital_positions.py` | Open qty / valuation (must gain the remainder case) |

| Finding | Characterization already locking the behavior? | This Spec |
|---------|-----------------------------------------------|-----------|
| C1-1 partial → orphan + size 5 | **Y** for matcher remaining (`test_partial_close_leaves_remaining_units_open`). **N** for orphan badge / positions qty 5 | **Keep** matcher test green. **Add** badge + positions-qty-on-partial |
| C1-2 API has no close gates | **N** | **Add** 422 without override; 200 with explicit override |
| C1-3 API delete never 409 | **N** (no delete-order test; `test_delete_all_*` only) | **Add** 409 on paired and **partial** open delete; 200 on unmatched / close |
| C1-4 hard delete; `trash_reason` unwritten | **N** for `trash_reason`; import recycle is separately tested | Kit confirm on **sheet and bulk** (`page.tsx`). No `trash_reason` chips in the dialog. Soft-trash **OD-19** — no test of a writer until disposed |
| C2-1 no import coverage window | **N** (batch list/delete exists; no window columns to test) | **Add** after OD-9: window columns + explained-boundary render |
| C2-2 only Open / Complete / Orphan | **Y** `test_blotter_status_open_complete_orphan` | Will need an amend when the fourth derived state lands (OD-21). Do not break the three-state cases that remain true |
| C2-3 30-day hold | **Y** `test_match_refuses_year_long_hold` (refuses pair; day-book empty). **N** for “late close becomes Complete” (it does not) | **Add** blotter/day-book **agreement** at 30d. Do not add a test that expects fake Complete |
| C2-4 synthetic never persisted; ToS expire→close fill | **Y** `test_expired_worthless_closes_unmatched_open` + `test_parse_tos_expired_pos_effect_is_to_close` | **Keep**. **Add** provenance distinguishability |

A B0 that taught the matcher to split lots would **break** `test_partial_close_leaves_remaining_units_open`. This Spec does **not** rewrite the matcher.

The existing blotter-status test uses a fully unmatched orphan, not a partial — new tests must cover the partial grain.

Kilo also notes: Autofilter tokens, `canDeleteTrade` partial, and capital remainder.

---

## 11. Ideas inventory

Every non-trivial idea from Phase 0 / B0. **Never DISCARDED.**

| Idea | Disposition | Notes |
|------|-------------|--------|
| Read models consume `closes[]` / `slot_remaining` | **IN-SCOPE** | Highest leverage. Matcher untouched. |
| API close gates (422) + delete-order **409** | **IN-SCOPE** | SoR moves off `TradeSheet.save` / client `canDeleteTrade`. |
| Coverage window on `member_trade_log_imports` | **IN-SCOPE pending OD-9** | From/to. Packet cannot start until OD-9 disposed. |
| Fourth derived state (genuinely incomplete cycles) | **IN-SCOPE pending OD-21** | Need + derivation in-scope; **member-facing token** waits on Coach Phase 5. Keep **partial-residual** (C1) and **unfinished cycle** (C2). Hotel **recommendation** in §12 (not disposal): reject absorbing word; two predicates, two member words. |
| Declarations store as a new object, never a fake fill | **IN-SCOPE pending OD-22** | Shape is India/Alpha. |
| Kit `AlertDialog` / `useConfirm` for delete | **IN-SCOPE** | Human Interface §6.3. **Both** TradeSheet `trashConfirm` **and** blotter bulk `window.confirm` on `page.tsx`. Do not port `trash_reason` chips. Do not restyle Import Manager. |
| Day-book and blotter agree at 30d | **IN-SCOPE** | Direction of agreement not picked; OD-23 owns the number’s curriculum vs cap. |
| Expire-close provenance labelling (imported vs synthetic vs member) | **IN-SCOPE** | C2-4; no new plumbing; no IB. |
| Split close from delete (distinct transitions) | **IN-SCOPE** | Wizard-vs-two is OD-19. |
| Soft-trash blotter rows (`trash_reason` / recycle table prior art) | **FLAGGED / OD-19** | Considered. Not decided. Import-batch soft path is prior art, not this blotter law. |
| Close vs delete as one wizard with a hard fork, or two | **FLAGGED / OD-19** | Same OD. |
| FIFO lot selection member-visible on partials | **FLAGGED / OD-24** | Not in-scope until disposed. |
| `MAX_STRUCTURE_HOLD_DAYS = 30` curriculum vs technical cap | **FLAGGED / OD-23** | Agreement at current 30 is in-scope; ownership is not. |
| `as_of` timezone edge (server `date.today` vs client local) | **FLAGGED** | Residual unknown (B0 §6). Not B0-blocking. |
| Non-integer `unit_qty` (server `int` vs client `Number`) | **FLAGGED** | Residual unknown (B0 §6). Not B0-blocking. |
| PATCH-of-close inherits four gates | **FLAGGED** (enumerated in §5.2 / §7.1 write-path table) | No longer an unenumerated bypass. Application is gated **or** excepted-pending-OD. India O3 (not law) recommends same gates as member POST. |
| How four gates apply to **import commit** vs coverage-window orphans | **OPEN OD-25** (promoted from FLAGGED) | C1-2 names the bypass; C2-1 must not become a 422 wall. See §12. W2 import-commit gate packets cannot start until disposed. |
| Hold-boundary **agreement direction** (both still Open named / both drop-or-explain / named fourth-state), distinct from OD-23’s ownership of `30` | **FLAGGED · FI-PPL-1** | PPL-7 cannot be implemented as “one answer” until Coach names the direction. OD-23 answers a different question. Spec does not pick. Discuss: Coach + Hotel + India. |
| Persist broker Pos Effect (`EXPIRED` / `ASSIGN` / `EXERCISE`) on the **existing** fill for expire-vs-STC labelling | **FLAGGED · FI-PPL-2** | Not required for the C2-4 triad (imported close × `entry_source` × synthetic flag). Adapter drops the string today. A `close_kind` column is not a fake fill, but it is new schema — only if Coach wants “Expired (imported)” vs “Closed (imported).” Discuss: Coach + Hotel. |
| IB adapter | **DEFERRED** | Does not exist. Not this Spec. Trade Log §8 already “later.” |
| `fill_price: 0` Stamp **S-3** | **DEFERRED** | Out of B0. Corrupts PnL, not cycle state. |
| Matcher rewrite / split lots in MySQL / make matcher quantity-aware | **PARKED** | **Rejected by source.** Would break `test_partial_close_leaves_remaining_units_open`. Do not do. |
| v1.0 “eternal open + fake Complete” framing | **PARKED** | Corrected by v1.1. Late close **orphans**. Do not revive. |
| Store a position row or a status column | **PARKED** | Contradicts PPL-12 / Trade Log §4.1. |
| Import OPF named states onto the blotter | **PARKED** | Analogy only. |
| Server-side match preview endpoint (Arch 15 §9 later) | **PARKED** | Parent evolution; not Phase 0. Client mirror remains OK. |
| Restrict trash by `entry_source` (MM-1 later) | **PARKED** | Trade Log / Arch 15 future policy. Not this Spec. |
| Declarations **member chrome** (how the member names an incomplete cycle without a fake fill) | **FLAGGED · FI-PPL-E1** | OD-22 is store shape. No sheet/blotter control yet. Do not invent a wizard in W1/W2. When OD-22 is disposed, Echo reviews before Charlie builds. |
| Hold-boundary **visual** once Coach names agreement direction (India FI-PPL-1) | **FLAGGED · FI-PPL-E2** | PPL-7 is a constraint without a picture. Same named-state grammar as §8.6 when the direction lands. |
| Sentence-case **Delete** vs Trade Log vernacular **Trash** on bulk / sheet **triggers** | **FLAGGED · FI-PPL-E3** | Confirm **button** is Delete (HI Spec §6.3). Trigger labels may stay as-built or align later. Not OD-19. |
| Parent pairing explainer currently teaches 30-day as a member pairing lever (`exec_at` edit) | **FLAGGED · FI-PPL-H1** | Can teach backdating to beat a typo-guard. Amend when parents version. Not this pass. Hotel. |
| Remaining-lot avg cost = open avg; cost basis = avg × remainder; do not mix close proceeds into remaining avg | **FLAGGED · FI-PPL-H2** | Prevent a second false book on avg cost. Juliet already “same formula.” Hotel. |

**Flagged ideas: inventory intact** (Juliet Phase 0 + India FI-PPL-1/2 + Echo FI-PPL-E1…E3 + Hotel FI-PPL-H1/H2). Tango FI-TANGO-1…6 stay in Tango’s review as **labeled opinions**, not promoted to spec law. Coach disposes flags at Phase 5 or leaves them OPEN.

---

## 12. Open decisions

Coach **2026-09-14** (`PPL0-W0` · **DL-702**) disposed the reversible set. **OD-9, OD-22, FI-PPL-1 remain OPEN** — PPL4 cannot start.

| # | Question | Status |
|---|---|---|
| **OD-19** | Soft-trash or hard delete for blotter rows? | **DISPOSED:** permanent + kit warning dialog. No trash-bin this round |
| **OD-21** | Fourth-state vocabulary | **DISPOSED:** two words — **partial-residual** (C1) vs **unfinished cycle** (C2). Not merged |
| **OD-9** | Coverage window on `member_trade_log_imports` | **OPEN** — PPL4 |
| **OD-22** | Shape of the **declarations store** | **OPEN** — PPL4 |
| **OD-23** | Is 30 curriculum or a technical cap? | **DISPOSED:** stays 30. Typo-guard, not a lesson |
| **OD-24** | FIFO lot visibility | **DISPOSED:** show which open it hit (oldest first). No lot-picker |
| **OD-25** | Four gates on import commit vs truncated orphans | **DISPOSED:** member POST/PATCH gated; **file imports do not hard-block** a missing open |

B0 note (transcribed): the B0 set is unchanged from v1.0; one item (OD-9 table name) was narrowed/corrected to `member_trade_log_imports`. OD-25 is **not** a B0 number; it is the India B1 promotion of the former §11 FLAGGED import-commit idea.

Hotel/India recommendations for OD-21/23/24/25 became Coach silent defaults on `PPL0-W0`. Wizard-vs-two (OD-19 remainder) is **not** a trash-bin; kit dialog is the confirm primitive; close vs delete stay distinct transitions.

**PPL4 still blocked** until Coach disposes **OD-9**, **OD-22**, and **FI-PPL-1**.

---

## 13. Phasing

**Plan v1.1 · token `PPL0-W0` STAMPED GO · DL-702.** Board [`agents/p-practice-position-lifecycle/`](../agents/p-practice-position-lifecycle/). Product code waits on **PPL0-G** then PPL1.

Indicative slices (plan maps W0→PPL1, W1→PPL2, W2→PPL3, W3→PPL4):

Indicative slices so India can see dependencies — **not** a schedule:

| Slice | Intent | OD gate |
|-------|--------|---------|
| **W0** | Characterization: lock as-built lies (orphan badge on partial, positions qty 5, POST unguarded, DELETE never 409, no window, day-book/blotter split) **without** changing product behavior. Kilo hole map §10. | None |
| **W1** | Read models consume `closes[]` / `slot_remaining`. Partial-residual render (not Orphan amber), qty 4, delete guard sees partials. Matcher untouched. | None for the derivation. Autofilter **English** waits on OD-21; W1 may use a **machine key**. Do **not** invent a new Autofilter token as law. C1 acceptance still uses **partial-residual**. Charlie does not invent a token to “finish” W1. |
| **W2** | API close gates (422) + delete 409. Kit `AlertDialog` / `useConfirm` on **both** TradeSheet `trashConfirm` **and** blotter bulk `page.tsx` (`window.confirm`). Close ≠ delete. No `trash_reason` chips in the dialog. Import Manager not restyled. | Soft-trash / wizard **OD-19** — do not implement blotter recycle in W2. **OD-25** — do **not** seed import-commit gate packets until Coach disposes. |
| **W3** | Import coverage window + genuinely incomplete cycle state + declarations + expire provenance labelling + day-book/blotter agreement. | **OD-9, OD-21, OD-22** (and OD-23 if the agreement direction needs the ownership ruling). **Cannot start** those packets until disposed. |

W1 is the cheapest honest fix for the worst findings (C1-1 both halves, C1-3 partials) and is the correction the source audit’s Reading #1 points at.

---

## 14. Version history

| Ver | Date | Note |
|-----|------|------|
| **0.1 DRAFT** | **2026-09-14** | Juliet Phase 1. Built from B0 focused audit **v1.1** (law for the analysis) + source audit 2026-09-13 HEAD `87ab8748` StudioTwo. Status **DRAFT** — not BUILD AUTHORITY. Awaits India / Echo+Tango / Hotel then Coach Phase 5. |
| **0.1 DRAFT** (Phase 2 return) | **2026-09-14** | Juliet landed India B1–B3 only: write-path table + **OD-25**; Privacy Spec §2.1 DS-4 named later amend (OD-22); §5.1 exhaustive PPL-2 consumers + qty SoR = match slot; FI-PPL-1 / FI-PPL-2 in §11. Still **DRAFT**. ODs not answered. Hold-boundary direction not picked. Hotel vocabulary not invented. |
| **0.1 DRAFT** (Phase 3/4 return) | **2026-09-14** | Juliet landed Echo B1–B2: PPL-5 confirm surfaces (TradeSheet `trashConfirm` + `page.tsx` bulk `window.confirm`); kit `AlertDialog` / `useConfirm` for both; no `trash_reason` chips; Import Manager not restyled; §8.6 named-state chrome grammar (existing Status badge; partial-residual not Orphan amber; coverage sentence calm named state; Autofilter English waits on OD-21; W1 machine key). Tango Phase 3 **APPROVED** (opinions not promoted to law). Hotel Phase 4 **APPROVED**: OD-21 / OD-23 / OD-24 **recommendations** transcribed beside those ODs — **not disposed**. Both Coach phrases kept. **OD-19 not answered**. Still **DRAFT**. |
| **0.1.1 BUILD AUTHORITY** | **2026-09-14** | Coach stamped `PPL0-W0` (**DL-702**). Fourth active tree. OD-19 permanent + kit dialog. Silent defaults OD-21/23/24/25. §5.1 names `findPairedOpen` + `listUnmatchedOpens` + three families. OD-9 / OD-22 / FI-PPL-1 still OPEN. |

**Upstream analysis (not this Spec):**

| Ver | Date | Note |
|-----|------|------|
| B0 audit 1.0 | 2026-09-14 | First focused audit, inferred from specs. **Superseded as analysis.** |
| B0 audit **1.1** | 2026-09-14 | Reconciled against source. Matcher already quantity-aware; C1-1 fix → read models; C1-3 elevated; C2-3 fake Complete corrected; import table `member_trade_log_imports`; day-book/blotter disagreement surfaced. |
| Source audit | 2026-09-13 | Read-only. StudioTwo. HEAD `87ab8748`. |

---

*Where this Spec conflicts with Trade Log v1.1 §16.5–§16.6 or Arch 15 §9, this document is the intended correction and names the parent amend. Product code waits on PPL0-G then PPL1 characterization. StudioTwo as-built behavior remains until PPL2. MiniTwo is not this tree.*
