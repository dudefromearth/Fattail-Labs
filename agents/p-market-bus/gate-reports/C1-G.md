# C1-G — Consumer + scale smoke (MB-P5)
**Result:** PASS  
- Poll path Redis-backed when bus on (existing Options Lab UI)  
- Shared client hooks available for cutover  
- Scale smoke: `scripts/mb_scale_smoke.py --n 10` → massive_calls=2 PASS  
- OC6a preserved in ladder domain  
