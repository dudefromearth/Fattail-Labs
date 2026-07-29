# FatTail Labs — Journey Experience Spec v1.0

**Status:** Approved as built (Coach intent 2026-07-29; as-built through tenure-weighted grades)  
**Version note:** v1.0 body updated same-day for process integrity grades, tenure weighting, Establishing state, and G1 upgrade north star (DL-073, DL-074).  
**Surface family:** Journey (Apps) · Member Home · Profile visibility  
**Author:** Juliet · Implementation Alpha/Charlie as-built  

**Parents / siblings (do not replace; this Spec is the experience umbrella):**

| Doc | Relationship |
|-----|----------------|
| Application Framework Spec v1.0 | Journey template Family B; **no second progress store** |
| Member-Data-Privacy Spec v0.1 | Isolation, consent; DS-2 Journey is derived |
| Progress Tracking Spec v1.0 | `enrollments` + `lesson_progress` SoR |
| Member Profile + Journey Visibility Spec v1.0 | Avatar, opt-in, share pillars |
| Journey Gamification Spec v1.0 | Formulas, contribution pillars, check-ins, meter math |
| Dual-Goal Product Strategy (docs) | G1 / G2 north stars (not a Spec; product strategy) |
| Membership Tiers Spec v1.0 | Plans/roles that drive **meter profiles** |

---

## 1. Intent

Journey is the member’s **path and standing** surface: where they see how they are
doing on the work that improves long-term success, and (optionally) how they show up
in the community as process peers—not as a P&L contest.

### Dual goals (product north stars)

| ID | Goal | Journey role |
|----|------|----------------|
| **G1** | **Engage the trial** — maximize chance **Observer → Navigator** and they **continue practice** | Observer-trial **meter profile** (6-week focus); home framing; honest Navigator CTA |
| **G2** | **Continuous improvement** — measure → act → report for Activator/Navigator | Longer meter horizons; process persistence; full Practice loop (Trade Log, Journal, Retro…) |

G1 and G2 are **sequential for a person** (trial → paid) and **parallel as product investments**.

### Dual standing (experience)

| Standing | Audience | Nature |
|----------|----------|--------|
| **Personal** | Self only | **Process meter** — how well you stick to routine, learning, live, adherence, practice persistence. Not trophies. |
| **Community** | Opt-in peers | **Community board** — name, photo, only **shared** process pillars; rank by public contribution |

Members may **increase community presence** while keeping personal growth (and other pillars) private via Profile share flags.

### Success criteria

1. Signed-in members can open **`/app/journey`** and see learning path + personal process + community board.  
2. Progress is **derived** from enrollments / lesson_progress (DS-2) — no `journey_*` copy tables for course completion.  
3. Personal process is a **meter** (profile-shaped windows) with a **process integrity grade** (Poor→Excellent), not achievement badges.  
4. **Fresh members do not start at Poor** — tenure weights grades; Establishing until practice is earned.  
5. Community board is **opt-in**, process-peer framed, no P&L / Family B content / email / identity_id.  
6. **G1** surfaces nudge habit + trust + **continue as Navigator** without shame or bait-and-switch.  
7. **G2** surfaces support long-arc persistence for paid members.  
8. Live **check-in** feeds attendance / process / board streaks.  
9. Spec, decision log, and implementation stay validatable without reading only code.

---

## 2. Experience map (member-facing)

### 2.1 Primary: Journey app — `/app/journey`

Apps catalog card (`apps.slug = journey`). Single progress + standing page.

**Layout (top → bottom):**

1. Breadcrumb: Apps › Journey  
2. Title + framing (process over pace; opt-in community; never profit ranking)  
3. Link: Profile & visibility  
4. **Personal process + Community presence** (`JourneyScores`)  
5. Learning stats (enrolled / in progress / completed / lessons)  
6. Pathway + next live (`DashboardExtras`)  
7. **Enrollments** list with resume  
8. **Quiz results + activity** (`JourneyHistory`)  
9. **Community board** (`JourneyLeaderboard`)

### 2.2 Daily home — `/home` (login-landing)

Post-login landing (layout reference only — not a clone of external products).

| Column | Content |
|--------|---------|
| **Main** | Welcome; G1 framing for trial/free; continue learning; my learning progress; recommended courses |
| **Rail** | Personal standing (**ProcessMeter**); community standing (compact board); next steps; G1 **Continue as Navigator** CTA when applicable |

Login / SSO / dev-login redirect → `/home`. Avatar menu: Home · Profile · Journey.

### 2.3 Profile — `/me`

- Display name, avatar upload  
- Master **Show me on the Journey community board** (`journey_visible`)  
- Per-pillar share: reputation (default on), **personal growth (default off)**, attendance (default on)  
- **Session idle timeout** (minutes): default **30**, member-adjustable **15–60**; not shown for administrators  
- Manage billing  

### 2.3b Idle session timeout (security)

| Rule | Spec |
|------|------|
| Applies to | All signed-in roles **except** `administrator` (and internal `identity_id` 0) |
| Default | **30 minutes** of no activity |
| Adjustable | **15–60 minutes** via Profile (`session_idle_minutes`) |
| Activity | Mouse, keyboard, scroll, touch, click, wheel; timer resets on activity |
| On timeout | Server logout (clear cookie) → redirect **`/login?idle=1`** with notice |
| Storage | `identities.session_idle_minutes` (migration 045); exposed on `/api/me/profile` and `/api/auth/me` |
| Client | `web/components/IdleSessionGuard.tsx` mounted in `AppChrome` |  

### 2.4 Live — check-in

On session detail: **Check in** during join window; feeds process meter live presence + board attendance streak.

### 2.5 Retired / redirected

| Old | New |
|-----|-----|
| My Learning (`/me` content) | Progress on Journey; Profile is preferences |
| Dashboard (`/dashboard`) | Redirect → `/app/journey` |

---

## 3. Information architecture

```
┌─────────────────────────────────────────────────────────────┐
│  PERSONAL (always private)                                  │
│  • Process meter (profile-shaped)                           │
│  • Full contribution scores (for self)                      │
│  • Enrollments, quizzes, activity                           │
│  • Pathway / live next step                                 │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│  COMMUNITY (opt-in journey_visible)                         │
│  • Display name + avatar                                    │
│  • Shared pillars only (null / "—" if not shared)           │
│  • Public contribution = formula on shared pillars only     │
│  • Rank among opt-in members                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Process meter (personal standing)

**Framing:** How well you are doing the things that improve long-term success —
routine, learning, live presence, plan adherence, **persistence with practice tools** —
not winning achievements. Presented as both a **%** and a **process integrity grade**
(trading-journal language: Poor → Excellent).

### 4.1 Meters (raw activity → 0–100)

| id | Label | Signal (v1) |
|----|-------|-------------|
| `persistence` | Practice persistence | Weeks with Trade Log, Journal notes, lessons, or live check-in |
| `routine` | Daily routine | Days with Trade Log or Journal in routine window |
| `learning` | Learning rhythm | Days with completed lesson in learning window |
| `live` | Live presence | Attendance streak vs profile live-streak cap |
| `adherence` | Process adherence | % trades tagged `followed`/`partial` (not P&L) |
| `retrospective` | Retrospectives | Placeholder until retro store ships (`soon`) |

**Raw overall** = average of non-empty, non-soon meter raw percents  
(`process.overall_raw_percent`).  
**Graded overall** = tenure-adjusted (`process.overall_percent` — drives needle + grade).

Each meter object may include: `percent` (graded), `raw_percent`, `grade`, `empty?`, `soon?`.

### 4.2 Process integrity grade (color scale)

Maps graded % to a **trading-psych process grade** — journal-style process integrity,
**not** P&L, talent, or personal worth.

| Band | Graded % | Label | Color | Blurb |
|------|----------|-------|-------|--------|
| `poor` | 0–24 | **Poor** | `#b91c1c` | Off process — reinstall the routine |
| `fair` | 25–49 | **Fair** | `#ea580c` | Developing discipline — partial process |
| `good` | 50–69 | **Good** | `#ca8a04` | Solid process integrity |
| `great` | 70–84 | **Great** | `#16a34a` | Disciplined process — habits holding |
| `excellent` | 85–100 | **Excellent** | `#047857` | Locked-in process integrity |
| `establishing` | n/a | **Establishing** | `#64748b` | Too early to grade — keep practicing to earn your process score |

**Invariants:**

1. **No day-one Poor.** Fresh accounts with no practice signal are **Establishing**, not Poor.  
2. **Extremes are earned.** Poor and Excellent require tenure + sustained process (see §4.3).  
3. Grades describe **the work**, not the person (Tango).

API:

- `process.grade` — `{ id, label, blurb, color, band_low, band_high, percent, establishing? }`  
- `process.grade_scale` — full legend for UI (Poor…Excellent only)  

### 4.3 Tenure-weighted grades (time in the game)

**Coach:** Starting time must count. Members earn Poor / Good / Excellent; the longer they
are in the program (profile ramp), the more fully the scale opens — it gets harder to
sit at the absolute extremes early.

```
tenure_days = days since identity.created_at (or earliest membership.started_at)
weight      = (tenure_days / grade_ramp_days)²     # square ease-in
graded%     = 50 + (raw% − 50) × weight            # pull toward center
```

| Phase | Behavior |
|-------|----------|
| **Establishing** | Tenure &lt; ~5 days **and** no practice signal → grade **Establishing**; needle at mid-scale (~50); no Poor badge |
| **Ramp** | Graded % compressed toward 50; weight rises with square of tenure/ramp — **harder to hit best or worst early** |
| **Min extreme days** | Even after pull, **Poor** (≤24) and **Excellent** (≥85) blocked until **≥ 7 calendar days** (floor Fair / cap Great) |
| **Full ramp** | `weight → 1`; graded % ≈ raw activity % |

**Profile `grade_ramp_days` (defaults):**

| Profile | grade_ramp_days | Notes |
|---------|-----------------|--------|
| `observer_trial` | **42** | Full 6-week trial before extremes fully open |
| `navigator_monthly` | 30 | Month-to-month |
| `navigator_annual` | **90** | Season before full Excellent/Poor range |
| `activator` | 30 | |
| `alumni` | 21 | |
| `free_observer` | 14 | |
| `administrator` | 30 | |

`process.tenure`:

```json
{
  "days": 0.0,
  "ramp_days": 42,
  "weight": 0.0,
  "establishing": true,
  "note": "Time in the game weights your grade: extremes (Poor / Excellent) open gradually — you earn them, you don't start there."
}
```

UI may show **Grade confidence N% · day X of ramp** while `weight < 1`.

### 4.4 Meter profiles (membership-shaped horizons)

Resolved in `resolve_meter_profile(cur, identity_id, role)` from active memberships + role.

| Profile id | When | Persistence horizon | Target weeks | grade_ramp_days | Product intent |
|------------|------|---------------------|--------------|-----------------|----------------|
| `observer_trial` | Plan `observer-trial` | **6 weeks** | 5 | 42 | **G1** — install habit; path to Navigator |
| `navigator_monthly` | Navigator/coaching ~monthly period | 12 weeks | 8 | 30 | **G2** — month-to-month CI |
| `navigator_annual` | Period span ≥ ~180 days | 26 weeks | 18 | 90 | **G2** — season-long CI |
| `activator` | Activator / labs-membership | 12 weeks | 8 | 30 | **G2** entry |
| `alumni` | courses-alumni | 12 weeks | 6 | 21 | Library rhythm |
| `free_observer` | No paid plan | 4 weeks | 3 | 14 | Getting started → trial/membership |
| `administrator` | Admin | 12 weeks | 8 | 30 | Member defaults |

**Coach:** Observer meter focus is **6 weeks** (even if marketing bills a 4-week trial).  
**G1 north star:** maximize **Observer → Navigator upgrade** and **continued practice**.

API returns `process.profile`: `{ id, label, horizon_label, focus }`.

### 4.5 ProcessMeter UI (as-built)

Component: `web/components/ProcessMeter.tsx` (Home rail + Journey).

| Element | Spec |
|---------|------|
| Grade badge | Colored label (ESTABLISHING / POOR / FAIR / GOOD / GREAT / EXCELLENT) |
| Percent | Graded overall % (hidden or de-emphasized while Establishing) |
| Scale bar | Five colored segments (Poor→Excellent); current band full opacity |
| **Needle** | Vertical indicator at graded %; **extends ~35% above and below** the band; ~3px thick + top/bottom caps so it is easy to see |
| Sub-meters | Label, grade chip, graded %, bar in grade color |
| Tenure copy | Confidence / day-of-ramp when still ramping; Establishing explainer when ungraded |

### 4.6 Implementation

| Piece | Location |
|-------|----------|
| Domain | `server/journey_scores.py` — `process_meters`, `process_grade`, `apply_tenure_to_percent`, `member_tenure_days`, `resolve_meter_profile`, … |
| API | `GET /api/me/journey/scores` → `process` object |
| UI | `ProcessMeter.tsx`, `JourneyScores.tsx`, `MemberHome.tsx` |
| Tests | `server/tests/test_journey_scores.py` |  

---

## 5. Community presence (community standing)

### 5.1 Opt-in + share pillars

| Field | Default | Meaning |
|-------|---------|---------|
| `identities.journey_visible` | **0** | Appear on board with name + photo |
| `share_reputation` | **1** | Courses completed, threads, replies on others’ threads, reviews |
| `share_personal_growth` | **0** | Lessons + quizzes — **private by default** |
| `share_attendance` | **1** | Live check-in streak |

**Public contribution** (rank axis) uses only shared pillars (hidden = 0 in formula).  
Board cells for unshared pillars are `null` (UI: "—").

### 5.2 Contribution pillars (for board / public formula)

| Pillar | Points (see Gamification Spec) | Source tables |
|--------|--------------------------------|---------------|
| Reputation | Course complete, threads, comments on others’ threads, reviews | enrollments, threads, comments, reviews |
| Personal growth | Lessons complete, quiz attempts | lesson_progress, quiz_attempts |
| Attendance streak | Consecutive Eastern weeks with check-in | live_session_checkins |
| Contribution | `W_REP*rep + W_GROW*growth + W_ATT*min(streak, STREAK_CAP)` | derived |

Defaults: W_REP=1, W_GROW=1, W_ATT=8, STREAK_CAP=12 (board formula; live meter uses profile cap for personal % display).

### 5.3 Framing

- Labels: community board, process peers, contribution, attendance streak  
- Avoid: beat, top trader, winning, confetti spam, loss-aversion CTAs  
- Self row: subtle highlight (`is_self`)

### 5.4 Reserved

Strategy Life Cycle / Strategy Lab **share** events may feed Reputation in a later Spec addendum — never auto-publish private strategy content.

---

## 6. Learning path (derived progress)

### 6.1 Journey progress payload

`GET /api/me/journey` — **source of truth:** `enrollments` + `lesson_progress` only.

```json
{
  "source": "enrollments+lesson_progress",
  "stats": {
    "courses_enrolled": 0,
    "courses_completed": 0,
    "courses_in_progress": 0,
    "lessons_completed": 0,
    "watch_seconds": 0
  },
  "courses": [
    {
      "slug": "…",
      "title": "…",
      "level": "…",
      "percent": 0,
      "lessons_done": 0,
      "lessons_total": 0,
      "enrolled_at": "…",
      "completed_at": null,
      "resume": { "module_slug", "lesson_slug", "title", "module_title" } | null
    }
  ]
}
```

### 6.2 History

- Quiz results: `GET /api/me/quiz-results`  
- Activity feed: `GET /api/me/activity`  
- Pathway / live: existing pathway + live APIs (DashboardExtras)

**Invariant (DS-2):** No second store of completion percents. No `journey_progress` table.

---

## 7. Live check-in

| Item | Spec |
|------|------|
| Table | `live_session_checkins` (migration 043) |
| Key | `session_key` — `"42"` or `"r{recurrence_id}-{YYYY-MM-DD}"` |
| Window | `[starts_at − 15m, starts_at + 4h]` |
| API | `POST /api/live/check-in` body `{ session_key, starts_at }`; `GET /api/live/check-in?session_key=` |
| UI | `CheckInControl` on live session detail |
| Idempotent | UNIQUE (identity_id, session_key) |

---

## 8. API catalog

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/me/journey` | session | Derived enrollments + stats |
| GET | `/api/me/journey/scores` | session | Self scores + `process` meter + rank if visible |
| GET | `/api/journey/leaderboard` | session | Opt-in board rows |
| GET | `/api/journey/presence` | session | Name+avatar roster (compat; board preferred) |
| GET/PATCH | `/api/me/profile` | session | Profile + visibility + share flags |
| POST/DELETE | `/api/me/profile/avatar` | session | Avatar media |
| POST/GET | `/api/live/check-in` | session | Attendance |
| GET | `/api/auth/me` | session | Includes `avatar_url` for chrome |

### 8.1 Scores response (shape)

```json
{
  "reputation": 0,
  "personal_growth": 0,
  "attendance_streak": 0,
  "contribution": 0,
  "process": {
    "framing": "process_meter",
    "profile": {
      "id": "observer_trial",
      "label": "Observer trial",
      "horizon_label": "6-week focus",
      "focus": "…"
    },
    "overall_percent": 50,
    "overall_raw_percent": 0,
    "overall_label": "Establishing your process — grades open as you practice",
    "grade": {
      "id": "establishing",
      "label": "Establishing",
      "blurb": "Too early to grade — keep practicing to earn your process score",
      "color": "#64748b",
      "percent": 50,
      "band_low": 0,
      "band_high": 0,
      "establishing": true
    },
    "grade_scale": [
      { "id": "poor", "label": "Poor", "band_low": 0, "band_high": 24, "color": "#b91c1c", "blurb": "…" }
    ],
    "tenure": {
      "days": 0.0,
      "ramp_days": 42,
      "weight": 0.0,
      "establishing": true,
      "note": "Time in the game weights your grade…"
    },
    "meters": [
      {
        "id": "persistence",
        "label": "Practice persistence",
        "hint": "…",
        "percent": 50,
        "raw_percent": 0,
        "detail": "…",
        "grade": { "id": "establishing", "label": "Establishing", "…" }
      }
    ],
    "window": {
      "persistence_weeks": 6,
      "persistence_target_weeks": 5,
      "grade_ramp_days": 42
    }
  },
  "journey_visible": false,
  "rank": null,
  "weights": { "reputation": 1, "personal_growth": 1, "attendance_streak": 8, "streak_cap": 12 }
}
```

### 8.2 Leaderboard row

```json
{
  "rank": 1,
  "display_name": "…",
  "avatar_url": null,
  "reputation": 0,
  "personal_growth": null,
  "attendance_streak": 0,
  "contribution": 0,
  "shares": { "reputation": true, "personal_growth": false, "attendance": true },
  "is_self": false
}
```

No `identity_id`, no `email`. Cap ~500 opt-in members.

---

## 9. Data model (schema)

### 9.1 identities (Profile + visibility) — migrations 042, 044

| Column | Notes |
|--------|--------|
| `avatar_url` | `/api/media/avatars/…` |
| `journey_visible` | Opt-in board |
| `journey_visible_at` | Set when turning on |
| `share_reputation` | Default 1 |
| `share_personal_growth` | Default **0** |
| `share_attendance` | Default 1 |

### 9.2 live_session_checkins — migration 043

See §7. Apps blurb for Journey updated to process-peer language.

### 9.3 Derived only (no Journey tables)

- enrollments, lesson_progress, quiz_attempts  
- threads, comments, reviews  
- member_trade_log_trades (adherence, activity days)  
- member_tool_notes (journal surface)  
- memberships + plans (meter profile resolution)

---

## 10. Frontend implementation map

| Path / component | Role |
|------------------|------|
| `web/app/app/journey/page.tsx` | Journey page shell |
| `web/components/JourneyScores.tsx` | Personal process + community snapshot |
| `web/components/ProcessMeter.tsx` | Meter UI |
| `web/components/JourneyLeaderboard.tsx` | Full community board |
| `web/components/JourneyHistory.tsx` | Quizzes + activity |
| `web/components/DashboardExtras.tsx` | Pathway + next live |
| `web/components/member-home/MemberHome.tsx` | `/home` dual standing + G1 CTA |
| `web/app/home/page.tsx` | Member home route |
| `web/components/ProfileSettings.tsx` | Visibility + share pillars |
| `web/components/live/SessionDetail.tsx` | CheckInControl |
| `web/components/SiteHeader.tsx` | Home / Profile / Journey menu; avatar |

---

## 11. Backend implementation map

| Path | Role |
|------|------|
| `server/journey_scores.py` | Scoring, process meters, profiles, leaderboard assembly |
| `server/routes/member.py` | `/api/me/journey`, scores, leaderboard, presence, profile |
| `server/routes/live.py` | Check-in |
| `server/routes/auth_routes.py` / `auth_dev.py` | Post-login → `/home` |
| `server/tests/test_journey_scores.py` | Characterization |
| `server/tests/test_member_profile.py` | Profile + avatar + presence |

---

## 12. Privacy & doctrine

| Rule | Application |
|------|-------------|
| Family B isolation | Trade Log / Journal / Playbook **bodies** never on board |
| Process outcomes only | No P&L, win-rate, profit claims on Journey or Home |
| Opt-in default off | `journey_visible = 0` |
| Granular share | Personal growth private by default |
| Capacity over dependency | Meter measures practice habits; agent not required |
| G1 honesty | Navigator CTA without dark patterns; fair leave path remains |

Amendments to Privacy D-6 / MR-1 for **opt-in process scores** are logged (DL-065, DL-066).

---

## 13. Product copy principles (Tango)

1. Process peers, not competition.  
2. Personal standing = **process meter + integrity grade**, not achievements.  
3. Persistence with practice tools is first-class.  
4. **Earn grades** — Establishing first; Poor/Excellent open with tenure.  
5. Observer trial: install habit + trust → **continue as Navigator**.  
6. Never: beat, top trader, profit ranking, coercive FOMO, day-one shame grades.

---

## 14. Non-goals (v1)

- Competitive P&L leaderboards  
- Achievement trophy catalogs / confetti  
- Second progress database  
- Auto-share Strategy Lab content  
- Public anonymous board  
- Admin score overrides  
- Full retrospective meter (shell only)  

---

## 15. Verification (evidence)

1. `GET /api/me/journey` returns enrollments without writing journey tables.  
2. `GET /api/me/journey/scores` includes `process.profile` matching membership.  
3. Observer trial membership → profile `observer_trial`, 6-week persistence, `grade_ramp_days` 42.  
4. Navigator long period → `navigator_annual` (or monthly for short period).  
5. Opt-in with `share_personal_growth=false` → board `personal_growth` null; self scores still full.  
6. Check-in in window succeeds; outside window 422.  
7. Login lands on `/home`; Journey linked from Apps and menu.  
8. **New account / zero signal:** `process.grade.id === "establishing"`; not `poor`.  
9. **Tenure pull:** `apply_tenure_to_percent(0, 0, 42) → 50`; full ramp preserves raw extremes.  
10. **Min extreme days:** graded % cannot land in Poor/Excellent bands until tenure ≥ 7 days.  
11. pytest: `tests/test_journey_scores.py`, `tests/test_member_profile.py`.  

---

## 16. Decision log index

| DL | Topic |
|----|--------|
| DL-064 | Profile + Journey visibility (presence) |
| DL-065 | Gamification self + community board |
| DL-066 | Granular share pillars |
| DL-067 | Member login-landing `/home` |
| DL-068 | Personal standing = process meter |
| DL-069 | Practice persistence meter |
| DL-070 | Meter profiles by membership |
| DL-071 | G1 north star: Observer → Navigator + practice |
| DL-072 | Journey Experience Spec v1.0 landed |
| DL-073 | Process integrity grade scale (Poor→Excellent) |
| DL-074 | Tenure-weighted grades (earn extremes; Establishing) |

---

## 17. Versioning

- This document is the **Journey experience** Spec v1.0 (as-built umbrella).  
- Formula detail lives in **Journey Gamification Spec v1.0** (may be folded or cited).  
- Breaking API or privacy changes require a new minor/major Spec version + decision log.  
- Meter profile constants change only with Spec version or explicit Coach amendment.

---

## 18. Open / follow-on

1. Align marketing trial length (4 vs 6) with Membership Spec vs meter focus.  
2. Retrospective meter when Journal-Retrospective store ships.  
3. Strategy Lab share → reputation addendum.  
4. Optional score cache if leaderboard scale requires it (must remain rebuildable).  
5. G1 conversion analytics instrumentation (events for upgrade funnel).  
