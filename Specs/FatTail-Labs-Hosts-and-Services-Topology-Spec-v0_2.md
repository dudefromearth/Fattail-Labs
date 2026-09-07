# FatTail Labs — Hosts and Services Topology Spec v0.2

**Status:** **DRAFT v0.2** — Coach's direction of 2026-09-06 and **2026-09-07** (recommissioning comes
first; MiniTwo becomes staging). Not stamped. **Supersedes v0.1** (same day + 1; §1, §3 H5/H6, §6 changed).
Needs Coach (§6 dispositions), **Foxtrot** (§3 cutover runbook — this spec names the shape,
Foxtrot writes the commands), **India** (§2 product seating and boundary), Mike (cookie domain,
SSO issuers on the new origin), Sierra (canonical host unchanged), Lima (DL, pillar rewrite).
**Date:** 2026-09-06 · **Short name:** **HOST** · **Owner:** Juliet (draft) → Foxtrot
**Reverses:** the host allocation of **DL-673 / DL-674** (DudeOne as analysis node) **and DL-673's
retirement of staging** — MiniTwo becomes the staging server for all production apps (Coach,
2026-09-07). Keeps DL-673's reasoning that analysis must not live on the collector.
**Parents:** `CLAUDE.md` hosts pillar · `infra/deploy.md` · QLAB v0.3 §3 (lab node, OD-QLAB-1) ·
ATRV v0.9 §5 (host-agnostic) · Read API v0.8 §1 (collection outranks reads)

---

## 0. Coach intent (verbatim, do not drop)

> *"We need to set up DudeOne (currently at https://flyonthewall.io) as the next production
> server (https://labs.fattail.ai). And decommission MiniTwo, then promote DudeOne. That will
> leave DudeTwo (currently at stage.flyonthewall.io) and MiniTwo for us to use in our quant
> labs' machinery. These servers will support Strategy Lab, Option Lab, and IKI Lab."*

> *"Strategy Lab will become the Option Bot service, and IKI Lab will become the Knowledge and
> Intelligence product service. Option Lab is meant to be paired with Practice and Journey."*

> *"DudeOne is serving the defunct MarketSwarm-Canonical a.k.a. https://flyonthewall.io. This
> will be decommissioned, and DudeOne will be the next version of our main service, which
> houses Courses, Practice, Journey, Toughness, and Options Lab. DudeTwo will focus on Strategy
> Lab, IKI Lab, IKI Factory (customer-facing), and IKI LB and Quant Lab, which are
> admin-facing products."*

> *"https://FatTail.ai is the front door, a WooCommerce sales and membership site. 0-DTE.com is
> the legacy coaching service site. They both provide access to FatTail Labs, which houses all
> the other services I mentioned. FatTail is the main site. Just to punctuate it."*

> *"StudioOne is nothing more than a collector and hosts the API to advanced market data for
> the other services."*

> **2026-09-07:** *"Another goal that should precede the ones already stated is to recommission
> DudeOne as the new production server for Labs. And to recommission DudeTwo as the new Strategy
> Lab and IKI Lab compute server. DudeTwo's job going forward will be to compute the data we
> collect and provide a research lab to search for strategies and studies that will feed
> Strategy Lab and IKI Lab customer-facing storefronts. MiniTwo will become a staging server
> [for] all production apps."*

**Priority (Coach, 2026-09-07):** recommissioning DudeOne and DudeTwo **precedes** the Time
Machine / store / Strategy Lab goals. The store builds and the research lab land on DudeTwo, not
on a laptop; that is why this comes first.

Success criteria, as this draft reads them: `labs.fattail.ai` served from DudeOne with no member
able to tell the difference except that it is faster; MiniTwo out of the production path and
available; the quant machinery on its own boxes so the collector's headroom stays the tap's;
the product map written down so the next spec knows which box it lands on.

---

## 1. Hosts — was / is

### 1.0 The front doors are not on these boxes

| Site | Role | Relation to Labs | Hosted |
|---|---|---|---|
| **`fattail.ai`** | **The main site.** Front door: WooCommerce sales and membership | SSO issuer **and** commerce provider (`providers.py`, `provider_plan_map`); entitlements sync into Labs | WordPress hosting, **outside this topology, not moved** |
| **`0-dte.com`** | Legacy coaching service site | SSO issuer; same email = same Labs identity | outside this topology, not moved |
| **`labs.fattail.ai`** | **FatTail Labs — the app both doors open onto**; houses every service in §2 | — | **DudeOne** (this spec) |

Wherever this document said "main service" it means **the Labs app**; the *main site* is
`fattail.ai`. Nothing in this spec changes either front door, the SSO contract, or commerce —
the Labs origin changes box, not name, and the providers pillar (`CLAUDE.md`) stands.

| Machine | Hardware | Was (DL-673) | **Is (this spec)** | Serves |
|---|---|---|---|---|
| **DudeOne** | M4 · 24 GB · 500 GB | analysis node; `flyonthewall.io` (MSC, defunct) | **Production — the Labs app** `labs.fattail.ai` | Courses · Practice · Journey · Toughness · Options Lab · auth/me/providers · admin |
| **DudeTwo** | M4 · 24 GB · 500 GB (identical peer, DL-674) | MSC staging; `stage.flyonthewall.io` | **Compute and research lab** — the QLAB §3 box, OD-QLAB-1 answered. Coach: *"compute the data we collect and provide a research lab to search for strategies and studies that feed the Strategy Lab and IKI Lab customer-facing storefronts"* | derived-store builds · backfill · Monte Carlo runner · Quant Lab (admin notebook) · study registrations → **published** cells/templates that DudeOne serves as Option Bot and K&I |
| **MiniTwo** | M2 Mac Mini | production, sole Labs host | **Rollback host for 7 days after cutover, then STAGING for all production apps** (Coach, 2026-09-07; reinstates staging, `labs-stage.fattail.ai`) | built output only, never a dev server (§2.3); same `.env` key set as production with staging values; the place a release is proven before DudeOne takes it |
| **MiniThree** | — | nginx, Cloudflare origin | unchanged — **upstream for `labs` changes from MiniTwo to DudeOne** | routing only |
| **StudioOne** | M1 Max | collector and corpus | **unchanged, untouched by this program.** Coach: *"nothing more than a collector, and hosts the API to advanced market data for the other services"* | `live_capture` (the tap) · **the Read API** — the only way any other box gets at the archive. Nothing else runs here; collection outranks reads (Read API §1) |
| **StudioTwo** | — | dev; Generation Plane host (OD-GP3) | unchanged | dev only |

**Staging is reinstated on MiniTwo** (Coach, 2026-09-07; reverses DL-673's retirement). Dev stops
standing in for staging once H6 closes. A release path from here on is **dev → MiniTwo (staging,
`labs-stage.fattail.ai`) → DudeOne (production)**. MiniThree carries both vhosts, as `infra/deploy.md`
already describes for the old topology — the upstreams change, not the shape.

**StudioOne's contract, restated so no phase forgets it:** it collects, and it serves the archive
over the Read API to DudeOne and DudeTwo. It builds nothing, sweeps nothing, indexes nothing.
The derived store, the Monte Carlo runner, the K&I indexer, and every backfill live on the lab
node and pull from StudioOne once (QLAB §2.1). A service that wants market data asks the Read
API; a service that wants to compute on it copies what it needs to its own box first.

**What does not move:** the archive; the collector; the Generation Plane; the MSC decommission is
a *removal*, not a migration — nothing from MarketSwarm-Canonical is carried onto the new Labs
host (invariant §2.1: standalone repo, zero shared code).

---

## 2. Services — the product map

Coach's sentence, as a table. This is **seating**, not scope: each service keeps its own spec.

| Service (member name) | Was | Box | Faces | Spec of record |
|---|---|---|---|---|
| **Labs app (P1 platform)** — Courses, Practice, Journey, Toughness, Options Lab | Labs P1 | DudeOne | members, arriving from `fattail.ai` or `0-dte.com` | Course Hosting v1.0 + each feature spec |
| **Options Lab** | Options Lab | DudeOne | members — **paired with Practice and Journey** (§2.1) | AZ-ALGO, Heatmap/LIM, TM, OPF |
| **Option Bot service** | Strategy Lab | DudeTwo | members | QLAB v0.3 (Lab Bot ≡ Marketplace object, DL-247) + ATRV |
| **Knowledge & Intelligence service** | IKI Lab | DudeTwo | members | IKI Lab specs (GEX toolset, Chain Analytics Read) |
| **IKI Factory** | IKI Factory | DudeTwo | members | `DRAFT-IKI-Factory-Pipeline-Spec-v0_3` |
| **IKI LB** | — | DudeTwo | admin | **OD-HOST-5 — Coach expands the name** |
| **Quant Lab** | Quant Lab | DudeTwo | admin | QLAB v0.3 |

### 2.1 Option Lab paired with Practice and Journey

Read as a product boundary, not a host fact: the Options Lab is the *instrument*, Practice is
where a member uses it on a charter day, Journey is where the record of that use accumulates.
The three share a box because they share a member session and a database. **India confirms at
W0 whether this pairing changes any existing spec's boundary; this draft says it does not.**

### 2.1a What each service is for — Coach, 2026-09-06 (verbatim, seating only)

> *"The new public show, called 0DTE Live, runs Mon–Fri from 2 PM to 3:15 PM, except holidays.
> It will feature developing strategies for late-day 0DTE and 1DTE strategies. These are some
> of the strategies we will feature in Strategy Lab. And it will be a show that demonstrates
> our Strategy Life Cycle. Strategy Lab will become a paid service competing for Option Alpha
> customers. IKI Factory products are used mostly to attract and engage Observers. We try to
> convert Observers into Navigator annuals. And if they don't convert we give them IKI Labs
> Runner and Analyzer as gifts, along with some token heatmaps to keep them close and market
> them IKI products."*

| Service | Role in the funnel | Box | What that asks of the topology |
|---|---|---|---|
| **0DTE Live** (show, Mon–Fri 14:00–15:15 ET, ex-holidays) | **The top-level funnel for all products, particularly Observer trials** (Coach, same day). Public. Demonstrates the **Strategy Life Cycle** on late-day 0DTE / **1DTE** structures | not a service on these boxes — a show | The strategies it develops are Strategy Lab's; the data it needs is the collector's. **1DTE means the era-2 multi-expiration capture (SSR-MEXP) is load-bearing for the show**, not optional |
| **Strategy Lab → Option Bot service** | **Paid**, competing for Option Alpha customers | DudeTwo, served through DudeOne | A member-facing paid product on the lab node — OD-HOST-6 (served through the Labs app, no session on DudeTwo) becomes a commerce question too: entitlement via `provider_plan_map`, like every other plan |
| **IKI Factory** | Attracts and engages **Observers** | DudeTwo, served through DudeOne | Observer-tier gating — the P1 role ladder already has it |
| **Options Lab Runner + Analyzer**, one heatmap | **observer-light** — the free package for Observers who do not convert: a Runner with a heat map for *picking* strategies and an Analyzer for *viewing* them | DudeOne (Options Lab) | `observer-light` is a **free plan** in `provider_plan_map` → role `observer`; no charge invented. Coaching expires, tools never (invariant 9) |
| **IKI products** | **Plug-ins to the Runner** — the heatmap is the first; the email offers sell more of them to a Runner the member already has | produced on DudeTwo (K&I), published into the Labs app | The Runner's template mechanism (Heatmap templates, LIM) **is the plug-in contract and the seam between the two boxes** |
| Observer → **Navigator annual** | the conversion the funnel exists for | — | unchanged |

Read top-down: **the show is the mouth of the funnel** — it feeds Observer trials, which IKI
Factory engages, which convert to Navigator annuals or receive the gifts. Every service in this
table is downstream of a live broadcast at 14:00 ET on a trading day, which is the strongest
argument in this document for the collector's headroom (§1) and for the cutover never landing
in market hours (§3).

Nothing above changes scope of any spec; it says what each box is *for* so the cutover and
the lab node are sized for the products that will actually sell. **Invariant 8 stands on the
show and on every product page: process outcomes only, never profit claims.**

### 2.2 The two-box law

Everything **member-facing in the Labs app** is on DudeOne. Everything that **computes at
scale or lets an admin operate the system** is on DudeTwo. The Option Bot and K&I services are
member-facing *and* on DudeTwo — they are served to members **through** the Labs app
(QLAB §5.2 publish transport: production pulls, "published" means the Labs app serves it
with the lab powered off). A member never holds a session on DudeTwo.

**Consequence:** the `ft_session` cookie, SSO issuers, roles and plans live on DudeOne only.
DudeTwo authenticates to DudeOne, not the other way round — which is the agent-identity gap
INSTRUCTIONS §11.4 already names, and this spec does not close it; it makes the direction of
trust explicit.

---

## 3. Cutover — the shape (Foxtrot writes the runbook)

Phases. Each ends in a Delta gate. No phase touches StudioOne.

| Phase | What | Exit |
|---|---|---|
| **H0** | Freeze: this spec stamped; DL-680 landed; runbook reviewed | W0-G |
| **H1 — Decommission MSC on DudeOne** | Stop MSC services and `flyonthewall.io` vhost; **audit leftovers** (the same list `infra/deploy.md` §"MiniTwo provisioning" step 1 uses); no MSC code, venv, or DB remains on the box | `ps`, `launchctl list`, nginx config, `ls` of the removed paths — all attached |
| **H2 — Provision DudeOne** | Python venv from `requirements.txt`; MySQL `labs` instance; Node build of `web/`; `.env` from `.env.example` **with every key present, values from MiniTwo's `.env` by hand — never committed**; launchd plists from `infra/launchd/*.example`; `--workers 1` assert; TZ America/New_York; Tailscale | API `/api/health` 200 on the LAN; `next start` serving built output; **no dev server** |
| **H3 — Data move (rehearsal)** | `mysqldump --single-transaction` of `labs` from MiniTwo → restore on DudeOne; media/uploads rsync; run the characterization suite **against the restored DB** on DudeOne | row counts per table equal; suite result recorded (the classified nine may stay classified) |
| **H4 — Cutover window** | Declared read-only window **outside market hours** (OD-HOST-1); final dump/restore + rsync delta; MiniThree upstream `labs` → DudeOne; Cloudflare untouched (A record still points at MiniThree); smoke: login via each SSO provider, a lesson plays, `/apply` posts, admin edits in place, Options Lab loads, Time Machine reads a day | curl transcript + browser walk from outside the LAN |
| **H5 — Rollback readiness** | MiniTwo left **running and reachable** for 7 days; flipping the nginx upstream back is the rollback; **no writes reach MiniTwo after H4** (its API stopped, DB read-only) | rollback rehearsed once on the LAN before H4 closes |
| **H6 — MiniTwo becomes staging** | After 7 clean days: production DB on MiniTwo dumped to cold storage and **replaced by a staging copy** (scrubbed of member PII per Mike); `.env` rewritten with staging values; `labs-stage.fattail.ai` vhost on MiniThree points at it; launchd jobs kept, pointing at the staging tree | `labs-stage.fattail.ai` serves built output; a member login there is a staging identity, not a production one; Lima updates `infra/deploy.md`, `CLAUDE.md` pillar, `AGENTS.md`, `INSTRUCTIONS.md` §3 |
| **H7 — DudeTwo compute and research lab** | MSC staging decommissioned by deletion (same audit as H1); QLAB §3 stack: derived-store root, builder, Quant Lab runner and notebook, publish transport to DudeOne; `stage.flyonthewall.io` vhost removed. **This is where the era-1 builds land** (HOST v0.2 §0 priority) | ATRV build of one day on DudeTwo, byte-identical to the MacBook build (`meta.json` hashes); the SPX/XSP era-1 set built here, not on a laptop |

**Things that must not happen in any phase:** a dev server on DudeOne · a secret in a commit ·
`--workers` > 1 · an MSC import or vendored file · a change to the archive or the collector ·
two hosts accepting writes at once · Cloudflare DNS edits (MiniThree stays the origin; only its
upstream changes) · a cutover during market hours.

---

## 4. What changes in the repo

| File | Change | When |
|---|---|---|
| `Architecture/00-decision-log.md` | **DL-680** — this direction; reverses DL-673's DudeOne allocation | today (Lima) |
| `CLAUDE.md` §hosts pillar | production = DudeOne; lab node = DudeTwo; MiniTwo per OD-HOST-3; staging retired (already true since DL-673, never rewritten) | H6 |
| `infra/deploy.md` | Topology table; "DudeOne provisioning"; MSC decommission checklist; rollback | H2 (Foxtrot) |
| `AGENTS.md` / `INSTRUCTIONS.md` §3 | hosts line | H6 (Lima) |
| `Specs/…Quant-Lab-Topology…` | OD-QLAB-1 answered: lab node = DudeTwo; MiniTwo per OD-HOST-3 | v0.4 at H7 |
| `infra/launchd/*.example` | reuse; new names only if a service is new | H2 |
| product code | **none** — this is infra and documentation; a product change rides its own spec | — |

---

## 5. Invariants this spec touches

- **Standalone repo (§2.1).** The MSC decommission on DudeOne is *deletion*. Nothing is copied
  from it. If a Labs feature needed something MSC did, it is consumed over HTTP or not at all.
- **Config-driven, fail loud (§2.2).** DudeOne's `.env` is complete or the API does not boot;
  no key is defaulted "because MiniTwo had it".
- **No dev server (§2.3).** DudeOne serves built output from day one.
- **Session (§3).** `ft_session` domain `.fattail.ai` unchanged; the origin changes box, not
  name. Mike confirms SSO issuer allowlists and provider webhooks need no change.
- **Canonical host (SEO v1.0).** `https://labs.fattail.ai` remains the only canonical origin;
  `NEXT_PUBLIC_SITE_URL` unchanged; Sierra confirms nothing in the sitemap moves.
- **Collection outranks reads (Read API §1).** DudeTwo is the lab node so this stays true.

---

## 6. Open decisions

| # | Question | Owner | Default if silent |
|---|---|---|---|
| **OD-HOST-1** | Cutover window — declared read-only window outside market hours (15–30 min), zero-downtime replication, or unconstrained | **Coach** | **Declared window, off-hours, weekend** |
| **OD-HOST-2** | Timing — after era-2 collection has a few clean days (cutover the weekend of 9/12), or this week | **Coach** | **Spec and runbook this week; H1–H3 may proceed; H4 the weekend of 9/12** |
| **OD-HOST-3** | ~~MiniTwo after the hold~~ **Disposed by Coach 2026-09-07: staging for all production apps.** Remaining question: does staging get a **scrubbed copy** of production data or a seeded fixture set | **Mike · Coach** | scrubbed copy, PII removed, refreshed on demand — never live member data |
| **OD-HOST-7** | **Order of the two recommissions.** DudeOne first (Coach's sentence order) means the cutover window comes before the lab exists; DudeTwo first means the builds and research start today while DudeOne is prepared for the weekend. Both boxes are currently MSC | **Coach** | **DudeTwo H7 first (today, holiday — no members, no market), DudeOne H1–H3 in parallel, H4 the weekend of 9/12** |
| **OD-HOST-4** | Does `flyonthewall.io` DNS stay (parked/redirect to fattail.ai) or lapse | **Coach** | 301 to `https://fattail.ai` from MiniThree; certificate kept until expiry |
| **OD-HOST-5** | **"IKI LB"** — expand the name and its spec of record | **Coach** | blocking for its row in §2 only |
| **OD-HOST-6** | Option Bot / K&I served to members *through* DudeOne (publish transport) or directly from DudeTwo behind the same cookie | **India · Mike** | **Through DudeOne** (§2.2) — no member session on the lab node |

---

## 7. Acceptance

| AT | Criterion |
|---|---|
| **AT-HOST-1** | `https://labs.fattail.ai` resolves through MiniThree to DudeOne; MiniTwo receives **zero** requests after H4 (nginx access log on MiniThree). |
| **AT-HOST-2** | No MSC process, venv, database, or vhost remains on DudeOne after H1 — listed by command, not asserted. |
| **AT-HOST-3** | Row counts of every `labs` table equal on MiniTwo and DudeOne at H4 close; the characterization suite on DudeOne's restored DB reports no failure outside the classified nine. |
| **AT-HOST-4** | Each SSO provider logs a member in on the new host; `ft_session` is set on `.fattail.ai`; an admin edits a course in place; Time Machine reads a day. Browser walk from outside the LAN attached. |
| **AT-HOST-5** | Rollback rehearsed: upstream flipped back to MiniTwo and forward again on the LAN before H4 closes, with the transcript. |
| **AT-HOST-6** | DudeOne boots with `--workers 1` and refuses otherwise; no dev server process exists on DudeOne or DudeTwo (`ps` attached). |
| **AT-HOST-7** | The derived store built on DudeTwo for one day carries the same `meta.json` field hashes as the MacBook build of the same day. |
| **AT-HOST-8** | Docs parity: `CLAUDE.md`, `infra/deploy.md`, `AGENTS.md`, `INSTRUCTIONS.md` §3 describe the topology as it is on the day H6 closes. |

---

## 8. Changelog

| Ver | Date | Notes |
|---|---|---|
| **v0.2** | 2026-09-07 | Coach: recommissioning **precedes** the data goals; **MiniTwo becomes staging for all production apps** (reinstates staging, reverses DL-673's retirement; H6 rewritten from decommission to staging conversion with a scrubbed DB); DudeTwo defined in Coach's words as the **compute and research lab** whose studies feed the storefronts; H7 is where the era-1 builds land. OD-HOST-3 disposed; OD-HOST-7 (order of recommissions) opened with a holiday-aware default. |
| **v0.1** | 2026-09-06 | First draft from Coach's direction. **Same day:** §2.1a added — 0DTE Live (Mon–Fri 14:00–15:15 ET) demonstrates the Strategy Life Cycle on late-day 0DTE/1DTE; Strategy Lab is a paid service vs Option Alpha; IKI Factory attracts Observers; non-converters get Runner + Analyzer + token heatmaps as gifts. §1.0 added — `fattail.ai` is the main site (WooCommerce front door), `0-dte.com` the legacy coaching site, both open onto Labs; "main service" in this document means the Labs app, never the site. DudeOne → production main service (Courses, Practice, Journey, Toughness, Options Lab); DudeTwo → lab node (Option Bot, K&I, IKI Factory, IKI LB, Quant Lab); MiniTwo → 7-day rollback then lab peer (OD-HOST-3); MSC on DudeOne decommissioned by deletion. Reverses DL-673's DudeOne-as-analysis-node; keeps staging retired and the collector untouched. Cutover in seven gated phases; Foxtrot writes the runbook. OD-HOST-1…6, AT-HOST-1…8. |
