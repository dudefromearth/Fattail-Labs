# OT-EF · Session/Print · Two Clocks — Full Agent Bench Plan v1.0

**Date:** 2026-08-16  
**Plan revision:** **v1.0.1** (Coach GO W0 · W3-0 pre-answered BUILD · DL-397)  
**Canonical filename:** `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-ot-ef-session-print/`](../agents/p-ot-ef-session-print/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **OT-EF Doctrine v1.1** | [`Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`](../Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) | **NORMATIVE** · DL-396 |
| **Session/Print Authority Spec v0.1** | [`Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md`](../Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md) | **WHETHER = BUILD** (Coach W3-0 2026-08-16 · DL-397). HOW review still lands (W3-1). |
| **PB Spec v0.3** | [`Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md`](../Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md) | PB-VIEW-4 **retired** · PB-VIEW-4a |
| **SL-GD v1.0 §18** | [`Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md`](../Specs/FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md) | SL-GD39–41 |
| **OPF Spec v0.2.1** | [`Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | BUILD AUTHORITY for OPF1–33; **OPF34–36 DRAFT** |
| **Analyzer Spec v0.2.1** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent; additive book / two clocks inherit OT-EF |
| **DL-393 · 394 · 395 · 396** | [`Architecture/00-decision-log.md`](../Architecture/00-decision-log.md) | Binding |

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| Market Bus Spec content **v1.0.1** · Arch **28** | One WS/tab · dual-side generation · Massive pre/post prints exist |
| OPF bench (closed foundation) | [`docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md`](./Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md) — L0–L4 landed; this program **extends** the feed, does not reopen packs |
| Analyzer residual | [`docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md) — layout / Surface / VP bins stay there |
| Human Interface Spec v1.0 | Dialog · badges · fail-loud — chrome **after** W1 |
| Chain Picker Spec **v1.0.2** | Universe · OC2 · OC6a |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

---

## 0. Why this program exists

Coach (2026-08-16), preserved:

> I feel the problem is at OPF, not in the client. OPF needs to manage the feed to the client.  
> I don't want you to ever just jump into such a big infrastructure change without a multi-agent plan.

Observed failures this program exists to retire:

| Symptom | Root |
|---------|------|
| Edit Position flashes **OPF unavailable** and retry-loops when RTH is closed | Client invents session; treats last print as an outage |
| Cash-bell hard cut 09:30 / 16:00 | Drops Massive pre/post prints |
| Same-day card treated EXPIRED at 16:00Z | One clock used for two facts |
| Merge-all-visible into one custom OPF → **CHECK LEGS** | Additive book implemented as a fake strategy, not independent resolve + sum |
| Viewport radio, not checkbox | PB-VIEW-4 (retired) still driving chrome |

This plan sequences **doctrine → labels → characterization → Session/Print GO → envelope BUILD → client consume**. It does **not** invent a third market vendor, change τ (OPF29), or reopen Analyzer residual NX.

---

## 1. Mission

```text
OT-EF v1.1 (two clocks · additive book · SL-GD39–41)
  → Echo seeds labels (no chrome)
  → Delta writes characterization list (no code)
  → Session/Print sequential review → Coach W3-0 GO
  → OPF envelope on ladder / package-quote / resolve
  → Client consumes envelope (Analyzer · Builder)
  → Edit dialog never treats last print as OPF unavailable
  → Kilo greens the W2 list · Lima as-built close
```

| Pillar | Law | Ship meaning |
|--------|-----|----------------|
| Two clocks | OT-EF Law C · DL-393 · DL-396 | τ ≠ EXPIRED; window = Held/residual, never live |
| Additive book | DL-394 · PB-VIEW-4a | Independent Show checkbox; one continuous book; **not** one custom OPF merge |
| Session/print SoR | OPF34–36 (after W3-0) | OPF states market + print quality; client consumes |
| Last print ≠ outage | OPF36 · OT-EF B1 | Held generation is instrument truth |
| Pre/post in feed | OPF-SESS-5 | Massive printing ⇒ not a cash-bell cut |
| SL join | SL-GD39–41 | BT/FW Law A consumer; atomic position; tier is a state |
| Echo labels | OT-EF §10 #3 | No member chrome until the seed |
| Delta list | OT-EF §10 #4 | No code in this program until the list |

**First smoke after W5 (not before W3-0):**

1. After settlement and before midnight ET a same-day card is **held / residual**, never **live**.  
2. After midnight ET a still-shown card is **EXPIRED** + ghost with **defined debit**.  
3. Two shown cards add on one continuous curve; unchecking one does not radio-clear the other.  
4. Closed + last print: Edit Position does **not** flash OPF unavailable.  
5. Extended (Massive still printing) is not drawn as closed / unavailable.

---

## 2. Hard gates (do not invert)

| Gate | Rule | Unblocks |
|------|------|----------|
| **W1 Echo labels** | **No chrome** (badges, chips, dialog copy) until the label seed lands | W5 chrome; W3-2 may cite the seed |
| **W2 Delta characterization list** | **No code** in this program until the list exists on disk | W4+ implementation; W8 tests |
| **W3-0 Coach GO** | **Pre-answered BUILD** (2026-08-16). Build the market-state feed. India shapes **HOW**, not **WHETHER**. | WHETHER is closed. W4 waits on W1-G + W2-G + **W3-G** |
| **W0 doctrine** | This body of work — no chrome, no code | W1 · W2 · W3 in parallel |

W1, W2, and W3 **review** may run in parallel after W0-G.  
W4 fires the moment **W1-G, W2-G, and W3-G** pass. Do **not** wait for a second W3-0 stamp.

**Juliet does not invent WHAT.** Coach locked the six next-steps and the three SL amendments. This plan only sequences them.

---

## 3. As-built honesty

### 3.1 Keep (already landed · do not regress)

| Area | Status | Evidence |
|------|--------|----------|
| Independent Show checkbox | Landed | `AnalyzerPositionsList` native checkbox · DL-394 |
| Additive book (correct path) | Landed | Independent OPF resolve per shown trade + `sumAlignedPnL` / `interpolatePnl` |
| Midnight-ET EXPIRED clock | Landed | `isOptionPointerExpired` / `newYorkCalendarDate` · DL-393 |
| Defined debit on EXPIRED ghost | Landed | `definedDebitPerShare` + `expiredGhostSeries` |
| Off-market hydrate-once (partial) | Landed shim | `useBuilderChain` skips 3s poll when `!planePrinting` |
| OT-EF v1.1 · SL-GD39–41 · PB-VIEW-4 retirement | Landed this fold | DL-396 |

### 3.2 Failed path (do not revive)

| Path | What happened | Law |
|------|----------------|-----|
| Merge all visible cards into **one custom OPF strategy** | Viewport **CHECK LEGS** | Additive book = **sum of independent resolves**, never a synthetic multi-card strategy |

DL-394’s as-built sentence that said “one OPF resolve of the merged shown legs” describes the **failed** attempt. The surviving implementation is independent resolve + aligned sum. W5 must not “fix” back to a merge.

### 3.3 Build (this program)

| Gap | Law | Phase |
|-----|-----|--------|
| Doctrine fold + this plan + board | DL-396 · OT-EF §10 | **W0** |
| Member-facing words for Live · Pre/post · Off market · last print · Held residual · EXPIRED | OT-EF B2 · Session/Print §6 | **W1** |
| Characterization list (two clocks, additive book, last-print ≠ outage, Law A on BT/FW, tier as state) | OT-EF §10 #4 · §11 | **W2** |
| Session/Print sequential review + Coach GO | Spec §11 · OPF34–36 | **W3** |
| `opf_session` envelope on ladder / package-quote / resolve | OPF35 · AT-SESS-1 | **W4** |
| Client consumes envelope; clock ceases to be SoR when envelope present | OPF-SESS-4 · AT-SESS-5 | **W5** |
| Edit dialog: last print ≠ OPF unavailable; no retry-loop | AT-SESS-6 · OT-EF B1 | **W6** |
| SL BT/FW Law A + tier-as-state honesty (characterization first) | SL-GD39–41 | **W7** |
| Full AT matrix from the W2 list | OT-EF §11 · AT-SESS-1…7 | **W8** |
| As-built · DL close · MiniTwo only if BUILD shipped | Docs parity | **W9** |

### 3.4 Explicit non-phases (out of program)

| ID | Out |
|----|-----|
| **NX1** | MSC as pricing SoR / MSC Redis / live MSC import |
| **NX2** | Day-replay harness / SSR (Arch 31 remains thesis) |
| **NX3** | Analyzer Surface 3D residual (stays on Analyzer residual board) |
| **NX4** | Header marks UI (market invariant 8 — still no surface Spec) |
| **NX5** | Dual-host Practice vs Labs cutover |
| **NX6** | Multi-member live Tradier |
| **NX7** | VP classifier + ES tape · Timing trigger UI |
| **NX8** | Advanced Flies hosted inside Convexity tiles |
| **NX9** | Merge-all-visible into one custom OPF strategy |
| **NX10** | Delete `/session-status` in W0–W3 (OD-SESS-4: labeled shim until W5 cutover) |
| **NX11** | New market-data vendor |
| **NX12** | Change τ / OPF29 settlement instant (that is the **other** clock) |
| **NX13** | Brokerage hours, OMS, Tradier session |
| **NX14** | Chrome before W1 · code before W2 · envelope BUILD before W3-0 |

---

## 4. Locked decisions (program)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | OT-EF **v1.1** is capital-risk doctrine. v1.0 is historical. | DL-396 |
| **FP2** | Two clocks. τ ≠ EXPIRED. Window = Held/residual, **never live**. | Coach 2026-08-16 |
| **FP3** | EXPIRED = next midnight **America/New_York** after the exp calendar date. | DL-393 |
| **FP4** | Additive book. PB-VIEW-4 **retired**. Show is a checkbox. | DL-394 |
| **FP5** | Additive implementation = independent resolve + aligned sum. Not a custom merge. | As-built after CHECK LEGS |
| **FP6** | Session/Print **WHETHER** is BUILD (W3-0 pre-answered). Proposed OPF34–36 facts are parent law. Envelope **shape / writer / OD-SESS** may still change in W3-1 HOW review. | DL-395 · **DL-397** |
| **FP7** | Target SoR for session/print is **OPF**. Client clock / `/session-status` is a labeled shim. | OPF34 |
| **FP8** | Last known print is held truth, not an outage. | OPF36 · OT-EF B1 |
| **FP9** | Pre/post Massive prints stay in the feed when they exist. No cash-bell hard cut. | OPF-SESS-5 |
| **FP10** | SL-GD39–41 join OT-EF. No BT/FW engine rewrite in W0–W3. | DL-396 |
| **FP11** | No chrome until W1. No code until W2. W4 BUILD the moment W1-G + W2-G + W3-G pass. | Coach · OT-EF §10 · **DL-397** |
| **FP12** | Echo seeds **words**, not components. Delta seeds a **list**, not tests-in-repo. | Coach |
| **FP13** | MSC is not the standard. | DL-293 · DL-302 |
| **FP14** | Delta ternary only. Coach overrule needs a new DL. | Doctrine |
| **FP15** | Documentation parity with any later ship. MiniTwo only if W4+ actually ships. | CLAUDE.md |
| **FP16** | Juliet does not invent WHAT. OD-SESS-1…4 stay open until Coach Accepts at W3-0. | Spec §10 |

### 4.1 Open decisions — **Accepted** (Coach 2026-08-16 · **DL-398**)

India HOW shape (W3-1 H1–H4). Draft recommendations kept in Session/Print §10.

| # | Accept |
|---|---------|
| **OD-SESS-1** | H2 split: print quality on every mark payload; cite session class after snapshot |
| **OD-SESS-2** | H1: bus L0 key untouched; OPF computes `opf_session`; no Massive from writer |
| **OD-SESS-3** | Product table; OPF states open→extended; not τ |
| **OD-SESS-4** | `/session-status` shim through W4; drop as SoR in W5 |

H3–H4 accepted with the set.

### 4.2 Seating

| ID | Rule |
|----|------|
| **S1** | **Juliet** owns DAG · seeds · phase order · NX discipline. Does not execute packets. |
| **S2** | **India** · Session/Print domain · OPF vs bus · no second SoR · two-clock clash check. |
| **S3** | **Echo** · W1 label seed only (no chrome). W3-2 + W5 chrome after W1-G. |
| **S4** | **Tango** · copy honesty · no panic on closed · no profit claims. |
| **S5** | **Hotel** · live vs last print vs residual must not read as a liftable quote. |
| **S6** | **Delta** · W2 characterization **list** (no code) · every phase gate ternary. |
| **S7** | **Alpha** · W4 envelope on ladder / package-quote / resolve. No client Massive. |
| **S8** | **Charlie** · W5 consume + W6 Edit dialog. Independent resolve + sum. Echo labels only. |
| **S9** | **Kilo** · W8 AT matrix **from the W2 list**. May advise W2; does not write product code. |
| **S10** | **Lima** · DL-396 landed · W9 as-built · content hashes at GO. |
| **S11** | **Mike** · auth on any new pricing/session route (W4 if new endpoint). |
| **S12** | **Foxtrot** · MiniTwo only after a BUILD ship (W9). StudioOne is not the deploy host. |
| **S13** | **Coach** · W0-0 plan stamp (sequencing) · **W3-0 BUILD GO**. |
| **S14** | Seeds on disk before the matching phase gate. |

---

## 5. Phase DAG

```text
W0 (doctrine + this plan)     W3-0 WHETHER = BUILD (already)
 ├──► W1 Echo labels ──────────────┐
 ├──► W2 Delta characterization ───┼──► W4 envelope ──► W5 consume ──► W6 Edit
 └──► W3 HOW review ──► W3-G ──────┘         │
                                              ├──► W7 SL Law A / tier
                                              └──► W8 Kilo matrix ──► W9 close
```

| Phase | Name | Depends | Exit summary |
|-------|------|---------|--------------|
| **W0** | Doctrine fold · plan · board | — | OT-EF v1.1 · SL-GD39–41 · DL-396 · this file · board. **No chrome. No code.** |
| **W1** | Echo label seed | W0-G | Words for Live · Pre/post · Off market · last print · Held residual · EXPIRED. **No chrome.** |
| **W2** | Delta characterization list | W0-G | Pasteable list covering OT-EF §11 + AT-SESS-1…7 + SL-GD39–41. **No code.** |
| **W3** | Session/Print HOW review | W0-G | India → Echo/Tango → Hotel → Delta W3-G. **WHETHER already BUILD.** |
| **W4** | OPF session envelope | **W1-G + W2-G + W3-G** | Ladder, package-quote, resolve carry or cite `opf_session` |
| **W5** | Client consume | W4-G | Analyzer + Builder read OPF only; clock not SoR; Echo labels on chrome |
| **W6** | Edit dialog / no outage loop | W4-G (may parallel W5) | Last print open does not flash OPF unavailable; one hydrate when `printing=false` |
| **W7** | SL BT/FW Law A + tier-as-state | W2-G; code after W3-G | Characterization + any honesty fix. Cites Method v0.2 + Config Resolution Standard. **Not** a backtest rewrite |
| **W8** | Full AT matrix | W5-G + W6-G + W2 list | Every W2 row has a test or an explicit NX |
| **W9** | As-built · program close | W8-G | Spec honesty · DL close · MiniTwo only if BUILD shipped |

**Parallelism:** After **W0-G**: **W1 · W2 · W3** parallel. The moment **W1-G + W2-G + W3-G** pass: **W4**, then **W5 ∥ W6**. **W7** cites Method v0.2 + Config Resolution Standard. **W8** waits for W5+W6.

---

## 6. Phase detail

### W0 — Doctrine lock (this body of work)

**Agents:** Juliet · Lima · India · Delta · Coach  

- Land OT-EF v1.1 (Laws A–C, two clocks, additive book, six next-steps, SL join). Mark v1.0 SUPERSEDED.  
- Land SL-GD39–41 + Guiding Doctrine §18.  
- One-line PB-VIEW-4 retirement (already in PB v0.3).  
- DL-396. Pointers: AGENTS.md · CLAUDE.md · Analyzer · PB · OPF · Session/Print · Arch 32 · Arch README.  
- This plan + board `agents/p-ot-ef-session-print/`.  
- India: parents intact; NX list; no WHAT invented.  
- Delta **W0-G:** doctrine fold complete; plan on disk; **zero product chrome; zero product code** in the fold.  
- Coach **W0-0:** stamp this file as **sequencing authority**. Not BUILD AUTHORITY.

### W1 — Echo seeds labels — **no chrome**

**Agents:** Echo · Tango · Hotel · Delta  

Deliverable: `agents/p-ot-ef-session-print/echo-labels.md`

Required rows (member-facing **words**, not components):

| State | Badge / plane (≤2 words) | Package / curve reads | Must not say |
|-------|--------------------------|------------------------|--------------|
| `open` + `live` | | | “guaranteed”, a lift-now promise |
| `extended` + last print | | | “closed”, “unavailable”, “live NBBO” |
| `closed` + last print | | | “OPF unavailable”, “broken”, “no market data” |
| Held / residual (between clocks) | | | “live”, “expired” |
| EXPIRED (after midnight ET) | | | blank price; stale prior live mark |
| `print_quality=none` | | | stack trace; empty cell |

Also name **Show** (checkbox, not radio) if any residual copy still says “focus draws the graph.”

Tango: a bleeding trader is not panicked by closed. Hotel: last print is not a quote they can lift.  
**Forbidden:** shipping badges, CSS, or dialog strings into `web/`.

### W2 — Delta characterization list — **no code**

**Agents:** Delta (author) · Kilo (advise) · Hotel (honesty rows)

Deliverable: `agents/p-ot-ef-session-print/characterization-list.md`

The list is the **contract** Kilo implements at W8 and Alpha/Charlie must not violate at W4–W7. Minimum rows:

| ID | Fact to lock | Suggested home |
|----|--------------|----------------|
| **CL-1** | Same-day exp is **not** EXPIRED at 16:00Z / cash close | `analyzerBook.pointer` · `isOptionPointerExpired` |
| **CL-2** | After midnight ET next calendar day → EXPIRED + ghost | pointer + `cardDisplayState` |
| **CL-3** | Between τ and midnight ET → Held/residual, **never live** | bind assess · display state |
| **CL-4** | Ghost keeps **defined debit** (sign-honest) | `definedDebitPerShare` · ghost series |
| **CL-5** | Show is independent checkbox; two shown cards stay shown | book visibility |
| **CL-6** | Two shown representable cards → **one continuous additive** curve | `sumAlignedPnL` |
| **CL-7** | Merge-into-one-custom-OPF is **not** the path (CHECK LEGS regression) | `visibleBookTrade` / resolve |
| **CL-8** | Hidden card does not contribute; non-representable sibling does not blank a drawable one | viewport policy |
| **CL-9** | `print_quality=last_print` is **not** OPF unavailable | Builder atomic state · Edit dialog |
| **CL-10** | `printing=false` → one hydrate, no 2.5s/3s retry loop | `useBuilderChain` · package quotes |
| **CL-11** | `market=extended` when Massive is printing pre/post | envelope (after W4) |
| **CL-12** | Client has **no** clock SoR when envelope is present | consume (after W5) |
| **CL-13** | Live RTH still claims live + RECON as today | envelope + Analyzer |
| **CL-14** | BT/FW does not invent strikes (gold or silver) | SL-GD39 |
| **CL-15** | BT/FW events address the **position**, not a leg | SL-GD40 |
| **CL-16** | Silver is never drawn as gold | SL-GD41 |
| **CL-17** | Last print / residual is never drawn as live | OT-EF A6 · B2 |

Delta may add rows. Delta may **not** write the tests in W2.  
**W2-G:** every OT-EF §11 litmus item maps to ≥1 row; every AT-SESS-1…7 maps to ≥1 row (or “blocked on W3-0”).

### W3 — Session/Print sequential review + Coach GO

**Agents:** India → Echo + Tango → Hotel → Delta → Coach  

Follow [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md). Coach Content Law: objections sit **beside** Coach text.

| Seed | Asks |
|------|------|
| W3-1 India | Is OPF the right SoR? Envelope vs bus? Clash with Analyzer B2 / Arch 28 / two clocks? OD-SESS-1…4 recommendations labeled **opinion**. |
| W3-2 Echo + Tango | Badge/copy using the **W1 seed** if it exists; else return “blocked on W1” rather than inventing chrome. No panic on closed. |
| W3-3 Hotel | Live vs last print vs residual must not be misread as a liftable quote. |
| W3-G Delta | Review packet complete; spec still DRAFT; no BUILD sneak. |
| **W3-0 Coach** | **Pre-answered BUILD (DL-397).** WHETHER is closed. This row is historical. |

**Forbidden at W3:** Treating India RETURNED-on-HOW as a WHETHER veto. Deleting `/session-status` in W3. Changing OPF29. Alpha/Charlie implementation still waits for **W3-G** (HOW packet complete), not a second GO.

### W4 — OPF session envelope (BUILD)

**Agents:** Alpha · India · Mike (if new route) · Kilo (CL-11…13 subset)

- Implement `opf_session` (or Coach-renamed fields) on **ladder, package-quote, and resolve**.  
- Facts stay: `market` · `printing` · `print_quality` · `as_of` · `generation_as_of`.  
- Keep per-leg `mark_source` and package `mark_mode`. Envelope **sits beside** them.  
- L0 input may remain bus `/session-status` or Massive status — **OPF** is what the client will read.  
- No client clock as SoR in the envelope writer.

### W5 — Client consume

**Agents:** Charlie · Echo (chrome from W1 words) · Tango · Hotel

- Analyzer + Builder **consume** `opf_session`.  
- When envelope is present, clock and raw `/session-status` are **not** member SoR.  
- Apply W1 labels. Independent Show + additive sum **unchanged**.  
- Do **not** merge visible cards into one custom OPF strategy.

### W6 — Edit dialog / closed-market mode

**Agents:** Charlie · Kilo (CL-9 · CL-10)

- Edit Position with held last print does **not** flash OPF unavailable.  
- `printing=false` + held generation → one hydrate, no retry-loop.  
- Named incomplete only when `print_quality=none`.

### W7 — Strategy Lab Law A consumer + tier-as-state

**Agents:** Charlie / Alpha only if a real honesty bug exists · Kilo characterization

- Prove BT/FW cannot emit non-listed strikes (gold or silver).  
- Events / exits / buckets address the **position**.  
- Silver never renders as gold.  
- **Cites (required):** Method **v0.2** [`Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md`](../Specs/FatTail-Labs-Strategy-Lab-Backtest-Forward-Walk-Method-v0_2.md) (and v0.2.2 if that file is the current revision) and the [Config Resolution Standard v0.1](../docs/FatTail-Labs-Strategy-Lab-Config-Resolution-Standard-v0_1.md) (SL-GD §16).  
- **Not** a backtest-engine rewrite. If the engine is already honest, W7 is tests only.

### W8 — Evidence

**Agents:** Kilo · Delta

- Every W2 row is a test, an explicit handoff, or an NX.  
- AT-SESS-1…7 green after W4–W6.  
- OT-EF §11 litmus 1–9 green.

### W9 — Close

**Agents:** Lima · Foxtrot (only if BUILD shipped to MiniTwo) · Delta

- Flip Session/Print + Arch 30 as-built notes.  
- DL program close.  
- No false green on NX items.

---

## 7. Seed index

Seeds live under `agents/p-ot-ef-session-print/seeds/`.

| Seed | Agent | Phase | Status at plan land |
|------|-------|-------|---------------------|
| `W0-0-coach-plan-stamp.md` | Coach | W0 | Written — sequencing stamp, not BUILD |
| `W0-1-lima-doctrine.md` | Lima | W0 | Written — largely done in this fold |
| `W0-2-india-parents.md` | India | W0 | Written |
| `W0-G-delta.md` | Delta | W0 | Written |
| `W1-1-echo-labels.md` | Echo | W1 | Written — **fire next** |
| `W1-2-tango-copy.md` | Tango | W1 | Written |
| `W1-3-hotel-honesty.md` | Hotel | W1 | Written |
| `W1-G-delta.md` | Delta | W1 | Written |
| `W2-1-delta-characterization.md` | Delta | W2 | Written — **fire next** (∥ W1) |
| `W2-G-delta.md` | Delta | W2 | Written |
| `W3-1-india-session-print.md` | India | W3 | Written — **fire next** (∥ W1/W2) |
| `W3-2-echo-tango.md` | Echo + Tango | W3 | Written |
| `W3-3-hotel.md` | Hotel | W3 | Written |
| `W3-G-delta.md` | Delta | W3 | Written |
| `W3-0-coach-go.md` | Coach | W3 | **PRE-ANSWERED BUILD** · DL-397 |
| `W4-1-alpha-envelope.md` | Alpha | W4 | Stub — expand after W3-0 |
| `W5-1-charlie-consume.md` | Charlie | W5 | Stub — expand after W4-G |
| `W6-1-charlie-edit.md` | Charlie | W6 | Stub — expand after W4-G |
| `W7-1-kilo-sl-law-a.md` | Kilo | W7 | Stub — expand after W2-G |
| `W8-1-kilo-matrix.md` | Kilo | W8 | Stub — expand after W5+W6 |
| `W9-1-lima-asbuilt.md` | Lima | W9 | Stub |

Each seed states: spec path, plan phase, files in scope, out-of-scope / NX, invariants, completion criteria, gate it feeds.

---

## 8. Gate protocol

| Gate | Owner | Evidence |
|------|-------|----------|
| W0-G | Delta | OT-EF v1.1 on disk · SL-GD39–41 · DL-396 · this plan · board · **no product code in the fold** |
| W0-0 | Coach | Sequencing stamp (optional if “create the plan” is accepted as stamp) |
| W1-G | Delta | `echo-labels.md` complete · Tango + Hotel notes · **zero `web/` chrome** |
| W2-G | Delta | `characterization-list.md` maps §11 + AT-SESS + SL-GD39–41 · **zero new tests-as-product** |
| W3-G | Delta | India / Echo-Tango / Hotel reviews filed · spec still DRAFT |
| **W3-0** | Coach | **Done 2026-08-16 (DL-397).** WHETHER = BUILD the market-state feed. |
| W4-G | Delta | Envelope on three surfaces · AT-SESS-1 fixture · no client Massive |
| W5-G | Delta | Client reads envelope · clock not SoR · Echo labels · additive book intact |
| W6-G | Delta | Edit + last print · no unavailable flash · no retry-loop |
| W7-G | Delta | CL-14…16 green or explicit “already honest” evidence |
| W8-G | Delta | W2 list packed |
| W9-G | Delta | As-built · no NX false green |

---

## 9. Definition of Done (program)

1. Two clocks are doctrine **and** (after BUILD) display-state: Held/residual between τ and midnight ET, never live.  
2. EXPIRED is midnight ET; ghost keeps defined debit.  
3. Show is a checkbox; two or more shown cards add on one continuous curve; merge-custom-OPF stays dead.  
4. After W3-0 + W4–W6: OPF states session + print quality; the client does not invent them.  
5. Last print is not OPF unavailable. Pre/post prints are in the feed when Massive has them.  
6. Echo words are what the member reads.  
7. Every W2 row is evidenced.  
8. SL-GD39–41 are characterized; silver is not gold; BT/FW invents no strikes.  
9. NX items are not claimed shipped.

---

## 10. Risks

| Risk | Mitigation |
|------|------------|
| Jumping to envelope infra before HOW review | Juliet blocks W4 until **W3-G** (India/Echo-Tango/Hotel packet). WHETHER is already BUILD. |
| Chrome before words | W1-G · Echo owns words · Charlie blocked from badge copy invention |
| Tests written as a substitute for the list | W2 is a **list** · W8 is the tests |
| Revive merge-all-visible | NX9 · CL-7 · W5 seed forbids it |
| Clock leftover as secret SoR | CL-12 · W5-G grep for cash-bell SoR |
| Two-clock / OPF29 confusion | NX12 · India W3-1 · Law C table |
| Scope creep (3D, replay, header, Tradier) | NX1–NX14 · Juliet |
| MiniTwo deploy of a half-envelope | Foxtrot only at W9 after W8-G |

---

## 11. What to fire next (Coach)

After W0-G (doctrine + this plan):

1. **W1-1 Echo** — label seed.  
2. **W2-1 Delta** — characterization list (parallel).  
3. **W3-1 India** — Session/Print spec review (parallel).

W0 is **GO**. Fire **W1-1 · W2-1 · W3-1** now.  
W4 the moment W1-G + W2-G + W3-G pass. Do **not** open a third market socket. Do **not** “quickly” patch the Edit dialog with more client clock logic — that is the bug this program exists to retire.

---

## 12. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-16 | Juliet sequencing plan from Coach six next-steps + two clocks + additive book + SL-GD39–41. |
| **v1.0.1** | 2026-08-16 | Coach GO W0. W3-0 pre-answered BUILD (DL-397). W4 on W1-G+W2-G+W3-G. W7 cites Method v0.2 + Config Resolution Standard. |
| **v1.0.2** | 2026-08-16 | OD-SESS-1…4 Accept as India shaped (DL-398). W4 on the third of W1-G/W2-G/W3-G. |

**End of plan v1.0**
