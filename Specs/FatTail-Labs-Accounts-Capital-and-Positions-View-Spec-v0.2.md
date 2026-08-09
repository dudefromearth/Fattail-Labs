# FatTail Labs — Accounts & Capital and Positions View Spec v0.2

**Status:** DRAFT — for Coach ratification and bench review (not as-built)  
**Date:** 2026-08-09  
**Supersedes:** [v0.1](./FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.1.md)  
**Type:** Product / UX / architecture authority — **identity money surface presentation** and **cross-account positions valuation view**  
**Source proposal:** [`docs/FatTail-Labs-Design-Proposal-Accounts-Capital-and-Positions-View-v1_0.md`](../docs/FatTail-Labs-Design-Proposal-Accounts-Capital-and-Positions-View-v1_0.md) (Coach-approved layouts, mockup session 2026-08-09)  
**Review:** Advisor review 2026-08-09 (PV-1…PV-7) folded — see [`docs/Advisor-Review-Response-Positions-View-Spec-2026-08-09.md`](../docs/Advisor-Review-Response-Positions-View-Spec-2026-08-09.md)  
**Supersedes for layout:** Surface Directive — Accounts & Capital Summary and Rows v0.1 · Surface Directive — Account Positions View v0.1 (folded here)

**Parents / companions (normative where noted):**

| Spec | Role |
|------|------|
| [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) | Rings, fungibility, Accounts & Capital ownership (C9), witnesses |
| [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) | **Owns** balance vs trading curves; master-DD **$** meeting point (PV-7 carried: Advisor has not re-verified §3.4 text — this Spec inherits it) |
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

Both render the same position-row component fed by the **same valuation API**.

**V1 scope (Advisor PV-3):** Shared **position-row fields** must never diverge between doors. **Account-level totals may lawfully differ by definition** — stated-preferred on Accounts & Capital vs marked-derived on Positions — and that difference is explained, not treated as a defect.

This Spec does **not** re-own capital arithmetic. Balance, trading curve, and master-DD dollars remain Funding Spec authority. This Spec owns **presentation, valuation join, degradation honesty, and campaign-badge wear on positions**.

---

## 1. Laws

| ID | Law |
|----|-----|
| **V1 — Two doors, one component** | Accounts & Capital and Positions share one position-row implementation and one valuation endpoint; column set is a declared prop only. **Scope:** shared **row fields** (Last, Day, Value, Qty, cost, Unrealized, chip). Account-level **totals** may differ by definition (V5 vs Positions Σ marked + cash) — see §0 / §5.4. |
| **V2 — Nothing typed into the view** | All position fields are derived (fills, open book, marks) or declared with as-of (stated account value, BP). Members edit capital facts on Accounts & Capital write paths — not by overwriting cells in the table. |
| **V3 — Marks from SoR only** | Hot path reads MySQL (`market_live_marks` + open book). Stream process owns Massive/universe. Surface load never fetches externally. |
| **V4 — No second valuation store** | No stored mark-to-market series or equity curve SoR for these views. Recompute at read. |
| **V5 — Stated-preferred totals (Accounts & Capital)** | On Accounts & Capital, account **value** prefers member-stated account value when set; else derived (open position values + cash). Summary card totals Σ modeled accounts under the same rule. **Until OD-SV field ships, stated-preferred collapses to derived-only** (Advisor PV-6) — V5 is not vacuous by accident; it is staged. |
| **V5a — Marked-derived totals (Positions)** | On Positions, account-total and grand-total rows = **Σ marked (or at-cost) position values + derived cash** for that scope. Not stated-preferred. |
| **V6 — Cash is derived** | Cash row uses **match-cash calibration** (once ratified — OD-MC). Never typed; never inferred from broker APIs in v1. **Until OD-MC is ratified, Cash is omitted from the deployability pair** (Advisor PV-4) — never show a known-wrong balance-curve cash with a “provisional” tag. |
| **V7 — Buying power is declared, per account** | BP never derived from positions. **Posture + value + as-of live on the account row** (Fidelity fixture falsifies identity-level single BP — Advisor PV-2). See §2 / dependency #5a. |
| **V8 — No valence color** | Gains and losses use standard text color. Open/close tints on blotter remain structure tints, not win/loss. |
| **V9 — Undirected is absence** | Undirected positions show **no** campaign chip, placeholder, ghost badge, or “unassigned” token. Undirected is a **filter chip**, never a row label. |
| **V10 — One chip when directed** | Directed open structure: exactly **one** registry-sourced campaign chip on the position row. Legs inherit the trade stamp; never one chip per leg. |
| **V11 — Never net across accounts** | Same symbol in two books = two rows. Footer may name the multi-book case once. |
| **V12 — Honest degradation** | **No usable mark** (absent or stream-flagged unusable) → em-dash on mark-dependent cells; Value may show cost basis labeled “at cost”; quiet remedies line. Totals understate rather than invent. **Closed-market age is not degradation** — see §6.1 (Advisor PV-1). |
| **V13 — No fabricated option marks** | Equity mids first. Option structures without a sanctioned options mark path degrade at cost. |
| **V14 — One as-of line** | Surface header carries mark freshness with **true age** (e.g. “Marks as of 4:00 pm Fri”) and notes that declared figures vary by row. No per-cell timestamps. |
| **V15 — P&L present, not primary** | Value and composition lead; G/L columns trail. No gain sparklines, streaks, or profit chrome on these surfaces. |
| **V16 — Sole capital write path** | Account create/retire, starting balance, movements, **per-account** BP, tolerance, confirm-as-current remain Accounts & Capital only (Capital C9 · Funding F9). Positions view is read + direction redirect only. |
| **V17 — Stale-for-ticking ≠ unusable-for-valuation** | `LABS_MARK_STALE_SECONDS` (and Curate tick logic) governs **ticking / bot freshness**. Valuation surfaces use the **latest stored mark** and show its age in the header. They do **not** em-dash the whole book because the market is closed (Advisor PV-1). |

---

## 2. As-built honesty (2026-08-09)

| Area | Status vs this Spec |
|------|---------------------|
| Account CRUD · starting balance · cash movements · capital prefs (tolerance, confirm) · master-DD $ witness API | **Landed** (Accounts-Capital L/A/F; migrations 110–114; `/accounts-capital` shell) |
| **Buying power** | **Landed identity-level** in `member_capital_prefs` (`buying_power_*`) — **contradicts V7 / deployability pair** for multi-account members (Advisor PV-2). **Migration required:** move posture/value/as-of to account row (dependency #5a). Identity-level prefs may keep **portfolio-level** tolerance / confirm only. |
| Accounts & Capital **Fidelity-style** summary card, embedded marked positions, deployability pair | **Not built** — this Spec |
| Trade Log **single-account** Positions mode (open book, no marks join) | **Partial as-built** — upgrade path is this Spec’s Positions surface |
| Shared `market_live_marks` stream + Mag 7 (and extendable) universe | **As-built** (084–087) — Monday check = heartbeat |
| Marks as capital / Trade Log consumer registration | **Spec obligation** (India — §8) |
| Campaign undirected null stamp · registry deliberate-only | **Landed** (Amendment path) |
| Options chain marks | **Not sanctioned** — degrade at cost |
| Match-cash calibration | **Open OD-MC** — Coach ratification **blocks Cash on deployability pair** (not a provisional figure) |

### Ship order (revised after L/A/F + Advisor PV)

1. Marks consumer registration + valuation endpoint (equity mid path) + **weekend rule** (§6.1).  
2. **#5a** Per-account BP migration (from identity prefs) — **before** deployability pair ships multi-account.  
3. **Positions view** upgrade (cross-account, marks, Day G/L, chip filters).  
4. Accounts & Capital layout upgrade (summary card, account sections, compact embedded positions).  
5. Campaign badge wear + Undirected filter chip on Positions (registry-backed).  
6. OD-SV stated account value field (when ready); OD-MC then Cash on deployability pair.  
7. Options mark path (later, when sanctioned).

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

1. **Header** — “Accounts & capital” + one right-aligned **as-of** line: mark true age (§6.1), e.g. “Marks as of 4:00 pm Fri”; note that declared figures vary by row.  
2. **Summary card** (metric-card style):  
   - **Row 1:** “All accounts” · total (large). Total = Σ modeled accounts, **stated-preferred** per account (V5; derived-only until OD-SV).  
   - **Row 2** (hairline): “Tolerated drawdown · {pct}% of ${base} base” · “${tolerance} · realized ${realized_dd}”. **Dollars vs dollars** per Funding §3.4 (PV-7: inherit; re-verify upstream if needed).  
   - **Row 3** (muted): “Allocations declared: {none \| $X across N campaigns} · overcommit: {none \| quiet line}”. Resting state may be honest **none**.  
3. **Account sections** (one bordered card per modeled account):  
   - Header: account name + venue/character chip left; account value right (stated-preferred / V5).  
   - **Deployability pair:**  
     - **Buying power** always: `{amount} (stated {as-of})` per **account** (V7).  
     - **Cash** only when OD-MC is ratified: match-cash derived figure. **If OD-MC open: omit Cash; show BP alone** (PV-4).  
     - Muted note: “stated value · derived one tap in” where applicable.  
   - **Embedded positions table** — compact column set (§5.2) + Cash row (table Cash still requires OD-MC for match-cash; until then Cash row may use Funding balance-curve cash **only if** labeled as book balance, not deployable cash — prefer omit Cash row until OD-MC).  
   - Degradation line beneath table when any symbol has **no usable mark** (§6) — not when marks are merely closed-market-old.  
4. **Footer** (muted): “Totals shown at stated value where declared. Cash is derived (match-cash) when shown. Buying power is yours to keep current.” Optional quiet line when stated total ≠ marked-derived total: “Stated value differs from mark-to-market by $X” (marks-gap honesty — PV-3).

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

Create / rename / retire accounts · set starting balance · record fund/defund · set **per-account** BP posture/value/as-of · set tolerated master DD (identity prefs) · confirm balances as current · (OD-SV) stated account value · composition entry when Capital Ring 2 ships.

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

1. **Header** — “Positions” + marks as-of line (true age — §6.1).  
2. **Filter chip row** (one-filter-system pattern):  
   - `All accounts` · one chip per modeled account · asset-class chips (Equities / Options) · **one chip per registry deliberate campaign** · **Undirected**.  
   - Campaign chips from registry only (no ledger furniture).  
   - **Undirected is a filter, never a row label** (V9).  
3. **Grouped table:**  
   - Account header row (name + character)  
   - Position rows  
   - Cash row (OD-MC; omit until ratified — same law as §3.2)  
   - **Account total row** — **marked-derived** (V5a): Day G/L · Value · Unrealized subtotals + cash when shown  
   - Next account…  
   - **All accounts grand-total row** (border-strong top — only place the whole book speaks)  
4. **Footer notes** (muted):  
   - Per-book no-netting when a symbol appears in multiple accounts.  
   - Degradation note for symbols with **no usable mark**.  
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
| Last | `market_live_marks.mid` (latest stored; age in header — §6.1) |
| Day | `mid − prev_close` (both from mark row) |
| Day G/L | day × qty (Positions surface only) |
| Value | mid × qty (or at-cost when degraded for **absent/unusable** mark) |
| % acct | value ÷ account total appropriate to surface (stated-preferred on A&C when set; marked-derived on Positions) |
| Qty · Avg cost · Cost basis | Fills over remaining open qty; lot detail tap-deep (Fidelity Simulation acceptance path) |
| Unrealized | value − cost basis (em-dash only when no usable mid) |
| Cash row | Match-cash after OD-MC; omit until then |
| Campaign chip | Registry × position stamp |

### 5.2 Column sets by prop

| Prop | Columns |
|------|---------|
| **compact** (Accounts & Capital embed) | Symbol · Last · Day · Value · % acct · Qty · Avg cost · Unrealized (+ Cash row when OD-MC) |
| **full** (Positions) | Symbol · campaign · Last · Day · Day G/L · Value · % acct · Qty · Cost basis · Unrealized (+ Cash when OD-MC · account/grand totals) |

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

Response groups by account; includes:

- position rows with shared fields  
- per-account **marked-derived** totals (always)  
- per-account **stated** value when OD-SV set (for A&C door)  
- mark as-of / heartbeat / `marks_as_of` wall time  
- degradation list (**absent / unusable** symbols only — not closed-market age)  
- optional `stated_vs_marked_gap` for marks-gap line  

### 5.4 Two doors

Accounts & Capital embeds **compact** per account; Positions renders **full** cross-account. Same component, same endpoint for **row fields**.

| Level | Must match across doors? |
|-------|---------------------------|
| Position-row fields | **Yes** — drift is a defect (V1) |
| Account total definition | **No** — A&C stated-preferred (V5) vs Positions marked-derived (V5a); explain gap, do not force equal (PV-3) |

---

## 6. Honest degradation and mark age

### 6.1 Weekend / closed-market rule (Advisor PV-1) — normative

| Concept | Definition | Behavior on these surfaces |
|---------|------------|----------------------------|
| **Stale-for-ticking** | Age exceeds `LABS_MARK_STALE_SECONDS` (default 60) or Curate tick policy | Relevant to **bot / live tick** consumers. **Does not** force valuation cells to em-dash. |
| **Unusable mark** | No row in `market_live_marks`, or stream/admin flags the mark unusable | **Degrade** that symbol per §6.2 |
| **Usable mark with age** | Latest mid/prev_close present; market may be closed | **Render** Last / Day / Value / Unrealized from latest mark; header as-of carries **true age** (“as of 4:00 pm Fri”) |

**Law restated:** “Never present a stale mark **as if it were current**” means **never hide its age** — not **never show an old mark**. Approved mockups require weekend rendering with honest as-of.

### 6.2 No usable mark (SPCX rule)

When a symbol has **no mark** or a mark flagged unusable:

| Cell | Behavior |
|------|----------|
| Last / Day / Day G/L / Unrealized | Em-dash |
| Value | Cost basis, labeled **“at cost”** |
| Totals | Include at-cost values; unrealized grand total is **understated**, never guessed |
| Surface | One quiet line naming remedies: admin universe extension (as-built INSERT path) or member manual mark (stated + as-of, Staleness-tracked) |

**Forbidden:** silent proxy symbols; inventing option mids; red/amber aging colors (Staleness S6); treating closed-market age as missing mark.

### 6.3 Dead heartbeat mid-session (Advisor PV-5)

When stream heartbeat is dead or stopped:

- **Member:** latest marks still render; header as-of ages honestly (same as closed market). **No** whole-book em-dash cascade.  
- **Ops:** fail loud / alarm separately (config, process supervisor) — member surface does not invent marks and does not pretend the stream is live.

---

## 7. Register (Tango — both surfaces)

1. No valence color on any G/L figure.  
2. P&L present, never primary.  
3. No profit chrome, streaks, or gain sparklines on these surfaces (Reports owns charting on its own terms).  
4. Undirected copy is lawful-neutral — never deficiency, never a prompt to organize.  
5. No completeness nag about unmodeled accounts (fungibility — $0.01 IRAs stay unmodeled in peace).  
6. Staleness grammar: one header as-of with true age, two-clock where activity exists for **declared** capital figures, no aging colors.  
7. Debit is life: negative cash plain.  
8. Confirm-as-current and BP refresh remain **display never demand** (Staleness S1).  
9. Never label a known-wrong cash figure “provisional” (PV-4).

---

## 8. Marks consumer registration (India)

| Obligation | Detail |
|------------|--------|
| Register | Capital + Trade Log Positions as **first-class consumers** of `market_live_marks` |
| Hot path | SELECT marks by open symbols only; no stream control from member request |
| Universe | Missing symbol → degradation (§6.2); remedy is universe extension or manual mark — not silent skip of the position |
| Heartbeat | Header as-of uses true mark age / heartbeat wall time; dead heartbeat → §6.3 member behavior |
| Stale tick | Do **not** apply `LABS_MARK_STALE_SECONDS` as a valuation blanking rule (V17) |
| No second store | Do not cache valuation series in member tables |
| **Per-account BP** | Schema migration from identity `capital_prefs` BP columns → account columns (dependency #5a); India confirms land shape before implementers invent dual write |

---

## 9. Dependencies

| # | Item | State |
|---|------|--------|
| 1 | Shared marks stream + universe | As-built |
| 2 | Marks consumer registration + valuation API + **weekend rule** | **This Spec** |
| 3 | Match-cash calibration (OD-MC) | **Coach ratification required** — blocks Cash on deployability pair |
| 4 | Starting balances + movements | **Landed** |
| **5a** | **Per-account BP** posture/value/as-of migration | **Named gap** — identity-level landed; **must move** for multi-account deployability (PV-2). Not “polish.” |
| 5b | Stated account value + as-of (OD-SV) | Not landed; until then V5 = derived-only |
| 6 | Campaign registry + undirected stamps | **Landed** |
| 7 | Badge wear on Positions | **This Spec** |
| 8 | Options mark path | Queued / not sanctioned |
| 9 | Funding §3.4 arithmetic (PV-7) | Specced in Funding v0.2; Advisor re-verify if needed — this Spec inherits |

---

## 10. Open dispositions (Coach)

| ID | Question | Proposal default |
|----|----------|------------------|
| **OD-D1** | Day G/L on Accounts & Capital? | **Off** (this Spec §3.3) |
| **OD-D2** | Day-change line on summary card? | **Omit** (outcome-watching risk) |
| **OD-D3** | Account grouping sections (Investment / Retirement)? | **Deferred — not adopted** |
| **OD-D4** | 52-week range column? | **Deferred-preserved** (needs cached daily bars off hot path) |
| **OD-MC** | Match-cash calibration convention | **Blocking for Cash on deployability pair and match-cash Cash rows.** Until locked: **omit Cash** (BP alone on the pair). **No provisional / balance-curve cash** (PV-4). Hotel + Coach. |
| **OD-SV** | Stated account value storage | Prefer single declared field + as-of on account. **Interim:** stated-preferred = derived-only (PV-6). |

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
- Using tick-stale threshold to blank weekend marks  

---

## 12. Acceptance (Kilo)

1. Both surfaces render the same component for **row fields**; column sets differ by declared prop only.  
2. Equity row: value = mid × qty; unrealized = value − cost basis; reconciles against approved fixture when provided.  
3. Symbol with **no usable mark** degrades per §6.2; grand totals understate rather than guess.  
4. **Positions** account totals = Σ position values + cash (when OD-MC); reconcile marked path to the penny when all marks present.  
5. **Accounts & Capital** summary uses stated-preferred (or derived-only until OD-SV); **may differ** from Positions marked-derived totals when stated value is set — marks-gap line explains (PV-3). Not a defect.  
6. Same-symbol rows across accounts never net; multi-book footer line renders when applicable.  
7. Directed position: exactly one registry chip. Undirected: zero visual tokens. Adjacent same-underlier directed/undirected case holds.  
8. Undirected **filter** chip scopes correctly; no row carries an “unassigned”/undirected label.  
9. % acct > 100% renders without warning chrome.  
10. Surface hot path performs zero external market fetches; marks read from MySQL SoR.  
11. No red/green valence; no per-cell timestamps; one header as-of with **true age**.  
12. Day G/L present on Positions, absent on Accounts & Capital embed.  
13. Capital write paths remain exclusive to Accounts & Capital (grep gate).  
14. **Weekend / closed market:** with Friday close marks and dead tick clock, surfaces still show Last/Value; header reads true as-of — **not** whole-book em-dash (PV-1).  
15. **Dead heartbeat mid-session:** latest marks remain; as-of ages; no invent; no cascade blanking (PV-5).  
16. **Deployability Cash:** absent until OD-MC; never “provisional” balance-curve cash (PV-4).  
17. **Per-account BP:** multi-account member can set distinct BP per book after #5a migration (PV-2).  

---

## 13. Review gates

| Holder | Focus |
|--------|--------|
| **Echo** | Layout fidelity to approved mockups; density vs HIG; chip row scaling; marks-gap line |
| **Tango** | §7 register; OD-D1/D2; undirected absence; no provisional-cash copy |
| **India** | Marks consumer registration; V17 weekend rule; **#5a per-account BP migration**; no second store; registry chips |
| **Alpha** | Valuation endpoint; hot-path MySQL-only; open-book join; dual totals in response |
| **Charlie** | One component, two doors; Positions filter integration with Trade Log shell |
| **Hotel** | Derivation arithmetic; degradation honesty; **OD-MC** match-cash sign-off |
| **Mike** | Family B / export if valuation snapshots ever leave the device (prefer none) |
| **Kilo** | §12 including weekend + dual-total cases |
| **Lima** | DL entry: surface adoption; V17; #5a BP move; OD-MC dependency |
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
| **v0.2** | 2026-08-09 | Advisor PV-1…PV-7: weekend/valuation age rule (V17, §6.1); per-account BP migration #5a (PV-2); V1 scoped + V5a dual totals (PV-3); OD-MC omit-cash only (PV-4); dead heartbeat (PV-5); OD-SV interim (PV-6); Funding §3.4 carried note (PV-7). |
| **v0.1** | 2026-08-09 | Formalized from Design Proposal v1.0; as-built L/A/F honesty; laws V1–V16. |

---

*Money is campaign-blind. Marks are shared — and old is honest when aged. Undirected is silence. Two doors, one row truth; totals may differ by design — never invent a number to fill a cell.*
