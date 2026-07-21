# Seed F2 — Charlie: Next.js App Scaffold

**Project:** p1-foundation · **Agent:** Charlie · **Gate:** feeds Gate 1
**Repo:** `/Users/ernie/Fattail-Labs` · **Read first:** `agents/bench/charlie.md`,
`agents/bench/doctrine.md`, spec §4 (routes) + §5.6 (SEO consequences)

## Objective

Create the `web/` Next.js application with the P1 route skeleton, building clean with
zero content debt — structure only, no design work yet.

## Task sequence

1. Scaffold: `npx create-next-app@latest web` — TypeScript, App Router, no src dir,
   Tailwind yes, ESLint yes, import alias `@/*`.
2. Route skeleton (placeholder components, real file structure):
   - `/` → redirect logic stub (logged-out → `/courses`)
   - `/courses` — catalog (will be SSG)
   - `/courses/[slug]` — course detail (will be SSG)
   - `/courses/[slug]/lessons/[lessonSlug]` — player stub (client, auth-gated later)
   - `/dashboard` — member home stub
   - `/login`, `/signup` — stubs
   - `/admin` — stub
3. Shared API client module (`web/lib/api.ts`): base URL from
   `NEXT_PUBLIC_LABS_API_URL` env (no hardcoded ports in components).
4. `web/.env.example` documenting that variable; ensure `.env*` ignored, `.env.example` not.
5. Root layout: html lang, metadata scaffold (per-page titles come in F4), no dead
   boilerplate left from create-next-app.
6. Verify: `npm run build` clean; `npm start` serves; walk every route in a browser —
   each renders its named placeholder, console error-free.

## Out of scope

Real data fetching (F3/F4) · design/styling beyond defaults · auth · JSON-LD (F4).

## Completion criteria (all with captured output)

- [ ] `npm run build` output clean, all routes listed in build summary
- [ ] Browser walk of all 8 routes against built output (`npm start`), screenshots
- [ ] Console free of errors on every route
- [ ] No hardcoded API URLs/ports in components

## Report

PASS / FAIL / BLOCKED + evidence.
