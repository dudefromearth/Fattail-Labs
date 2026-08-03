# Seed AC5-1 — Charlie + Echo: /admin/access cockpit

**Project:** p-access-control  
**Agents:** Charlie (impl) · Echo (design sign-off)  
**Depends on:** AC2-G; preferably AC3-G  
**Spec:** §7  

---

## Intent

Admin Access Control cockpit: policy list, course drill-down, audit tab. Uses admin APIs only.

---

## Read first

1. Spec §7  
2. AC0-4 Echo notes  
3. Existing `/admin` patterns in `web/`  

---

## Files in scope

- `web/` admin routes for `/admin/access`  
- Components: list, edit policy form, audit  

## Out of scope

Preview-as cookie (AC5-3); campaign bulk UI polish (AC7); public site changes.

---

## Invariants

- Expansion preview is **display only** (live expand_plans preview, not stored)  
- Alumni labeled non-commercial per Spec §4.3.2 copy  
- No profit-claim CTA templates  

---

## Completion

- [ ] Admin can list/edit policy  
- [ ] Audit tab shows recent writes  
- [ ] Echo APPROVED visual hierarchy  

## Feeds

→ AC5-2 · AC5-4 · AC5-G
