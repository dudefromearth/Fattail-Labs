# FatTail Labs — Member Profile + Journey Visibility — Spec v1.0

**Status:** Approved as built · **Amended 2026-07-29** by Journey Gamification Spec v1.0  
**Phase:** Member chrome + Journey product surface.  
**Author:** Juliet (from Coach intent) · implementation Alpha/Charlie  

**Amendment (DL-065):** Opt-in `journey_visible` now also exposes process scores on the
Journey **Community board** (reputation, personal growth, attendance streak, contribution).
See `FatTail-Labs-Journey-Gamification-Spec-v1.0.md` and the umbrella
[`FatTail-Labs-Journey-Experience-Spec-v1.0.md`](./FatTail-Labs-Journey-Experience-Spec-v1.0.md).
Name+avatar-only roster remains as compat API; Journey UI prioritizes the scored board.

---

## 1. Intent

Refashion the header account menu and retire redundant progress surfaces:

1. **Profile** consolidates account preferences (display name, avatar, Journey visibility).
2. **Journey** is the single member progress surface (absorbs My Learning + Dashboard).
3. **Dashboard** and **My Learning** menu entries are removed; `/dashboard` redirects to Journey.
4. **Journey visibility** is a new opt-in: members who set visibility true appear on a
   **presence roster** (not a competitive P&L leaderboard) inside Journey.

### Success criteria

1. Avatar menu shows: identity header, Continue Learning (when applicable), **Profile**,
   **Journey**, Become a member (observers), Admin (admins), Sign out.
2. Profile page lets the member set **display name**, **profile image**, and
   **Journey visibility** (default off).
3. Header avatar shows the profile image when set; otherwise initials.
4. Journey shows enrollments/progress (existing), pathway + next live (from Dashboard),
   quiz/activity history (from My Learning), and the **presence roster** of visible members.
5. Presence roster exposes **display name + avatar only** — no email, no identity_id,
   no ranks by progress or profit. Ordered neutrally (e.g. display name A–Z).
6. Private-by-default: `journey_visible = 0` until the member opts in; opt-out removes
   them immediately from the roster.

---

## 2. Product decisions (Coach 2026-07-29)

| Decision | Choice |
|----------|--------|
| Menu | Profile + Journey (keep Continue Learning strip) |
| Visibility exposure | **Presence only** (name + avatar) |
| Learning history home | **Journey owns it** |
| Profile image v1 | Upload to Labs media (`/api/media/…`) |

### Privacy amendment

Member-Data-Privacy Spec v0.1 **MR-1** (“no sharing to other members in v1”) is
**amended for this surface only**: members may **opt in** to show display name + avatar
to other signed-in members on the Journey presence roster. Authored Family B content
(Trade Log, Journal, Playbook) and progress metrics remain private. No P&L, trades,
email, or ranking by performance.

Prior Journey copy “no leaderboards” is replaced by: **no competitive / profit
leaderboards**; an opt-in **presence roster** is allowed.

---

## 3. Data model

On `identities` (single row per member — no second profile table):

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `avatar_url` | VARCHAR(1024) NULL | NULL | Public media URL path e.g. `/api/media/avatars/…` |
| `journey_visible` | TINYINT(1) NOT NULL | **0** | Opt-in presence |
| `journey_visible_at` | TIMESTAMP NULL | NULL | Set when turning on; cleared when off |

Migration: `042_member_profile.sql`.

---

## 4. API

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/me/profile` | session | Full profile for edit form |
| PATCH | `/api/me/profile` | session | `{ display_name?, journey_visible? }` |
| POST | `/api/me/profile/avatar` | session | multipart image → store + set `avatar_url` |
| DELETE | `/api/me/profile/avatar` | session | Clear avatar (optional file cleanup) |
| GET | `/api/journey/presence` | session | Roster of visible members (name + avatar only) |
| GET | `/api/auth/me` | session | Also returns `avatar_url` for chrome |

### Avatar rules

- Types: `image/png`, `image/jpeg`, `image/webp`
- Max size: 2 MB
- Stored under `server/uploads/avatars/` served as `/api/media/avatars/{hash}{ext}`
- Content-addressed filename (sha256 prefix) like admin media

### Presence response shape

```json
{
  "members": [
    { "display_name": "Ernie", "avatar_url": "/api/media/avatars/…" }
  ]
}
```

Empty `display_name` falls back to email local-part **only for the owner’s own
profile API** — never on the public presence roster (skip or use “Member” if blank).

---

## 5. UI routes

| Route | Role |
|-------|------|
| `/me` | **Profile** (preferences, avatar, visibility) |
| `/app/journey` | Journey progress + history + presence roster |
| `/dashboard` | **302/redirect** → `/app/journey` |
| Header menu | Profile, Journey; drop My Learning / Dashboard labels |

Guide copy updated to match.

---

## 6. Non-goals (v1)

- Competitive ranking by completion or P&L
- Public (anonymous) visibility of members
- Sharing Trade Log / Journal / Playbook via visibility
- Gravatar / external OAuth avatars (upload only)
- Soft-delete of media files referenced elsewhere (best-effort unlink own avatar file)

---

## 7. Verification

1. Migrate `042`; profile columns present.
2. PATCH visibility on → appears on `GET /api/journey/presence` with name/avatar only.
3. PATCH visibility off → gone from roster.
4. Avatar upload shows in header and roster.
5. Menu no longer lists My Learning / Dashboard; `/dashboard` lands on Journey.
6. Characterization tests for profile + presence.
