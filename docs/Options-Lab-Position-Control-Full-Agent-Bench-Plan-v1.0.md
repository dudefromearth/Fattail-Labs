# Options Lab Position Control — Full Agent Bench Plan v1.0

**Status:** SUPERSEDED. Live plan: [`Options-Lab-Position-Control-Full-Agent-Bench-Plan-v1.1.md`](./Options-Lab-Position-Control-Full-Agent-Bench-Plan-v1.1.md). Do not hash this file.

**Date:** 2026-09-10  
**Plan revision:** **v1.0**  
**Canonical filename:** `docs/Options-Lab-Position-Control-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/PC-W0.md`](../agents/go/PC-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-options-lab-position-control/`](../agents/p-options-lab-position-control/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Position Control Spec v1.0** | [`Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1.0.md) | Contract. **Not BUILD AUTHORITY until PC0-0 / W0-0.** Whole-file sha1 `f6c2d9b440cbf3a1a80ced7d2fbf98f0f8a90420` |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Hit floor · destructive pattern · tokens |
| North star | [`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](../Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md) | Process copy; no profit theater |
| OPF Spec | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Package quote · freeze defaults · DL-309 parent |
| Position Builder Spec v0.3 | parent | Supersessions in Spec §7; **do not re-litigate PB17 path** |
| Autofit Spec v0.1 | parent | **AF-L5** must be amended in the same pass as PC9 |
| TM One-Source | parent | DTE reads TM clock (PC-EXP-5) |
| Trade Log Spec v1.1 | parent | Structure snapshot column (PC-LIFE-7) |

**Baseline commit (as-built gap map):** `34b84a7` (re-confirmed from `d20b4f9` in Spec §9).  
**Evidence basis:** Spec names `Analyzer-Position-Handling-Audit-v1.0` @ `d20b4f9`.

**MACHINE — all work against this Spec and this plan runs on COACH'S MACBOOK (dev).** No staging. No Mini Two. No Dude Two. Promotion targets are named by Coach **after** he has seen it run. Nothing in this plan deploys.

**No product code until Coach stamps W0-0 GO on Spec v1.0.** Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

Coach Content Law (doctrine §11): nothing of Coach’s is removed from the Spec. Objections sit **beside** the text.

**Every product decision in Spec v1.0 is already stamped.** This plan does not introduce engineering defaults. Two items are **delegated with owners**, not undecided:

| Item | Owner | When |
|------|-------|------|
| **Tick band table** (PC-CHAIN-7) | Authored at **PC1** from published contract specs; config-driven; **fails loud** on unknown product | PC1 |
| **Density-profile exemption** for Analyzer chrome (§5.2) | **Echo** rules **before** PC8 layout | PC8 entry |

Hotel **confirms the classifier table** (Spec §4.4) before PC2 classifier code. That is trading taxonomy, not a product OD.

---

## 0. Mission (one screen)

Give the member **absolute control over a position** — one `AnalyzerPosition` per id, three views, three litmus tests.

```text
ONE AnalyzerPosition per id
  ├── Card     — workspace writer (subset)
  ├── Dialog   — editor (full set; Create draft / Edit live)
  └── Canvas   — single-symbol view (never writes structure)
```

| Litmus | Spec | Ship meaning |
|--------|------|----------------|
| **1 Pricing is correct everywhere** | §1 | Unlocked: card, dialog and viewport show the same OPF-correct price and shape |
| **2 Nothing moves on its own** | §1 | Open, quote land, symbol switch, re-render write **zero** structure |
| **3 The member owns the shape** | §1 | Legs are the record; the name describes them and never governs them |

**First smoke after PC5 + PC6:**  
(1) Create Butterfly → Cancel: book length unchanged.  
(2) Edit open, card ▲: dialog legs match on the same tick; opening Edit wrote nothing.  
(3) Lock a fly, pull a wing: CHECK PRICE on BASIS, canvas still on live mid; Keep follows.

---

## 1. As-built honesty (checkout `34b84a7`)

Spec §9 is the oracle. Do not soften it.

### 1.1 Keep (do not rebuild)

| Area | Path | Note |
|------|------|------|
| Analyzer host | `web/components/options-lab/OpfRiskAnalyzer.tsx` | Session book owner. **Rewrite writers**, do not replace the host |
| Cards | `web/components/options-lab/AnalyzerPositionsList.tsx` | Becomes a writer under PC-VOCAB-3 |
| Dialog | `web/components/options-lab/PositionBuilder.tsx` | One panel, two bind modes (PC-REC-8). **Do not split the file in PC5** (Rules of Hooks) |
| Canvas | `web/components/options-lab/risk-graph/HostPnLChart.tsx` | Read-only of structure. Overlay preview stays; commit is the write |
| Book types | `web/lib/options-lab/analyzerBook.ts` | `AnalyzerPosition` remains the record. Schema grows; identity stays |
| Quotes | `web/lib/options-lab/usePackageQuotes.ts` | Atomic resolve stays. Merge contract changes in PC3 |
| Listed strikes | `web/lib/options-lab/listedStrikes.ts` · `listedStrikeDrag.ts` | DL-309. Overlay geometry stays |
| Display states | `web/lib/options-lab/cardDisplayState.ts` | NOT TRADED retained. CHECK PRICE is **lock** state, not a new display doctrine |
| Tests | `npx tsx` + `node:assert/strict` · Playwright `web/e2e/` | **No Vitest.** Bare Node for units |
| Persist key | `ft_options_lab_analyzer_positions_v2` | Session-scoped. Not a SoR |

### 1.2 Critical / blocking defects (Spec §9)

| Defect | Law | First packet that closes it |
|--------|-----|-----------------------------|
| Edit drops `rehearsal` (TM position becomes Trade-Log-eligible) | PC-REC-3 · PC-TM-2 | **PC0** |
| Edit drops `visible` (hidden cards reappear) | PC-REC-3 | **PC0** |
| Quote merge whole-row replace | PC-REC-4 | **PC3** |
| `didSeed` checkout; opening Edit snaps/reprices | PC-REC-2 · Litmus 2 | **PC5** |
| No Undo | PC-UNDO-1 | **PC4** (before card is a live writer) |
| Two structure writers; stored `template`; no CUSTOM | PC-STRAT-7/9 · §4.4 | **PC2** |
| Qty inverted (POS on row 1, ratio on legs) | PC-QTY-1 | **PC2** (with PC-LOCK-13, same packet) |
| Two lock models + two price engines | PC-LOCK-5 · Litmus 1 | **PC6** |
| CHECK PRICE absent | §4.8 | **PC6** |
| Promotion mapper always `LMT` / stored `entry_price` | PC-LIFE-10 | **PC9** |
| Strike snap-at-write, not at control | PC-CHAIN-2 | **PC7** |
| No tick source | PC-CHAIN-7 | **PC1** (source) · **PC7** (wire) |

### 1.3 Neighbor boards (India artifact-quote required)

This program **does not assert** another board’s PASS/FAIL.

| Neighbor | Isolation |
|----------|-----------|
| `p-options-lab-position-builder` | Prior PB program. **Do not reopen** OD-PB1–17 as a second SoR. Spec §7 supersedes AZ-CARD-1, OD-PB6, PB22, PB-VIEW-1 conflict. Shared files named per packet |
| `p-options-lab-surface-autofit` | **AF-L5** amend is **PC9**, same-day DL. Do not silently expand Autofit |
| `p-options-lab-tm-os` | DTE clock is PC-EXP-5; no TM chrome rewrite |
| `p-trade-log` | Snapshot column + mapper rewrite in **PC9**. Trade Log remains FIFO-from-fills SoR |
| `p-options-pricing-foundation` | OPF L0–L4 **frozen as foundation**. This board consumes PackageQuote; it does not relitigate packs |
| Heatmap / Runner / Market Bus / Quant / LIM / Sessions | **DL-539 freeze stands** except the Options Lab Analyzer trees this program names. Three-OK record is in §2.2 |

Shared files that other boards also touch: `web/styles/tokens.css` (Echo additive only at PC8), `web/lib/options-lab/analyzerBook.ts` (this program owns schema growth).

---

## 2. DL-539 — three-OK record (copy onto the GO token)

DL-539 is a **standing no-drift rule**. It names Options Lab. An agent who opens a frozen tree needs **three successive Coach OKs** on the token.

**This program is Coach directing Analyzer work**, not an agent opening the tree on its own. Record on `PC-W0.md`:

1. Coach commissioned an independent audit of position handling across card, dialog and canvas.  
2. Coach declared intent across successive statements and asked for it in a Spec.  
3. Coach directed the Spec through review cycles and stamped every open decision.  
4. Coach: development plan (this document).

The freeze is **not lifted** for other trees. Packet allowlists stay mandatory.

---

## 3. Product locks (law at W0-0)

These are **Coach’s Spec**. They become L-locks when the GO token is ticked. Until then, seeds call them **provisional**.

| ID | Lock | Spec |
|----|------|------|
| **L1** | One `AnalyzerPosition` per id is the only mutable record. Surfaces are views | PC-REC-1 |
| **L2** | Edit binds the live record. Create binds an off-book draft until Submit | PC-REC-2 · 7 |
| **L3** | No surface rebuilds a record from a definition. Session fields survive every edit | PC-REC-3 |
| **L4** | Quote merge writes **marks only**, dropped if structure moved | PC-REC-4 |
| **L5** | Canvas never writes structure. Overlay = preview; commit = write | PC-REC-5 |
| **L6** | One structure-changed signal. In: symbol · per-leg expiry · strike · right · **normalized ratio**. Out: raw counts · POS · marks · IV · basis · lock · visible · clocks · order · collapse · focus | PC-REC-6 |
| **L7** | Create verbs: Cancel · Submit. Edit: Close / Esc only — **no Submit** | PC-REC-9 |
| **L8** | Legs are the record. Name is computed, never stored. CUSTOM is arrived at, never selected | PC-STRAT-7 · 9 · 4 |
| **L9** | Leg rows show **actual contracts**. POS = GCD. BASIS is **one-package** over the normalized ratio, never × POS | PC-QTY-1 · 2 · PC-LOCK-13 |
| **L10** | `CardLockState` is the only lock. `net_debit_override` is derived ToS serialisation | PC-LOCK-5 |
| **L11** | ToS script always `@LMT <current price>`. Pending CHECK PRICE: cell shows marked kept number; script and canvas use **live mid** | PC-TOS · PC-STALE-6 |
| **L12** | CHECK PRICE is lock state on BASIS. Keep / Unlock. Canvas live until Keep | §4.8 |
| **L13** | Per-leg MARK/IV always live. No per-leg locks | PC-LEG · PC-LOCK-10 |
| **L14** | Controls offer only what the chain holds. Constraint at the **control**. DL-309 | PC-CHAIN-1 · 2 |
| **L15** | Log is a one-way door. TM: `tmActive` AND `!rehearsal`. Undo never un-Logs | PC-UNDO-6 · PC-TM-1 · 2 |
| **L16** | Analyzer position is pre-lifecycle. No order state written onto it | PC-LIFE-1 · 4 · 57 |
| **L17** | List multi-symbol; canvas single-symbol. Header select ≠ expand | PC-SYM-1 · 4 |
| **L18** | Every shown position is quoted. Overflow = **BUDGET LIMIT**, never silent | PC-SYM-8 · 9 |
| **L19** | Autofit: structure signal; committed book; fit only when geometry escapes | PC-FIT |
| **L20** | MSC is not the standard. No OMS. No second book. No global store | §3 · §10 |
| **L21** | Dev machine only until Coach names a promotion host | Spec header |

---

## 4. Sequencing (dependency facts — Spec §6)

Any plan that violates one produces a visibly broken intermediate:

1. **Undo before the card is a live writer.**  
2. **One-package units in the same packet as actual-contracts display.**  
3. **Legs-as-record before the classifier.**  
4. **Structure signal before rewiring quotes and autofit.**

Named prerequisites (absent today): tick source · single-sourced DTE horizon · classifier · promotion mapper rewrite.

```text
W0
 └── PC0  preserve rehearsal/visible (first code)
 └── PC1  tick source + DTE horizon (no member-visible)
      │
      ├── PC2  legs / POS / units / classifier     [Hotel taxonomy]
      │     └── PC3  signal + quote merge
      │           ├── PC4  Undo          ──┐
      │           └── PC5  bind split     ─┴── card may write
      │                 └── PC6  lock + CHECK PRICE + one price engine
      │                       └── PC7  chain-bound controls + recovery
      │                             └── PC8  layout / vocab / symbol groups
      │                                   └── PC9  autofit + promotion
      └── PCZ  as-built · DL close
```

**PC4 before PC5’s card-as-writer lands in the member’s hands.** PC5 may land bind-split with dialog-only writers first; card inline writers wait until PC4-G PASS.

**PC0 is not a pre-GO exception.** Spec: no implementation before GO. Juliet recommendation: first code packet **after** W0-0, same day if Coach wants the TM defect closed immediately.

---

## 5. Phase DAG (gates)

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **W0** | Spec GO · hash · DL · board · three-OK · seeds skeleton | — | Spec v1.0 **BUILD AUTHORITY** |
| **PC0** | Preserve `rehearsal` / `visible` · characterization net | W0 | AT-PC-02 · 47 (preserve half) |
| **PC1** | Tick source · single DTE horizon | W0 | AT-PC-59 · horizon grep |
| **PC2** | Legs-as-record · POS/GCD · units · classifier | W0 + Hotel confirm | AT-PC-35 · 36 · 39 · 40 · 41 · 43 · 53 |
| **PC3** | Structure signal · quote payload merge | PC2 | AT-PC-03 · 30 · 31 · 34 · 52 |
| **PC4** | Undo stack | PC3 | AT-PC-37 · 45 · 50 |
| **PC5** | Create draft / Edit live bind · verbs | PC4 | AT-PC-01 · 04 · 21–23 · 42 · 56 |
| **PC6** | One lock · one price engine · CHECK PRICE · ToS | PC5 | AT-PC-05–08 · 24–29 · 44 · 48 · 51 · 54 · 55 |
| **PC7** | Chain-bound controls · recovery · tick wire | PC1 + PC6 | AT-PC-09–12 · 17 · 18 · 38 |
| **PC8** | Shared vocab · layout · symbol groups · HIG | PC7 + Echo density ruling | AT-PC-15 · 19 · 20 · 33 · 49 · 58 |
| **PC9** | Autofit signal · promotion mapper · TM gates | PC3 + PC6 + PC8 | AT-PC-13 · 14 · 16 · 46 · 07 · 54 |
| **PCZ** | As-built gap map closed · DL · no false claims | all | Program PASS |

**Parallelism:** PC0 ∥ PC1 after W0. PC1 must **land** before PC7 consumes it. Classifier code in PC2 waits on Hotel confirm (can be a same-day seed).

---

## 6. Phase detail and seeds

Juliet materializes seeds under `agents/p-options-lab-position-control/seeds/`. Names below are normative.

### W0 — Board GO

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | **Coach** | Stamp `agents/go/PC-W0.md`. Spec sha1 `f6c2d9b440cbf3a1a80ced7d2fbf98f0f8a90420` **BUILD AUTHORITY**. L1–L21 LOCKED. Three-OK recorded. Delegated items named, not reopened |
| **W0-1** | **Lima** | DL entry: Spec accept · §7 supersessions · cross-stamps (AF-L5, TM DTE, PB17b symbol axis, Trade Log snapshot) · DL-539 three-OK verbatim |
| **W0-2** | **Juliet** | CHARTER · ORCHESTRATOR · seeds README · gate-reports/ · allowlist skeleton |
| **W0-3** | **India** | Parent Spec paths intact · no MSC · hash matches disk · freeze isolation |
| **W0-4** | **Hotel** | Classifier table (Spec §4.4) **confirm** before PC2. Side-pattern predicates required |
| **W0-G** | **Delta** | Token complete · hash · DL same day · ternary |

### PC0 — Stabilise (first code)

**Laws:** PC-REC-3 · PC-PERSIST-4 · PC-TM-2  
**Files:** `analyzerBook.ts` persist path · `OpfRiskAnalyzer.tsx` `handleBuilderSave` edit branch · characterization tests  
**Out:** refactors, layout, lock, quotes

1. Preserve `rehearsal` and `visible` on edit-save.  
2. Persist path must round-trip both.  
3. Characterization net for **current** quote merge, lock, template seed, strike shift, promotion mapper — expected to be rewritten later, visible in the diff.

**ATs:** AT-PC-02 · AT-PC-47  
**Live:** TM position → Edit → Log stays disabled after TM ends.  
**Gate PC0-G.**

### PC1 — Prerequisites (no member-visible)

**Laws:** PC-CHAIN-7 · PC-EXP-4  
**Out:** wiring into controls (PC7)

1. **Tick source:** one module, per product × premium band, from published contract specs. **Fail loud** on unknown product. No `0.05` placeholder.  
2. **DTE horizon:** one importer, one catalogue key (`OPF_ACTIVE_DTE_HORIZON`, currently 10). Fix drifted `max_dte=14` proofs in the same change.

**ATs:** AT-PC-59  
**Gate PC1-G.** Grep: exactly one horizon declaration reachable from TS and Python.

### PC2 — Record model

**Laws:** PC-STRAT-7 · 9 · 4–6 · 10 · PC-QTY-1…6 · PC-LOCK-13 · §4.4 classifier  
**Depends:** Hotel W0-4 confirm  
**Out:** layout, lock behaviour, dialog chrome, quote path

1. `listedStructure` becomes a **seed**. Parametric chrome is a view over legs; round-trip required. Delete the second writer.  
2. Leg `quantity` = actual contracts. POS = GCD. Remove stored `contracts` multiplier.  
3. **Units in this packet:** BASIS / D\* / D_nat over **normalized ratio**. Curve dollars `D × 100 × POS`. Formatter never × POS in the BASIS cell.  
4. POS stepper writes `ratio × POS` on every leg; lock stands.  
5. Classifier: twelve tokens, **side pattern required**, no aliases. `template` stops being stored. CUSTOM arrived-at only.  
6. Idempotent read migration of old books: `contracts` × ratio → actual counts, then classify.

**ATs:** AT-PC-26 (POS-scale half) · 32 (picker rebuilds legs — seed path) · 35 · 36 · 39 · 40 · 41 · 43 · 53 · 57 (no OMS write)  
**Gate PC2-G.** Coach’s MacBook: 3-lot fly `+3/−6/+3`, BASIS same as 1-lot; scale to 4, lock stands; pull a wing → BWB same tick; 3/7/3 → CUSTOM POS 1; all-long 1-2-1 → CUSTOM not Butterfly.

**Split rule:** if the change list exceeds the declared files at the gate, classifier may become **PC2b**. Nothing downstream classifies before that gate.

### PC3 — Write path

**Laws:** PC-REC-3 · 4 · 6 · PC-SYM-8 · 9  
**Merge lives in a leaf** (`packageQuoteFinish.ts` or successor) — not `analyzerBook.ts` if `optionBind.ts` value-imports it.

1. Structure signal exactly PC-REC-6. POS scale **must not** fire it.  
2. Quotes: payload merged onto `cur`. Guard is **structure identity**, not resolve identity. Session fields on `cur` always win.  
3. Patch in place. Same-array reference on no-op (persist loop).  
4. Interest: every **shown** position, on- or off-symbol. Hidden: no interest. Overflow: **BUDGET LIMIT**, definition intact. Priority: selected symbol, then recency.

**ATs:** AT-PC-03 · 30 · 31 · 34 · 52  
**Gate PC3-G.**

### PC4 — Undo

**Laws:** PC-UNDO-1…7  
**Out:** persist history · Trade Log reversal

Bounded ring, default 50. On-stack / off-stack **literally** Spec §4.2. Cmd/Ctrl-Z. Undo-Submit reopens Create on that draft.

**ATs:** AT-PC-37 · 45 · 50  
**Gate PC4-G.** Fifty undos; a quote tick is never a step; Log cannot be undone.

### PC5 — Bind split

**Laws:** PC-REC-2 · 7 · 8 · 9 · PC-STRAT-10 · 13 · §5.1 removals  
**Rules of Hooks:** always declare `useState<PositionInput>`; Edit **must not read or write** it.

1. Create: off-book draft; no signal, no interest until Submit; Cancel destroys. Opens on Butterfly, unlocked, no seeded basis.  
2. Edit: live bind. Opening writes **zero** fields. Close / Esc only.  
3. Control set fixed for the sitting.  
4. Remove Preview block, Analyze, entry-time field, presets manager, spot override, OPF retry (relocate per Spec §5.1).

**ATs:** AT-PC-01 · 04 · 21 · 22 · 23 · 42 · 56  
**Gate PC5-G.** CI asserts opening Edit writes nothing — not a screenshot.

### PC6 — Lock, CHECK PRICE, one price engine

**Laws:** PC-LOCK-1…14 · PC-STALE-1…9 · PC-TOS-1…5 · PC-LEG

1. Kill `net_debit_override` as a source (eight dialog sites). Derived ToS only.  
2. Kill `packageEconomics` as package SoR. Both surfaces: one OPF path, one formatter, DEBIT iff D>0.  
3. Lock gesture on BASIS only. Blur with no change writes nothing. Structure steppers never lock.  
4. CHECK PRICE on `CardLockState`. Chip + Keep/Unlock on BASIS, both surfaces. Canvas **live mid until Keep**. Further edits legal. Distinct from CHECK LEGS. Does not block Log.  
5. Trigger: strike, expiry, right, side, ratio, Buy/Sell invert, accepted repair. **Not** POS scale.  
6. Every Analyzer write: `freeze_iv = false`, `freeze_marks = false`.  
7. Script always `@LMT`; pending CHECK PRICE → live mid in the script (AT-PC-51).

**ATs:** AT-PC-05–08 · 24–29 · 44 · 48 · 51 · 54 · 55  
**Gate PC6-G.**

### PC7 — Chain-bound controls and recovery

**Laws:** PC-CHAIN-1…8 · PC-EXP-1…8 · PC-FOUND-1…7  
**Consumes PC1.**

Constraint at the control. Right-specific strike ladder; edge = no-op. Empty vs singular. Kill free date input (`PositionBuilder.tsx` ~1914). Horizon + TM clock. Seed-time defaults only. Recovery: NOT TRADED, propose never apply, structure-level roll prominent, `<select>` must not write `options[0]` on render. Residual legs editable.

**ATs:** AT-PC-09–12 · 17 · 18 · 38  
**Gate PC7-G.** Fixture with a missing contract writes nothing on render.

### PC8 — Card, dialog, symbol groups

**Laws:** PC-VOCAB · PC-SYM-1–7 · 10 · PC-HIG · PC-STRAT-11 · 12 · §5  
**Entry:** Echo density ruling on disk (`agents/p-options-lab-position-control/evidence/echo-density-ruling.md`).

One shared leg-row component. Row grammar: BASIS/POS/lock on row 1; MARK on legs. Non-bold; STRATEGY exempt. Hit rectangles do not overlap at **both** profiles. Delete confirmed, one position. Symbol groups: select ≠ expand; highlight not checkbox; selecting a header sets suite symbol and **clears cross-group focus**. Wire `focusedId` or delete it — no ghost. `+ Add Leg` on every strategy.

**ATs:** AT-PC-15 · 19 · 20 · 33 · 49 · 58  
**Gate PC8-G.** Echo + Tango sit with Delta. Tango: *would a bleeding trader feel respected and taught?*

### PC9 — Autofit and promotion

**Laws:** PC-FIT · PC-LIFE · PC-TM · PC-PERSIST  
**Same-day parent amends:** Autofit AF-L5 · Trade Log snapshot column.

Autofit subscribes to the structure signal; committed book; fit-if-needed (PC-FIT-3). Mapper **rewritten**: `order_type` from `lockSource`; no fill from stored `entry_price`; no `contracts` as multiplier. Snapshot per PC-LIFE-7. Entry time at Log, TM clock. Residual does not block Log. TM gates AND-ed. Persist: session storage, not a SoR; `rehearsal`/`visible` survive.

**ATs:** AT-PC-07 · 13 · 14 · 16 · 46 · 47 · 54  
**Gate PC9-G.** Promoted butterfly reads back as butterfly with ratio and POS; Log impossible under TM.

### PCZ — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **PCZ-0** | **Lima** | Spec §9 gap map → closed or named residual. DL program close. Parent amends landed |
| **PCZ-1** | **India** | Diff ⊆ allowlist. No MSC. Spec hash unless Coach versioned |
| **PCZ-G** | **Delta** | Full AT pack evidenced. No false greens. **No deploy** |

---

## 7. Acceptance pack (Delta-checkable)

IDs are **Spec §8**. This plan does not drop a Spec row. Oracle = Spec assertion text.

**Evidence classes:** `tsx` = `npx tsx` bare Node · `pw` = Playwright · `comp` = component (tsx or pw as the seed names) · `grep` = static · `a11y` = hit-rect + keyboard · `live` = Coach MacBook walk.

| ID | Phase | Class | Owner |
|----|-------|-------|-------|
| AT-PC-01 | PC5 | comp | Kilo · Charlie |
| AT-PC-02 | PC0 | tsx | Kilo |
| AT-PC-03 | PC3 | tsx | Kilo |
| AT-PC-04 | PC5 | comp | Kilo |
| AT-PC-05 | PC6 | comp | Kilo |
| AT-PC-06 | PC6 | tsx | Kilo |
| AT-PC-07 | PC6 / PC9 | tsx | Kilo |
| AT-PC-08 | PC6 | comp | Kilo |
| AT-PC-09 | PC7 | comp | Kilo |
| AT-PC-10 | PC7 | comp | Kilo |
| AT-PC-11 | PC7 | comp | Kilo |
| AT-PC-12 | PC7 | tsx | Kilo |
| AT-PC-13 | PC9 | comp | Kilo |
| AT-PC-14 | PC9 | tsx | Kilo |
| AT-PC-15 | PC8 | comp | Kilo |
| AT-PC-16 | PC9 | tsx | Kilo |
| AT-PC-17 | PC7 | comp + fixture | Kilo |
| AT-PC-18 | PC7 | comp | Kilo |
| AT-PC-19 | PC8 | a11y | Echo · Kilo |
| AT-PC-20 | PC8 | grep | Tango · India |
| AT-PC-21 | PC5 | tsx | Kilo |
| AT-PC-22 | PC5 | comp | Kilo |
| AT-PC-23 | PC5 | comp | Kilo |
| AT-PC-24 | PC6 | comp | Kilo |
| AT-PC-25 | PC6 | comp | Kilo |
| AT-PC-26 | PC2 / PC6 | tsx | Kilo |
| AT-PC-27 | PC6 | tsx | Kilo |
| AT-PC-28 | PC6 | tsx | Kilo |
| AT-PC-29 | PC6 | tsx | Hotel · Kilo |
| AT-PC-30 | PC3 | tsx | Kilo |
| AT-PC-31 | PC3 | tsx | Kilo |
| AT-PC-32 | PC2 | tsx | Kilo |
| AT-PC-33 | PC8 | comp | Kilo |
| AT-PC-34 | PC3 | comp | Kilo |
| AT-PC-35 | PC2 | tsx | Kilo |
| AT-PC-36 | PC2 | tsx | Kilo |
| AT-PC-37 | PC4 | tsx | Kilo |
| AT-PC-38 | PC7 | tsx | Kilo |
| AT-PC-39 | PC2 | tsx | Hotel · Kilo |
| AT-PC-40 | PC2 | tsx | Kilo |
| AT-PC-41 | PC2 | tsx | Hotel · Kilo |
| AT-PC-42 | PC5 | comp | Kilo |
| AT-PC-43 | PC2 | tsx | Kilo |
| AT-PC-44 | PC6 | comp | Kilo |
| AT-PC-45 | PC4 | tsx | Kilo |
| AT-PC-46 | PC9 | tsx | Kilo |
| AT-PC-47 | PC0 / PC9 | tsx | Kilo |
| AT-PC-48 | PC6 | tsx | Kilo |
| AT-PC-49 | PC8 | comp | Echo · Kilo |
| AT-PC-50 | PC4 | comp | Kilo |
| AT-PC-51 | PC6 | tsx | Kilo |
| AT-PC-52 | PC3 | comp | Kilo |
| AT-PC-53 | PC2 | tsx | Hotel · Kilo |
| AT-PC-54 | PC6 / PC9 | tsx | Kilo |
| AT-PC-55 | PC6 | tsx | Kilo |
| AT-PC-56 | PC5 | comp | Kilo |
| AT-PC-57 | PC2 | tsx | India · Kilo |
| AT-PC-58 | PC8 | comp | Kilo |
| AT-PC-59 | PC1 | tsx | Kilo |

Kilo owns the matrix at **PCZ**. A green packet gate may still leave later ATs unrun; PCZ-G requires the full table evidenced or explicitly **out of that packet** with a pointer.

---

## 8. File allowlist (indicative until W0-2)

Seeds **name exact files**. Drift outside the seed list is a FAIL.

### 8.1 Expected create / heavy edit

| Path | Phase |
|------|--------|
| `web/lib/options-lab/tickSize.ts` (+ test) | PC1 |
| `web/lib/options-lab/dteHorizon.ts` (or single existing importer) | PC1 |
| `web/lib/options-lab/structureClassifier.ts` (+ test) | PC2 |
| `web/lib/options-lab/positionQty.ts` (GCD / POS / ratio) | PC2 |
| `web/lib/options-lab/structureSignal.ts` | PC3 |
| `web/lib/options-lab/packageQuoteFinish.ts` (or successor merge leaf) | PC3 |
| `web/lib/options-lab/undoStack.ts` | PC4 |
| `web/lib/options-lab/positionRow.tsx` (shared leg row) | PC8 |
| `migrations/NNN_analyzer_promotion_snapshot.sql` | PC9 |
| `agents/p-options-lab-position-control/**` | W0 |
| `agents/go/PC-W0.md` | W0 |
| Parent Spec amend files (Autofit · TM · PB · Trade Log) | W0-1 / PC9 |

### 8.2 Expected edit (existing)

`OpfRiskAnalyzer.tsx` · `PositionBuilder.tsx` · `AnalyzerPositionsList.tsx` · `HostPnLChart.tsx` · `analyzerBook.ts` · `usePackageQuotes.ts` · `cardDisplayState.ts` · `listedStrikeDrag.ts` · `positionTypes.ts` · `builderCreateDefault.ts` · `tosGenerator.ts` · `analyzerToTradeLog.ts` (or current mapper path) · `positionLabels.ts` · `tokens.css` (Echo additive)

### 8.3 Forbidden without a new Coach stamp

`strategy-lab-proto/msc-risk-graph-ui/**` · any MSC import · Heatmap template compute · Sessions · Market Bus protocol · Mini Two / Dude Two deploy scripts as this program’s work · a second Zustand/global book.

---

## 9. Seating

| ID | Rule |
|----|------|
| **S1** | **Charlie** — host, card, dialog, controls |
| **S2** | **Hotel** — classifier taxonomy, signed D\*, BASIS units, ToS/lock semantics |
| **S3** | **Alpha** — quote merge, interest, generation apply (if touched) |
| **S4** | **Echo** — density ruling, layout, STRATEGY perceptibility, both profiles |
| **S5** | **Kilo** — AT matrix, fixtures, Playwright |
| **S6** | **Tango** — AT-PC-20, CHECK PRICE copy, Delete confirm, no profit theater |
| **S7** | **India** — dual-truth, MSC, allowlist, parent Spec integrity |
| **S8** | **Lima** — DL, hashes, cross-stamps, as-built |
| **S9** | **Mike** — no client Massive; auth on pricing routes unchanged |
| **S10** | **Foxtrot** — tick config seam only; **no deploy** |
| **S11** | **Juliet** — board, seeds, no NX creep, no Mini Two |
| **S12** | **Delta** — every phase gate ternary |
| **S13** | Seeds on disk before the phase gate |

---

## 10. Definition of done — every packet

- [ ] Change declared — exact files — approved before implementation  
- [ ] Only approved files touched  
- [ ] Characterization / new tests green **on Coach’s MacBook**  
- [ ] Live data-flow verified where the packet changes quotes or promotion  
- [ ] Spec / parent Spec versioned if the packet changed a contract  
- [ ] DL entry same day  
- [ ] No secrets, ports, invented ticks, MSC  
- [ ] Public copy: no profit claims  
- [ ] Evidence attached for Delta  

---

## 11. Risk register

| Risk | Phase | Mitigation |
|------|-------|------------|
| PC2 too large | PC2 | Split classifier to PC2b at the gate; files declared first |
| Old session books break qty model | PC2 | Idempotent read migration; before/after on a real book from this Mac |
| Killing override breaks ToS | PC6 | Stays as derived serialisation; pin script output at PC0 |
| Density vs hit floor | PC8 | Echo ruling; focus-revealed overlay if padding cannot honour PC-HIG-1 |
| Trade Log schema | PC9 | Additive nullable snapshot column; ordered `migrations/` |
| Quote/import cycle | PC3 | Merge leaf, not `analyzerBook.ts` |
| Three failed attempts | any | Stop, return to purpose, re-derive (doctrine) |
| Silent Mini Two “ship” | any | **FAIL.** Spec machine law |

---

## 12. What this plan does not do

Broker OMS · order placement · per-leg Greeks · multi-card aggregate curves · Surface 3D · MSC · server multi-device book · historic-chain replay of closed trades · a second position store · a global store · a selectable “Custom” mode · undo of a Trade Log promotion · **any deploy**.

---

## 13. Juliet recommendations (Coach disposes at W0; **no silence defaults for product law**)

Product law is already stamped in the Spec. These are **process** ticks only:

| Rec | If Coach silent at GO |
|-----|------------------------|
| **JR1** | Board path `agents/p-options-lab-position-control/` · token `PC-W0.md` |
| **JR2** | PC0 is the **first code packet after GO**, not a pre-GO exception |
| **JR3** | Tests: `npx tsx` + `node:assert/strict` under bare Node; Playwright for component ATs the seed marks `pw`/`comp` |
| **JR4** | Do not split `PositionBuilder.tsx` in PC5 |
| **JR5** | Parent Spec amends (AF-L5, TM DTE, PB17b, Trade Log snapshot) are Lima W0-1 **stubs** if the parent file cannot land the same day; the **code** that depends on them waits for the amend (PC9 for AF-L5 / snapshot) |

---

## 14. Open process questions (not product ODs)

None of these reopen Spec law.

| ID | Question | Options |
|----|----------|---------|
| **OD-PC-P1** | PC0 before vs after the GO fire | **(a)** After W0-0, same day *(JR2)* · **(b)** Coach pulls PC0 as a defect fix under existing PC-TM-2 before the rest of W0 paperwork |
| **OD-PC-P2** | Classifier confirm | **(a)** Hotel W0-4 same day as GO · **(b)** Hotel confirm is PC2 entry, blocks PC2 not W0-G |

---

*Position Control Full Agent Bench Plan v1.0. No implementation before Coach’s GO.*
