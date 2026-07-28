# Agent-led Implementation Plan — Member Wiki W1 (fix + complete)

**Project folder:** `agents/p-wiki/`
**Charter:** `CHARTER.md` · **Orchestrator:** `ORCHESTRATOR.md`
**Specs:** Member-Wiki v0.1 (system) · Wiki-Interface v0.1 (surfaces + §8.1 runbook)

Juliet owns plan updates. Coach prioritizes. Specialists execute **seeds**. Delta
gates with evidence. This plan **repairs and completes** the existing scaffold — it
does not restart it.

---

## 0. Locked decisions (do not re-litigate)

| ID | Decision |
|----|----------|
| WIK-D1 | Content system-of-record = `lab-wiki` git repo; MySQL holds **derived index only** (Member-Wiki §3.0) |
| WIK-D2 | Member visibility gate = `status: published` frontmatter; drafts 404 for members, render for admin |
| WIK-D3 | Search v1 = MySQL FULLTEXT over indexed pages (transcripts join in parent W2) |
| WIK-D4 | `LABS_WIKI_ROOT` env points at the checkout; missing/invalid = loud API-boot abort (config fail-loud doctrine) |
| WIK-D5 | Card: slug `wiki`, sort 5, Vexy retired (migration 034 — shipped) |
| WIK-D6 | Wikilink syntax `[[slug]]` / `[[slug\|label]]`; unresolved links render muted, never 500 |
| WIK-D7 | Reindex = idempotent full rebuild endpoint + on-boot index freshness check; incremental later |
| WIK-D8 | No member data, no P&L, no profit framing on any wiki surface (doctrine; parent W11) |

## 1. Integration map

```
lab-wiki checkout (LABS_WIKI_ROOT)
  wiki/{topics,concepts,recaps,glossary,sources}/*.md   ← frontmatter + [[wikilinks]]
        │  read + parse (Alpha: wiki_store.py)
        ▼
  MySQL derived index: wiki_pages_idx · wiki_links_idx   ← rebuilt by reindex; never authored
        │
        ▼
  FastAPI /api/wiki/*  ──  index (browse) · pages/{slug} · search?q= · graph · admin/reindex
        │  member session gate; draft gate; admin sees drafts
        ▼
  Next.js /app/wiki  ── entry (Start here · New this week · search box)
           /app/wiki/[slug]        ← NEW: article + backlinks (+ rail placeholders)
           /app/wiki/search        ← wire to API (replace placeholder card)
           /app/wiki/graph         ← wire to API (published nodes + wikilink edges)
           ⌘K switcher (wiki routes)
```

## 2. Phase seeds

| Seed | Agent | Delivers | Depends on |
|------|-------|----------|------------|
| [WK0](seeds/WK0-india-audit.md) | India | Audit scaffold vs spec; keep/fix list; commit plan for specs + scaffold | — |
| [WK1](seeds/WK1-alpha-store-schema.md) | Alpha (+Kilo) | `wiki_store.py` reader/parser + migration `035_wiki_index.sql` + reindex domain fn | WK0 |
| [WK2](seeds/WK2-alpha-api.md) | Alpha (+Kilo) | `/api/wiki/*` endpoints, auth + draft gates, fail-loud config | WK1 |
| [WK3](seeds/WK3-foxtrot-env-sync.md) | Foxtrot | `LABS_WIKI_ROOT` in env schema + dev setup docs + MiniTwo checkout & pull/reindex tick plan | WK2 |
| [WK4](seeds/WK4-charlie-wire-frontend.md) | Charlie | Article page (new), wire entry/search/graph, ⌘K switcher | WK2 |
| [WK5](seeds/WK5-echo-mike-review.md) | Echo + Mike | HIG pass · auth/draft/no-member-data verification | WK4 |
| [WK6](seeds/WK6-kilo-tests.md) | Kilo | Characterization suite mapping to §8.1 rows | WK2, WK4 |
| [WK7](seeds/WK7-delta-lima-close.md) | Delta + Lima | Execute §8.1 runbook → `gate-reports/`; decision log; Architecture doc | all |

Sequencing: WK1→WK2 serial (Alpha). WK3 + WK4 parallel after WK2. WK5–WK7 close.

## 3. Coach actions (only you can do these)

1. **W0:** Approve/amend both specs (they are drafts with your open decisions D-1…D-12, D-i1…D-i5).
2. **Content:** Flip a starter set of lab-wiki pages to `status: published` (suggest:
   the 12 topics + glossary; sources can stay draft) — without this, member surfaces
   are honestly empty.
3. **Ship call** after Delta PASS: card `soon` → `live` (one-row update, seeded in WK7).

## 4. Known repairs to the existing scaffold (from WK0 pre-audit)

- Search page: replace hardcoded "Index not built yet" card with real API call +
  results (keep the honest empty state for zero results).
- Entry page: "Start here" and "New this week" are static — bind to `/api/wiki/index`.
- Graph page: placeholder — bind to `/api/wiki/graph`; add list fallback (WI7).
- No article route exists — `[slug]/page.tsx` is net-new (Charlie).
- Auth check duplicated per page via `/api/auth/me` fetch — acceptable for W1; note
  for Framework convergence later.
- Scaffold is uncommitted — WK0 decides commit order so specs land before/with code
  (documentation parity).
