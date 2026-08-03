# Seed H5-2 — Coach production smoke

**Project:** p-auth-hardening  
**Agent:** Coach  
**Depends on:** H5-1  

---

## Intent

Human verification on the environment Foxtrot deployed.

---

## Checklist

1. Sign out → `/api/auth/me` is 401 (or browser logged-out state)  
2. DevTools: logout response clears `ft_session`  
3. `/api/auth/providers` FatTail URL contains `reauth=1`  
4. Optional: private window SSO as known account  

File notes under `gate-reports/H5-2-coach-smoke.md` PASS/FAIL.

## Feeds

H5-G  
