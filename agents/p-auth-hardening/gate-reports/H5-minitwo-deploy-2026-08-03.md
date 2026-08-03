# H5 MiniTwo deploy — 2026-08-03

**Verdict: PASS** (host residual closed after Option A)

| Check | Result |
|-------|--------|
| SSH minitwo | OK after Option A `authorized_keys` |
| git HEAD | `a172c7d` (ff from `fe89133`; deploy script PATH only on final pull) |
| LABS_ADMIN_EMAILS | set |
| migrate | No pending |
| npm build | OK (earlier deploy at fe89133) |
| launchd api | LISTEN 127.0.0.1:4000 (`ai.fattail.labs.api`) |
| launchd web | LISTEN *:4001 (`ai.fattail.labs.web`) |
| health local | `{"status":"ok","env":"production"}` |
| health public | `https://labs.fattail.ai/api/health` → same |
| providers reauth=1 | OK (fattail + 0-dte) |
| /login via :4001 | 200 |

**H5-2 Coach smoke:** **PASS** 2026-08-03 — sticky Alpha → logout → FatTail SSO → Ernie works. See `H5-2-coach-smoke.md`.

Note: earlier deploy stashed local dirty `web/components/MembershipPlans.tsx` before pull.
