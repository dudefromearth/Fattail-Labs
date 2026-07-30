# Seed TM0-1 — India Spec amend (admin-only lexicon)

**Project:** p-tag-manager  
**Agent:** India  
**Reviewer:** Coach  
**Spec:** Tag Manager v0.2 → produce v0.2.1 or v0.3 amend  

---

## Intent

Rewrite Spec product model to match Coach locks so BUILD AUTHORITY is coherent.

---

## Required Spec changes

1. **Drop** personal vocabulary tier (`member_tags` ownership, member merge/rename of definitions).  
2. **Single** platform vocabulary; **admin-only** definition CRUD.  
3. Members: **assign/unassign only**; picker cannot create tags.  
4. **Remove** auto-create and near-duplicate create flow (or limit hint to “pick existing”).  
5. Surfaces: `/admin/tags` CRUD; Resources hub Lexicon RO; **no `/me` tags**.  
6. Schema sketch: `tags` + `tag_assignments` (+ categories); no personal definition table.  
7. Keep: context-not-gate, no P&L, no public tag index, merge/retire, Family B on assignments, agent context-only.  
8. Cross-link Journal Session v0.5 as consumer after Tag Manager ships.  
9. object_type ACL matrix (course, resource, journal_session, trade, …).  

---

## Out of scope

Implementation code.

---

## Completion

- [ ] Spec file updated (new version) or Coach-accepted GO note listing voids  
- [ ] India APPROVED for architecture under locks  
- [ ] Handoff to Hotel/Tango seed content  

## Gate

TM0-G / Coach GO
