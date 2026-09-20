# FatTail Labs — StudioOne Data Plane & Remote UI

**Spec v0.1.4**  
**Status:** DRAFT — India R1 (SODP-MB hold) + Mike §6/§7 landed. Coach also names this migration **TOPO-1**. **NOT BUILD AUTHORITY.**  
**Date:** 2026-09-19  
**Program:** SODP  
**Author:** Juliet (from Coach intent)  
**Authority:** Coach (stamp / GO / AP-1)

Coach wording (RL-1, 2026-09-19):

> I want a clean separation with serverside functionality including all data movement and api run from StudioOne, and then the UI is remote, where dev is studioTwo or my Macbook or production on MiniTwo.

> After we make this move to StudioOne, we are going to do a refactoring and hardening audit and figure out how we can make sure this architecture is sound and bullet proof. I want consolidated unit tests. I do not want any dangling code, I want everything clean and purpose built. Data Services and APIs on StudioOne, and remote services consuming the APIs.

---

## 0. What this spec is

The **entire market/data system** as one home: StudioOne runs every server that moves market data or answers a data API. Every UI host is a remote client (Next.js only, plus a thin member hop). This file is the contract for that split.

It does **not** silently relocate Labs identity, courses, or MySQL `labs`. That is a named later cut (**SODP-LABS**) if Coach stamps it. Until then MiniTwo remains the sole **product** Labs host (`infra/deploy.md`).

---

## 1. Three roles (the whole system)

```text
                         member browser
                    (StudioTwo / MacBook / MiniTwo)
                                 │
                                 │  HTTPS + ft_session
                                 ▼
                    ┌─────────────────────────┐
                    │  UI host                │
                    │  Next.js                │
                    │  thin Labs hop :4000    │
                    │  (member cookie here)   │
                    └───────────┬─────────────┘
                                │  computing-class
                                │  LAN / Tailscale pin
                                ▼
                    ┌─────────────────────────┐
                    │  StudioOne  = D1 home   │
                    │  all data movement      │
                    │  all data APIs          │
                    │  Massive (feeds+history)│
                    │  capture / engine       │
                    └─────────────────────────┘
```

| Role | Machines | Runs | Does not run |
|------|----------|------|----------------|
| **D1 home** | StudioOne only | Ingest, feeds, engine, Redis market/VP hot, VP API, symbology, **futures history**, Massive | Next.js, member cookies, course CMS |
| **UI host** | StudioTwo (dev), MacBook (remote), MiniTwo (prod) | Next.js, SSO callback, thin Labs hop | Massive, vp-api, chain_feed, vp-engine, print store, history cache |
| **Product Labs** | MiniTwo (prod), StudioTwo (dev hop only) | Identity, courses, entitlements, MySQL `labs` | Market data assembly |

**Pin:** StudioOne is `http://192.168.1.111` on LAN, `http://100.74.220.38` on Tailscale. Never `studioone.local` (mDNS stall).

---

## 2. Laws (SODP-1…11)

| ID | Law |
|----|-----|
| **SODP-1** | StudioOne is the sole runtime for data movement and data APIs. A second vp-api, chain_feed, vp-engine, or Massive caller on a UI host is drift. |
| **SODP-2** | UI hosts never call Massive. Next.js never calls Massive. |
| **SODP-3** | The browser never talks to StudioOne. Member cookie stays on the UI host. Hop uses computing-class headers only. |
| **SODP-4** | Product Labs (identity, courses, MySQL `labs`, SSO issuers) stays MiniTwo in production until Coach stamps **SODP-LABS**. |
| **SODP-5** | Futures chart history is **one provider**, Massive-first, keyed by Labs `bound_symbol` (e.g. ESZ2026) and translated to the vendor ticker Massive actually serves (ESZ6). Local prints are tail only. No conditional fill. |
| **SODP-6** | SHORT HISTORY is a **payload flag**. Every surface that draws those bars must render it. A route cannot skip a banner that ships in the payload. |
| **SODP-7** | **TS-1** applies: the struck `_aggs_price_fill` design is deleted (grep-proof), not repaired. Both AP-1 strikes are cited in the DL. **F3 and the migration are one motion:** the Massive-first provider is **born and proven on StudioOne**. The old StudioTwo OHLC server is deleted **whole** (process, plist, fill branch, in-process `ohlc_for_source` Massive path). A packet that copies the fill to StudioOne and then replaces it is **FAIL**. |
| **SODP-8** | **CP-1 arithmetic**, not citation only. Every landing states its budget (Massive connections especially). The plan states the **combined** footprint vs chain_feed headroom. |
| **SODP-9** | REQ-001 / 002 / 003 stay OPEN until Coach AP-1. No report writes "done" before his line. |
| **SODP-10** | After **TOPO-1 AP-1**, two later programs in order: **REFACTOR** then **HARDEN** (REQ-004 · REQ-005). Not mid-build. Doctrine §13. |
| **SODP-11** | **SODP-MB hold.** SODP5 does **not** retire StudioTwo `chain_feed` / `sym_feed`, and SODP4 does not strip MiniTwo feeds, until a named **SODP-MB** GO hops Arch 28 member routes (`/api/me/market/*`, WS) — **or** those consumers are on the §11 census and hopped first. Do not delete the bus writer before the consumer is hopped (India R1). |

---

## 3. As-built (honesty — 2026-09-19)

This is the system **today**. The program exists because it is **not** SODP-1.

| Path | Where it runs today | Target |
|------|---------------------|--------|
| Next UI | StudioTwo `:3000` / MiniTwo prod | UI host (unchanged role) |
| Labs FastAPI | StudioTwo `:4000` / MiniTwo prod | UI host **thin hop** for data; product API stays MiniTwo |
| VP health / structure / range | StudioOne `:4010` via hop | stay |
| Symbology | StudioOne `:4011` via hop | stay |
| **OHLC candles** | **StudioTwo Labs in-process** `ohlc_for_source` | **StudioOne history provider** |
| StudioOne `/v1/ohlc` | print-store chunks only | replaced by Massive-first provider |
| Massive futures aggs | called from StudioTwo fill | StudioOne only |
| chain_feed / vp-engine / vp-api | **both** StudioOne **and** leftover StudioTwo | StudioOne only |
| Print store | StudioOne capture; 2TB path unmounted on StudioTwo | StudioOne disk |

**Proven defect (server, StudioTwo):** picker binds Labs identity `ESZ2026`. Massive `/futures/v1/aggs/ESZ2026` returns **empty**. `/futures/v1/aggs/ESZ6` returns 12,098 5m bars from **2025-09-10**. Fill swallows empty and serves print store from **2026-09-06**. That fill is TS-1 struck.

---

## 4. StudioOne process set (target)

| Process | Port / job | Notes |
|---------|------------|-------|
| `chain_feed` | existing | CP-1 sacred |
| `sym_feed` | existing | |
| `vp-api` | `:4010` | health, structure, range, **history/OHLC** |
| `symbology` | `:4011` | computing-class registry |
| `vp-engine` | existing | histograms |
| `vp-futures` capture | existing | prints = **tail only** for price |
| **history provider** | sibling **`:4012`** (Foxtrot SODP0: not on chain_feed / vp-api ports) | Massive-first cache; SODP-5 · F3 |
| Redis | local | `mb:*` bus · `vp:hot:*` · **not** chain_feed maxmemory change |

One Massive account. See **§12 CP-1 budgets**. History GETs after RTH or proven not to starve chain_feed.

---

## 5. History provider (TS-1 replacement)

For futures chart kinds (ES, MES, later NQ…):

1. Input: Labs `bound_symbol` (ESZ2026) + tf + requested window (default 90d).
2. Translate to vendor ticker (ESZ6) on the server. Never send ESZ2026 to Massive. Never hardcode ESZ6 in the client.
3. BASE series = Massive native per-contract aggs for the full window. Disk cache on StudioOne (completed days immutable; today refreshes).
4. Local capture supplies **only** bars newer than the last Massive bar.
5. Payload always includes: `bound_symbol`, `vendor_ticker`, `price_source=massive_futures_aggs`, `history_span_days`, `requested_window_days`, `short_history` bool, `named_state=SHORT HISTORY` when short.
6. Empty Massive result is a **named failure**, not a silent print fallback.

**VPS Q1:** when per-contract prints reach 90-day local depth, flipping capture to primary is a **new DL** — not a silent revert. Chart aggs do **not** grant model ACTIVE.

**Hotel honors (SODP2, not optional):** no root-default hardcoded `ESZ6`/`MESZ6` — default bound is strip `front` then vendor-translate. MES empty is not filled from ES. Print tail is the **same** `bound_symbol` only. Massive empty is a named failure, **not** SHORT HISTORY (SHORT HISTORY is a short **successful** serve). No silent D6.5 back-adjust.

**Delete (StudioTwo, whole server — not a flag):** `_aggs_price_fill`, the `if requested or span_days < 90` wiring, in-process `ohlc_for_source` as a Massive/print BASE, leftover StudioTwo `vp-api` / `chain-feed` / `vp-engine` if they exist only as a second plane. Grep-proof. **Do not rsync the fill onto StudioOne.**

**One motion:** StudioOne history provider proven (June on `ESZ2026` / MES equivalent, computing-class) **before** any consumer is re-pointed. Re-point, then delete the old server. Never: move fill, then F3.

---

## 6. Hop contract (UI host → StudioOne)

Member routes on Labs (UI host `:4000`):

| Member route | Upstream |
|--------------|----------|
| `/api/app/vp/v1/health` | StudioOne `:4010/v1/health` |
| `/api/app/vp/v1/structure/*` | StudioOne `:4010` (already) |
| `/api/app/vp/v1/range/*` | StudioOne `:4010` (already) |
| `/api/app/vp/v1/ohlc/{source}` | StudioOne history (this program) |
| `/api/app/vp/v1/contracts/{source}` | StudioOne |
| `/api/app/vp/v1/stream` | StudioOne stream |
| `/api/symbology/v1/*` | StudioOne `:4011` (already) |

**Hop (SODP-3).** Labs `:4000` on the UI host: `require_session` on the inbound member `ft_session`. Then mint a **new** computing JWT: `auth.issue_session(identity_id=0, issuer="internal", role="administrator")`. Send it to StudioOne as an HTTP **request** header `Cookie: {LABS session cookie name}={token}`. Never copy the inbound member cookie. Never `Set-Cookie` the computing JWT on the member response. Never put computing-class, LAN IPs, or StudioOne URLs in the browser or in Next rewrites.

**Sidecar.** StudioOne `:4010` / `:4011` / history `:4012` verify that JWT with the **same** `LABS_SESSION_SECRET` the UI-host hop used. Sidecar `LABS_ENV=dev` in this program (as-built VP/symbology). Unauthenticated 401; member-class JWT 403 `computing_consumers_only`; computing JWT 200. Fail loud if `LABS_SA_DEV_VP_API_BASE` / `LABS_SYMBOLOGY_API_BASE` / history base unset. History/OHLC/contracts/stream reuse this hop — no second secret, no second token class.

**Negative cases (SODP3 evidence):** member cookie forwarded → 403; no cookie → 401; computing JWT → 200; member hop response has no computing `Set-Cookie`.

---

## 7. UI hosts

| Host | Job | Site URL | SSO callback | Hop pin |
|------|-----|----------|--------------|---------|
| StudioTwo | Dev UI | `http://studiotwo:3000` | `NEXT_PUBLIC_SITE_URL` **and** `LABS_SSO_LOGIN_URL_*` `redirect=` encode **this** origin. Host-only `ft_session`. | LAN `192.168.1.111` `:4010`/`:4011`/`:4012` |
| MacBook | Remote UI | **named at SODP6** — not invented here | That name is the callback. Not `studiotwo`, not `localhost`, not `labs.fattail.ai`. | LAN pin if on LAN; else Tailscale `100.74.220.38` |
| MiniTwo | Production UI | `https://labs.fattail.ai` | `LABS_COOKIE_DOMAIN=.fattail.ai`, `LABS_ENV=production` on **product** Labs. **SODP4 named.** Does **not** inherit StudioTwo's callback or put MiniTwo's session secret on the sidecar in this program. | Tailscale `100.74.220.38` `:4010`/`:4011`/`:4012` |

**SSO per UI host.** Browser origin, `NEXT_PUBLIC_SITE_URL`, and `LABS_SSO_LOGIN_URL_*` `redirect=` are the **same** host. Mismatch (including `localhost` while the member is on `studiotwo` or a named MacBook host) is a 401 identity miss — page may load; `/api/auth/me` does not. Next never rewrites `/api/*` to StudioOne. Computing-class never in the browser.

Next never imports Massive. Chart reads hop payload only. Banner: if `short_history === true`, render SHORT HISTORY. Cannot skip.

---

## 8. Out of this program

LIM, QFRIC, XS, PPL, Help Watch. IKI. Moving MySQL `labs` / SSO issuers onto StudioOne (**SODP-LABS**). Answering D6/D7/D8. Granting ES/MES **model** ACTIVE (VPS Q1). MiniTwo capture. Repair #3 of `_aggs_price_fill`. **Copying the fill onto StudioOne.** Production cutover without a named SODP4 GO.

---

## 9. Acceptance

**PP-1:** curl from a UI host through the hop: `contract=ESZ2026` (and MES equivalent) → first bar in June 2026, `price_source=massive_futures_aggs`, `short_history` present. Grep-proof fill gone. StudioTwo `lsof :4010` empty after retire. chain_feed AFTER undegraded.

**AP-1 (Coach):** StudioTwo, his browser, his pan: June 2026 on **ES and MES**. Banner if short. REQ-001 closes only on his VP cross-check after the range is real.

---

## 10. Hardening round (after the move · SODP-H)

**When:** Coach 2026-09-19 queue: **TOPO-1 AP-1 → REFACTOR (REQ-004) → HARDEN (REQ-005)**. The old combined SODP-H packet is **split**. No refactor packet before TOPO-1 closes; no hardening packet before the refactor sweep closes. Board rows now; execution when that board is clear.

**Coach (verbatim):** refactoring and hardening audit; architecture sound and bulletproof; consolidated unit tests; no dangling code; clean and purpose-built; Data Services and APIs on StudioOne; remote services consuming the APIs.

| Work | Seat | Proof |
|------|------|--------|
| Inventory of leftover Massive / OHLC / fill / second vp-api / dead hops | Kilo | grep + lsof artifact |
| Delete dangling paths (not disable, not flag) | Alpha + Charlie | grep-proof close-out, FIXTURE standard |
| Consolidate unit tests for StudioOne data services (history, VP, symbology, ticker translation) | Kilo | one suite, green, 0 warnings |
| UI hosts test **consumption** only (hop + banner). No Massive in `web/` tests | Charlie + Kilo | grep Massive in `web/` = 0 |
| Architecture still SODP-1…10 after deletes | India | MATCH |
| Touched member surface | Echo | re-gate vs references |
| CP-1 AFTER still undegraded | Foxtrot + Delta | chain_feed pid + last line |

Simplify law (Audit spec v1.1 §2) binds: accepted interface and performance may not regress. A round that changes what Coach accepted at AP-1 fails.

---

## 11. Consumer census (re-point with proof)

Every consumer of every **moved** service is enumerated, re-pointed, and attested. SYM-SWAP lesson: the seam where a route changes is where branches get orphaned.

| Service (StudioOne) | Consumer today | Re-point to | Attest |
|---------------------|----------------|-------------|--------|
| History / OHLC | `SaPriceChart` `GET /api/app/vp/v1/ohlc/{source}` | Labs hop → StudioOne history (not in-process fill) | curl through hop: `ESZ2026` first bar June; `price_source=massive_futures_aggs` |
| History / OHLC | `vp_display.get_source_ohlc` in-process `ohlc_for_source` | **delete** in-process BASE; hop only | grep `ohlc_for_source` no Massive fill |
| History / OHLC | StudioOne `vp_api` `/v1/ohlc` print-chunks | **replace** with Massive-first provider (do not keep print BASE in parallel) | computing GET June |
| Contracts | `VolumeProfileSaSurface` `/contracts/{source}` | StudioOne | decade vs long-form: Labs identity on wire |
| Stream | `SaPriceChart` `/stream` | StudioOne | live tail only |
| VP structure/range/health | already hopped | stay; attest still StudioOne | `vp_api_base` pin |
| Symbology | already hopped | stay; attest still `:4011` | `ES1!` bind ESZ2026 |
| `fetchGen` localStorage | short print series | bust / refuse if `short_history` or span < window | no Sep-6 cache win |
| Admin `/admin/sa-dev` | same Labs OHLC | same hop | one path |
| Tests | TestClient in-process | in-process mock **or** live StudioOne pin | no silent fill |
| Market Bus `/api/me/market/*` + WS | Labs Redis + **StudioTwo** `chain_feed` (live) | **SODP-MB** (named) — not SODP5 | India R1: do not bootout this writer first |

Kilo’s SODP1 artifact is this table filled with **file:line**. SODP3 does not close until every row has a command + output.

Three UI hosts are consumers of the **same** hop contract (StudioTwo, MacBook, MiniTwo). See §14.

---

## 12. CP-1 budgets (arithmetic)

Citation of CP-1 without numbers is not a GO. All Massive talk on StudioOne shares **one** account with `chain_feed`.

| Writer | Standing Massive | Burst | Disk / CPU vs chain_feed | Port |
|--------|------------------|-------|--------------------------|------|
| `chain_feed` | 1 REST loop `--interval 2` (idle when no interest keys) | per hot exp | **sacred** — do not add interval | existing |
| `sym_feed` | REST marks `--interval 5` | — | existing | existing |
| `vp-futures` capture | session trades | — | existing | existing |
| **History provider (F3)** | **0 standing** | 1 paginated GET / (vendor ticker, tf) on **cache miss**; today-refresh 1 GET | disk under on-box store; idle FastAPI | `:4010` route or `:4012` |
| **Recognition cache** (Coach-named) | SODP1 must **name the process** | if it polls Massive, count it here | must not be a second undocumented writer | SODP1 |
| leftover StudioTwo Massive | **must go to 0** | — | — | StudioTwo `:4010` retired |

**Combined vs chain_feed headroom (draft, Foxtrot measures at SODP1):**

- History is **on-demand + immutable day cache**. First ES+MES miss = **2** REST bursts, not a new interval. Saturday probe: chain_feed pid 538 at 0.3% CPU idle. Two historical GETs (ESZ6 ~5 pages) must run **post-close** or HOLD.
- If SODP1 finds the recognition cache is a **standing** Massive poll, add its interval to this table **before** SODP2 GO. Combined standing connections = chain_feed + sym_feed + capture + (recognition if standing). History remains burst-only. If Foxtrot cannot show headroom, SODP2 is HOLD until after 16:00 ET **and** the standing set is unchanged.
- No `CONFIG SET` of Redis maxmemory. No chain-feed plist edit. Rollback = bootout history agent only.

---

## 13. Deletion proofs (no ghost server)

After re-point, the old instance is gone. A ghost StudioTwo OHLC/vp-api that still answers **masks** a misconfigured hop.

For each retired unit (`_aggs_price_fill`, in-process OHLC BASE, StudioTwo `ai.fattail.labs.vp-api`, `chain-feed`, `vp-engine` if they are the leftover plane):

| Proof | Command |
|-------|---------|
| Process gone | `lsof -nP -iTCP:4010` empty on StudioTwo; `launchctl list` no leftover label |
| Plist gone | `ls ~/Library/LaunchAgents/ai.fattail.labs.vp-api.plist` (and chain-feed/engine) → absent **or** in `install/retired/` and not loaded |
| Grep clean | no `_aggs_price_fill`; no `if requested or span_days <`; no Massive in `ohlc_for_source`; FIXTURE standard |

Delta **FAIL** if any proof is missing. The fill disappears at SODP5/SODP2 close-out, not in a later round. **SODP-MB:** leftover StudioTwo `chain_feed` / `sym_feed` are **not** in this deletion set until SODP-MB.

---

## 14. Three consumers (MiniTwo designed now)

Production is a consumer. Topology is designed for **three** hops, not discovered at deploy.

| Consumer | Pin | When live |
|----------|-----|-----------|
| StudioTwo (dev) | `http://192.168.1.111:4010` · `:4011` | SODP3 |
| MacBook (remote UI) | LAN pin if on LAN; else Tailscale `http://100.74.220.38:4010` · `:4011` | SODP6 when Coach names the host |
| MiniTwo (prod) | `http://100.74.220.38:4010` · `:4011` · history **`:4012`** (Tailscale; never `.local`) | **SODP4 is its own named GO** — this row is the sketch. Pins fail loud if unset. Tailscale down → named 503, not a local fill. |

MiniTwo does **not** run capture, vp-api, or Massive. It runs Next + product Labs + the same thin hop as StudioTwo. Cutover packet is later; the **pins and fail-loud** are specified now.

---

## 15. Change table

| Ver | Date | Change |
|-----|------|--------|
| 0.1 | 2026-09-19 | First draft from Coach clean-separation intent + TS-1 F3 |
| 0.1.1 | 2026-09-19 | SODP-10 + §10 hardening round (Coach: tests, no dangle, purpose-built) |
| 0.1.2 | 2026-09-19 | RETURNED: F3=migration; CP-1 arithmetic; consumer census + deletion proofs; MiniTwo as designed consumer |
| 0.1.3 | 2026-09-19 | Mike: hop token `issuer=internal`; Cookie request header only, never Set-Cookie; shared secret; sidecar `LABS_ENV=dev`; SSO callback per UI host |
| 0.1.4 | 2026-09-19 | India R1: **SODP-MB hold**. TOPO-1 name. SODP-10 = REFACTOR then HARDEN after AP-1 (REQ-004/005) |
