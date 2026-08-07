# Trader Development Phase 2 — Agent Bench Plan

**Program:** [`agents/p-trader-development/`](../agents/p-trader-development/)  
**Full plan:** [`Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](./Trader-Development-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1.0.md`](../Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1.0.md)  
**Type:** Product + architecture (Match hygiene)  
**Gate prefix:** `TD2-*`  
**Prerequisite:** TD1-G preferred for campaign reports; charts/sync may start after TD1-1 if Coach allows (default: after TD1-G)

---

## Mission

**Relative parity** for logging friction: static **trade charts**, **one-broker auto-sync**, **process report pack** — so members need not dual-sub for basic journal hygiene.

**Mode:** Match (charts, sync) · Own-flavored reports · Refuse replay / multi-broker / L2.

---

## Critical path

```text
TD2-0 Coach vendor/COGS
  → TD2-1 India · TD2-2 Mike
  → (TD2-3/4 charts ‖ TD2-5/6 sync ‖ TD2-7 reports) → TD2-8 Kilo → TD2-G
```

Sync is long pole; **do not block charts/reports** on sync if capacity allows parallel.

---

## Seeds

| Seed | Agent | Work | Completion criteria |
|------|-------|------|---------------------|
| **TD2-0** | Coach | Vendor + COGS + one-broker choice | Written GO; connected-only policy |
| **TD2-1** | India | Connection plane; chart API; process report defs | Spec-complete contracts |
| **TD2-2** | Mike | Token storage; disconnect on churn/purge | Threat model; no secret leak |
| **TD2-3** | Alpha | Chart endpoint + Massive cache | Fail loud stale; SPX proxy honesty |
| **TD2-4** | Charlie | Trade drawer chart + markers | Equity_option path proven |
| **TD2-5** | Alpha | OAuth + sync worker → import path with `entry_source=sync`; migration + **Trade Log Spec catalog amend** (v1.2 or §17) + chip + DL entry | Idempotent; catalog docs land same PR body |
| **TD2-6** | Charlie | Connect / disconnect / last sync UI | Errors human-readable |
| **TD2-7** | Alpha+Charlie | Process reports: adherence, tags, campaign | No win-rate hero |
| **TD2-8** | Kilo | Sync idempotency; isolation; chart tests | pytest + curl evidence |
| **TD2-9** | Foxtrot | Stage env keys when needed | Deploy notes |
| **TD2-G** | Delta | Match hygiene evidence | Dogfood sync + chart + reports |

---

## Invariants

- One broker family only.  
- Daily (or few/day) sync — not tick RT.  
- `entry_source=automated`; process fields not auto-filled.  
- Connected-only vendor billing.  
- Multi-leg quarantine on bad groups.  
- No Level II / T&S / replay.

---

## Exit (TD2-G)

1. Pilot connection stays current without CSV.  
2. Trade detail shows underlier chart.  
3. Process report pack answers adherence/tags/season.  
4. COGS metric: connected users only.  
