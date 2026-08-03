# Seed AC2-1 — Mike + Alpha: ungateable + data-bearing constants

**Project:** p-access-control  
**Agents:** Mike (design) · Alpha (code)  
**Depends on:** AC1-G PASS  
**Spec:** §§4.2.1, 4.2.2  

---

## Intent

Code constants + write-validation rules for ungateable surfaces and data-bearing apps. **422 only** — no silent coerce.

---

## Read first

1. Spec §§4.2.1–4.2.2, 8.2, 12  
2. As-built app slugs (trade-log, journal, playbook, …)  
3. Member Practice Export paths  

---

## Files in scope

- `server/access_control/constants.py` (or equiv)  
- Write-validation helpers used by admin API (may be `write_validate.py`)  

## Out of scope

Full admin CRUD (AC2-2); UI.

---

## Deliverable

1. `ACCESS_UNGATEABLE_TARGETS` frozenset  
2. `DATA_BEARING_APPS` frozenset  
3. Validate policy write: ungateable → 422; illegal hard/hide on data-bearing → 422 with floor message  
4. Mike APPROVED  

---

## Completion

- [ ] Constants + pure validate functions  
- [ ] Mike security sign-off  

## Feeds

→ AC2-2
