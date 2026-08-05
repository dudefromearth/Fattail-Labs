# Practice domain — single source of truth (PH1-0)

**Status:** Design — India (p-practice-harden H1)  
**Date:** 2026-07-29  
**Prerequisite:** H0 PASS  
**Parents:** Trade Log Spec v1.1 §9–10 · Journal-Retrospective Spec v0.1 · CHARTER p-practice-harden  
**Board:** `agents/p-practice-harden/` · Test bar: `TEST-STRATEGY.md`  
**Related (manual UX, 2026-08-05):** Trade Log Spec **§16** · [`15-trade-log-manual-management.md`](./15-trade-log-manual-management.md) — client match helpers must stay aligned with this domain package.

---

## 1. Problem

Three implementations of the same trading-book semantics:

| Location | What it does |
|----------|----------------|
| `web/lib/journalDayBook.ts` | `structureKey`, FIFO `matchOpenClose`, open-on-day, day book |
| `web/lib/reportsBook.ts` | synthetic realized PnL, equity/DD series, stats, distributions |
| `server/seed_reports_demo_pnl.py` | third twin of structure/match/PnL (ops seed; slightly different key shape) |

Clients fetch the full trade list (`GET /api/me/trade-log/trades`) and recompute. That:

- diverges silently when any twin drifts  
- does not scale (full-book fetch + heavy client work)  
- blocks honest Spec §10.2 read models  

**H0** fixed isolation + list N+1. **H1** moves **domain truth** to the server and makes clients consumers.

---

## 2. Non-goals (this design)

- No new product features (Retrospective content, live brokers).  
- **No intentional formula change** — port current client intent 1:1 unless Coach labels a fix in a later seed.  
- No migration required for H1 (read models over existing tables).  
- Starting capital remains a **client preference** (localStorage today); server accepts it as input, does not invent a capital ledger in H1.

---

## 3. Behavior freeze (Coach surface)

| Behavior | Decision |
|----------|----------|
| Structure matching (GCD unit qty, FIFO open→close) | **Preserve** as in `journalDayBook.ts` |
| Synthetic PnL when `pnl_amount` null | **Preserve** as in `enrichTradesWithSyntheticPnl` |
| Equity series: capital + cumulative realized; full fill points (not daily collapse) | **Preserve** |
| Drawdown % of peak; stats (win rate, Sharpe mean/std×√n, 125-bin hist) | **Preserve** |
| Day book: open / fill_open / fill_close union rules | **Preserve** |
| Multiplier $100 options / $1 equity | **Preserve** |
| Labels “estimated” / process-first copy | PH1-5 (Tango·Hotel), not formula |

**Coach ACK on this freeze** = approve “no metric change”; any later formula fix needs a labeled Behavior-change seed.

---

## 4. Server module layout

New package (name locked for PH1-1):

```text
server/trade_log_domain/
  __init__.py          # public re-exports for routes + seeds
  types.py             # TypedDict / dataclasses for Trade/Leg views (from DB rows)
  structure.py         # unit_qty, structure_key, trade_is_close, trade_expiry, net_cash_points, multiplier
  matching.py          # match_open_close → list[MatchedOpen]
  pnl.py               # effective_realized, enrich_trades (in-memory), optional orphan-close path
  day_book.py          # opens_on_day, fills_on_day, build_day_book, days_with_book_interest
  reports.py           # build_reports_book(trades, accounts, filter, starting_capital) → ReportsBook dict
  golden/              # optional small JSON fixtures for characterization (PH1-1)
```

### Rules

1. **Pure domain** — no FastAPI, no HTTP, no session. Inputs = plain dicts / dataclasses; outputs = plain structures.  
2. **Routes stay thin** — load rows (reuse batch legs), call domain, return JSON.  
3. **Seeds/import** — `seed_reports_demo_pnl.py` (and any similar) **must** call `trade_log_domain` (PH1-4); delete twin algorithms.  
4. **Identity** — domain never resolves identity; routes pass already-scoped trade lists (Family B).  
5. **Tests** — pure unit/characterization on domain first (H1 golden); thin HTTP tests for isolation + shape only (`TEST-STRATEGY.md`).

### Structure key (canonical — port from TS)

```text
{account_id}|{strategy}|{underlier}|{expiry}|{normalized_legs}
normalized_leg = {qty/g}@{strike}{right}:{asset_class}  sorted, joined by |
```

Note: `seed_reports_demo_pnl.py` currently omits `asset_class` and uses `option_right` — **TS is source of truth**; Python domain must match TS; seed is fixed in PH1-4.

---

## 5. API contract

Align with Spec §9 names where possible; extend payloads to match **as-built** Reports/Journal (Spec §10.2 is process-first and incomplete vs current UI).

### 5.1 Preferred endpoints (PH1-2)

Base: `/api/me/trade-log/` · session + activator+ · `identity_id` scoped.

#### A. Day book (Journal)

```http
GET /api/me/trade-log/analytics/day-book?day=YYYY-MM-DD&account_id=
```

| Query | Meaning |
|-------|---------|
| `day` | required, calendar day in member-local YMD (server uses date string only — same as client `ymdFromExec` slice) |
| `account_id` | optional; omit = all accounts |

**Response DTO:**

```json
{
  "day": "2026-03-14",
  "activity": [ /* DayBookItem */ ],
  "open": [ /* DayBookItem */ ],
  "items": [ /* union, de-duped */ ],
  "open_ids": [1, 2]
}
```

`DayBookItem`:

```json
{
  "trade_id": 123,
  "role": "open" | "fill_open" | "fill_close",
  "opened_on": "2026-03-10",
  "closed_on": null,
  "expires_on": "2026-03-14",
  "trade": { /* same shape as GET /trades/{id} */ }
}
```

Optional later (same domain, not required for PH1-2 if client can derive from items):

```http
GET /api/me/trade-log/analytics/days-interest?from=&to=&account_id=
→ { "days": ["2026-03-01", ...] }
```

#### B. Reports book (Reports home)

```http
GET /api/me/trade-log/analytics/reports-book
  ?account_id=          # omit or empty = all
  &starting_capital=50000
```

**Response DTO** (numeric truth; presentation strings may still be client-side):

```json
{
  "account_label": "All accounts",
  "starting_capital": 50000,
  "series": [
    {
      "t": "2026-01-02T10:00:00",
      "equity": 50100.0,
      "drawdown_pct": 0.0,
      "peak": 50100.0,
      "trade_index": 1,
      "trade_id": 42
    }
  ],
  "trade_count": 100,
  "has_pnl_data": true,
  "end_balance": 52000.0,
  "max_drawdown_pct": -0.059,
  "open_count": 3,
  "winners": 40,
  "losers": 30,
  "avg_win": 120.0,
  "avg_loss": 80.0,
  "win_loss_ratio": 1.5,
  "sharpe": 1.2,
  "sharpe_sample_size": 70,
  "stats": {
    "span_days": 120,
    "gross_profit": 1.0,
    "gross_loss": 1.0,
    "net_profit": 1.0,
    "win_rate": 57.1,
    "profit_factor": 1.2,
    "largest_win": 1.0,
    "largest_loss": -1.0
  },
  "outcome_pnls": [12.5, -3.0],
  "strategy_counts": { "BUTTERFLY": 10, "VERTICAL": 5 }
}
```

- `outcome_pnls` — realized list for client histogram (125-bin stays presentation).  
- `strategy_counts` — for strategy distribution chart.  
- Full fill series retained for equity Option-click deep links (`trade_id`).

#### C. Spec aliases (PH1-2 or PH3 honesty)

| Spec path | Implementation |
|-----------|----------------|
| `GET .../records/summary` | Thin adapter over domain aggregates + process counts; may set `pnl_sum` from effective realized |
| `GET .../records/series?metric=pnl` or `equity` | Map onto `reports-book.series` / bucket later |

**H1 minimum ship:** A + B. Spec aliases may land in same seed if cheap; else PH3 documents as-built analytics paths.

### 5.2 Explicitly **not** required in H1

- Mutating `pnl_amount` on every list (keep stored column as member/import truth; synthetic is **effective** in read models).  
- Server-side starting capital storage.  
- Pagination of series (H4).  

### 5.3 Optional enrichment on list (rejected for default)

Do **not** default-enrich `GET /trades` with synthetic PnL (payload surprise + double work). Read models own effective PnL.

---

## 6. What stays client-only

| Concern | Location |
|---------|----------|
| HIG chrome, suite nav, chart drawing, binning display | `ReportsDashboard`, `JournalCalendar`, components |
| Money/percent formatting, stat row tones | client (may map from numeric `stats`) |
| 125-bin histogram construction from `outcome_pnls` | client OK **or** domain — prefer client presentation |
| `templateLegs`, blotter display helpers | `web/lib/tradeLog.ts` |
| Starting capital localStorage | client; pass query param |
| Deep-link scroll/highlight UX | client |
| Trade sheet / toolbar | unchanged |

After PH1-3, client **must not** own:

- `structureKey` / `matchOpenClose` / `enrichTradesWithSyntheticPnl` / equity cumulation  
  (may keep thin re-exports that throw or call API only during transition; delete by PH1-G)

---

## 7. Deprecation plan

| Step | Seed | Action |
|------|------|--------|
| 1 | PH1-1 | Implement `trade_log_domain` + golden tests vs fixed fixtures (port from TS examples) |
| 2 | PH1-2 | Ship `analytics/day-book` + `analytics/reports-book`; isolation tests |
| 3 | PH1-3 | Wire Reports + Journal to APIs; remove dual client domain (or `# deprecated` stubs that error in non-test) |
| 4 | PH1-4 | Seeds call domain; delete twin in `seed_reports_demo_pnl` |
| 5 | PH1-5 | Copy: estimated PnL, illustrative strikes |
| 6 | PH1-G | Delta: golden HTTP or domain fixture match; no client recompute path in production bundles for match/PnL |

**Fallback:** none in staging/production. Dev may keep temporary dual only if Charlie flags unblock — default is hard cutover with tests.

---

## 8. File map (implementation touch list)

### Create

- `server/trade_log_domain/**`  
- `server/tests/test_trade_log_domain.py` (pure)  
- Optional: `server/tests/test_trade_log_analytics_api.py` (HTTP thin)

### Modify

- `server/routes/trade_log.py` (or package split later in H2) — register analytics routes  
- `server/seed_reports_demo_pnl.py` — import domain  
- `web/components/reports/ReportsDashboard.tsx` — fetch reports-book  
- `web/components/journal/JournalCalendar.tsx` — fetch day-book / days-interest  
- `web/lib/reportsBook.ts` — presentation only after wire  
- `web/lib/journalDayBook.ts` — presentation / date UI only after wire  
- Possibly `web/lib/tradeLogApi.ts` early (or PH2-2)

### Do not touch (H1)

- Blotter ToS visual rules  
- Retrospective content  
- Migrations unless unforeseen  

---

## 9. Intelligent tests (H1)

Per `TEST-STRATEGY.md`:

| Test | Kind |
|------|------|
| Golden: structure keys + FIFO match on fixed multi-leg book | pure domain |
| Golden: synthetic PnL numbers match frozen expected $ | pure domain |
| Golden: open-on-day set for a calendar day | pure domain |
| Golden: equity series points (capital, trade_ids, DD) | pure domain |
| HTTP: identity A cannot read B’s analytics | isolation |
| HTTP: reports-book shape keys present | thin contract |
| **No** re-test of HIG chart rendering | refuse |

Characterization source: small fixture of open/close verticals + one butterfly scale (3-wide), ported from known client outputs (capture once in PH1-1).

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Silent formula drift during port | Golden fixtures; Delta H1 fails if series diverge from fixture |
| Date timezone (server UTC vs client local YMD) | **Preserve** client rule: `exec_at` string first 10 chars if ISO-shaped; document as invariant |
| Large books still full scan server-side | Correctness first; H4 filters if Coach GO |
| Spec §10.2 vs as-built Reports | PH3 honesty; analytics paths are as-built; records/* alias or document |

---

## 11. Reviewer verdicts

### Alpha (feasibility)

**Verdict: APPROVED**

- Package boundaries are implementable without schema change.  
- Batch legs (H0) compose with domain (load trades+legs → domain).  
- Two GET analytics routes keep route surface small; seeds can import pure package.  
- Timezone rule (string YMD) is explicit — good.  
- PH1-1 can land domain without HTTP; PH1-2 wires routes.

### Charlie (client impact)

**Verdict: APPROVED**

- Clear cut: Reports/Journal become API consumers; presentation stays.  
- `starting_capital` query matches localStorage UX.  
- Deep-link `trade_id` on series preserved.  
- Transition: PH1-3 single cut preferred over long dual path.  
- File touch list matches current god components (H2 still splits UI later).

### Coach (behavior / metric surface)

**Verdict: APPROVED** (behavior freeze)

- No intentional formula or UX change in H1 design.  
- Synthetic PnL remains estimated effective value in read models, not silent DB rewrite.  
- Any later formula “fix” requires a labeled seed + Coach.

---

## 12. Juliet next

On this note + three APPROVED:

1. Mark PH1-0 done on board.  
2. Open **PH1-1** Alpha domain module + golden tests.  
3. Do not start PH1-3 until PH1-2 contract is live.

---

## 13. One-page sequence

```text
PH1-0 design (this doc) ✅
  → PH1-1 trade_log_domain + goldens
  → PH1-2 analytics/day-book + analytics/reports-book
  → PH1-3 Charlie wire; delete client domain twins
  → PH1-4 seeds use domain
  → PH1-5 copy pass
  → PH1-G Delta
```
