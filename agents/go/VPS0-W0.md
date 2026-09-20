# VPS0-W0 — Volume Profile Service · GO token

**Machine:** StudioTwo (repo + board + agent execution). StudioOne is
deployment/runtime only — touched solely by later packets whose GO names
it (first: Q2 verification). MiniTwo / DudeTwo not this tree.  
**Board:** [`agents/p-volume-profile-service/`](../p-volume-profile-service/)  
**Land path:** `agents/go/VPS0-W0.md`  
**Date drafted:** 2026-09-16  
**Status:** **STAMPED GO** — 2026-09-16. Chat is not the stamp; this file is (**DL-328**). **DL-706.** VPS0 **CLOSED**.

## Authority

- Plan: [`docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.1.md) **v1.1**
- Spec: [`Specs/Volume-Profile-Service-Spec-v0_5.md`](../../Specs/Volume-Profile-Service-Spec-v0_5.md) **v0.5 DRAFT**
- Baseline: [`Specs/Volume-Profile-Service-Spec-v0_4.md`](../../Specs/Volume-Profile-Service-Spec-v0_4.md)
- Review objects: **DL-705**
- Parents (not re-opened): AZ-VP-9 / AZ-VP-3 / AZ-VP-6 · OPF named-state · GEX Quad complement
- **Not** Histogram Spec v0.4 / `p-volume-profile-histogram` · **not** Session Option VP / `p-session-volume-profile`

## Pre-flight evidence (India, 2026-09-16, StudioTwo) — do not edit the files

| File | `wc -l` | sha1 | `grep -c '^## '` | last `^## ` |
|------|--------:|------|-----------------:|-------------|
| `Volume-Profile-Service-Spec-v0_5.md` | 358 | `a487a702dff7de45f3a0d4ba0ca09199bd2586dd` | 16 | `## 14. Round log` |
| `Volume-Profile-Service-Spec-v0_4.md` | 245 | `9b4a56e0dceaa2a4a1f25430dc8cf6356b4b5cd8` | 16 | `## 14. Round log` |

**CORRUPT ARTIFACT (DL-705):** `Specs/Volume Profile Service — Spec v0.5.md` · 155 lines · sha1 `ebdc633d2dd8191f7d01e35f1548347566781168`. Do not bind.

§13 Stamp Gate **is present** in the restored v0.5 (heading line 324). Coach boxes inside the spec remain Coach’s.

## Coach ticks (required for this stamp)

- [x] Completeness (India pre-flight MATCH, both triples)
- [x] DL-705 (both sha1s; ebdc633d… 155-line file recorded CORRUPT)
- [x] §13 present in Specs/Volume-Profile-Service-Spec-v0_5.md
- [x] Q6 = (c) all-history running totals
- [x] Q7 = (a) source-space bins + mapping block
- [x] Q5 = DEFERRED to VPS2-W0; blocks first publish
- [x] Isolation acknowledged (FAIL list stands)
- [x] StudioOne-by-named-packet only

Q8 and Q10 remain **open** and **do not block this stamp**.

## What this token authorizes (after Coach ticks)

- GATE 0 closed as a **document** gate  
- A **later** named GO for **Q2 verification on StudioOne**  
- Still **no** Ingest / Engine / API / consumer cutover until `VPS1-W0`

## What this token does not authorize

- Product code · StudioOne SSH in this packet · Engine/Ingest  
- POC / VA / HVN / LVN payloads (part four)  
- Deletes of `marketOhlc*` (kill is VPS5)  
- MiniTwo / DudeTwo  
- LIM / QFRIC / XS / PPL / Help Watch / Histogram dual-store / SVP files  
- AT-VPS-14 as a Stage A gate (Stage B, parked)

## Stop conditions

- Triple mismatch → stop (did not fire; MATCH 2026-09-16)  
- Isolation FAIL list in any diff → FAIL  
- Any seed proposing product code, StudioOne access, or Engine/Ingest **in VPS0** → FAIL

## Stamp

**STAMPED 2026-09-16** by Coach (exact ticks below). Q8 / Q10 remain OPEN and do not block. **VPS0 CLOSED.** Next: Q2 verification on StudioOne under `VPS-Q2-W0` (own GO).

| Tick | Coach |
|------|-------|
| Completeness (India pre-flight MATCH, both triples) | ☑ |
| DL-705 (both sha1s; ebdc633d… 155-line file recorded CORRUPT) | ☑ |
| §13 present in Specs/Volume-Profile-Service-Spec-v0_5.md | ☑ |
| Q6 = (c) all-history running totals | ☑ |
| Q7 = (a) source-space bins + mapping block | ☑ |
| Q5 = DEFERRED to VPS2-W0; blocks first publish | ☑ |
| Isolation acknowledged (FAIL list stands) | ☑ |
| StudioOne-by-named-packet only | ☑ |
