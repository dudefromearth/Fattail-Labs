# P1 Foundation — The Course Platform Spine

**Status:** CLOSED / load-bearing — ratified retroactively (2026-07-23)  
**Project folder:** `agents/p1-foundation/`  
**Parent product spec:** `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` (§14 phase table: P1 Core spine)  
**Gate of record:** Gate 1 PASS (`gate-reports/gate-1.md`, 2026-07-21)  
**Review of record:** `docs/P1-Foundations-Review.md` (2026-07-22)

**Supersedes nothing.** P1 is the product platform. P2 builds the agentic operating
layer and content studio **above** it — see `agents/p2-foundation/CHARTER.md` and
`docs/P2-Capabilities-for-P1.md`.

---

## Purpose

> **FatTail Labs exists so traders can stop the bleeding — capital preservation first —
> through a membership education product they can actually use: a course library, live
> room, resources, and pathway, on FatTail’s own stack, not LearnDash.**

P1’s claim:

**Ship a standalone, sellable course platform** — catalog and course pages that win
attention publicly; gated lessons that teach; identity and access that keep the product
honest; admin that authors without WordPress; architecture that never shares code with
MarketSwarm-Canonical.

The platform is the **system of record** for members, content structure, progress, and
delivery. Content *production at scale* is not P1’s job (that is P2). P1’s job is that
everything produced has a correct, durable place to land and a correct way to be watched.

---

## The mental model

| Layer | Model |
|---|---|
| **P1** | A human administrator operates the platform; the API serves the production UI; members consume public and gated surfaces |
| **P2** (later) | The API is the operating surface; the UI is one client; agents become first-class operators |

P1 deliberately built **agent-ready substrate** without being an agent runtime:

- Complete admin capabilities as governed endpoints (in-place UI proves the API)  
- Draft → publish lifecycle (proposal / validation shape)  
- Domain-speaking contracts (categories, intents, allowlists — not auth plumbing for content purpose)  
- Fail-loud validation (malformed writes die with a reason)  
- Spec + decision-log culture and a characterization suite  

That substrate is why P2 can build *on* P1 rather than around it.

---

## What “P1” means (two concentric scopes)

Retrospective clarity matters because the *project folder* and the *product phase* diverged.

### A. P1 Foundation project (this folder’s original board)

Orchestrated as F0–F4 + Gate 1:

| Step | Intent | Outcome |
|---|---|---|
| F0 | Repo scaffold (server, migrations, bench) | Done |
| F1 | Dev database + live spine | PASS |
| F2 | Next.js app scaffold (`web/`) | PASS |
| F3 | Public read API + seed data | PASS |
| F4 | Catalog + course detail (SSG + JSON-LD) | PASS |
| **Gate 1** | Foundation verification with evidence | **PASS** |

**Explicitly out of the original foundation board:** full SSO path, member enroll/progress,
rich admin, deploy to MiniTwo, real lesson player (stub only at Gate 1).

### B. Parent P1 “Core spine” (Course-Hosting spec §14)

| Scope | Outcome |
|---|---|
| Auth, entitlements, course model, public catalog/detail, lesson player, progress, enroll | **Sellable product: watchable gated courses** |

**Shipped reality (post–Gate 1 on `main`):** the product **met and exceeded** parent P1
— Labs-native identity + pluggable providers, enroll/progress/player, substantial
in-place admin, resources, live sessions, pathway, SEO/AEO layers, hub CMS, and more.
See `docs/P1-Foundations-Review.md`.

This charter governs **both**: the foundation spine as closed, and the platform
invariants that remain load-bearing for everything built after Gate 1 (including P2).

---

## Product thesis (non-negotiable)

1. **Stop the bleeding** — capital preservation is the first step; for many the only
   step they need.  
2. **Process outcomes only** — never profit claims in product or marketing copy.  
3. **Capacity over dependency** — the product teaches independence; it does not
   manufacture guru lock-in.  
4. **Pathway** — route members through the flagship / stop-the-bleeding path first.  
5. **Membership library** — one subscription unlocks the library (not one-off course
   checkout as the primary model).

---

## Architectural pillars (locked)

These are P1’s load-bearing decisions. Changing them is a new decision-log entry and
usually a versioned spec — not a quiet refactor.

| # | Pillar | Meaning |
|---|---|---|
| 1 | **Standalone repo** | No shared code with MarketSwarm-Canonical. Anything needed from MSC/Vexy is HTTP API only. |
| 2 | **Backend spine** | Python FastAPI (`server/`), MySQL database `labs`, filename-ordered SQL migrations (`migrate.py`). |
| 3 | **Frontend spine** | Next.js (`web/`). Public acquisition pages statically generated with unique titles + JSON-LD; member routes client-rendered behind auth. **Built output only** in staging/production — no dev server. |
| 4 | **Config-driven, fail loud** | Missing/invalid config aborts boot. No silent defaults, no hardcoded secrets/ports/IDs. |
| 5 | **Identity & access** | Labs-native users/roles/plans/memberships; pluggable SSO and commerce providers. Role derivation cumulative. Session cookie `ft_session` (HttpOnly, SameSite=lax; `.fattail.ai` in prod). |
| 6 | **Commerce boundary** | Selling/cancelling lives at providers (WooCommerce and/or native Stripe per specs); the app syncs entitlements — it is not a payment processor inventing charges ad hoc. |
| 7 | **In-app admin** | Course content is authored in Labs (in-place admin on production pages). WordPress is not the CMS for Labs courses. |
| 8 | **Draft → publish** | Courses (and analogous surfaces) are born draft / invisible until promoted — the human publish gate. |
| 9 | **Video delivery (v1)** | Lessons use YouTube embeds with server-built allowlisted player params (`youtube-nocookie`). Signed CDN remains the recorded upgrade path if leakage matters. |
| 10 | **Public SEO/AEO** | Catalog and course detail are public on purpose: sales pages + extractable answers (titles, meta, Course JSON-LD, free-preview rules). |
| 11 | **Evidence culture** | Specs in `Specs/`, decisions in `Architecture/00-decision-log.md`, characterization tests, live verification. “It should work” is banned. |
| 12 | **Hosts** | Dev localhost · staging DudeTwo · production MiniTwo (`labs.fattail.ai`); MiniThree nginx; Cloudflare; launchd on MiniTwo (`infra/deploy.md`). |

---

## Domain surfaces P1 owns

What the platform must correctly host and gate (non-exhaustive; specs are authoritative):

| Surface | Role |
|---|---|
| **Catalog & course detail** | Public acquisition + structure |
| **Course hub / category hubs** | Orientation, taxonomy, CMS-backed copy |
| **Lessons & player** | Gated watch, free preview, progress |
| **Enrollment & progress** | Membership-aligned access + completion |
| **Resources / attachments** | Downloads and job aids |
| **Live sessions listing** | Schedule/audience contracts (category as audience, not role plumbing) |
| **Pathway** | Sequencing / flagship routing |
| **Reviews, discussion, students** | Social proof and cohort surfaces as specified |
| **Admin (in-place)** | Author every field the member sees |
| **Auth / me / providers** | Who the user is and what they may access |
| **Media library** | Public image assets for cards/heroes |
| **SEO layer** | Sitemap, robots, JSON-LD, meta |

P1 does **not** own: agent backlog, HeyGen cast production, multi-agent content
workflows — those are P2, consuming P1’s APIs.

---

## Platform bench (archetypes that built and maintain P1)

| Callsign | Role | P1 contribution |
|---|---|---|
| **Coach** | Final authority | Scope, positioning, ship |
| **Juliet** | Orchestrator | Seeds, board, sequencing |
| **India** | Spec / architecture guardian | Spec integrity, product boundary |
| **Alpha** | Backend | FastAPI, migrations, API |
| **Charlie** | Frontend | Next.js surfaces, player, admin UI |
| **Echo** | Design | Tokens, polish bar |
| **Foxtrot** | Infrastructure | Hosts, nginx, deploy |
| **Mike** | Security & auth | SSO, sessions, entitlements, media security |
| **Sierra** | Curriculum & AEO | Catalog copy formula, SEO/AEO |
| **Delta** | Gate keeper | Evidence gates (Gate 1) |
| **Kilo** | Test engineer | Characterization suite |
| **Lima** | Institutional memory | Decision log, docs |
| **Tango** | Member archetype | Capacity-over-dependency, honest copy |

Content-studio and lineage agents (Bravo, November, Romeo, Papa, Hotel, Victor,
Whiskey, Yankee) are **P2** — they place into P1; they do not redefine the spine.

---

## Operating principles (P1 execution)

1. **Spec first** — no substantive feature without an approved or versioned spec.  
2. **Change control** — declare files and changes before touching.  
3. **Documentation parity** — feature, spec, decision log land together.  
4. **Delta gates** — significant phases end with evidence, not assertion.  
5. **Same admin surface** — operator capability is API-real, not UI-only magic.  
6. **Never hardcode** secrets, ports, user IDs, or environment-specific hosts in code paths that should be config.

---

## Non-goals (P1)

- **Not a LearnDash skin** — custom product, custom admin, FatTail doctrine.  
- **Not a shared monorepo with MarketSwarm** — product boundary is absolute.  
- **Not the content factory** — research, lesson plans, HeyGen cast, coaching shorts,
  and agent backlog are P2 (or human manual work until P2 lands).  
- **Not Ask Vexy / deep cognitive tutor** — reserved for later differentiators (e.g. P3 /
  Golf when seated).  
- **Not autonomy theater** — P1 does not auto-publish agent fantasies; draft/publish
  remains human-governed.  
- **Not payment invention** — providers own checkout; Labs owns entitlements after.

---

## Success criteria

### Foundation project (Gate 1) — **met**

- Migrations apply cleanly; seed idempotent  
- Public API lists only published courses; drafts invisible; no gated-field leaks  
- Catalog + course SSG with JSON-LD, unique titles, clean browser walk  
- No MSC imports; secrets not in git  
- Evidence in `gate-reports/gate-1.md`

### Core spine (parent §14) — **met / exceeded on main**

- Authenticated members can enroll, watch gated lessons, and record progress  
- Public catalog remains an acquisition asset  
- Administrators can author content in-app without WordPress CMS  
- Platform remains standalone, fail-loud, and test-characterized  

### Ongoing (load-bearing bar for anything that touches P1)

- New features keep the pillars above  
- Characterization suite stays green for every `server/` change  
- Specs describe reality; decision log captures reversals  

---

## What P1 provides to P2

P2 is not a rebuild. It consumes:

1. Governed **admin/API** for every operator capability  
2. **Draft → publish** as the proposal gate  
3. **Domain-speaking contracts** (audiences, categories, intents)  
4. **Fail-loud validation** for agent self-correction  
5. **Characterization suite** as “the system still works”  
6. **Spec + decision-log** doctrine corpus  
7. **Media, revalidation, and audit-shaped** operational habits  

Full mapping: `docs/P2-Capabilities-for-P1.md`.

---

## Related artifacts

| Artifact | Role |
|---|---|
| `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` | Parent product + phase table |
| `Specs/*` | Feature contracts as built |
| `Architecture/00-decision-log.md` | Binding decisions |
| `docs/ADMIN-GUIDE.md` | Human operator procedures |
| `docs/P1-Foundations-Review.md` | Post-build assessment |
| `agents/p1-foundation/ORCHESTRATOR.md` | Original board (historical; foundation complete) |
| `agents/p1-foundation/gate-reports/gate-1.md` | Foundation evidence |
| `agents/p2-foundation/CHARTER.md` | Next layer |
| `CLAUDE.md` / `AGENTS.md` | Repo operating doctrine |

---

## Charter discipline

- This document is **retroactive**: it records what P1 was for and what must stay true.  
- It does **not** freeze every feature at Gate 1 — post-foundation product growth is real
  and welcome when it respects the pillars.  
- Amendments to pillars are decision-log entries; feature work remains versioned specs.  
- P2 may not invent a parallel Labs or a second course store of truth.

---

*Ratified retroactively so the bench has a peer document to the P2 charter: P1 is the
platform spine; P2 is how the content business runs on top of it.*
