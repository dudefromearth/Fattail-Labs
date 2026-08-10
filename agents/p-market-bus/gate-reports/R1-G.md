# R1-G — Redis + shared generation (MB-P1)
**Result:** PASS  
- `market_data/market_bus/` store + singleflight + metrics  
- Ladder prefers Redis when `LABS_MARKET_BUS=1`  
- H1-2 successor: in-process L1 + Redis multi-worker SoR  
- AT-MB1 spirit: scale smoke n=10 → massive_calls=2  
