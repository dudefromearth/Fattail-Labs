# FatTail Labs — Accounts & Capital and Positions View Spec v0.1

**Status:** SUPERSEDED by [v0.2](./FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md)  
**Date:** 2026-08-09  
**Type:** Product / UX / architecture authority — **identity money surface presentation** and **cross-account positions valuation view**  
**Source proposal:** [`docs/FatTail-Labs-Design-Proposal-Accounts-Capital-and-Positions-View-v1_0.md`](../docs/FatTail-Labs-Design-Proposal-Accounts-Capital-and-Positions-View-v1_0.md) (Coach-approved layouts, mockup session 2026-08-09)  
**Supersedes for layout:** Surface Directive — Accounts & Capital Summary and Rows v0.1 · Surface Directive — Account Positions View v0.1 (folded here)  
**Note:** Advisor review 2026-08-09 (PV-1…PV-7) folded into **v0.2** — do not implement from this file.  

**Parents / companions (normative where noted):**

| Spec | Role |
|------|------|
| [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) | Rings, fungibility, Accounts & Capital ownership (C9), witnesses |
| [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) | **Owns** balance vs trading curves; master-DD **$** meeting point; cash movements |
| [Staleness Spec v0.1](./FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) | Declared as-of / two clocks; display never demand |
| [Campaign Amendment — Top Level Is the Account](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md) | No ledger; undirected = zero badge tokens |
| [Trade Log Spec v1.1](./FatTail-Labs-Trade-Log-Spec-v1.1.md) | Open-book / FIFO host; Positions mode shell; badge chrome §17 |
| [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) | Registry of deliberate campaigns only (post-amendment) |

**Hard dependency:** Valuation surfaces **consume** shared `market_live_marks` (as-built stream, migrations 084–087, DL-222–224 family). Surfaces never open external market fetches on the hot path.

**Reference pattern:** Fidelity accounts panel + positions view — structure adopted; register translated to FatTail (process-first, no valence, undirected absence).

**Doctrine:** Umpire · no second store · Sacred #8 (no profit theater) · Family B · config fail-loud · no MSC · **funding ≠ direction** · **display never demand**.

---

## 0. Mission

Two surfaces, **one shared position-row component family**, all numbers **derived or declared** — never typed into the view:

1. **Accounts & Capital** (identity level, users menu) — money summary, account cards, **embedded** positions, capital witnesses.  
2. **Positions** (practice level, upgrade of Trade Log’s Positions mode) — **cross-account** grouped table, campaign badges, one-filter chip system.

Both render the same position-row component fed by the **same valuation API**. Divergence between the two surfaces on shared fields is a **defect**.

This Spec does **not** re-own capital arithmetic. Balance, trading curve, and master-DD dollars remain Funding Spec authority. This Spec owns **presentation, valuation join, degradation honesty, and campaign-badge wear on positions**.

---

## 1. Laws

| ID | Law |
|----|-----|
| **V1 — Two doors, one component** | Accounts & Capital and Positions share one position-row implementation and one valuation endpoint; column set is a declared prop only. |
| **V2 — Nothing typed into the view** | All position fields are derived (fills, open book, marks) or declared with as-of (stated account value, BP). Members edit capital facts on Accounts & Capital write paths — not by overwriting cells in the table. |
| **V3 — Marks from SoR only** | Hot path reads MySQL (`market_live_marks` + open book). Stream process owns Massive/universe. Surface load never fetches externally. |
| **V4 — No second valuation store** | No stored mark-to-market series or equity curve SoR for these views. Recompute at read. |
| **V5 — Stated-preferred totals** | Account **value** prefers member-stated account value when set; else derived (open position values + cash). Summary card totals Σ modeled accounts under the same rule. |
| **V6 — Cash is derived** | Cash row uses **match-cash calibration** (once ratified — OD-MC). Never typed; never inferred from broker APIs in v1. |
| **V7 — Buying power is declared** | BP never derived from positions. Posture + value + as-of per Capital / Staleness. |
| **V8 — No valence color** | Gains and losses use standard text color. Open/close tints on blotter remain structure tints, not win/loss. |
| **V9 — Undirected is absence** | Undirected positions show **no** campaign chip, placeholder, ghost badge, or “unassigned” token. Undirected is a **filter chip**, never a row label. |
| **V10 — One chip when directed** | Directed open structure: exactly **one** registry-sourced campaign chip on the position row. Legs inherit the trade stamp; never one chip per leg. |
| **V11 — Never net across accounts** | Same symbol in two books = two rows. Footer may name the multi-book case once. |
| **V12 — Honest degradation** | No mark → em-dash on mark-dependent cells; Value may show cost basis labeled “at cost”; quiet remedies line. Totals understate rather than invent. |
| **V13 — No fabricated option marks** | Equity mids first. Option structures without a sanctioned options mark path degrade at cost. |
| **V14 — One as-of line** | Surface header carries mark freshness (stream heartbeat age) and notes that declared figures vary by row. No per-cell timestamps. |
| **V15 — P&L present, not primary** | Value and composition lead; G/L columns trail. No gain sparklines, streaks, or profit chrome on these surfaces. |
| **V16 — Sole capital write path** | Account create/retire, starting balance, movements, BP, tolerance, confirm-as-current remain Accounts & Capital only (Capital C9 · Funding F9). Positions view is read + direction redirect only. |

---

## 2. As-built honesty (2026-08-09)

| Area | Status vs this Spec |
|------|---------------------|
| Account CRUD · starting balance · cash movements · capital prefs · master-DD $ witness API | **Landed** (Accounts-Capital L/A/F; migrations 110–114; `/accounts-capital` shell) |
| Accounts & Capital **Fidelity-style** summary card, embedded marked positions, deployability pair | **Not built** — this Spec |
| Trade Log **single-account** Positions mode (open book, no marks join) | **Partial as-built** — upgrade path is this Spec’s Positions surface |
| Shared `market_live_marks` stream + Mag 7 (and extendable) universe | **As-built** (084–087) — Monday check = heartbeat |
| Marks as capital / Trade Log consumer registration | **Spec obligation** (India note — §8) |
| Campaign undirected null stamp · registry deliberate-only | **Landed** (Amendment path) |
| Options chain marks | **Not sanctioned** — degrade at cost |
| Match-cash calibration | **Open OD-MC** — Coach ratification required before cash is front-of-surface |

Ship order (revised after L/A/F land):

1. Marks consumer registration + valuation endpoint (equity mid path).  
2. **Positions view** upgrade (cross-account, marks, Day G/L, chip filters).  
3. Accounts & Capital layout upgrade (summary card, account sections, compact embedded positions).  
4. Campaign badge wear + Undirected filter chip on Positions (registry-backed).  
5. Options mark path (later, when sanctioned).  
6. Stated account value field (if not already present) + per-account BP as-of polish.

---

## 3. Surface one — Accounts & Capital

### 3.1 Placement

| Item | Spec |
|------|------|
| Name | **Accounts & Capital** |
| Nav | Users menu (with Profile) — **not** Practice suite chrome |
| Route (as-built indicative) | `/accounts-capital` |
| Entitlement | Identity session; product independence (Labs-only and Practice-only both see it — Capital C9 / independence) |

### 3.2 Layout order (top → bottom)

1. **Header** — “Accounts & capital” + one right-aligned **as-of** line: mark stream heartbeat age; note that declared figures vary by row.  
2. **Summary card** (metric-card style):  
   - **Row 1:** “All accounts” · total (large). Total = Σ modeled accounts, **stated-preferred** per account, derived fallback.  
   - **Row 2** (hairline): “Tolerated drawdown · {pct}% of ${base} base” · “${tolerance} · realized ${realized_dd}”. **Dollars vs dollars** per Funding §3.4.  
   - **Row 3** (muted): “Allocations declared: {none \| $X across N campaigns} · overcommit: {none \| quiet line}”. Resting state may be honest **none**.  
3. **Account sections** (one bordered card per modeled account):  
   - Header: account name + venue/character chip left; account value right (stated-preferred).  
   - **Deployability pair:** `Cash {amount} · Buying power {amount} (stated {as-of})`. Cash always derived (match-cash); BP always declared per posture. Muted note: “stated value · derived one tap in” where applicable.  
   - **Embedded positions table** — compact column set (§5.2) + Cash row.  
   - Degradation line beneath table when any symbol lacks a mark (§6).  
4. **Footer** (muted): “Totals shown at stated value where declared. Cash is derived from starting balance, movements, and fills. Buying power is yours to keep current.”

### 3.3 Column rules unique to this surface

| Rule | Spec |
|------|------|
| Unrealized | **Last** in column order — value/composition lead |
| Day | Day **price** motion only (`mid − prev_close`) |
| Day G/L | **Omitted** on Accounts & Capital (watching surface is Positions) |
| % of account | May exceed 100%; **no warning chrome** |
| Negative cash | Plain text; debit is life, not variance |
| Valence | None (V8) |

### 3.4 Write paths on this surface (unchanged authority)

Create / rename / retire accounts · set starting balance · record fund/defund · set BP posture/value · set tolerated master DD · confirm balances as current · (later) stated account value · composition entry when Capital Ring 2 ships.

Practice and Strategy Lab **consume** accounts; they do not host parallel account write chrome.

---

## 4. Surface two — Positions (cross-account)

### 4.1 Placement

| Item | Spec |
|------|------|
| Name | **Positions** |
| Host | Trade Log shell (Practice) — mode upgrade of existing Positions secondary |
| Scope | **Cross-account** by default (upgrade from v1.1 single-account); account chips filter |
| Writes | **None** for capital. Direction redirect only (“Direct to campaign…”) |

### 4.2 Layout order

1. **Header** — “Positions” + marks as-of line (same grammar as §3.2 header).  
2. **Filter chip row** (one-filter-system pattern):  
   - `All accounts` · one chip per modeled account · asset-class chips (Equities / Options) · **one chip per registry deliberate campaign** · **Undirected**.  
   - Campaign chips from registry only (no ledger furniture).  
   - **Undirected is a filter, never a row label** (V9).  
3. **Grouped table:**  
   - Account header row (name + character)  
   - Position rows  
   - Cash row  
   - **Account total row** (surface-1 background; Day G/L · Value · Unrealized subtotals)  
   - Next account…  
   - **All accounts grand-total row** (border-strong top — only place the whole book speaks)  
4. **Footer notes** (muted):  
   - Per-book no-netting when a symbol appears in multiple accounts.  
   - Degradation note for unmarked symbols.  
   - Once: “A position shows one campaign chip when its trade is directed — and nothing at all when it isn’t.”

### 4.3 Column set (full)

Symbol · campaign chip (in symbol cell) · Last · Day · **Day G/L** · Value · % acct · Qty · Cost basis · Unrealized.

Day G/L earns its place on this watching surface. Still **no valence color**.

### 4.4 Campaign affiliation (normative — Amendment + Trade Log §17)

| State | Render |
|-------|--------|
| **Directed** | Exactly **one** chip beside structure/symbol. Identity + text from **campaign registry**; which chip from the position’s stamp (open structure inherits trade stamp). Style: accent tint pill, ~11px. |
| **Undirected** | **Nothing.** No placeholder, “unassigned,” ghost badge, or empty-slot affordance. |
| **Filter Undirected** | Shows only positions whose open trades have null campaign stamp. |

**Interaction:** Tap badge area (or row direction affordance) → **“Direct to campaign…”** redirect path. Picker: registry-eligible campaigns only (window covers fill time; status accepting); memory may pre-answer when eligible. Undirected rows get the same picker with no pre-answer.

**Kilo display case:** Adjacent rows, same underlier, one directed and one not (e.g. TSLA shares undirected beside a directed TSLA call structure) — direction belongs to **trades**, not symbols or accounts.

### 4.5 Options positions

Structure name from open book (“SPX 6420/6440/6460 fly”). Marks require chain data — **not** ship-blocking for equities path. Without options marks: degrade at cost (§6). No fabricated option mids.

---

## 5. Shared position-row component

### 5.1 Derivations

| Field | Source |
|-------|--------|
| Symbol / structure name | Open book (as-built FIFO matcher, **account-scoped**) |
| Last | `market_live_marks.mid` |
| Day | `mid − prev_close` (both from mark row) |
| Day G/L | day × qty (Positions surface only) |
| Value | mid × qty (or at-cost when degraded) |
| % acct | value ÷ account stated/derived total |
| Qty · Avg cost · Cost basis | Fills over remaining open qty; lot detail tap-deep (Fidelity Simulation acceptance path) |
| Unrealized | value − cost basis (em-dash when degraded without mid) |
| Cash row | Derived cash (match-cash — OD-MC) |
| Campaign chip | Registry × position stamp |

### 5.2 Column sets by prop

| Prop | Columns |
|------|---------|
| **compact** (Accounts & Capital embed) | Symbol · Last · Day · Value · % acct · Qty · Avg cost · Unrealized (+ Cash row) |
| **full** (Positions) | Symbol · campaign · Last · Day · Day G/L · Value · % acct · Qty · Cost basis · Unrealized (+ Cash · account/grand totals) |

### 5.3 Valuation API (Alpha)

One endpoint (indicative):

```
GET /api/me/capital/positions-valuation
  ?account_id=   # optional; omit = all modeled
  &campaign_id=  # optional deliberate filter
  &undirected=   # optional bool filter
  &asset_class=  # optional equities|options
```

**Server-side:** open book × marks join · MySQL only on hot path · recompute at read · no external fetch.

Response groups by account; includes per-account cash, totals, mark as-of / heartbeat, degradation list.

### 5.4 Two doors

Accounts & Capital embeds **compact** per account; Positions renders **full** cross-account. Same component, same endpoint. Drift is a defect (V1).

---

## 6. Honest degradation (SPCX rule)

When a symbol has **no mark** (or mark is not usable):

| Cell | Behavior |
|------|----------|
| Last / Day / Day G/L / Unrealized | Em-dash |
| Value | Cost basis, labeled **“at cost”** |
| Totals | Include at-cost values; unrealized grand total is **understated**, never guessed |
| Surface | One quiet line naming remedies: admin universe extension (as-built INSERT path) or member manual mark (stated + as-of, Staleness-tracked) |

**Forbidden:** presenting a stale mark as current; silent proxy symbols; inventing option mids; red/amber aging colors (Staleness S6).

---

## 7. Register (Tango — both surfaces)

1. No valence color on any G/L figure.  
2. P&L present, never primary.  
3. No profit chrome, streaks, or gain sparklines on these surfaces (Reports owns charting on its own terms).  
4. Undirected copy is lawful-neutral — never deficiency, never a prompt to organize.  
5. No completeness nag about unmodeled accounts (fungibility — $0.01 IRAs stay unmodeled in peace).  
6. Staleness grammar: one header as-of, two-clock where activity exists, no aging colors.  
7. Debit is life: negative cash plain.  
8. Confirm-as-current and BP refresh remain **display never demand** (Staleness S1).

---

## 8. Marks consumer registration (India)

| Obligation | Detail |
|------------|--------|
| Register | Capital + Trade Log Positions as **first-class consumers** of `market_live_marks` |
| Hot path | SELECT marks by open symbols only; no stream control from member request |
| Universe | Missing symbol → degradation (§6); remedy is universe extension or manual mark — not silent skip of the position |
| Heartbeat | Header as-of uses stream heartbeat; fail loud if config requires stream and heartbeat is dead (ops), but **do not** invent marks |
| No second store | Do not cache valuation series in member tables |

---

## 9. Dependencies

| # | Item | State |
|---|------|--------|
| 1 | Shared marks stream + universe | As-built |
| 2 | Marks consumer registration + valuation API | **This Spec** |
| 3 | Match-cash calibration (OD-MC) | **Coach ratification required** |
| 4 | Starting balances + movements | **Landed** (Funding / Capital L/A/F) |
| 5 | Stated account value + per-account BP | Partial (prefs BP); stated **account value** may need schema field |
| 6 | Campaign registry + undirected stamps | **Landed** |
| 7 | Badge wear on Positions | **This Spec** |
| 8 | Options mark path | Queued / not sanctioned |

---

## 10. Open dispositions (Coach)

| ID | Question | Proposal default |
|----|----------|------------------|
| **OD-D1** | Day G/L on Accounts & Capital? | **Off** (this Spec §3.3) |
| **OD-D2** | Day-change line on summary card? | **Omit** (outcome-watching risk) |
| **OD-D3** | Account grouping sections (Investment / Retirement)? | **Deferred — not adopted** |
| **OD-D4** | 52-week range column? | **Deferred-preserved** (needs cached daily bars off hot path) |
| **OD-MC** | Match-cash calibration convention | **Blocking for front-of-surface cash** — Hotel + Coach; until locked, cash may show derived balance-curve cash with explicit “provisional” note or hide deployability pair |
| **OD-SV** | Stated account value storage | Prefer single declared field + as-of on account; else stated-preferred = derived only until field ships |

---

## 11. Non-goals

- Platform margin engine or live buying-power enforcement  
- Cross-account position **netting**  
- Stored mark-to-market history SoR  
- Fabricated or broker-scraped option marks without a sanctioned path  
- Profit theater / valence  
- Parallel account write chrome outside Accounts & Capital  
- Ledger furniture, undirected labels, or ghost badges  
- Journey scoring input from these surfaces (Goodhart)  
- Live broker BP sync (Capital P6 — out of this Spec’s critical path)

---

## 12. Acceptance (Kilo)

1. Both surfaces render the same component; column sets differ by declared prop only.  
2. Equity row: value = mid × qty; unrealized = value − cost basis; reconciles against approved fixture when provided.  
3. Unmarked symbol degrades per §6; grand totals understate rather than guess.  
4. Account totals = Σ position values + derived cash; summary card reconciles to the penny when all marks present.  
5. Same-symbol rows across accounts never net; multi-book footer line renders when applicable.  
6. Directed position: exactly one registry chip. Undirected: zero visual tokens. Adjacent same-underlier directed/undirected case holds.  
7. Undirected **filter** chip scopes correctly; no row carries an “undirected” label.  
8. % acct > 100% renders without warning chrome.  
9. Surface hot path performs zero external market fetches; marks read from MySQL SoR.  
10. No red/green valence; no per-cell timestamps; one header as-of.  
11. Day G/L present on Positions, absent on Accounts & Capital embed.  
12. Capital write paths remain exclusive to Accounts & Capital (grep gate).

---

## 13. Review gates

| Holder | Focus |
|--------|--------|
| **Echo** | Layout fidelity to approved mockups; density vs HIG; chip row scaling with many campaigns |
| **Tango** | §7 register; OD-D1/D2; undirected absence copy |
| **India** | Marks consumer registration; derived-at-read; no second store; registry read for chips; stated value schema |
| **Alpha** | Valuation endpoint; hot-path MySQL-only; open-book join |
| **Charlie** | One component, two doors; Positions filter integration with Trade Log shell |
| **Hotel** | Derivation arithmetic; degradation honesty in totals; **OD-MC** match-cash sign-off |
| **Mike** | Family B / export if valuation snapshots ever leave the device (prefer none) |
| **Kilo** | §12 |
| **Lima** | DL entry: surface adoption; calibration dependency; marks consumer registration |
| **Delta** | Ternary gate after implementation seeds |

---

## 14. Relationship to Accounts-Capital program

| Phase already gated | This Spec adds |
|---------------------|----------------|
| L — undirected stamp | Badge absence on positions is consistent |
| A — Accounts & Capital shell | **Layout upgrade** + embedded marked positions |
| F — movements + curves + master DD $ | Summary card rows 1–2 consume those numbers |
| C / S / Z (queued) | Composition line on summary; staleness chrome; solved size not required on these tables |

Implementation board may extend `agents/p-accounts-capital/` with surface seeds (e.g. **P-view***) or open a sibling board — Juliet chooses; product law is this Spec.

---

## 15. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.1** | 2026-08-09 | Formalized from Design Proposal v1.0; as-built L/A/F honesty; laws V1–V16; OD-MC/OD-SV; ship order revised. |

---

*Money is campaign-blind. Marks are shared. Undirected is silence. Two doors, one truth — never invent a number to fill a cell.*
