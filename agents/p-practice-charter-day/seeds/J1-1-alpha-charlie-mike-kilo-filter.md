# J1-1 — Trade Log Adhere filter (F2) + Family B

**Agents:** Alpha · Charlie · Mike · Kilo  
**Phase:** J  
**Blocked by:** J1-0 · W0-G  

## Intent

Query param `adherence_mode=drift` (or `adherence_not=followed,partial`) = meter complement. Clearable UI chip. Window = adherence meter window when deep-linked from Journey.

## Param contract (normative)

| Param | Values | Meaning |
|-------|--------|---------|
| `adherence_mode` | `drift` \| omit | `drift` = adherence NOT IN (followed, partial) — includes broke + unknown |
| `from_day` / `to_day` | ISO dates optional | Meter window when provided from Journey |
| Clear | remove params | Full blotter |

## Files

- `server/routes/trade_log/trades.py` · `common.py`  
- `web/lib/tradeLogApi.ts` · `web/app/app/trade-log/page.tsx` · toolbar  
- Tests: filter/meter parity (Kilo); Family B (Mike)  

## Done when

- [ ] Server filter + clearable UI  
- [ ] Kilo parity tests  
