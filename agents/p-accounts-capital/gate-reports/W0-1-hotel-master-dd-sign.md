# W0-1 — Hotel master-DD sign

**Status:** PASS  
**Date:** 2026-08-09  
**Agent:** Hotel (session execution under Coach GO)

## Sign-off: Funding Spec v0.2 §3.4

**SIGNED.** Dollar meeting point is trading-correct:

| Quantity | Definition |
|----------|------------|
| `realized_dd_dollars` | On **trading curve** only: `cum = Σ fill P&L` (all accounts, chronological); `peak = max cum`; `dd_$ = peak − cum`; take max over path |
| `tolerance_budget_dollars` | If form=percent: `(value/100) × total_net_capital` (balance curve, as-of). If form=dollars: value as-is |
| Witness | Quiet when `realized_dd_dollars > tolerance_budget_dollars` |

**Why not % of trading peak vs % of capital:** mismatched denominators after deposits/withdrawals; dollar comparison is the only honest meeting point.

**Trading curve = Σ fill P&L only (starts at 0):** SIGNED. Starting balances and cash movements are capital facts, not trading outcomes — excluding them from the performance curve prevents false recovery / false drawdown.

## OD-T

**Default for ship: percent** of total net capital. Schema keeps form flag for absolute dollars later.

## Solved-size formula (Z1-0)

**DEFER to Z1-0** after composition lands. Placeholder doctrine only: size from allocation × latitude (Hotel proposes concrete fractional formula in Z1-0). Not blocking W0-G or F1-2 characterization of curves/DD.

## Kilo freeze

F1-2 may freeze characterization on §3.4 as written.
