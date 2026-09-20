# StudioOne Data Plane & Remote UI — Full Agent Bench Plan v1.0

**Document type:** FatTail Labs Full Agent Bench Plan  
**Date:** 2026-09-19  
**Status:** **v1.1 RETURNED and revised** (Coach 2026-09-19). v1.0 DAG “land then F3” is **void**. F3 **is** the migration. **Not a build GO.** **SODP0-W0** remains intake.  
**Author:** Juliet (orchestration) · Grok Build (documents)  
**Authority:** Coach (stamp / GO / AP-1)  
**Canonical land path:** `docs/StudioOne-Data-Plane-Full-Agent-Bench-Plan-v1.0.md`  
**Board:** [`agents/p-studioone-data-plane/`](../agents/p-studioone-data-plane/)  
**Token:** [`agents/go/SODP0-W0.md`](../agents/go/SODP0-W0.md)

**Spec (DRAFT):** [`Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md`](../Specs/FatTail-Labs-StudioOne-Data-Plane-Spec-v0_1.md)  
**Architecture:** [`Architecture/36-studioone-data-plane.md`](../Architecture/36-studioone-data-plane.md)  
**Design:** [`Architecture/36-studioone-data-plane-design.md`](../Architecture/36-studioone-data-plane-design.md)

**Grok Build does not implement.** Juliet hands seeds. Auto-GO on clean gates. Stop + **GO / NO-GO** on a problem. No packet writes "done" before Coach AP-1.

---

## Standing law

### CP-1 — Chain primacy (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

### Other binds

| Law | Bind |
|-----|------|
| **TS-1** | doctrine §17. Fill design has two AP-1 strikes. Not repaired. Replacement on StudioOne. DL cites both strikes. |
| **RL-1** | REQ-001 · REQ-002 · REQ-003 OPEN in every report |
| **AP-1** | Coach browser. REQ-001 VP CONFIRMED only on his cross-check |
| **SODP-1…10** | spec §2 · **SODP-10** hardening after the move |
| **D6 / D7 / D8** | stay open |
| **VPS Q1** | ES/MES model ACTIVE blocked |
| **MiniTwo** | not this tree until SODP4 names it |

**Open REQs:** REQ-001 · REQ-002 · REQ-003.

---

## 0. Full bench sequence

```text
SODP0-G   Advisor + design + infra + auth  (India → Echo+Tango → Foxtrot → Mike + Hotel)
             │
             ▼
          Coach stamp  →  BUILD + SODP1-W0
             │
SODP1-G  Census: consumers (file:line) · Massive writers · leftovers
             │         CP-1 combined budget  ·  recognition-cache NAMED
             ▼
SODP2-G  F3 = MIGRATION. Massive-first provider BORN on StudioOne.
         Proven computing-class: ESZ2026 + MES → June. Fill NEVER copied.
         CP-1 FULL DRESS + arithmetic vs chain_feed headroom.
             │
SODP3-G  Re-point EVERY census row. Attest each. Labs hop only.
             │
SODP5-G  Delete old StudioTwo OHLC server WHOLE (process, plist, grep).
         Leftover vp-api / chain-feed / engine gone. Ghost FAIL.
             │
SODP4    MiniTwo consumer  — topology specified now; cutover NAMED later
SODP6    MacBook consumer  — same hop contract; host NAMED later
             │
SODP-AT  hop June ES+MES · deletion proofs · no ghost :4010
             │
AP-1     Coach pan June ES AND MES
             │
SODP-H-G Hardening (after, not during)
```

**FAIL the program if any packet sequences “move the fill, then F3.”** SODP1 may run read-only during SODP0. **No history code on StudioOne until stamp + SODP2-W0.** SODP4/SODP6 do not block AP-1 on StudioTwo.

---

## 1. Seats (the whole bench that touches this)

| Seat | Job on this program |
|------|---------------------|
| **Coach** | Stamp, AP-1, SODP-LABS yes/no, MiniTwo/MacBook named packets |
| **Juliet** | This plan, seeds, board. Does not implement. |
| **India** | SODP0-G: spec/arch vs CP-1, Arch 28, TS-1, SODP-4 vs Coach “all API,” product boundary |
| **Echo** | Design doc: banner, three UI hosts, no vendor ticker in chrome |
| **Tango** | Honesty of SHORT HISTORY; no silent wall; capacity |
| **Hotel** | Price series is the contract they picked — no mixed-print lie |
| **Mike** | Hop: member cookie never forwarded; computing-class; SSO per UI host |
| **Foxtrot** | StudioOne launchd, pins, Tailscale, retire StudioTwo leftovers, CP-1 install |
| **Alpha** | History provider, hop wiring, delete fill, cache |
| **Charlie** | Chart consumes `short_history`; no short localStorage win; MacBook site URL |
| **Kilo** | Inventory, live contract tests, grep-proof, headed June artifact, **consolidated StudioOne data-service suite (SODP-H)** |
| **Delta** | Every gate PASS/FAIL/BLOCKED with evidence. Never waived. |
| **Lima** | DL same day; Arch 36 honesty; spec status |
| **Sierra** | Not this tree (no catalog) unless a public route appears |
| **Victor / Whiskey / Yankee** | Not central unless a packet claims a lineage frame |

Content-studio seats (Bravo, November, Romeo, Papa, Gemba, Golf) are **not seated** on SODP0.

---

## 2. Packets

### SODP0 — Review (this intake)

**Machine:** StudioTwo, read-only.  
**Seeds:** `seeds/SODP0-india.md` · `SODP0-echo-tango.md` · `SODP0-foxtrot.md` · `SODP0-mike.md`  
**Gate SODP0-G:** all four APPROVED or RETURNED with flagged ideas. Coach then stamps or sends back.

India must **flag** (not erase) the tension: Coach said “api run from StudioOne”; SODP-4 keeps product Labs on MiniTwo until a named cut. That is a Coach box, not India’s kill.

### SODP1 — Census (Kilo + Foxtrot)

Read-only. Artifact `gate-reports/SODP1-inventory.md` **must** contain:

1. **Consumer table** (spec §11) with **file:line** for every OHLC / contracts / stream / VP / symbology caller.  
2. **Massive writers** on StudioOne **and** StudioTwo (process, interval, standing vs burst). **Name the recognition cache** Coach cited — process, or “none found.”  
3. **Combined CP-1 budget** (spec §12) vs live chain_feed (pid, CPU, last-snapshot).  
4. Leftover StudioTwo launchd (vp-api, chain-feed, vp-engine).

No GO to SODP2 if recognition cache is unnamed or combined standing Massive is uncounted.

### SODP2 — F3 **is** the migration (Alpha + Foxtrot + Kilo)

**CP-1 FULL DRESS + arithmetic.** Build the Massive-first provider **on StudioOne**. Prove computing-class `ESZ2026` and MES → first bar in June, `short_history` in payload. Vendor-translate on the server. Disk cache. Print tail same contract only.

**Do not** rsync `_aggs_price_fill` / in-process `ohlc_for_source` fill onto StudioOne. Overlay new module only. No git-pull of the stale Labs tree.

**Budget (draft; SODP1 may tighten):** sibling **`:4012`**. 0 standing Massive; burst 1 GET/(ticker,tf) on miss; first ES+MES = 2 REST bursts, **post-close or HOLD**. Cache on internal disk (not unmounted 2TB). No chain-feed plist. No Redis CONFIG. Rollback: `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/ai.fattail.labs.history.plist`.

Hotel honors: no hardcoded root-default `ESZ6`; MES empty ≠ ES; empty ≠ SHORT HISTORY; no model ACTIVE.

### SODP3 — Re-point with proof (Alpha + Charlie + Kilo)

Every SODP1 census row re-pointed and attested (command + output). Labs hop only. Bust short `fetchGen` cache. Fail loud if pin unset.

A row without an attest is **FAIL** (SYM-SWAP lesson).

### SODP5 — Delete the old server whole (Foxtrot + Alpha + Delta)

**After** SODP3 attests. StudioTwo: in-process OHLC BASE gone; `_aggs_price_fill` gone; leftover vp-api / chain-feed / vp-engine **process gone, plist gone, grep clean**. `lsof :4010` empty. Ghost server = FAIL.

### SODP4 — MiniTwo consumer (Foxtrot + Mike) · **named GO**

Topology **already** spec §14: Tailscale `http://100.74.220.38:4010` / `:4011`. Same hop as StudioTwo. No capture on MiniTwo. Unset pin → 503, not a local fill. Cutover is this packet; design is not deferred to deploy night.

### SODP6 — MacBook consumer (Foxtrot + Charlie) · **named GO**

Same hop contract. LAN pin or Tailscale. SSO callback host for that machine.

### AP-1

Coach: tile → chart, pan to June 2026, ES **and** MES. REQ-001 range then VP cross-check. REQ-003/002 unchanged unless he marks them.

### SODP-H — Hardening round (full bench, after the move)

**Depends:** SODP5 + AP-1. **Forbidden during SODP2–6** (doctrine §13).  
**Law:** spec SODP-10 · Audit & Hardening Round Spec v1.1 Simplify.  
**Coach:** refactoring and hardening audit; bulletproof; consolidated unit tests; no dangling code; purpose-built; Data Services and APIs on StudioOne; remotes consume APIs.

| Seat | Packet |
|------|--------|
| Kilo | One test suite for StudioOne data services. UI tests consume hops only. 0 warnings. |
| Alpha + Charlie | Delete dangling (fill remnants, unused print-first OHLC, second Massive, dead launchd). Not disable. |
| India | Architecture MATCH after deletes. |
| Echo | Re-gate touched surfaces. |
| Foxtrot | StudioTwo `lsof :4010` empty; StudioOne process set = spec §4 only. |
| Delta | FAIL if dangle remains, tests assumed, or AP-1 interface moved. |

**Seed:** `agents/p-studioone-data-plane/seeds/SODP-H.md` (HOLD until AP-1).

---

## 3. Isolation FAIL

A seed that: repairs `_aggs_price_fill`; **copies the fill onto StudioOne**; sequences “move then F3”; calls Massive from Next; forwards member cookies; git-pulls StudioOne Labs; answers D6/D7/D8; grants model ACTIVE; MiniTwo cutover without named SODP4; treats MiniTwo pin as TBD; stops `:3000`/`:4000` as a “fix”; streamlines mid-build; leaves a ghost StudioTwo `:4010` or fill path.

---

## 4. Why the full bench (not a sidecar ticket)

This is a **topology change of the whole market system**, not an OHLC patch. It binds capture, Massive, VP, symbology, three UI hosts, auth hop, and TS-1. Skipping India/Echo/Mike/Foxtrot is how StudioTwo kept a second data plane after VP “moved.”
