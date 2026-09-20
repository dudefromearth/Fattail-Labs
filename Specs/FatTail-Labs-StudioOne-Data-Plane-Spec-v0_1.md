# FatTail Labs — StudioOne Data Plane & Remote UI

**Spec v0.1**  
**Status:** DRAFT — review object. **NOT BUILD AUTHORITY.**  
**Date:** 2026-09-19  
**Program:** SODP  
**Author:** Juliet (from Coach intent)  
**Authority:** Coach (stamp / GO / AP-1)

Coach wording (RL-1, 2026-09-19):

> I want a clean separation with serverside functionality including all data movement and api run from StudioOne, and then the UI is remote, where dev is studioTwo or my Macbook or production on MiniTwo.

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

## 2. Laws (SODP-1…9)

| ID | Law |
|----|-----|
| **SODP-1** | StudioOne is the sole runtime for data movement and data APIs. A second vp-api, chain_feed, vp-engine, or Massive caller on a UI host is drift. |
| **SODP-2** | UI hosts never call Massive. Next.js never calls Massive. |
| **SODP-3** | The browser never talks to StudioOne. Member cookie stays on the UI host. Hop uses computing-class headers only. |
| **SODP-4** | Product Labs (identity, courses, MySQL `labs`, SSO issuers) stays MiniTwo in production until Coach stamps **SODP-LABS**. |
| **SODP-5** | Futures chart history is **one provider**, Massive-first, keyed by Labs `bound_symbol` (e.g. ESZ2026) and translated to the vendor ticker Massive actually serves (ESZ6). Local prints are tail only. No conditional fill. |
| **SODP-6** | SHORT HISTORY is a **payload flag**. Every surface that draws those bars must render it. A route cannot skip a banner that ships in the payload. |
| **SODP-7** | **TS-1** applies: the struck `_aggs_price_fill` design is deleted (grep-proof), not repaired. Both AP-1 strikes are cited in the DL. |
| **SODP-8** | **CP-1** on every StudioOne packet (verbatim in the GO). |
| **SODP-9** | REQ-001 / 002 / 003 stay OPEN until Coach AP-1. No report writes "done" before his line. |

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
| **history provider** | part of vp-api **or** sibling `:4012` | Massive-first cache; SODP-5 |
| Redis | local | `mb:*` bus · `vp:hot:*` · **not** chain_feed maxmemory change |

One Massive account. History GETs after RTH or proven not to starve chain_feed (CP-1).

---

## 5. History provider (TS-1 replacement)

For futures chart kinds (ES, MES, later NQ…):

1. Input: Labs `bound_symbol` (ESZ2026) + tf + requested window (default 90d).
2. Translate to vendor ticker (ESZ6) on the server. Never send ESZ2026 to Massive. Never hardcode ESZ6 in the client.
3. BASE series = Massive native per-contract aggs for the full window. Disk cache on StudioOne (completed days immutable; today refreshes).
4. Local capture supplies **only** bars newer than the last Massive bar.
5. Payload always includes: `bound_symbol`, `vendor_ticker`, `price_source=massive_futures_aggs`, `history_span_days`, `requested_window_days`, `short_history` bool, `named_state=SHORT HISTORY` when short.
6. Empty Massive result is a **named failure**, not a silent print fallback.

**VPS Q1:** when per-contract prints reach 90-day local depth, flipping capture to primary is a **new DL** — not a silent revert.

**Delete:** `_aggs_price_fill` and its `if requested or span_days < 90` wiring. Grep-proof in close-out, same standard as FIXTURE.

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

Hop: `require_session` locally → `auth.issue_session(identity_id=0, role=administrator)` Cookie to StudioOne. Never forward `ft_session`. Fail loud if `LABS_SA_DEV_VP_API_BASE` / `LABS_SYMBOLOGY_API_BASE` unset.

---

## 7. UI hosts

| Host | Job | SSO / site URL |
|------|-----|----------------|
| StudioTwo | Dev UI | `http://studiotwo:3000` |
| MacBook | Remote UI | named host when Coach wires it; same hop pin |
| MiniTwo | Production UI | `https://labs.fattail.ai` → Tailscale `http://100.74.220.38:4010` |

Next never imports Massive. Chart reads hop payload only. Banner: if `short_history === true`, render SHORT HISTORY. Cannot skip.

---

## 8. Out of this program

LIM, QFRIC, XS, PPL, Help Watch. IKI. Moving MySQL `labs` / SSO issuers onto StudioOne (**SODP-LABS**). Answering D6/D7/D8. Granting ES/MES **model** ACTIVE (VPS Q1). MiniTwo capture. Repair #3 of `_aggs_price_fill`.

---

## 9. Acceptance

**PP-1:** curl from a UI host through the hop: `contract=ESZ2026` (and MES equivalent) → first bar in June 2026, `price_source=massive_futures_aggs`, `short_history` present. Grep-proof fill gone. StudioTwo `lsof :4010` empty after retire. chain_feed AFTER undegraded.

**AP-1 (Coach):** StudioTwo, his browser, his pan: June 2026 on **ES and MES**. Banner if short. REQ-001 closes only on his VP cross-check after the range is real.

---

## 10. Change table

| Ver | Date | Change |
|-----|------|--------|
| 0.1 | 2026-09-19 | First draft from Coach clean-separation intent + TS-1 F3 |
