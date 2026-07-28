# Seed WK5 — Echo + Mike: Design and security review

**Project:** p-wiki · **Agents:** Echo, Mike · **Prerequisite:** WK4

## Files in scope

- Review only; fixes route back to WK4 (Charlie) or WK2 (Alpha) unless one-line

## Echo (HIG)

1. Four surfaces against HIG: density, hierarchy, tokens, sentence case.
2. Wikilink affordance distinct from external links; unresolved state legible.
3. Graph legend + colors from Labs tokens (not Obsidian's theme).
4. Empty states: honest, not apologetic; no dark patterns, no gamification (Tango
   consulted if anything gamification-adjacent appears).

## Mike (auth + privacy)

1. Every `/api/wiki/*` route: session enforcement server-side; client checks are
   visibility-only.
2. Draft gate: member 404 proven again on reviewed build; no draft leakage via
   graph, index, search, or switcher payloads (check each).
3. No member data anywhere in wiki payloads (parent W11) — grep + payload inspection.
4. Reindex endpoint: admin-only, audit-logged if actor_events pattern applies.

## Completion

- [ ] Echo findings list (file:line) → `gate-reports/WK5-echo.md`
- [ ] Mike findings list with payload evidence → `gate-reports/WK5-mike.md`
- [ ] P0 findings fixed and re-verified before WK7
