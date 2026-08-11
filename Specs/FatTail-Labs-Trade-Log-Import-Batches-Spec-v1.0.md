# FatTail Labs — Trade Log Import Batches & Import Manager Spec v1.0

**Status:** Proposed (2026-08-11). Spec-first; **Coach sign-off required** (destructive +
schema migration).
**Owner surface:** Member Trade Log (`/app/trade-log`), the Import/Export toolbar group.
**Builds on:** `FatTail-Labs-Trade-Log-Spec-v1.1`. Supersedes the "Delete all
transactions" trashcan behaviour that currently opens a single typed-confirm wipe.

---

## 1. Problem

Today every CSV/JSON import dissolves into loose trades. A commit dedups by
`(identity_id, account_id, external_adapter, external_order_id)` and stamps each trade
`entry_source='import'` + `external_adapter`, but **there is no record of the import
event** — no ID, no timestamp, no grouping. So a member who imports the wrong file, or
imports twice, or wants to redo one broker's history, has only two blunt options: delete
trades one at a time, or nuke the entire log. There is no way to say "undo *that* import."

## 2. Goal

Make every import a first-class, identifiable **batch**:

- Each import gets a **unique ID** and a **date/time**.
- Trades remember which import created them.
- The trashcan opens an **Import Manager**: list every import (when, source, account,
  count), **preview** the trades inside one, and **delete a specific import** (removing
  exactly its trades). Keep a separate, harder-gated **"Delete all transactions"** for a
  full start-over.
- All dialogs follow the Labs **HIG** design system (tokens + `AlertDialog`/`Button`),
  not hand-rolled styling.

## 3. Data model (migration `119`)

### 3.1 New table — `member_trade_log_imports`
One row per commit that creates ≥1 trade. **This row's `id` is the unique import ID.**

| Column | Type | Notes |
|---|---|---|
| `id` | BIGINT UNSIGNED PK AUTO_INCREMENT | the unique import ID (surfaced as `#<id>`) |
| `identity_id` | BIGINT UNSIGNED | owner; FK → identities `ON DELETE CASCADE` |
| `account_id` | BIGINT UNSIGNED | target account; FK → accounts |
| `adapter` | VARCHAR(32) | `thinkorswim` \| `native` \| `csv_generic` \| … |
| `source_filename` | VARCHAR(255) NULL | original file name, when the client sends it |
| `practice_campaign_id` | BIGINT UNSIGNED NULL | campaign stamp chosen at import |
| `trade_count` | INT NOT NULL DEFAULT 0 | trades created by this import |
| `skipped_count` | INT NOT NULL DEFAULT 0 | duplicates skipped at commit |
| `label` | VARCHAR(120) NULL | optional friendly name; else derived on display |
| `created_at` | TIMESTAMP DEFAULT CURRENT_TIMESTAMP | **the import date/time** |

Index: `(identity_id, created_at)`.

### 3.2 Alter `member_trade_log_trades`
Add `import_id BIGINT UNSIGNED NULL` with
`FOREIGN KEY (import_id) REFERENCES member_trade_log_imports(id) ON DELETE CASCADE`,
indexed `(identity_id, import_id)`.

- **CASCADE is the mechanism:** deleting an import row deletes its trades; legs already
  cascade from trades (`member_trade_log_legs → trades ON DELETE CASCADE`, migration 040).
  One `DELETE FROM member_trade_log_imports WHERE id=…` cleanly removes batch → trades →
  legs.
- `import_id IS NULL` for **manual** (`New trade`), **automated** (Strategy Lab), and
  **legacy** trades (created before this migration). Those are unaffected and are not
  listed as deletable imports.

### 3.3 Legacy trades — reconstruct existing imports so older ones are deletable
**Backfill is first-class in v1.0 and default-ON.** Existing import trades are not tagged
today, but their real import events are faithfully reconstructable from the row
`created_at` (every trade is inserted at import time), so members can delete their *older*
imports too — not just ones made after this ships.

**Why gap-based, not exact-timestamp** (verified against prod, 2026-08-11): prod has 1918
import trades. Grouping by exact `created_at` second yields 3 groups — but two of them
(271 + 173 thinkorswim trades at `12:05:21`→`12:05:22`) are a **single** 444-trade import
that straddled a second boundary. Exact-second bucketing therefore *fragments* large
imports. The true history is **2 import events** (444-trade thinkorswim, Aug 10; 1474-trade
native, Aug 5), separated cleanly only by a time gap.

**Backfill algorithm (one-time, in migration `119`):** for each
`(identity_id, account_id, external_adapter)` partition of `entry_source='import'` trades,
order by `created_at` and open a new reconstructed batch whenever the gap to the previous
trade exceeds **`GAP = 5 minutes`** (well above the few seconds a large single import
spans, well below the hours/days between distinct import events). For each cluster, insert
a `member_trade_log_imports` row (`adapter=external_adapter`, `account_id`,
`created_at`=cluster's earliest trade time, `source_filename=NULL`,
`label='Recovered import'`, `trade_count`=cluster size) and set `import_id` on its trades.
Implementable via MySQL-8 `LAG()` window boundaries or a Python backfill in the migration
runner. Manual (`entry_source='manual'`) and automated trades are **not** grouped and keep
`import_id = NULL`.

*Result on today's prod:* the 1918 loose import trades collapse into ~2 recovered,
previewable, individually-deletable imports — exactly what a member would expect to see.

## 4. Identification

- **Canonical ID:** the DB `id` (stable, unique, identity-scoped). Displayed as `#<id>`.
- **Human identity (what the member reads):** `created_at` (date + time) · `adapter` ·
  `trade_count` trades · account label · `source_filename` or campaign name.
- No opaque public code in v1.0. *(If opaque refs are later wanted, add
  `public_ref = "IMP-" + base36(id)`; deferred.)*

## 5. Commit changes (`POST /api/me/trade-log/import/commit`)

Inside the existing transaction, before the insert loop:
1. `INSERT` an `member_trade_log_imports` row (`adapter`, `account_id`, `source_filename`
   from body, `practice_campaign_id`, `created_at=NOW()`, counts 0) → capture `import_id`.
2. Stamp every inserted trade with that `import_id` (one new column in the existing
   INSERT).
3. After the loop, `UPDATE … SET trade_count=%s, skipped_count=%s`.
4. **If `created == 0`** (every row was a duplicate) → `DELETE` the just-created import row
   so the Manager never shows empty batches. Dedup semantics are unchanged.
5. Response gains `"import_id"`.

Client (`ImportSheet`) sends `filename` in the commit body so the batch can show it.

## 6. API

All identity-scoped; `require_session` + tool-member.

| Method / path | Purpose |
|---|---|
| `GET /api/me/trade-log/imports` | List batches, newest first: `{id, created_at, adapter, account_id, account_label, source_filename, label, trade_count, skipped_count, campaign_id, campaign_name}`. |
| `GET /api/me/trade-log/imports/{id}` | Preview: `{import: {…meta}, trades: [{exec_at, strategy, legs_count, net_price, net_side, symbol}]}` (lightweight, capped at 200 rows). |
| `DELETE /api/me/trade-log/imports/{id}` | Delete that import (cascade → trades → legs) + the row. Returns `{ok, deleted}`. 404 if not owned. |
| `POST /api/me/trade-log/delete-all` *(existing)* | Full wipe — every trade, all accounts. Kept, still typed-confirm gated. |

## 7. UI — Import Manager (replaces the direct wipe on the trashcan)

The red trashcan in the Import/Export group opens the **Import Manager** dialog:

- **List** (newest first). Each row: `Aug 11, 2026 · 2:32 PM` · `thinkorswim` · `42 trades`
  · account · filename/campaign · `#123`. Row actions: **Preview**, **Delete**.
- **Preview** expands a read-only detail (or side pane) showing the batch's trades
  (exec time · strategy · legs · net) so the member can confirm *which* import it is
  before deleting.
- **Delete (per import):** HIG destructive confirm naming the batch — e.g. *"Delete this
  import? 42 trades from thinkorswim on Aug 11, 2:32 PM will be permanently removed. Your
  other trades stay."* → `destructive` Button. On success, refresh list + blotter.
- **Footer — "Delete all transactions":** the full start-over, still gated by the
  **type-to-confirm** ("delete") flow. Type-to-confirm is reserved for this one
  catastrophic action; per-import deletes use the standard HIG destructive confirm.
- **Empty state:** "No tracked imports yet — imports you make will show up here to preview
  or remove. (Manually-added trades aren't part of an import.)"

## 8. HIG compliance (applies to every dialog here)

- Overlay `var(--color-overlay)`; panel `bg-[var(--color-surface)]`,
  `rounded-[var(--radius-xl)]`, `shadow-[var(--elevation-3)]`; typography via
  `var(--text-*)`; destructive accents `var(--color-destructive)`.
- Reuse `components/ui/Button` (`variant="secondary" | "destructive"`) and the
  `AlertDialog` shell / `useConfirm()` for confirmations — no raw Tailwind colours.
- `role="dialog"` for the Manager, `role="alertdialog"` for confirms; labelled title +
  description; focus the safe control on open; Escape and backdrop dismiss; destructive
  action never the default-focused button.
- **Also fold in:** re-skin the existing "Delete all transactions" popup to these tokens +
  `Button variant="destructive"` (the HIG-alignment "Option A" already agreed).

## 9. Invariants

- Import rows and `import_id` are strictly identity-scoped; a member sees/deletes only
  their own imports.
- Deleting an import removes **exactly** its trades (+ legs) — never another import's,
  never manual/automated trades, never accounts or campaigns.
- Dedup unchanged: re-importing a file skips duplicates (they remain in their original
  import); no empty import rows are ever created.
- Migration is additive; `import_id NULL` preserves today's behaviour for manual,
  automated, and legacy trades.
- "Delete all transactions" remains the only path that removes untracked (manual/legacy)
  trades.

## 10. Verification

`server/tests/test_trade_log_import.py` (extend):
- Commit creates one import row, stamps every created trade with its `import_id`, sets
  `trade_count`; response includes `import_id`.
- Re-import of the same file: `created==0`, **no** new import row, duplicates unchanged.
- `GET /imports` lists the batch; `GET /imports/{id}` previews its trades.
- `DELETE /imports/{id}` removes exactly that batch's trades + legs, leaves a second
  member's imports and the same member's manual trades intact (identity + batch scoping).
- `delete-all` still wipes everything including untracked trades.
- **Backfill:** seeded loose import trades spanning a >GAP boundary collapse into one
  reconstructed import (not fragmented); a distinct import >GAP later is its own batch;
  manual trades are never grouped. (Mirrors the verified prod shape: 444+1474 → 2 imports.)

## 11. Rollout

1. This spec → **Coach sign-off** (sensitive: destructive + schema).
2. Migration `119` (additive): table + `import_id` column **+ one-time gap-based backfill**
   that reconstructs existing imports (§3.3), so older imports are immediately deletable.
3. Backend: commit stamping + the three `imports` endpoints.
4. Frontend: Import Manager dialog on the trashcan (HIG), send `filename` on commit,
   re-skin the full-wipe confirm to tokens.
5. Characterization tests green; verify on a dev DB (not prod seed).
6. Decision-log entry (`DL-###`) on merge.

## 12. Deferred (v1.1+)

- Opaque `public_ref` (`IMP-<base36>`); rename/label an import; re-tag trades between
  imports; export a single import; "undo last import" one-click.
- Let a member split/merge a *reconstructed* batch if the gap heuristic mis-grouped one
  of their historical imports (new imports are always exact, so this only ever affects
  pre-119 history).
