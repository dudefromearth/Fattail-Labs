# W0-2 — India schema map

**Status:** PASS  
**Date:** 2026-08-09  
**Agent:** India (session under Coach GO)

## OD-5 (wrap tracking)

**Default for ship: `snapshot`** at compose/amend time.  
Live-tracking deferred (would nullify per-source overcommit and claim-age).

## OD-F5 (starting balance as first movement)

**Keep** `starting_balance` column on accounts v1. Unification optional later — not blocking.

## Tables / columns (indicative migration order)

### 1. `member_capital_prefs` (identity-level)

| Column | Type | Notes |
|--------|------|--------|
| identity_id | PK/FK | Family B |
| tolerated_master_drawdown | DECIMAL | value |
| tolerated_master_drawdown_form | ENUM('percent','dollars') | default percent |
| buying_power_posture | ENUM('arbitrary','self_report','live_sync') | live_sync config later |
| buying_power_value | DECIMAL NULL | |
| buying_power_as_of | DATETIME NULL | |
| balances_confirmed_at | DATETIME NULL | staleness confirm |
| export_key | VARCHAR | pack |
| created_at / updated_at | | |

### 2. `member_trade_log_accounts` (additive)

| Column | Notes |
|--------|--------|
| starting_balance | DECIMAL NULL → require on capital path; unentered = gap not zero |
| (existing label, broker, status, …) | unchanged |

### 3. `member_account_cash_movements` (new)

| Column | Notes |
|--------|--------|
| id, identity_id, account_id | |
| amount | signed; 0 rejected at API |
| occurred_at, recorded_at | backdate lawful |
| note | optional |
| reverses_movement_id | NULL or FK self |
| export_key | |

Append-only; reverse via new row.

### 4. `member_practice_campaign_funding` (composition)

| Column | Notes |
|--------|--------|
| id, identity_id, campaign_id | |
| mode | ENUM('wrap_one','wrap_many','proportion') |
| account_id | FK account |
| amount | NULL unless proportion $ |
| pct | NULL unless proportion % |
| tracking | ENUM('snapshot','live') default **snapshot** |
| snapshot_amount | set when tracking=snapshot |
| snapshot_at | |
| export_key | |

wrap_one: one row, whole account (no partial).  
wrap_many: N rows, whole each.  
proportion: amount and/or pct.

### 5. Ledger reverse (Amendment Option A soft-delete)

**Data migration sketch (L1-0):**

1. Identify furniture: `is_ledger=1` OR known furniture title patterns.  
2. For trades with `practice_campaign_id` in that set:  
   `SET practice_campaign_id=NULL, stamped_by=NULL`.  
3. Soft-delete furniture campaigns: e.g. `status='abandoned'` + `is_ledger=1` retained for export_key **or** move to tombstone flag `is_tombstone=1` never stampable.  
4. Prefer **not** hard-delete until export_key audit proves zero pack refs.  
5. Stop all `ensure_ledger_campaign` on account create / list GET.

### Derived (no tables)

- `current_balance` = start + Σ pnl + Σ movements  
- `total_net_capital` = Σ balances  
- trading curve = Σ fill pnl only (identity-wide chronological)  
- realized_dd_dollars, tolerance_budget_dollars per Funding §3.4  
- overcommit ratios at read  

### Migration naming (filename order)

```
110_capital_prefs.sql
111_account_starting_balance.sql
112_account_cash_movements.sql
113_campaign_funding_composition.sql
114_ledger_furniture_reverse.sql
```

(Adjust if 110+ already used at L1 time.)

## Dual-truth ban

- No stored equity series SoR  
- No stored capital-witness event log  
- Master DD never joins `practice_campaign_id`
