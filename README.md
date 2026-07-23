# FatTail Labs

Course hosting platform for [FatTail.ai](https://fattail.ai) — `labs.fattail.ai`.
Membership education product: one subscription unlocks the course library, live sessions,
resources, and community. Modeled on the AI Labs member experience; replaces LearnDash.

- **Spec:** [Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md](Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md)
- **Architecture (as-built):** [Architecture/README.md](Architecture/README.md) — system overview, backend/frontend design, domain model, security, ops
- **Deploy:** [infra/deploy.md](infra/deploy.md)
- **Backend:** FastAPI (`server/`) + MySQL, filename-ordered SQL migrations (`migrations/`)
- **Frontend:** Next.js (`web/`) — public catalog/course pages statically generated (SEO/AEO),
  member routes behind Labs-native auth + pluggable WordPress SSO

## Dev quickstart

```bash
# Backend
cd server
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp ../.env.example ../.env   # fill in real values
set -a && source ../.env && set +a
.venv/bin/python migrate.py
.venv/bin/uvicorn main:app --port $LABS_PORT

# Frontend
cd web
npm install && npm run dev
```

Standalone by design: no code shared with MarketSwarm-Canonical — integration with the
FatTail App is strictly via API.
