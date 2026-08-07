# FatTail Labs — Trader Development Phase 2
## Match Hygiene — Charts · Broker Sync · Process Reports

**Status:** DRAFT v1.1 — Claude first pass + **OD locks applied** (Decision Addendum); formal BUILD AUTHORITY pending Coach stamp  
**Supersedes:** v1.0 (2026-08-07 draft) — all v1.0 content preserved; deltas in §13  
**Type:** Product enhancement + **architectural change** (market-data review path · broker connection plane)  
**Horizon:** ~4–8 weeks (may overlap late Phase 1)  
**Value / Effort / Risk:** High / Medium–High / Medium  
**Parent:** [Trader Development Roadmap v1.1](./FatTail-Labs-Trader-Development-Roadmap-v1_1.md)  
**OD authority:** [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)
**As-built contracts:** Trade Log Spec **v1.1** (import pipeline, idempotency keys, **locked `entry_source` catalog §4.4**, accounts/venues, `records/summary|series`, `analytics/reports-book`) ·
Massive market-data plane (`server/market_data`, Strategy Lab client, SPX proxy doctrine) ·
Member Practice Export **v1.3** · Member Data Privacy (Family B, purge)
**Doctrine:** Match, not Own — hygiene so members don't dual-subscribe · process questions, not edge theater · connected-only COGS · fail loud

---

## 1. Goal statement

Phase 2 removes the two reasons a member keeps a second journal: **logging friction** and
**basic visual review**. Fills arrive without CSV (one broker family, opt-in, disconnectable);
opening a trade shows the underlier's honest context chart; and Reports answers "was I
process-true this window?" with a small process pack. Every capability is parity hygiene —
none of it becomes the story, and none of it invents an edge-analytics surface. The phase is
reliable when sync is idempotent, charts fail loud on stale data, and vendor cost tracks
connected seats only.

| Workstream | Mode |
|------------|------|
| Static trade charts | Match |
| Broker auto-sync (1 venue) | Match |
| Process report pack v1 | Own-flavored Match |
| ToS/CSV import harden | Match / risk hedge |

**Still refuse:** tick replay, Level II, 600 P&L charts, multi-broker matrix on day one.

---

## 2. User journeys

### 2.1 Charts — happy path

1. Member opens a completed butterfly in the trade sheet → **Chart** section renders
   underlier OHLC (5m / 15m / 1D toggle) for the hold window ± context margin.
2. Entry/exit markers derived from legs' `exec` times sit on the price path.
3. Multi-leg: one chart per **structure** (the underlier), never per leg; the structure
   window (strikes band) is drawn as a shaded zone — not a P&L curve.
4. SPX book charted via proxy → chart is **labeled** with the proxy per Massive doctrine.

### 2.2 Sync — happy path

1. Member opens broker connections (OD-2.4 **LOCKED**: **status in Practice chrome**;
   **management in Profile/settings**): taps **Connect broker** → OAuth → returns
   `connected`.
2. Next scheduled sync (daily default) pulls fills → normalize → existing import path →
   trades appear in blotter with the correct provenance chip (§5.3).
3. Status surface shows `connected · last sync · sync now`; manual **Sync now** works.
4. Member disconnects → status `disconnected`; vendor identity revoked; CSV path untouched.

### 2.3 Failure paths

| Failure | Required behavior |
|---------|-------------------|
| Bars missing/stale for window | Chart area shows explicit error/stale notice — **never** an interpolated or partial path presented as complete |
| Sync token expired / vendor error | Status `error` + reason + reconnect CTA; no silent retry loop burning quota |
| Multi-leg fills that won't group | **Quarantine**: land as reviewable ungrouped fills flagged for manual fix — never guess a structure, never drop |
| Duplicate delivery from vendor | Idempotent skip via external order/fill ids (Trade Log C-6 pattern) |
| Membership ends | Connection revoked by job — no zombie COGS (R-2.4) |
| Purge Practice data | Connection disconnected (default policy; Privacy Family B) |

---

## 3. Product design

### 3.1 Trade chart review

**Where:** trade sheet/detail; optional Journal day context (read-only embed).

| Capability | v1 |
|------------|-----|
| Multi-timeframe underlier OHLC (5m / 15m / 1D) | Yes |
| Entry/exit markers from legs | Yes |
| Multi-leg: structure window shading, not options-chain charting | Yes |
| SPX honest proxy labeling | Yes (existing Massive proxy doctrine — cite the doctrine doc in implementation seed, do not restate) |
| Tick replay / DOM / L2 | **No** (Refuse) |

**Data:** Massive stocks/indices via the existing Strategy Lab client; **aggressive short-TTL
cache** keyed by (symbol, tf, window); a sheet open never re-pulls full history.

### 3.2 Broker auto-sync

**Scope:** **one** broker family in v1 — **OD-2.1 LOCKED:** first venue family =
**Schwab / thinkorswim-class** (member book). Aggregator: SnapTrade-class (or equivalent)
with connected-user billing; exact vendor named in TD2-0 seed when contracted. Expansion is
Phase 4 §3.1.

**Member UX:** Connect (OAuth) · status (`connected · syncing · error · disconnected`) ·
last-sync time · Sync now · Disconnect. **CSV/manual always available** — sync is a
convenience layer over the same import path, never a replacement.

**Pricing/COGS (kept from v1.0):** capability included for Observer trial + Navigator; vendor
billed **only for actively connected** identities; membership end → revoke; **no separate
journal SKU** in this phase.

### 3.3 Sync → Trade Log mapping

| Rule | Detail |
|------|--------|
| Provenance | **OD-2.2 LOCKED — `entry_source = sync`** (fourth catalog value). Never `manual`, never `import`, never conflate with Strategy Lab `automated` |
| Idempotency | External order/fill ids per Trade Log unique key; replays skip |
| Multi-leg | Best-effort structure grouping via existing structure-key engine; failures quarantine (fail loud), never guess |
| Process fields | **Never auto-filled** — adherence, playbook, campaign, notes remain human. The broker knows fills; only the trader knows the covenant |
| Account | Map to `member_trade_log_accounts` venue; create-on-first-sync only with member confirmation (no silent account creation) |

### 3.4 Process report pack v1

Process-first labels; builds on as-built `records/summary` (already returns `by_adherence`,
`by_strategy`, `by_account`) and Phase 0 tag counts.

| Report | Question | Source |
|--------|----------|--------|
| Adherence mix | Followed / partial / broke over window | `by_adherence` + `adherence_rate` series (as-built) |
| Tag frequency | Process/behavior lexicon counts | Phase 0 filter contract |
| Campaign summary | Trades + adherence in active/completed season | Phase 1 links (graceful absence if Phase 1 incomplete — widget hidden, not broken) |
| Risk units (optional) | If planned risk captured — else defer Phase 3 | Phase 3 schema |

**Non-goals:** win-rate leaderboards, expectancy-by-hour, generic 50-stat clones. P&L opt-in
rules from Trade Log §10.2 unchanged; tag adjacency rule from Phase 0 §6.2 binds here too.

### 3.5 Import harden

Continue ToS CSV + native edge cases (malformed rows, partial fills, timezone edges) so the
fallback stays excellent while sync is young. Each fixed edge gets a fixture test.

---

## 4. Architecture

### 4.1 Broker connection plane (new)

```text
member_broker_connections
  id, identity_id, provider, external_user_id,
  status ENUM(connected,syncing,error,disconnected),
  last_sync_at NULL, last_error NULL, created_at, updated_at

member_broker_sync_state          -- provider-specific cursor/meta
  connection_id FK, cursor, payload_meta, updated_at
```

**Worker:** scheduled (daily default) → fetch → normalize → **existing import commit path**
(same domain code as file import — one pipeline, two doors) with sync provenance (§5.3).
Secrets/tokens per platform config doctrine: config-driven, never hardcoded, fail loud on
missing.

**Privacy:** Family B. Purge Practice → disconnect provider identity (default). Membership
end → revoke. No connection survives without an explicit logged policy decision.

### 4.2 Market data for charts

| Concern | Approach |
|---------|----------|
| Provider | Massive (existing Labs plane) — no new vendor |
| Storage | Short-TTL cache; no full-history re-pulls per open |
| Fail loud | Stale/missing → explicit UI error, never fake path |
| SPX | Index bars + proxy policy per existing doctrine |
| New Massive futures purchase | **Not in Phase 2** unless charting `future_option` books is blocked (then thin ES/NQ — Phase 3 §3.6) |

### 4.3 Cost control (verifiable, not aspirational)

| Control | Rule | Delta evidence |
|---------|------|----------------|
| Connected-only billing | Provider identity created only after successful OAuth | Vendor seats ≈ members with live connection |
| Error grace | Status `error`: recover within **7 days** or auto-disconnect + revoke | No permanent billable zombie error seats |
| Daily sync default | No real-time ticks | Worker schedule config |
| Disconnect on revoke/membership end | Job (+ webhook if vendor offers) | Test: end membership fixture → connection row `disconnected` + vendor revoke call logged |
| Ops metric | Admin/ops surface: connected count × unit cost | Rendered number matches query |

### 4.4 APIs

| Area | Endpoints |
|------|-----------|
| Connections | `GET/POST /api/me/broker-connections` · `POST .../{id}/sync-now` · `DELETE .../{id}` (disconnect) · OAuth start/callback |
| Charts | `GET /api/me/trade-log/trades/{id}/chart?tf=5m\|15m\|1d` |
| Reports | Extend `records/summary` / `reports-book` params or thin process aggregates — reuse the Phase 0 mechanism decision (OD-0.2), do not fork it |

---

## 5. Contract findings (blocking-level flags for Coach)

### 5.1 One import pipeline

Sync **must** enter through the existing import/commit domain path (structure keys, C-1..C-9
invariants, idempotency). A parallel "sync writer" is the second-store-of-truth failure mode.
This is stated as invariant R-2.1, not left to implementation taste.

### 5.2 Account mapping consent

Auto-creating accounts from vendor data would violate the "no silent defaults" posture —
first sync proposes the mapping; member confirms once; subsequent syncs use it.

### 5.3 `entry_source` — **OD-2.2 LOCKED = `sync`**

Trade Log v1.1 catalog gains a fourth value:

| Value | Meaning |
|-------|---------|
| `manual` | Member entry |
| `import` | File / pack import |
| `automated` | Strategy Lab runtime / Labs automations |
| **`sync`** | **Broker auto-sync channel** (this phase) |

**Same body of work (not “later”):**

1. Migration adding `sync` to DB/check constraints as needed  
2. UI provenance chip  
3. **Trade Log Spec catalog amend** — v1.2 header bump **or** normative §17 amendment to §4.4 `entry_source` table (Invariant #6 documentation parity)  
4. Decision-log entry  

**Do not** reuse `automated` for broker fills.

---

## 6. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-2.1 | Sync writes only through the existing import domain path; no second fill store, no bypass of structure/idempotency rules |
| R-2.2 | Idempotency: any vendor payload replayed N times yields identical DB state |
| R-2.3 | Quarantine over guess: ungroupable multi-leg lands flagged for manual review; zero silent structure inference |
| R-2.4 | COGS: no `connected` vendor identity without a live membership + explicit member opt-in; revocation is tested, not assumed |
| R-2.5 | Charts fail loud on missing/stale bars; SPX proxy always labeled |
| R-2.6 | Process fields never machine-filled |
| R-2.7 | CSV/manual paths regression-green throughout (sync may slip; fallback may not) |
| R-2.8 | Tokens/secrets in config only; missing config aborts, never defaults |

---

## 7. Acceptance criteria (Delta-checkable)

1. Chart renders for an `equity_option` structure with entry/exit markers on all three timeframes; cache hit on immediate re-open (log/metric evidence). (UI + logs)
2. SPX book chart carries the proxy label. (UI walk)
3. Missing-bars fixture → explicit error state, no partial path. (fixture + UI)
4. OAuth connect → `connected`; dogfood daily fills appear idempotently; replayed payload fixture changes nothing. (pytest + curl)
5. Ungroupable multi-leg fixture → quarantined + surfaced for manual fix; nothing guessed. (pytest + UI)
6. Disconnect and membership-end fixtures revoke vendor identity; admin metric shows connected count × unit cost. (pytest + UI)
7. Synced trades carry `entry_source = sync` + chip; never `manual`, never `import`, never `automated`. (curl)
8. Process pack: adherence mix + tag frequency render from fixtures; campaign summary renders when Phase 1 data present and hides cleanly when absent. (UI + fixture)
9. No new report correlates tags or sync data with P&L/win-rate beyond existing opt-in rules. (UI walk)
10. Full ToS/CSV import regression green; new edge fixtures added. (pytest)

---

## 8. Dependencies

| Item | Note |
|------|------|
| OD-2.1 vendor + venue | **Locked** Schwab/ToS-class first; vendor named in TD2-0; unit = connected user |
| OD-2.2 `entry_source = sync` | **Locked**; decision-log entry lands with migration + **Trade Log Spec catalog amend** (v1.2 or §17) in the same body of work |
| Phase 1 links | Preferred for campaign summary; charts/sync can start earlier (widget degrades gracefully) |
| Massive credentials | Existing |
| Trade Log Spec parity | Catalog + chip docs ship with the `sync` migration (Invariant #6) |

## 9. Out of scope (kept from v1.0)

Second/third broker (Phase 4) · tick replay, L2, T&S · futures options · standalone Practice
SKU · auto playbook-adherence AI.

## 10. Risks & mitigations (kept + extended)

| Risk | Mitigation |
|------|------------|
| Multi-leg mis-group from aggregator | Quarantine + manual fix; CSV fallback stays first-class |
| Sync project slips | Ship charts + process pack + CSV harden anyway (independent workstreams) |
| Cost blowup | Connected-only; disconnect jobs tested; daily not RT; ops metric |
| SPX chart confusion | Proxy labels; fail loud |
| Vendor lock-in shapes the domain | Normalizer is the only vendor-aware layer; import domain stays vendor-ignorant |

---

## 11. Open decisions — **RESOLVED** (Decision Addendum v1.1)

| # | Lock |
|---|------|
| OD-2.1 | **Schwab/ToS-class first**; SnapTrade-class aggregator (name in TD2-0) |
| OD-2.2 | **`entry_source = sync`** |
| OD-2.3 | **Defer** Journal day chart embed |
| OD-2.4 | **Status in Practice; manage in settings** |

See [Decision Addendum](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

## 12. Decision-log entry (draft, on approval)

> **Phase 2 Match Hygiene:** static underlier trade charts (Massive, cached, fail-loud, SPX
> proxy-labeled), one-venue opt-in broker sync entering exclusively through the existing
> import domain with **`entry_source = sync`** (Trade Log catalog amend + chip + DL entry in
> the same body of work) and connected-only vendor COGS (error grace ≤ 7 days then
> disconnect), and a process report pack (adherence mix, tag frequency, campaign summary).
> CSV/manual remain first-class. No replay, no L2, no edge analytics, no new SKU. No profit
> claims. Family B unchanged.

## 13. v1.0 → v1.1 ideas inventory (nothing silently dropped)

| v1.0 item | Disposition |
|-----------|-------------|
| Charts capability table | Kept; cache + fail-loud made normative |
| Sync UX, COGS model, one-venue scope | Kept; COGS made Delta-verifiable (§4.3) |
| `entry_source=automated` mapping rule | **Kept as an option but flagged**: conflicts with locked Trade Log catalog — elevated to OD-2.2 rather than silently changed or silently kept |
| Mapping rules (idempotency, quarantine, human process fields, account map) | Kept; account mapping gains explicit consent step (§5.2) |
| Process report pack table | Kept; grounded in as-built `records/summary` fields |
| Import harden | Kept; fixture-per-fix rule added |
| Connection plane schema, worker, privacy defaults | Kept; one-pipeline rule promoted to R-2.1 |
| Cost controls | Kept; evidence column added |
| All v1.0 out-of-scope, risks, exit intents | Kept |

## 14. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-2-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-2-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

Gate prefix: **TD2-***. Prerequisite: **TD1-G** (default); export residual hard-gated before TD2-G (OD-1.5).

---

## 15. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft (Coach/Grok) |
| 2026-08-07 | v1.1 Claude first pass — journeys, entry_source flag (OD-2.2), verifiable COGS, one-pipeline invariant, acceptance |
| 2026-08-07 | v1.1a — OD locks (`sync`, venue, UI, error grace) + Agent Bench links |
| 2026-08-07 | v1.1b — consistency: `sync` wording + Trade Log Spec bump as co-deliverable |
