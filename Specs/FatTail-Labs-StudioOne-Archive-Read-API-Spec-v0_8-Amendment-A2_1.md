# SO-AR Spec v0.8 — Amendment A2

**Date:** 2026-08-28
**Amends:** `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`, as amended by A1
**Type:** Amendment. Does not supersede v0.8 and does not reissue it. v0.8 + A1 + A2 is the law Delta reads.
**Reason:** A disk read on 2026-08-28 found data that is **captured and unroutable** — not missing, not lost, simply with no way to reach it through this API. Three cases, one shape. Coach: *"if it didn't turn out that way then it is a serious bug that must be fixed."*

## Scope statement (DL-539)

**Active program:** StudioOne Archive Read API.
**Files/trees this amendment touches:** the SO-AR route surface and its tests. Nothing else.
**Touches outside program:** **NONE.** The tap is not changed. Time Machine is not changed — it consumes this when it lands, and that is a separate layer. No dash bounce is authorised by this document.

---

## What the disk read found

Read-only, nothing written, dash not bounced. Store `/Volumes/FatTail2TB/fattail-market-data/ssr/live_capture`, 13 day folders, 2026-08-14 through 2026-08-28.

**The tap captures eighteen option-chain names** in per-symbol folders: AAPL, AMZN, GLD, GOOGL, IWM, META, MSFT, NVDA, QQQ, SLV, SPX, SPY, TLT, TSLA, UNG, USO, XLF, XSP.

An empty folder is not a gap. The tap `mkdir`s the universe, so `AAPL:0` on a date means **that name did not expire on that NY date** — the 0DTE rule (§1), correctly reported as `count=0` / `not_today` / **NOT TODAY**. That part works.

**And the first-class-symbols design did hold on chain.** Coverage with no `symbols=` filter listed all seven books that had files on 2026-08-27; index counts matched disk; level-0 fetch returned QQQ 68 and XSP 71. That was worth confirming rather than assuming.

**Three things are captured and cannot be reached.**

| On disk | Today's answer | Truth |
|---|---|---|
| `marks/vix.jsonl` — **14,622 lines of real mids** on 2026-08-27 | As a chain book: `count=0`, `expiration=UNKNOWN`, `status=none`; index/fetch **404 UNKNOWN** | VIX was captured all along. It is **marks-only** and never appears under `chain/`, so a chain retrieve structurally cannot see it |
| `marks/vix1d.jsonl` | Same | Same |
| **Sixteen further `marks/*.jsonl`** — one per universe underlier, `spy.jsonl` … `aapl.jsonl` | **No marks surface at all. No route.** | An entire data plane — underlier prices at capture cadence for every name followed — unreachable |
| **2026-08-14**: 129 SPY snaps in the old flat layout, `chain/snap-*.json`, no symbol subdirectory | `chain/SPY/` does not exist → **404 UNKNOWN** | **Symbol-completeness is already broken on chain, not only on marks.** The first tape collected is currently the one day that cannot be replayed |

**One shape, three instances:** the capture happened, the route does not exist, and nothing about it looked broken. `generation.vix` exists as a key and is always null, which reads as a wired path until somebody opens a file and counts lines. That is what let it survive.

---

## A2-1 — Serve the marks tape

**Add a marks route.** `marks/` becomes retrievable for every name the tap writes, on every collected day. **Generic.** VIX is one tape among twenty and gets no special handling — serve what is on the tape, whatever it is.

- **Coverage reports marks per date**, distinctly from chain books. A marks tape is not a chain book and must not be reported as one: today's `count=0 / expiration=UNKNOWN / status=none` for `vix.jsonl` describes an absent book, when what exists is a present tape. **That is a lying answer and it goes.**
- **Retrieval is nearest-in-time to a requested instant.** A generation at 14:32:06 takes the mark nearest that instant. Same grammar the chain already uses.
- **Near (Coach, 2026-08-29) = 15 seconds as the GAP floor.** The print rate settles it: VIX marks land every 5.7 seconds, so 15 is 2.5× the marks cadence — the same multiplier the chain uses, landing on a different number because the tape is slower. Typical nearest during RTH is about 3 seconds, half an interval. Fifteen is the stall detector, not the match distance. On 2026-08-27 it would have fired exactly twice, on the two real stalls at 20.9 seconds, and never during the session. That is the right shape. Farther than **max(2.5 × observed marks cadence, 15 s)** → hole **`MARK GAP`** (200, named). Never last-observation-carried-forward.
- **A stretch of tape with no mark near the requested instant is a named gap** — never carried forward from the last known value. A stale number that moves plausibly is the failure mode this whole spec exists to prevent (OT-EF, DL-309).
- **A null `generation.vix` is not a gap.** Every envelope already written carries that key null, so treating null as the hole would make every collected day report a hole forever, even once the tape is being read. **The hole belongs to the tape, not to the envelope field.**
- **This read must not wait on the tap ever writing `generation.vix`.** An implementation that blocks on that key is a defect: the tape exists now, for every day already banked, and the envelope field may never be populated.
- **Provenance travels with the value.** The tape already carries `source` (`massive_proxy_v1` when proxied) and `label`. The archive path keeps those as **their own fields**, the same way the Practice symbols page keeps Proxy in its own column rather than in MID. MID is a number. Source is how it was made. Nobody mistakes a proxy for a native print.
- **`VIX NOT NATIVE` (Coach, 2026-08-29 — fold when the route is built).** A **daily stats flag** on any day whose VIX source is not native. The feed fix leaves VIXY as a labelled fail-over, which is correct — but a future entitlement lapse would silently return us to ETP prices, and that is exactly how this went unnoticed for thirteen days. Coverage carries the flag for that day. When the nightly stats pass runs, the same name lands in §7.3 `flags[]`. VIX1D is the same treatment. Native is not inferred from the number. Source is the field. A proxied mid can never be read as a native print.
- **Batch shape.** A screen showing many symbols makes **one call**. Query takes a symbol set and one instant; the response is one row per name. Not twenty round trips.
- **I:VIX entitlement is parked for this route.** The marks path does not wait on it. If native index values land later, **the route does not change — only the values get better**, and the day's `VIX NOT NATIVE` flag clears when source is native.

**All eighteen underliers, plus VIX and VIX1D, plus session.** `session.jsonl` carries session and market_status and is served on the same route; whether any consumer wants it is not this amendment's question, but it is captured and it is not to be left unroutable for the same reason as the rest.

**§9 item 2 of v0.8 is closed.** It carried a position that `marks/` should stay unserved, on the reasoning that past days come from the chain and a second source of spot is the two-truths problem. **That reasoning was wrong on the facts.** VIX is not a second source of spot — it is a different instrument the desk displayed and the chain never held. The advisor wrote a position without knowing what the tape contained. Coach (2026-08-29): reverse accepted.

## A2-2 — The flat day

**2026-08-14 is served.** Its 129 snaps are SPY in the pre-subdirectory layout. Coverage, index, and fetch resolve `SPY` on that date to `chain/snap-*.json` rather than 404ing on a `chain/SPY/` folder that was never written.

The layout is read at the source and adapted at the read; **the day is not rewritten** and the tap is not changed. It is the first tape collected and it should not be the one day that cannot be replayed.

**COUNTS-missing is not a general retrieve.** v0.8 refuses a book it cannot identify (`UNKNOWN` / 404 when COUNTS has no expiration) rather than guessing. That refusal stands. **This day is the exception because it is unambiguous: 129 snaps, one book, the pre-subdirectory `chain/snap-*.json` layout, and that layout is SPY.** The carve-out is **scoped to that flat layout only.** It is not an "identify it anyway" path for a nested `chain/<SYM>/` book whose COUNTS row is missing.

**Coach (2026-08-29):** carve-out accepted as written. Scoped to 08-14 only, flat layout, 129 snaps, one book. Nested `chain/<SYM>/` still 404s when COUNTS cannot identify it. Do not let this become a general identify-it-anyway path.

## A2-3 — Symbol-completeness is a law, not an intention

**Everything the tap captures is retrievable through coverage, index, and fetch.** Not "symbols are a first-class dimension" as a design sentiment — a testable property with a test that fails when it is false.

A symbol-date with no folder is greyed exactly as an uncollected date is greyed (§9 item 4). A symbol-date whose data exists on disk in **any** layout is reachable.

---

## Acceptance

| ID | Criterion |
|---|---|
| **AT-SOAR-50** | **The proof that fails today.** A day collected before this feature — 2026-08-27 — returns **real VIX values matching the tape**, not empty and not UNKNOWN. Null or empty means the route is wrong, **not that the day lacks VIX**: the tape has 14,622 lines with a first print of `mid=17.855`. **Live day, not a fixture. A fixture does not close 50.** |
| **AT-SOAR-51** | Every `marks/*.jsonl` the tap writes is retrievable — VIX, VIX1D, and all sixteen underlier tapes. A count of served names equals a count of files on disk. |
| **AT-SOAR-52** | Nearest-in-time returns the mark nearest a requested instant. **GAP floor = 15 s** (2.5× marks cadence). A synthetic tape with a deliberate gap returns a **named gap** at an instant inside it, never the last known value. |
| **AT-SOAR-53** | A null `generation.vix` on a pre-feature day does **not** produce a gap. The tape supplies the value. |
| **AT-SOAR-54** | The marks route works with `generation.vix` absent entirely. Nothing blocks on that key. |
| **AT-SOAR-55** | **2026-08-14 SPY** resolves through coverage, index, and fetch. The flat layout is read; the day is not rewritten. |
| **AT-SOAR-56** | **Symbol-completeness.** For every collected date, every symbol with data on disk in any layout is fetchable. The test enumerates the disk and fails on the first unreachable name. |
| **AT-SOAR-57** | Coverage distinguishes a **marks tape** from a **chain book**. A tape is never reported as `count=0 / expiration=UNKNOWN / status=none`, which describes an absent book rather than a present tape. |
| **AT-SOAR-58** | **Batch.** One call with many symbols and one instant returns one row per name. `source` / `label` sit beside `mid`, not inside it. A `massive_proxy_v1` tape stays labeled through the archive path. |
| **AT-SOAR-59** | **`VIX NOT NATIVE`.** A collected day whose VIX tape `source` is not native (including `massive_proxy_v1`) is flagged on coverage, and on §7.3 `flags[]` when stats run. 2026-08-27 flags. A synthetic native tape does not. The number is not the proof — the source field is. |
| **AT-SOAR-45** | Unchanged and still binding. Collection outranks reads; the marks route takes a worker from the same pool. |

---

## First principles (FP-Mode)

| | |
|---|---|
| **Object** | Captured data with no route: marks for twenty names, and 2026-08-14 SPY. |
| **Layer** | **Tech, SO-AR only.** Not the tap. Not Time Machine. One layer. |
| **Smallest reversible step** | Add the marks route; adapt the flat-day resolution. No schema change, no migration, no rewrite of anything on disk. |
| **Local proof that can fail** | AT-SOAR-50 on 2026-08-27 and AT-SOAR-55 on 2026-08-14. Both fail today, and their failing is the evidence the defect is real. |
| **Rollback** | Remove the route. The flat-day resolution reverts to 404, which is the current behaviour. |
| **Invariants** | Named holes over invented values; no writes to the store; collection outranks reads; nothing carried forward from a last known value; 15 s GAP floor; a proxied VIX cannot be read as native and a non-native day is flagged. |

---

## What this amendment does not do

- **Does not change the tap.** Whether it begins writing `generation.vix` into the envelope is Coach's and is outside this document.
- **Does not wait on I:VIX entitlement.** Parked. Massive subscription. Blocks nothing. The route is generic.
- **Does not change Time Machine.** Consuming marks, and asking coverage for more than one symbol, is the next layer. Noted so it is not lost: **Time Machine currently calls coverage with a single symbol** (`coverageUrl(symbol)`), so the route existing is not the same as the desk using it.
- **Does not rewrite 2026-08-14** or any other day.
- **Does not authorise a dash bounce.** That is Coach's word, as it was for A1.
- **Does not decide** whether any consumer wants `session.jsonl`.

---

## Provenance

The unroutable marks and the flat-day 404 were found by a disk read Coach ordered before any change was written — *report the disk read first, before writing anything.* The read was the right first step and it found more than the question asked about: the VIX finding was known, the sixteen underlier tapes and the broken first day were not.

§9 item 2's position against serving `marks/` was the advisor's, written without knowing what the tape held. It is withdrawn here.
