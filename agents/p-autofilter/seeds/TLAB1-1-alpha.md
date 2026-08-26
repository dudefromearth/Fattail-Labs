# TLAB1-1 — Alpha — Book universe list + distincts + Status

**GO TLAB1.** Mechanic **B**. O2 match_count/book_count. O3 Status full-book.

**In:** `server/routes/trade_log/common.py` · `trades.py` · `trade_log_domain/matching.py` (`blotter_status_by_id`).

**Out:** Journal · Records · Find and Badge rewrite · Help · page-local Status.

**Done:**
- `_load_member_book_page` returns `match_count` (filtered book) + `book_count` (standing scope).
- `statuses=` filters via `blotter_status_by_id` after `match_open_close` (Open / Complete / Orphan close). Over `_BLOTTER_STATUS_BUDGET` (10 000) → **422**, not page-local.
- `GET /distincts?blotter=1&account_id=` → `blotter_distincts` (account **trades** + Status). Default `/distincts` stays Find and Badge identity/positions.
