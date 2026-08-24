# P-Wiki Orchestrator

How to run this project with the bench. Juliet maintains; Coach drives.

## Operating loop

1. Open the next seed in `seeds/` (order: WK0 → WK7; WK3 ∥ WK4 after WK2).
2. Activate the seed's agent (Grok bench or Claude session) with:
   - The seed file (scope of work — **only** the files it lists)
   - Both wiki specs + `agents/bench/doctrine.md`
   - The charter's Current State table
3. Agent executes; ends by running its own completion checklist and reporting
   evidence (commands + outputs), not claims.
4. Delta-style spot check before marking a seed done; update the checkbox table below.
5. Nothing merges to `main` until WK0's commit plan says so (specs land with code —
   documentation parity).

**Live member-wiki plan:** [`docs/Member-Wiki-v0.1-Full-Agent-Bench-Plan-v2.0.md`](../../docs/Member-Wiki-v0.1-Full-Agent-Bench-Plan-v2.0.md) **S0 landed**. S1–S6 wait.

**Wiki Agent:** WA-1-G / WA-2-G / WA-3-G / **WA-4-G PASS** · **DL-548…554**.

**Wiki Spec v0.2.1 APPROVED · DL-555** (H1 v0.2.1 · **DL-561**). WU-0…WU-2 shipped.
**Source Contract v0.1.4 APPROVED DL-560** · B-3 closed **DL-561** (parent = Wiki Spec v0.2.1).
Plan [`docs/Wiki-Source-Contract-v0_1_4-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Wiki-Source-Contract-v0_1_4-Full-Agent-Bench-Plan-v1.0.md) — **GO SC-0** diffs (**DL-562**). **GO SC-1** envelope + watermark (**DL-568**). **GO SC-2** S7 push (**DL-570**). **GO SC-3** poll S1+S2 (**DL-571**). **S7 RULED** finished-only. **OD-3 RULED** skill-delivered, no stub (**DL-564**). Remaining holds: OD-4, 6, 7, 8, 9, 10, 12, 13, 14. **SC-3b** waits on Factory publication signal. Help Package superseded. WU-3 = Source Contract poll/compose.

Spine WK0–WK7 is **shipped** (do not restart). Member-wiki S0 **shipped**. Wiki Agent = **R0 / awaiting spec stamp**.

## Seed status

| Seed | Agent | Status |
|------|-------|--------|
| WK0–WK7 spine | — | **shipped** |
| S0-1 pins + start_here | Alpha | **landed** |
| S0-2 article chrome | Charlie | **landed** |
| S0-3 Echo + Tango | Echo, Tango | **PASS** |
| S0-4 Kilo WI | Kilo | **landed** (18 passed) |
| S0-5 Lima Arch 11 | Lima | **landed** |
| S0-G | Delta | **PASS** `gate-reports/S0-delta-gate.md` |
| S1–S6 | — | later stamps |

## Invocation templates

Grok (per seed):

```
Activate <Agent>. Project p-wiki, seed <WKn>.
Read agents/p-wiki/seeds/<file>, agents/p-wiki/CHARTER.md,
Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md,
Specs/FatTail-Labs-Wiki-Interface-Spec-v0.1.md.
Touch only the files the seed lists. End with the completion checklist
executed and evidence (commands + outputs) pasted.
```

Claude: same content, any phrasing.

## Rules of engagement

- One seed in flight per agent; Alpha's WK1→WK2 are serial.
- A seed that wants to touch out-of-scope files stops and reports (change control).
- Evidence beats demo: §8.1 runbook rows are the currency of "done".
- Coach actions (spec approval, publishing content, ship call) are tracked in the
  plan §3 — agents do not wait silently on them, they flag loudly.
