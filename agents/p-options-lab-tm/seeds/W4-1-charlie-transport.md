# Seed W4-1 — Charlie transport / today

**Project:** Options Lab Time Machine  
**Agent:** Charlie  
**Depends:** W3-G PASS  
**Law:** TMI-64 · TMI-65 · TMI-21 · ATM-S1 · ATM-S3 · TMI-24 · ATM-O1 · ATM-H5  
**Files:** `web/components/options-lab/AnalyzerTimeMachineStrip.tsx` · `web/components/options-lab/OpfRiskAnalyzer.tsx` strip wiring · `web/lib/options-lab/algoDayReplay.ts`  
**Out:** Record control · 1× speed · new strip · TPO · Basic chrome · past-day StudioOne download (that's W5) · 1-minute fetch

## Ask

The strip **already exists**. Do not rebuild it. Behaviour:

1. Date control always present. **Today pre-selected** on first raise (AT-TM-C1). Scrubber up = replay. No banner, no confirm on a date change (AT-TM-C2).
2. Entering on today parks at the **newest** generation. Entering on a past day parks at the **first print** at that session's open (AT-TM-C5, ATM-O1). W5 supplies the past-day samples; today uses the held cache.
3. Speeds **10× / 20× / 50×** only. `REPLAY_SPEEDS` already matches. Do not add 1×.
4. **Reset** = What-if Reset: exit scrub, watermark gone, HUD gone, rehearsal disposed (disposal copy lands with W7). **Stop** does not hide the mini window; **Reset** does (ATM-H5).
5. Capture always on. No Record. Selecting a past date (W5) does **not** pause capture and does **not** discard today’s slot (TMI-79).
6. Mini window for today: a **line** downsampled from the **today** slot, upper-right, draggable scrubber. Not a second spot source. Past-day mini line is W5, from the archive slot.

## Done when

AT-TM-C1, C5, C9 hold on Analyzer. Date shows today. No Record. Delta W4-G.
