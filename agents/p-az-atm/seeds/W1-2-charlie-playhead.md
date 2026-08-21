# Seed W1-2 — Charlie playhead / close-to-close

**Project:** p-az-atm  
**Agent:** Charlie  
**Phase:** W1  
**Depends:** W0-BA (may ∥ W1-1)  
**Files:** `web/lib/options-lab/algoDayReplay.ts` + `.test.ts`  
**Out:** `HostPnLChart.tsx` · `OpfRiskAnalyzer.tsx` toolbar  
**Gate it feeds:** W1-G

## Ask

Pure clock: close-to-close over the day’s samples. Speeds 3/10/20 without jump. Scrubber frac ↔ sample. No intra-bar invention.

## Done when

`npx tsx lib/options-lab/algoDayReplay.test.ts` green (390 / short / 3× / seek).
