# Seed AC5-3 — Mike + Charlie: Preview-as

**Project:** p-access-control  
**Agents:** Mike (cookie/security) · Charlie (UI)  
**Depends on:** AC2-G  
**Spec:** §§4.1 PreviewAs, 12  

---

## Intent

`ft_access_preview` cookie: admin evaluates as anon/role/plans; **empty enrollments**; write suppress for progress/practice/trade; policy CRUD still allowed.

---

## Files in scope

- Server: cookie parse into ViewerContext; write suppress middleware/hooks  
- Web: admin preview-as control  

---

## Invariants

- HttpOnly; short TTL; SameSite appropriate  
- Enrollments default `[]` — never inherit admin enrollments  
- No progress pollution  

---

## Completion

- [ ] Mike APPROVED cookie + suppress  
- [ ] Kilo case in AC5-5: no progress row under preview  

## Feeds

→ AC5-5 · AC5-G
