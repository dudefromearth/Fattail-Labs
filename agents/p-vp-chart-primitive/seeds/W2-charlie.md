# W2 — Lifecycle hygiene

**Depends:** W1-G PASS  
**Gate:** W2-G  
**Law:** `Specs/AZ-VP-9-A23.md`

## Do
- On symbol or TF change: clear primitive bins (or mark stale) **before** the new `/range` fetch. No ghost histogram.
- Fix `inflightRef`: a band request landing during an open request cannot drop a needed refetch (queue or re-check on completion).
- Strict Mode: primitive attaches once per live chart; `chart.remove()` cleans it.

## Gate W2-G
Rapid symbol flips and TF changes show either fresh bins or an explicit empty state — never the previous symbol's histogram.
