# MiniTwo — Auth hardening deploy runbook (H5 residual)

**Why agent could not deploy:** StudioTwo’s `~/.ssh/id_minitwo` is **not authorized** on MiniTwo (`Permission denied (publickey)`).  
DudeTwo is reachable but has **no** `~/Fattail-Labs` checkout (Labs prod is MiniTwo-only per deploy.md).

## One-time: authorize deploy key (on MiniTwo)

**Full options (A / B / C), public key, and troubleshooting:**

→ **[`docs/ops/MiniTwo-SSH-Agent-Access.md`](./MiniTwo-SSH-Agent-Access.md)**

Short form — on MiniTwo as `ernie`, append StudioTwo’s agent public key to `~/.ssh/authorized_keys`, then from StudioTwo:

```bash
ssh -o BatchMode=yes minitwo 'echo OK; hostname'
```

## Deploy (on MiniTwo)

```bash
ssh minitwo
cd ~/Fattail-Labs

# Ensure .env includes (production):
# LABS_ADMIN_EMAILS=ernie@dudefromearth.com,coach@fattail.ai,conor@fattail.ai

bash infra/scripts/deploy-minitwo-auth-hardening.sh
```

Or manual steps in `infra/deploy.md` § Deploy + § Auth hardening.

## Smoke after deploy

| Check | Expect |
|-------|--------|
| `curl -s localhost:4000/api/health` | ok, env production/staging |
| `curl -s localhost:4000/api/auth/providers` | FatTail URL has `reauth=1` |
| Browser Sign out | `/api/auth/me` → 401 |
| Set-Cookie on logout | `ft_session` Max-Age=0 |
| FatTail SSO | WP login (reauth), then correct Labs user |

## Related

- `infra/scripts/deploy-minitwo-auth-hardening.sh`  
- `infra/nginx/labs-sso-access-log.conf` (MiniThree)  
- `docs/ops/WP-SSO-JWT-TTL.md`  
- `docs/Auth-Account-Switch-Runbook.md`  
