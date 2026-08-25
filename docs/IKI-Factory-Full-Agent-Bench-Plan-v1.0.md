# IKI Factory — Full Agent Bench Plan v1.0

**SUPERSEDED** 2026-08-23 by [`docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md`](./IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md) (Factory Spec **v0.1.5**: Gemba charter seated, conveyor, OD-F10). Keep this file as the v0.1.2 plan of record.

**Spec of record (this file):** [`Specs/FatTail-Labs-IKI-Factory-Spec-v0.1.2.md`](../Specs/FatTail-Labs-IKI-Factory-Spec-v0.1.2.md)  
**Parents:** IKI Lab and Factory Spec v0.1 · Member Wiki v0.1 · Wiki Agent Spec v0.1.2 · North Star v1.2 (Invariant #8) · PDS Spec v0.1 Part I  
**Juliet.** Execution plan only. No code until Coach stamps **BUILD AUTHORITY** on the spec **and** **GO IF-1**.

**Status of the spec:** **DRAFT**. Reviewers in the spec header are **PENDING** (India, Mike, Echo, Tango, Hotel, Delta). Coach asked for this plan anyway. It is sequenced against v0.1.2 as written. A different Coach ruling on OD-F* or a RETURNED review re-sequences.

**Board (after GO):** `agents/p-iki-factory/` — not created until BUILD.  
**Isolation (DL-539):** IKI Factory writes stay in Factory + admin Factory surface + Factory Agent charter. Wiki Agent `registration` emit and WooCommerce product create are **named obligations** to those trees. **Writes** into Wiki Agent, Runner, Options Lab, Market Bus, or Trade Log need Coach naming plus three successive OKs where those trees are frozen.

---

## Up front

Nothing of Coach’s Factory spec v0.1.2 is dropped. This plan does not invent a Factory job — v0.1.2 already seats it (admin Kanban + Factory Agent). It does **not** treat DRAFT as BUILD.

---

## Juliet review (labeled)

### Blocks for *sequencing* (not for spec content)

| # | Item |
|---|------|
| **B1** | Spec header is **DRAFT**. Sequential gates (India → Echo+Tango → Mike → Hotel → Delta notes → **Coach Phase 5**) before GO IF-1. |
| **B2** | Member pill `/app/iki/factory` stays **named soon** until Coach opens it (spec §2, OD-F7). The Kanban is **admin-only**. Juliet’s default mount: **`/admin/iki-factory`**. Tick below if Coach wants the board *on* the suite pill instead. |
| **B3** | Factory Agent is **named in the spec** and **has no bench charter**. See **Archetype** below. Do not start IF-2 (research pickup) until the charter exists **or** Coach assigns an existing callsign. |

### Coach dispositions (tick one)

**B2 — Where the board lives**

- [ ] **Admin only** — `/admin/iki-factory` (plan default). `/app/iki/factory` remains the member soon page.  
- [ ] **Suite pill** — replace `/app/iki/factory` with the board, still admin-gated (403/empty for non-admin).

**B3 — Factory Agent seat**

- [ ] **New archetype** — **Factory Agent** (job-named, Wiki Agent pattern). Charter `agents/bench/factory.md`. Plan default.  
- [ ] **Reuse Quebec** — Juliet **advises against**. Quebec owns the *content* Production Board (courses/HeyGen), not IKI templates or Woo Deploy.  
- [ ] **Reuse Bravo** — Juliet **advises against**. Bravo owns course research packs, not a 24 h ranked template mill.

### Opinions (Coach may discard)

| # | Item |
|---|------|
| O1 | Reuse **Content Board Kanban grammar** (`BoardKanban.tsx` interaction, HI tokens, 44pt) **not** `content_items` tables or Quebec lifecycle. Factory lanes are a different machine. |
| O2 | First registered research skill can be a **stub** that fail-louds “no skills registered” until Coach names a skill (e.g. `symbol-entity-map` / opportunity-finder). Do not silently invent research. |
| O3 | Wiki Agent Help Package on Deploy: **flag missing fields** in IF-4; do not block Live if Coach has not directed the Help Package spec (Wiki plan WA-5). |
| O4 | WooCommerce product create in IF-4 is a **Labs → WP** write. Mike designs; no native Stripe. |

---

## Archetype advice

The spec’s agent is a **runtime product agent** (picks up Ideas, runs skills ≤24 h, drafts Spec, implements against an Admin-attached repo plan, Deploy side-effects). That is not how we *build* the board (Charlie/Alpha). It is how the **shipped Factory** works.

| Existing seat | Why it does not cover Factory Agent |
|---------------|--------------------------------------|
| **Quebec** | Content Vision → course/YouTube Kanban, HeyGen, approval packages. Different lanes, different SoR (`content_items`). Overloading him collides two factories. |
| **Bravo** | Course source packs and claims inventory. Not a versioned skill registry, not card materialization, not Woo Deploy. |
| **Wiki Agent** | Downstream: git wiki pages from **contracts**. Factory must **not** write wiki pages (spec §9). Wiki Agent consumes `registration` after Live. |
| **Alpha / Charlie** | Build the surface and API. They are not the 24 h research runner. |
| **Golf** | Reserved (Ask Vexy). Do not steal. |

**Advise: new archetype — Factory Agent** (product-local, like Wiki Agent).

- **Charter:** `agents/bench/factory.md` from `agent-template.md`.  
- **Identity:** Agent Identity Spec v1.0 principal `factory` (not a shared admin cookie).  
- **Invariants (from spec):** no auto-advance past human gates; no invention; no calcification; registered skills only; Woo-only commerce; Invariant #8; no parallel knowledge store.  
- **NATO letter:** none required. Knowledge-bench Oscar/Uniform/X-ray/Zulu are out. Golf is reserved. Job-name is cleaner.

IF-1 (board + Ideas, no research runner) can ship **without** the runtime agent if Coach wants chrome first. IF-2 **requires** the charter.

---

## Intent (spec §0–§1)

Admin-only Kanban. Admin deposits Ideas. Factory Agent researches (≤24 h, versioned skills), ranks, materializes top findings (≤10) as Research cards. Admin alone advances (drag or click). Agent drafts Template Spec. Admin attaches a **repo plan** and signals Build. Admin tests, supplies product type/tier/free-vs-paid, signals Deploy. Agent deploys the template, creates a **WooCommerce subscription product**, store-visible. Only **Live** is member-visible. Failures are on the card.

Success = **IF1–IF14** / **AT-IF-1…14**.

---

## What ships / what does not

**Ships (after BUILD + GO):**

1. Admin Kanban: Ideas → Research → Spec → Build → Live.  
2. Drag-and-drop + click-to-advance/detract; invalid moves stay put with a reason.  
3. Priority Low/Medium/High; owner; lineage.  
4. Factory Agent pickup + skill registry (from IF-2).  
5. Spec draft + Build against attached plan (IF-3).  
6. Deploy: template registration path + Woo subscription product (IF-4).  
7. Card-visible failure; owner notify (in-app, existing admin notification path).

**Does not ship in this program:**

- Opening the **member** Factory pill (unless B2 = suite pill).  
- Writing wiki page bytes (Wiki Agent).  
- Native Stripe.  
- Inventing research content when the registry is empty.  
- Reusing `content_items` / Quebec columns.  
- Editing Options Lab, Runner compute, Market Bus, Trade Log.

---

## Store law

| Truth | Where |
|-------|--------|
| In-progress Factory work | **New** Factory tables (cards, lanes, lineage, agent actions). Spec §2: operational SoR. |
| Deployed templates | Existing / future **template registration** path (Runner registry family). No second corpus. |
| Wiki pages | Git only. Factory emits `registration` (or flags Help Package missing). |
| Commerce | WooCommerce subscription product only. |

---

## Critical path

```text
Coach: spec reviews + Phase 5 BUILD + Lima DL
  → W0 India/Mike/Echo inventory (as-built board + admin gate + Woo hooks)
    → GO IF-1
      → IF-1 Board + Ideas (Charlie + Alpha + Echo; Mike admin gate; Kilo)
        → IF-1-G Delta
          → GO IF-2  (needs Factory Agent charter)
            → IF-2 Research
              → IF-2-G
                → GO IF-3 Spec + Build
                  → IF-3-G
                    → GO IF-4 Deploy + Woo
                      → IF-4-G
                        → IF-5 Hardening → IF-5-G
```

Each phase: Coach stamp · DL · Delta ternary. Lima same day.

---

## Phases (map spec §10)

### W0 — Inventory (read-only)

**India + Mike** (architecture + admin/auth). **Echo** looks at `BoardKanban.tsx` as grammar, not copy.

Prove: Content Board tables vs Factory need; `/admin` session vs `useIsAdmin`; existing Woo webhook **inbound** vs needed **outbound** product create; Wiki Agent `registration` contract shape; `/app/iki/factory` placeholder.

**Does not write.**

### IF-1 — Board + Ideas (AT-IF-7, 11, 14)

| Agent | Job |
|-------|-----|
| **Mike** | Admin-only API + page. Non-admin 403. Member `/app/iki/factory` unchanged unless B2 says otherwise. |
| **Alpha** | Migration: Factory cards, lanes, priority, owner, lineage, transitions (append-only). Not `content_items`. |
| **Echo** | Board HIG: lanes, drag, click-advance/detract, empty Ideas, priority chips. Tokens, ≥44pt. |
| **Charlie** | Board UI. Admin creates Idea. Drag/click with client+server validation. |
| **Kilo** | Isolation, invalid-move 422 + visible reason, non-admin 403. |
| **Lima** | DL + spec honesty (as-built board path). |

**Factory Agent:** not required to *move* cards in IF-1. Optional stub “pickup” that only logs.

### IF-2 — Research (AT-IF-1, 2, 8, 10)

Requires **B3 = new charter** (or Coach reuse tick).

| Agent | Job |
|-------|-----|
| **Factory Agent charter** | `agents/bench/factory.md` + principal `factory`. |
| **Alpha** | Skill registry table (id, version, status). Job/window (24 h). Findings JSON on Idea; child Research cards ≤10. |
| **Charlie** | Research lane: rank, reason, sources on card; remainder on parent Idea. Fail/timeout chrome. |
| **Hotel** | Review any default skill **output shape** (no advice, no profit claims). Not author the skill. |
| **Kilo** | Empty registry fail-loud; window expiry visible; no padded 10. |

**Default skill:** none until Coach names one. Registry can be empty; pickup then fails loud on the Idea card (IF8).

### IF-3 — Spec + Build (AT-IF-4, 5, 9)

| Agent | Job |
|-------|-----|
| **Factory Agent** | Draft Template Spec onto the card from proposal + Admin notes. Notify owner. Implement **only** when plan ref is attached **and** Admin signals/drags to Build. |
| **Charlie** | Spec-ready / Built-ready / Rework destination picker. Block forward without plan ref. |
| **Alpha** | Validation: no Build without plan path; Rework destination is Admin’s. |
| **Tango** | Card copy: workshop not oracle. |
| **Kilo** | Agent cannot self-approve Spec; cannot choose Rework lane. |

### IF-4 — Deploy + Live (AT-IF-6, 13)

| Agent | Job |
|-------|-----|
| **Mike** | WooCommerce **product create** design (HMAC, fail-loud, no Stripe). |
| **Alpha** | Deploy transaction: template register + Woo product + store visibility. Product spec required. |
| **Factory Agent** | Execute Deploy **after** Admin move/signal only. Flag Help Package fields for Wiki Agent. |
| **India** | Quote Wiki Agent registration contract (artifact quote, not a table assertion). |
| **Kilo** | Deploy without product spec rejected; non-Live never member-listed. |

**Wiki Agent tree:** emit-only. No wiki page writes from Factory.

### IF-5 — Hardening (AT-IF-3, 8, 12, 14)

Lineage queries, notification reliability (existing admin notify), failure injection, Hotel pass on agent-drafted strings, drag invalid-move matrix.

---

## File allowlist (proposed — freeze at GO IF-1)

Exact list is W0 output. Direction:

| Area | Likely paths |
|------|----------------|
| Admin UI | `web/app/admin/iki-factory/` · `web/components/admin/` Factory board (new; do not edit `BoardKanban.tsx` unless Coach ticks reuse-in-place) |
| Member pill | `web/app/app/iki/factory/page.tsx` — **touch only if B2 = suite pill** |
| API | `server/routes/` Factory admin router (new) |
| Domain | `server/` Factory domain module (new) |
| Schema | `server/migrations/NNN_iki_factory.sql` |
| Agent | `agents/bench/factory.md` · Agent Identity principal |
| Tests | `server/tests/test_iki_factory*.py` · web characterization |
| Docs | this plan · Lima DL · spec status flip on BUILD |

Shared `AdminNav.tsx`: add one link. That is a named overlap with admin chrome — seed lists it.

---

## Neighbor boards (India artifact-quote rule)

| Assertion | Quote from |
|-----------|------------|
| Wiki Agent `registration` contract | Wiki Agent spec § (current version in `Specs/`) + plan WA-5 status |
| Member Factory pill is soon | `web/app/app/iki/factory/page.tsx` as-built |
| Content Board is a different Kanban | Content Board Spec v1.0 + `/admin/board` |
| WooCommerce is commerce SoR | Factory spec v0.1.2 header + OD-F6 · CLAUDE.md commerce |

Do not assert “Wiki Agent PASS” without quoting `agents/p-wiki/` gate row.

---

## Notifications

Primary: on the card. Secondary: owning Admin, existing admin notification plane (`AdminNotifications` / member_notify as already used for admin). No new channel in IF-1.

---

## Out of scope until Coach names it

- Member-facing Factory workflow.  
- Factory choosing Rework destination.  
- Padding research to 10.  
- Stripe.  
- Second wiki store.  
- DL-539 frozen trees without three OKs.

---

## GO checklist (Coach)

- [ ] Spec reviews complete (or Coach expedites like DL-457 / DL-479, named).  
- [ ] Phase 5 BUILD AUTHORITY + Lima DL (OD-IKI-1 closed by this spec).  
- [ ] B2 mount ticked.  
- [ ] B3 archetype ticked.  
- [ ] **GO IF-1**.  
- [ ] Later: **GO IF-2** … **GO IF-5** separately.

---

## Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0** | 2026-08-23 | Juliet plan from Factory Spec v0.1.2. DRAFT spec. New Factory Agent recommended. Phases IF-1…IF-5. Admin board default `/admin/iki-factory`. |
