# FatTail Labs

Course hosting platform for [FatTail.ai](https://fattail.ai) — `labs.fattail.ai`.
Membership education product: one subscription unlocks the course library, live sessions,
resources, and community. Modeled on the AI Labs member experience; replaces LearnDash.

- **Spec:** [Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md](Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md)
- **Architecture (as-built):** [Architecture/README.md](Architecture/README.md) — system overview, backend/frontend design, domain model, security, ops
- **Operator guide:** [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) — board, cast, HeyGen, packages, agents
- **WooCommerce + WordPress SSO:** [docs/WooCommerce-SSO-Integration-Guide.md](docs/WooCommerce-SSO-Integration-Guide.md)
- **Marketing platform (design):** [docs/Marketing-Platform-Architecture.md](docs/Marketing-Platform-Architecture.md)
- **Campaign workflow (first-class, like courses):** [Specs/FatTail-Labs-Campaign-Workflow-Spec-v1.0.md](Specs/FatTail-Labs-Campaign-Workflow-Spec-v1.0.md)
- **Workflow manager (design):** [docs/Workflow-Manager-Architecture.md](docs/Workflow-Manager-Architecture.md)
- **Deploy:** [infra/deploy.md](infra/deploy.md)
- **Backend:** FastAPI (`server/`) + MySQL, filename-ordered SQL migrations (`migrations/`)
- **Frontend:** Next.js (`web/`) — public catalog/course pages statically generated (SEO/AEO),
  member routes behind Labs-native auth + pluggable WordPress SSO

## Hardening (2026-07-23) — shipped

| Phase | What |
|---|---|
| **A–D** | Agent identity, Kanban board, packages, multi-module placement |
| **E** | DB pool, SSO contracts, smoke tests |
| **F** | Bunny Stream signed embeds for gated video |
| **G** | Studio cast, HeyGen produce/batch/budget, Quebec tick, refresh + YouTube map |

Control plane: `/admin` · board `/admin/board` · cast `/admin/cast`.  
Cast registry: `docs/studio/cast/`. Spec: `Specs/FatTail-Labs-Cast-HeyGen-Spec-v1.1.md`.

## Dev quickstart

```bash
# Backend
cd server
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp ../.env.example ../.env   # fill in real values
set -a && source ../.env && set +a
.venv/bin/python migrate.py
.venv/bin/uvicorn main:app --host 0.0.0.0 --port $LABS_PORT

# Frontend (production-shaped: build + start — preferred for admin UI parity)
cd web
npm install && npm run build && npm start
# local iterate only: npm run dev
```

Tests (required for `server/` commits):

```bash
cd server && set -a && source ../.env && set +a && .venv/bin/python -m pytest tests -q
```

Standalone by design: no code shared with MarketSwarm-Canonical — integration with the
FatTail App is strictly via API.
