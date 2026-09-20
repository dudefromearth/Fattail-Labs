# Vendor lookback models (REQ-006 · 2026-09-19)

**TV (TradingView)** — bar-count lazy paging. The chart opens with a fixed number of bars at the active interval; pan toward the left edge loads the next page. No member-facing calendar-window configuration.

**Thinkorswim** — interval:aggregation preset pairs; ~360-day cap on many intraday aggregations; ~40,000-bar load ceiling on tick charts; “Max available” completeness idiom when the series has no more history.

**Labs ruling (Coach, 2026-09-19):** chart lookback is the **TV model**. Reason, verbatim: *"It is intuitive, where ToS forces you to learn how it works."* ToS interval:aggregation pairs are **rejected** for chart lookback. ToS continuity remains in the roll-rule catalog (SYM-4.0). The 40k-bar ceiling **validates N=5000** as conservative (one page ≪ 40k).
