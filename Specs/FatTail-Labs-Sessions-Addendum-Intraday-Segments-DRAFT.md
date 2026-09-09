# Sessions Spec — Addendum §12: FatTail Intraday Segments

**Status:** DRAFT for Coach. Not BUILD AUTHORITY. Do not implement until stamped.  
**Parent:** `Specs/FatTail-Labs-Sessions (Global Session Clock).md`  
**Parent sha1 at GO:** `81984ba9f2394d52aa359cefcdb108451fdec9e3`  
**Parent sha1 after OD-S7 beside-note:** `fab85adacefc4898ab377930154d5b8bfef8cd7c`  
**Intended landing:** Spec version bump (**v0.2** default; **v1.1** if Coach treats the GO text as v1.0) plus one DL entry.  
**Origin:** Coach, 2026-09-09 — *"My clock should be superimposed over the US market session."*  
**MACHINE:** dev machine holding the `Fattail-Labs` checkout. Document only.

Coach stamps this file (or folds §12 into the parent Spec). Chat is not the stamp (DL-328).  
`sessionView` closed at GSC2-G — this is **GSC2.5**, not a GSC4 rendering detail.  
OD-S4 remains a separate GSC4 block.

Defaults in §12.7 hold if Coach is silent. L6 (`Sessions`) stands unless Coach ticks a rename at the same stamp (§12.10 / OD-S8).

---

## 12.1 What this adds

The global clock renders **exchange fact**: when venues are open. This addendum superimposes the
**FatTail teaching frame** on the US cash session — the three named segments Coach uses to divide
the trading day.

Three segments, ET clock times, over the US cash session:

| Segment | ET window |
|---------|-----------|
| **Morning** | 09:30 – 12:30 |
| **Afternoon** | 12:30 – 14:30 |
| **Closing** | 14:30 – 16:00 |

Boundaries are **wall-clock times, not proportional divisions**. They do not scale.

## 12.2 The honesty requirement (Hotel)

Everything else on this chart is an exchange fact. These three segments are **a FatTail framework,
not market structure**. Nothing structural happens at 12:30 or 14:30 — no auction, no settlement,
no change in venue behavior.

The rendering must make that distinction visible, and §11 gains a disclosure saying so in plain
words. A member who comes away believing the market itself changes gears at 12:30 has been made
worse by this page, which is the exact failure Hotel's gate exists to catch.

Practically: segments render as a distinct visual layer — a labeled ribbon aligned to the RTH band —
not as bars, ticks or grid lines that read like the venue rows above them. Echo owns the treatment.

## 12.3 The copy requirement (Tango)

Segment names are **descriptive of the clock, never of opportunity**. No "prime hours," no "best
window," no implication that one segment carries more edge than another. Invariant 14 applies with
full force here — this is the single most likely place in the page for profit theater to enter,
because naming parts of the day invites ranking them.

"Afternoon" says when. It must never say whether.

## 12.4 Behavior on non-standard days

| Day | Segments |
|-----|----------|
| Normal session | All three, at the stated ET boundaries |
| **Early close (13:00)** | **Truncate, do not compress.** Morning renders whole (09:30–12:30). Afternoon renders truncated (12:30–13:00). Closing is **absent** — not shrunk, not relabeled |
| US full close (holiday) | All segments absent. The RTH band is already absent; the ribbon follows it |
| Weekend | Absent |
| Non-today date | Rendered, but with no "current segment" state |

Truncation, not compression, follows from §12.1: the boundaries are wall-clock. A member who has
learned that Afternoon starts at 12:30 must see 12:30 on a half day too.

## 12.5 State — belongs to `sessionView`

`sessionView` gains, alongside banner kind and per-row state:

- `segments`: the ordered list actually rendered for the selected date, each with label, axis start,
  axis end, and whether it was truncated.
- `currentSegment`: which segment contains "now" — **only when the selected date is today and the
  US cash session is open**. Otherwise `null`. It is never inferred on a closed day, a weekend, or a
  past date.

Components render these. **Components do not compute segment boundaries, do not compare the clock
to 12:30, and do not decide truncation** (L11, invariant 16).

Segment definitions live in a new pure module, `web/lib/sessions/segments.ts` — same purity rules as
its siblings: no React, no `next/*`, proven by `npx tsx` under bare Node.

## 12.6 StatusBanner

When `currentSegment` is non-null, the banner may name it — *"Open · Afternoon"* — in Tango's copy.
When null, the banner is exactly what it is today. Naming where the member is in their own frame is
the highest-value part of this addendum; it is also the easiest place to slip into advice, so the
string set is Tango's to write and Hotel's to check.

## 12.7 Open questions for Coach

1. **Boundaries confirmed?** 09:30 / 12:30 / 14:30 / 16:00. (Your message read "12:3-" — assumed
   12:30.)
2. **Labels confirmed?** Morning · Afternoon · Closing — exactly these words on screen?
3. **Truncate vs compress on early-close days** — §12.4 assumes truncate. Say if you want compress.

Defaults above hold if you're silent.

## 12.8 Acceptance additions

| ID | Date | Assertion | Owner | Class |
|----|------|-----------|-------|-------|
| **AT-GSC-50** | 2026-09-08 | Three segments at 09:30 / 12:30 / 14:30 / 16:00 ET; axis positions match `toAxis` of those times | Kilo | tsx |
| **AT-GSC-51** | 2026-11-27 | Early close. Morning whole; Afternoon truncated at 13:00 and flagged truncated; **Closing absent** | Kilo | tsx |
| **AT-GSC-52** | 2026-11-26 | Thanksgiving. `segments` empty; `currentSegment` null | Kilo | tsx |
| **AT-GSC-53** | 2026-09-05 | Weekend. `segments` empty; `currentSegment` null | Kilo | tsx |
| **AT-GSC-54** | — | `currentSegment` is null on any non-today date, including a past open day | Kilo | tsx |
| **AT-GSC-55** | — | Segment ribbon is visually distinct from venue rows; §11 framework disclosure present | Echo · Tango | shot |
| **AT-GSC-56** | — | No segment label or copy implies one part of the day is better to trade | Tango | static |

## 12.9 Execution — where this lands

`sessionView` closed at GSC2-G, so this cannot be folded into GSC4 as a rendering detail.

**GSC2.5 — segments (pure), narrowly scoped**

| Seed | Agent | Intent |
|------|-------|--------|
| GSC2.5-0 | Charlie | Create `web/lib/sessions/segments.ts`. Extend `sessionView.ts` with `segments` and `currentSegment`. **No other file.** |
| GSC2.5-1 | Kilo | AT-GSC-50 … 54, bare Node, both process TZs |
| GSC2.5-G | Delta | Tests green; purity intact; `git diff --stat` = those two files plus tests; no regression in AT-GSC-20/21/22 |

Then **GSC4 gains** the ribbon (Charlie), its visual treatment (Echo, AT-GSC-55), the §11 framework
disclosure and banner strings (Tango, AT-GSC-56). The GSC4 runner already sent needs only its write
allowlist extended and these ATs appended — its structure is unchanged.

`timeAxis.ts` and `exchanges.ts` stay closed. This adds a file; it does not reopen them.

## 12.10 Naming

With segments on the canvas, the nav label `Sessions` now denotes a fourth distinct thing in Labs —
alongside Live Sessions (the show, the room, the retro) and Journal Sessions (the entries and their
`pre_open`/`intraday`/`post_close` phases).

L6 locks the label as exactly `Sessions`. That lock was made before this collision was visible.
Worth a decision at the same stamp as this addendum: keep it, or rename to something that does not
collide — *Market Clock*, *Trading Day*. Not a blocker, but it gets more expensive to change after
members learn the nav.

**Proposed OD-S8** (Coach ticks at this stamp; default if silent = keep L6):

- [ ] **(a)** Keep `Sessions` exactly (L6 stands).
- [ ] **(b)** Rename. Coach writes the string. GSC3 path and title slot follow. Not a GSC2.5 write.
