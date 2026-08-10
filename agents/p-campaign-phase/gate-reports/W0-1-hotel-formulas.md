# W0-1 — Hotel formulas SIGNED

**Status:** PASS  
**Date:** 2026-08-09  
**Agent:** Hotel (bench execution under Coach GO)

## Signed formulas

### Free cash (Spec §6.1)

```
free_cash = current_balance − open_cost_basis
```

- **Balance** = Funding law: start + fill P&L + cash movements (account book).  
- **Open cost basis** = sum remaining open structures on scope.  
- Negative free cash is **lawful** — plain text, no valence.  
- **Scope (OD-free-cash-scope):** campaign `account_id` bound → that book; else **identity total** free cash across modeled accounts.

### Free margin (Spec §6.2 · CP9)

```
free_margin = declared_buying_power − structure_risk_open
```

when BP posture has a value; else **null** (omit — never fabricate 0).

- **`structure_risk_open`** = sum of **defined max loss** of open structures on scope (Trade Log structural risk family).  
- **Not** broker maintenance margin. **Not** a platform margin engine.  
- API **must not** expose field name `margin_at_risk` (alias ok: `committed_risk` in schema only if India needs it; public JSON: `structure_risk_open`).

### Realized max DD% on campaign strip (P13)

```
realized_dd_pct = peak_to_trough_on_campaign_trading_curve_dollars / campaign_allocation × 100
```

- Denominator = **this campaign’s capital allocation** (same base as declared max DD%).  
- Trading curve = fill P&L stamped to this campaign in window (Funding family).  
- **Master campaign-blind DD** stays on Accounts & Capital — **not** on campaign strip.

### Prune (P10)

**No** P&L-ranked prune-candidate list in v1. Hotel signs absence as product law (Coach blessed Finding five).

## Out of scope this sign

Solved-size full calculator (Capital Z / quiet line OK later). Live BP sync.

## Implementation handoff

R1-0 · R1-1 · R1-2 own code; tests must lock field names and denominators.
