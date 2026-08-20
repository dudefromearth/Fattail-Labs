# Seed C1-3 — Kilo AT-ALB (non-canvas)

**Project:** p-alerts  
**Agent:** Kilo  
**Phase:** C1  
**Depends:** C1-1  
**Law:** AZ-ALB §9  
**Gate it feeds:** C1-G

## ATs this packet

| AT | Criterion |
|----|-----------|
| AT-ALB-1 | **+** opens Builder (Price, value = Spot) |
| AT-ALB-5 | Save through hook `source_system: analyzer_risk_graph` **and** `suite: options_lab` + `severity: medium` |
| AT-ALB-6 | Algo / BE / Trail / 0DTE: visible, Save off |
| AT-ALB-7 | Holder: no helper essay; + visible; height ~3–4 cards; scroll |
| AT-ALB-10 | Position alert whose card is gone: listed Unbound, never Active. Hidden stays bound |
| **AT-ALB-11** | Kit Modal + SegmentedControl + IconButton xmark + Button. No close-dot. No `bg-[#2c2c2e]`. |
| **AT-ALB-12** | 44pt: Type, chips, steppers, sub-tabs, holder cards, **+** |
| **AT-ALB-13** | Empty holder: no copy, no EmptyState |
| **AT-ALB-14** | Chrome lint PASS (plan §8.5 command). Payload `color` hex exempt. |

Do **not** claim AT-ALB-2, 3, 4, 8, 15 (C2) or AT-ALB-9 (Packet S).

**HIG lint (FP14 / §8.5):** ripgrep C1 files for `bg-zinc-`, `text-zinc-`, `bg-[#`, `text-[#`, `from-[#`, `h-3 w-3`. Fail the packet if chrome hits remain. Empty holder must **not** gain an `EmptyState` “fix.”

## Files in scope

`web/lib/alerts/` tests · dialog/holder tests. Not `HostPnLChart` unless a read-only import already exists — do not add one.

## Done when

`gate-reports/C1-3-kilo.md` with command + output per AT **and** the raw-value lint.
