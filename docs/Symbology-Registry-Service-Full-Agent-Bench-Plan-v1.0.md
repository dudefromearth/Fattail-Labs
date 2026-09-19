# Symbology & Registry Service — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-19  
**Status:** **Execution board — SYM0 next.** Spec v0.2.1 is **DRAFT**; Coach ratified §0 seats 1–10 and directed this plan (**DL-771**). Service-build GO is **SYM0-G PASS**, not this file alone.  
**Author:** Grok Build (plan) · **Juliet** (execution)  
**Authority:** Coach (GO / ship / AP-1)  
**Canonical land path:** `docs/Symbology-Registry-Service-Full-Agent-Bench-Plan-v1.0.md`  
**Board:** [`agents/p-symbology-registry/`](../agents/p-symbology-registry/)  
**Token:** [`agents/go/SYM0-W0.md`](../agents/go/SYM0-W0.md)

**Parent spec:** [`Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0_2_1.md`](../Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0_2_1.md) · sha1 `c87580829301d9a44e678641023e32c07bca58d6` (229 lines · 13 `## ` headings · last `## 14 Change table`)  
**Review object (dot name, same sha1):** `Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0.2.1.md`  
**Baselines:** `Specs/Symbology-Registry-Service-Spec-v0_2.md` · `…-v0_1.md`

**Grok Build does not implement.** Juliet hands seeds. Auto-GO on clean gates. Stop + **GO / NO-GO** on a problem. No packet or report writes "done" before joint **AP-1** in Coach's browser.

---

## Standing law (not optional)

### CP-1 — Chain primacy (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

Registry writes on StudioOne are CP-1 (spec SYM-4).

### Other binds

| Law | Bind |
|-----|------|
| **RL-1** | REQ rows; open REQs in every report |
| **AP-1 / PP-1** | Coach browser / evidence artifacts |
| **SYM-SWAP** | REQ-003 cannot close on the fixture; CI fails `FIXTURE` in production bundles |
| **D6 / D7 / D8** | Stay open — no packet answers them silently |
| **VPS Q1** | ES/MES **model-kind** ACTIVE blocked |
| **PNG** | `artifacts/references/REQ-003-symbol-search-reference.png` not on `main` → **hold SYM3**; ask Coach; no substitute |

**Open REQs:** REQ-001 · REQ-002 · REQ-003.

---

## 0. Gate sequence

```text
SYM0-G   Advisor pass v0.2.1 (India) + sha1 MATCH
   │
   ├─► SYM1-G  Registry service + API on StudioOne (CP-1) + PP-1 initial rows
   ├─► SYM2-G  Tagged fixture §5 (StudioTwo file; hashed picker four)
   └─► SYM3-G  REQ-003 tile + dialog  ── HOLD until PNG on main
                    │
                    ▼
            SYM-SWAP-G  fixture deleted; live API; CI FIXTURE-clean
                    │
                    ▼
            SYM-AT-1…14  artifacts
                    │
                    ▼
            AP-1  Coach: tile → dialog → selection → chart  LIVE  StudioTwo
```

SYM1 and SYM2 may run in parallel after SYM0-G. SYM3 may run parallel with SYM1/SYM2 **only after** the PNG is on main. REQ-002 surface may run parallel (own board); it does not unblock SYM3.

---

## 1. Intake (this packet — filed)

| Item | Path |
|------|------|
| Frozen spec | `Specs/FatTail-Labs-Symbology-Registry-Service-Spec-v0_2_1.md` |
| sha1 | `c87580829301d9a44e678641023e32c07bca58d6` |
| REQ texts | `artifacts/reqs/REQ-001.md` · `REQ-002.md` · `REQ-003.md` |
| DL | **DL-771** — §0 seats 1–10 Coach-ratified; sha1; this plan |
| Advisor | SYM0-G — **not skipped** |

RL-1: each REQ row includes its filed path (spec §0.8).

---

## 2. Packets

### SYM0 — Advisor (India)

**Machine:** StudioTwo, read-only.  
**Seed:** `agents/p-symbology-registry/seeds/SYM0-india-advisor.md`  
**Gate SYM0-G:** pre-flight MATCH + review vs VPS VP-L3, OPF, CP-1, D6–D8 still open. PASS / FAIL / BLOCKED.

### SYM1 — Registry service + API (Alpha + Kilo)

**Machine:** StudioOne. **CP-1 mandatory.** Outside RTH if capture-adjacent (Massive, disk, launchd).  
**Scope:** spec §4 endpoints; SYM-1…13; initial rows with PP-1 artifacts (SPX, XSP options COMING unless chains artifact; ES, MES price-structure COMING for model, chart-ACTIVE only with per-contract native aggs artifact; SPY volume-source, not in picker).  
**Out:** answering D6/D7/D8; VPS Q1 prints; MiniTwo; `1!` as ingest key.  
**Gate SYM1-G:** contract tests for universe / resolve / telemetry / eligibility-report / roll-catalog; alias refuse; ambiguous `ESZ6` does not bind.

### SYM2 — Fixture (Alpha + Kilo)

**Machine:** StudioTwo (repo).  
**Scope:** §5 tagged fixture: `FIXTURE` tag; hashed four SPX, XSP, ES, MES all COMING; SPY absent; CI job fails production bundle containing `FIXTURE`.  
**Gate SYM2-G:** grep + a CI failing test that the tag is forbidden in prod.

### SYM3 — REQ-003 surface (Echo + Charlie)

**Machine:** StudioTwo. **HOLD** until `origin/main:artifacts/references/REQ-003-symbol-search-reference.png` exists.  
**Scope:** tile + dialog consuming the **contract** (fixture until SWAP). TV fidelity vs that PNG (measurement spec first). Class chips All / Futures / Stocks / Indices. Full universe at rest. ES family expand. Dialect. Gray law. App-aware roles (VP both; options apps options-only).  
**Out:** implementing continuous engine; answering D6–D8; MiniTwo.  
**Gate SYM3-G:** headed screenshots vs measurement spec; not AP-1.

### SYM-SWAP (Alpha + Charlie + Delta)

**Machines:** StudioOne (CP-1) + StudioTwo.  
Delete fixture; live API; CI still refuses leftover `FIXTURE`. REQ-003 **cannot** close here.

### SYM-AT (Kilo + Delta)

SYM-AT-1…14 per spec §6, each with an artifact. Caption/ghost ATs stay on the structural surface spec.

### AP-1 joint closure (Coach)

Tile → dialog → selection → chart against **LIVE** API. StudioTwo, his clicks. Artifacts (a)–(e) from the REQ-003 FINAL packet. Juliet reports **GO / NO-GO**. No "done" before this line.

---

## 3. Seats and machines

| Seat | Role in this program |
|------|----------------------|
| Coach | AP-1, D6–D8, PNG, expansion row picks, overrule |
| Juliet | Orchestration, seeds, board, stop/report |
| India | SYM0-G Advisor |
| Alpha | Registry API, fixture, StudioOne |
| Charlie | Surface consume, SWAP client |
| Echo | Dialog / tile fidelity |
| Kilo | Tests, AT artifacts, CI FIXTURE |
| Delta | Every gate PASS/FAIL/BLOCKED |
| Lima | DL same day |
| Foxtrot | StudioOne launchd only inside a CP-1 packet |
| Tango | Member copy (SYM-12) on gray strings |

**StudioTwo:** plan, Advisor, fixture file, surface, CI, Coach browser.  
**StudioOne:** registry process, strip writes, Massive-cached recognition refresh (SYM-13) — **CP-1**.  
**MiniTwo:** not this tree.

---

## 4. Isolation

Do not open: LIM, QFRIC, XS, PPL, Help Watch, IKI, Histogram spec v0.4, VPS Q1 prints, overlay Q1 participation.  
Do not amend VPS symbol-metadata from this tree (join is `metadata_ref` only).  
Do not add `127.0.0.1` to `allowedDevOrigins`.

---

## 5. First problem (this intake)

**NO-GO on SYM3.** REQ-003 reference PNG is not on `origin/main`. Juliet asks Coach. SYM0 / SYM1 / SYM2 may proceed after SYM0-G.

---

## 6. Juliet start

1. Run SYM0-india-advisor seed.  
2. On PASS: Lima already has DL-771; stamp SYM0-G report.  
3. Seed SYM1 (CP-1) and SYM2 in parallel.  
4. Do not seed SYM3 until the PNG blob is on main.

Specialists execute **only** via seeds. Coordination through Coach or Juliet.
