# FatTail Labs — Live Sessions Spec v1.3

**Status:** Approved as built (2026-07-21)
**Extends:** v1.2 (month calendar). Replaces raw role gating with **content
categories** named after the membership model, and revises the standing schedule.

---

## 1. Content categories (migration 008)

Live content is categorized **by membership audience**, not by role plumbing.
`category` replaces `min_role` on both `live_sessions` and `live_recurrences`
(column dropped — no dual schemas):

| Category | Who gets in | Ladder derivation |
|---|---|---|
| `public` | Everyone, no sign-in | no gate |
| `members` | All memberships: Observer, Activator, Navigator | activator+ |
| `coaching` | Observer & Navigator (Activators excluded) | navigator+ |

The derivation works because Observer-trial memberships grant the navigator role
(full Navigator access during trial) — and it automatically excludes **alumni**,
who keep courses but lose all live content. The mapping lives in one place
(`CATEGORY_MIN_ROLE`); unknown categories fail loudly (422).

`kind` (trading_room | workshop | show) remains purely presentational.

## 2. The standing schedule (seeded)

| Session | Kind | When (ET) | Category |
|---|---|---|---|
| **0DTE Live Show** | show | Mon/Wed/Fri 15:00–16:00 | public (YouTube: youtube.com/@0dte/live) |
| **Daily Livestream** | trading_room | Mon–Fri 11:00–12:30 | coaching |
| **Friday Morning Coach Call** | workshop | Fri 9:30–10:00 | members |
| **Sunday Evening Retrospective** | workshop | Sun 21:00–22:00 | coaching |

## 3. Agent-authored scheduling (forward note)

Agents producing live content will create and maintain the schedule through the
same admin API surface (`POST/PUT/DELETE /api/admin/live-sessions` and
`/api/admin/live-recurrences`) — the category enum is the contract: an agent says
*what audience* a piece of content is for, never which internal role gates it.
No separate agent API is planned; agent identity/authorization is future work
(currently administrator sessions only).

## 4. API deltas

- Session/occurrence payloads carry `category` (no `min_role`).
- Admin create/update accept `category` (default `members`); join-lock messaging
  derives from category ("Coaching members only" vs "Members only").
- Everything else from v1.0–v1.2 unchanged (window rule, ICS, calendar, replays).
