# FatTail Labs — Course Discussion Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md` §10 (community v1.0 scope)
**Benchmark parity:** AI Labs' "Course Discussion" tab (per-course threads).

---

## 1. Model & Rules

- Threads scope to a course (`threads.scope_type='course'`); comments belong to
  threads (existing migration-001 tables).
- **Reading is public** (community content is also sales surface — logged-out
  visitors see the conversation happening).
- **Posting requires any authenticated account** (observer+): threads (title +
  markdown body) and comments (markdown body). Community includes free members.
- Markdown rendered through the site renderer (sanitized) — same as everywhere.
- Moderation: `visible` by default; admins set `held` on threads or comments
  (hidden from public). Instructor/staff replies show an **Admin** badge.
- No edit/delete in v1.0 (moderation covers abuse; author editing is future scope).

## 2. API

```
GET  /api/courses/{slug}/threads              public: visible threads, newest first
                                              (author, title, comment_count, date)
POST /api/courses/{slug}/threads              auth: {title, body}
GET  /api/threads/{id}                        public: thread + visible comments
POST /api/threads/{id}/comments               auth: {body}
POST /api/admin/threads/{id}/moderate         admin: {status}
POST /api/admin/comments/{id}/moderate        admin: {status}
```

## 3. UI (course page, Discussion tab — now enabled)

Thread list (title, author, reply count, relative date) with a New Thread form for
signed-in users (sign-in prompt otherwise). Clicking a thread expands it inline:
body, comments, reply box. Admin sees Hide controls on threads/comments. All content
client-fetched (user-generated; not part of the static build).

## 4. Invariants

1. Auth checks are server-side; held content never renders publicly.
2. All bodies pass through the sanitizing renderer — no raw HTML ever.
3. Discussion never gates content — it is a community surface, not an access layer.
