# Journal Day Net Calendar (Exposure Map) — Full Agent Bench Plan v1.0

**Date:** 2026-08-09  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-journal-day-net/`](../agents/p-journal-day-net/)  
**Product law:** [`Specs/FatTail-Labs-Journal-Day-Net-Calendar-Spec-v0.2.md`](../Specs/FatTail-Labs-Journal-Day-Net-Calendar-Spec-v0.2.md)  
**Review / resolution (folded into Spec v0.2):**

| Doc | Role |
|-----|------|
| [`Specs/Advisor-Review-Journal-Equity-Day-Calendar-Spec-v0_1.md`](../Specs/Advisor-Review-Journal-Equity-Day-Calendar-Spec-v0_1.md) | JE-1…JE-6 |
| [`Specs/Resolution-Journal-Day-Calendar-Exposure-Map.md`](../Specs/Resolution-Journal-Day-Calendar-Exposure-Map.md) | Coach valence + money-map + toggle + R:R |

**Parents:** Journal Session v0.6 · Continuous Journaling · Positions View v0.2 (V8 valence) · Trade Log v1.1 · Practice Context · Arch 11 day-book / days-interest  
**Guide:** `/guide` · **as-built only** (F1)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · AGENTS.md  
**Claude plan review (2026-08-09):** **SOUND — approve-ready; zero blocking findings.** Two notes folded as normative (§1.4). Paint gate, L-table, T12, risk register affirmed.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Mission

Ship the Journal **Day Net Calendar / exposure map**:

| Pillar | Meaning |
|--------|---------|
| **Derived day net** | Realized closed outcomes per ET day under Practice scope |
| **Magnitude gradient** | Full red↔green **steps** (fixed $ buckets) — not binary tiles |
| **Month + week chrome** | Amount (±R:R) in cells; **period P&L bar above** calendar |
| **Chosen exposure** | Persistent **map on/off**; off = zero money chrome |
| **Valence carve-out** | Red/green **only** on this Journal map; capital/positions/blotter/Reports stay neutral |

**Design invariant:** *Looking at loss is training when chosen; ambush is flooding. Chat stays process (CJ-6). Color is curriculum here, decoration elsewhere.*

**Not this plan:** Process-tone declaration map · Journey P&L · marks/unrealized in cells · period-max intensity · solid binary tiles · P&L notifications · Guide promises ahead of ship · full year amounts (optional JED-4).

---

## 1. Spec v0.2 lock (normative for execution)

### 1.1 Coach-closed decisions

| ID | Decision | Spec |
|----|----------|------|
| **L1** | Money map only; no member tone declaration | E3 · JE-2 |
| **L2** | Red/green **gradient** sanctioned on Journal map only | E10–E11 · JE-1 |
| **L3** | Capital / Positions / blotter / Reports: **no valence** | Positions V8 · §2.1 |
| **L4** | Fixed intensity buckets (stable across months) | §5.4 · JE-5 |
| **L5** | Toggle required; off = no money chrome | E12 |
| **L6** | Default map **ON** (Coach may flip one word) | §5.0 · §13 |
| **L7** | R:R in cell when density allows; amount wins mobile | §4.2 · JE-6 |
| **L8** | Post-amendment scope: account = directed+undirected; campaign = stamps; undirected filter lawful | §4.4 · JE-3 |
| **L9** | Stamp redirect re-buckets campaign history (not a bug) | E13 · T11 |
| **L10** | No Journal-side PnL fork — reuse analytics / Reports R path | E2 · E4 |

### 1.2 Acceptance pack (Delta-checkable)

| # | Criterion | Primary seeds |
|---|-----------|---------------|
| **T1** | Month amounts + magnitude gradients; Month P&L = Σ day nets | JED-2 · Kilo |
| **T2** | Week amounts + Week P&L = Σ day nets | JED-3 · Kilo |
| **T3** | Account switch re-fetches; no stale book | JED-2 · Kilo |
| **T4** | Campaign filter = stamped only | JED-1 · Kilo |
| **T5** | Undirected filter = null stamp only (if exposed) | JED-1 · Kilo |
| **T6** | No closes → neutral, not `$0.00` | JED-1 · Kilo |
| **T7** | Open+close same day → one day net | JED-1 · Hotel · Kilo |
| **T8** | `prefsReady` false → no wrong full-book flash | JED-2 · Charlie |
| **T9** | Map OFF → zero money chrome | JED-1b · JED-2 · Kilo |
| **T10** | Toggle persists across reload | JED-1b · Kilo |
| **T11** | Campaign stamp redirect re-buckets past days | JED-1 · Kilo |
| **T12** | Same $50 day → same intensity_step in quiet vs loud month | JED-1 · Kilo |
| **T13** | Mobile: amount visible; R:R may be tap-only | JED-2 · Echo · Kilo |
| **T14** | a11y: amount without relying on color alone | JED-2 · Echo · Kilo |

### 1.3 Dependency honesty

| Dependency | Why | Status |
|------------|-----|--------|
| Practice Context account/campaign | E1 scope | **As-built** |
| Trade Log outcome / day bucketing | Day net SoR | **As-built** (reuse; India pin helper) |
| Reports entry/outcome R path | day_r2r | **As-built partial** — Hotel verifies parity |
| Journal calendar Year/Month/Week/Day | Host surface | **As-built** |
| `_require_tool_member` Journal floor | Entitlement | **As-built** (Practice hardening) |
| Positions V8 citation / Lima DL | Valence carve-out log | **W0-4** |

**JED-1 may start after W0-G.**  
**JED-2 must not paint cells until E10–E12 (gradient exception + toggle + buckets) are coded and gated.**

### 1.4 Claude plan-review notes (2026-08-09) — normative

Zero blocking findings. Two underlines — structural, not optional:

| ID | Note | Amendment |
|----|------|-----------|
| **C1** | **day_r2r aggregation is the only real technical risk.** Reports R is per *outcome*; a day with N outcomes has more than one defensible aggregate (mean of R-multiples · net-P&L / net-designed-risk · sample-weighted). | **W0-2 (Hotel) must state the aggregation rule in one explicit sentence** in the gate report — not only “matches Reports helper.” T-cases can green on any consistent formula while members compare a different mental model. JED-1-2 implements *that* sentence only. |
| **C2** | **W0-4 Lima logs the valence carve-out at program lock** (before pixels). Correct under decision-log law (records decisions, not ships). | Lima entry wording: **“ratified for build”** (or equivalent) — **not “shipped.”** Ship/as-built language waits for Z-1 / Z-G. |

**Paint gate (affirmed):** Charlie colors no cell until **both** JED-1-G and JED-1b-G pass — toggle exists before exposure; “chosen, never ambush” is a **dependency graph**, not copy. Echo may prototype on mock data; **no merge-to-main paint** without those gates (§6).

**§10 GO-time words (Coach, four + GO):** toggle default ON · buckets $50/$250/$1k/$5k · R:R in-cell on desktop · JED-4 year in/deferred.

---

## 2. Full bench roster

### 2.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | GO, ship/no-ship, toggle-default one-word if flipped, arbiter on valence copy |
| **Juliet** | Board, seeds, phase order — **never executes packets** |
| **India** | Domain: day_net / intensity_step / scope; no second PnL store; API shape; keep/kill prefs path |

### 2.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | `day-net-calendar` API; prefs toggle; migration if needed; Family B queries |
| **Charlie** | `JournalCalendar` period bar, cells, toggle wire-up; Practice scope params; Guide as-built same PR |
| **Echo** | Toggle placement; month cell density; mobile fallback; gradient CSS tokens (obvious steps) |
| **Mike** | Family B on calendar API + prefs; no cross-identity; closed-date read still ok |
| **Foxtrot** | Only if env/deploy prefs path changes (unlikely) |

### 2.3 Quality, member, trading

| Callsign | Role |
|----------|------|
| **Delta** | All gates; ternary; evidence required |
| **Kilo** | Co-agent on JED-1 · JED-1b · JED-2 · JED-3; phase Kilo packs; T1–T14 |
| **Lima** | DL carve-out (Journal valence exception); Spec BUILD; Positions V8 cross-cite note |
| **Tango** | Exposure copy (teach, don’t taunt); off-switch neutral; no chat money prompts |
| **Hotel** | Day net = closed outcomes; **W0-2 day_r2r aggregation sentence (C1)**; R:R parity; red-at-designed-R:R ≠ failure |

### 2.4 Optional review only

| Callsign | When |
|----------|------|
| **Whiskey** | Capital-preservation framing of exposure (no soft-pedal of map) |
| **Victor** | Via negativa on ambush vs chosen looking |
| **Yankee** | Fat-tail honesty — buckets not Gaussian “normal day” |

### 2.5 Not seated

Golf · content studio (Quebec/Bravo/November/Romeo/Papa) · Sierra (no SEO surface) unless Guide SEO claims appear.

---

## 3. Sacred invariants (all seeds)

1. **Standalone repo** — no MSC imports.  
2. **Config fail-loud.**  
3. **Family B** — day nets and prefs per identity only.  
4. **No Journal PnL fork** — reuse Trade Log domain / analytics (L10).  
5. **CJ-6** — no P&L in chat, prompts, notifications.  
6. **E10–E12** — valence carve-out + gradient + toggle; no silent solid colors.  
7. **E6** empty ≠ zero · **E7** ET day · **E8** sum law · **E9** a11y.  
8. **Guide as-built only** — feature copy in same PR as UI.  
9. **Evidence over assertion** — declare files before touch.  
10. **No waived Delta gates.**  
11. **Documentation parity** same body of work as ship (Spec status · DL · optional Arch 11 note).

---

## 4. As-built vs program (honest — 2026-08-09)

### 4.1 Landed (substrate)

| Item | Status |
|------|--------|
| Journal calendar Year · Month · Week · Day | **LANDED** |
| Practice Context account / campaign / prefsReady | **LANDED** |
| Trade Log days-interest + day book / reports outcomes | **LANDED** |
| Reports entry R2R / outcome stats path | **LANDED** (Hotel confirms day_r2r formula) |
| Practice tool membership gate on Journal | **LANDED** |
| Spec v0.2 + Advisor + Resolution | **LANDED** (docs) |

### 4.2 Program target (not yet)

| Item | Phase |
|------|--------|
| API day-net-calendar + intensity buckets + day_r2r | **JED-1** |
| Prefs toggle persistence | **JED-1b** |
| Month UI: bar + cells + gradient + toggle | **JED-2** |
| Week UI | **JED-3** |
| Year heatmap | **JED-4** optional |
| Lima DL + Spec BUILD | **W0 / close** |
| Guide blurb if any | **same PR as JED-2/3** |

---

## 5. Phases, seeds, gates

### Phase W0 — Program lock

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | GO on this bench plan + Spec v0.2; confirm toggle default ON (or flip) |
| **W0-1** | India | Pin day_net formula; intensity_step constants; scope matrix §4.4; reuse vs new module path; prefs table keep/kill |
| **W0-2** | Hotel | Confirm closed-outcome day bucketing. **C1:** write the **exact day_r2r aggregation rule** in one sentence (e.g. mean of per-outcome R-multiples on that ET day under scope · or net-P&L/net-designed-risk · or sample-weighted — **pick one**). Prefer reuse of a single shared pure function with Reports; if none exists, name the new helper. Gate fails if aggregation is left “TBD.” |
| **W0-3** | Juliet | **Materialize cold-start seeds** under `agents/p-journal-day-net/seeds/` (this plan’s tables are the index) |
| **W0-4** | Lima | Decision log: Journal valence carve-out + mental-toughness rationale; cross-cite Positions V8; Spec points to this plan. **C2:** log as **ratified for build**, **not shipped**. |
| **W0-5** | Tango | Copy ban list draft: no taunt; off-switch neutral; no notification money |
| **W0-G** | **Delta** | Plan lock; seeds on disk (S4); L1–L10 written; Hotel **aggregation sentence present (C1)**; Lima DL wording C2; no paint seeds before W0-G |

**W0-G cold-start rule:** does **not** PASS until Juliet has materialized phase seeds (scope in/out, criteria, gate).

---

### Phase JED-1 — API (domain)

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-1-0** | India · Alpha | Module boundary: e.g. `trade_log_domain` day buckets → `journal_day_net` or analytics extension; **no duplicate PnL** |
| **JED-1-1** | Alpha · Mike | `GET /api/me/journal/day-net-calendar` (from/to, account, campaign, undirected); ET; Family B; tool member gate |
| **JED-1-2** | Alpha · Hotel | `period.net` = Σ days; `intensity_step` from fixed buckets; `day_r2r` + sample_n implementing **only** the W0-2 aggregation sentence (C1) |
| **JED-1-3** | **Kilo** | Unit/API tests: T4–T7, T11–T12, empty≠zero, open+close structure, bucket stability |
| **JED-1-G** | **Delta** | API 200 shapes; isolation; sum law; buckets; no declared_tone fields |

---

### Phase JED-1b — Toggle prefs

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-1b-0** | India · Alpha | Prefs path: migration or existing journal/identity prefs column `day_net_map_enabled` DEFAULT 1 |
| **JED-1b-1** | Alpha · Mike | GET/PATCH preferences; Family B |
| **JED-1b-2** | **Kilo** | T9–T10 persistence tests |
| **JED-1b-G** | **Delta** | Default ON (or Coach OFF); off state API-visible to client |

*JED-1b may parallel JED-1 after JED-1-0 path is clear; UI must not ship gradient without JED-1b-G if toggle is required for ratification — **prefer JED-1b before or with JED-2**.*

---

### Phase JED-2 — Month UI (paint)

**Hard gate:** JED-1-G **and** JED-1b-G PASS (or JED-1b merged same PR as JED-2 with Delta single gate).

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-2-0** | Echo · Tango | Density prototype: day # + amount + gradient + optional R:R; mobile amount-first; toggle placement |
| **JED-2-1** | Charlie · Echo | Month grid: fetch day-net-calendar for month bounds; cell amount + intensity CSS; period bar Month P&L |
| **JED-2-2** | Charlie | Toggle wire-up; **off = zero money chrome**; Practice account/campaign in query; `prefsReady` |
| **JED-2-3** | Tango | Period bar labels; empty period copy; no taunt |
| **JED-2-4** | **Kilo** | T1, T3, T8–T10, T13–T14 characterization / greps (no money chrome when off) |
| **JED-2-G-Echo** | Echo | Gradient steps **obvious**; a11y; mobile fallback |
| **JED-2-G-Tango** | Tango | Copy PASS |
| **JED-2-G-Hotel** | Hotel | Amounts match API; R:R if shown matches Hotel rule |
| **JED-2-G-Kilo** | Kilo | Evidence pack for Delta |
| **JED-2-G** | **Delta** | Month exposure map shippable; E10–E12 held |

**Guide:** If any member Guide mentions calendar P&L / exposure map, land **in this PR** only (as-built).

---

### Phase JED-3 — Week UI

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-3-1** | Charlie · Echo | Week columns: amount + gradient; Week P&L bar; process bands not win/loss recolored |
| **JED-3-2** | **Kilo** | T2 + week sum law |
| **JED-3-G** | **Delta** | Week parity with month laws |

---

### Phase JED-4 — Year heatmap (optional)

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-4-1** | Charlie · Echo | Year: intensity heatmap only (no required amounts) |
| **JED-4-G** | **Delta** | Optional ship; skip if Coach defers |

---

### Phase JED-6 — R:R cell polish (after density)

| Seed | Agent | Intent |
|------|-------|--------|
| **JED-6-1** | Charlie · Hotel | Surface `day_r2r` in cell or tap sheet per Echo |
| **JED-6-2** | **Kilo** | R:R null when sample 0; parity sample |
| **JED-6-G** | **Delta** | Hotel PASS on designed-R red day framing |

*If JED-2 already shows R:R cleanly, JED-6 collapses into JED-2-G-Hotel.*

---

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z-1** | Lima | Spec status BUILD / as-built notes; DL closed; Positions V8 + Journal §2.1 mutual cite verified |
| **Z-2** | Juliet | Board status honesty; optional `npm run test:e2e:practice` note (SSO env) — not required for Z-G |
| **Z-G** | **Delta** | Program close: T1–T14 evidence; no residual declaration code paths; off means off |

---

## 6. Phase graph (dependencies)

```
W0-G
  ├─► JED-1 ──► JED-1-G ──┐
  └─► JED-1b ─► JED-1b-G ─┴─► JED-2 ──► JED-2-G ──► JED-3 ──► JED-3-G
                                                      │
                                                      optional JED-4
                                                      optional JED-6 (or fold into JED-2)
                                                              │
                                                              ▼
                                                            Z-G
```

**Forbidden:** Charlie paints red/green cells before JED-1-G + toggle path (JED-1b).  
**Allowed:** Alpha API work in parallel with Echo density notes (JED-2-0 can start after W0-G with mock data only — **no merge to main paint** until JED-1-G).

---

## 7. Seed materialization standard (Juliet)

Each cold-start seed file under `agents/p-journal-day-net/seeds/` must include:

1. **Goal** (one paragraph)  
2. **In scope / out of scope**  
3. **Files likely touched** (declare before edit)  
4. **Spec citations** (E-laws, T-cases)  
5. **Done when** (verifiable)  
6. **Gate** that consumes it  
7. **Co-agents** (e.g. Kilo on implementation seeds)

Stub tables in §5 are the **board index**, not executable seeds (S4).

---

## 8. Test strategy (Kilo)

| Layer | What |
|-------|------|
| **Unit** | intensity_step buckets; period sum; tone from net; empty≠zero |
| **API** | scope matrix account/campaign/undirected; Family B isolation; structure open+close |
| **UI greps** | map OFF → no `Month P&L` / no `+$` in month cells (or data-testid absent) |
| **Redirect** | stamp change → campaign-scoped day net changes |
| **a11y** | accessible name includes amount |

Reuse fixtures from `tests/test_trade_log*.py` / reports where possible.

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Valence teaches shame | Toggle; Tango copy; Hotel R:R literacy; no notifications |
| Quiet month paints loud | Fixed buckets L4 · T12 |
| PnL math fork drifts from Reports | India single helper · Hotel gate |
| Density deletes amounts | Echo mobile rule · T13 · amount > R:R |
| Ambush without toggle | JED-1b before paint · T9 |
| Guide ahead of build | F1 · same PR |

---

## 10. Coach one-pagers (at GO)

Confirm or flip:

1. **Toggle default ON** (plan default).  
2. **Bucket thresholds** $50 / $250 / $1k / $5k (plan default).  
3. **R:R in cell** vs tap-only on desktop (plan: cell when density allows).  
4. **JED-4 year heatmap** in program or deferred.

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-09 | v1.0 — Full Agent Bench Plan from Spec v0.2 + Advisor JE + Coach exposure resolution |
| 2026-08-09 | Claude plan review **SOUND** — §1.4 C1 (day_r2r aggregation sentence) · C2 (Lima “ratified for build”); paint gate affirmed; zero blockers |

---

*Execution law for `p-journal-day-net`. Spec remains product authority; this plan is sequencing + seating + gates. Ready for Coach GO (§10 four words + GO) then W0.*
