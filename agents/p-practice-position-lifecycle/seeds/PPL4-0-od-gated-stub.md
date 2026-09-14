# PPL4-0 — Import end-state (OD-gated stub)

**Project:** Practice Position Lifecycle  
**Agent:** Juliet (does not execute; sequences when ODs dispose)  
**Depends:** PPL3-G **and** Coach OD ticks  
**Feeds:** PPL4-G

## Intent

Do **not** start because PPL3 passed. Split when Coach disposes:

| Seed (write when OD lands) | OD | Job |
|----------------------------|----|-----|
| PPL4-1 Alpha window | **OD-9** | ALTER `member_trade_log_imports` from/to. Derivation: explained boundary. NULL ≠ unbounded |
| PPL4-2 Charlie/Echo copy | **OD-21** | Member tokens. Machine keys may already exist |
| PPL4-3 Alpha declarations | **OD-22** | New object, never a fake fill. Privacy DS-4. Mike isolation |
| PPL4-4 Alpha+Kilo hold | **FI-PPL-1** | One answer blotter vs day-book. Number stays 30 |
| PPL4-5 C2-4 label | — | `synthetic` + `entry_source` only. FI-PPL-2 out unless adopted |

## Files in scope

None until the OD-specific seed exists.

## Out of scope

IB adapter. Matcher rewrite. `close_kind` unless FI-PPL-2 adopted. Import Manager restyle.

## Done when (this stub)

Juliet refuses to fire PPL4 packets while OD-9 / 21 / 22 / FI-PPL-1 are OPEN. Board row stays **blocked**.
