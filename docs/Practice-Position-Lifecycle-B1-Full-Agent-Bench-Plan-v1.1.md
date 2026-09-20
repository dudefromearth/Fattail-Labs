# Practice Position Lifecycle B1 — Full Agent Bench Plan v1.1

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-14  
**Status:** **Planning candidate — not a build GO.** Spec v0.4 is authority for **planning**. **Product code does not start until PPL3-G and PPL4-G are PASS** (spec §0). This file’s first job is to state that gate.  
**Plan revision:** **v1.1** (v1.0 SUPERSEDED as execution snapshot; kept on disk)  
**Author:** Juliet (orchestration)  
**Authority:** Coach (GO / ship)  
**Canonical land path:** `docs/Practice-Position-Lifecycle-B1-Full-Agent-Bench-Plan-v1.1.md`  
**Filename convention:** **dot** (`v1.1.md`), same as other `docs/*-Full-Agent-Bench-Plan-v1.N.md`. Header revision **v1.1** matches the filename. Specs keep underscore (`v0_4.md`). Claude’s `v1_0` was the review handle, not the land path.  
**Parent:** v1.0. **v1.1 freeze:** Claude review SOUND WITH FINDINGS F-1…F-5 (2026-09-14). Spec §5, B0 ODs, phase order, PPL5≠PPL6, and the PPL3+PPL4 gate are **not** re-opened.  
**Machine:** StudioTwo (`StudioTwo.local`). Next `:3000` · FastAPI `:4000`. Do not stop them. Nothing deploys unless Coach names MiniTwo. Never `git add -A`.

**Parent spec:** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_4.md`](../Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_4.md) **v0.4**  
**B0 BUILD AUTHORITY:** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`](../Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md) v0.1.1 · sha1 `84601fd3…`  
**B0 plan (do not re-open):** [`docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`](./Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md)  
**Board:** [`agents/p-practice-position-lifecycle-b1/`](../agents/p-practice-position-lifecycle-b1/)  
**Planning token:** [`agents/go/PPLB1-W0.md`](../agents/go/PPLB1-W0.md) — **AWAITING STAMP** · plan revision **v1.1**  
**First build token (later):** `agents/go/PPL5-W0.md` — **do not create a build stamp until PPL3 + PPL4 PASS**  
**Builder (F-5):** PPL5 product-code seat is **Alpha**. This Grok instance authored the plan as **Juliet** and does not execute PPL5 packets. `PPL5-W0` names Alpha before it exists — named here.

**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · spec-create-review-workflow Phase 6.

### Claude findings fold (SOUND WITH FINDINGS) — required for v1.1

Intent, gate, and phase order unchanged.

| ID | Finding | v1.1 disposition |
|----|---------|------------------|
| **F-1** | D-B1-4 campaign inheritance lived in PPL6 chrome | **Moved to PPL5 domain/API.** Override is an API parameter on the transformation event. PPL6 only exposes the control. **AT-B1-16** (PPL5). Decision D-B1-4 **not** re-opened |
| **F-2** | UC-X2 droppable by default freeze | **UC-X2 is in.** PPL7-W0 **names Analyzer consumer files as in-scope** (required). Coach may **defer UC-X2 only with a DL**. Silence is not an option. Spec §3.3 UC-X2 stands |
| **F-3** | AT-B1-6 on-confirm clause dropped | **Restored.** Confirmed import link output indistinguishable from AT-B1-3 (third writer, same event shape) |
| **F-4** | `v1_0` vs `v1.0` | **Dot.** Land path and filename: `…-v1.1.md`. Specs keep `v0_4` |
| **F-5** | Builder unnamed | **Alpha** is the Grok seat for PPL5 product code. Juliet orchestrates only |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
Coach overrule of a specialist finding = **DL entry with reasoning**, not a silent waive.

---

## 0. Sequencing gate (first entry — spec §0)

```text
PPL3-G PASS  ──┐
               ├──► PPL5 build GO (PPL5-W0) ──► PPL6 ──► PPL7 ──► PPL8
PPL4-G PASS  ──┘
```

| Gate | Today (2026-09-14, StudioTwo) | B1 implication |
|------|-------------------------------|----------------|
| **PPL3** API 422 + DELETE 409 + kit confirm | **Not started** (board: ready after PPL2-G) | Transformation lineages must not be built from unguarded closes |
| **PPL4** import end-state (OD-9 / OD-22 / FI-PPL-1) | **Blocked** on PPL3-G **and** those ODs | Import roll proposals (PPL8) sit on honest orphans / coverage |

**Planning may proceed now** (this document, board, seeds, India/Echo/Hotel review of D-B1-2…9).  
**No B1 product code, no migrations, no Analyzer consumption, until both gates PASS and Coach stamps `PPL5-W0`.**

A seed that edits `server/` or `web/` product paths before those stamps is **FAIL**.

---

## 1. Why this plan exists

B0 made the **binary** book honest (slot SoR, partial residual as a derived state). B1 adds three lifecycle concepts **beyond** open/closed, without a second position store and without touching FIFO:

1. **Partial Residual** — state already derived in PPL2; B1 ships **semantics + drawer** (Scale Out, N-close stack).  
2. **Transformed** — terminal-with-successor; one new **event** type on the fill stream (plus unlink as a revocation event).  
3. **Emergent transmutation** — not a state; re-recognition badge *“now a \<structure\>”*. The word “transmutation” never appears on the glass.

**Spine (do not re-litigate):**

> Event layer first (PPL5). Chrome second (PPL6). Never combine those two. Matcher frozen. No stored position. No lineage-level delete. No leg-out control.

---

## 2. Law this plan executes

| Doc | Role |
|-----|------|
| B1 Spec **v0.4** | Domain, UCs, D-B1-*, AT-B1-*, phase order. **Planning authority.** D-B1-1 **STAMPED**. D-B1-2…9 decided-in-draft pending **block stamp** |
| B0 Spec v0.1.1 | Still BUILD AUTHORITY for B0. Nothing here re-opens B0 |
| Trade Log Spec v1.1 | Parent blotter / import. Amends named in the packet that needs them |
| Human Interface Spec v1.0 §6.3 | Kit dialog (OD-19). Lifecycle **group** is one framed cluster |
| Import Batches | PPL8 proposal-first; OD-25 stands (imports not 422 on orphan) |
| OPF Truth v1.1 | Analogy only (named calm state). Do not import OPF |

**B0 decisions that stand (DO NOT RE-OPEN):**

| ID | Law |
|----|-----|
| **OD-19** | Permanent delete + kit dialog. No trash-bin |
| **OD-21** | Two words: partial-residual vs unfinished cycle. B1 surface budget is §4a (three terms: **Roll**, **Transformed**, **now a \<structure\>**) |
| **OD-23** | 30-day hold is option typo-guard (cash products already exempt in as-built) |
| **OD-24** | Show consumed open. No lot picker |
| **OD-25** | Imports not hard-422 on missing open |
| **PPL-1** | Matcher FIFO **frozen**. `test_partial_close_leaves_remaining_units_open` + PPL1 44 locks stay green (**AT-B1-9**) |
| **PPL-12** | No stored position row, no stored status column. Transformation is an **event**, not a position mutation |

**B1 invariants (every seed):**

| ID | Law |
|----|-----|
| **B1-G** | No product code until PPL3-G **and** PPL4-G PASS + `PPL5-W0` stamped |
| **B1-E** | PPL5 and PPL6 **never combine**. Event layer proves before chrome consumes it |
| **B1-V** | Glass terms only: Roll · Transformed · now a \<structure\>. No “transmutation”, “transform”, “current-structure”, “birth-structure” on the glass |
| **B1-L** | Lineages per-account (D-B1-2). Whole remaining only (D-B1-6). No fork |
| **B1-U** | Unlink = append revocation event. Mid-chain A→B→C revoke A→B → **[A] and [B→C]**, never A→C skip |
| **B1-X** | No B1 leg-out control. UC-X1 producer is import or **manual fill entry** only |
| **B1-I** | Isolation — §4 |

---

## 3. Decisions — stamp vs shield

| ID | Status | Plan treatment |
|----|--------|----------------|
| **D-B1-1** | **STAMPED 2026-09-14** | Immediate current-structure switch; badge informational. Law |
| **D-B1-2…D-B1-9** | Decided-in-draft; **block stamp requested** | Planning uses them. Seeds **shield** via DO-NOT-RE-OPEN. Coach stamps the block on `PPLB1-W0` or names overrides. **PPL5-W0 cannot fire** until the block is stamped **or** Coach names the ones still open |

Coach ticks on [`agents/go/PPLB1-W0.md`](../agents/go/PPLB1-W0.md).

---

## 4. Isolation (DL-539)

B1 is the **same Practice tree** as B0 (DL-702), not a fifth concurrent product. LIM / QFRIC / XS stay untouched.

**Do not touch (FAIL if in the diff unless the GO names it):**

| Frozen | Why |
|--------|-----|
| Matcher FIFO in `matching.py` | PPL-1 / AT-B1-9 |
| LIM / QFRIC / XS product files | Active other trees |
| `AnalyzerPositionsList.tsx` | Standing freeze **unless** `PPL7-W0` names it. **UC-X2 is not optional:** PPL7-W0 **must** name the Analyzer graph consume path (F-2). List freeze lifts only for named files |
| OPF store/builder, Market Bus, IKI, GSC | Existing work |
| MiniTwo / DudeTwo | Not this tree |

**In-scope after `PPL5-W0` (by phase):**

| Phase | Trees |
|-------|--------|
| **PPL5** | New event store + derivation (`server/trade_log_domain/`, routes, migrations, tests). **D-B1-4 campaign inherit/override is an API parameter here.** **No** drawer chrome |
| **PPL6** | `web/components/trade-log/TradeSheet.tsx` lifecycle group (exposes D-B1-4 override; does not implement inherit). Reports lineage **toggle** (default off). No import agent |
| **PPL7** | Structure re-recognizer + current-structure; drawer badge; **Analyzer consume path named on `PPL7-W0` (UC-X2 in)** |
| **PPL8** | Import proposal-first; Journal / Retrospective grouping (read-side) |

---

## 5. Critical path

```text
PPLB1-0   Planning stamp (this plan + D-B1-2…9 block)
   │
   │  (no product code)
   ▼
PPL3-G + PPL4-G   B0 remaining gates   ◄── HARD BARRIER
   │
   ▼
PPL5   Events + lineage derivation     GO: PPL5-W0
   │     AT-B1-3, 4, 8, 10, 11, 13, 14
   ▼
PPL6   Drawer lifecycle group          GO: PPL6-W0  (never merge with PPL5)
   │     Scale Out, N-close stack, Roll, Link, Unlink, History
   │     AT-B1-1, 2, 5 (drawer + reports toggle)
   ▼
PPL7   Re-recognition + badge + Analyzer UC-X2   GO: PPL7-W0
   │     AT-B1-7  (producer = import or manual fill, not a B1 control)
   ▼
PPL8   Import proposal + Journal/Retro GO: PPL8-W0
         AT-B1-6 (proposal + **on-confirm = AT-B1-3**), 12, 15
```

| Phase | May start | Product code? |
|-------|-----------|----------------|
| **PPLB1-0** | Coach stamps `PPLB1-W0` | **No** |
| **PPL5** | PPL3-G + PPL4-G + D-B1 block stamp + `PPL5-W0` | Yes — events only |
| **PPL6** | PPL5-G PASS + `PPL6-W0` | Yes — Trade Log drawer / Reports toggle |
| **PPL7** | PPL6-G PASS + `PPL7-W0` | Yes — recognizer + **named Analyzer consume files** (UC-X2). Defer only with DL |
| **PPL8** | PPL7-G PASS + `PPL8-W0` | Yes — import + journal/retro |

---

## 6. Phases

### PPLB1-0 — Planning stamp

**Agents:** Juliet · India · Hotel (vocab) · Echo (lifecycle group, not pixels yet) · Lima  
**Does not:** product code.

| Seed | Agent | Job |
|------|-------|-----|
| **PPLB1-0-0** | Coach | Stamp `PPLB1-W0`. Block-stamp D-B1-2…9 or name overrides |
| **PPLB1-0-1** | India | Confirm spec v0.4 ⟷ this plan. Event types are registry events, not a position store. PPL3/PPL4 gate is first |
| **PPLB1-0-2** | Hotel | §4a copy: three glass terms; “transmutation” off glass |
| **PPLB1-0-3** | Lima | DL: B1 planning seated; D-B1-1 already stamped; block-stamp result |
| **PPLB1-0-4** | Delta | PPLB1-0-G: token stamped, no product code in the stamp commit |

### PPL5 — Transformation + revocation events (build)

**Blocked** until §0 gates.  
**Agents:** Alpha · India · Kilo · Mike (409 unlink idempotency) · Lima

**Ships:**

- Table(s) for **transformation events** and **link-revocation events** (append-only, Family B, `identity_id` + `account_id`)
- Derivation: predecessor `Transformed` + successor pointer; unlink recomputes
- API: create link (wizard + manual emit the **same** event shape), unlink (409 if already revoked), refuse delete of Transformed predecessor while successor exists (**AT-B1-8**)
- **D-B1-4 (F-1):** successor **inherits** predecessor `practice_campaign_id` at the event API; optional override parameter; one-campaign rule preserved (**AT-B1-16**). PPL6 only exposes the control
- Refuse Roll of partial quantity (**AT-B1-10**) — API, not only UI
- Mid-chain unlink **AT-B1-13**; re-link **AT-B1-14**
- Import confirm (when PPL8 exists) writes through **this same event writer** (F-3)
- **No** Scale Out chrome, **no** Roll wizard chrome, **no** “now a vertical” badge

**Out:** drawer, import agent, Analyzer, matcher FIFO.

### PPL6 — Drawer surfaces

**Never combined with PPL5.**  
**Agents:** Echo · Charlie · Tango · Kilo

Lifecycle **group** (one framed cluster): Scale Out (qty picker) · Close (existing) · Roll (wizard: strike/expiry only) · Link · Unlink · Delete (OD-19 kit). State-aware.

Also: N-close stack in the top form (**UC-P3**); lineage chain (“History of this idea” or unlabeled — copy is this packet, not a fourth noun); Reports lineage **toggle**, default **off** (D-B1-3).

**AT-B1-1, 2, 5.** D-B1-4 override **control** in the Roll wizard (API already inherited in PPL5).

### PPL7 — Re-recognition

**Agents:** Alpha · Charlie · Hotel (structure catalog) · Kilo

On any fill touching a position, re-resolve residual legs against the **same recognizer the import grouper uses**. If species changed: current-structure updates **immediately**; badge *“now a \<structure\>”* (D-B1-1).

**UC-X2 (F-2) — not droppable by silence.** The Analyzer risk graph renders the residual’s **actual** structure, not birth-structure. `PPL7-W0` **names these files as in-scope** (exact paths confirmed at that stamp; substitutes allowed if renamed, not omitted):

- `web/lib/options-lab/useOpfRiskGraph.ts`
- `web/components/options-lab/OpfRiskAnalyzer.tsx`

`AnalyzerPositionsList.tsx` stays frozen **unless** `PPL7-W0` also names it. Coach may **defer UC-X2 only with a DL** naming the deferral; without that DL, PPL7-G **FAIL** if those consumers are not in the packet.

**AT-B1-7** producer is **manual fill or import**, not a B1 leg-out button.

### PPL8 — Import proposal + Journal / Retro

**Agents:** Alpha · Charlie · Tango · Kilo

ToS combo roll: same ticket, **same underlying**, expiry may differ, close-set = **full remaining legs**. **Proposal-first** — no lineage until confirm. Different underlyings → no proposal (**AT-B1-12**). Partial close-set → no proposal (**AT-B1-15**).

Journal day list groups by lineage; retrospective agent receives lineage in context. Read-side only.

---

## 7. Agent map

| Callsign | Duty |
|----------|------|
| **Coach** | `PPLB1-W0` block stamp; later `PPL5-W0`…`PPL8-W0` |
| **Juliet** | This plan, board, seeds. **Does not code packets.** This Grok session is Juliet for planning |
| **India** | Event vs position store; PPL3/PPL4 gate; D-B1-2 account boundary |
| **Alpha** | **PPL5 builder (F-5).** Grok execution seat for events + APIs (D-B1-4 inherit/override, AT-B1-16). Also PPL7 recognizer; PPL8 import proposal (third writer, same shape as AT-B1-3) |
| **Charlie** | PPL6 drawer; PPL7 badge; PPL8 journal grouping |
| **Echo** | Lifecycle group grammar; kit dialog; §4a |
| **Tango** | Drawer / journal copy; no P&L theater |
| **Hotel** | Roll vs species lie; catalog recognizer |
| **Mike** | 409 unlink; Family B on new tables |
| **Kilo** | AT-B1-* + AT-B1-9 regression |
| **Delta** | PPLB1-0-G … PPL8-G |
| **Lima** | DL + parent honesty in the same body of work |

**Not seated:** Sierra, Foxtrot, Bravo, November, Romeo, Papa, Victor, Whiskey, Yankee, Golf, Gemba.

---

## 8. Acceptance tests (plan expansion of spec §6)

| AT | Phase | Law |
|----|-------|-----|
| **AT-B1-1** | PPL6 | Scale 2 of 5 via drawer → `partial_residual`; UC-P2 surfaces agree; stack open+close qty 2 |
| **AT-B1-2** | PPL6 | Remaining 3 in two further closes → stack of three; Closed |
| **AT-B1-3** | PPL5 | Roll wizard **event** (API/test double until PPL6 chrome): Transformed + successor + one event; matcher untouched |
| **AT-B1-4** | PPL5 | Manual close+open+Link: **identical event semantics** to AT-B1-3 |
| **AT-B1-5** | PPL6 | Lineage P&L 3-link = sum; Reports default grain unchanged |
| **AT-B1-6** | PPL8 | ToS combo meeting constraints → **proposal** until confirm; **on confirm, output indistinguishable from AT-B1-3** (same event writer / same shape) |
| **AT-B1-7** | PPL7 | Leg-out via **import or manual fill** → “now a vertical”; Analyzer **consumes** current-structure (UC-X2; files named on PPL7-W0) |
| **AT-B1-8** | PPL5 | DELETE Transformed predecessor while successor exists → **409** |
| **AT-B1-9** | Every phase | PPL1 44 + matcher Keep green. Note `test_ai_run_bravo_live_via_api` hang |
| **AT-B1-10** | PPL5 | Partial-qty Roll refused; full remaining from `partial_residual` OK |
| **AT-B1-11** | PPL5 | Unlink appends revocation; predecessor Closed; P&L recomputes; nothing deleted |
| **AT-B1-12** | PPL8 | Different underlyings → no proposal |
| **AT-B1-13** | PPL5 | A→B→C revoke A→B → **[A]** and **[B→C]** |
| **AT-B1-14** | PPL5 | Second revoke → 409; Link to new successor allowed |
| **AT-B1-15** | PPL8 | Same underlying, close-set ≠ full remaining → no proposal |
| **AT-B1-16** | PPL5 | Successor inherits predecessor campaign at the **API**; override parameter respected; one-campaign rule preserved (D-B1-4, F-1) |

PPL5 characterization **before** chrome: AT-B1-3/4/8/10/11/13/14/**16** as API/domain tests (wizard = the same event writer PPL6 will call; PPL8 confirm is the third caller of that writer).

---

## 9. Parent amends (same body of work as the packet)

| Parent | When | What |
|--------|------|------|
| B0 spec v0.1.1 | PPL5 | Cite transformation event; do not reopen ODs |
| Trade Log v1.1 | PPL6 | Lifecycle group; Scale Out vs Close |
| Import Batches | PPL8 | Proposal-first roll ticket |
| Journal Session / Retro | PPL8 | Lineage in context (read) |
| Positions View | PPL6 | Must not regress remaining qty (UC-P2) |

---

## 10. Out of scope (entire B1 board)

- Matcher FIFO rewrite  
- Leg-out control / species-change wizard (D-B1-9)  
- Lineage-level delete; trash-bin  
- Cross-account lineage (D-B1-2)  
- Forked / partial-quantity roll (D-B1-6)  
- Combining PPL5 + PPL6  
- LIM / QFRIC / XS / IKI / Market Bus  
- MiniTwo  
- Re-opening B0 ODs  
- “Stability through more Analyzer card development” — not this tree  

---

## 11. First actions (Juliet → Coach)

1. Read this plan. It is **not** a build GO.  
2. Stamp [`agents/go/PPLB1-W0.md`](../agents/go/PPLB1-W0.md): accept D-B1-2…9 as a block, or name overrides.  
3. **Finish B0 PPL3 then PPL4** — B1 product code is illegal until those PASS.  
4. Only then stamp `PPL5-W0` and fire PPL5.

---

## 12. Document history

| Ver | Date | Note |
|-----|------|------|
| **1.0** | 2026-09-14 | First B1 plan from spec v0.4. Sequencing gate first. PPL5≠PPL6. Not a build GO. **Frozen baseline.** |
| **1.1** | 2026-09-14 | Claude SOUND WITH FINDINGS. F-1 D-B1-4 → PPL5 API + AT-B1-16. F-2 UC-X2 required on PPL7-W0. F-3 AT-B1-6 on-confirm restored. F-4 dot filename. F-5 Alpha is PPL5 builder. Gate and D-B1-* not re-opened. |
