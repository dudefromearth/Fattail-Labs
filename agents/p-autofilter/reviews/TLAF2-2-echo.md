# TLAF2-2 — Echo — Trade Log Autofilter title bar

**Agent:** Echo  
**Date:** 2026-08-25  
**Spec:** Trade Log Autofilter v0.1 · GO SPEC DL-584 · O2 = remove Open:N  
**Evidence:** `agents/p-autofilter/evidence/tlf2-title-bar.png` · Playwright `e2e/trade-log-autofilter.spec.ts`

## Verdict

**APPROVED.**

One Autofilter control sits on the **Trade history** row (not a chip row, not under Practice nav). Launcher uses `min-h-[var(--hit-min)]` and `min-w-[44px]`. Opened surface is Exec time · Campaign · Symbol · Status, matching Campaign menu grammar (`DateWhenFilter` / `ValueFilter` ▾). Panel portals **under** the title row so count, playbook, and window stay on the control line.

**Filter on** is `FilterOnMark` (amber chip, shown/total) on the same row when filters are active.

**Gone:** `blotter-campaign-filter`, Open:N chip. **Stay:** account chrome, playbook `<select>`, blotter window, Select opens (selection). Practice date/campaign pills omitted on this page only.

No Find and Badge ▾ restyle.

Screenshot: Trade history · Autofilter (filled) · 1 loaded · All playbooks · Window, with the four-column panel on the next line. Account picker remains; date/campaign group absent.
