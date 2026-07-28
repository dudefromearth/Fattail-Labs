# Seed WK0 — India: Audit scaffold vs spec + commit plan

**Project:** p-wiki · **Agent:** India · **Prerequisite:** none

## Files in scope (read + report; edits only to fix spec violations)

- `web/app/app/wiki/**` (scaffold: entry, search, graph)
- `migrations/034_wiki_replaces_vexy_app.sql`
- Both wiki specs · Application Framework v1.0

## Work

1. Audit the uncommitted scaffold against Interface Spec §§1–6: routes, slot
   structure, registered-component policy, auth posture, copy (no profit framing).
2. Rule on boundaries: no parallel store implied by the frontend; no member data.
3. Produce keep / fix / remove list with file:line references.
4. Write the **commit plan**: ordering so specs + migration + scaffold land on main
   coherently (specs first or same commit; nothing orphaned).
5. Flag anything requiring a spec amendment instead of a code fix (spec is the bug
   rule).

## Completion

- [ ] Audit report in `agents/p-wiki/gate-reports/WK0-audit.md` (evidence: file:line)
- [ ] Commit plan written (exact `git add` groupings + messages)
- [ ] Blockers routed: Coach items vs seed items
