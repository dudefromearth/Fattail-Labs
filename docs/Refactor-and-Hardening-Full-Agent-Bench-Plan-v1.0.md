# Refactor Sweep + Hardening Pass — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-19  
**Status:** **Board only — HOLD.** No R0/H0 execution until TOPO-1 AP-1 and the priority board is clear.  
**Author:** Juliet  
**Authority:** Coach  
**REQs:** `artifacts/reqs/REQ-004.md` · `REQ-005.md`  
**Boards:** `agents/p-refactor-sweep/` · `agents/p-hardening-pass/`  
**Tokens:** `agents/go/REF0-W0.md` · `agents/go/HRD0-W0.md` (both HOLD)

**Parent migration:** TOPO-1 = SODP (`docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`). F3 is that migration.

**Grok Build does not implement these programs now.**

---

## Sequencing law (Coach, verbatim)

> these run in order, each gated on the last: TOPO-1 migration complete (AP-1) → REFACTOR → HARDEN. No refactor packet before migration closes; no hardening packet before the refactor sweep closes. Board rows now, execution then.

> Open REQs, F3, TOPO-1, and the eligibility report retain priority — these programs start only when that board is clear.

```text
Priority board (must clear first)
  REQ-001 · REQ-002 · REQ-003 · F3/TOPO-1 · eligibility report
                    │
                    ▼
             TOPO-1 AP-1
                    │
                    ▼
REQ-004  R0 inventory (read-only) ── Coach approves packet list ── R1 execute
                    │
                    ▼
REQ-005  H0 inventory (read-only) ── Coach approves SEV list ── H1 execute
```

A seed that starts R0 or H0 while TOPO-1 is OPEN is **FAIL**.

## WG-1 — weekly timer (after first backlog clear)

Doctrine §18. Saturday 16:05 ET, StudioTwo launchd `ai.fattail.labs.groundskeeping` (same pattern as Evening Autorun). **Not loaded until armed.** Then R0+H0 fire without a human trigger. Empty lists are a result. R1/H1 still Coach-approved. Missed armed cycle → RL-1 process defect. Status reports print `last_completed_cycle`.

---

## Program 1 — REFACTOR SWEEP (REQ-004)

**Seats:** Juliet (board) · Kilo (R0) · India (triage vs SODP-1…11) · Alpha + Charlie (R1) · Echo (AP-1 reverse on touched UI) · Delta (gates) · Lima (DL).

### R0 — inventory, read-only

Sweep Labs tree **and both StudioOne planes** for:

- Dead code / orphaned routes (struck fill remnants, fixture leftovers, retired overlay/`redrawVp`, stale “L2/custom series” comments)
- Duplicate symbol or config lists outside the registry
- Hardcoded symbols / months / machines / ports
- TS-1 candidates (one AP-1 strike)
- Seam code from SYM-SWAP and TOPO-1

**Deliverable:** triaged packet list + effort estimates. **Coach approves the list before any R1 packet.**

### R1 — execute approved packets only

Acceptance **per packet:**

- BEHAVIOR-PRESERVING, proven: contract tests green **before and after**
- **AP-1 in reverse:** member-visible behavior unchanged on Coach’s screen
- Grep-proof for every deletion
- Line counts deleted vs added (deletions should dominate; **DL-766** is a health indicator, **not** a gate)

---

## Program 2 — HARDENING PASS (REQ-005)

**Depends:** REQ-004 closed.  
**Seats:** Juliet · Kilo (H0) · Mike (auth) · Foxtrot (CP-1, ops, restore drill) · Alpha · Echo · Delta · Lima. Hotel if a packet touches series honesty.

### H0 — inventory, read-only (minimum)

- Fail-loud: every route that can serve short, stale, or empty carries banner/reason in the payload (banner-law generalization; two silent misses today)
- Auth seams: StudioOne registry + OHLC (computed headers — state what authenticates a member); dev-login identity gap
- Known faults: structure endpoint 500; STALE artifact re-verification cadence actually scheduled
- CP-1 mechanics: chain_feed freshness watchdog + alert; **combined** Massive connection budget across all StudioOne services
- Ops: secrets/.env; restart-on-crash; backup and off-site for capture volumes and print store (**Sept-14 volumes/archive assessment folds in**); **one restore drill actually performed**
- Dependency/CVE pass on service and web trees

**Deliverable:** SEV-ranked packets. **Coach approves before H1.**

### H1 — execute

Each packet: PP-1 evidence. StudioOne = **CP-1 FULL DRESS**. Acceptance named at seed time. Member-facing packets close **AP-1**.

---

## Isolation FAIL

Start R0/H0 before TOPO-1 AP-1. Run HARDEN before REFACTOR. Repair `_aggs_price_fill`. MiniTwo unnamed. Streamline TOPO-1 mid-build. Delete StudioTwo `chain_feed` without SODP-MB (India R1).
