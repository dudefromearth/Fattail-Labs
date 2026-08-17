# ORCHESTRATOR — OT-EF · Session/Print · Two Clocks

**Juliet** owns this board. Specialists fire only from seeds. No peer-to-peer tasking.

**Plan:** [`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`](../../docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md)

## DAG

```text
W0 ──► W1 Echo labels ──────────┐
 │     W2 Delta list ───────────┼──► W4 envelope ──► W5 consume ──► W6 Edit
 │     W3 HOW ──► W3-G ─────────┘         │
                                          ├──► W7 SL
                                          └──► W8 ──► W9
W3-0 WHETHER = BUILD (Coach 2026-08-16 · DL-397)
```

## Phase order (do not skip gates)

| Phase | Fire when | Gate | Board |
|-------|-----------|------|-------|
| W0 | This fold | W0-G + W0-0 | **GO** (Coach 2026-08-16) |
| W1 | W0-G | W1-G | **W1-G PASS** |
| W2 | W0-G | W2-G | **W2-G PASS** |
| W3 | W0-G | W3-G (HOW). W3-0 already BUILD | **W3-G PASS** |
| W4 | W1-G + W2-G + **W3-G** | W4-G | **W4-G PASS** |
| W5 | W4-G | W5-G | **UNBLOCKED** — expand then fire |
| W6 | W4-G | W6-G | **UNBLOCKED** — may parallel W5 |
| W5 | W4-G | W5-G | BLOCKED |
| W6 | W4-G | W6-G | BLOCKED |
| W7 | W2-G; code after W3-G | W7-G | BLOCKED — seed cites Method v0.2 + Config Resolution Standard |
| W8 | W5-G + W6-G | W8-G | BLOCKED |
| W9 | W8-G | W9-G | BLOCKED |

## Seed protocol

1. Copy seed → agent with Spec + plan paths.  
2. Agent reports PASS/FAIL/BLOCKED with evidence.  
3. Delta phase gate before the next dependent phase.  
4. Lima DL on material law or as-built change.

## Coordination

- OT-EF v1.1 is doctrine. Session/Print **WHETHER** is BUILD (DL-397). HOW review still lands.  
- Analyzer residual board keeps layout / Surface 3D / VP bins.  
- OPF foundation board stays closed; this program **extends** the feed.  
- Do not revive merge-all-visible (NX9).

## Status (live)

| Packet | State |
|--------|--------|
| W0-G / W0-0 / W3-0 | **PASS / STAMP / GO** · DL-397 |
| OD-SESS-1…4 | **ACCEPT** as India shaped · **DL-398** |
| W1-1 Echo | **LANDED** · `echo-labels.md` |
| W2-1 Delta | **LANDED** · `characterization-list.md` |
| W3-1 India | **LANDED** · HOW **APPROVED** |
| W1-2 Tango | **APPROVED** · `W1-2-tango.md` |
| W1-3 Hotel | **APPROVED** · `W1-3-hotel.md` |
| W3-2 Echo+Tango | **APPROVED** · `W3-2-echo-tango.md` |
| W3-3 Hotel | **APPROVED** · `W3-3-hotel.md` |
| W1-G · W2-G · W3-G | **PASS** — third gate passed |
| W4-1 Alpha | **LANDED** · `server/opf/session.py` on ladder / package-quote / resolve |
| W4-G | **PASS** · `gate-reports/W4-G.md` |
| W5 · W6 | **UNBLOCKED** — Charlie consume ∥ Edit. Expand stubs first. |
