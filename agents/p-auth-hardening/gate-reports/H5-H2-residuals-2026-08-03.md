# H5 / H2 residual execution — 2026-08-03

## H5 MiniTwo deploy

| Check | Result |
|-------|--------|
| SSH minitwo | **FAIL** — Permission denied (id_minitwo not in authorized_keys) |
| SSH dudetwo | OK but **no** Fattail-Labs checkout (not Labs host) |
| MiniThree | Tailscale timeout |
| Artifact | `infra/scripts/deploy-minitwo-auth-hardening.sh` + `docs/ops/MiniTwo-Auth-Deploy-Runbook.md` |

**Unblock:** add StudioTwo public key to MiniTwo `~/.ssh/authorized_keys`, then run script.

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

Code + runbooks complete. **Host access** still required for live H5/H2 edge apply.
