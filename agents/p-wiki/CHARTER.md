# P-Wiki — Charter

**Project id:** `p-wiki`
**Purpose:** Take the Member Wiki from scaffold to working: the W1 spine (checkout
reader, index, search, article rendering, publish gate) under the two wiki specs,
fixing and completing the current partial implementation rather than restarting.

## Specs of record (draft until Coach approves — W0 gates this)

| Spec | Role |
|---|---|
| [`Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md`](../../Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md) | System: content store (lab-wiki repo), derived index, pipeline, privacy firewall, per-phase proofs (§7.1) |
| [`Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md`](../../Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md) | Interface: card, entry, article + rail, search, graph, switcher, verification runbook (§8.1) |
| Application Framework v1.0 | Template + component governance (registered components, stay-put) |
| Identity/Access + Member-Data-Privacy | Auth gating; Family B firewall (no member data in shared surfaces) |

## Current state (2026-07-27, audited)

| Piece | State |
|---|---|
| Apps card (migration 034) | ✅ Applied on dev; wiki/soon/5, vexy retired |
| `/app/wiki` entry, `/search`, `/graph` pages | ⚠️ Scaffold only — render, but placeholder content; **uncommitted** |
| FastAPI wiki module, index tables, endpoints | ❌ Missing entirely (`/api/wiki/*` → 404) |
| `LABS_WIKI_ROOT` config + sync tick | ❌ Missing |
| Article page `/app/wiki/[slug]` | ❌ Missing |
| Content | ✅ lab-wiki repo compiled (33 sources, 12 topics, 2 concepts, 35 glossary) — all `draft`; Coach must publish a starter set |

## Success (project-level)

1. A member can search, browse, and read published wiki pages on the test site;
   drafts invisible to members (404), visible to admin.
2. Index is derived from the `lab-wiki` checkout; **no second store of truth**; API
   fail-louds without a valid `LABS_WIKI_ROOT`.
3. Wikilinks render, backlinks list, graph shows published pages, ⌘K works.
4. Interface §8.1 runbook executed with captured outputs → `gate-reports/`.
5. Decision log + Architecture docs updated same body of work (Lima).

## Explicit non-goals (this project)

- Transcript pipeline / corpus registrar (W2 of the parent spec)
- Compiler agent + board approval flow (W3)
- Personal "In your practice" rail (W4 — needs Mike gate)
- Public/SEO surface; Ask mode (D-i1); embeddings (D-4)

## Governance

- **Coach** — W0 spec approval; publishes starter content; ship call
- **Juliet** — this plan; never executes seeds
- **India** — WK0 audit of the existing scaffold vs spec; boundary rulings
- **Alpha** — backend (schema, reader/indexer, API)
- **Charlie** — frontend wiring (+ article page)
- **Foxtrot** — env/config, checkout + sync tick, deploy notes
- **Mike** — auth gating, draft gate, no-member-data check
- **Echo** — HIG pass on the four surfaces
- **Kilo** — characterization tests
- **Delta** — gate with §8.1 runbook evidence
- **Lima** — decision log + docs parity

## Wave cut

| Wave | Outcome | Gate |
|---|---|---|
| **W0** | Coach approves both specs (or amends); India audit (WK0) merged; scaffold + specs committed | Coach + India |
| **W1a** | Backend spine: schema + reader + indexer + API (WK1–WK2) | Kilo tests green |
| **W1b** | Frontend wired: entry/search/article/graph/switcher (WK4) + env/tick (WK3) | Echo + Mike review |
| **W1c** | Runbook executed, evidence captured, docs landed (WK5–WK7) | **Delta PASS** |

W1a may start before W0 completes **only** as uncommitted spike work; nothing merges
until W0 gates pass (house change-control).
