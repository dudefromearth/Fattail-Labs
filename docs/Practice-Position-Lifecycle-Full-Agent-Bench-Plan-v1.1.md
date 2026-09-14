# Practice Position Lifecycle — Full Agent Bench Plan v1.1

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-14  
**Status:** **Execution candidate — not GO.** Spec is **DRAFT**. Advisor review of v1.0: **SOUND**. Coach still stamps `PPL0-W0`. That stamp is not this file.  
**Plan revision:** **v1.1** (v1.0 SUPERSEDED as execution snapshot; kept on disk)  
**Author:** Juliet (orchestration)  
**Authority:** Coach (GO / ship)  
**Canonical land path:** `docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`  
**Parent:** v1.0. **v1.1 freeze:** Advisor fold (Claude 2026-09-14). Product behaviour of packets unchanged except **PPL3 caller audit** (Advisor §2.2) is now a required seed before AT-PPL-6 invert.  
**Machine:** StudioTwo (`StudioTwo.local`). Next `:3000` · FastAPI `:4000`. Do not stop them. Nothing deploys unless Coach names MiniTwo. Never `git add -A`.

**Parent spec (DRAFT):** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`](../Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md)  
**Analysis law:** [`docs/Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md`](./Practice-Position-Lifecycle-B0-Focused-Audit-v1_1.md)  
**Source evidence:** [`docs/Practice-Position-Lifecycle-Source-Audit-2026-09-13.md`](./Practice-Position-Lifecycle-Source-Audit-2026-09-13.md) · HEAD `87ab8748`  
**Grok opinion (2026-09-14):** **SOUND WITH AMENDMENTS** — folded here as **PPL0-A*** (must land as spec v0.1.1 in **PPL0**, before W1 code).

**Board:** [`agents/p-practice-position-lifecycle/`](../agents/p-practice-position-lifecycle/)  
**W0 token:** [`agents/go/PPL0-W0.md`](../agents/go/PPL0-W0.md) — **AWAITING STAMP** · plan revision **v1.1**  
**Advisor review:** [`docs/Practice-Position-Lifecycle-Bench-Plan-Advisor-Review-v1.0.md`](./Practice-Position-Lifecycle-Bench-Plan-Advisor-Review-v1.0.md) — SOUND; five conscious ticks; PPL3 caller-audit gap (folded here).

**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review-workflow Phase 6.

### Advisor fold (Claude 2026-09-14) — required for v1.1

Intent unchanged. No new phase. No new frozen tree. No product behaviour change on W1.

| ID | Finding | v1.1 disposition |
|----|---------|------------------|
| **Adv-1** | Reviewer did not see spec or Grok opinion | **India/Juliet fidelity (this session):** spec v0.1 is on disk; Grok opinion was SOUND WITH AMENDMENTS (PPL0-A*). Spec does **not** bake “accounts are highest / registry naming open.” Campaigns are Trade Log **passive stamps** only. PPL0-1 still folds A* into spec v0.1.1 |
| **Adv-2** | Fourth concurrent active tree | **Conscious tick on `PPL0-W0`.** Juliet rec remains reassignment DL at stamp. Alternative: sequence PPL behind LIM/QFRIC/XS. Coach ticks; no silent default **on this item** (new token row) |
| **Adv-3** | PPL3 422 can break existing TO_CLOSE writers | **Required seed `PPL3-4`:** enumerate every writer of a `TO_CLOSE` fill; each carries override, is exempted, or is a test that inverts. **Before** AT-PPL-6 invert. PPL3-G FAIL without the inventory |
| **Adv-4** | OD-19 hard delete is irreversible | **Conscious tick** already on token. Kit dialog is the mis-click half; undo is not this board unless Override |
| **Adv-5** | OD-9 / OD-22 / FI-PPL-1 no silent default | **Affirmed.** Unchanged |
| **Adv-6** | PPL0-A1 and PPL0-A4 are improvements over the audit | **Do not walk back.** One grain three families; two predicates not one absorbing word |

Grok PPL0-A1…A8 stay in force.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
Coach overrule of a specialist finding = **DL entry with reasoning**, not a silent waive.

---

## 0. Why this plan exists

A position in Practice is **derived** (`match_open_close`). The matcher is already quantity-aware FIFO. The book lies because **read models and write endpoints** read `m.close` and ignore `closes[]` / `slot_remaining`, and because close gates / delete-order live in the browser.

Two circumstances, unchanged:

1. **Closing and deleting** — a 1-of-5 close renders Orphan + Open-at-5; capital overstates residual; the open is deletable under a live partial close; POST is unguarded; DELETE never 409.  
2. **Imported positions with no defined end state** — unpaired close cannot be told from “open before the file”; three named states only; day-book and blotter disagree at 30 days.

**Spine (do not re-litigate):**

> Teach the read models to consume `closes[]` / `slot_remaining` and a coverage window, add honest derived states, and move integrity gates to the API. **Do not touch the matcher.**

**Highest-leverage packet:** **PPL2 (W1)** — one SoR (the match **slot**), many consumers. That closes C1-1 both halves and C1-3 without rewriting FIFO.

---

## 1. Law this plan executes

| Doc | Role |
|-----|------|
| Practice Position Lifecycle Spec **v0.1 DRAFT** | Domain + acceptance. **Not BUILD AUTHORITY** until Coach Phase 5 + this GO |
| Trade Log Spec v1.1 §16 | Parent. §16.5 gates and §16.6 “one open to one close” are **stale**; this program amends them in the same body of work as code |
| Arch 15 | Manual management as-built. §9 “multi-lot still future” is **stale** |
| Import Batches Spec | Table is `member_trade_log_imports`. Recycle-bin is **not** blotter-row delete |
| Positions View v0.2 §5.1 | Remaining open qty is already law; as-built overstates |
| Human Interface Spec v1.0 §6.3 | Kit `AlertDialog` / `useConfirm`. `window.confirm` banned |
| Member Data Privacy v0.1 §2.1 DS-4 | Named later amend when OD-22 lands |
| OPF Truth v1.1 | **Analogy only** (named calm state). Do not import OPF |

**Invariants (every seed):**

| ID | Law |
|----|-----|
| **PPL-1** | Matcher FIFO / quantity consumption **frozen**. `test_partial_close_leaves_remaining_units_open` stays green (`close is None`, `open_units == 5` at matcher grain). `blotter_status_by_id` in the same file is a **read model** — changing it is PPL-2, not a matcher rewrite |
| **PPL-2** | Qty / pairing / delete-guard SoR is the **match slot** (`closes[]` / `slot_remaining`), not `open_qty_and_avg_cost(trade)` |
| **PPL-3** | Four close gates on the API (422, overrides in payload) |
| **PPL-4** | Delete-order 409 including **partial** slices |
| **PPL-5** | Close ≠ delete. Kit confirm on **sheet and blotter bulk** |
| **PPL-11** | Isolation — see §3 |
| **PPL-12** | No stored position row, no stored status column |

---

## 2. Grok amendments this plan treats as law (PPL0-A*)

v1.1 analysis is **SOUND WITH AMENDMENTS**. Juliet does not drop Coach/B0 contract items. These amendments land as **spec v0.1.1 in PPL0** (India + Juliet), **before W1 code**.

| ID | Amendment | Packet |
|----|-----------|--------|
| **PPL0-A1** | One **grain**, three **call-site families** (pairing of the close fill · remaining qty / still-open · delete guard). Not “one function change” | Spec v0.1.1 · PPL2 seeds name all three |
| **PPL0-A2** | Exhaustive consumers include **GET `/api/me/trade-log/opens`** (`trades.py:329`) and client `listUnmatchedOpens` / `findPairedOpen` | Spec already names GET `/opens`. PPL2 must also name `findPairedOpen` |
| **PPL0-A3** | Write paths: POST **and PATCH** gated in PPL3. Import commit is **OD-25** — do **not** 422 truncated-history orphans | PPL3 · OD-25 |
| **PPL0-A4** | Two predicates, not one absorbing word: **partial-residual** (C1) vs **unfinished cycle** (C2). Hotel rec, Coach disposes OD-21 | PPL0 stamp · PPL4 English |
| **PPL0-A5** | Coverage window = **ALTER `member_trade_log_imports`**, not a new table. Declarations = **new object** | PPL4 |
| **PPL0-A6** | Day-book / blotter split is its own finding (**FI-PPL-1**). Direction OPEN. PPL4 day-book packet cannot start until disposed | PPL4 |
| **PPL0-A7** | C1-4 bulk delete still uses `window.confirm` on `web/app/app/trade-log/page.tsx`. Kit covers **both** surfaces | PPL3 |
| **PPL0-A8** | C2-4 triad does **not** need `close_kind` for synthetic vs member vs imported close (`synthetic` + `entry_source`). Stricter expire-vs-STC is **FI-PPL-2** | PPL4 labelling only |

**Silent-at-GO defaults (Juliet rec — Coach ticks on `PPL0-W0` or names an override):**

| OD / FI | Silent default if Coach stamps without naming an alternative |
|---------|--------------------------------------------------------------|
| **OD-21** | Two member words: **partial-residual** (C1) · **unfinished cycle** (C2). No third English word. W1 uses **machine keys** |
| **OD-23** | `30` stays. Technical cap against year-typo pairing, not curriculum. Do not teach “close by day 30” |
| **OD-24** | Show which open FIFO consumed (id / remainder). **No** lot-method picker. Chrome may wait until PPL4; W1 still attributes remainder to the consumed open |
| **OD-25** | Member POST + PATCH take the four gates. Import commit does **not** hard-422 the orphan-close gate |
| **OD-19** | PPL3 = **hard delete** + kit dialog. Soft-trash blotter rows **not this board** |
| **OD-9 / OD-22 / FI-PPL-1** | **No silent default.** PPL4 packets that need them **do not start** |

---

## 3. Isolation (DL-539 · PPL-11)

This is a **candidate fourth tree** beside LIM, QFRIC, and XS. It does not fire until `PPL0-W0` is stamped **and** AGENTS.md active-program line is reassigned in that same stamp (Juliet rec · QFRIC/XS pattern · **not** three-OK theater).

**Do not touch:**

| Frozen | Why |
|--------|-----|
| Options Lab Heatmap **LIM** | Active |
| Quant Lab **QFRIC** | Active |
| Options Lab **XS** | Active |
| `web/components/options-lab/AnalyzerPositionsList.tsx` | Standing freeze. Diff containing this file is **FAIL** |
| Market Bus, OPF store/builder, Template Runner, IKI, Sessions/GSC | Existing work |
| MiniTwo / DudeTwo | Not this tree |
| Matcher FIFO loop in `matching.py` | PPL-1. `blotter_status_by_id` in that file **is** in scope |

**In-scope trees (after GO):**

- `server/trade_log_domain/` (read models, **not** FIFO)
- `server/routes/trade_log/`
- `server/capital_positions.py`
- `web/lib/tradeLog.ts` · `web/lib/tradeLogAutofilter.ts`
- `web/components/trade-log/*`
- `web/app/app/trade-log/page.tsx` (**bulk-confirm consumer only** — no page restyle)
- Tests `server/tests/test_trade_log*.py` · `test_capital_positions.py`
- Migrations sketched in spec §7 (**not** until PPL4 / OD-9)
- Parent spec/Arch amends named in spec §0.3 (same body of work as the packet that needs them)

**GO-allowlist (named, not Campaign chrome):** `server/campaign_phase_reports.py` residual capital — only if the GO token ticks it. Default: **out** of PPL2; flag if free-cash still overstates after PPL2-G.

**Import Manager:** prior art. Do **not** restyle. Do **not** apply blotter 409 to import recycle.

---

## 4. Critical path

```text
PPL0  GO · spec v0.1.1 (Grok A*) · AGENTS seating · OD ticks
  │
  ▼
PPL1  W0 characterization (no product behavior change)
  │
  ▼
PPL2  W1 read models  (slot SoR · matcher frozen)     ── no OD
  │
  ▼
PPL3  W2 API POST+PATCH 422 · DELETE 409 · kit confirm
  │         import-commit gates ── OD-25 (default: skip)
  │         soft-trash ── OD-19 (default: skip)
  ▼
PPL4  W3 coverage window · states · declarations · day-book
            ── cannot start packets until OD-9 / 21 / 22 / FI-PPL-1
```

PPL2 is the cheapest honest fix for the worst findings. PPL3 does not wait on PPL4. PPL4 does not start “because the board exists.”

| Phase | Name | Gate | May start |
|-------|------|------|-----------|
| **PPL0** | Board · GO · spec v0.1.1 · AGENTS seating | **PPL0-G** | Coach stamp `PPL0-W0` |
| **PPL1** | Characterization tests only | **PPL1-G** | After PPL0-G |
| **PPL2** | Read models consume the slot | **PPL2-G** | After PPL1-G. No OD |
| **PPL3** | API gates + 409 + kit confirm | **PPL3-G** | After PPL2-G. OD-25 import seed **blocked** until disposed |
| **PPL4** | Import end-state | **PPL4-G** | After PPL3-G **and** OD-9, OD-21, OD-22, FI-PPL-1 |

---

## 5. Phases

### PPL0 — Board, stamp, spec honesty

**Agents:** Juliet · India · Lima · (Hotel/Echo recs already on disk)  
**Does not:** product code, migrations, MiniTwo.

| Seed | Agent | Job |
|------|-------|-----|
| **PPL0-0** | Coach | Stamp `PPL0-W0`. Tick ODs or accept silent defaults. Spec → BUILD AUTHORITY (v0.1.1 after PPL0-1) |
| **PPL0-1** | India + Juliet | Fold PPL0-A* into spec **v0.1.1**. Name `findPairedOpen`. Keep Coach phrases. Do not dispose ODs |
| **PPL0-2** | Lima | DL: program seated as additional active tree; spec status; parent-amend list (not the parent edits yet) |
| **PPL0-3** | Juliet | Seeds on disk (this set). Isolation FAIL if LIM/QFRIC/XS/`AnalyzerPositionsList` appear |
| **PPL0-4** | Delta | PPL0-G: token stamped, seeds present, no product code in the GO PR, isolation list named |

**PPL0-G PASS requires:** `PPL0-W0` stamped · spec v0.1.1 landed or explicitly deferred to the first line of PPL1 · characterization list exists · AGENTS.md active-program line updated in the stamp commit (or Coach names three-OK instead).

### PPL1 — W0 characterization (lock the lies)

**Agent:** Kilo. **No product behavior change.**

Lock as-built:

| AT | Claim |
|----|--------|
| **AT-PPL-1** | Matcher 1-of-5: `close is None`, `open_units==5`, `closed_units==1` (existing test — **Keep**) |
| **AT-PPL-2** | `blotter_status_by_id` / `positionBadge`: that close is **Orphan**; open is **Open** |
| **AT-PPL-3** | `positions_valuation` / `open_qty_and_avg_cost` path reports qty **5** |
| **AT-PPL-4** | GET `/opens` includes the 5-unit open |
| **AT-PPL-5** | `canDeleteTrade` on that open is **ok: true** |
| **AT-PPL-6** | POST `TO_CLOSE` with no override that would fail a gate is **200** (unguarded) |
| **AT-PPL-7** | DELETE of a fully paired open is **200** (no 409) |
| **AT-PPL-8** | `member_trade_log_imports` has no from/to columns |
| **AT-PPL-9** | Day-book empty for a 30d+ unmatched open that blotter still calls Open |

PPL1-G: tests **fail if the lie is gone** and **pass on current main**. That is the lock. PPL2 then **inverts** AT-PPL-2…5 (and PPL3 inverts 6–7).

### PPL2 — W1 read models

**Agents:** Alpha (domain + capital + GET `/opens`) · Charlie (client badge / issues / delete guard) · Kilo · Echo (chrome grammar already spec §8.6 — no new token).

**One grain, three families:**

| Family | Files (indicative) | After |
|--------|-------------------|--------|
| A. Close-fill pairing | `blotter_status_by_id` (walk `closes[]` even when `m.close` is None) · `positionBadge` · `tradeRowIssues` · `findPairedOpen` | Partial close is **not** Orphan |
| B. Remaining qty / still-open | GET `/opens` · `listUnmatchedOpens` · `positions_valuation` (qty from **slot**) | Remainder **4**; not bulk-deletable as a full unmatched open |
| C. Delete guard | `findPairedClose` · `canDeleteTrade` | Open **not** deletable while a non-synthetic slice exists |

**Matcher FIFO untouched.** Autofilter **English** waits on OD-21. W1 may emit a **machine key**. Do not put partial-residual in the Orphan filter bucket. Partial-residual is **not** Orphan amber (Echo).

**Acceptance (spec §9.1, subset):** 1-of-5 → residual qty 4, no orphan badge, open not deletable. Matcher test still green.

**PPL2-G:** AT-PPL-2…5 inverted · AT-PPL-1 still green · GET `/opens` characterization · no LIM/QFRIC/XS/`AnalyzerPositionsList` in the diff · client and server status grain agree.

### PPL3 — W2 write integrity + kit confirm

**Agents:** Alpha · Charlie · Echo (confirm copy) · Mike (409/422, identity scope) · Kilo.

| Item | Law |
|------|-----|
| POST create close | Four gates. 422 without override |
| PATCH that becomes / re-keys a close | Same gates (PPL0-A3) |
| Import commit | **OD-25.** Silent default: **do not seed**. Coverage window explains later |
| DELETE TO_OPEN with slices | **409**, names blocking close id |
| Kit confirm | TradeSheet **and** `page.tsx` bulk. No `trash_reason` chips. Import Manager untouched |
| Soft-trash | **OD-19.** Silent default: **not this packet** |
| **Caller audit (Adv-3)** | **Before** AT-PPL-6 invert: enumerate every current writer of a `TO_CLOSE` fill (POST, PATCH, import commit, seeds, demo builders, clone, xlsx import, tests, any duplicate-as-new). Each **carries the override**, is **exempted** (OD-25 import default), or is a test that **inverts**. Seed **PPL3-4**. PPL3-G **FAIL** without that inventory |

**PPL3-G:** AT-PPL-6/7 inverted · **PPL3-4 inventory in gate-reports** · kit grep: no `window.confirm` on trade-log page or TradeSheet · Echo visual of AlertDialog · isolation FAIL list.

### PPL4 — W3 import end-state (OD-gated)

Do **not** open this phase because PPL3 passed.

| Packet | OD gate | Job |
|--------|---------|-----|
| PPL4-window | **OD-9** | ALTER `member_trade_log_imports` from/to. Derivation: orphan-before-window → calm copy *“opened before your imported history.”* NULL window ≠ unbounded. `import_id IS NULL` stays Orphan close |
| PPL4-states | **OD-21** | Member-facing tokens. Machine keys may already exist from PPL2 |
| PPL4-decl | **OD-22** | New object, never a fake fill. Privacy DS-4 parent amend. Mike on isolation |
| PPL4-hold | **FI-PPL-1** | One hold answer on blotter and day-book. Number stays 30 unless OD-23 override |
| PPL4-label | — (narrow) | C2-4 triad via `synthetic` + `entry_source`. FI-PPL-2 persist Pos Effect **out** unless Coach adopts |

**PPL4-G:** spec §9.2 acceptance · no matcher rewrite · no IB adapter · no Stamp S-3.

---

## 6. Agent map

| Callsign | Duty |
|----------|------|
| **Coach** | Stamp, OD ticks, ship |
| **Juliet** | This plan, board, seeds. Does not code packets |
| **India** | Spec v0.1.1 · OD-9/22/25 shape · parent amends · isolation |
| **Alpha** | Domain read models, API 422/409, migrations when OD-9/22 |
| **Charlie** | Badge, sheet, blotter bulk confirm, Autofilter machine key |
| **Echo** | Kit dialog, named-state chrome. No new badge family |
| **Tango** | Copy honesty. Coverage sentence already APPROVED |
| **Hotel** | OD-21/23/24 recs already filed. False-book block on qty 5 |
| **Mike** | Family B on new writes; 409/422; OD-19 if adopted |
| **Kilo** | AT-PPL-* · invert on PPL2/PPL3 |
| **Delta** | PPL0-G … PPL4-G |
| **Lima** | DL + spec status + parent honesty in the same body of work |

**Not seated this board:** Sierra, Foxtrot, Bravo, November, Romeo, Papa, Victor, Whiskey, Yankee, Golf, Gemba.

---

## 7. Test strategy (Kilo)

**Keep green (do not rewrite matcher):** `test_partial_close_leaves_remaining_units_open`.

**Existing tests that PPL2/PPL3 must update, not “accidentally break”:**

- `test_blotter_status_open_complete_orphan` — keep the three-state happy path; add partial case
- Any Open:N / GET `/opens` count that assumed `m.close is None` ≡ fully unmatched
- `test_capital_positions.py` if it asserts option qty from the fill helper on a still-open multi-lot

**New tests:** listed as AT-PPL-2…9 (PPL1 lock) then inverted (PPL2/PPL3) plus coverage-window / hold-agreement after PPL4.

---

## 8. Parent amends (same body of work as the packet that needs them)

| Parent | When | What |
|--------|------|------|
| Trade Log v1.1 §16.5 | PPL3 | Gates are API SoR |
| Trade Log v1.1 §16.6 | PPL0-1 / PPL2 | “One open to one close” STALE |
| Trade Log v1.1 §4.6 table name | PPL0-1 | `member_trade_log_imports` |
| Arch 15 §9 | PPL2 | Residual units are read-model work, not future matcher |
| Positions View v0.2 | PPL2 | As-built honesty: remaining qty = slot |
| Import Batches | PPL4 | Coverage columns |
| Privacy DS-4 | PPL4-decl | Declarations named consumer |

Do **not** silently edit parents in PPL0 except spec v0.1.1 (this program’s spec).

---

## 9. Out of scope (entire board)

- Matcher FIFO rewrite  
- IB adapter  
- Stamp S-3 `fill_price: 0`  
- OPF / Analyzer / LIM / QFRIC / XS / Market Bus / IKI  
- Restyling Import Manager  
- Soft-trash blotter rows unless OD-19 Override  
- Inventing Autofilter English before OD-21  
- MiniTwo / DudeTwo  
- Show Doctrine / 0DTE Live campaign naming (separate Coach document; not this tree)

---

## 10. First actions (Juliet → Coach)

1. Read this plan. It is **not** a GO.  
2. Stamp [`agents/go/PPL0-W0.md`](../agents/go/PPL0-W0.md) **or** send the spec/plan back.  
3. Tick ODs on that token (or accept §2 silent defaults). **OD-9, OD-22, FI-PPL-1 have no silent default.**  
4. After PPL0-G: fire **PPL1** (Kilo characterization) then **PPL2** (read models). Do not skip PPL1 — the invert is the evidence.

---

## 11. Document history

| Ver | Date | Note |
|-----|------|------|
| **1.0** | 2026-09-14 | First plan. Spec DRAFT. Grok SOUND-WITH-AMENDMENTS folded as PPL0-A*. Not GO. |
| **1.1** | 2026-09-14 | Advisor review SOUND. PPL3 caller audit required (Adv-3). Fourth-tree and hard-delete are conscious ticks on the token. Spec fidelity check: no stale truth-model. v1.0 kept on disk. Still not GO. |
