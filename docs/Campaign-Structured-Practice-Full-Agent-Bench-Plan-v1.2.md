# Campaign Structured Practice — Full Agent Bench Plan v1.2

**Date:** 2026-08-08  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-campaign-structured-practice/`](../agents/p-campaign-structured-practice/)  
**Product law:** [`Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.2.md`](../Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.2.md)  
**Source narrative:** [`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](./Campaign-Model-Change-Structured-Practice-Instances-Bounds.md)  
**Deltas:**  
- v1.1 — Two Roles + D2–D4: [`docs/Delta-Handoff-Goal-Role-Restoration-and-Bench-Findings.md`](./Delta-Handoff-Goal-Role-Restoration-and-Bench-Findings.md)  
- v1.2 — **Campaign Journey** (§6a radar + time scrub T0→present; acceptance **#20–#23**). **D6 convexity gauge queued** (blocked on vol data-source OD) — **not in this plan**.  
**Substrate:** Concept Spec v1.0 (charter lifecycle reaffirmed) · Trade Log Spec v1.1 · lifecycle board **closed**  
**Prior plan:** [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md`](./Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md) — **superseded by this plan** as execution law  
**Guide:** `/guide` · as-built only (F1)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Mission

Ship Structured Practice through **charter teeth + Campaign Journey**:

| Pillar | Meaning |
|--------|---------|
| **Genesis · stamp · instance · restamp · names** | Laws 1–6 (substrate; largely landed) |
| **Bounds · Two Roles** | Law 7 — boundary = corridor/variance; goal = mark/progress; witness never enforce |
| **Panel** | Dual render: corridors + progress; n-floor “gathering” |
| **Campaign Journey (v1.2)** | Charter **radar** of declared bounds + **time slider T0→present**; scrub replays season biography under as-of-T bounds (§6a) |
| **Ledger ≠ charter** | Furniture has **no** bounds panel and **no** radar |

**Design invariant:** *Members are free to never think about campaigns; when they do, the season has a shape that means faithful — not big numbers.*

**Not this plan:** Journey app compass feed · Reports equity axes · stored shape-series · D6 convexity gauge · profit theater.

---

## 1. Spec v1.2 review (Campaign Journey)

### 1.1 What §6a adds

Charter **detail** (not ledger, not library list) gains:

1. **Radar chart** whose **axes = declared bounds only** (count and labels follow the charter; both **boundary** and **goal** roles, role-aware chrome).  
2. **Time slider** bound **T0 → present**, where T0 = signature time or first fill (Hotel/India pin exact rule if both exist).  
3. **Bidirectional scrub** — slider ↔ chart interaction; **reuse Journey J2 pattern** from `web/components/ProcessMeter.tsx` (timeline points + `processFromTimelineScrub` / spider), **without** sharing the Journey data plane.  
4. At scrub time **T**: shape = fills **[T0→T]** evaluated against **bounds in force at T** (same reconstruction law as variance history §5.4). Amendments bend the series at their dates; earlier shape is never rewritten.  
5. **Axis value = band-alignment** (boundaries) or **progress-toward-mark** (goals) — **never raw magnitude**. Out-of-band-high **reduces** extension (celebrate-the-drift regression).  
6. **n-floor = focus:** below validity → **gathering** (dimmed / center-pinned / undrawn — Echo). Process axes wake immediately; signature axes wake at n-floor.  
7. **Derive at render** — no `campaign_shape_series` table.

### 1.2 Four design laws (normative — do not dilute)

| # | Law | Failure mode if broken |
|---|-----|------------------------|
| 1 | Axes = declared bounds | Fixed 6-axis template lies about the charter |
| 2 | Alignment / progress, not magnitude | 85% win rate on 40–60 band spikes = celebrating the enemy curve |
| 3 | Scrub as-of-T bounds | Later amendments rewrite earlier biography |
| 4 | Gathering below n-floor | Fake precision at n=3 |

### 1.3 Acceptance #20–#23 (Delta-checkable)

| # | Criterion | Primary seeds |
|---|-----------|---------------|
| **#20** | Radar axes = declared bounds only; both roles; **zero-bound charter → 200 empty-invitation** (not fake shape); **ledger → HTTP 404** on journey-shape (no radar for furniture) | J1-0 · J1-1 · J2 · U1 |
| **#21** | Band-alignment both sides; OOB-high **reduces** extension; goals = progress | J0 · J1 · Kilo |
| **#22** | Slider T0→present; bidirectional; as-of-T fills + bounds; amendments segment | J1 · J2 · Kilo |
| **#23** | Gathering below n-floor; process axes immediate; no stored series | J1 · J2 · Echo |

### 1.4 Spec hygiene (India / Lima — non-blocking W0 notes)

| Issue | Fix in same program |
|-------|---------------------|
| Spec still points execution law at bench plan **v1.1** | Point to **this plan (v1.2)** |
| Broken supersedes link `…Spec-v1_1.md` | Fix to `…Spec-v1.1.md` |
| §0 model paragraph omits Campaign Journey | One sentence in Spec patch (optional) |
| Bounds table migration lacks **`role`** column (102) | **B1-0** migration 10x add `role` NOT NULL |
| §6a opens (shape-strength line, cycle compare) | Optional J3 / V-next — not required for J-G |

### 1.5 Dependency honesty

Campaign Journey **cannot** ship before:

| Dependency | Why |
|------------|-----|
| **Bounds CRUD + `role`** (B1) | Axes come from bound rows |
| **As-of-T bound reconstruction** (§5.4 / B1-2) | Scrub law 3 |
| **Panel readings split by role** (B3) | Shared math for alignment/progress at T |
| **Charter vs ledger chrome** (U1) | No radar on ledger |

Genesis / stamp / import (M1–M3) are **substrate PASS** — do not rebuild.

---

## 2. Locked decisions (carry + v1.2)

| ID | Decision | Spec |
|----|----------|------|
| **L1–L6** | Genesis, stamp, memory, instance, restamp, names | §2 · #1–7 |
| **L7 Two Roles** | boundary vs goal; goal never variance; critical = boundary only | §2 Law 7 · #17–18 |
| **Variance history** | Bounds at fill time; amendments never rewrite | §5.4 · #16 |
| **Import** | Default → ledger; memory not consulted/updated | §6 · #15 |
| **Goodhart** | No Journey feed from bounds / panel / **radar** | #10 · §6a guards |
| **CJ1** | Radar on **charters only**; ledger journey-shape → **404** (not empty 200) | §6a.1 · #20 |
| **CJ2** | Alignment/progress axes only | §6a.2 · #21 |
| **CJ3** | Scrub T0→present; as-of-T evaluation | §6a.3 · #22 |
| **CJ4** | Gathering / derive-at-render | §6a.4 · #23 |
| **CJ5** | J2 **pattern** reuse; separate DTOs / API / no shared process scores | §6a surface · #10 |
| **D6 out** | Convexity gauge / vol module **queued** — separate OD | Spec header |

### 2.1 §13 dispositions (still required if not locked)

Same as v1.1 plan: is_default→ledger · NULL-account bind · n-floor authority · Sharpe defer · restamp single · frames sparse · strategy-type trail.  
**W0-0 must write locks/deferrals** if any remain open.

### 2.2 Bench seating (S1–S8 + S9)

| ID | Rule |
|----|------|
| **S1** | **Kilo** co-agent on **every testable seed** (not gate-only). UI seeds (U*, J2*) include Kilo in the seed row when behavior is assertable. No Delta product gate without Kilo pack. Silent exceptions forbidden. |
| **S2** | Guide as-built only — no Campaign Journey copy until J-G feature PR |
| **S3** | **Mike** on schema / pack / Family B |
| **S4** | Phase seeds **on disk** before each phase gate |
| **S5** | **Tango:** clinical + progress + **Campaign Journey** vocab; ban grade/celebrate |
| **S6** | **Hotel:** frames · bands · n-floors · **§6a off-band decay function** (doctrine) |
| **S7** | **India:** variance (a)/(b); **no shape-series table**; Journey scrub DTO keep/kill |
| **S8** | Lifecycle board closed for sign/amend/renew |
| **S9** | **Echo:** J2-pattern radar+slider; gathering treatment; shape-strength line keep/kill |

---

## 3. Full bench roster

| Callsign | Role (this plan) |
|----------|------------------|
| **Coach** | GO, §13, ship/no-ship, shape-strength keep/kill |
| **Juliet** | Board, seeds, sequence — never product packets |
| **India** | Model; variance mechanism; Journey scrub API shape; veto Spec contradiction |
| **Alpha** | Bounds CRUD; variance; panel derive; **Campaign Journey shape-at-T API**; pack |
| **Charlie** | Library/ledger chrome; bounds editor; **charter detail radar mount**; Guide feature PRs |
| **Echo** | Dual panel; **radar + slider UI**; gathering axes; density |
| **Mike** | Family B; pack role; migrations |
| **Hotel** | Frames; band doctrine; **alignment decay**; goal-eligible attributes; n-floors |
| **Tango** | Vocab maps (bounds + Journey scrub copy); ban greps |
| **Kilo** | §10 #1–23 characterization |
| **Delta** | All gates; ternary; evidence |
| **Lima** | DL; Concept v2.0 surgery notes; Spec hygiene; Export Spec bump |
| **Foxtrot** | Only if deploy paths change |

**Not seated:** Golf · Journey meters product · Marketing Campaign Workflow · MSC · D6 vol module.

---

## 4. Sacred invariants

1. Standalone repo — no MSC.  
2. Config fail-loud.  
3. Family B.  
4. Umpire — no hard block of fills for bound breach.  
5. Day atom.  
6. Ledger ≠ signed charter; **ledger has no radar**.  
7. **Goodhart** — bounds / variance / panel / **Campaign Journey shape** ≠ Journey compass input.  
8. No profit theater; axes never equity/returns (DL-257).  
9. No unlocks for scores.  
10. Guide as-built only.  
11. D3 — GET list never creates.  
12. Variance / scrub = **bounds at evaluation time T** (§5.4 · §6a.3).  
13. All-bands grammar.  
14. Witness never tackle.  
15. **Big shape = faithful, never big numbers** (§6a.2).  
16. Derive at render — no stored shape series.  
17. Evidence over assertion; no waived gates.  
18. Documentation parity with ship.

---

## 5. As-built vs program (honest, 2026-08-08)

### 5.1 Substrate — LANDED (do not rebuild)

| Item | Evidence / note |
|------|-----------------|
| W0-G program lock | `agents/p-campaign-structured-practice/gate-reports/W0-G-delta.md` |
| M1 schema: `is_ledger`, memory, `stamped_by`, bounds **table without `role`**, sweep | M1-G · `migrations/102–104` |
| M2 genesis ledger · stamp resolve · memory · name suffix · ledger guards | M2-G · `test_structured_practice_ledger_stamp_memory` |
| M3 import → ledger; trade stamp required; journal optional | M3-G |
| Lifecycle sign/amend/renew/end | `p-campaign-lifecycle` closed |
| Journey **J2** UI pattern (ProcessMeter scrub) | `web/components/ProcessMeter.tsx` — **pattern only** |

### 5.2 Remaining — this plan

| Item | Phase |
|------|--------|
| Bounds **`role`** column + CRUD + critical-rejects-goal | **B1** |
| Process witness at fill (quiet line; never 422) | **B2** |
| Statistical panel + dual role derive | **B3** |
| Hotel frames (boundary + goal defaults) | **B4** |
| Library ledger chrome · bounds editor · Desired Outcomes · dual panel UI | **U1–U2** |
| Trade sheet · restamp · instantiate · import labels | **U3** |
| Pack ≥ 1.3 + role + stamped_by | **X1** |
| **Campaign Journey shape API + radar + slider** | **J0–J2** |
| Concept surgery notes · Guide · DL | **Z** |

---

## 6. Phases, seeds, gates

### Phase W0 — Plan re-lock (v1.2)

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on **this** plan; reaffirm §13; confirm D6 **out**; confirm Journey ≠ Campaign Journey wording |
| **W0-J** | Hotel · India · Echo | **Alignment decay function** write-up (formula + both-side OOB); T0 definition (signed_at vs first fill); scrub sample density (daily vs fill events); J2 pattern extraction plan (shared primitives vs copy) |
| **W0-T** | Tango | Campaign Journey vocab map: empty invitation, gathering, tracking toward/away, scrub labels; ban celebrate/spike/grade |
| **W0-L** | Lima | Spec hygiene PR: execution law → this plan; fix v1.1 supersedes link; optional §0 Journey sentence |
| **W0-G** | Delta | GO written; W0-J decay pinned; seeds for B/J on disk; Guide still quiet on radar |

*If Coach treats prior W0-G as still valid, W0-0 may be a short **delta GO** for Journey-only — still write the note.*

### Phase B1 — Bounds schema + role + variance mechanism

| Seed | Agent | Intent |
|------|-------|--------|
| **B1-0** | India · Mike | Migration: `role ENUM/VARCHAR NOT NULL` on `member_practice_campaign_bounds` (default `boundary` for any legacy rows); DTO freeze |
| **B1-1** | Alpha · Mike · **Kilo** | CRUD bounds on **charters only**; role required; post-sign → amendments; ledger rejects bounds; **`is_critical` on goal → 4xx** (#18) |
| **B1-2** | Alpha · India · **Kilo** | Variance mechanism (a or b) with §5.4 history; **goals never variance** (#16 · #17) |
| **B1-G** | Delta · Kilo · Mike · India | Bounds + role + history |

### Phase B2 — Process witness at fill

| Seed | Agent | Intent |
|------|-------|--------|
| **B2-1** | Alpha · Hotel · **Kilo** | Evaluate **boundary** process clauses at fill; quiet variance payload; **never 422** for bound/term; fill after `ends_at` logs + window variance |
| **B2-2** | Alpha | Strategy-type classify or trail (disposition #8) |
| **B2-G** | Delta · Kilo · Hotel | #8 process side |

### Phase B3 — Statistical panel (server)

| Seed | Agent | Intent |
|------|-------|--------|
| **B3-1** | Alpha · Hotel · **Kilo** | Derive panel **split by role** (corridor vs progress+trend); n-floor gathering; critical surface boundary-only; **shared primitives for alignment/progress** used later by Journey scrub |
| **B3-2** | Alpha · **Kilo** | Optional expectancy cross-check (not Journey) |
| **B3-G** | Delta · Kilo · Hotel | #8–9 · #17 panel side |

### Phase B4 — Starting frames

| Seed | Agent | Intent |
|------|-------|--------|
| **B4-1** | Hotel · Tango · Charlie | Sparse style × horizon cells; **boundary + optional goal defaults**; prefill on charter create |
| **B4-G** | Delta · Hotel · Tango | Frames skippable; no horizon enum column |

### Phase U1 — Library + ledger chrome

| Seed | Agent | Intent |
|------|-------|--------|
| **U1-1** | Charlie · Echo · Tango · **Kilo** | Ledger pinned/distinct; **no radar, no panel, no lifecycle toolbar** on ledger; absent from Archive |
| **U1-G** | Delta · Echo · Tango · Kilo | #7 · #20 ledger half |

### Phase U2 — Bounds editor + dual panel UI

| Seed | Agent | Intent |
|------|-------|--------|
| **U2-1** | Charlie · Echo · Tango · Hotel · **Kilo** | Role selector; Desired Outcomes; dual panel; critical once; clinical + progress copy |
| **U2-G-Tango** | Tango | Ban greps: violation, max/target primary, pass/fail |
| **U2-G-Echo** | Echo | Density + panel |
| **U2-G** | Delta | Specialist rows green |

### Phase U3 — Trade sheet · restamp · import UI

| Seed | Agent | Intent |
|------|-------|--------|
| **U3-1** | Charlie · Echo · Tango · **Kilo** | Campaign always present (memory prefill); quiet outside-charter line; **Kilo** asserts memory prefill + zero extra keystrokes on happy path (S1) |
| **U3-2** | Charlie · Echo · **Kilo** | Restamp (single v1); instantiate “start from existing”; **Kilo** same-account restamp / cross-account 4xx |
| **U3-3** | Charlie · Echo · Tango · **Kilo** | Import: ledger / pick / new — **no none**; **Kilo** #15 UI contracts (labels + stamp path) |
| **U3-G** | Delta · Echo · Tango · Kilo | Happy path · #15 UI · S1 seed-level Kilo packs present |

### Phase J — Campaign Journey (radar + time scrub)  **← v1.2 freight**

| Seed | Agent | Intent |
|------|-------|--------|
| **J0-0** | Hotel · **Kilo** | **Doctrine freeze:** alignment decay function (both-side OOB); progress mapping for goals; gathering threshold per attribute; unit tests for pure functions (no HTTP). **#21 pure** |
| **J1-0** | India · Alpha · **Kilo** | **DTO + API:** e.g. `GET …/campaigns/{id}/journey-shape?as_of=YYYY-MM-DD` (or scrub samples series). Response: axes from **declared bounds**, each with `role`, alignment/progress scalar ∈ [0,1] or null gathering, labels; **T0**, `present`, amendment markers. **No Journey process scores.** **Ledger → HTTP 404** (journey-shape does not exist for furniture — doctrine at the protocol level; not an empty 200). **Charter with zero bounds → 200 + empty-invitation payload** (CTA to bounds editor — a real campaign that has not declared its fingerprint). Derive only — **no write path / no table**. **Kilo #20** asserts 404 vs invitation contracts distinctly. |
| **J1-1** | Alpha · India · **Kilo** | **As-of-T evaluation:** fills [T0→T] + bounds in force at T; amendment segmentation; process axes immediate; signature axes n-floor; goal axes never variance. **Kilo #20–#23** server |
| **J1-G** | Delta · Kilo · India · Hotel | Server Journey shape green; no Journey greps; no stored series |
| **J2-0** | Echo · Charlie · Tango | **UI:** charter detail radar + slider T0→present; bidirectional (J2 pattern from ProcessMeter — extract shared scrub/spider primitives **or** campaign-local fork; **do not** import Journey scores). Gathering treatment. Empty invitation CTA to bounds editor. **No radar on ledger.** |
| **J2-1** | Echo · Charlie · **Kilo** | Wire API; scrub updates shape; amendment markers visible; clinical copy only |
| **J2-G-Tango** | Tango | Ban greps: score, grade, spike, unlock, P&L-on-radar |
| **J2-G-Echo** | Echo | Density; gathering; bidirectional scrub UX |
| **J2-G-Kilo** | Kilo | UI↔API parity; #20–#23 |
| **J2-G** | Delta | Campaign Journey shippable on charter detail |
| **J3\*** | Echo · Coach | **Optional:** shape-strength companion line under radar (open §6a) — only if Coach GO |

**Blocked without:** B1-G + B3-G (axis math) · U1-G (ledger guard) · W0-J decay pin.

### Phase X1 — Pack / export

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | India · Lima | practice-campaign schema ≥ 1.3; bounds+**role**; ledger; stamped_by |
| **X1-1** | Alpha · Mike · **Kilo** | Round-trip #12 · #19 |
| **X1-G** | Delta · Kilo · Mike | Pack green |

*Note: radar shape is **not** packed (derived).*

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z-1** | Lima · Charlie | Concept Spec surgery notes / v2.0 fold list; Guide Campaign Journey **as-built** only after J2-G; DL entry model inversion + Campaign Journey |
| **Z-2** | Lima | Trade Log Spec note if needed (unstamped retired) |
| **Z-G** | Delta | Program PASS — B/U/J/X gates + Kilo packs + Goodhart greps |

---

## 7. Gate matrix

| Phase | Gate | Agents | Evidence |
|-------|------|--------|----------|
| W0 | **W0-G** | Delta | Delta GO; decay pin; seeds on disk |
| B1 | **B1-G** | Delta · Kilo · Mike · India | #16–#18 role/variance |
| B2 | **B2-G** | Delta · Kilo · Hotel | #8 process |
| B3 | **B3-G** | Delta · Kilo · Hotel | Panel dual role |
| B4 | **B4-G** | Delta · Hotel · Tango | Frames |
| U1 | **U1-G** | Delta · Echo · Tango · Kilo | Ledger chrome; no radar |
| U2 | **U2-G** | Delta + specialists | Editor + dual panel |
| U3 | **U3-G** | Delta · Echo · Tango · Kilo | Trade/import UX |
| J | **J1-G** then **J2-G** | Delta · Kilo · Hotel · Echo · India | **#20–#23** |
| X1 | **X1-G** | Delta · Kilo · Mike | Pack #12/#19 |
| Z | **Z-G** | Delta | Program close |

**No waived gates.**

---

## 8. Sequencing

```text
W0-G
  │
  ├─► B1* ──► B1-G ──► B2* ──► B2-G
  │              │
  │              ├─► B3* ──► B3-G ──► U2* ──► U2-G
  │              │              │
  │              │              └─► J0* ──► J1* ──► J1-G ──► J2* ──► J2-G
  │              │
  │              └─► X1* after B1-G ──► X1-G
  │
  ├─► B4* after W0 (Hotel; parallel with B1)
  ├─► U1* after M2 substrate (now) ──► U1-G   [blocks ledger radar]
  ├─► U3* after M3 substrate ──► U3-G
  │
  └─► Z* after J2-G + X1-G + U2-G ──► Z-G
```

**Critical path (v1.2 complete):**  
`W0-G → B1-G → B3-G → J1-G → J2-G → Z-G`

**Parallel:** U1 ∥ B1; B4 ∥ B1; U3 ∥ B*; X1 after B1; U2 after B3.

**Blocked without:**

| Need | Before |
|------|--------|
| `role` + bounds CRUD | B2, B3, J |
| Alignment/progress pure math | J1 |
| B3 panel primitives (recommended shared) | J1 (may extract shared lib in B3-1) |
| U1 ledger guard | J2 ship (no accidental ledger radar) |
| Hotel decay function (J0/W0-J) | J1-G |

---

## 9. Acceptance map (Spec §10 → seeds)

| Spec # | Seeds |
|--------|--------|
| #1–#2 Default account + ledger | **LANDED** M2-0/M2-1 — Kilo regression only if touched |
| #3 Memory | **LANDED** M2-2 |
| #4 Stamp / no cross-account | **LANDED** M2 · restamp U3-2 if incomplete |
| #5 Instantiate | M2-4 · U3-2 |
| #6 Name law | M2-3 · X1-1 |
| #7 Ledger guards | M2-1 · **U1-1** |
| #8 Bounds witness | B1 · B2 · B3 · U2 |
| #9 Critical surface | B1-1 · B3-1 · U2-1 |
| #10 Goodhart (incl. radar) | All Kilo greps · J1-G · Z-G |
| #11 Migration | **LANDED** M1 — role migration B1-0 |
| #12 / #19 Pack + role | X1-1 |
| #13 Multi-active | regression |
| #14 D3 GET | regression |
| #15 Import → ledger | **LANDED** M3 · U3-3 labels |
| #16 Variance history | B1-2 · B2-G |
| #17 Goal never variance | B1 · B3 · J1 |
| #18 Critical rejects goal | B1-1 |
| **#20 Radar axes · ledger 404 · zero-bound invitation** | **J1-0 · J1-1 · J2 · U1** |
| **#21 Alignment not magnitude** | **J0 · J1 · Kilo** |
| **#22 Scrub temporal honesty** | **J1 · J2 · Kilo** |
| **#23 Gathering / no store** | **J1 · J2 · Echo** |

---

## 10. File ownership (indicative)

| Area | Paths |
|------|--------|
| Bounds migration | `migrations/10x_campaign_bounds_role.sql` (next free NNN) |
| Campaign domain | `server/practice_spine_domain.py` · routes |
| Variance / panel / shape-at-T | `server/trade_log_domain/` or `server/practice_*/` (India keeps one truth) |
| Journey shape API | practice_spine routes — **not** `/api/me/journey/*` |
| Tests | `server/tests/test_campaign_bounds.py` · `test_campaign_journey_shape.py` |
| Pack schema | `Specs/schemas/practice-campaign-v1.json` (+ version) |
| Alignment pure functions | `server/…` + optional `web/lib/campaignJourneyAlignment.ts` if client mirrors |
| Radar + slider UI | `web/components/practice/CampaignJourneyRadar.tsx` (new) · charter detail page |
| J2 primitives | Extract from `web/components/ProcessMeter.tsx` **only if** shared scrub/spider is clean — else campaign-local |
| Frames | `web/lib/campaignFrames.ts` (or successor) |
| Guide | `web/app/guide/page.tsx` — **after J2-G only** for Journey copy |

---

## 11. Risk register

| Risk | Mitigation |
|------|------------|
| Raw magnitude axes celebrate high win rate | Hotel decay + Kilo #21 OOB-high reduces extension |
| Scrub uses current bounds (rewrites history) | Same §5.4 mechanism as variance; Kilo #22 amendment segmentation |
| Radar mounted on ledger | API **404** on ledger id; UI never mounts radar on ledger detail; Kilo #20 |
| Shape series table “for performance” | India veto; derive at render; sample density pin in W0-J |
| Coupled to Journey process API | Separate route/DTO; grep ban; #10 |
| J2 before bounds | Sequencing: J after B1+B3 |
| ProcessMeter god-component fork debt | Echo: extract scrub/spider primitives deliberately or isolate campaign component |
| Guide ahead of as-built | S2 · Z-1 after J2-G |
| D6 sneaks into v1.2 | Spec + this plan: **out** until vol OD |

---

## 12. Cold-start seed list (Juliet materializes)

Minimum files under `agents/p-campaign-structured-practice/seeds/`:

```
W0-0-coach-go-v1.2.md
W0-J-hotel-india-echo-journey-doctrine.md
W0-T-tango-journey-vocab.md
W0-L-lima-spec-hygiene.md
B1-0-bounds-role-migration.md
B1-1-bounds-crud.md
B1-2-variance-history.md
B2-1-process-witness.md
B3-1-panel-dual-role.md
B4-1-frames.md
U1-1-ledger-chrome.md
U2-1-bounds-editor-panel.md
U3-1-trade-sheet.md
U3-2-restamp-instantiate.md
U3-3-import-sheet.md
J0-0-alignment-decay.md
J1-0-journey-shape-api.md
J1-1-as-of-t-evaluation.md
J2-0-radar-slider-ui.md
J2-1-wire-scrub.md
X1-0-pack-schema.md
X1-1-pack-roundtrip.md
Z-1-docs-guide-dl.md
```

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-08-08 | **GO-ready patches (Coach review):** (1) §12 cold-start adds **`W0-L-lima-spec-hygiene.md`** (was seated in W0 table, missing from checklist — S4). (2) **J1-0 contract pin:** ledger → **HTTP 404**; zero-bound charter → **200 empty-invitation** (not 404/empty slash). (3) **S1 strict:** Kilo co-seated on **U3-1 / U3-2 / U3-3** (and restated on J1-0); no gate-only silent exceptions. |
| 2026-08-08 | **v1.2** — Full Agent Bench Plan: remaining B/U/X + **Phase J Campaign Journey** (radar + T0→present scrub; #20–#23); honest as-built M1–M3; D6 out; supersedes plan v1.1 as execution law for Spec v1.2 |
| 2026-08-08 | Plan v1.1 — Two Roles · D2–D4 (historical) |

---

*Board is **GO-ready** for Coach **W0-0** (delta-GO note is sufficient per plan footnote — **write the note**; an unwritten GO is a waived gate). Implementation of Campaign Journey starts only after that GO and B1-G + B3-G (or explicit Coach waiver of B3 only if J1 owns full derive — not recommended).*
