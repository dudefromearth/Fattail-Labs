# DLGM — Juliet · sequencing

**Date:** 2026-09-12
**Depends:** India `reviews/DLGM-india.md` **APPROVED** (architecture, not GO)
**Proposal:** `docs/Analyzer-Dialog-Common-Model-Architecture-Proposal-v0_1.md`

## Place in the DAG

Visual iteration (Coach's prototype, Echo) is a **separate stream**. It does
not share a spec version, a DL entry, or this packet. Do not merge them.

```text
DLG2  chrome / layout     ← in flight as visual; not this packet
 └── DLGM  common model   ← this packet, after Coach GO
      └── DLG3  symbol    ← needs the envelope (DLG-SYM-8 unlock)
            └── DLG4  behaviour
```

**DLGM before DLG3.** Symbol change that unlocks and re-derives (DLG-SYM-4 · 8)
is an envelope write. Building DLG3 on a bare `PositionInput` recreates D-PC-7.

Do not start DLGM before Coach GO on a model token (not `DLG-W0` restamped —
a distinct stamp, or an explicit amendment of `DLG-W0` that names DLGM).
India's sign is not GO (DL-328).

## Packet shape (when GO'd)

Exact file list, no extras:

- `web/components/options-lab/PositionBuilder.tsx`
- `web/components/options-lab/OpfRiskAnalyzer.tsx` (seam only)
- characterization tests that already guard PC5 (`positionBuilder.pc5.test.ts`)
  and D-PC-7

Out: `TosControls.tsx` appearance, `tokens.css`, layout Spec, IKI, the card's
look, undo stack type change.

Create seed uses existing `positionFromInput` (or the same defaults) **once**,
inside the dialog or at the host, off-book. Edit receives a copy of the live
record. Save returns `AnalyzerPosition`. Undo still stores `PositionInput`.

## Guard

AT-PC-04 / AT-PC-50 stay green the whole packet. A red PC5 is a stop, not a
follow-up.

## Not this packet

Appearance. DLG3 symbol picker behaviour. A Spec v0.14. A GO restamp of
`DLG-W0.md` for visual work.