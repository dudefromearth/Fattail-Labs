# Time Machine Spec v0.5.1 — Amendment A1

**Date:** 2026-08-27
**Amends:** `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_5_1.md`
**Type:** Amendment. Does not supersede v0.5.1 and does not reissue it. v0.5.1 plus this file is the law.
**Source:** Facts established by the StudioOne Archive Read API program on 2026-08-27 — the disk read, the W1–W4 gates, and the Time Machine contract harness (`server/tests/tm_archive_contract.py`).

**Three corrections. Nothing else in v0.5.1 moves. §0 and §0-A are untouched, and no law is renumbered.**

None of these is a member-facing change. All three are places where v0.5.1 describes the archive as holding something it does not, or as behaving in a way the built API does not.

---

## A1-1 — TMI-45: wings are a property of the day, not the generation

**What v0.5.1 says.** *"Generation geometry governs. A generation carries its own wings and strike step; templates run on its listed strikes; the wing control reflects it and is inert with a named reason."*

**What is true.** The snapshot envelope carries expiration, spot, and full call/put greeks. **It does not carry the wing band.** Wings live in `coverage` and `PROVENANCE.json` — one figure per day, per book. This was confirmed by opening a real envelope on the store, and it is true of **every day already collected**. It is not fixable retroactively and is not a defect: the band is an OPF property (§1 of the archive spec), captured as a day-level setting.

**Coach ruling, 2026-08-27:** it does not matter to the member. The Analyzer paints the legs that exist and follows spot; the band that produced them needs no announcing.

**Replace TMI-45 with:**

> **TMI-45 (A1).** **Generation geometry governs what is painted.** A generation carries its own listed strikes and strike step; templates run on those strikes and on nothing else. **The wing band is a property of the day, not of the generation** — the archive holds one band per book per day, in coverage, and the snapshot does not carry it. The Analyzer therefore takes wings from coverage under replay, and the wing control is inert with a named reason as before. Nothing about the band is surfaced to the member: the panel paints the legs that exist and follows spot.

**One consequence, recorded and deliberately not surfaced.** The capture band **ratchets** — it grows within a session and never drops strikes (v0.5.1 §1). A single day-level band is therefore the widest the band ever reached, typically at the close. A tick early in the session sits under a band wider than the one that existed at that moment. Under Coach's ruling this is not shown and not corrected: the strikes painted at that tick are the real listed strikes for that tick, and the band is not a claim about them.

---

## A1-2 — The past-day source is the chain, and the 1-minute path is retired

**What v0.5.1 leaves open.** §12.14 asks whether a past day still needs the 1-minute underlier path once the chain corpus covers it, or whether the path becomes only the mini-chart skeleton.

**Closed by Coach, 2026-08-27:** *"The current Time Machine grabs 1 minute data directly from OPF, that obviously is going to change, and we will grab it from StudioOne."*

- The **chain is the walk.** Spot at every tick comes from the generation under the playhead.
- The **1-minute OPF pull retires as a data source.** ATM-B1, ATM-P1, ATM-D1, and ATM-D2 describe a source this spec no longer uses for a past day.
- The **mini day window** (ATM-H1, ATM-H2) still needs its picture. It is **downsampled from the chain** — not a second fetch and not a second source of spot. India's "two spots is two truths" concern closes here: there is one source.
- **ATM-P3, P4, P5 (TPO) are not retired by this amendment.** The chain at native cadence is finer than a TPO path, which makes TPO arguably redundant for the walk — but it is Coach's idea and its disposition is Coach's. It carries forward untouched and unimplemented.

**Also closed:** §12.15 (does Basic/Enhanced govern the today derivation). The reason Basic forced GEX and Probability off was that a 1-minute underlier path carries no chain, so the overlay would be lying. **Every selectable date now has a chain behind it.** The original reason is gone. Whether Basic and Enhanced survive as a member control, or become a function of what data sits behind the date, is **still Coach's** — but it should be decided knowing its premise has changed.

---

## A1-3 — Calendar, seam, and the download shape as built

Three facts the archive API now establishes, which the Time Machine chrome consumes:

**The calendar's three states are distinguishable.** Coverage returns a whole day as `rth_complete` with its hours, a partial day with the hours it **actually** covers, and a pre-collection date as a named `none`. That is what Coach's ruling — *"highlight ready data and grey out the rest"* — rests on, and it is now real rather than assumed. A partial day is greyed or painted distinctly on its true hours, never on the hours it should have had.

**The seam is not an error.** A date before the collection window returns a named absence, not a 5xx and not an empty success. `NO PATH` is the hole; the calendar greys it.

**The download shape is confirmed against a real session.** 5,800 snapshots on 2026-08-25 SPX give a derived stride of 64 and seven levels, with **level 0 returning 91 snapshots, each carrying spot**, in under eight seconds. That is TMI-70's coarse pass and TMI-71's fidelity indicator with measured numbers behind them. A windowed fetch returns a single tick without the level around it, so scrubbing does not require holding whole levels.

*(That last property was a proxy defect when the harness first ran — the window was missing from the cache key — and was fixed before this amendment. Recorded so that a future regression is recognized as a regression.)*

---

## What this amendment does not do

- Does not touch **§0** or **§0-A**.
- Does not resolve any of the five blocking opens: **§12.1** cache location · **§12.2** the garbled words · **§12.3** Record vs scrubber-up · **§12.4** 2 s vs DL-400 · **§12.5** the Algo alert · **§12.6** the glow. All remain Coach's.
- Does not retire TPO (§12.13 grain stays open).
- Does not decide Basic/Enhanced — it records that the premise changed.
- Does not touch the archive spec, which is correct as written; every fact here is the archive telling the truth about what is on disk.

---

## Provenance

A1-1 is a correction to advisor law written before the envelope was ever opened. A1-2 and A1-3 record Coach rulings and measured facts that landed after v0.5.1 was written. Folded into a reissued spec at Coach's word; until then v0.5.1 and this amendment are read together.
