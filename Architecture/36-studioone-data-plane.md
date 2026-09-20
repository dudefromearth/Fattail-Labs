# 36 — StudioOne data plane & remote UI

**Status:** As-built honesty + **target** (SODP spec v0.1 DRAFT). Not the running system until SODP gates pass.  
**Spec:** `Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md`  
**Design:** [36-studioone-data-plane-design.md](./36-studioone-data-plane-design.md)  
**Plan:** `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`  
**Board:** `agents/p-studioone-data-plane/`

This document describes **the entire market/data system**: who owns Massive, who owns capture, who owns member hops, who owns the browser. Product Labs (courses, identity) is named so it is not confused with this plane.

---

## 1. The system in one picture (target)

```text
  MacBook UI          StudioTwo UI           MiniTwo UI (prod)
  Next :3000          Next :3000             Next (built)
       │                   │                      │
       └───────── ft_session ─────────────────────┘
                         │
                         ▼
              Labs hop :4000  (UI host)
              member cookie stays here
                         │
          computing-class, IP pin
                         │
         ┌───────────────┴────────────────┐
         ▼                                ▼
   StudioOne :4010                  StudioOne :4011
   vp-api + history                 symbology
         │
         ├─ Redis mb:* / vp:hot:*
         ├─ chain_feed / sym_feed     ── Massive (sole writers)
         ├─ vp-engine
         └─ vp-futures prints         ── tail only for price
```

**Coach (2026-09-19):** serverside functionality including all data movement and API run from StudioOne; UI is remote (StudioTwo / MacBook / MiniTwo).

---

## 2. As-built (2026-09-19) — not the target

```text
  Browser ──► StudioTwo Next :3000
                 │
                 ▼
              Labs :4000
                 │
     ┌───────────┼────────────┐
     │ hop       │ IN PROCESS │ leftover local
     ▼           ▼            ▼
  StudioOne   ohlc_for_source  StudioTwo :4010 vp-api
  :4010 VP    + Massive fill   chain-feed, vp-engine
  :4011 SYM   (ESZ2026 empty
               → Sep 6 prints)
```

| Fact | Evidence |
|------|----------|
| VP structure/range/health hop to StudioOne | `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010` · `vp_display` + `vp_client` |
| Symbology hop to StudioOne | `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011` · **DL-773** |
| **OHLC does not hop** | `vp_display.get_source_ohlc` → `sa_dev.service.ohlc_for_source` in Labs |
| Massive `ESZ6` has history from 2025-09-10 | live `fetch_futures_aggs` n=12098 |
| Massive `ESZ2026` empty | live n=0 |
| Picker binds `ESZ2026` | SYM-SWAP / F1 · Labs identity |
| Print store wall 2026-09-06 | `ohlc_for_source(contract=ESZ2026)` span 11.52d `vp_prints` |
| StudioTwo still runs a data plane | launchd `vp-api` :4010, `chain-feed`, `vp-engine` |

Arch **01** still says MiniTwo is the sole Labs **product** host. That remains true for identity/courses. Arch **28** Market Bus feeds are supposed to be the sole Massive writers; the OHLC fill on Labs is a second Massive caller (the struck design).

---

## 3. Machine catalog

| Machine | As-built job | Target job |
|---------|--------------|------------|
| **StudioOne** | D1 capture + VP API + symbology + chain_feed | **Sole data plane.** All Massive. All history. All VP/symbology APIs. |
| **StudioTwo** | Full-stack dev (Next + Labs + leftover vp-api) | **Dev UI only** + thin Labs hop. No Massive. No vp-api. |
| **MacBook** | not a named UI host | Same as StudioTwo: Next + hop. |
| **MiniTwo** | Production Labs (Next + FastAPI + MySQL) | Production **UI** + product Labs API; data via Tailscale to StudioOne. No capture. |
| MiniThree | nginx / TLS | unchanged |
| DudeTwo | staging | not this program |

---

## 4. Data movement (target)

### 4.1 Inbound (Massive → StudioOne only)

| Writer | Topic | Law |
|--------|-------|-----|
| `chain_feed` | option chains → Redis `mb:*` | Arch 28 · **CP-1** |
| `sym_feed` | underliers | Arch 28 |
| history provider | per-contract futures **aggs** → disk cache | SODP-5 · TS-1 |
| `vp-futures` | prints for VP histograms + **price tail** | VPS spec; not the 90-day BASE |

### 4.2 Serving (StudioOne → hop → UI)

| API | Port | Consumers |
|-----|------|-----------|
| VP Contract v1.1 (`/v1/health`, profile, range) | 4010 | Labs hop `/api/app/vp/v1/*` |
| History / OHLC | 4010 (or 4012) | Labs hop `/ohlc` |
| Symbology v1 | 4011 | Labs hop `/api/symbology/v1/*` |
| Stream | 4010 | Labs hop `/stream` |

### 4.3 What never moves onto StudioOne in this program

MySQL `labs`, SSO secrets as the member issuer, course blobs, HeyGen, admin Kanban. Those are product Labs (**SODP-4**). A later **SODP-LABS** GO would be Mike + Foxtrot + CP-1 pessimism (Labs API load next to chain_feed).

---

## 5. History cache (StudioOne disk)

Completed session days are immutable files under the on-box store (not an unmounted 2TB path). Key: vendor ticker + resolution + session date. Request path: fill missing days from Massive, then overlay print tail. Fail loud if the cache root is missing.

Labs identity (`ESZ2026`) is stored on the payload. Vendor ticker (`ESZ6`) is a server translation, never a client hardcode (`FGHJKMNQUVXZ` still forbidden in `web/lib/symbology`).

---

## 6. Isolation vs other trees

Does not touch LIM, QFRIC, XS, PPL, Help Watch, IKI. Does not answer D6/D7/D8. Does not grant ES/MES model ACTIVE (VPS Q1). Market Bus **law** (one Massive writer class) is restored by killing the Labs fill caller.

---

## 7. Hardening (after the move)

Not a second product. Doctrine §13 round: after SODP5 + AP-1, **SODP-H** makes the plane purpose-built.

- Data Services and APIs live only on StudioOne.  
- Remote hosts (StudioTwo, MacBook, MiniTwo) **consume APIs** — they do not assemble series, call Massive, or keep a leftover vp-api.  
- Consolidated unit tests for the StudioOne services. UI tests are hop-consumers.  
- Dangling code is **deleted** (grep-proof), same standard as FIXTURE / TS-1.  
- Audit spec v1.1 Simplify: accepted interface and performance do not regress.

---

## 8. Related

- Arch **01** system overview (product Labs)  
- Arch **28** Market Bus  
- Arch **35** VP widget (OHLC URL stays `/api/app/vp/v1/ohlc` — hop behind it)  
- Spec VPS v0.5 · Symbology v0.2.1  
- Doctrine §17 TS-1 · §13 rounds · CP-1 DL-707  
- Audit & Hardening Round Spec v1.1  
