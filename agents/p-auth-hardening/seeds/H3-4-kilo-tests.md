# Seed H3-4 — Kilo allowlist tests

**Project:** p-auth-hardening  
**Agent:** Kilo  
**Depends on:** H3-3  

---

## Required cases

| Case | Expect |
|------|--------|
| WP is_admin, email not listed | no role_override admin |
| email listed | may become admin (per design) |
| bare role "admin" only | no promote |

## Feeds

H3-G  
