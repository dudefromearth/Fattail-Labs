# W0-0 — Coach stamp (verbatim)

**Project:** SSR Collector Hardening  
**Agent:** Coach  
**Status:** RECEIVED 2026-08-18

Nothing below is edited.

---

# Chain Snapshot Collector — Hardening Spec (Studio One)

Role: orchestrate this through the agent bench. Do NOT implement it yourself. Run the full gate sequence, auto-GO through clean gates, stop only on a problem, and every report carries an explicit GO / NO-GO verdict.

## Context
The collector on Studio One is live: 18 symbols, 2s cadence, gth phase, dashboard shows 3492 snaps and 14 "holes." Collection begins on premarket data tomorrow morning and must run every market day going forward. The archive is the product; gaps are permanent. Nothing here may risk the existing archive or interrupt tomorrow's premarket start.

## Problems observed
1. During GTH the collector polls all 18 symbols. Only SPX, XSP, IWM, USO have overnight chains. The other 14 return no chain and are recorded as holes. These are not holes; they are expected empties. This wastes 14 requests every cycle all night and makes the hole counter permanently red.
2. Cadence is 2s. Original spec was 3-5s. Confirm which is intended before RTH tomorrow and size disk + provider quota accordingly. Do not change cadence without reporting the storage and quota math.

## Required changes
### 1. Phase-aware symbol scheduling
- Maintain a per-symbol session map: which phases (gth / premarket / rth / postmarket) each symbol has a listed options chain in.
- Poll a symbol only during phases where it has a session. Log a single "no session" line per symbol per phase transition, not per cycle.
- Session map is config, not code. Editable without a redeploy.

### 2. Hole semantics
- Define hole = expected snap missing or interval exceeded. Empty response outside a symbol's session is NOT a hole.
- Dashboard "holes" counter reflects only true holes. Add a separate muted "no session" indicator if useful.

### 3. Dead-man's switch
- Collector emits a heartbeat every cycle.
- Independent watchdog (separate process, not inside the collector) alerts if heartbeat is silent > 60s during any live phase for any scheduled symbol. Alert channel: [Coach to specify]. Fail loud.

### 4. Post-close gap audit
- Runs after last phase closes each day. Per symbol, per phase: intended cadence vs actual, every interval that exceeded tolerance, with timestamps. Writes a dated report to the archive alongside the data. Summary line to the alert channel.

### 5. Quote sanity pass
- Per snap, flag: crossed or locked markets, stale quote timestamps relative to snap time, zero-bid deep ITM, missing greeks/IV where rows exist, schema drift from provider (new/missing fields).
- Flags are recorded, never dropped or "cleaned." Daily count in the gap audit report.

### 6. Retention + integrity
- Roll raw snaps into a compressed per-day, per-symbol archive after the audit. Checksum each. Verify checksum on read. Never delete raw until the compressed archive verifies.

### 7. Replay verifier (stub is acceptable now, full later)
- Read a day's archive, drive it through the same surface code path used live, diff against what was rendered live. Report divergence. This proves "replay as if live" before Strategy Lab depends on it.

## Constraints
- Zero downtime to the running collector. Deploy behind a flag; cut over between phases, not mid-phase.
- Config over code for session maps, cadence, tolerances, alert channel.
- Everything logs to the existing dashboard; no second dashboard.
- Tests must include: symbol with no session in GTH is not polled and not counted as a hole; heartbeat silence triggers alert; audit correctly flags a synthetic 30s gap.

## Deliverables
- Gate reports under the project's gate-reports/ path with GO / NO-GO.
- Cadence decision + storage/quota math as a single report before RTH tomorrow.
- Decision-log entry per approved change.

Priority order: 1, 2, 3 before tomorrow's open if possible. 4, 5, 6 this week. 7 stubbed.

---

**Open Coach inputs (do not invent):**

- Alert channel: **UNSPECIFIED**
- Cadence pick: **REPORT ONLY** until Coach chooses after the math
