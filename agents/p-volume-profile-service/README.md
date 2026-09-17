# Volume Profile Service

Juliet board. **Instance:** **GROK BUILD — INFRA** (**DL-720**).

**Seated law:** VP Service **v0.6** (data end) + SA Service **v0.3** (app end) · **DL-721**. Working spec for INFRA: v0.6 · **DL-722**.

| Instance | Owns |
|----------|------|
| **INFRA** (this board) | `VPS*` / `VPSB*` · collectors / Engine / mapping / API · StudioOne |
| **APPS** | `SADEV*` · token [`../go/SA-DEV-W0.md`](../go/SA-DEV-W0.md) **STAMPED GO** **DL-723** · ingest **READ-ONLY** |
| **ADVISOR** | spec reviews (INFRA does not self-review) |

| Artifact | Path |
|----------|------|
| Plan v1.2 | [`docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md`](../../docs/Volume-Profile-Service-Full-Agent-Bench-Plan-v1.2.md) |
| Working spec v0.6 | [`Specs/Volume-Profile-Service-Spec-v0_6.md`](../../Specs/Volume-Profile-Service-Spec-v0_6.md) sha1 `a438f9d636e40d4c95feb87874daf8c603344aac` |
| SA spec v0.3 | [`Specs/Structural-Analysis-Service-Spec-v0_3.md`](../../Specs/Structural-Analysis-Service-Spec-v0_3.md) sha1 `4638ce958a81e24980ed6fd2e7618aaec51f4cfd` |
| INFRA token | [`agents/go/VPS0-W0.md`](../go/VPS0-W0.md) **STAMPED** **DL-706** |
| APPS token | [`agents/go/SA-DEV-W0.md`](../go/SA-DEV-W0.md) **STAMPED GO** **DL-723** |

**Not this board:** Labs histogram dual-store (`p-volume-profile-histogram`) · heatmap session-volume (`p-session-volume-profile`).
