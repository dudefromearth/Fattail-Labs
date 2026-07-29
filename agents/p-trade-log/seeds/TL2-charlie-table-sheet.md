# Seed TL2 — Charlie + Echo: table-first UI + slide-out

**Project:** p-trade-log · **Agents:** Charlie (implement), Echo (HIG review)  
**Depends on:** TL1 API available  
**Gate:** Spec §3 shell + §5 table  

## Objective

Replace form-first page with **log table** default, account/venue switcher, right **Trade sheet** (create/edit), strategy templates (Basic + Spreads + STOCK/FUTURE/CRYPTO), stay-put saves.

## In scope

- `web/app/app/trade-log/page.tsx`  
- `web/components/trade-log/*` (new)  
- `web/lib/tradeLog*.ts` as needed  
- HIG tokens only  

## Out of scope

- Import adapters UI full pipeline (coordinate with TL3)  
- Positions mode (TL4)  
- Records pages (totals/charts app)  

## Completion criteria

- [ ] No form above the fold on load  
- [ ] Butterfly renders as grouped block  
- [ ] Sheet open/close; path stays `/app/trade-log`  
- [ ] Account create requires broker or sim  
- [ ] Echo sign-off on density/contrast (note in gate report)  
- [ ] `npm run build` clean  

## Gate

Screenshot + build evidence for Delta.
