# H5 / H2 residual execution — 2026-08-03

## H5 MiniTwo deploy

| Check | Result |
|-------|--------|
| SSH minitwo (earlier) | FAIL — Permission denied (`id_minitwo` not in `authorized_keys`) |
| SSH minitwo (after Option A) | **PASS** — StudioTwo agent key authorized |
| Live deploy + health | **PASS** — `H5-minitwo-deploy-2026-08-03.md` (HEAD `a172c7d`, prod health + `reauth=1`) |
| SSH dudetwo | OK but **no** Fattail-Labs checkout (not Labs host) |
| Artifact | `infra/scripts/deploy-minitwo-auth-hardening.sh` + `docs/ops/MiniTwo-Auth-Deploy-Runbook.md` |

**H5 fully closed** (host deploy + Coach H5-2 smoke PASS 2026-08-03).

## H2 nginx redaction

| Artifact | Path |
|----------|------|
| nginx snippet | `infra/nginx/labs-sso-access-log.conf` |
| Apply | Human on MiniThree: include + reload |

## H2 WP JWT TTL

| Artifact | Path |
|----------|------|
| Ops requirement | `docs/ops/WP-SSO-JWT-TTL.md` (≤120s) |
| Apply | WP/fotw-sso owner on fattail.ai + 0-dte.com |

## Status

**H5:** closed (Option A + deploy + Coach smoke).  
**H2 edge:** still open (MiniThree nginx + WP JWT TTL).
