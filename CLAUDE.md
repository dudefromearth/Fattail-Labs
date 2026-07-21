# CLAUDE.md — FatTail-Labs

## What This Is

**FatTail Labs** (`labs.fattail.ai`) — standalone course hosting platform for FatTail.ai,
modeled on labs.firstmovers.ai. Membership education product: one subscription unlocks the
course library, live sessions, resources, and community. Replaces LearnDash.

Full product spec: `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`. Deploy playbook: `infra/deploy.md`.

## Architecture Decisions (locked 2026-07-21)

- **Standalone repo. NO shared code with MarketSwarm-Canonical.** Anything needed from
  MarketSwarm is consumed via HTTP API (Vexy gateway :3003; MSC App API later). Never
  import from or copy MSC code.
- **Backend:** Python FastAPI (`server/`), own MySQL database `labs`, own filename-ordered
  SQL migration runner (`server/migrate.py` over `migrations/NNN_*.sql`).
- **Frontend:** Next.js app (`web/`) — public pages (catalog, course detail) statically
  generated at publish time with Course JSON-LD + unique titles; member routes
  client-rendered behind auth. Production serves built output only.
- **Auth:** Labs-native identity/roles/plans/memberships model
  (Specs/FatTail-Labs-Identity-Access-Spec-v1.0.md). Standalone-capable: scrypt password
  login (`create_user.py` CLI), native memberships, role derivation = role_override else
  best active plan else observer (cumulative: observer < activator < navigator <
  administrator). WordPress SSO + WooCommerce are PLUGGABLE PROVIDERS (`providers.py`):
  HS256 JWT verify per issuer, entitlement keys → plans via `provider_plan_map` table
  (data, not env), HMAC-signed membership webhooks. Same email across providers = one
  identity. Session cookie: `ft_session`, HttpOnly, SameSite=lax, `.fattail.ai` in prod.
- **Commerce:** WooCommerce on the WP sites is the ONLY entry point for selling/cancelling.
  Webhooks sync entitlements. The app never touches payments.
- **Admin:** custom in-app `/admin` (role: administrator). No WordPress admin involvement
  in course content.
- **Hosts:** dev = localhost · staging = DudeTwo (`labs-stage.fattail.ai`) · production =
  **MiniTwo** M2 Mac Mini (`labs.fattail.ai`), sole Labs host. MiniThree nginx routes;
  Cloudflare proxied A records → 173.48.54.249. launchd supervises the service on MiniTwo
  (NOT MSC Node Admin).

## Doctrine (inherited from the FatTail ecosystem)

- **Config-driven, fail loud.** Missing/invalid config raises immediately. No silent
  defaults, no fallback config loading, no hardcoded secrets/ports/IDs.
- **No dev server in staging/production.** Next.js runs built output only.
- **Verification:** after any change touching data flow, prove it — curl the API, read it
  back, check the UI. "It should work" is banned.
- **Change control:** declare exact files + changes before touching; only touch what was
  approved.
- **Documentation parity (nothing hidden):** every feature ships WITH its spec (new or
  versioned in `Specs/`), its decision-log entry, and updates to any affected
  architecture docs — in the same body of work, never "later". `Specs/` must always
  describe the system as it is and as intended, validatable without reading code.
- **Never hardcode** dates, user IDs, API keys, ports.

## Positioning (informs all product copy)

Core thesis: **"stop the bleeding"** — capital preservation is the first step to trading
success and for many the only step they need. Strategy: sell the dream, sequence the
discipline — the pathway routes everyone through the stop-the-bleeding flagship first.
Testimonials/marketing use process outcomes (drawdown stopped, adherence streaks), NEVER
profit claims. Certification tier 1: "Capital Preservation Operator."

## Commands

```bash
# Backend
cd server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python migrate.py                    # apply pending migrations
.venv/bin/python migrate.py --dry-run          # preview
.venv/bin/uvicorn main:app --port 4000         # dev only

# Frontend
cd web && npm install && npm run build && npm start
```
