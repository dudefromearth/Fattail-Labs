# FatTail Labs — Architecture Decision Log

Append-only. Each entry: date, decision, rationale. Reversals get a new entry, never an edit.

---

## 2026-07-20 — Product model benchmarked on AI Labs by First Movers

Live teardown of labs.firstmovers.ai (custom Next.js + Stripe, no LMS platform). Adopted:
public `/courses` catalog as entry point, public course detail pages with gated lessons,
explicit per-course enrollment inside all-access membership, module/lesson accordion,
reviews, per-course discussion, live sessions folded back into the library as replays.
Full teardown in `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md` §2.

## 2026-07-20 — Positioning: "stop the bleeding"

Capital preservation is the first step to trading success and for many the only one.
Funnel strategy: sell the dream, sequence the discipline — pathway routes everyone through
the stop-the-bleeding flagship first. Marketing uses process outcomes, never profit claims.

## 2026-07-21 — Standalone repo; no shared code with MarketSwarm-Canonical

Only reason to share the repo would be reusing MSC code, which is not a requirement.
Anything needed from MarketSwarm is consumed via API (Vexy gateway :3003; MSC App API
later). Kills drift risk, frees the stack choice.

## 2026-07-21 — Stack: FastAPI + MySQL + Next.js

FastAPI backend (`server/`), own MySQL `labs` database, own filename-ordered migration
runner. Next.js frontend (`web/`): public pages statically generated at publish time
(Course JSON-LD, unique titles — spec §5.6); member routes client-rendered behind auth.
No dev servers outside dev.

## 2026-07-21 — Hosting: MiniTwo is the sole Labs production host

labs.fattail.ai → MiniTwo (M2 Mac Mini), supervised by launchd (not MSC Node Admin).
Staging labs-stage.fattail.ai → DudeTwo. MiniThree nginx routes both; Cloudflare proxied
A records → shared public IP. Rationale: blast-radius separation from the trading app
(DudeOne), whose peak-reliability hours coincide with Labs traffic peaks. Build proceeds
fully on the internal network; DNS/cert/vhost is a launch-day step.

## 2026-07-21 — Labs is the first native fattail.ai property

flyonthewall.ai was retired (trademark); the FatTail App remains on flyonthewall.io until
its own migration. Labs establishes the fattail.ai zone (origin cert, Cloudflare config,
vhost pattern) that the app migration will inherit. Session cookie domain `.fattail.ai`
from day one so future app migration shares SSO sessions.

## 2026-07-21 — Auth: dual WordPress SSO; WooCommerce is the access-control entry point

Issuers `fattail` (fattail.ai WP) + `0-dte` (0-dte.com WP), same architecture as the
FatTail App's SSO. `(issuer, wp_user_id)` compound identity, universal identity_id,
cumulative roles observer < activator < navigator < administrator. Entitlement mapping
(WooCommerce plan slug → role, per issuer) is config — MSC's blanket 0-dte coaching bypass
does NOT auto-apply. Selling/cancelling/refunds happen only in WordPress; webhooks sync.

## 2026-07-21 — Admin is custom and in-app

`/admin` (role: administrator) owns all course authoring. WordPress has no role in course
content. LearnDash is fully replaced: WP keeps commerce + identity only.

## 2026-07-21 — Repo layout mirrors MarketSwarm-Canonical

`Specs/` (versioned, immutable once approved), `Architecture/` (durable docs + this log),
`infra/` (deploy playbooks). Same muscle memory across both repos.
