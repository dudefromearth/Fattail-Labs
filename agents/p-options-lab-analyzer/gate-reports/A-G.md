# A-G — Alerts polish

**Status:** **PASS**  

- `showing N of M` / count via `data-testid="analyzer-alerts-count"` (cap 20).  
- Multi-symbol cards kept; off-symbol badge `data-testid="analyzer-pos-off-symbol"`.  
- Focus syncs suite symbol when card underlying differs.  
- Raw-mark evaluate path: `evaluateAlerts(…, rawMarkForAlerts, symbol)` in OpfRiskAnalyzer (A1).
