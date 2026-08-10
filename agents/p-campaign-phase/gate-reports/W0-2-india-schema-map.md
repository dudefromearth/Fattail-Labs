# W0-2 — India schema map

**Status:** PASS  
**Date:** 2026-08-09  
**Agent:** India (bench under Coach GO)

## Migration scaffold (applied / pending)

| File | Role |
|------|------|
| `migrations/116_campaign_definition_fields.sql` | Campaign definition columns |
| `migrations/116_journal_day_net_map_pref.sql` | Unrelated (journal prefs) |

**Dual-116 note:** `migrate.py` sorts by **filename**, records by filename — both run independently (`116_campaign…` before `116_journal…` alphabetically). **No renumber required.** Next net-new migration = **117_***.

## Column map (`member_practice_campaigns`)

| Column (116) | Spec | Notes |
|--------------|------|--------|
| `charter_version` INT UNSIGNED NOT NULL DEFAULT 1 | P11 | Bump on signed-term amend; renew → successor v1 |
| `max_drawdown_pct` DECIMAL(9,4) NULL | P4 · Big Three | Percent of **allocation**; required at activate |
| `strategy_codes` JSON NULL | Tier 3 | Null/empty = unadopted (no outside-list rule) |
| `capital_allocation_mode` VARCHAR(32) NOT NULL DEFAULT 'fixed' | P2 · P12 | funding mode; not direction |
| `capital_allocation_note` MEDIUMTEXT NULL | Tier 3 | dynamic nuance when adopted |
| `retrospective_id` BIGINT UNSIGNED NULL | Tier 3 | attach; + index `ix_mpc_retrospective` |

**Already on table (pre-116, reuse):**

| Existing | Spec use |
|----------|----------|
| `starting_capital` | Allocation **amount** (Big Three) — confirm name; do not dual-store |
| `starts_at` | Big Three start |
| `ends_at` | End; required only on complete/archive |
| `goals_md` | Tier 3 goals |
| `title` | Tier 3 when customized; OD-title default “Campaign”+date |
| `status` / lifecycle | Sign · pause · complete · archive |
| Amendments table | Change log substrate |

## Still to add (S1-0)

| Gap | Proposal |
|-----|----------|
| Same-bet answers | `same_bet_json` JSON NULL — keys per Spec §2.2 / OD-SB; null = not answered |
| Allocation amount clarity | Document `starting_capital` as allocation amount SoR **or** add `capital_allocation_amount` only if India finds dual use of starting_capital elsewhere — **prefer reuse** `starting_capital` |
| Export keys | Mike: Family B pack fields for new columns |

## Version / amendment rules

| Event | Amendment row? | `charter_version++`? |
|-------|----------------|----------------------|
| Pre-sign set optional | No | No (draft) |
| First sign / activate | Snapshot terms | Start at 1 (already default) |
| Post-sign Big Three / title / etc. change | Yes | Yes |
| Post-sign adopt optional | Yes | Yes |
| Post-sign un-adopt / clear optional | Yes | Yes |
| Renew | New campaign row | Successor defaults v1 |

## No dual truth

- Free cash / free margin / realized DD = **read-time** (no materialize tables).  
- Composition wrap lives on Capital composition (113) — campaign mode is funding claim, not second equity.  
- Do not join stamps into master DD.

## S1-0 handoff

1. Confirm migrate 116 campaign applied on target DBs.  
2. Migration **117** for `same_bet_json` if not folded into unfinished 116.  
3. Domain serialize + adopt amend path (S1-1 · S1-2).
