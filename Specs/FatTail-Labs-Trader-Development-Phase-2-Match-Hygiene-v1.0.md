# FatTail Labs — Trader Development Phase 2  
## Match Hygiene — Charts · Broker Sync · Process Reports

**Status:** DRAFT — Coach review  
**Type:** Product enhancement + **architectural change** (market data review path · broker connection plane)  
**Horizon:** ~4–8 weeks (may overlap late Phase 1)  
**Value / Effort / Risk:** High / Medium–High / Medium  
**Parent:** [Trader Development Roadmap v1.0](./FatTail-Labs-Trader-Development-Roadmap-v1.0.md)  
**Related:** Trade Log I/O · Massive market data (`server/market_data`) · Member Practice Export · Privacy  

---

## 1. Summary

Phase 2 is **Match**, not Own. Goal: members **do not need a second journal** for logging friction or basic visual review — while Reports answer **process** questions, not edge theater.

| Workstream | Mode |
|------------|------|
| Static trade charts | Match |
| Broker auto-sync (1 venue first) | Match |
| Process report pack v1 | Own-flavored Match |
| ToS/CSV harden | Match / risk hedge |

**Still refuse:** tick replay, Level II, 600 P&L charts, multi-broker matrix on day one.

---

## 2. Problem

| Gap | Effect |
|-----|--------|
| Manual/CSV import only | Dual-sub to Zella/TV for auto-import |
| No underlier chart on fill | Feels incomplete vs TraderVue baseline |
| Reports thin | “Is Practice serious?” doubt |
| Sync COGS ~$1.50/connected user | Must design opt-in + disconnect |

---

## 3. Product change description

### 3.1 Trade chart review (additional feature)

**Where:** Trade drawer / detail (Trade Log); optional Journal day context.

| Capability | v1 |
|------------|-----|
| Multi-timeframe underlier OHLC (e.g. 5m / 15m / 1D) | Yes |
| Entry / exit markers from legs | Yes |
| Multi-leg: show structure window, not full options chain chart | Yes |
| SPX: honest proxy labeling if SPY used | Yes (existing Massive proxy doctrine) |
| Tick replay / DOM | **No** |

**Data:** Massive stocks/indices (and later futures underliers if needed) — reuse Strategy Lab client; **cache aggressively**.

### 3.2 Broker auto-sync (additional feature + architecture)

**Member UX:**

- Profile or Trade Accounts: **Connect broker** (OAuth)  
- Status: connected · syncing · error · disconnected  
- Last sync time; manual “sync now”  
- **CSV/manual always available**  

**Pricing / COGS:**

- Capability included for Observer trial + Navigator  
- Bill vendor **only for actively connected** identities  
- Membership end → revoke connection (no zombie COGS)  
- No separate $99 journal SKU in this phase  

**v1 scope:** **One** broker family (prefer Schwab/ToS-class given book). Expand in Phase 4.

### 3.3 Sync → Trade Log mapping (product rules)

| Rule | Detail |
|------|--------|
| `entry_source` | `automated` |
| Idempotency | External order/fill ids; skip existing |
| Multi-leg | Best-effort structure grouping; fail loud / quarantine bad groups |
| Process fields | **Not** auto-filled from broker (adherence/playbook remain human) |
| Account | Map to member_trade_log_accounts venue |

### 3.4 Process report pack v1 (product enhancement)

**Additional reports / widgets** (process-first labels):

| Report | Question |
|--------|----------|
| Adherence mix | Followed / partial / broke over window |
| Tag frequency | Process/behavior lexicon counts |
| Campaign summary | Trades + adherence in active/completed season |
| Optional: risk units | If planned risk captured — else defer Phase 3 |

**Non-goals:** Win-rate leaderboards, expectancy by hour, 50+ generic stats clones.

### 3.5 Import harden (product quality)

Continue ToS CSV + native import edge cases so **fallback stays excellent** while sync is young.

---

## 4. Architectural change

### 4.1 Broker connection plane (new)

```text
member_broker_connections
  id, identity_id, provider, external_user_id, status,
  last_sync_at, last_error, created_at, updated_at

sync_jobs / cursor state (provider-specific)
  connection_id, cursor, payload meta
```

**Worker:** scheduled sync → normalize → existing import path (`import_domain` / trade_log commit) with `entry_source=automated`.

**Privacy:** Family B; purge Practice may **disconnect** provider user; never leave paid connection after purge/churn without policy decision (default: disconnect).

### 4.2 Market data for charts

| Concern | Approach |
|---------|----------|
| Provider | Massive (existing Labs plane) |
| Storage | Short-TTL cache; do not re-pull full history per open |
| Fail loud | Stale/missing → UI error, not fake path |
| SPX | Index bars + proxy policy from Arch 18 / market_data |

**Not in Phase 2:** New Massive futures purchase unless charting future_option books is blocked (then thin ES/NQ underlier — see Phase 3).

### 4.3 Cost control

| Control | Rule |
|---------|------|
| Connected-only billing | Create provider user only after successful OAuth |
| Daily sync default | Not real-time ticks |
| Disconnect on revoke / membership end | Job + webhook if available |
| Metrics | Admin/ops: connected count × unit cost |

### 4.4 APIs (illustrative)

| Area | Endpoints |
|------|-----------|
| Connections | list / start OAuth / disconnect / sync-now |
| Charts | `GET /api/me/trade-log/trades/{id}/chart?tf=` |
| Reports | extend analytics/reports-book or new process aggregates |

---

## 5. Surfaces & acceptance

| Surface | Done when |
|---------|-----------|
| Trade detail | Chart with markers loads for equity_option (and SPX policy) |
| Accounts / Profile | Connect + disconnect + last sync visible |
| Sync | Dogfood: daily fills appear idempotently |
| Reports | Process pack widgets live |
| COGS | Only connected users incur vendor fee |

---

## 6. Dependencies

| Item | Note |
|------|------|
| Phase 1 campaign/playbook links | Preferred for campaign summary report; charts/sync can start earlier |
| Massive credentials | Existing |
| Vendor contract | SnapTrade-class or equivalent — unit = connected user |

---

## 7. Out of scope

- Second/third broker (Phase 4)  
- Tick replay, L2, T&S  
- Futures options  
- Standalone Practice SKU  
- Auto playbook adherence AI  

---

## 8. Exit criteria

1. Pilot members stay current on fills without CSV.  
2. Opening a trade shows underlier context chart.  
3. Reports answer “was I process-true?” for a window.  
4. Vendor cost trackable and limited to connected seats.  

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Multi-leg mis-group from aggregator | Quarantine + manual fix; keep CSV |
| Sync project slips | Ship charts + process reports + CSV harden anyway |
| Cost blowup | Connected-only; disconnect churn; daily not RT |
| SPX chart confusion | Proxy labels; fail loud |

---

## 10. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-2-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-2-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |

Gate prefix: **TD2-***. Prerequisite: **TD1-G** (default).

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft |
| 2026-08-07 | Linked Agent Bench plan TD2 |
