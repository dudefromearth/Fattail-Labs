# ORCHESTRATOR — SSR Collector Hardening

**Juliet** owns this board. No implementation by the orchestrator.

**Spec:** [`Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`](../../Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md) — **BUILD AUTHORITY** (Coach auto-GO 2026-08-18 · W0-G PASS · **DL-433**).

**Constraint:** Collector is **live** (gth). Do **not** mid-gth kickstart.
Cut over only between phases.

**Observed-flaky (2026-08-23, not this board’s packet):** `tests/test_ssr_session_map.py::test_at_ssr_h_g_flag_off_missing_map_polls` failed at parent `5efba75` (9 failed) and passed on current house box (8 failed) with zero edits to the SSR tree — nondeterministic. Evidence: `agents/p-wiki/gate-reports/WA-1-delta-gate.md` A2 (parent 9 failed including this test) vs WA-2-G house box (8 failed, this test not listed). **Do not fix from wiki.** SSR pass/fail flips are not chargeable to wiki packets.

## DAG

```text
W0 spec lock ──► P1 session map + holes (flag off)
             ──► P2 heartbeat + watchdog (flag off)
             ──► P3 cadence report (no code unless Coach picks a number)
                      │
                      ▼
                 W1-G ── cut over between phases
                      │
                      ▼
                 P4 daily gap audit
                 P5 quote sanity
                 P6 retain + checksum
                 P7 replay verifier stub
                      │
                      ▼
                 W2-G
```

## Board

| Packet | Agent | Status | Gate |
|--------|-------|--------|------|
| W0-0 Coach stamp | Coach | **IN** | — |
| W0-1 Juliet spec | Juliet | **DONE** 2026-08-18 — spec exists | W0-G |
| W0-2 India spec/arch | India | **DONE APPROVED GO** | W0-G |
| W0-3 Echo dashboard | Echo | **DONE APPROVED GO** | W0-G |
| W0-4 Foxtrot watchdog/launchd | Foxtrot | **DONE APPROVED GO** | W0-G |
| W0-5 Kilo tests | Kilo | **DONE GO** | W0-G |
| W0-6 Lima cadence + DL | Lima | **DONE GO** — **DL-432** / **DL-433** filed; cadence unchanged | W0-G |
| W0-G Delta | Delta | **PASS GO** 2026-08-18 | — |
| P1 session map + holes | Alpha / Charlie / Kilo | **UNBLOCKED** — code behind `LABS_SSR_HARDENING=0` only; **no mid-gth kickstart** | W1-G |
| P2–P3 | Foxtrot / Kilo / Lima | P2 flag-off land allowed; P3 cadence report **DONE** (DL-432). Flag-on cutover between phases | W1-G |

## Auto-GO rule (this run)

Clean gates **GO**. Stop only on invariant break, archive risk, or missing
Coach-required input that blocks build (alert channel is **OPEN** — do not
invent Slack/email).

## Live plane (do not touch)

StudioOne `ai.fattail.labs.ssr-live-capture` · dashboard `:5055` · phase **gth**
as of 2026-08-18 00:14 ET.

**Next cutover windows (flag-on):** 4:00 AM ET (`gth`→`pre`), or
9:25–9:30 AM ET (GTH→RTH). No mid-gth kickstart.

## Next

**P1 unblocked** for session-map + hole code behind `LABS_SSR_HARDENING=0`.
Do **not** `launchctl kickstart` the tap while phase is **gth**.
Alert channel remains **OPEN** (OD-SSR-H-1). Cadence remains **2s**
(**DL-432**) until Coach picks otherwise.
