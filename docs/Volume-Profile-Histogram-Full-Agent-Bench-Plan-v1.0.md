# Volume Profile Histogram + Market Data Dual Store — Full Agent Bench Plan

**Filename (stable):** `docs/Volume-Profile-Histogram-Full-Agent-Bench-Plan-v1.0.md`  
**Plan revision (authority):** **v1.1.1** — aligned to Spec **v0.4** Big Kahuna + bookkeeping GO polish  
**Date:** 2026-08-12  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-volume-profile-histogram/`](../agents/p-volume-profile-histogram/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

**Version convention:** Filename stays `…-v1.0.md` for stable Spec/Plan links. **Plan revision** field is the sole content version (currently **v1.1.1**). Do not treat the filename suffix as the revision.

**Primary law:**

| Doc | Path |
|-----|------|
| **VP Histogram Spec v0.4** | [`Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md`](../Specs/FatTail-Labs-Volume-Profile-Histogram-Spec-v0_4.md) |

**v0.4 posture:** Full-estate collection (trades + quotes + 1s, all eligible symbols, full depth). Pilot ladder **retired**. Gate for **production bins** = geometry freeze (§5 / P2-3), not acquisition. Multi-mount fleet (VP17). Capacity = telemetry (VP18). VIX/VIX1D quarantined.

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| Massive Market Bus Spec | Live priority; VP15 |
| Options Chain Picker / universe | Symbol SoR |
| Strategy Lab Specs | Raw consumer (trades, quotes, 1s) |
| Human Interface Spec | Chart chrome only when unblocked |

Specialists execute **only** via seeds. Coordination through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

**TV research:** Out of critical path (Spec §12).

---

## 0. Mission

```text
Massive (entitled)
  → RAW multi-mount (trades + quotes + 1s, full depth)
  → BIN tool (vp_bins_v3 measurement)  [GATE: §5 freeze]
  → BINNED shards + composite
  → Consumers: Strategy Lab (raw) · VP chart/agents (binned)
```

| Pillar | Meaning |
|--------|---------|
| **VP21 Big Kahuna** | All kinds, all eligible symbols, full depth |
| Dual SoR | Raw never deleted by binning |
| Trades-first bins | Quotes/1s never bin source while trades exist |
| Multi-mount | `LABS_MARKET_DATA_MOUNTS` fail loud per mount |
| Telemetry not budget | VP18 |
| VIX quarantine | No VIXY VP |
| SPY trades as-built | Campaign completes quotes/1s + other symbols |

---

## 1. As-built baseline

| Component | Status |
|-----------|--------|
| SPY raw **trades** full history | **Coach as-built complete** — evidence pack at GO (path, GB, counts) |
| SPY quotes / 1s | Campaign remaining |
| Other 15 native symbols | Campaign |
| SPX/XSP | Via SPY raw + §5.5 (no separate tape) |
| VIX/VIX1D | **Out** (quarantine) |
| Measured bins / API | Not built — **gate is P2-3 + GO** |
| Interim OHLC chart | Label until cutover |

---

## 2. Workstreams

### W0 — Coach GO + law freeze

| Seed | Agent | Deliverable | Gate |
|------|-------|-------------|------|
| W0-0 | Coach | Accept Spec v0.4 + Plan revision **v1.1.1**; confirm OD-VP6/7 | W0-0 GO |
| W0-1 | Lima | Spec/plan sha1 + DL; **as-built SPY evidence** filed | W0-1 |
| W0-2 | India | Parents / no MSC / VP21 scope | W0-2 |
| W0-G | Delta | Spec+Plan consistency | **W0-G** |

**Campaign continuity (Spec §16):** Work already in flight under Coach authority for the full-estate **RAW campaign** does **not** halt pending W0 paperwork (sha1, board seeds, formal GO text). Agents must not stop a running pull to wait for Lima hash. W0 still required for **production bin writes** (C) and for formal program gates; it is not a stop-work on collection already authorized by Spec §16.

---

### P2 — Remaining probes (measurement + campaign hygiene)

| Seed | Agent | Probe | Status |
|------|-------|-------|--------|
| P2-E | Lima/Alpha | Retire P2-1/2/5: write as-built SPY trades evidence | required |
| **P2-3** | Alpha | **Condition filter + AT-R2 tolerance** — **THE GATE** | **OPEN** |
| P2-4m | Foxtrot | Mount map smoke **per mount** as each joins | open |
| P2-6 | Alpha | Index 403 reconfirm | open |
| **P2-7** | Foxtrot/Alpha | Rate limits under **symbols × kinds** (quotes density) | **OPEN** |
| **P2-8** | Alpha | SPY quotes/1s depth spot-check | **OPEN** |
| P2-G | Delta | P2-3 frozen list + remaining transcripts | **P2-G** |

**Exit for production bins:** P2-3 frozen condition list + tolerance in `algo_version` changelog + Coach GO (W0).

**Exit for campaign continuation:** VP15 + mount map when writing new partitions; may run **in parallel** with P2-3 under Spec §16 Coach authority. Formal W0 is not a stop-work on an in-flight campaign (see W0 note above).

---

### A — Multi-mount + catalog

| Seed | Agent | Work |
|------|-------|------|
| A-1 | Foxtrot | `LABS_MARKET_DATA_MOUNTS` config; `market_storage_mount` |
| A-2 | Alpha | Migrations: raw series, VP tables, mount assignments |
| A-3 | Alpha | Parquet schemas: trades, quotes, aggs_1s |
| A-G | Delta | Fail loud per missing mount | **A-G** |

---

### B — RAW full-estate campaign

| Seed | Agent | Work |
|------|-------|------|
| B-1 | Alpha | Trades/quotes/1s clients: paginate, resume, flat-file prefer |
| B-2 | Alpha | SPY **quotes + 1s** full depth (trades as-built) |
| B-3 | Alpha | QQQ, IWM + liquid ETFs — all kinds |
| B-4 | Alpha | Remaining equities — all kinds |
| B-5 | Alpha | SPX/XSP = SPY pointer + labels only (no triple store) |
| B-G | Delta | Watermarks; bytes per kind; no VIX path | **B-G** |

Order is convenience; VP15 is the only sequencing constraint with live room.

---

### C — BIN tool (measurement) — **blocked until P2-3**

| Seed | Agent | Work |
|------|-------|------|
| C-0 | Coach | Freeze condition list + tolerance from P2-3 | hard gate |
| C-1 | Alpha | `vp_bins_v3` geometry + golden tests |
| C-2 | Alpha | Day bin from trades → binned store + catalog, **incl. §5.5 `proxy_of` / `price_space` / mapping fields** on shard + composite payload |
| C-3 | Alpha | 5y composite; max_n_bins + actual n_bins evidence |
| C-4 | Kilo | AT-R1…R11 (incl. VIX quarantine error) |
| C-G | Delta | First production measured artifact | **C-G** |

**Out:** TV microbin.

---

### D — APIs + Strategy Lab raw read

| Seed | Agent | Work |
|------|-------|------|
| D-1 | Alpha | `GET /api/me/market/volume-profile` (+ algo_version, from, to) |
| D-2 | Alpha | Admin raw status, storage mounts, rebuild |
| D-3 | Alpha | Strategy Lab raw day contract (trades + quotes + 1s) |
| D-4 | Mike | Authz |
| D-G | Delta | curl evidence | **D-G** |

---

### E — Chart honesty + cutover (staged)

| Seed | Agent | Work |
|------|-------|------|
| E-1 | Charlie + Echo | Label interim OHLC bins non-measurement |
| E-2 | Charlie | Measured overlay when ready |
| E-3 | Tango | Proxy + regime honesty |
| E-G | Delta | No silent fake tick VP | **E-G** |

---

### F — Daily maintain + ops

| Seed | Agent | Work |
|------|-------|------|
| F-1 | Foxtrot | launchd/cron for daily all-kinds append |
| F-2 | Alpha | Daily raw (all kinds) + bin + watermark |
| F-G | Delta | One session E2E | **F-G** |

---

### R — TV research (optional, non-blocking)

Unchanged — memo only.

---

### Z — Program close

| Seed | Agent | Work |
|------|-------|------|
| Z-1 | Lima | As-built honesty; DL |
| Z-G | Delta | Mission criteria | **Z-G** |

---

## 3. Mission exit criteria

| # | Criterion |
|---|-----------|
| M1 | Mount map fail-loud; catalog live |
| M2 | SPY trades as-built evidenced; SPY quotes+1s complete **or** residual gaps = **recorded entitlement refusals (VP21)** or **explicit Coach DL** — never a quietly abandoned kind |
| M3 | Full-estate campaign complete for all §7.1 symbols **or** residual symbols/kinds = **recorded 403s per VP21** or **explicit Coach DL for residual** — never silent omit |
| M4 | SPY measured composite after P2-3 freeze; method honest |
| M5 | Member GET VP + admin status/mounts |
| M6 | Strategy Lab reads trades/quotes/1s day partitions |
| M7 | No MSC; no TV default; no VIX via VIXY |
| M8 | Evidence under `docs/evidence/volume-profile/` |

---

## 4. Agent seating

Juliet · India · Alpha · Foxtrot · Mike · Charlie · Echo · Tango · Hotel (R only) · Kilo · Delta · Lima · Coach.

---

## 5. Explicit non-goals

- MSC code port  
- TV as production measurement  
- VIX/VIX1D VP  
- ES tape without futures entitlement  
- 50 GB/symbol rationing (retired)  
- Pilot ladder (retired)

---

## 6. Fire order

```text
W0 ──► A ──┬──► B (full-estate campaign)
           │         // parallel with remaining P2
           └──► P2 (remaining) ──► P2-3 FREEZE ──► C ──► D ──► E ──► F ──► Z
                                                      R optional
```

**Critical path for bins:** W0 → P2-3 → C (geometry freeze before production bin write).  
**Critical path for estate:** W0 → **A** → B (mount map + schemas before partition writes). B must not start on a cold host without A.  
**In-flight exception:** Campaign already running under Spec §16 continues; new partition writes still require A-complete mount map for any **new** mount assignment.

---

## 7. Open Coach ODs (from Spec §14)

| OD | Topic | Default |
|----|--------|---------|
| OD-VP3 | Chart cutover | After first measured symbols |
| OD-VP4 | TV research | Deferred |
| OD-VP5 | Job host | Workstation + mounts now |
| OD-VP6 | Raw retention past 5y bin window | Keep forever |
| OD-VP7 | Proxy price_space default | `series` + labels |

OD-VP1/2 **closed** (quotes + 1s in full).

---

## 8. Revision

| Plan rev | Date | Notes |
|----------|------|-------|
| v1.0 | 2026-08-12 | Initial plan (Spec v0.3 dual-store) |
| v1.0.1 | 2026-08-12 | Align to Spec **v0.3** file content after intermediate review fold (v0.3.1 labeling lived on Spec file header; Spec history row appears in Spec **v0.4** §15) |
| v1.1 | 2026-08-12 | Spec **v0.4** Big Kahuna — full estate; measurement gate; multi-mount |
| **v1.1.1** | **2026-08-12** | Bookkeeping: stable filename + rev field; fire diagram includes **A**; M2/M3 ↔ VP21; C-2 §5.5 explicit; campaign continuity vs W0 |
