# CLAUDE.md — FatTail-Labs

## What This Is

**FatTail Labs** (`labs.fattail.ai`) — standalone course hosting platform for FatTail.ai,
modeled on labs.firstmovers.ai. Membership education product: one subscription unlocks the
course library, live sessions, resources, and community. Replaces LearnDash.

Full product spec: `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`.  
As-built architecture: `Architecture/README.md` (start with `01-system-overview.md`).  
Deploy playbook: `infra/deploy.md`.  
**Live market data (chains/symbols/WS):** `Architecture/28-massive-market-bus.md` —  
Massive → feeds → Redis → one WebSocket/tab → `web/lib/market` shared client.  
Do **not** add per-request Massive or per-widget sockets. Options Lab: `/app/options-lab`.

**Live underlier mids (site-wide UI standard):** any mid/last/live price for universe
symbols uses `useLiveUnderlierMarks` + `bindUnderlierMark` + `<LiveMid />` /
`LiveUnderliersTable` (`web/lib/market/liveUnderlierPattern.ts`). Do **not** invent
ad-hoc polls or WS-only mid tables. See Arch **28** §4.4 and `AGENTS.md` market invariant 9.

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
  Integration guide: `docs/WooCommerce-SSO-Integration-Guide.md`.
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

### Options Lab — OPF Truth & Elegant Failure (capital-risk · DL-309)

**Normative:** `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md` (v1.0 SUPERSEDED · **DL-396**)

When creating, editing, or displaying **positions** (Builder, cards, package marks):

1. **OPF is the only truth.** Dual-side chain generations OPF holds = sole instrument
   universe (listed exp + listed strikes + marks). RTH vs closed changes live/held, not
   what contracts exist. Never invent strikes for prefill/strategy change.
2. **Representable or named failure.** Either every leg is real on that plane and may
   show a defendable package mark, or the UI shows a **truthful named state** (EXPIRED ·
   HELD/RESIDUAL · NOT TRADED · CHECK LEGS · UPDATING · BUDGET LIMIT · WAITING · HIDDEN)
   — never a silent blank or a lying debit/credit. Last known print is not an outage.
3. **Two clocks.** τ / settlement = OPF expiry instant. Card EXPIRED = next midnight ET.
   Between them = Held / residual, never live. Clocks name the **claim**;
   they do **not** unmount Surface analysis (**DL-445**).
4. **Atomic settle.** Pointer change resolves once; no endless flash/search.
5. **Severity high** if we invent instruments or false package prices — capital-adjacent
   judgment surface.

Platform fail-loud (config) and member-facing **fail elegant and truthful** (instruments)
both reject silent wrongness.

## Positioning (informs all product copy)

**North star:** help traders become **enlightened** (secular practice: present, aware,
integrated; methodology + habit machine; toughness as enabler) inside a
**right-skewed, fat-tailed** world. Spec:
`Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md` · DL-209–211.
Member-facing AI prepends `LABS_MEMBER_AI_ETHOS_V1_2`; MODE=off drops preamble only.
Distress gate is **code**, independent of MODE; targets self-harm not trading vernacular.

Core capital thesis: **"stop the bleeding"** — capital preservation is the first step to
trading success and for many the only step they need. Strategy: sell the dream, sequence
the discipline — the pathway routes everyone through the stop-the-bleeding flagship first.
Testimonials/marketing use process outcomes (drawdown stopped, adherence streaks), NEVER
profit claims. Certification tier 1: "Capital Preservation Operator."

## Commands

```bash
# Backend
cd server && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python migrate.py                    # apply pending migrations
.venv/bin/python migrate.py --dry-run          # preview
.venv/bin/uvicorn main:app --port 4000         # dev only

# Market Bus (optional live plane — Arch 28)
# redis-cli ping  # need PONG
export LABS_MARKET_BUS=1 REDIS_URL=redis://127.0.0.1:6379/0
# .venv/bin/python -m market_data.chain_feed --interval 2
# .venv/bin/python -m market_data.sym_feed --interval 5
# .venv/bin/python scripts/mb_at_evidence.py
# .venv/bin/python scripts/mb_scale_smoke.py --n 10

# Frontend — StudioTwo (this machine)
# Coach: "rebuild and restart" = **dev** here. Never MiniTwo / labs.fattail.ai
# unless Coach names production explicitly. All other ops default to development.
cd web && npm install && npm run dev          # default restart
# cd web && npm run build && npm start        # only when Coach says production

# Frontend — production host only (MiniTwo; do not run unless directed)
# cd web && npm run build && npm start

# Tests (characterization suite vs the dev DB — Test Suite spec v1.0)
cd server && .venv/bin/python -m pytest tests -q
```

**Agent models (P2 runtime — optional keys; fail loud when used):**

```bash
export XAI_API_KEY=...                 # primary — Grok (default model grok-4.5)
export ANTHROPIC_API_KEY=...           # secondary — Claude
# optional: LABS_AI_PRIMARY_MODEL, LABS_AI_SECONDARY_MODEL, LABS_AI_AGENT_BRAVO_PREFER=secondary
```

```python
from ai import complete, describe_ai_status
complete([{"role": "user", "content": "..."}], agent="bravo")  # Grok by default
```

Spec: `Specs/FatTail-Labs-Agent-Model-Interface-Spec-v1.0.md`.

Admin control plane: `/admin` (no member header) — **board (Kanban)**, **cast**, media,
AI workbench, agent keys; notification bell (in-app + browser; email via `LABS_SMTP_*`).
Phase G: cast registry, HeyGen produce/batch/budget, Quebec tick, refresh + YouTube map.
Phases B–D: packages and placement. Operator guide: `docs/ADMIN-GUIDE.md`.
In-place editing remains on production URLs. Agent API keys: `/admin/agents`
(`Authorization: Bearer ftl_ag_…`).

Browser workbench: `/admin/ai` (admin session or agent bearer). Live Playwright:

```bash
# API + web running; XAI_API_KEY set on the API process
cd web && npm i && npx playwright install chromium
XAI_API_KEY=... npm run test:e2e:ai
```

**Every commit touching `server/` must pass the test suite first.** New
features add their characterization tests in the same change.
