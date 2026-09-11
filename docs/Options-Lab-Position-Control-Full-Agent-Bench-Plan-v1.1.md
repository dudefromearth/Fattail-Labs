# Options Lab Position Control — Full Agent Bench Plan v1.1

**Date:** 2026-09-11  
**Plan revision:** **v1.1** (Disposition fold + Spec v1.1 adopt in place — do not bump to v1.2)  
**Canonical filename:** `docs/Options-Lab-Position-Control-Full-Agent-Bench-Plan-v1.1.md`  
**v1.0 path** is a stub pointer — do not hash it.  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/PC-W0.md`](../agents/go/PC-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-options-lab-position-control/`](../agents/p-options-lab-position-control/)  
**Disposition:** [`Claude outputs/PC-Bench-Plan-v1_0-Review-Disposition-v1_0.md`](../Claude%20outputs/PC-Bench-Plan-v1_0-Review-Disposition-v1_0.md)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

### v1.1 changelog

| # | Change |
|---|---------|
| 1 | Live contract is Spec **v1.2** — identified by version and the content check (header reads `Spec v1.2`; `+1/−2/+1` present; PC-VOCAB-7 · PC-HIG-8 · PC-HIG-9 · AT-PC-70 all present), not by checksum. Prior Specs v1.0 and v1.1 remain on disk as baselines; India does **not** flag them as W0-3 strays |
| 2 | Live Spec path → `Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md` |
| 3 | L16 cites `PC-LIFE-1 · 4` and **AT-PC-57** (there is no PC-LIFE-57) |
| 4 | §1.1 persist row: **local-durable**; defect is dropped `rehearsal` only — no packet “fixes” to session-only |
| 5 | **PC4 after PC1, before PC2.** ASCII tree aligned to the phase table (PC5 depends on PC4). AT-PC-50 split PC4 / PC5. Plan to Spec §6 constraint 1 **as reworded:** *Undo lands before any packet expands what a single gesture can destroy.* (Hashed Spec §6.1 still has the “live writer” sentence; this plan does not edit the Spec.) |
| 6 | **PC9 → PC9a** (autofit + AF-L5, depends PC3) **and PC9b** (mapper + snapshot + migration + TM, depends PC6). Neither depends on PC8. AT-PC-47 at **PC0 only**. **AT-PC-60** at PC0 |
| 7 | PC1 names the tick-band **fixture path** PC1 transcribes — not “from published specs” in the abstract |
| 8 | PC2-G: lock **field** only, not CHECK PRICE chip. Tango at **PC5-G and PC6-G**. PC6-G numeral assertion (CHECK PRICE marked not-current). Allowlist: seeds subset §8.2; Delta fails extra files |
| 9 | PC2 migration: wing-equality with **listed-grid tolerance**, not raw float equality |
| 10 | **AT-PC-32 split three ways:** PC2 seed-rebuild · PC5 picker wire · PC6 CHECK PRICE. Spec §8 text unchanged. W0-3: India confirms no review/process artifact is filed under `Specs/` |
| 11 | **Adopt Spec v1.1 in place** (do not bump this plan to v1.2). Identify the Spec by version, not checksum — Coach-facing W0-0 is the content check; a hash lives only in `PC-W0.md` for Delta. PC8 ToS-card tasks (ten columns · seven editable fields · Spread-on-card · per-leg Calendar/Diagonal/CUSTOM · padlock pair · grow-on-hover stepper · QTY quick-pick). Echo remaining density work is a **PC8 task, not an entry gate** (PC-HIG-8 is stamped). AT-PC-61…70. AT-PC-32 four-way (PC2 seed / PC5 dialog picker / PC8 card picker / PC6 CHECK PRICE). AT-PC-64 split PC8 card-rebuild / PC6 CHECK PRICE. AT-PC-69 at PC8 (depends PC2 POS). L13 restated both surfaces. **L22** card columns + editable seven. Keep table: seven-field writer. Risk: grown steppers overlapping (AT-PC-68). W0-3: Specs/ holds only versioned feature contracts — no review, disposition or plan artifact. Four accepts and six disregards stand |
| 12 | **Adopt Spec v1.2 in place** (do not bump this plan). Classifier §4.4 restated as exact signed patterns (long form · short form). No classification outcome changes. v1.0 and v1.1 stay on disk as prior baselines. GO 2026-09-11: OD-PC-P1 **(b)** PC0 first; OD-PC-P2 **(a)** Hotel same day; JR1–JR6 accept |

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **Position Control Spec v1.2** | [`Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md`](../Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md) | Live contract. **BUILD AUTHORITY** as of W0-0 GO 2026-09-11. Identified by version, not checksum. Prior v1.0 and v1.1 stay on disk unchanged — India does not treat them as W0-3 strays |
| Human Interface Spec v1.0 | [`Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`](../Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md) | Hit floor · destructive pattern · tokens |
| North star | [`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md`](../Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md) | Process copy; no profit theater |
| OPF Spec | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Package quote · freeze defaults · DL-309 parent |
| Position Builder Spec v0.3 | parent | Supersessions in Spec §7; **do not re-litigate PB17 path** |
| Autofit Spec v0.1 | parent | **AF-L5** must be amended in the same pass as **PC9a** |
| TM One-Source | parent | DTE reads TM clock (PC-EXP-5) |
| Trade Log Spec v1.1 | parent | Structure snapshot column (PC-LIFE-7) |

**Baseline commit (as-built gap map):** `34b84a7` (re-confirmed from `d20b4f9` in Spec §9).  
**Evidence basis:** Spec names `Analyzer-Position-Handling-Audit-v1.0` @ `d20b4f9`.

**MACHINE — all work against this Spec and this plan runs on COACH'S MACBOOK (dev).** No staging. No Mini Two. No Dude Two. Promotion targets are named by Coach **after** he has seen it run. Nothing in this plan deploys.

**BUILD AUTHORITY is Spec v1.2 as of W0-0 GO 2026-09-11.** Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

Coach Content Law (doctrine §11): nothing of Coach’s is removed from the Spec. Objections sit **beside** the text.

**Every product decision in Spec v1.2 is already stamped.** This plan does not introduce engineering defaults. One item is **delegated with an owner**, not undecided. The density conflict is **resolved, not delegated** (PC-HIG-8): the stepper grows on hover and focus past the row bounds; grown state meets `--hit-min`; resting need not.

| Item | Owner | When |
|------|-------|------|
| **Tick band table** (PC-CHAIN-7) | Authored at **PC1** by transcribing [`agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md`](../agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md) (Cboe published contract specs → fixture → `tickSize.ts`). Config-driven; **fails loud** on unknown product | PC1 |

Echo's remaining scope (Spec §5.2) is a **PC8 task**, not a PC8 entry gate: resting and grown dimensions, the growth transition, and whether non-interactive Analyzer chrome takes the compact profile. Echo still sits at **PC8-G**.

Hotel **confirms the classifier table** (Spec §4.4) before PC2 classifier code — including side-pattern predicates, the wing-equality unit (strike distance in points / listed-grid steps), and all-long 1-2-1 → CUSTOM. That is trading taxonomy, not a product OD.

**Disregarded (already on disk in the hashed Spec — do not re-litigate):** PC-SYM-9 · PC-STRAT-13 · PC-TOS-5 · AT-PC-52…59 · wing-equality unit in §4.4 · two-serialisations sentence · Buy/Sell writing every leg (PC-LOCK-14) · basis-at-Log (PC-LIFE-7).

---

## 0. Mission (one screen)

Give the member **absolute control over a position** — one `AnalyzerPosition` per id, three views, three litmus tests.

```text
ONE AnalyzerPosition per id
  ├── Card     — seven-field writer (PC-VOCAB-8)
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
| Analyzer host | `web/components/options-lab/OpfRiskAnalyzer.tsx` | Book owner. **Rewrite writers**, do not replace the host |
| Cards | `web/components/options-lab/AnalyzerPositionsList.tsx` | Already a live writer (`shiftCardStrikes`). Becomes a **seven-field writer** (PC-VOCAB-8): Spread · Side · QTY · Expiration · Strike · Type · Price, each conditional on strategy. Dialog exclusive remaining: add / remove leg |
| Dialog | `web/components/options-lab/PositionBuilder.tsx` | One panel, two bind modes (PC-REC-8). **Do not split the file in PC5** (Rules of Hooks) |
| Canvas | `web/components/options-lab/risk-graph/HostPnLChart.tsx` | Read-only of structure. Overlay preview stays; commit is the write |
| Book types | `web/lib/options-lab/analyzerBook.ts` | `AnalyzerPosition` remains the record. Schema grows; identity stays |
| Quotes | `web/lib/options-lab/usePackageQuotes.ts` | Atomic resolve stays. Merge contract changes in PC3 |
| Listed strikes | `web/lib/options-lab/listedStrikes.ts` · `listedStrikeDrag.ts` | DL-309. Overlay geometry stays |
| Display states | `web/lib/options-lab/cardDisplayState.ts` | NOT TRADED retained. CHECK PRICE is **lock** state, not a new display doctrine |
| Tests | `npx tsx` + `node:assert/strict` · Playwright `web/e2e/` | **No Vitest.** Bare Node for units |
| Persist key | `ft_options_lab_analyzer_positions_v2` | **Local-durable.** Dual-writes `sessionStorage` and `localStorage`; **reads `localStorage` first** (`analyzerBook.ts` ~398). Survives a browser restart on this machine. Not a SoR. **The defect is only that the save path drops `rehearsal`.** Do not “fix” this to session-only |

### 1.2 Critical / blocking defects (Spec §9)

| Defect | Law | First packet that closes it |
|--------|-----|-----------------------------|
| Edit drops `rehearsal` (TM position becomes Trade-Log-eligible) | PC-REC-3 · PC-TM-2 · PC-PERSIST-4 | **PC0** |
| Edit drops `visible` (hidden cards reappear) | PC-REC-3 | **PC0** |
| Quote merge whole-row replace | PC-REC-4 | **PC3** |
| `didSeed` checkout; opening Edit snaps/reprices | PC-REC-2 · Litmus 2 | **PC5** |
| No Undo | PC-UNDO-1 | **PC4** (before PC2 expands what a gesture can destroy) |
| Two structure writers; stored `template`; no CUSTOM | PC-STRAT-7/9 · §4.4 | **PC2** |
| Qty inverted (POS on row 1, ratio on legs) | PC-QTY-1 | **PC2** (with PC-LOCK-13, same packet) |
| Two lock models + two price engines | PC-LOCK-5 · Litmus 1 | **PC6** |
| CHECK PRICE absent | §4.8 | **PC6** |
| Promotion mapper always `LMT` / stored `entry_price` | PC-LIFE-10 | **PC9b** |
| Strike snap-at-write, not at control | PC-CHAIN-2 | **PC7** |
| No tick source | PC-CHAIN-7 | **PC1** (source) · **PC7** (wire) |

### 1.3 Neighbor boards (India artifact-quote required)

This program **does not assert** another board’s PASS/FAIL.

| Neighbor | Isolation |
|----------|-----------|
| `p-options-lab-position-builder` | Prior PB program. **Do not reopen** OD-PB1–17 as a second SoR. Spec §7 supersedes AZ-CARD-1, OD-PB6, PB22, PB-VIEW-1 conflict. Shared files named per packet |
| `p-options-lab-surface-autofit` | **AF-L5** amend is **PC9a**, same-day DL. Do not silently expand Autofit |
| `p-options-lab-tm-os` | DTE clock is PC-EXP-5; no TM chrome rewrite |
| `p-trade-log` | Snapshot column + mapper rewrite in **PC9b**. Trade Log remains FIFO-from-fills SoR |
| `p-options-pricing-foundation` | OPF L0–L4 **frozen as foundation**. This board consumes PackageQuote; it does not relitigate packs |
| Heatmap / Runner / Market Bus / Quant / LIM / Sessions | **DL-539 freeze stands** except the Options Lab Analyzer trees this program names. Three-OK record is in §2 |

Shared files that other boards also touch: `web/styles/tokens.css` (Echo additive only at PC8), `web/lib/options-lab/analyzerBook.ts` (this program owns schema growth).

---

## 2. DL-539 — three-OK record (copy onto the GO token)

DL-539 is a **standing no-drift rule**. It names Options Lab. An agent who opens a frozen tree needs **three successive Coach OKs** on the token.

**This program is Coach directing Analyzer work**, not an agent opening the tree on its own. Record on `PC-W0.md`:

1. Coach commissioned an independent audit of position handling across card, dialog and canvas.  
2. Coach declared intent across successive statements and asked for it in a Spec.  
3. Coach directed the Spec through review cycles and stamped every open decision.  
4. Coach: development plan (this document).  
5. Coach specified the position card against a ThinkorSwim reference; those decisions landed as Spec v1.1.  
6. Coach restated the classifier as exact signed patterns in Spec v1.2, the live contract. v1.0 and v1.1 remain on disk as prior baselines.

The freeze is **not lifted** for other trees. Packet allowlists stay mandatory.

---

## 3. Product locks (law at W0-0)

These are **Coach’s Spec**. They become L-locks when the GO token is ticked. Until then, seeds call them **provisional**.

W0-0’s first act: confirm the live Spec is **v1.2**. `head -1` of `Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_2.md` reads `Spec v1.2`, `grep -c '+1/−2/+1'` is non-zero, and **PC-VOCAB-7 · PC-HIG-8 · PC-HIG-9 · AT-PC-70** are all present. A zero, or a header that is not v1.2, means the wrong file: **BLOCKED**. India greps every L1–L22 citation and every `AT-PC-*` against that file. Delta confirms the sha1 recorded in `agents/go/PC-W0.md` against disk — Coach does not compute a hash.

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
| **L13** | Per-leg MARK/IV always live **wherever displayed** (dialog; the card shows no per-leg price — PC-VOCAB-6). No per-leg locks | PC-LEG · PC-LOCK-10 · PC-VOCAB-6 |
| **L14** | Controls offer only what the chain holds. Constraint at the **control**. DL-309 | PC-CHAIN-1 · 2 |
| **L15** | Log is a one-way door. TM: `tmActive` AND `!rehearsal`. Undo never un-Logs | PC-UNDO-6 · PC-TM-1 · 2 |
| **L16** | Analyzer position is pre-lifecycle. No order state written onto it | PC-LIFE-1 · PC-LIFE-4 · **AT-PC-57** |
| **L17** | List multi-symbol; canvas single-symbol. Header select ≠ expand | PC-SYM-1 · 4 |
| **L18** | Every shown position is quoted. Overflow = **BUDGET LIMIT**, never silent | PC-SYM-8 · 9 |
| **L19** | Autofit: structure signal; committed book; fit only when geometry escapes | PC-FIT |
| **L20** | MSC is not the standard. No OMS. No second book. No global store | §3 · §10 |
| **L21** | Dev machine only until Coach names a promotion host | Spec header |
| **L22** | Card columns are exactly the ten of PC-VOCAB-7. Seven fields editable on the card, each conditional on strategy (PC-VOCAB-8). No Yield, Vol Adj, BP Effect, or per-leg price on the card | PC-VOCAB-6 · 7 · 8 |

---

## 4. Sequencing (dependency facts — Spec §6)

Any plan that violates one produces a visibly broken intermediate:

1. **Undo lands before any packet expands what a single gesture can destroy.** (Program reading of Spec §6 constraint 1. Hashed Spec still says “before the card becomes a live writer”; the card **already is** a writer — `shiftCardStrikes`. This plan does not edit the Spec.)  
2. **One-package units (PC-LOCK-13) ship in the same packet as actual-contracts display (PC-QTY-1).**  
3. **Legs-as-record (PC-STRAT-9) precedes the classifier (PC-STRAT-7).**  
4. **The structure signal (PC-REC-6) precedes rewiring quotes and autofit.**

Named prerequisites (absent today): tick source · single-sourced DTE horizon · classifier · promotion mapper rewrite.

```text
W0
 ├── PC0  preserve rehearsal/visible (first code)
 └── PC1  tick source + DTE horizon (no member-visible)
      └── PC4  Undo
            └── PC2  legs / POS / units / classifier     [Hotel taxonomy]
                  └── PC3  signal + quote merge
                        ├── PC5  bind split
                        │     └── PC6  lock + CHECK PRICE
                        │           ├── PC7  chain-bound + recovery
                        │           │     └── PC8  ToS card / vocab / groups
                        │           └── PC9b  promotion mapper + snapshot
                        └── PC9a  autofit + AF-L5
 └── PCZ  as-built · DL close
```

PC5 depends on **PC3 and PC4** (table is law; tree matches). Do **not** freeze member gestures through PC2 — PC2-G keeps the live walkthrough.

**PC0 is not a pre-GO exception.** Spec: no implementation before GO. Juliet recommendation: first code packet **after** W0-0, same day if Coach wants the TM defect closed immediately.

---

## 5. Phase DAG (gates)

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **W0** | Spec GO · hash · DL · board · three-OK · seeds skeleton | — | Spec v1.2 **BUILD AUTHORITY** |
| **PC0** | Preserve `rehearsal` / `visible` · characterization net · restart survival | W0 | AT-PC-02 · 47 · **60** |
| **PC1** | Tick source · single DTE horizon | W0 | AT-PC-59 · horizon grep |
| **PC4** | Undo stack | **PC1** | AT-PC-37 · 45 · 50 (stack half) |
| **PC2** | Legs-as-record · POS/GCD · units · classifier | **PC4** + Hotel confirm | AT-PC-35 · 36 · 39 · 40 · 41 · 43 · 53 · 26 (field half) · **32 (seed-rebuild half)** |
| **PC3** | Structure signal · quote payload merge | PC2 | AT-PC-03 · 30 · 31 · 34 · 52 |
| **PC5** | Create draft / Edit live bind · verbs | **PC3 + PC4** | AT-PC-01 · 04 · 21–23 · 42 · 56 · 50 (Create-reopen half) · **32 (dialog picker)** |
| **PC6** | One lock · one price engine · CHECK PRICE · ToS | PC5 | AT-PC-05–08 · 24–29 · 44 · 48 · 51 · 54 · 55 · **PC6-G-numeral** · **32 (CHECK PRICE)** · **64 (CHECK PRICE half)** |
| **PC7** | Chain-bound controls · recovery · tick wire | PC1 + PC6 | AT-PC-09–12 · 17 · 18 · 38 |
| **PC8** | ToS card · shared vocab · layout · symbol groups · HIG | **PC7** | AT-PC-15 · 19 · 20 · 33 · 49 · 58 · **32 (card picker)** · **61–63 · 64 (card-rebuild) · 65–70** |
| **PC9a** | Autofit on structure signal · AF-L5 amend | **PC3** | AT-PC-16 |
| **PC9b** | Mapper rewrite · promotion snapshot · migration · TM gates | **PC6** | AT-PC-07 · 13 · 14 · 46 · 54 |
| **PCZ** | As-built gap map closed · DL · no false claims | all | Program PASS |

**Parallelism:** PC0 ∥ PC1 after W0. PC9a may run as soon as PC3-G PASS (does not wait on PC8). PC9b may run as soon as PC6-G PASS. PC1 must **land** before PC7 consumes it. Classifier code in PC2 waits on Hotel confirm (can be a same-day seed).

---

## 6. Phase detail and seeds

Juliet materializes seeds under `agents/p-options-lab-position-control/seeds/`. Names below are normative. **Each seed names an exact file list that is a subset of §8.** Delta **FAIL**s extra files.

### W0 — Board GO

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | **Coach** | Stamp `agents/go/PC-W0.md`. First act: Spec **v1.2** content check (`head -1` reads `Spec v1.2`; `+1/−2/+1` present; PC-VOCAB-7 · PC-HIG-8 · PC-HIG-9 · AT-PC-70 all present). **BUILD AUTHORITY**. L1–L22 LOCKED. Three-OK recorded. OD-PC-P1 **(b)** · OD-PC-P2 **(a)** · JR1–JR6 accept |
| **W0-1** | **Lima** | DL entry: Spec accept · §7 supersessions · cross-stamps (AF-L5, TM DTE, PB17b symbol axis, Trade Log snapshot) · DL-539 three-OK verbatim |
| **W0-2** | **Juliet** | CHARTER · ORCHESTRATOR · seeds README · gate-reports/ · per-packet allowlists (subset of §8) |
| **W0-3** | **India** | Parent Spec paths intact · no MSC · live Spec is v1.2 (same content check as W0-0) · grep every L-lock and `AT-PC-*` · freeze isolation · **confirm `Specs/` holds only versioned feature contracts for this program, and that no review, disposition or plan artifact is filed there** (INSTRUCTIONS.md §10). Flag; Lima or Coach removes. Stray on disk: `Specs/PC-Bench-Plan-v1_0-Review-Disposition-v1_0.md` (canonical copy is `Claude outputs/`). **Spec v1.0 and v1.1 remain on disk as prior baselines — do not flag them as strays.** Live contract is v1.2 |
| **W0-4** | **Hotel** | Classifier table (Spec §4.4) **confirm** before PC2 writes code: exact signed patterns (long form · short form), wing-equality unit (points / listed-grid steps), all-long 1-2-1 → CUSTOM, BWB shares butterfly pattern. Same day as GO (OD-PC-P2 a) — not a gate on starting |
| **W0-G** | **Delta** | Token complete · sha1 in `PC-W0.md` matches disk · DL same day · ternary |

### PC0 — Stabilise (first code)

**Laws:** PC-REC-3 · PC-PERSIST-1 · PC-PERSIST-4 · PC-TM-2  
**Files (subset):** `web/lib/options-lab/analyzerBook.ts` persist path · `web/components/options-lab/OpfRiskAnalyzer.tsx` `handleBuilderSave` edit branch · characterization tests  
**Out:** refactors, layout, lock, quotes, **changing storage from local-durable to session-only**

1. Preserve `rehearsal` and `visible` on edit-save.  
2. Persist path must round-trip both **and** survive a simulated restart (localStorage-first).  
3. Characterization net for **current** quote merge, lock, template seed, strike shift, promotion mapper — expected to be rewritten later, visible in the diff.

**ATs:** AT-PC-02 · AT-PC-47 · **AT-PC-60**  
**Live:** TM position → Edit → Log stays disabled after TM ends. Restart the tab: book still there, rehearsal intact.  
**Gate PC0-G.**

### PC1 — Prerequisites (no member-visible)

**Laws:** PC-CHAIN-7 · PC-EXP-4  
**Out:** wiring into controls (PC7)

1. **Tick source.** Transcribe [`agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md`](../agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md) into `web/lib/options-lab/tickSize.ts`. The fixture is filled **at PC1** from Cboe published contract specifications (product × premium band), not from memory. An empty or invented fixture is **BLOCKED**. Config-driven; **fail loud** on unknown product. No `0.05` placeholder.  
2. **DTE horizon:** one importer, one catalogue key (`OPF_ACTIVE_DTE_HORIZON`, currently 10). Fix drifted `max_dte=14` proofs in the same change.

**ATs:** AT-PC-59  
**Gate PC1-G.** Grep: exactly one horizon declaration reachable from TS and Python. Tick module has no invented default.

### PC4 — Undo

**Laws:** PC-UNDO-1…7  
**Depends:** PC1 (stack can land on today’s whole-array writes; does **not** need PC3)  
**Out:** persist history · Trade Log reversal · the Create-reopen wire (PC5)

Bounded ring, default 50. On-stack / off-stack **literally** Spec §4.2. Cmd/Ctrl-Z. **AT-PC-50 stack half:** undo of a Create-Submit **removes the record**. Reopening Create bound to that draft is **PC5**.

**ATs:** AT-PC-37 · 45 · 50 (stack half)  
**Gate PC4-G.** Fifty undos; a quote tick is never a step; Log cannot be undone. Tango not required here.

### PC2 — Record model

**Laws:** PC-STRAT-7 · 9 · 4–6 · 10 · PC-QTY-1…6 · PC-LOCK-13 · §4.4 classifier  
**Depends:** PC4 + Hotel W0-4 confirm  
**Out:** layout, lock behaviour, **dialog chrome**, quote path. **Do not touch `PositionBuilder.tsx`.**

1. `listedStructure` becomes a **seed**. Parametric chrome is a view over legs; round-trip required. Delete the second writer.  
2. Leg `quantity` = actual contracts. POS = GCD. Remove stored `contracts` multiplier.  
3. **Units in this packet:** BASIS / D\* / D_nat over **normalized ratio**. Curve dollars `D × 100 × POS`. Formatter never × POS in the BASIS cell.  
4. POS stepper writes `ratio × POS` on every leg; **lock field** untouched (CHECK PRICE chip does not exist yet).  
5. Classifier: twelve tokens, **side pattern required**, no aliases. `template` stops being stored. CUSTOM arrived-at only.  
6. Idempotent read migration of old books: `contracts` × ratio → actual counts, then classify. **Wing equality** uses Spec §4.4 (strike distance in points on the listed grid) with a **tolerance**, not raw float equality — a stored 1-2-1 whose wings differ by a floating-point hair must not re-label as BWB.

**ATs:** AT-PC-26 (lock-**field** half) · **32 (seed-rebuild half only)** · 35 · 36 · 39 · 40 · 41 · 43 · 53 · 57  
**Gate PC2-G.** Coach’s MacBook walkthrough (do not freeze gestures): 3-lot fly `+3/−6/+3`, BASIS same as 1-lot; scale to 4, **lock field** untouched (not the chip); pull a wing → BWB same tick; 3/7/3 → CUSTOM POS 1; all-long 1-2-1 → CUSTOM not Butterfly.

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

### PC5 — Bind split

**Laws:** PC-REC-2 · 7 · 8 · 9 · PC-STRAT-8 · 10 · 13 · §5.1 removals  
**Depends:** PC3 + PC4  
**Rules of Hooks:** always declare `useState<PositionInput>`; Edit **must not read or write** it.

1. Create: off-book draft; no signal, no interest until Submit; Cancel destroys. Opens on Butterfly, unlocked, no seeded basis.  
2. Edit: live bind. Opening writes **zero** fields. Close / Esc only.  
3. Control set fixed for the sitting.  
4. Remove Preview block, Analyze, entry-time field, presets manager, spot override, OPF retry (relocate per Spec §5.1).  
5. **AT-PC-50 Create-reopen half:** undo across Create-Submit reopens Create bound to that draft (stack from PC4).  
6. **AT-PC-32 dialog-picker half:** changing the strategy select (`builder-template`) rebuilds the bound record. Seed-rebuild is PC2; **card-picker half is PC8** (PC-VOCAB-9 puts Spread on the card); CHECK PRICE is PC6.

**ATs:** AT-PC-01 · 04 · 21 · 22 · 23 · 42 · 56 · 50 (Create-reopen half) · **32 (dialog picker)**  
**Gate PC5-G.** CI asserts opening Edit writes nothing — not a screenshot. **Tango** reviews Cancel vs Close copy.

### PC6 — Lock, CHECK PRICE, one price engine

**Laws:** PC-LOCK-1…14 · PC-STALE-1…9 · PC-TOS-1…5 · PC-LEG

1. Kill `net_debit_override` as a source (eight dialog sites). Derived ToS only.  
2. Kill `packageEconomics` as package SoR. Both surfaces: one OPF path, one formatter, DEBIT iff D>0.  
3. Lock gesture on BASIS only. Blur with no change writes nothing. Structure steppers never lock.  
4. CHECK PRICE on `CardLockState`. Chip + Keep/Unlock on BASIS, both surfaces. Canvas **live mid until Keep**. Further edits legal. Distinct from CHECK LEGS. Does not block Log.  
5. Trigger: strike, expiry, right, side, ratio, Buy/Sell invert, accepted repair. **Not** POS scale.  
6. Every Analyzer write: `freeze_iv = false`, `freeze_marks = false`.  
7. Script always `@LMT`; pending CHECK PRICE → live mid in the script (AT-PC-51).  
8. **PC6-G-numeral:** the CHECK PRICE numeral renders **visibly not-current** — marked, never styled as a live BASIS. AT-PC-44 covers chip, exits, and canvas, not this. (Plan gate assertion. Spec §8 lists AT-PC-01…70; AT-PC-61…70 are card criteria, not this numeral. Fold into Spec at W0 if Coach wants an AT-PC id.)
9. **AT-PC-64 CHECK PRICE half:** changing Spread on the card (PC8) or in the dialog (PC5) must move the basis to CHECK PRICE. Card-rebuild of legs is PC8; this packet asserts the CHECK PRICE half.

**ATs:** AT-PC-05–08 · 24–29 · 44 · 48 · 51 · 54 · 55 · PC6-G-numeral · **32 (CHECK PRICE half)** · **64 (CHECK PRICE half)**  
**Gate PC6-G.** Lock a fly at a limit, pull a wing: CHECK PRICE on BASIS, number intact and **marked not-current**, canvas on live mid; Keep follows; scale to 3 lots and the lock stands. **Tango** reviews Keep / Unlock copy.

### PC7 — Chain-bound controls and recovery

**Laws:** PC-CHAIN-1…8 · PC-EXP-1…8 · PC-FOUND-1…7  
**Consumes PC1.**

Constraint at the control. Right-specific strike ladder; edge = no-op. Empty vs singular. Kill free date input (`PositionBuilder.tsx` ~1914). Horizon + TM clock. Seed-time defaults only. Recovery: NOT TRADED, propose never apply, structure-level roll prominent, `<select>` must not write `options[0]` on render. Residual legs editable.

**ATs:** AT-PC-09–12 · 17 · 18 · 38  
**Gate PC7-G.** Fixture with a missing contract writes nothing on render.

### PC8 — Card, dialog, symbol groups

**Laws:** PC-VOCAB · PC-SYM-1–7 · 10 · PC-HIG · PC-STRAT-8 · 11 · 12 · §5  
**Depends:** **PC7 only.** Echo remaining density work is a **PC8 task, not an entry gate.** PC-HIG-8 is stamped: the stepper grows on hover and focus past the row bounds; that is the mechanism satisfying PC-HIG-1. Echo at this packet: resting and grown dimensions, the growth transition, and whether non-interactive Analyzer chrome takes the compact profile. Echo still sits at **PC8-G**.

One shared leg-row component (PC-VOCAB-1 · 4).

**ToS card (Spec v1.1):**

1. **Ten columns exactly** `SPREAD · SIDE · QTY · SYMBOL · EXP · STRIKE · TYPE · PRICE · VOL · DELTA`. No Yield, no Vol Adj, no BP Effect, no per-leg price cell (PC-VOCAB-7 · 6 · AT-PC-61).
2. **Row grammar (PC-VOCAB-5):** Row 1 carries BASIS, the lock, and package **DELTA**. Leg rows carry **VOL**; DELTA on legs is "—" (AT-PC-62). Row 2's PRICE cell is the **DEBIT / CREDIT label**, not a number.
3. **Seven editable fields**, each conditional on strategy: Spread · Side · QTY · Expiration · Strike · Type · Price. Inert where the strategy does not expose them (PC-VOCAB-8 · AT-PC-63). The dialog's only remaining exclusive is add / remove leg.
4. **Spread on the card** is wired to the **same rebuild path** as the dialog picker (PC-VOCAB-9 · PC-STRAT-8). Changing it rebuilds legs and moves basis to CHECK PRICE — card-rebuild half of AT-PC-64; CHECK PRICE half is PC6. **AT-PC-32 card-picker half** lives here; dialog-picker half is PC5; seed-rebuild is PC2.
5. **Per-leg editing** on Calendar, Diagonal and CUSTOM: expiration and strike editable per leg on the card; a per-leg edit re-derives the name (PC-VOCAB-10 · AT-PC-65).
6. **Padlock pair** in the ToS form. Unlocked: outlined, thin stroke, shackle raised and rotated clear. Locked: solid fill, neutral light tone, shackle closed. The shackle carries the state, not the colour (PC-HIG-5/6 · AT-PC-66).
7. **Stacked +/− steppers** replace every chevron-style nudge on the card (PC-HIG-7 · AT-PC-70). The stepper **grows on hover and focus past the row bounds** (PC-HIG-8). Grown state meets `--hit-min` at both profiles; resting need not (AT-PC-67). **Grown steppers on vertically adjacent rows do not overlap** (AT-PC-68) — the one remaining way this pattern can fail PC-HIG-1.
8. **QTY quick-pick** 1 · 2 · 5 · 10 · 20 unless Coach sets otherwise. Type, step and pick all remain. The pick sets lot size **through the POS gesture** (PC-HIG-9 · PC-QTY-6 · AT-PC-69), leaving ratio and lock untouched. Asserted here; depends on PC2's POS gesture existing. Jump suits the field (PC-HIG-10): QTY quick-pick, strike type-to-filter picker, price steps by tick with no quick-pick.
9. **Echo remaining (task, not gate):** resting and grown dimensions, the growth transition, whether non-interactive chrome takes the compact profile.

Non-bold; STRATEGY exempt (PC-STRAT-12). Delete confirmed, one position. Symbol groups: select ≠ expand; highlight not checkbox; selecting a header sets suite symbol and **clears cross-group focus**. Wire `focusedId` or delete it — no ghost. `+ Add Leg` on every strategy (dialog exclusive).

**ATs:** AT-PC-15 · 19 · 20 · 33 · 49 · 58 · **32 (card picker)** · **61 · 62 · 63 · 64 (card-rebuild)** · **65–70**  
**Gate PC8-G.** Echo + Tango sit with Delta. Tango: *would a bleeding trader feel respected and taught?* (Grid and respect question live here; Cancel/Close and Keep/Unlock already gated at PC5/PC6.)

### PC9a — Autofit

**Laws:** PC-FIT-1…3  
**Depends:** PC3  
**Same-day parent amend:** Autofit AF-L5.

Autofit subscribes to the structure signal, not an event list. Follows the committed book, never the overlay. Fit only when geometry escapes (PC-FIT-3). Explicit Fit control remains.

**ATs:** AT-PC-16  
**Gate PC9a-G.**

### PC9b — Promotion

**Laws:** PC-LIFE-1…10 · PC-TM-1…3 · PC-PERSIST-1…5 (restatement only — do not change local-durable to session-only)  
**Depends:** PC6  
**Same-day parent amend:** Trade Log snapshot column.

Mapper **rewritten**: `order_type` from `lockSource`; no fill from stored `entry_price`; no `contracts` as multiplier. Snapshot per PC-LIFE-7. Entry time at Log, TM clock. Residual does not block Log. TM gates AND-ed.

**ATs:** AT-PC-07 · 13 · 14 · 46 · 54  
**Gate PC9b-G.** Promoted butterfly reads back as butterfly with ratio and POS; Log impossible under TM.

### PCZ — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **PCZ-0** | **Lima** | Spec §9 gap map → closed or named residual. DL program close. Parent amends landed |
| **PCZ-1** | **India** | Diff ⊆ **that packet’s seed allowlist**. No MSC. Spec hash unless Coach versioned |
| **PCZ-G** | **Delta** | Full AT pack evidenced. No false greens. **No deploy** |

---

## 7. Acceptance pack (Delta-checkable)

IDs are **Spec §8** unless marked plan-only. This plan does not drop a Spec row. Oracle = Spec assertion text. Spec lists **AT-PC-01…70**.

**Evidence classes:** `tsx` = `npx tsx` bare Node · `pw` = Playwright · `comp` = component (tsx or pw as the seed names) · `grep` = static · `a11y` = hit-rect + keyboard · `live` = Coach MacBook walk.

| ID | Phase | Class | Owner |
|----|-------|-------|-------|
| AT-PC-01 | PC5 | comp | Kilo · Charlie |
| AT-PC-02 | PC0 | tsx | Kilo |
| AT-PC-03 | PC3 | tsx | Kilo |
| AT-PC-04 | PC5 | comp | Kilo |
| AT-PC-05 | PC6 | comp | Kilo |
| AT-PC-06 | PC6 | tsx | Kilo |
| AT-PC-07 | PC6 / PC9b | tsx | Kilo |
| AT-PC-08 | PC6 | comp | Kilo |
| AT-PC-09 | PC7 | comp | Kilo |
| AT-PC-10 | PC7 | comp | Kilo |
| AT-PC-11 | PC7 | comp | Kilo |
| AT-PC-12 | PC7 | tsx | Kilo |
| AT-PC-13 | PC9b | comp | Kilo |
| AT-PC-14 | PC9b | tsx | Kilo |
| AT-PC-15 | PC8 | comp | Kilo |
| AT-PC-16 | PC9a | tsx | Kilo |
| AT-PC-17 | PC7 | comp + fixture | Kilo |
| AT-PC-18 | PC7 | comp | Kilo |
| AT-PC-19 | PC8 | a11y | Echo · Kilo |
| AT-PC-20 | PC8 | grep | Tango · India |
| AT-PC-21 | PC5 | tsx | Kilo |
| AT-PC-22 | PC5 | comp | Kilo |
| AT-PC-23 | PC5 | comp | Kilo |
| AT-PC-24 | PC6 | comp | Kilo |
| AT-PC-25 | PC6 | comp | Kilo |
| AT-PC-26 | PC2 (field) / PC6 (chip) | tsx | Kilo |
| AT-PC-27 | PC6 | tsx | Kilo |
| AT-PC-28 | PC6 | tsx | Kilo |
| AT-PC-29 | PC6 | tsx | Hotel · Kilo |
| AT-PC-30 | PC3 | tsx | Kilo |
| AT-PC-31 | PC3 | tsx | Kilo |
| AT-PC-32 | PC2 (seed rebuild) / PC5 (dialog picker) / PC8 (card picker) / PC6 (CHECK PRICE) | tsx / comp | Kilo |
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
| **PC6-G-numeral** | PC6 | comp | Echo · Tango · Kilo |
| AT-PC-45 | PC4 | tsx | Kilo |
| AT-PC-46 | PC9b | tsx | Kilo |
| AT-PC-47 | **PC0 only** | tsx | Kilo |
| AT-PC-48 | PC6 | tsx | Kilo |
| AT-PC-49 | PC8 | comp | Echo · Kilo |
| AT-PC-50 | PC4 (stack) / PC5 (Create-reopen) | comp | Kilo |
| AT-PC-51 | PC6 | tsx | Kilo |
| AT-PC-52 | PC3 | comp | Kilo |
| AT-PC-53 | PC2 | tsx | Hotel · Kilo |
| AT-PC-54 | PC6 / PC9b | tsx | Kilo |
| AT-PC-55 | PC6 | tsx | Kilo |
| AT-PC-56 | PC5 | comp | Kilo |
| AT-PC-57 | PC2 | tsx | India · Kilo |
| AT-PC-58 | PC8 | comp | Kilo |
| AT-PC-59 | PC1 | tsx | Kilo |
| **AT-PC-60** | **PC0** | tsx | Kilo |
| AT-PC-61 | PC8 | comp | Kilo |
| AT-PC-62 | PC8 | comp | Kilo |
| AT-PC-63 | PC8 | comp | Kilo |
| AT-PC-64 | PC8 (card rebuild) / PC6 (CHECK PRICE) | tsx / comp | Kilo |
| AT-PC-65 | PC8 | comp | Kilo |
| AT-PC-66 | PC8 | a11y | Echo · Kilo |
| AT-PC-67 | PC8 | a11y | Echo · Kilo |
| AT-PC-68 | PC8 | a11y | Echo · Kilo |
| AT-PC-69 | PC8 (depends PC2 POS gesture) | comp | Kilo |
| AT-PC-70 | PC8 | grep + comp | Kilo |

**PC6-G-numeral** is a plan gate assertion (Disposition A4). Spec §8 does not assign it an `AT-PC-*` id — AT-PC-61…70 are card criteria, not this numeral. Fold at W0 if Coach wants it in the Spec; otherwise it remains PC6-G.

Kilo owns the matrix at **PCZ**. A green packet gate may still leave later ATs unrun; PCZ-G requires the full Spec table evidenced or explicitly **out of that packet** with a pointer.

---

## 8. File allowlist (indicative until W0-2)

**Seeds name an exact subset of this section. Delta FAILs any extra file.** PC2 must not start against §8.2 as a bag of hosts — touching `PositionBuilder.tsx` while declaring dialog chrome out of scope is the drift this rule prevents.

### 8.1 Expected create / heavy edit

| Path | Phase |
|------|--------|
| `agents/p-options-lab-position-control/fixtures/cboe-option-premium-tick-bands.md` | PC1 (transcribe; fill from Cboe published specs) |
| `web/lib/options-lab/tickSize.ts` (+ test) | PC1 |
| `web/lib/options-lab/dteHorizon.ts` (or single existing importer) | PC1 |
| `web/lib/options-lab/undoStack.ts` | PC4 |
| `web/lib/options-lab/structureClassifier.ts` (+ test) | PC2 |
| `web/lib/options-lab/positionQty.ts` (GCD / POS / ratio) | PC2 |
| `web/lib/options-lab/structureSignal.ts` | PC3 |
| `web/lib/options-lab/packageQuoteFinish.ts` (or successor merge leaf) | PC3 |
| `web/lib/options-lab/positionRow.tsx` (shared leg row) | PC8 |
| `migrations/NNN_analyzer_promotion_snapshot.sql` | PC9b |
| `agents/p-options-lab-position-control/**` | W0 |
| `agents/go/PC-W0.md` | W0 |
| Parent Spec amend files (Autofit · TM · PB · Trade Log) | W0-1 / PC9a / PC9b |

### 8.2 Expected edit (existing)

Named **per seed**, not as a pool: `OpfRiskAnalyzer.tsx` · `PositionBuilder.tsx` · `AnalyzerPositionsList.tsx` · `HostPnLChart.tsx` · `analyzerBook.ts` · `usePackageQuotes.ts` · `cardDisplayState.ts` · `listedStrikeDrag.ts` · `positionTypes.ts` · `builderCreateDefault.ts` · `tosGenerator.ts` · `analyzerToTradeLog.ts` (or current mapper path) · `positionLabels.ts` · `tokens.css` (Echo additive)

PC2’s seed does **not** include `PositionBuilder.tsx`.

### 8.3 Forbidden without a new Coach stamp

`strategy-lab-proto/msc-risk-graph-ui/**` · any MSC import · Heatmap template compute · Sessions · Market Bus protocol · Mini Two / Dude Two deploy scripts as this program’s work · a second Zustand/global book · reducing persist to session-only.

---

## 9. Seating

| ID | Rule |
|----|------|
| **S1** | **Charlie** — host, card, dialog, controls |
| **S2** | **Hotel** — classifier taxonomy, signed D\*, BASIS units, ToS/lock semantics |
| **S3** | **Alpha** — quote merge, interest, generation apply (if touched) |
| **S4** | **Echo** — PC8 task (not entry gate): resting/grown stepper dimensions, growth transition, compact chrome; padlock pair; AT-PC-66/67/68; layout; STRATEGY perceptibility; both profiles; PC6-G-numeral mark |
| **S5** | **Kilo** — AT matrix, fixtures, Playwright |
| **S6** | **Tango** — Cancel vs Close at **PC5-G**; Keep / Unlock at **PC6-G**; AT-PC-20, Delete confirm, respect question at **PC8-G** |
| **S7** | **India** — dual-truth, MSC, allowlist, parent Spec integrity |
| **S8** | **Lima** — DL, hashes, cross-stamps, as-built |
| **S9** | **Mike** — no client Massive; auth on pricing routes unchanged |
| **S10** | **Foxtrot** — tick fixture provenance (Cboe specs → fixture); **no deploy** |
| **S11** | **Juliet** — board, seeds, no NX creep, no Mini Two |
| **S12** | **Delta** — every phase gate ternary; extra files = FAIL |
| **S13** | Seeds on disk before the phase gate |

---

## 10. Definition of done — every packet

- [ ] Change declared — **exact files, a subset of §8** — approved before implementation  
- [ ] Only those files touched  
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
| Old books break qty model | PC2 | Idempotent read migration; wing-distance **tolerance** on listed grid |
| Killing override breaks ToS | PC6 | Stays as derived serialisation; pin script output at PC0 |
| Density vs hit floor | PC8 | Stamped grow-on-hover stepper (PC-HIG-8). Grown state meets `--hit-min`; resting need not. Echo remaining: dimensions, transition, compact chrome — a PC8 task, not an entry gate |
| Grown steppers overlap on adjacent rows | PC8 | AT-PC-68. The one remaining way the grow-on-hover pattern can fail PC-HIG-1 |
| Trade Log schema | PC9b | Additive nullable snapshot column; ordered `migrations/` |
| Quote/import cycle | PC3 | Merge leaf, not `analyzerBook.ts` |
| Invented tick | PC1 | Empty/missing fixture = BLOCKED; transcribe Cboe specs only |
| Three failed attempts | any | Stop, return to purpose, re-derive (doctrine) |
| Silent Mini Two “ship” | any | **FAIL.** Spec machine law |
| “Fix” persist to session-only | PC0 / PC9b | **FAIL.** AT-PC-60 |

---

## 12. What this plan does not do

Broker OMS · order placement · per-leg Greeks · **per-leg price on the card** (PC-VOCAB-6) · **Yield** · **Vol Adj** · multi-card aggregate curves · Surface 3D · MSC · server multi-device book · historic-chain replay of closed trades · a second position store · a global store · a selectable “Custom” mode · undo of a Trade Log promotion · **any deploy**.

**Package DELTA is in scope** (PC-VOCAB-5 · 7) — the only Greek on the card. **BP Effect** is deferred to the simulated-broker release; it was never in this plan.

---

## 13. Juliet recommendations (Coach disposes at W0; **no silence defaults for product law**)

Product law is already stamped in the Spec. These are **process** ticks only:

| Rec | If Coach silent at GO |
|-----|------------------------|
| **JR1** | Board path `agents/p-options-lab-position-control/` · token `PC-W0.md` |
| **JR2** | PC0 is the **first code packet after GO**, not a pre-GO exception |
| **JR3** | Tests: `npx tsx` + `node:assert/strict` under bare Node; Playwright for component ATs the seed marks `pw`/`comp` |
| **JR4** | Do not split `PositionBuilder.tsx` in PC5 |
| **JR5** | Parent Spec amends (AF-L5, TM DTE, PB17b, Trade Log snapshot) are Lima W0-1 **stubs** if the parent file cannot land the same day; the **code** that depends on them waits (PC9a for AF-L5, PC9b for snapshot) |
| **JR6** | PC6-G-numeral stays a plan gate unless Coach folds it into Spec §8 |

---

## 14. Open process questions (not product ODs)

None of these reopen Spec law.

| ID | Question | Options |
|----|----------|---------|
| **OD-PC-P1** | PC0 before vs after the GO fire | **(a)** After W0-0, same day *(JR2)* · **(b)** Coach pulls PC0 as a defect fix under existing PC-TM-2 before the rest of W0 paperwork |
| **OD-PC-P2** | Classifier confirm | **(a)** Hotel W0-4 same day as GO · **(b)** Hotel confirm is PC2 entry, blocks PC2 not W0-G |

---

*Position Control Full Agent Bench Plan v1.1. No implementation before Coach’s GO.*
