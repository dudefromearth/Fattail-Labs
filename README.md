# FatTail Labs

**Production host today:** [labs.fattail.ai](https://labs.fattail.ai)  
**Brand / commerce:** [fattail.ai](https://fattail.ai) (WooCommerce sells; Labs entitles)

Standalone membership platform for FatTail: **courses and practice tools** plus **Strategy Lab** (process bots). Replaces LearnDash. No shared code with MarketSwarm-Canonical — external systems by HTTP only.

North star: **stop the bleeding** — capital preservation first; process outcomes only; capacity over dependency. No profit-theater marketing.

---

## Current state (as-built)

One product host and Apps hub. Members use a unified suite under `labs.fattail.ai`.

| Area | Status |
|------|--------|
| **Courses / live / resources / pathway** | Shipped — public SEO catalog + member player |
| **Practice stack** | Shipped — trade log, journal, retrospectives, reports, playbook |
| **Toughness / habits** | Shipped and expanding |
| **Strategy Lab — Design + Curate** | **Active product focus** — multi-member Curate, shared marks, house designs; lock and deepen for current membership |
| **Strategy Lab — Deploy** | Surface for members **except real-broker (Tradier) real-money**; admin dogfoods Tradier, then provision |
| **Community** | Spec + bridge path — Discord second window, admin channel map |
| **Visualize AI** | Spec / architecture (not shipped) — tool-backed market-structure charts |
| **Bot Marketplace** | Spec / architecture (not shipped) — monetize FatTail Lab Bots under Labs product intent |
| **Admin** | Board, cast/HeyGen, access control, users, packages |
| **Native apply** | Shipped in-repo — `/apply` writes Cole’s seven AC fields + tag 18. `fattail.ai/apply` still needs Foxtrot routing (host open). **DL-451** |

**Strategy Lab timeline (now):** Design + Curate for entitled members; Deploy UX without live Tradier capital; admin proves Tradier, then designated members get real-broker Deploy.  
→ [docs/Strategy-Lab-Member-Timeline.md](docs/Strategy-Lab-Member-Timeline.md) · [Architecture/26-strategy-lab-member-timeline.md](Architecture/26-strategy-lab-member-timeline.md) · **DL-251 / DL-252**

**Auth:** Labs identity + pluggable WordPress SSO; Observer trial = Navigator **feature** parity for a **6-week weekly** term (not a free plan).

---

## Product direction (future — intent only)

Not a current cutover. Design new work so it can split cleanly later.

| Future host | Membership (target) | Job |
|-------------|---------------------|-----|
| **`practice.fattail.ai`** | **Navigator** (trader default) | Become a better trader — coaching, courses, practice stack, Visualize AI |
| **`labs.fattail.ai`** | **Labs** (separate membership product) | Build and deploy bots — Strategy Lab, marketplace; OA-class automation, opposite doctrine |

- **Current Navigators** at cutover: **grandfathered** via a **granted Labs membership**.  
- **Future Navigators:** Practice only unless they **purchase Labs**.  
- **Community:** both products; **channels segmented** (`practice` \| `labs` \| `shared`).  
- **Visualize AI:** Practice exclusive (later).  

→ [docs/Dual-Subdomain-Practice-vs-Labs.md](docs/Dual-Subdomain-Practice-vs-Labs.md) · [Architecture/25-dual-subdomain-practice-labs.md](Architecture/25-dual-subdomain-practice-labs.md) · **DL-248–250**

Until that program opens: **ship on the single host**; do not strip as-built Navigator access.

---

## Product surfaces (pointers)

| Surface | Docs |
|---------|------|
| Course hosting | [Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md](Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md) |
| Strategy Lab (as-built + growth) | [Architecture/19-strategy-lab-as-built-map.md](Architecture/19-strategy-lab-as-built-map.md) · [Architecture/17-strategy-lab-growth-playbook.md](Architecture/17-strategy-lab-growth-playbook.md) · Curate guide [docs/Strategy-Lab-Curate-Runtime-User-Guide.md](docs/Strategy-Lab-Curate-Runtime-User-Guide.md) |
| Positioning vs OA-class tools | [Architecture/16-strategy-lab-vs-option-alpha-positioning.md](Architecture/16-strategy-lab-vs-option-alpha-positioning.md) |
| Community chat + Discord | [docs/Community-Chat-Discord-Second-Window.md](docs/Community-Chat-Discord-Second-Window.md) · [Specs/FatTail-Labs-Community-App-Spec-v1.0.md](Specs/FatTail-Labs-Community-App-Spec-v1.0.md) |
| Visualize AI | [docs/Visualize-AI-How-It-Works.md](docs/Visualize-AI-How-It-Works.md) · [Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md](Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md) |
| Bot Marketplace | [docs/Bot-Marketplace-How-It-Works.md](docs/Bot-Marketplace-How-It-Works.md) · [Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md](Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md) |
| Decision log | [Architecture/00-decision-log.md](Architecture/00-decision-log.md) |
| Full architecture index | [Architecture/README.md](Architecture/README.md) |
| Operator guide | [docs/ADMIN-GUIDE.md](docs/ADMIN-GUIDE.md) |
| WooCommerce + SSO | [docs/WooCommerce-SSO-Integration-Guide.md](docs/WooCommerce-SSO-Integration-Guide.md) |
| Native apply | [Specs/FatTail-Native-Apply-Form-Spec-v0.1.md](Specs/FatTail-Native-Apply-Form-Spec-v0.1.md) · [docs/Native-Apply-Ship-Path.md](docs/Native-Apply-Ship-Path.md) · **DL-451** |
| Deploy / hosting | [infra/deploy.md](infra/deploy.md) |

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI (`server/`) · MySQL · filename-ordered migrations (`migrations/`) |
| Frontend | Next.js (`web/`) — public SSG catalog/course (SEO/AEO); member routes behind auth |
| Edge | MiniTwo service · MiniThree nginx · Cloudflare |
| Market data (Strategy Lab) | Massive + shared live marks stream; Tradier for real-broker Deploy later |

Multi-agent development: [AGENTS.md](AGENTS.md) · `agents/bench/`.

---

## Hardening (2026-07-23) — shipped

| Phase | What |
|---|---|
| **A–D** | Agent identity, Kanban board, packages, multi-module placement |
| **E** | DB pool, SSO contracts, smoke tests |
| **F** | Bunny Stream signed embeds for gated video |
| **G** | Studio cast, HeyGen produce/batch/budget, Quebec tick, refresh + YouTube map |

Control plane: `/admin` · board `/admin/board` · cast `/admin/cast`.  
Cast registry: `docs/studio/cast/`. Spec: `Specs/FatTail-Labs-Cast-HeyGen-Spec-v1.1.md`.

---

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

Standalone by design: no code shared with MarketSwarm-Canonical — integration with the FatTail App is strictly via API.
