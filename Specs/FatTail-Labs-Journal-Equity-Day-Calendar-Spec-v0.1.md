# FatTail Labs — Journal Equity Day Calendar Spec v0.1

**Status:** DRAFT — product direction for implementation planning (not as-built)  
**Date:** 2026-08-09  
**Type:** Product / UX / data contract — **Journal year · month · week zoom-out**  
**Audience:** Implementation agents (Claude / bench) · Coach review  
**Parents / companions:**

| Spec / surface | Role |
|----------------|------|
| [Journal Session Spec v0.6](./FatTail-Labs-Journal-Session-Spec-v0.6.md) | One conversation per date; day is SoR for process narrative |
| [Continuous Journaling Direction 2026-08-02](./FatTail-Labs-Continuous-Journaling-Direction-2026-08-02.md) | Capture-in-the-moment; process language; **CJ-6 no P&L theater in prompts** |
| Practice Context (as-built `practiceContext.tsx`) | Account · campaign · date granularity shared across Practice |
| Trade Log Spec v1.1 · Reports analytics | Book of record for fills and closed outcomes |
| Architecture `11-practice-domain-single-source.md` | Day book / days-interest / effective realized PnL |

**As-built anchors (do not invent parallel day math):**

- `GET /api/me/trade-log/analytics/days-interest` — which days have book interest  
- Day book / reports outcome path for **realized** day net (closed outcomes)  
- Journal calendar: `web/components/journal/JournalCalendar.tsx` (Year · Month · Week · Day)

---

## 0. Mission

Make **year / month / week** Journal views scannable as an **equity day map**:

1. Every calendar day can show a **debit or credit amount** (day net).  
2. Days paint in a **red ↔ green gradient** for equity tone.  
3. **Month view** and **week view** show a **period P&L total above the calendar** (not buried in day drill-in).

This is **Journal chrome for process + book awareness at zoom-out** — not a second Reports app, and not a win/loss scoreboard in the chat composer.

---

## 1. Problem

| Today | Pain |
|-------|------|
| Month/week cells mostly signal “activity” (trades / journal presence) | Member cannot see **how the book moved** without leaving Journal |
| No period net on the calendar chrome | “What was this week / month?” requires Reports hop |
| Color, when present, is not equity-honest | Process and money narratives stay disconnected at zoom-out |

Coach want: declare (or derive) each day as **positive / negative equity day**, show **gradients of red and green**, put **$ debit/credit in the monthly cell**, and put **monthly & weekly P&L above the chart**.

---

## 2. Laws

| ID | Law |
|----|-----|
| **E1 — One scope** | Day nets and period totals use **Practice Context**: account · campaign · same book as Trade Log / Reports. No silent “all accounts” while chrome shows one book. |
| **E2 — Trade Log is money SoR** | Day debit/credit is **derived from closed outcomes** (effective realized), not typed into the calendar as a free number. |
| **E3 — Gradient is tone, amount is fact** | Cell **amount** is always the derived day net. Cell **color** may follow derived net by default; optional **member declaration** can override *tone only* (see §5). |
| **E4 — No second equity curve store** | Recompute day nets at read from trade book (or reuse analytics day buckets). No new mark-to-market series for this surface. |
| **E5 — Process chat stays process** | Journal **composer / session interview** does not lead with P&L prompts (CJ-6). Equity map is **calendar chrome**, not chat theater. |
| **E6 — Empty ≠ zero** | Days with no closed outcomes show **empty / em-dash**, not `$0.00`, unless product later ratifies “flat day” explicitly. |
| **E7 — Timezone honesty** | Calendar day = **America/New_York** trade day (same convention as Journal session date / Trade Log day book). Spec this once; fail loud if API and UI disagree. |
| **E8 — Period total matches sum of days** | Month P&L = Σ day nets of days in the visible month under scope. Week P&L = Σ day nets in the visible week. No alternate formula. |
| **E9 — Accessibility** | Color is never the only signal: amount text + `aria`/title (“credit $X” / “debit $Y” / “no closed outcomes”). |

---

## 3. Scope by view

| View | Equity map | Amount in cell | P&L above calendar |
|------|------------|----------------|--------------------|
| **Year** | Heatmap / mini-month tiles by day tone (gradient) | Optional small amount later; **v0.1: tone-only or count badge OK** | Optional year total later; **v0.1: not required** |
| **Month** | Full grid, gradient fill per day | **Required:** day debit/credit amount | **Required:** Month P&L |
| **Week** | Day columns / bands remain; each day shows tone + amount | **Required:** day amount on each day column | **Required:** Week P&L |
| **Day** | Out of scope for this Spec’s grid (day drill-in already has trades panel) | N/A | N/A — day detail uses existing DayTradesPanel |

**v0.1 ship focus:** Month + Week (amounts + period totals + gradients). Year tone heatmap is **nice-to-have** in the same API.

---

## 4. Definitions

### 4.1 Day net (debit / credit)

For identity + Practice scope + calendar date `D` (ET):

```
day_net(D) = Σ effective_realized_pnl of closed outcomes whose
             outcome day (ET) = D
             AND trade in scoped account / campaign
```

| Term | Meaning |
|------|---------|
| **Credit** | `day_net > 0` — display as green family, amount with `+` or plain positive money |
| **Debit** | `day_net < 0` — display as red family, amount as negative or parenthetical |
| **None** | No closed outcomes that day — no amount (or “—”); neutral / empty cell background |
| **Flat** | `day_net === 0` with ≥1 closed outcome — show `$0.00`, neutral or near-zero gradient |

**Structure counting:** Use the same open/close / structure doctrine as Reports / account `trade_count` (close fills do not invent a second “outcome day” double-count). Day net is **outcome P&L**, not fill count.

**Open positions:** Unrealized / MTM is **out of scope** for v0.1 cell amounts (options MTM still at-cost by product elsewhere). Cell is **realized closed outcomes only**.

### 4.2 Equity day tone

| Tone source | Behavior |
|-------------|----------|
| **Derived (default)** | Map `day_net` → gradient position (see §6). |
| **Declared (optional v0.1 or v0.2)** | Member sets day to positive / negative / neutral *tone*, independent of amount. **Amount never changes.** UI must show “declared” affordance so money and tone can disagree honestly. |

**Recommendation for first ship:**  
- **v0.1a:** Derived-only tone + amounts + period totals (ship fast, no new write table).  
- **v0.1b:** Add declaration override (Family B row per identity + day).

Coach may choose a or b; API should leave room for declaration without blocking a.

### 4.3 Period P&L

| Period | Formula |
|--------|---------|
| **Month P&L** | `Σ day_net(D)` for all `D` in the visible calendar month under scope |
| **Week P&L** | `Σ day_net(D)` for Mon–Sun of the visible Practice week under scope |

Place **above** the calendar chart/grid (not only in a footer). Label clearly:

- `Month P&L` · money · optional trade-day count  
- `Week P&L` · money · optional trade-day count  

When Practice chrome granularity is Year/Month/Week, Journal view mode should stay aligned (existing coupling to Practice date).

---

## 5. UX

### 5.1 Month grid cell

Each day cell includes:

1. **Day number** (existing).  
2. **Amount** (tabular nums, compact): e.g. `+$120`, `−$45`, `—`.  
3. **Background / border gradient** from tone (derived or declared).  
4. Existing activity affordances (journal session / bands) must **not** be displaced — stack: tone fill → day # → amount → small activity marks if needed.

**Density:** Use condensed money (no cents under $1k optional; always cents for &lt; $100). Spec implementer: match Reports money helpers where possible.

**Tap:** Still opens that day (Journal day view) — unchanged navigation.

### 5.2 Week view

Each day column header or body shows:

- Tone gradient strip or fill  
- Day net amount  
- Existing GX/AM/PM/CL process bands remain process chrome (not recolored as win/loss)

### 5.3 Period total bar (above chart)

```
┌─────────────────────────────────────────────────────────┐
│  Month P&L          +$1,240.50     ·  14 outcome days   │
└─────────────────────────────────────────────────────────┘
│                    [ month grid ]                        │
```

Week:

```
│  Week P&L           −$320.00       ·   3 outcome days   │
```

- Positive total → green-tint text (not a trophy).  
- Negative total → red-tint text.  
- Zero / no outcomes → neutral “No closed outcomes this period”.  
- Scope line optional: account label · campaign label (if space).

### 5.4 Gradient scale (derived)

Map signed day net to color intensity:

| Condition | Color |
|-----------|--------|
| No outcomes | Neutral surface (no green/red wash) |
| Near zero | Very light green or red (or gray if \|net\| &lt; ε) |
| Moderate | Mid green / mid red |
| Large | Deep green / deep red |

**Normalization (pick one; fail loud in code comments):**

1. **Relative to period:** intensity = \|day_net\| / max(\|day_net\| in period, ε) — good for month heatmap.  
2. **Relative to starting capital:** intensity = \|day_net\| / starting_balance of scoped account (if set).  
3. **Fixed buckets:** e.g. &lt;$50 / &lt;$250 / &lt;$1k / above.

**v0.1 default recommendation:** (1) relative to period max on month/week — local contrast without capital dependency.

**Do not** use hue alone for color-blind users — amount text is mandatory.

### 5.5 Declaration control (if v0.1b)

On day open or long-press / overflow on cell:

- Tone: **Auto** · **Positive** · **Negative** · **Neutral**  
- Auto = follow day_net  
- Manual stores only `declared_tone`; amount remains derived  

Copy: “Tone for the calendar map — does not change book P&L.”

---

## 6. API contract (proposed)

### 6.1 Read: day equity map

```
GET /api/me/journal/equity-days
  ?from=YYYY-MM-DD
  &to=YYYY-MM-DD
  &account_id=   (optional; null = Practice “all” only if chrome is all)
  &practice_campaign_id=  (optional)
```

**Response:**

```json
{
  "timezone": "America/New_York",
  "from": "2026-08-01",
  "to": "2026-08-31",
  "scope": {
    "account_id": 12,
    "practice_campaign_id": null
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
      "derived_tone": "credit",
      "declared_tone": null,
      "effective_tone": "credit",
      "intensity": 0.42
    }
  ]
}
```

| Field | Notes |
|-------|--------|
| `net` | Day debit/credit; omit or null if no outcomes |
| `derived_tone` | `credit` \| `debit` \| `flat` \| `none` |
| `declared_tone` | `credit` \| `debit` \| `neutral` \| null |
| `effective_tone` | Declaration wins if set; else derived |
| `intensity` | 0..1 for gradient (server or client may compute; **one place only**) |

**Implementation preference:** Reuse trade analytics / day bucketing; do not fork PnL math in the Journal route.

### 6.2 Write: declaration (v0.1b)

```
PUT /api/me/journal/equity-days/{date}
{ "declared_tone": "credit" | "debit" | "neutral" | null }
```

Family B: `identity_id` + `date` unique. `null` clears to Auto.

### 6.3 Entitlement

Same floor as Journal / Practice tools (`_require_tool_member` read/write). Export optional later (not v0.1 required).

---

## 7. Data model (declaration only)

If v0.1b:

```sql
-- illustrative
CREATE TABLE member_journal_equity_day_tones (
  identity_id BIGINT NOT NULL,
  day_et DATE NOT NULL,
  declared_tone ENUM('credit','debit','neutral') NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (identity_id, day_et),
  ...
);
```

No storage of day net (always derived).

---

## 8. Frontend placement

| File / area | Change |
|-------------|--------|
| `JournalCalendar.tsx` | Month/week: fetch equity-days for visible range; period bar; cell amount + gradient |
| Practice Context | Pass `accountIdParam`, `campaignId`, range from month/week bounds |
| Money display | Shared helper (Reports money format) — avoid third formatter |
| Year view | Optional: intensity heatmap without amounts in v0.1 |

**Loading:** Period bar and grid wait on same payload (or skeleton cells). No flash of wrong book — respect `prefsReady`.

**Empty period:** “No closed outcomes in this month/week” in the period bar; grid still navigable.

---

## 9. Non-goals (v0.1)

| Out | Why |
|-----|-----|
| Unrealized / live marks in cells | Marks ops separate; Journal zoom-out = realized |
| Replacing Reports equity curve | Reports remains path analytics |
| P&L prompts in Journal chat | CJ-6 |
| Gamification (streaks, badges, confetti) | Sacred process-first |
| Broker sync of day P&L | FatTail book only |
| Multi-currency | USD book assumption unless capital later expands |

---

## 10. Tension with Continuous Journaling CJ-6

CJ-6: *Never P&L theater in prompts, notifications, or “start your day” copy.*

**Resolution in this Spec:**

- Equity map is a **calendar instrument**, like a blotter heatmap — factual, scoped, dull-honest.  
- **Do not** add push notifications “you’re red today.”  
- **Do not** open the day composer with “How does −$400 feel?”  
- Chat and tags remain process-first; money lives in **cells and one period total**.

If Coach finds month P&L too scoreboard-like, fall back to **amounts without period total** or **tone without amounts** — product dial, not silent omission.

---

## 11. Acceptance tests

| # | Case | Expect |
|---|------|--------|
| T1 | Month with mixed days | Cells show +/− amounts; greens/reds; Month P&L = sum of cell nets |
| T2 | Week view | Week P&L = sum of seven day nets under scope |
| T3 | Account switch in chrome | Map and period total re-fetch; no stale other book |
| T4 | Campaign filter set | Only stamped outcomes (and book rules consistent with Trade Log) |
| T5 | Day with journal, no closes | Neutral cell, no `$0.00` unless flat outcomes |
| T6 | Open+close same day | One day net from outcomes, not double fill count |
| T7 | Declaration (if built) | Tone changes; amount unchanged; Auto clears declaration |
| T8 | prefsReady false | No fetch / no wrong full-book flash |

---

## 12. Ship slices (suggested)

| Slice | Deliverable |
|-------|-------------|
| **JED-1** | API equity-days read (derived nets + period) + unit tests |
| **JED-2** | Month grid amounts + gradient + Month P&L bar |
| **JED-3** | Week amounts + Week P&L bar |
| **JED-4** | Year tone heatmap (optional) |
| **JED-5** | Declaration override + migration (optional) |

---

## 13. Open decisions (Coach / Claude)

1. **v0.1a derived-only vs v0.1b declaration** in first PR?  
2. **Intensity normalization:** period-relative vs capital-relative vs buckets?  
3. **Campaign scoping of day net:** exact stamp only vs default-book whole-account rule (must match Trade Log blotter doctrine).  
4. **Year amounts:** never / optional compact / same as month?  
5. **ε for near-zero** intensity floor?  
6. Export equity-day tones in Practice pack? (default no for v0.1)

---

## 14. Document history

| Date | Note |
|------|------|
| 2026-08-09 | v0.1 draft from Coach product direction: equity day gradients; month cell debit/credit; monthly & weekly P&L above calendar |

---

*End of Spec v0.1 — ready for Claude handoff / Coach ratification.*
