# FatTail Labs — Journey Gamification Spec v1.0

**Status:** Approved for build (Coach 2026-07-29) · formulas & board detail  
**Umbrella experience:** [`FatTail-Labs-Journey-Experience-Spec-v1.0.md`](./FatTail-Labs-Journey-Experience-Spec-v1.0.md)  
**Surface:** Journey (`/app/journey`) — self presence + Community Leaderboard  
**Parents:** Application Framework (Journey), Member-Data-Privacy, Profile Visibility v1.0  
**Author:** Juliet · Coach review notes incorporated  

---

## 1. Intent

Gamify Labs so members are **seen as people who contribute to the community** and can
**gauge personal growth by comparing process participation with peers**.

| Presence | Meaning |
|----------|---------|
| **Self** | Private scores: Reputation, Personal Growth, Attendance Streak, Contribution |
| **Community** | Opt-in board ranked by Contribution Score; pillars visible for process comparison |

### Contribution identity (Coach)

Reputation and Contribution answer: *how do I show up as someone who adds value?*

**v1 sources of contribution:**

1. Taking and completing courses  
2. Participating in community discussions (threads, replies, reviews)  
3. Showing up to live sessions (check-in streak)  

**Reserved (not scored in v1):** **Strategy Life Cycle / Strategy Lab** work that members
may later **choose to share**. When Strategy Lab gains a share/publish action, those
events feed Reputation under a versioned Spec addendum — never auto-publish Family B
or private strategy content.

### Success criteria

1. Signed-in member always sees **My presence** scores (even if not on the board).  
2. Members with Profile `journey_visible=1` appear on the **Community Leaderboard**.  
3. Rank axis = **Contribution Score**; columns show the four pillars.  
4. Scores are **derived** from real events — no second progress store, no admin score edits.  
5. Framing is **process peers, not competition** — no P&L, no shaming, no profit claims.  
6. Default opt-out; Family B content never appears on the board.

---

## 2. Privacy amendments

| Prior | Now |
|-------|-----|
| Profile Visibility v1.0 presence = name+avatar only | Opt-in also exposes **process scores** on the Community board |
| Privacy D-6 no public gamified streaks | **Opt-in** public process streaks/scores allowed |
| MR-1 no member sharing | Further amend: opt-in process scores among signed-in members |

**Still banned:** email, identity_id, Trade Log / Journal / Playbook bodies, P&L, win-rate.

---

## 3. Pillars & formulas

Constants live in `server/journey_scores.py`. Non-negative integers. Same formula for self and board.

### 3.1 Reputation — community contribution

| Event | Points | Source |
|-------|--------|--------|
| Course completed | +50 | `enrollments.completed_at IS NOT NULL` |
| Visible thread created | +15 | `threads.status = 'visible'` |
| Visible comment on **another member’s** thread | +5 | `comments` ⋈ `threads`, author ≠ thread owner |
| Visible course review | +10 | `reviews.status = 'visible'` |

### 3.2 Personal Growth — participation in growth

| Event | Points | Source |
|-------|--------|--------|
| Lesson completed | +3 | `lesson_progress.completed_at IS NOT NULL` |
| Quiz attempt submitted | +5 | `quiz_attempts` |

Pathway bonus deferred (v1.1 if needed).

### 3.2b Personal process meter (not achievements)

**Canonical detail:** Journey Experience Spec v1.0 **§4** (meters, grades, tenure, UI).

**Summary:** Personal standing is a **process health meter + integrity grade**, not
trophies. Never P&L. On `GET /api/me/journey/scores` → `process` (private).

| Meter | Signal |
|-------|--------|
| **Practice persistence** | Weeks with Trade Log, Journal, lessons, or live check-in |
| Daily routine | Trade Log or Journal days in profile window |
| Learning rhythm | Days with completed lesson |
| Live presence | EWMA of weekly check-ins (half-life 4w; near-term heavier) |
| Process adherence | % trades `followed`/`partial` |
| Retrospectives | Placeholder (`soon`) |

**Grades (trading-psych):** Establishing · Poor · Fair · Good · Great · Excellent.  
**Tenure:** `graded = 50 + (raw − 50) × (tenure/ramp)²` — no day-one Poor; extremes earned.  
**UI:** grade badge, segmented scale, needle overshooting band, confidence while ramping.

### 3.2c Meter profiles (membership-shaped horizons)

See Journey Experience Spec §4.4. Profiles set persistence windows **and**
`grade_ramp_days` (Observer trial 42d, Navigator monthly 30d, annual 90d, …).

### 3.3 Attendance streak (leaderboard) + Live presence meter

- Source: `live_session_checkins` (one row per identity × `live_sessions.id`).  
- Week key: ISO year-week in **America/New_York**.  
- **Streak** (contribution / leaderboard): consecutive weeks with ≥1 check-in, walking
  backward from the current Eastern week. If the current week has zero check-ins, start
  from last week (grace: streak not zeroed mid-week). Display = streak length in weeks.
- **Live presence meter** (process integrity — personal standing): EWMA of weekly
  show-up, not streak-only and not flat average.
  ```
  For t over last live_horizon_weeks Eastern weeks (oldest → newest):
    x_t = 1 if ≥1 check-in that week else 0
  Grace: if current week has zero check-ins, omit it (mid-week not scored absent yet).
  α = 1 − 0.5^(1/half_life)     # half_life = 4 weeks (near-term heavier)
  s_t = α · x_t + (1−α) · s_{t−1}
  raw% = round(100 · s_final)
  ```
  **Consistency** (runs of 1s) lifts s; **gaps / on-off patterns** suppress it.
  **Recent** absences ding harder than the same gap further back. Detail may still
  show streak weeks and flat `active/horizon` counts. Profile horizons: Navigator
  monthly **16**w; annual **20**; Observer trial **6**.

**Check-in window:** `[starts_at − 15 minutes, starts_at + 4 hours]` (aligned with live join window). Session must exist. Auth required. Idempotent unique (identity, session).

### 3.4 Contribution Score (rank axis)

```
contribution =
  1 * reputation
+ 1 * personal_growth
+ 8 * min(attendance_streak_weeks, 12)
```

| Constant | Value |
|----------|-------|
| `W_REP` | 1 |
| `W_GROW` | 1 |
| `W_ATT` | 8 |
| `STREAK_CAP` | 12 |

Sort: `contribution DESC`, `display_name ASC`, stable.

---

## 4. Data model

```sql
CREATE TABLE live_session_checkins (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identity_id   BIGINT UNSIGNED NOT NULL,
  session_key   VARCHAR(96) NOT NULL,   -- "42" or "r3-2026-07-29"
  starts_at     DATETIME NOT NULL,     -- occurrence start (UTC) for window + streak
  checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_checkin (identity_id, session_key),
  ...
);
```

One-off and **recurring** occurrences both supported (recurring ids are virtual).

**Scoring:** derive on read in `journey_scores.py` (no score cache in v1). Cap board at 500 opt-in rows.

**Opt-in:** existing `identities.journey_visible` / `journey_visible_at`.

### Granular share (Coach 2026-07-29)

Community presence is **tailored**. Master flag `journey_visible` shows name + photo.
Per-pillar flags control score columns and public contribution:

| Column | Default when visible | Meaning |
|--------|----------------------|---------|
| `share_reputation` | **1** | Community contribution (courses, discussions, reviews) |
| `share_personal_growth` | **0** | Trader learning path (lessons, quizzes) — **private by default** |
| `share_attendance` | **1** | Live check-in streak |

**Public contribution** (board rank) = formula using only shared pillars (hidden = 0).
Self scores API always returns full private pillars. Board returns `null` for unshared
pillars (UI shows "—").

You may increase community presence while keeping personal growth completely private.

---

## 5. API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/me/journey/scores` | session | Self pillars + contribution + streak + optional rank if visible |
| GET | `/api/journey/leaderboard` | session | Opt-in rows; `is_self` flag |
| POST | `/api/live/check-in` | session | Body: `{ session_key, starts_at }` — window-gated |
| GET | `/api/live/check-in?session_key=` | session | Own status for key |

Leaderboard row: `rank`, `display_name`, `avatar_url`, `reputation`, `personal_growth`, `attendance_streak`, `contribution`, `is_self`. No identity_id/email.

`/api/journey/presence` remains for compatibility (name+avatar); Journey UI uses leaderboard as primary community surface.

---

## 6. UI

### Journey

1. Framing: process peers / contribution identity  
2. **My presence** card (always)  
3. Existing progress sections  
4. **Community Leaderboard** (replaces A–Z roster as primary)  
5. Empty / opt-in CTAs without guilt  

### Live

Check-in control on live schedule / session when window open. No public attendee list v1.

### Profile

Visibility copy includes process scores on the Community board.

---

## 7. Non-goals v1

- Strategy Life Cycle scoring (reserved)  
- Reactions/likes, badges catalog, prize economy  
- Admin score overrides  
- Public anonymous board  
- Trade Log / P&L points  
- Competitive “top trader” framing  

---

## 8. Verification

1. Migration 043 applied.  
2. Formula unit tests for each pillar + contribution.  
3. Check-in outside window → 422; inside → 200; duplicate → 200 idempotent.  
4. Opt-out → absent from leaderboard; self scores still load.  
5. Board rows never include email or Family B fields.  
6. Browser: Journey My presence + Community board; Profile toggle; Live check-in.
