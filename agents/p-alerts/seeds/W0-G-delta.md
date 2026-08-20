# Seed W0-G — Delta review gate

**Project:** p-alerts  
**Agent:** Delta  
**Phase:** W0  
**Depends:** W0-2…6 filed  
**Gate it feeds:** W0-BA

## Evidence required

| Check | Pass if |
|-------|---------|
| Specs AZ-ALB/ALM **v1.0.3** + plan **v1.0.3** + board on disk | Paths resolve; AT-ALB-11…15 and AT-ALM-12…13 exist |
| Echo HIG section (FP14 / §8.5) | W0-3 names H1–H9 as C1/M2/C2 **work**, not polish |
| ALB-A2 | India W0-2 **first paragraph** states Arch 28 = market data; alerts stream ≠ MarketSocket |
| C2 lock | India quoted **both** viewport W-G artifacts **or** stated both unfiled; C2 remains BLOCKED if unfiled |
| Canonical draft | India APPROVED ALM §3.2 as the only wire |
| Echo / Tango / Hotel / Mike | Reports present; Tango disposed ALB-A3 |
| No **new** product code in this W0 fold | `git` for this board’s W0 commits is docs/seeds only. **Name** the existing local prototype (`AlertBuilderDialog`, adapter, `hostAlertMenu`) — do **not** treat it as C2 GO |
| **AL-B1 reachability** | Named fact in the **first evidence paragraph** after the verdict: canvas-apply menu is `reachable` \| `not-reachable` \| `unknown` **in the built member app**. Prove from (1) `HostPnLChart` `contextmenu` listener, (2) `OpfRiskAnalyzer` `onCanvasAlert` / `onPositionAlert`, (3) any off-switch flag, (4) which host `git_sha` is running. `unknown` → **BLOCKED**. `reachable` is **not** C2 GO — Coach disposes at W0-BA. Governance (frozen / not C2 GO) is a separate sentence from reachability. |

Ternary **PASS / FAIL / BLOCKED**. Never waive.

## Deliverable

`gate-reports/W0-G.md` — must include the reachability fact with the proof commands / paths.
