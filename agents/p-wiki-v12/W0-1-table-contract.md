# W0-1 — India table contract (OD-WK4)

**Date:** 2026-08-22  
**Agent:** India  
**Depends:** Coach GO W0 + OD-WK4 (plan v1.1 stamp)  
**Feeds:** W0-2 Alpha · W0-6 Mike · W0-8 Lima

## Verdict

**APPROVED for W0 migrate.** Two sibling tables. Last SHA must not live on a candidate row (AT-WK5 by construction).

## 1. `wiki_compile_candidates`

Append-only candidate list (Wiki Spec v1.2 §4.2). Never the last-SHA register.

| Column | Type | Notes |
|--------|------|--------|
| `id` | `BIGINT UNSIGNED AUTO_INCREMENT` | PK |
| `identity_key` | `VARCHAR(512) NOT NULL` | WK7 identity |
| `kind` | `VARCHAR(32) NOT NULL` | `template \| feature \| spec \| decision` |
| `origin` | `VARCHAR(32) NOT NULL` | `agent_found \| admin_pointed` |
| `title` | `VARCHAR(512) NOT NULL` | |
| `source_ref` | `VARCHAR(1024) NULL` | |
| `deployed_sha` | `VARCHAR(40) NULL` | **NULL iff** `origin=admin_pointed`; 7–40 hex |
| `deployed_at` | `DATETIME NULL` | **NULL iff** `origin=admin_pointed` |
| `surface_key` | `VARCHAR(128) NULL` | feature; W1 list |
| `state_key` | `VARCHAR(128) NULL` | declared token only |
| `route` | `VARCHAR(512) NULL` | |
| `audience` | `VARCHAR(16) NOT NULL` | `public \| member \| staff` |
| `suggested_target` | `VARCHAR(16) NULL` | `wiki \| help \| both` |
| `suggested_title` | `VARCHAR(512) NULL` | Oscar proposal |
| `rationale` | `VARCHAR(1024) NULL` | one line |
| `suggested_parent` | `VARCHAR(512) NULL` | |
| `note` | `TEXT NULL` | administrator |
| `disposition` | `VARCHAR(32) NOT NULL` | `open \| compiling \| compiled \| dismissed`; default `open` |
| `compiled_content_ids` | `JSON NULL` | board outcomes, derived display |
| `created_at` | `DATETIME NOT NULL` | |
| `disposed_at` | `DATETIME NULL` | |
| `disposed_by` | `BIGINT UNSIGNED NULL` | identity_id |
| `identity_open_key` | generated `VARCHAR(512)` | `identity_key` when `disposition IN ('open','compiling')`, else NULL |

**PK:** `id`  
**Uniqueness while `open|compiling`:** `UNIQUE (identity_open_key)` — MySQL allows multiple NULLs, so dismissed/compiled history may repeat the identity on a new version (WK8).  
**CHECK:** origin/kind/audience/disposition enumerations; `admin_pointed` ⇒ `deployed_sha` and `deployed_at` NULL; `agent_found` ⇒ `deployed_sha` NOT NULL.

W0 writers must not INSERT here on first SHA.

## 2. `wiki_compile_watcher_state`

Singleton last-registered SHA. **Not a candidate row.**

| Column | Type | Notes |
|--------|------|--------|
| `id` | `TINYINT UNSIGNED NOT NULL` | PK; CHECK `id = 1` |
| `last_sha` | `VARCHAR(40) NULL` | NULL until first stub run; 7–40 hex |
| `recorded_at` | `DATETIME NULL` | NULL until first stub run |

Seed one row `(1, NULL, NULL)`. Watcher stub UPSERTs SHA here only.

## Out of scope (named)

Course tables · Member Wiki ①②⑤ · OD-WK1 hook · disposition API · Oscar model.

## Bench delta

Next invocation has a named watcher-state sibling so AT-WK5 cannot be failed by storing last SHA on a candidate row.
