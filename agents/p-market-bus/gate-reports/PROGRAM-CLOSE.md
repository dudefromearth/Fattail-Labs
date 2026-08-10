# Market Bus program close

**Date:** 2026-08-10  
**Result:** COMPLETE for independent testing  

## Delivered

| Phase | Item |
|-------|------|
| W0 | Spec GO, O1–O6 Accept, gate reports |
| R | Redis store, singleflight, ladder prefer Redis |
| F | `chain_feed` module |
| S | `sym_feed` + market status; REST (WS probe documented) |
| T | `WS /api/me/market/stream` + `web/lib/market/*` |
| C | Options Lab uses `useOptionChainBus` (WS + poll fallback) |
| K | `scripts/mb_at_evidence.py` ALL PASS; scale smoke |
| Z | `infra/deploy.md` Market Bus section; launchd plist examples |

## Enable

```bash
export LABS_MARKET_BUS=1
export REDIS_URL=redis://127.0.0.1:6379/0
# API + optional:
# python -m market_data.chain_feed --interval 2
# python -m market_data.sym_feed --interval 5
```

## Out of scope (by Spec)

- Live member header UI  
- OD-nav catalog rename  
