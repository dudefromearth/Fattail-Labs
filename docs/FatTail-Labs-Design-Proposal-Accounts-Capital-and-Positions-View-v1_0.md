# FatTail Labs — Design Proposal: Accounts & Capital and the Positions View

**Doc:** `FatTail-Labs-Design-Proposal-Accounts-Capital-and-Positions-View-v1_0.md`
**Status:** PROPOSAL v1.0 — Coach-approved layouts from mockup session 2026-08-09; **formalized** as Spec for review  
**Formal Spec (for ratification):** [`Specs/FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md`](../Specs/FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md) (v0.1 superseded; Advisor PV-1…PV-7 folded)  
**Supersedes for layout:** Surface Directive — Accounts & Capital Summary and Rows v0.1 · Surface Directive — Account Positions View v0.1 (both fold into the Spec)
**Parents:** Capital and Position Sizing Spec (v0.3 line) · Funding and Defunding Spec (v0.2 line) · Staleness Awareness Spec v0.1 · Campaign Amendment v1.0.1 (Top Level Is the Account) · Drawdown Base Addendum v0.1 · Trade Log Spec v1.1 · Fidelity Simulation acceptance scenario v0.1 (fixture)
**Hard dependency:** Trade Log / capital surfaces read `market_live_marks` (as-built shared stream, migrations 084–087) — the "marks wiring." Wiring note to be folded into the spec by Grok as a consumer registration (India gate).
**Reference pattern:** Fidelity accounts panel + positions view (Coach screenshots, 2026-08-09), adopted structurally, translated into the FatTail register.

---

## 0. What this proposes

Two surfaces, one shared component family, all numbers derived or declared — never typed into the view:

1. **Accounts & Capital** (identity level, users menu) — summary card, account sections with embedded positions.
2. **Positions** (practice level, the upgrade of Trade Log's existing Positions mode) — cross-account grouped table with campaign badges and filters.

Both render the same position-row component fed by the same valuation API — one implementation, two doors, no drift.

---

## 1. Surface one — Accounts & Capital

### 1.1 Layout order (top to bottom)

1. **Header:** "Accounts & capital" + one as-of line, right-aligned: mark freshness (stream heartbeat age) with note that declared figures vary by row. One line for the whole surface; never per-cell timestamps.
2. **Summary card** (metric-card style):
   - Row 1: "All accounts" · total (24px). Total = Σ modeled accounts, stated-preferred per account, derived fallback.
   - Row 2 (hairline above): "Tolerated drawdown · {pct}% of ${base} base" · "${tolerance} · realized ${realized_dd}". Dollars vs dollars per Drawdown Base Addendum §3.
   - Row 3 (muted): "Allocations declared: {none | $X across N campaigns} · overcommit: {none | quiet line}". Resting state renders honestly as "none".
3. **Account sections** (one bordered card per modeled account):
   - Header row: account name + venue/character chip ("Fidelity · margin") left; account value right (stated-preferred).
   - **Deployability pair line:** `Cash −$116,206.74 · Buying power $250,000 (stated {as-of})`. Cash always derived (match-cash calibration); BP always declared per posture with as-of. Right-aligned muted note: "stated value · derived one tap in".
   - **Embedded positions table** (§3 component, compact column set: Symbol · Last · Day · Value · % acct · Qty · Avg cost · Unrealized) + Cash row.
   - Degradation line beneath table when any symbol lacks a mark (§3.4).
4. **Footer line (muted):** "Totals shown at stated value where declared. Cash is derived from starting balance, movements, and fills. Buying power is yours to keep current."

### 1.2 Decisions locked in the mockup

- **Unrealized sits last** in column order — value and composition lead; G/L columns inboard/trailing (process-first).
- **No Day G/L column on this surface** — day price motion only (Day column). Day G/L belongs to the Positions view (§2), which is a watching surface by nature.
- **No valence color anywhere** — gains and losses in standard text color. Same law that keeps blotter tints from being win/loss tints.
- % of account may exceed 100% (TSLA 153%) and renders without warning chrome — it is the deployability story stated plainly.
- Negative cash renders plainly. Debit is life, not variance.

---

## 2. Surface two — Positions (cross-account)

### 2.1 Layout order

1. **Header:** "Positions" + marks as-of line.
2. **Filter chip row** — the one-filter-system pattern extended:
   - `All accounts` · one chip per account · asset-class chips (Equities / Options) · **one chip per registry campaign** · **Undirected**.
   - Campaign chips come from the campaign registry (deliberate campaigns only — no ledger rows exist post-amendment).
   - **Undirected is a filter, never a label** (see §2.3).
3. **Grouped table:** account header row (name + character) → position rows → Cash row → **Account total row** (surface-1 background; Day G/L · Value · Unrealized totals) → next account → **All accounts grand-total row** (border-strong top; the only place the whole book speaks).
4. **Footer notes (muted):** per-book no-netting line when a symbol appears in multiple accounts ("TSLA held in both accounts — shown per book, never netted"); degradation note for unmarked symbols.

### 2.2 Column set (full)

Symbol · campaign chip (in the symbol cell) · Last · Day · **Day G/L** · Value · % acct · Qty · Cost basis · Unrealized. Day G/L earns its place here (watching surface); still no valence color.

### 2.3 Campaign affiliation — the badge rules (normative, from Campaign Amendment)

| State | Render |
|---|---|
| **Directed** | Exactly **one** chip beside the structure/symbol name. Chip identity + text from the **campaign registry**; which chip from the position's stamp. Legs inherit the parent trade's direction — one chip per position, never per leg. Chip style: `bg-accent` tint pill, 11px. |
| **Undirected** | **Nothing.** No placeholder, no "unassigned" label, no ghost/gray badge, no empty-slot affordance. Absence is the design — any visual token for "no campaign" recreates the ledger as chrome. |
| Footer states it once | "A position shows one campaign chip when its trade is directed — and nothing at all when it isn't. Undirected is a lawful resting state, not a gap to fill." |

**Interaction:** tapping the badge area (or the row's direction affordance in the sheet) opens **"Direct to campaign…"** — the redirect path. Picker offers only registry-eligible campaigns (window covers the fill's time, status accepting), pre-answered by memory when eligible; an undirected row gets the same picker with no pre-answer. Registry dispenses, position wears, only the member moves.

**Kilo display case:** adjacent rows, same underlier, one directed one not (TSLA shares undirected beside a directed TSLA call spread) — direction belongs to trades, not symbols, not accounts.

### 2.4 Options positions

Option structures render as position rows named by structure ("SPX 6420/6440/6460 fly"). Options **marks** require chain data — a larger dependency than equity mids. Ship equities-marked first; option structures degrade to cost-basis display under the same rule as unmarked equities (§3.4) until an options mark path is sanctioned. No fabricated option marks, ever.

---

## 3. The shared position-row component

### 3.1 Derivations (nothing typed into the view)

| Field | Source |
|---|---|
| Symbol / structure name | Open book (as-built FIFO matcher, account-scoped) |
| Last | `market_live_marks.mid` |
| Day | `mid − prev_close` (both stored per mark) |
| Day G/L | day × qty |
| Value | mid × qty |
| % acct | value ÷ account stated/derived total |
| Qty · Avg cost · Cost basis | Fills (avg over remaining open qty; lot detail tap-deep per Fidelity Simulation §4a) |
| Unrealized | value − cost basis |
| Cash row | Derived cash (match-cash calibration — **requires that convention ratified**) |
| Campaign chip | Registry (identity/text) × position stamp (which) |

### 3.2 API shape (Alpha)

One valuation endpoint: open book × marks join, computed server-side, MySQL reads only on the hot path (stream process owns Massive — surface load never fetches externally; DL-231 family rule). No stored valuation series (no second store); recompute at read.

### 3.3 Two doors, one component

Accounts & Capital embeds the compact column set per account; Positions renders the full set cross-account. Same component, same endpoint, column set by prop. Divergence between the two surfaces is a defect.

### 3.4 Honest degradation (the SPCX rule)

No mark → no fabricated numbers: Last/Day/Day G/L/Unrealized em-dash; Value shows cost basis labeled "at cost"; one quiet line naming the remedies (admin universe extension — one-line INSERT, as-built — or member manual mark, stated with as-of, staleness-tracked). Never a stale mark presented as current; never a silent proxy. Degradation propagates honestly into totals (grand-total unrealized is understated, not guessed).

---

## 4. Register rules (Tango — both surfaces)

1. No valence color on any G/L figure. Facts in one voice.
2. P&L present, never primary: value/composition lead, G/L trails.
3. No profit chrome, streaks, or gain sparklines (Sacred #8 adjacency; Reports owns charting on its own terms).
4. Undirected copy is lawful-neutral — never deficiency, never a prompt to organize.
5. No completeness nag about unmodeled accounts (fungibility — the $0.01 IRAs stay unmodeled in peace).
6. Staleness per the Staleness Spec grammar: one header as-of line, two-clock where activity exists, no aging colors.
7. Debit is life: negative cash plain.

---

## 5. Dependencies and sequencing

| # | Item | State |
|---|---|---|
| 1 | Shared marks stream + Mag 7 universe | **As-built** (migrations 084–087, DL-222–224). Monday check = heartbeat, not build |
| 2 | Marks wiring (capital/Trade Log as marks consumers) | Spec note needed — consumer registration, India |
| 3 | Match-cash calibration convention | **Coach ratification required** — cash is front-of-surface in both views |
| 4 | Starting balances + movements (Capital P1 / Funding F1) | Specced, unbuilt |
| 5 | Stated account value + per-account BP posture (schema per Fidelity Simulation §5) | Specced, unbuilt |
| 6 | Campaign registry + badges | Campaign amendment chain; badges appear on Positions when it lands |
| 7 | Options mark path | Not sanctioned; degrade at cost until it is |

Ship order proposal: 2 → equity-marked Positions view on as-built open book → 4/5 → Accounts & Capital full page → 6 badges → later 7.

## 6. Open dispositions (Coach)

1. **Day G/L on Accounts & Capital** — proposal keeps it off (this doc §1.2); confirm.
2. **Day-change line on summary card** — currently omitted; Tango weighs outcome-watching risk (carried from directive v0.1).
3. **Account grouping sections (Investment/Retirement)** — deferred-not-adopted (carried).
4. **52-week range column** — deferred-preserved; needs cached daily bars off the hot path (carried).

## 7. Acceptance sketch (for the spec)

1. Both surfaces render the same component; column sets differ by declared prop only.
2. TSLA row: value = mid × qty; unrealized = value − cost basis; reconciles against the Fidelity fixture.
3. SPCX degrades per §3.4; grand totals understate rather than guess.
4. Account totals = Σ values + derived cash; summary card reconciles to the penny.
5. Same-symbol rows across accounts never net; footer line renders.
6. Directed position: exactly one chip, registry-sourced. Undirected: zero visual tokens. Adjacent same-underlier case renders per §2.3.
7. Undirected filter chip scopes correctly; no row carries an "undirected" label.
8. % acct >100% renders without warning chrome.
9. Surface hot path performs zero external fetches; marks read from MySQL SoR.
10. No red/green valence anywhere; no per-cell timestamps; one header as-of.

## 8. Gates

| Holder | Question |
|---|---|
| Echo | Layout fidelity to approved mockups; density vs HIG; chip row scaling with many campaigns |
| Tango | §4 register; dispositions 1–2 |
| India | Marks consumer registration; derived-at-read; no second store; registry read for chips |
| Alpha | Valuation endpoint; hot-path MySQL-only |
| Charlie | One component, two doors; filter integration with existing Trade Log filter system |
| Hotel | Derivation arithmetic; degradation honesty in totals |
| Kilo | §7 |
| Lima | Adoption + placement DL entry; calibration-convention dependency noted |

---

## 9. Mockup record

Three approved mockups from the 2026-08-09 session define the layouts this proposal encodes: (1) Accounts & Capital full page — summary card with drawdown context, two account sections, embedded tables, SPCX degradation; (2) Positions view — chip row, account grouping, per-book totals, grand total, no-netting footer; (3) Campaign badges — directed chips, undirected absence, filter-not-label. Where prose and mockup conflict, the mockup's layout intent wins and the conflict is flagged to Coach.
