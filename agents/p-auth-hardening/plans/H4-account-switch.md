# H4 — Account-switch dual-session ops

**Audit ID:** H4  
**Impact:** High (ops integrity) · **Effort:** S (docs/e2e) / M if WP quirks  
**Depends on:** H5-G (reauth deployed); benefits from H2  
**Closes:** Operators stuck as Alpha MSC when intending Ernie — product + test coverage  

---

## Intent

Labs logout + WP reauth already code-landed. H4 makes it **operator-proof**:

1. Admin/operator runbook (two WP sites, private window, force clear).  
2. Login UX copy if gaps remain.  
3. Automated checks: providers URL has reauth; logout expires cookie; optional Playwright switch smoke.  

---

## Agents

| Seed | Agent | Work |
|------|-------|------|
| H4-1 | **Lima** | Runbook section in Admin Access guide or `docs/Auth-Account-Switch-Runbook.md` |
| H4-2 | **Charlie · Tango** | Login copy honesty; no shame; clear dual-session language |
| H4-3 | **Kilo** | pytest + optional e2e for reauth URL + logout |
| H4-G | **Delta** | Assessment + reevaluation |

---

## Files likely in scope

- `docs/Admin-Access-Control-Guide.md` or new runbook  
- `web/components/LoginForm.tsx` (copy only if needed)  
- `server/tests/test_sso_reauth_urls.py` (extend)  
- Optional: `web/e2e/…`  

## Out of scope

Changing identity resolution algorithm (H3/H1).

---

## Completion criteria

- [ ] Runbook published in-repo  
- [ ] Login UI states FatTail ≠ 0-DTE sessions  
- [ ] Automated assert on reauth=1 in providers  
- [ ] Decision log pointer  

---

## Assessment focus (H4-G)

| Question | Pass if |
|----------|---------|
| Can Coach switch Alpha → Ernie with runbook only? | Yes (manual evidence OK) |
| Program ready to CLOSE? | Yes if H5–H3–H1–H2 also PASS |

## Reevaluation defaults after PASS

- Next: **CLOSE** or promote **M1** rate limits as follow-on project  
