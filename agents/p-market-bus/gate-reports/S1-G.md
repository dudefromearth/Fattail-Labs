# S1-G — Sym + session (MB-P3)
**Result:** PASS (partial)  
- Store keys `mb:sym:*` and `mb:session:market_status` supported  
- WS sub can request session + symbols (snapshot from Redis or warming)  
- **Entitlement probe:** Massive stocks WS deferred to REST path until prod probe transcript filed on MiniTwo (sym feed uses REST snapshots when implemented; chain uses REST snapshot as Spec prefers)  
- Probe note: plan prefers WS *if entitled*; REST is lawful fallback without assuming entitlement  
