# FatTail Labs — Journal Day Net Calendar Spec v0.2  
### (Exposure map · month/week P&L chrome)

**Status:** DRAFT — Coach-ratified on valence + instrument (2026-08-09); implementation planning  
**Date:** 2026-08-09  
**Type:** Product / UX / data contract — **Journal year · month · week zoom-out**  
**Audience:** Implementation agents (Claude / bench) · Coach · Lima  
**Execution law (bench):** [`docs/Journal-Day-Net-Calendar-Full-Agent-Bench-Plan-v1.0.md`](../docs/Journal-Day-Net-Calendar-Full-Agent-Bench-Plan-v1.0.md) · board [`agents/p-journal-day-net/`](../agents/p-journal-day-net/)  
**Supersedes:** [Journal Equity Day Calendar Spec v0.1](./FatTail-Labs-Journal-Equity-Day-Calendar-Spec-v0.1.md)  
**Review folded:**

| Doc | Role |
|-----|------|
| [Advisor Review — Journal Equity Day Calendar Spec v0.1](./Advisor-Review-Journal-Equity-Day-Calendar-Spec-v0_1.md) | JE-1…JE-6 findings |
| [Resolution — Journal Day Calendar: The Exposure Map](./Resolution-Journal-Day-Calendar-Exposure-Map.md) | Coach rulings on JE-1, JE-2, toggle, R:R, naming |

**Parents / companions:**

| Spec / surface | Role |
|----------------|------|
| [Journal Session Spec v0.6](./FatTail-Labs-Journal-Session-Spec-v0.6.md) | One conversation per date; day is SoR for process narrative |
| [Continuous Journaling Direction 2026-08-02](./FatTail-Labs-Continuous-Journaling-Direction-2026-08-02.md) | Capture-in-the-moment; **CJ-6** — no P&L theater in chat / prompts / notifications |
| [Accounts & Capital and Positions View Spec v0.2](./FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md) | **V8 — no valence color** on capital/positions; this Spec’s **scoped exception** (§2.1) |
| Practice Context (as-built `practiceContext.tsx`) | Account · campaign · date shared across Practice |
| Trade Log Spec v1.1 · Reports analytics | Book of record; R-multiple / outcome path |
| Campaign Amendment — Top Level Is the Account | No default ledger; undirected = lawful absence |
| Architecture `11-practice-domain-single-source.md` | Day book / days-interest / effective realized PnL |

**As-built anchors (do not invent parallel day math):**

- `GET /api/me/trade-log/analytics/days-interest`  
- Day book / reports **realized** outcome path  
- Journal calendar: `web/components/journal/JournalCalendar.tsx`  
- Reports entry R:R / outcome R path (reuse; no Journal-side fork)

**Naming (JE-4):** Internally and in API: **Day Net Calendar** / **exposure map mode**.  
“Equity day” is avoided in new copy — capital-layer *equity* means positions + cash; this surface maps **realized day net only**. Product-facing short label may stay “Equity map” on the toggle if Coach prefers familiar language; code and API use `day-net` / `exposure_map`.

---

## 0. Mission

Make **year / month / week** Journal views a deliberate **exposure map** of realized book outcomes:

1. Every calendar day can show a **debit or credit amount** (day net).  
2. Days paint in a **full red ↔ green gradient** scaled by magnitude (curriculum, not decoration).  
3. Cells may also show **day R:R** where density allows (Hotel: same derivation as Reports).  
4. **Month** and **week** views show **period P&L above the calendar**.  
5. The map is **member-toggleable** — exposure is chosen, never ambush.

**Mental-toughness frame (Coach, 2026-08-09):** Traders naturally avoid looking at loss; not-looking compounds avoidable loss. The calendar confronts that avoidant reflex. Softening to single-hue would flinch on the member’s behalf. The gradient + amount + R:R teach the eye that a red day at designed R:R can still mean *process working* — not a moral verdict.

This is **Journal calendar chrome** — not a second Reports app, not chat theater, not ambient flooding.

---

## 1. Problem

| Today | Pain |
|-------|------|
| Month/week cells mostly signal “activity” | Member cannot see **how the book moved** without leaving Journal |
| No period net on the calendar chrome | “What was this week / month?” requires Reports hop |
| Avoidance of loss is unchallenged at zoom-out | Process space never trains **looking at the book** |

---

## 2. Laws

| ID | Law |
|----|-----|
| **E1 — One scope** | Day nets, R:R, and period totals use **Practice Context**: account and campaign filters same as Trade Log / Reports for that chrome state. |
| **E2 — Trade Log is money SoR** | Day debit/credit and day R:R are **derived** from closed outcomes (effective realized / Reports R path). Never typed into the calendar. |
| **E3 — Money map only (this surface)** | Color and intensity follow **derived day net** only. **No member tone declaration** on this surface (JE-2 Coach). Process-tone map is **ideas inventory**, not this channel. |
| **E4 — No second equity curve store** | Recompute at read from trade book / analytics day buckets. No stored MTM series for this surface. |
| **E5 — Process chat stays process (CJ-6)** | Composer, interview, prompts, and **notifications** never lead with P&L. Exposure map is **calendar chrome only**. Off or on. |
| **E6 — Empty ≠ zero** | Days with no closed outcomes: em-dash / empty, not `$0.00`, unless flat outcomes exist (`net === 0` with ≥1 close). |
| **E7 — Timezone honesty** | Calendar day = **America/New_York** trade day. Fail loud if API and UI disagree. |
| **E8 — Period total matches sum of days** | Month P&L = Σ day nets in month; Week P&L = Σ day nets in week. No alternate formula. |
| **E9 — Accessibility** | Color is never the only signal: amount text + accessible name (“credit $X” / “debit $Y” / “no closed outcomes”). |
| **E10 — Valence exception (JE-1 Coach)** | Red/green **gradient** on **this Journal map only** is **sanctioned**. Capital, Positions, blotter, Reports remain **no valence color** ([Positions View V8](./FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md)). Boundary is doctrine; both specs cite each other. |
| **E11 — Gradient is magnitude, not binary** | Solid red/green blocks are **rejected**. Intensity must show **obvious magnitude steps** — a $30 give-back and a $3,000 bleed must read differently. Normalization must be **stable across periods** (not period-max). |
| **E12 — Exposure is chosen (toggle)** | Map on/off is **required for ratification**. Off = zero money chrome (no amounts, gradient, period bar, or R:R). State persistent per member. |
| **E13 — Redirect re-buckets honestly** | Derived-at-read: when a campaign stamp moves, **past days under campaign scope re-bucket**. Not a bug (JE-3). |

---

## 2.1 Register law — valence by surface family

| Surface family | Red/green valence |
|----------------|-------------------|
| Capital · Positions · Trade Log blotter · Reports | **Forbidden** (facts in one voice; decoration ≠ curriculum) |
| **Journal Day Net Calendar (exposure map ON)** | **Sanctioned** — full red↔green **gradient** (mental-toughness exposure) |

Lima: log carve-out with mental-toughness rationale same day as v0.2 ratification.

---

## 3. Scope by view

| View | Exposure map | Amount in cell | R:R in cell | P&L above calendar |
|------|--------------|----------------|-------------|--------------------|
| **Year** | Heatmap by intensity (optional v0.1) | Optional later | No | Not required v0.1 |
| **Month** | Full gradient fill | **Required** | **Required** where density allows | **Required:** Month P&L |
| **Week** | Gradient per day | **Required** | **Required** where density allows | **Required:** Week P&L |
| **Day** | Out of grid scope | DayTradesPanel | Existing day detail | N/A |

**v0.1 ship focus:** Month + Week. Year heatmap optional on same API.

---

## 4. Definitions

### 4.1 Day net (debit / credit)

For identity + Practice scope + calendar date `D` (ET):

```
day_net(D) = Σ effective_realized_pnl of closed outcomes whose
             outcome day (ET) = D
             AND trade matches scope (§4.4)
```

| Term | Meaning |
|------|---------|
| **Credit** | `day_net > 0` — green family; amount with `+` or positive money |
| **Debit** | `day_net < 0` — red family; negative or parenthetical money |
| **None** | No closed outcomes — “—”; neutral cell (no red/green wash) |
| **Flat** | `day_net === 0` with ≥1 closed outcome — `$0.00`; near-zero / neutral gradient |

**Structure doctrine:** Same open/close / structure rules as Reports (close fills do not double-count outcomes).  
**Unrealized / MTM / cash movements:** Out of scope for cell net (realized closed outcomes only).  
This is **day net**, not capital-layer equity change (JE-4).

### 4.2 Day R:R (cell)

Where outcomes exist, show **realized day R:R** from the **same outcome buckets** as Reports (entry R2R aggregate or outcome R-multiple path — **one shared helper**, Hotel gate).  

| Density | Behavior |
|---------|----------|
| Desktop month/week | Prefer **amount + R:R** in cell |
| Mobile tight | **Amount wins**; R:R on tap / day open (JE-6) |

**Provenance flag:** R:R was Coach-endorsed in the exposure ratification conversation (“gradient along with the P&L and R2R”). If Coach later says R:R was rationale only, strike cell R:R; amount + gradient remain.

Hotel: a red day at **designed** R:R must never be framed as moral failure in copy or tooltips.

### 4.3 Period P&L

| Period | Formula |
|--------|---------|
| **Month P&L** | `Σ day_net(D)` for `D` in the visible calendar month under scope |
| **Week P&L** | `Σ day_net(D)` for Mon–Sun of the visible week under scope |

Place **above** the calendar. Labels: `Month P&L` · money · optional outcome-day count; same for week.

### 4.4 Practice scope (post-amendment vocabulary — JE-3)

| Chrome state | Day net includes |
|--------------|------------------|
| **Account selected, no campaign** | All closed outcomes on that account (**directed + undirected**) |
| **Campaign selected** | Outcomes **stamped** to that campaign only |
| **Undirected filter** (if chrome exposes it) | Outcomes with **null** campaign stamp on the account |
| **All accounts** | Outcomes across books only when chrome is truly “all” |

**No “default book / ledger” language.** Account is the top-level money home; campaigns are deliberate stamps only.

**Stamp redirect:** Changing a trade’s campaign stamp **changes historical campaign-scoped maps** (E13). Acceptance case required.

---

## 5. UX

### 5.0 Exposure map toggle (E12 — required)

| Item | Spec |
|------|------|
| Control | Persistent per-member **Equity map** / **Day net map** on/off on Journal calendar chrome |
| **Default** | **OPEN** — Coach one-word still welcome; Advisor recommendation **default ON** (exposure as practice; off is mercy). *If Coach says OFF for onboarding, flip here and in tests.* |
| **On** | Amounts, gradient, period bar, R:R (per density) |
| **Off** | Calendar reverts to **activity-only chrome** — **no residual money chrome** (no amounts, gradient, period bar, R:R) |
| Persistence | Survive sessions (identity-scoped preference; Family B) |
| Copy (Tango) | Teaches, never taunts. Off-switch is neutral (“Hide day net map”), not a dare or shame |

Toggle does **not** affect Journal chat (CJ-6).

### 5.1 Month grid cell (map ON)

1. **Day number** (existing).  
2. **Amount** (tabular nums): `+$120`, `−$45`, `—`.  
3. **R:R** (compact) when space allows.  
4. **Background gradient** from derived day net magnitude + sign (E11).  
5. Existing activity marks (journal presence / bands) — stack without deleting amount (E9).

**Tap:** Open Journal day (unchanged).

### 5.2 Week view (map ON)

Each day: gradient + amount (+ R:R if space). GX/AM/PM/CL bands remain **process** chrome — not recolored as win/loss scoreboards.

### 5.3 Period total bar (map ON, above chart)

```
┌──────────────────────────────────────────────────────────┐
│  Month P&L     +$1,240.50    ·  14 outcome days          │
│  [ Equity map ON  ⬤ ]                                    │
└──────────────────────────────────────────────────────────┘
│                    [ month grid ]                         │
```

- Positive / negative totals may use green/red **text** on this bar only when map is ON (same sanctioned surface family).  
- No outcomes: neutral “No closed outcomes this period”.  
- Optional scope subtitle: account · campaign.

### 5.4 Gradient scale (derived only)

| Condition | Color |
|-----------|--------|
| No outcomes | Neutral surface — no red/green wash |
| Flat / tiny | Lowest non-zero bucket |
| Moderate / large | Progressively deeper green or red |

**Normalization — fixed buckets (JE-5, Coach-stable intensity):**

Intensity must be **stable across months** so quiet months do not paint as dramatic as volatile ones.

**v0.1 default buckets (fail-loud constants in code):**

| \|day_net\| (USD) | Intensity step |
|------------------|----------------|
| no outcomes | none |
| &lt; 50 | 1 (light) |
| &lt; 250 | 2 |
| &lt; 1_000 | 3 |
| &lt; 5_000 | 4 |
| ≥ 5_000 | 5 (deep) |

Sign selects green vs red family. **Rejected:** period-max normalization. **Later option:** capital-relative after OD-SV/OD-MC mature denominators.

**Rejected:** solid binary red/green blocks without magnitude steps (Coach).

### 5.5 Declaration control

**Removed from this surface** (JE-2 Coach).  

**Ideas inventory (not deleted):** member-authored **process-quality map** (e.g. “good process / bad process” tone) as a future second channel or Journey-side surface — doctrinally clean, not mixed into this money channel.

---

## 6. API contract

### 6.1 Read: day net map

```
GET /api/me/journal/day-net-calendar
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD
  &account_id=
  &practice_campaign_id=
  &undirected=   # optional true = null stamp only
```

Alias acceptable: `/api/me/journal/equity-days` during migration; prefer `day-net-calendar` in new code.

**Response:**

```json
{
  "timezone": "America/New_York",
  "from": "2026-08-01",
  "to": "2026-08-31",
  "scope": {
    "account_id": 12,
    "practice_campaign_id": null,
    "undirected": false
  },
  "period": {
    "net": 1240.5,
    "outcome_days": 14,
    "credit_days": 9,
    "debit_days": 5
  },
  "days": [
    {
      "date": "2026-08-04",
      "net": 120.0,
      "outcome_count": 2,
      "tone": "credit",
      "intensity_step": 2,
      "day_r2r": 1.4,
      "day_r2r_sample_n": 2
    }
  ]
}
```

| Field | Notes |
|-------|--------|
| `net` | Day debit/credit; null if no outcomes |
| `tone` | `credit` \| `debit` \| `flat` \| `none` — **derived only** |
| `intensity_step` | 0–5 from fixed buckets (§5.4); client maps to CSS tokens |
| `day_r2r` | Realized day R:R; null if none / insufficient sample |
| `day_r2r_sample_n` | Outcomes contributing to R:R |

**No** `declared_tone` / `effective_tone` on this surface.

**Implementation:** Reuse trade analytics / day bucketing + Reports R path; **no Journal-side PnL fork** (Advisor: survives all resolutions).

### 6.2 Member preference: map toggle

```
GET  /api/me/journal/preferences
PATCH /api/me/journal/preferences
{ "day_net_map_enabled": true | false }
```

Family B prefs row (or column on existing journal prefs). Default per §5.0.

### 6.3 Entitlement

Same floor as Journal (`_require_tool_member`). Export of prefs optional later.

---

## 7. Data model

**No storage of day net or R:R** (always derived).

**Toggle only:**

```sql
-- illustrative
ALTER TABLE ... -- or member_journal_prefs
  day_net_map_enabled TINYINT(1) NOT NULL DEFAULT 1;
```

Default `1` (ON) unless Coach flips §5.0.

---

## 8. Frontend placement

| Area | Change |
|------|--------|
| `JournalCalendar.tsx` | Toggle; period bar; month/week cells amount + gradient + R:R; off-state cleanliness |
| Practice Context | account / campaign / undirected → query params; `prefsReady` gate |
| Money + R:R display | Shared Reports helpers |
| Echo | Toggle placement; mobile density prototype before JED-2 locks layout |

**Loading:** One payload for bar + grid. **Empty period:** neutral copy; grid still navigable.

---

## 9. Non-goals (v0.1 ship)

| Out | Why |
|-----|-----|
| Unrealized / marks in cells | Separate marks ops |
| Replacing Reports equity curve | Reports owns path analytics |
| P&L in chat, prompts, notifications | CJ-6 · E5 |
| Ambient map with no off switch | E12 |
| Member process-tone paint on this map | JE-2; inventory only |
| Solid binary red/green tiles | Coach rejection |
| Period-max intensity | JE-5 / E11 |
| Gamification (streaks, confetti) | Process-first |
| Multi-currency | USD until capital expands |

---

## 10. CJ-6 and exposure

CJ-6 forbids P&L theater in **prompts, notifications, start-your-day copy**.

**Holds:**

- No push “you’re red today.”  
- No composer open with money shame.  
- Chat and tags stay process-first.

**Ratified exception (calendar only):** When the member has the **exposure map ON**, the calendar may show full valence gradient + amounts + period bar as **chosen looking** — training, not ambush.

Tango: copy teaches acceptance and R:R literacy; never taunts.

---

## 11. Acceptance tests

| # | Case | Expect |
|---|------|--------|
| T1 | Month mixed days, map ON | Amounts; magnitude-scaled greens/reds; Month P&L = Σ nets |
| T2 | Week, map ON | Week P&L = Σ day nets |
| T3 | Account switch | Re-fetch; no stale other book |
| T4 | Campaign filter | Stamped outcomes only |
| T5 | Undirected filter | Null-stamp outcomes only (if exposed) |
| T6 | Journal day, no closes | Neutral, no `$0.00` |
| T7 | Open+close same day | Single day net / structure doctrine |
| T8 | prefsReady false | No wrong full-book flash |
| T9 | Map OFF | Zero money chrome; activity chrome only |
| T10 | Toggle persists | Reload keeps on/off |
| T11 | Campaign stamp redirect | Past day under campaign scope re-buckets (E13) |
| T12 | Quiet month vs loud month | Same $50 day same intensity_step (fixed buckets) |
| T13 | Mobile density | Amount visible; R:R may be tap-only |
| T14 | Accessibility | Screen reader gets amount without relying on color |

---

## 12. Ship slices

| Slice | Deliverable |
|-------|-------------|
| **JED-1** | API day-net-calendar read (nets + period + intensity_step + day_r2r) + unit tests |
| **JED-1b** | Prefs toggle API + default ON |
| **JED-2** | Month: amounts, **gradient**, Month P&L bar, toggle; Echo density pass |
| **JED-3** | Week: amounts, gradient, Week P&L |
| **JED-4** | Year heatmap (optional) |
| **JED-5** | ~~Declaration~~ **Cancelled** — process map inventory only |
| **JED-6** | R:R in cell (or tap) once JED-2 density proven |

**JED-1 may start under any prior uncertainty; JED-2 must not paint cells without E10–E12.**

---

## 13. Open decisions

| # | Status | Notes |
|---|--------|--------|
| Derived-only vs declaration | **Closed** | Derived money map only; declaration dropped (JE-2) |
| Intensity normalization | **Closed for v0.1** | Fixed buckets §5.4 (JE-5); capital-relative later |
| Campaign scope vocabulary | **Closed** | §4.4 post-amendment (JE-3) |
| Valence on Journal calendar | **Closed** | Sanctioned gradient exception (JE-1 Coach) |
| Toggle required | **Closed** | E12 |
| **Toggle default ON vs OFF** | **Default ON** (Advisor rec); Coach may flip one word | |
| Year amounts | Open | Optional |
| R:R in cell vs rationale-only | **In cell when density allows**; flagged if Coach strikes | |
| Export prefs | Open | Default no for v0.1 |
| Bucket thresholds ($50 / $250 / …) | Open to Coach tweak | Fail-loud constants |

---

## 14. Agent gates (from Resolution)

| Holder | Question |
|--------|----------|
| **Tango** | Exposure copy teaches; off-switch neutral |
| **Hotel** | R:R matches Reports; red-at-designed-R:R ≠ failure |
| **Echo** | Toggle placement; cell density; off-state cleanliness |
| **Kilo** | Toggle persistence; off = zero money chrome; T11 re-bucket |
| **Lima** | Carve-out decision log vs Positions V8 |

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-08-09 | v0.1 draft — gradients, cell amounts, month/week P&L |
| 2026-08-09 | Advisor review JE-1…JE-6 |
| 2026-08-09 | Coach Resolution — exposure map; valence exception; money map only; toggle; R:R; fixed-bucket gradient |
| 2026-08-09 | **v0.2** — folded review + resolution; renamed Day Net Calendar; declaration removed |
| 2026-08-09 | Linked Full Agent Bench Plan v1.0 + `agents/p-journal-day-net/` board |

---

*End of Spec v0.2 — Coach-ratified instrument; ready for W0 GO then JED-1.*
