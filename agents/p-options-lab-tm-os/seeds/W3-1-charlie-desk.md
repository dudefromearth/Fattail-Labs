# Seed W3-1 — Charlie desk (TMI-91…95)

**Project:** Time Machine One Source  
**Agent:** Charlie  
**Phase:** W3  
**Depends:** W2-G PASS · A2 marks retrieve live (200 on 2026-08-27 through Labs)  
**Law:** spec v0.4 TMI-91…96 · plan v1.3 FP14…20 · AT-TM-OS-10…15  
**Gate it feeds:** W3-G

## Ask

While a playhead is up:

1. **TMI-91.** Analyzer, Heatmap, and Surface consume the held generation as the chain. Not Analyzer-only. Not a live overlay.
2. **TMI-92.** Symbol, VIX, positions, heatmap tiles rebind from that hold. *The original feed.* Not the named-hole law. Not dark-not-hidden.
3. **TMI-93.** A field the archive cannot supply is a named hole. Never a live value. Raise a collection defect; do not paper it over.
4. **TMI-94 / TMI-95.** VIX from Labs `GET /api/me/options-lab/archive/marks` (A2). Nearest-in-time. **`source` travels with the mid.** 08-27 is `massive_proxy_v1`. 08-29 from 00:38:08 is `massive_index_v1`. `generation.vix` null is not a hole. **Do not add `/api/marks`.**
5. **TMI-96.** Positions are **dark, not hidden**, and **light at entry**. Do not invent whether a dark position shows its legs (§13a item 1).

Width Fit Average stays the live ring (OS-9). Reset returns every host to live together.

## Out of scope

Building a marks route. Dash bounce. Tap write. §13a. `seedTodayFromSession` (W2). Instant Replay name.

## Done when

Hosts paint from the hold. OS-10…13 have a path. Diff contains no `/api/marks` implementation.
