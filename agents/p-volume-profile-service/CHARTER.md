# Project: Volume Profile Service (StudioOne)

**Board:** `agents/p-volume-profile-service/`  
**Instance:** **GROK BUILD — INFRA** (**DL-720**) — `VPS*` / `VPSB*` · collectors · Engine · mapping · API · StudioOne  
**Not this instance:** `SADEV*` (APPS) · spec reviews (ADVISOR)  
**Orchestrator:** Juliet  
**Authority:** Coach  
**Token:** [`agents/go/VPS0-W0.md`](../go/VPS0-W0.md) **STAMPED GO** · **DL-706**  
**Law:** **CP-1** (**DL-707**) — chain_feed never disrupted

## Plans / specs

| Doc | Path |
|-----|------|
| **Plan v1.2** | [`docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md) |
| **Working spec v0.6** | [`Specs/Volume-Profile-Service-Spec-v0_6.md`](../../Specs/Volume-Profile-Service-Spec-v0_6.md) · **DL-722** · sha1 `a438f9d636e40d4c95feb87874daf8c603344aac` |
| **SA Spec v0.3** | [`Specs/Structural-Analysis-Service-Spec-v0_3.md`](../../Specs/Structural-Analysis-Service-Spec-v0_3.md) · **DL-721** · sha1 `4638ce958a81e24980ed6fd2e7618aaec51f4cfd` · app end; APPS/`SADEV*` |

**Not this board:** `p-volume-profile-histogram` (Labs dual-store) · `p-session-volume-profile` (heatmap SVP).

## Mission

Capture and serve **volume at price at the finest honest resolution**. Three parts: Ingest, Engine, API. Stage A: SPY → XSP. No analysis (POC/VA/HVN/LVN are part four).

## Invariants

- GATE 0 before any product code  
- **CP-1** chain primacy (**DL-707**)  
- VP-L1 / L2 / L6 / L7 / L8 / L10 / L14  
- StudioOne host. StudioTwo holds the repo. No MiniTwo unless named  
- Never `git add -A`. Do not stop `:3000` / `:4000`

## Out of scope

Part four · Stage B/C product · footprint/delta · Histogram dual-store · SVP heatmap · kill before VPS5
