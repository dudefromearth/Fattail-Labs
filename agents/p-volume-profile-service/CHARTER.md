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
| **Working spec v0.6.1** | [`Specs/Volume-Profile-Service-Spec-v0_6_1.md`](../../Specs/Volume-Profile-Service-Spec-v0_6_1.md) · **DL-730** · sha1 `7e3bbedc58e1cbadc2ce96bb820bf93059f8806d` |
| **Working spec v0.6 (baseline)** | [`Specs/Volume-Profile-Service-Spec-v0_6.md`](../../Specs/Volume-Profile-Service-Spec-v0_6.md) · **DL-722** · sha1 `a438f9d636e40d4c95feb87874daf8c603344aac` |
| **SA Spec v0.4 (authored)** | [`Specs/Structural-Analysis-Service-Spec-v0_4.md`](../../Specs/Structural-Analysis-Service-Spec-v0_4.md) · **DL-731** · sha1 `d68060cc5221b83170d39aeace5e8fb8b7470c51` · 540 · 22 `## `. Supersedes v0.3.1. Pointer **CLOSED**. NOT BUILD. |
| **SA Spec v0.3.1 (Advisor r2 object)** | [`Specs/Structural-Analysis-Service-Spec-v0_3_1.md`](../../Specs/Structural-Analysis-Service-Spec-v0_3_1.md) · **DL-730** · sha1 `8298b572f10784c9e43848c93da50b6a630e3321`. Round 2 proceeds against this file; verdicts → v0.4.1 via Coach. |
| **AZ-VP-9-A1** | [`Specs/amendments/AZ-VP-9-A1.md`](../../Specs/amendments/AZ-VP-9-A1.md) · **DL-730** · sha1 `53bf74daa8a2b67ac3073d6fdb92bfed9b297ab0` |
| **API contract v1.0** | [`Specs/VP-API-Contract-v1_0.md`](../../Specs/VP-API-Contract-v1_0.md) · **DL-726** frozen sha1 `b403937a…` |

**Not this board:** `p-volume-profile-histogram` (Labs dual-store) · `p-session-volume-profile` (heatmap SVP).

## Mission

**Singular drive (DL-727 / DL-732):** (1) DOWNLOAD newest-first, contiguous [floor … now] (2) CREATE bins as each tranche lands (3) API over whatever is binned. Composite fenced. Coverage floor published. `/range` below floor = 422 refuse.

## Invariants

- GATE 0 before any product code  
- **CP-1** chain primacy (**DL-707**)  
- VP-L1 / L2 / L6 / L7 / L8 / L10 / L14  
- StudioOne host. StudioTwo holds the repo. No MiniTwo unless named  
- Never `git add -A`. Do not stop `:3000` / `:4000`

## Out of scope

Part four · Stage B/C product · footprint/delta · Histogram dual-store · SVP heatmap · kill before VPS5
