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
| **AZ-VP-9-A7** | [`Specs/amendments/AZ-VP-9-A7.md`](../../Specs/amendments/AZ-VP-9-A7.md) · **DL-738** · sha1 `efcaa297c80e8e4410a24bbbeb8aec68987e3e6c` · scope boundary over A2–A6 |
| **AZ-VP-9-A8** | [`Specs/amendments/AZ-VP-9-A8.md`](../../Specs/amendments/AZ-VP-9-A8.md) · **DL-739** · sha1 `7c30e2d3a906c7acc87262a680a0263ba30bd7fc` · layer architecture consolidating A2–A7 |
| **AZ-VP-9-A10** | [`Specs/amendments/AZ-VP-9-A10.md`](../../Specs/amendments/AZ-VP-9-A10.md) · **DL-740** · sha1 `3d29f050d19983392262c005131163ed9a4ec983` · universal settings dialogs, one at a time |
| **AZ-VP-9-A11** | [`Specs/amendments/AZ-VP-9-A11.md`](../../Specs/amendments/AZ-VP-9-A11.md) · **DL-741** · sha1 `20984fe478152c7f8424bc1c652657265f346380` · purpose law · three uses · L-POSITION named |
| **AZ-VP-9-A12** | [`Specs/amendments/AZ-VP-9-A12.md`](../../Specs/amendments/AZ-VP-9-A12.md) · **DL-742** · sha1 `417dc65af3960593cbda2c06d5dd36c00f31b247` · full-history profile · VPS2b Q6=(c) |
| **API contract v1.1** | [`Specs/VP-API-Contract-v1_1.md`](../../Specs/VP-API-Contract-v1_1.md) · **DL-733** sha1 `d01b3dd9bfbac3bbcafb34110ef7d06cd6650915` |
| **Dev sidecar record** | [`DEV-API.md`](DEV-API.md) — APPS reads this; never scan ports |
| **OPS-DASH** | [`OPS-DASH.md`](OPS-DASH.md) · **LIVE** `http://studioone.local:5055` · StudioTwo `:5056` retired (**DL-734** · **DL-737**) |
| **VPS2b** | [`VPS2b.md`](VPS2b.md) · **DL-742** · Q6=(c) running totals · dev first · `kind=composite` publish still fenced |

**Not this board:** `p-volume-profile-histogram` (Labs dual-store) · `p-session-volume-profile` (heatmap SVP).

## Mission

**Singular drive (DL-727 / DL-732):** (1) DOWNLOAD newest-first, contiguous [floor … now] (2) CREATE bins as each tranche lands (3) API over whatever is binned. **VPS2b** (DL-742) builds Q6=(c) running totals; `kind=composite` publish stays fenced. Coverage floor published. `/range` below floor = 422 refuse.

## Invariants

- GATE 0 before any product code  
- **CP-1** chain primacy (**DL-707**)  
- VP-L1 / L2 / L6 / L7 / L8 / L10 / L14  
- StudioOne host. StudioTwo holds the repo. No MiniTwo unless named  
- Never `git add -A`. Do not stop `:3000` / `:4000`

## Out of scope

Part four · Stage B/C product · footprint/delta · Histogram dual-store · SVP heatmap · kill before VPS5
