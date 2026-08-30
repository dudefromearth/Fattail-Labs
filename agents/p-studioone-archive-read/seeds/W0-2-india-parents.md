# Seed W0-2 — India parents / as-built

**Project:** p-studioone-archive-read  
**Agent:** India  
**Phase:** W0  
**Depends:** W0-1  
**Law:** SO-AR v0.8 + Amendment A1 · Arch 28 · OT-EF · DL-597 · plan v2.1  
**Gate it feeds:** W0-3…6 · W0-G

## Ask

**APPROVED** or **RETURNED** (build readiness). BLOCKING vs ADVISORY labeled.

Must say, first:

1. This API is **archive read**, not Time Machine chrome, not Instant Replay film, not OPF band control.  
2. One market WebSocket — **no client Massive**. Browser never calls StudioOne.  
3. **As-built quotes** (path + line):

| Item | Quote |
|------|--------|
| Store root (`LABS_MARKET_DATA_ROOT` / `data_root()` / FatTail2TB) | |
| Snap glob (`snap-*.json`) nested vs Friday-flat 08-14 | |
| `front_expiration` / `not_today` | |
| `COUNTS.json` `expiration` | |
| `PROVENANCE.json` `wings` | |
| `CHECKLIST.json` finalize | |
| Prior art: `ssr_archive_read.py` index still opens envelopes? | |
| StudioOne dash **absence** of `ssr_archive_read.py` | |

4. Quote spec leftovers (plan §0.3): §0.11 vs §6.1; §0.16 vs v0.7+ scope; **§4.2 required expiration vs §2 optional** (spec-C); leftover “filename carries its own date” cells.  
5. **§9b:** census on **store** `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture` · `chain/<SYM>/` · 88/127 wrap. Do not say “gold.”  
6. Window checked on store wrap file (`snap-000000997Z` vs `captured_at`). Two-in-window `[04:00Z,05:00Z)` is **A1-2** (not a plan invention): nearest envelope (5 min bound) → neighbour-monotonic → in-window mtime → `AMBIGUOUS INSTANT`.  
7. **A1-1 is law.** Quote A1’s replacement paragraph. The v0.8 “Why not the obvious rule” proof is **struck** by the amendment; do not treat it as law. Window and local-date **agree on every ordinary day** and diverge only on fall-back Sunday.  
8. Admin panel §7.4: **content here, mount out**. Do not approve admin-tree edits on this board.  
9. Parents *confirm*: Arch 28, OT-EF v1.1, TM Day spec filename, TMI spec filename.

A table without file quotes is **RETURNED**.

## Done when

Written verdict. No product code.
