# TLAF0-1 — India Trade Log Autofilter

**Project:** p-autofilter  
**Agent:** India  
**Gate:** TLAF0-G  
**Isolation:** read-only.

**Read:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` · `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1.0.md` · Campaign Spec v1.3 §9.2 · Practice Context v0.2 · `PracticeContextBar.tsx` · `PracticeSuiteChrome.tsx` · `TradeLogTable.tsx` · `trade-log/page.tsx` · `TradeFindTag.tsx`

**Do:**

1. Spec v0.1 **APPROVED** or **RETURNED** for build readiness.
2. **O1 report (mandatory):** is the date control under the Practice nav **shared**? Quote `PracticeContextBar` + every page that mounts `PracticeSuiteChrome`. Propose Trade Log–only omit (prop/host). Do **not** recommend deleting the bar globally.
3. After TLAF2, Trade Log must not still filter via `practiceContext.campaignId` / date granularity (one stream).
4. Badge tap + `?campaign=` → Autofilter campaign column. Adhere locate is not a standing filter; composition listed as keep.
5. Component API: column defs in, one stream out, nothing Trade-Log-specific. Whole-block grain vs Find and Badge rows.
6. Playbook blotter select: **out of this slice** unless Coach names it.
7. Alpha idle? If not, stop TLAF1.
8. Flagged ideas beside OPEN items. Do not delete spec text.

**Done when:** `agents/p-autofilter/reviews/TLAF0-1-india.md`.
