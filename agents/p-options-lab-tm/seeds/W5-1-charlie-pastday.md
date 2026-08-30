# Seed W5-1 — Charlie past-day StudioOne

**Project:** Options Lab Time Machine  
**Agent:** Charlie  
**Depends:** W4-G PASS  
**Law:** ATM-C1 · ATM-C3 · ATM-H2 · ATM-H4 · TMI-70 · TMI-71 · TMI-69 · TMI-45 · FP6 · FP2 · AT-TM-C4  
**Files:** browser consumer of SO-AR coverage / index / levelled fetch, writing the **archive slot**. Contract: `server/tests/tm_archive_contract.py`. Do **not** rebuild the archive reader.  
**Out:** TPO · 1-minute / 5-minute OHLC as the walk · `algo_replay_path` `ohlc_1m` as a past-day source · serial left-to-right-only fill · MiniTwo · Spaces · Factory · inventing prints · pausing today’s capture · discarding today’s cache

## Ask

1. A past day fills the **archive slot**. Consume coverage · index · levelled fetch. Coarse pass first (whole session), then stochastic infill (TMI-70). Fidelity indicator (TMI-71).
2. **Today’s slot keeps capturing.** Capture does not pause. Today is not discarded.
3. Switching past day A → past day B **discards A before accepting B**. One archive day. Today remains.
4. Returning the date control to today, or Reset, discards the archive slot. Today’s cache is still there. The playhead parks on **today’s newest**, not a leftover past-day `t_ms`. Capture never paused.
5. Mini **line** is a downsample of the **same** generations (ATM-H2). Not a second fetch.
6. Uncovered dates are **not selectable**. Calendar greys them. Archive names **NO PATH** (AT-TM-C4).
7. **No 1-minute underlier fetch.** `server/market_data/algo_replay_path.py` offering `source: "ohlc_1m"` is the leftover this packet retires as a replay walk. Do not walk it.
8. Spot and scale bind to that session’s open (ATM-O1). FETCHING must not show the previous paint as the new tick.

W2 occupancy is **not closed**. With a real past day loaded, **demonstrate**:

- **Switch** Tuesday → Monday discards Tuesday **before** Monday is accepted (one archive day).
- **Reset / return-to-live** drops the archive slot; **today’s cache is still there** and capture never paused.
- **Today keeps capturing** the whole time the archive day is open (gen count on today still grows).

## Done when

A covered past day walks the chain in the archive slot. Today’s cache is still filling. An uncovered date is grey + NO PATH. Switch / Reset / capture-while-archive are **shown**, not inferred from an empty slot. `git grep` of this packet’s walk path does not call 1-minute OHLC. Delta W5-G.
