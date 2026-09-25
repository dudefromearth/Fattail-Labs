# Tape Lab — opening-move studies and the standing report

**Status:** plan for the Tape Lab tool at `http://studiotwo.local:7420/`. The product code lives in `~/fattail-tapelab`. This file is the study design and the decision-use map. It is not a claim that any of these frequencies have been confirmed out of sample.

**Source method:** tastylive Market Measures, [Does the Opening Move Actually Hold All Day?](https://youtu.be/mbtKvw0yp6k) (2026-09-23). Julia Spina presents research by Sahil Malhotra. Their sample is SPX minute prices, January 2012–August 2026. Ours is the SPX 0DTE chain snapshots StudioOne has archived (from 2026-08-14) plus whatever the Tape Lab collector has on disk. Those are not the same sample. The report must never print their percentages next to ours as if one checked the other.

## 1. What the tool is for

A standing, recomputable report on the Tape Lab dashboard. A trader opens Health, clicks Studies, and sees what the captured SPX paths actually did: how a large morning move lined up with the close, when price crossed back through the 9:31 print, and what the 0DTE chain was pricing at that same moment.

The report grows as new sessions land. It is descriptive. It does not tell anyone to buy, sell, or fade.

Keep building the report and the studies around it until Coach interrupts for a progress report. Do not stop to ask whether the next honest slice is allowed.

## 2. Invariants

- **Data access.** The app server calls only the Tape Lab data API (`:7410`). It never calls Massive and never reads `data-system/data` itself. Spot paths come from `GET /v1/chain/{sym}/path`, which returns time and spot (and a few chain summaries), not the full book. The dashboard card asks for today’s path with `local=1` so opening Health cannot start an archive backfill. The Studies page may backfill a missing day, one day at a time, through the existing `sym_file()` path. StudioOne stays a collector first.
- **Analytical standards.** S001 and S002 remain NOT SUPPORTED. This report is not a third confirmatory study and must not be labeled as one. Shares always show N. Under five sessions, show the dates and no percentage. Wilson intervals on every share that is shown. Dropped days are listed with a reason. Nothing is interpolated.
- **No look-ahead.** A session without a 16:00 print is not in the historical counts. Today’s card may describe the morning state that has already printed. It may not describe the close. A mark is the last snapshot at or before the clock, within 2.5 minutes (archive days are often about 2 minutes apart). A gap longer than 6 minutes inside the captured stretch drops the day.
- **Defined risk.** If the page links onward, it links to the structure calculator (vertical or broken-wing fly). It does not pick a side, a strike, or a size.
- **Interface.** Navigation stays the Apple-HIG capsule already on every page. Section help sits in the existing info tip. Charts may be inventive (stacked cells, a session ribbon, a scatter of morning move against the close). Controls stay plain: one primary button, disclosure for the dropped-day list, no second visual language.

## 3. Their method, frozen so we can repeat it

Anchor is the **9:31 ET** print. Return at clock T is `spot(T) / spot(9:31) - 1`.

| Signal state | Rule |
|---|---|
| Down | `r <= -0.50%` |
| Flat | within `±0.25%` |
| Up | `r >= +0.50%` |
| Moderate | between 0.25% and 0.50% — counted, not drawn as one of the three bars |

Clocks: **10:00**, **10:30**, **11:00** ET. Each clock re-sorts every session. It is not “of the days that were down at 10:00, how many were still down at 10:30.” That nested question is computed too, and labeled as a different question, because the voiceover on the video blurs them and the charts do not.

Close, versus the same 9:31 price: down if `r < -0.25%`, up if `r > +0.25%`, otherwise flat. Their slide never prints a second close threshold. `±0.25%` is the only flat width on the slide, and Julia’s reading is “still red / still green,” including a small recovery. If a later primary source defines the close band differently, change it in one place (`opening_move.js`) and recompute. Do not leave two definitions in the UI.

Full reversal: a later print comes back to or through the 9:31 price. Flat signals are excluded. “By noon” and “by 2pm” are shares of the days that did reverse, not of all signals.

Three studies, matching the video:

1. **Time-of-day noise.** Mean absolute one-minute return, in 5-minute buckets, only when the path is actually about one minute apart. A coarser step skips this chart instead of pretending.
2. **Close given the morning state.** Three stacked bars. N and an interval on every slice.
3. **Time of the first cross back through 9:31.** Same signal definitions, then a look forward.

Their published figures (for comparison of *method*, not of result): at 10:00, down N=138 closed down 62.3% and up 22.5%; up N=126 closed up 77.0%. At 10:30, down N=282 closed down 71.6%; up N=261 closed up 77.0%. At 11:00, down N=367 closed down 76.0% and up 9.8%; up N=332 closed up 79.2%. A 30-minute down move later crossed the open 47.8% of the time (median 11:21). A move still large at 11:00 crossed about 25% of the time.

Our archive, checked 2026-09-24: 28 days with SPX snaps, one of them (2026-08-17) only two snaps, and 2026-09-24 unfinished at the time of the check. Expect on the order of one or two large 30-minute signals. Say that in the report. Do not hide it under a chart that looks like theirs.

## 4. Similar studies worth adding, in this order

Each one uses the same kept-session rules. None of them is a signal until it has its own pre-registration, a holdout, and a falsifier. Until then they are extra columns on the same descriptive report.

| ID | Question | Why a trader would look | Data we already have | Status rule |
|---|---|---|---|---|
| OM-1 | The three studies above | “Has a move like this morning tended to finish the same color, on the days we captured?” | Spot on the chain frame | Build first |
| OM-2 | Nested persistence: of days down at 10:00, how many were still down at 10:30 and 11:00 | Separates “the move survived” from “a new sort at a later clock” | Same path | Build with OM-1, labeled separately |
| OM-3 | 0DTE ATM straddle, as a percent of spot, at the signal clock, split by later cross vs no cross | The chain’s own priced range. A rich straddle means the open move has not used up the day’s implied move | Bid/ask on the path’s own frame. Blank when either wing has no two-sided quote. Never zero | Build with the path endpoint |
| OM-4 | ATM call IV at the signal and at 16:00, split the same way | Did the vol bid stay up on days that reversed | `iv` on the row. Blank when missing | Same |
| OM-5 | Put volume minus call volume at the signal, from the cumulative session volume already on the chain | Context only. It is not a print, and it is not aggressor flow | `volume` by side | Same, labeled cumulative |
| OM-6 | Scatter of morning return against close return, one dot per kept day, with a y=x reference | Shows magnitude, which their red/green bars throw away. The reference line is “unchanged percent,” not a fitted model | Same path | Build with the report |
| OM-7 | Overnight gap (prior close to 9:31) versus the first-30-minute move | The video mixes “opened down” and “down in the first 30 minutes.” These are different | Prior close is already a data-API route. Not in the first slice | Next, still descriptive |
| OM-8 | Same definitions on SPY and XSP, reported beside SPX, never pooled | A robustness check once SPX has enough large-move days to be worth checking | Their own chain files | Do not pool |
| OM-9 | Realized absolute move from the signal to the close, divided by the ATM straddle at the signal | Did the chain’s priced range cover what then happened | OM-3 plus the close | Only after OM-3 is blank-honest |
| OM-10 | A pre-registered confirmatory test | The only version that could later say “supported” or “not supported” | Needs a frozen rule and a holdout we do not have yet | Not started. N is the blocker |

Explicitly not in this plan: an alert that says fade or hold, a fitted probability, a parameter search over the 0.50% threshold, and any P&L of a structure entered because of the cell.

## 5. How a trader can use a cell without being told what to do

The page answers questions. It does not issue orders.

- **“Is the first half hour already the day’s trend?”** Read the 10:00 bar and its N. On their 14-year sample the answer was “often, but a down move still flipped color about one time in five.” On ours the honest answer is whatever the captured days show, including “we have two days.”
- **“If I wait, does the picture get cleaner?”** Compare the 10:00, 10:30, and 11:00 bars, and the separate nested row. Their sample got cleaner, especially on down days (62% → 76% still red at the close). Waiting is a choice about when the *classification* is taken. It is not a proof that today’s move will hold.
- **“What does fading mean in numbers?”** Fading means betting on a cross back through 9:31. The reversal table is that count. Their takeaway was that after a large move survives an hour and a half, only about a quarter of sessions cross back, so a fade is the lower count. Use our table the same way: as a count, with N.
- **“What is the chain saying that the index print is not?”** OM-3 and OM-4. A large down move with a still-rich straddle is a different situation from a large down move whose straddle has already collapsed. The report shows the split. It does not say which one to sell.
- **“If I do trade it, where does risk get defined?”** The structure lab and the backtest, linked with the symbol only. A vertical or a broken-wing fly caps the loss. The opening-move cell does not choose the wing.
- **“What would invalidate the way I’m reading this?”** A new session that lands in the cell and closes the other color. The report adds that day the next time it is built. One day does not overturn a large sample, and our sample is not large. Both facts stay on the page.

## 6. Where it sits in the product

- Nav capsule, every page: **Studies**, next to the existing Health / Live board / Symbol view / Backtest / Walk forward links.
- Health dashboard: a card titled Opening move. It classifies today’s SPX path from disk only, states that this is not a forecast, and links to the report. It does not print a historical percentage, because that would require walking every day on every dashboard load.
- Report route: `/studies`. Opening the page, and **Build from this disk**, read only days already saved (`local=1`). **Fetch missing days from StudioOne** walks the rest one day at a time. Results for the browser session are cached so a reload does not ask StudioOne again. Rebuild clears that cache and reads disk only.

## 7. Seats

| Seat | Job on this work |
|---|---|
| Sheldon | Owns the definitions, the N rules, and the line between a descriptive report and a pre-registered study. OM-10 does not start without him. |
| Hotel | Reads every sentence a trader sees. Blocks “you should,” a side, or a comparison that treats our N as theirs. |
| Carla | The path is a snapshot spot, not a traded fill. No P&L is attached. |
| Frink | The only onward link is a defined-risk structure calculator. No naked option, no stop-as-risk. |
| Norm | The 9:31 anchor and the hole rule are tape rules. A missing open is a dropped day, not a guess. |
| Alpha | The path route lives in the data API. |
| Charlie | The page and the dashboard card. |
| Echo | Capsule nav, info tips, one primary button. The ribbon and the scatter can be their own drawings. |
| India | App never touches the gzip files or Massive. `local=1` cannot backfill. |
| Delta | Unit tests with no network, then the page on `studiotwo.local:7420`. |
| Lima | This plan, plus `docs/guide.md` and `docs/architecture.md` in the tapelab repo the same day the page ships. |

## 8. Build order

1. Pure classifier in `app/opening_move.js`, tested on synthetic paths with known cells.
2. `GET /v1/chain/{sym}/path` — time, spot, ATM IV, straddle percent, call and put volume. Null when a quote is missing. `local=1` does not call StudioOne.
3. `/studies` and the Health card.
4. Guide and architecture updated the same day.
5. Next slice is OM-7 (gap versus first 30 minutes), still descriptive, still behind the same N rule. Not a new signal.
