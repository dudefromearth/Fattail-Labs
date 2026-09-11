# PC9b — Promotion ask (closed)

**Revision:** 3  
**Status:** **RESOLVED** — Coach 2026-09-11: mapper only, no schema. Snapshot deferred to the Trade Log refactor.  
**Date:** 2026-09-11  
**Supersedes:** revision 2 (header said RESOLVED; body still solicited a pick)  
**Machine:** Coach's MacBook (dev)

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-09-11 | Ask. Options (a) no SQL / (b) additive column / (c) dated backup. Recommendation (b). Nothing executed. |
| 2 | 2026-09-11 | Coach: Trade Log is the next project. No column. Mapper landed `0f5d921`. PC-LIFE-7 → that refactor. |
| 3 | 2026-09-11 | Body rewritten to past tense. Rev 2 header said RESOLVED while body still solicited a pick. |

This is a **record of a decision already made.** It is not an ask. PC9b is gated and closed.

---

## What the packet did

PC9b landed as mapper-only at `0f5d921` (`feat(analyzer): promotion mapper from lockSource, no schema (PC9b)`).

- `order_type` from `lockSource` — a member limit records a limit (`LMT`); a natural mid records that no limit was set (`MKT`). Hardcoded `LMT` is gone.
- Stored `entry_price` is not emitted as a fill (`fill_price` is 0). Package current price at Log is `net_price` — the same number a script copy would have carried (AT-PC-54).
- Leftover `contracts` is not a multiplier. Actual `legs.quantity` (PC2 already moved counts onto the legs).
- Entry time is the Log clock (`exec_at`). Residual legs do not block Log. `tmActive` AND `!rehearsal` — both gates.

Spec §9 **Promotion mapper** (PC-LIFE-10) is closed. AT-PC-46, 07, 13, 14 and 54 as scoped.

`migrations/152_analyzer_promotion_snapshot.sql` was **not** written and is **not** to be written under this program.

---

## What was considered — not chosen

These options were on the table in revision 1. Coach did not pick any of them as the schema path.

**(a) No SQL.** Put the snapshot in `setup_md`. Schema untouched. Mixes process notes with structure.

**(b) Additive nullable column. No backup. No backfill.** `ALTER TABLE … ADD COLUMN analyzer_snapshot JSON NULL`. Revision 1 recommended this. **Not chosen.**

**(c) PC2 shape transferred.** Dated backup table of `member_trade_log_trades`, written once, then (b). Restore is not one-step the way localStorage was. **Not chosen.**

---

## What was decided and why

**No column.** The Trade Log already carries `strategy`, and Coach is refactoring it as the next project. A JSON snapshot bolted onto `member_trade_log_trades` would be decided under a gate and undone in the next program.

PC-LIFE-7 specified a snapshot for data the schema mostly already carries. Six of eight fields are stored or derivable:

| PC-LIFE-7 field | Home today |
|-----------------|------------|
| Catalogue name | `member_trade_log_trades.strategy` |
| Normalized ratio | Derivable from `legs.quantity` (PC2 GCD) |
| POS | Derivable — GCD of those quantities |
| `lockSource` | Coarse: mapper `order_type` LMT vs MKT |
| Basis at Log | `trades.net_price` |
| AnalyzerPosition id | Reverse only: `tradeLogTradeId` on the card |
| CHECK PRICE state | Not stored |
| Residual-leg state | No home — the only genuinely new fact |

That is the Spec being over-specified, not the build falling short. Logged as **D-PC-8**. Flag for **v1.3**.

---

## Where the open item lives now

Spec §9 **Promotion snapshot** (PC-LIFE-7) is deferred, with a named home — not a gap on this board.

- Carry-forward (four findings): `agents/p-trade-log/PC-LIFE-7-carry-forward.md`
- Divergence: `agents/p-options-lab-position-control/DIVERGENCES.md` **D-PC-8**
- Spec flag: **v1.3**, once the Trade Log refactor settles what that table should hold

PC0–PC9b are gated and closed. Nothing deploys.
