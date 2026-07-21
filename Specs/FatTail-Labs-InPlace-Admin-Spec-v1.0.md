# FatTail Labs — In-Place Admin Editing Spec v1.0

**Status:** Approved as built (2026-07-21)
**Supersedes:** parent spec §12's separate-admin-surface model *for course/lesson
editing* — Coach directed that admin sits ON the production interface. §12's remaining
scope (member lookup, moderation queues, analytics, media library) is unbuilt and will
be specced when scheduled; whether it also lives in-place or on `/admin` is an open
decision.
**Parent spec:** `FatTail-Labs-Course-Hosting-Spec-v1.0.md`
**Sibling spec:** `FatTail-Labs-Lesson-Video-YouTube-Spec-v1.0.md` (§7 authoring
requirements are satisfied by this editor)
**Implemented in:** `server/routes/admin.py`, `server/routes/auth_dev.py`,
`web/components/AdminBar.tsx`, `web/app/api/revalidate/route.ts`, `web/next.config.ts`

---

## 1. Principle

There is no separate admin site. **The production interface IS the editor.**
Administrators see the live page every member sees, plus a floating **✎ Edit** control;
activating it opens the editor over the same page. What you edit is exactly what ships —
no preview/production divergence, no second UI to maintain.

## 2. Visibility & Authorization

- The Edit button renders only after a client-side check of `GET /api/auth/me` returns
  role `administrator`. This controls *visibility only*.
- **Authority lives server-side**: every `/api/admin/*` endpoint and the revalidation
  route independently verify the session cookie and require the administrator role
  (401 no session / 403 insufficient role). A non-admin who fabricates the UI state can
  render buttons; they cannot read or write anything.

## 3. Editor Scope (v1.0)

Course fields: `title`, `subtitle`, `description_md` (markdown textarea), `level`,
`status` (draft | published | archived — status IS the publish control).
Per-lesson fields: `title`, YouTube URL-or-ID (server normalizes any pasted YouTube URL
to the bare 11-char ID), `start`/`end` seconds, `free_preview` toggle,
`duration_seconds` (carried through saves).

Out of scope in v1.0 (future versions): module/lesson create, delete, reorder;
hero/trailer upload; attachments management; category/instructor assignment; the §12
remainder (members, moderation, analytics).

## 4. Admin API Contract

```
GET /api/admin/courses/{slug}    full course incl. gated fields (any status)
PUT /api/admin/courses/{slug}    field-allowlisted update; unknown field -> 422
PUT /api/admin/lessons/{id}      field-allowlisted update; unknown field -> 422
```

- Field allowlists are frozensets in `routes/admin.py`; level/status values validated.
- `video_params` are validated against the YouTube allowlist (by constructing the embed
  URL) BEFORE persisting — a bad player config can never reach the database.
- Setting `status=published` stamps `published_at` if not already set.

## 5. Publish Pipeline (save → regenerate)

1. Editor saves via `PUT /api/admin/...`.
2. Editor calls `POST /api/revalidate {path: "/courses/{slug}"}` — a Next.js route
   handler that re-verifies the caller's admin role against the API (never trusts the
   client), then `revalidatePath()`.
3. The static course page regenerates from the API on next request. **Publish IS the
   prerender** — parent spec §5.6's "regenerate on publish" is satisfied by this flow.
4. Page routes use `dynamicParams=true`: required so purged paths can regenerate
   (with `false`, revalidation 404s — NoFallbackError). Draft/unknown slugs still 404
   via API-404 → `notFound()`.

## 6. Sessions & Dev Access

- Browser API calls ride a same-origin Next rewrite (`/api/*` → Labs API) so the
  `ft_session` cookie flows without CORS.
- **Dev only:** `GET /api/auth/dev-login` issues an administrator session
  (identity_id 0, issuer `internal`); the route returns 404 unless `LABS_ENV=dev`.
  Staging/production admin sessions come exclusively from WordPress SSO admin-role
  derivation (parent spec §7.2). `GET /api/auth/logout` clears the session.

## 7. Invariants

1. Admin authority is verified server-side per request — UI visibility is convenience,
   never security.
2. Unknown fields, levels, statuses, video params → 422; nothing unvalidated persists.
3. The editor edits the production data directly; there is no shadow/staging content
   copy. Draft status is the mechanism for unpublished work.
4. Dev-login must never exist outside `LABS_ENV=dev`.
