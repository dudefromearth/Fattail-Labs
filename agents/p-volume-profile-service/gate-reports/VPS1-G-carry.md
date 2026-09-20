# VPS1-G carry — SPY 2026-09-17 full-RTH

**Delta** · 2026-09-18 06:20 ET · StudioOne **READ-ONLY** · no install  
**CP-1 BEFORE:** `chain_feed` **538** · `sym_feed` **82012** · last ladder `mb:ladder:SPY:2026-09-18:w25:dual`  
**CP-1 AFTER:** unchanged (this packet did not write StudioOne).

## Tape

| | |
|--|--|
| Path | `/Volumes/FatTail2TB/fattail-market-data/vp/ingest/SPY/trades/day=2026-09-17/prints.jsonl.gz` |
| Prints | **564,764** |
| Share volume (sum `s`) | **56,059,305** (full 04:00–20:00 file) |
| **RTH 09:30–16:00** | **531,724** prints · **34,984,755** shares |
| RTH span | 09:30:00.000 – 15:59:59.999 ET (continuous) |
| First / last | 04:00:00.015 @ 759.36 · 20:00:00.064 @ **762.60** (close print size 1,237,460) |
| Odd-lot prints (c contains 37 or oddlot) | **301,686** (53.4% of **print count**, not share volume) |
| Gaps | one `feed_liveness` open/close at 04:00 (pre-open), then prints. **No RTH print_absence.** |

## Volume sanity vs public reference (09-17 session)

| Source | Volume |
|--------|--------|
| This tape RTH sum(`s`) | **34,984,755** |
| MarketWatch | 49,652,754 |
| FinanceCharts | 50,934,021 |
| TECHi | 49,610,800 |

Close **762.60** matches public close. RTH share volume is **~70%** of published daily volume — named, not silent. Print count and RTH span are complete for the SIP WS we hold. Not a 10× error, not empty.

## Condition-code distribution (print counts, top)

| id | name (Q4 fixture) | n | Engine proposal |
|----|-------------------|--:|-----------------|
| 37 | Odd Lot | 301686 | **EXCLUDE** (Q5) |
| 41 | Trade Thru Exempt | 141694 | **EXCLUDE-and-flagged** until `/v3/reference/conditions` `updates_volume` |
| 14 | Intermarket Sweep | 118817 | **INCLUDE** (proposal — dominant non-odd-lot regular flow) |
| 12 | Form T / Extended Hours | 33126 | **EXCLUDE** from RTH histogram (outside RTH) |
| 10 | Derivatively Priced | 20776 | **EXCLUDE-and-flagged** until endpoint |
| 2 | Average Price Trade | 2764 | **EXCLUDE** (F1 / fixture `engine_volume=true` is APT exception — keep F1 EXCLUDE) |
| 53 / 52 | QCT / Contingent | 287 / 272 | **EXCLUDE-and-flagged** |
| 7 | Cash Sale | 120 | **EXCLUDE** |
| 32 | Sold OOS | 61 | **EXCLUDE** |
| 0 Regular Sale | | **not seen** | still **EXCLUDE-and-flagged** (not in 40-row table) |

Full proposal: `Q4-proposal-2026-09-18.md`.

## Verdict

**GO** for ingest capture (RTH span complete, 531,724 prints, close matches 762.60, no RTH gap).  
**Engine publish** still waits the Q4 endpoint pass for ids 41/10/52/53. VPS2 ACT 3 may install Engine **code** tonight; member-facing histograms stay Q5 EXCLUDE odd lots + this proposal.

**Does not.** StudioOne write. Guess `updates_volume` for 41.
