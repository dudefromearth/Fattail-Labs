# TLAB0-1 — India — Book universe

**Project:** p-autofilter  
**Agent:** India  
**Gate:** TLAB0-G  
**Isolation:** read-only. No product code.

**Read:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Book-Universe-Spec-v0_1.md` · v0.1.1 · `trades.py` list filters · `_find_filter_clauses` · `_load_member_book_page` · `trade-log/page.tsx` PAGE_LIMIT · Find and Badge `filterQuery`

**Do:**

1. Addendum APPROVED or RETURNED for build readiness.
2. One stream after the cut: Autofilter must not client-filter a server-filtered page as a second gate (unless identity).
3. Option A vs B vs C — architecture, not a Coach default. Flag Status (O3).
4. Alpha: idle if A (full=1 already exists); **not idle** if B (distincts + match_count).
5. Distincts grain: Find and Badge is identity / positions; blotter is account / trades. Do not silently reuse the wrong universe.
6. Journal / Records out. Do not delete v0.1.1 text.

**Done when:** `agents/p-autofilter/reviews/TLAB0-1-india.md`.
