# Runner fast path

**Item 1, amended 2026-09-29.**  
Machine for the proof: StudioTwo, `~/Fattail-Labs`.  
No file carried this title before this amendment. This file is that item.

**Coach, 2026-09-29, verbatim.**

> The SPX and XSP workers are schedulers, not loops. Each book has its own 2-second timer that fires a fetch regardless of whether the previous fetch for that book has returned. Every request carries (book, sequence). Responses are assembled on arrival: the assembler writes a response only if its sequence is newer than the last written for that book, and discards it otherwise. In-flight requests per book are capped at the Massive concurrency Delta measured; a tick that would exceed the cap is skipped and counted, never queued. Write only when the quote clock moved.

The sequence kept for that check advances when the response is the newest one to arrive for the book. That includes a response whose quote clock did not move, so a late older response is discarded after a newer one has been seen. The snap is stored only when `last_quote.last_updated` moves. `captured_unix` is the tick time. That is the generation clock.

`run_book_scheduler` in `server/market_data/ssr_fullbook_capture.py` is the fake-clock proof of this item. `run_threaded_book_scheduler` is the same rules with the fetch off the timer thread. `live` calls `run_threaded_book_scheduler`. That is the process Wednesday's parallel run starts. One scheduler per name. Six books, each on its own timer.

The in-flight cap is `LABS_FULLBOOK_IN_FLIGHT_CAP`. Missing, blank, or not a positive integer fails before a Massive client is constructed. There is no default in the code. The StudioOne full-book plist sets it to 11, from `docs/Massive-Concurrency-Finding-v0_1.md`. The job is not loaded.

The 2026-09-29 measurement is that finding: largest clean N was 12, and the cap is 11. The grid proof still passes 3 where a response may take 4 seconds, and 1 where the cap must skip. Those two numbers are the proof arguments. The plist value is the measurement.

`run_worker` remains. The cadence tests call it. `live` does not. The dedicated chain-feed workers that are running stay the serial loop.

The spot fast path is `server/market_data/spot_fast_path.py`. The wake is 1 second. A frame is `t`, `symbol`, `sequence`, `mid`, and `ts`, and `ts` is the tick. The module is in the mexp2 tree and is not started. The running `sym_feed` was not replaced.

This file does not revise OPF spec v0.3, the cadence tests, or the book-view note. The code is in StudioOne `~/Fattail-Labs-mexp2`. HEAD stayed `a91302a23b5944181e4ef1d7f58a78b76388a1cd`. The full-book job is not loaded. It was not part of the chain-feed land or the MiniTwo API restart.

## Proof

StudioTwo, recorded 2026-09-28 books, no Massive client.

```
cd server && .venv/bin/python -m pytest tests/test_ssr_fullbook_scheduler.py tests/test_ssr_fullbook_capture.py -q --noconftest
13 passed in 1.96s
```

Random delays, seed 20260929, uniform from 0.3 to 4 seconds, horizon 20 seconds, cap 3. Twelve books, 120 requests. Delays in that run ran from 0.333 to 3.991 seconds. Every fire sat on the 2-second grid from 09:30 ET. Skipped ticks were 0. Peak in flight was 2. Writes 108. Out-of-order drops 12. `massive_uses` did not move. SPX 2026-09-30 stayed 1,198 contracts and 5 pages.

A separate run puts sequence 2 on the book before sequence 1 arrives. Sequence 1 is dropped. The stored quote stamp is sequence 2's, then sequence 3's.

Cap 1, delay 3 seconds, horizon 8 seconds, SPX 2026-09-29 and SPX 2026-09-30. Each book fires at 0 and 4 seconds. The ticks at 2 and 6 seconds are skipped and counted. Peak in flight is 1 per book, including at the shared instant both books fire. No fetch starts when the earlier response arrives at 3 or 7 seconds.

The same quote stamp writes the first generation and does not write the later ones. A newer sequence that does not move the quote clock still drops the older response that arrives after it. The stored `captured_unix` stays on the first tick.

The threaded proof uses the same recorded books and real sleeps. It does not call `live`.

```
cd server && .venv/bin/python -m pytest tests/test_ssr_fullbook_scheduler.py tests/test_spot_fast_path.py tests/test_ssr_fullbook_capture.py -q --noconftest
21 passed in 13.92s
```

The same command on StudioOne `~/Fattail-Labs-mexp2/server` reported 21 passed in 14.03 s. `ssr_fullbook.py` stayed `03283277cfa3c49bd5514210fe705da07afdcd18552bb0aced957174a1ccef2f`.

Seed 20260929, two SPX books (2026-09-29 and 2026-09-30), horizon 6 seconds, cap 3. Three fires each. Each fire was within 0.5 seconds of the 2-second grid. Delays stayed inside 0.3 to 4 seconds. Skipped ticks were 0. SPX 2026-09-30 stayed 1,198 contracts and 5 pages.

Out of order, delays 2.6 seconds then 0.2 seconds, cap 2, horizon 4 seconds. Arrival order was sequence 2, then 1. Sequence 1 was dropped. Sequence 2 was written. Peak in flight was 2.

Cap 1, delay 2.5 seconds, horizon 4 seconds. One send, one skipped tick, peak in flight 1.

## Spot

`run_spot_scheduler`, recorded mids, fake clock, no chain field.

Seed 20260929, horizon 10 seconds, cap 3, origin 1790000000. Delays uniform from 0.3 to 4 seconds. SPX and XSP frames landed on the 1-second grid. Each frame's keys are `t`, `symbol`, `sequence`, `mid`, and `ts`. `ts` equals the tick. `t` is `spot`.

Out of order: sequence 1 delayed 3.0 seconds, sequence 2 delayed 0.4 seconds, horizon 2 seconds. Sequence 1 was dropped. The kept frame is sequence 2, `ts` 1.0, mid 101.0.

Cap 1, delay 3 seconds, horizon 4 seconds. Sends at 0.0 and 3.0 seconds, sequences 1 and 2. Two ticks skipped. Peak in flight 1. Nothing was queued past the cap.
