# SODP0 — Mike (auth hop)

**Machine:** StudioTwo, read-only.  
**Review object:** spec §6 hop, SODP-3, MiniTwo/MacBook SSO.

## Do

1. Member cookie never forwarded to StudioOne. Computing-class admin JWT only (identity_id=0, LABS_ENV=dev on sidecar).
2. Secrets already match StudioTwo/StudioOne (VP hop works). History hop must use the same.
3. Each UI host: `NEXT_PUBLIC_SITE_URL` + SSO redirect host. localhost callback is a 401 identity miss.
4. SODP-LABS (moving product API) is **out** until Coach stamps — flag load on capture box.

**Gate:** APPROVED / RETURNED. File `gate-reports/SODP0-mike.md`.
