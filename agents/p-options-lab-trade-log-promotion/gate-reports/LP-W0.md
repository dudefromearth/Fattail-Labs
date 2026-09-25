# LP-W0 — Pre-implementation review (merged, two independent bench reviews)

**Verdict: RETURNED.** Do not seed LP0. Spec v1.0's own build-authority stamp
overclaims — the prose is not yet a sufficient contract to hand a code agent.
Right change, right size; build it after the blockers below are resolved and
the goldens exist.

**Reviewers:** two independent readings of `Specs/FatTail-Labs-Options-Lab-Analyzer-Trade-Log-Confirmation-Spec-v1_0.md`
cold, synthesized by Coach. Two factual claims spot-checked against the repo
before this file was written (see Evidence).

## Blockers before LP0

### P0-1 — Open clock inversion (the single most important finding)

The spec's flow gives the **close** an editable timestamp defaulting to
`pos.closedAt` (step 3) and never specifies the **open's** clock. Left as
written, the open keeps `analyzerPositionToOpenTrade(pos, new Date())` —
stamped at confirm time. For any card that closed earlier than the moment
it's logged (the normal case, not an edge case), the round trip lands with
the open dated **after** its own close. Every acceptance criterion in v1.0
passes while producing an inverted journal — this feeds the matcher, which
pairs by structure key with FIFO inside a hold window and has no defined
behavior for an open that postdates its close.

**Fix:** the open's `exec_at` must default to the card's actual entry time,
`pos.entryAt` (confirmed present: `AnalyzerPosition.entryAt?: number`,
`web/lib/options-lab/analyzerBook.ts:123`) — not `new Date()`.

**Open question for Coach:** what's the fallback when `pos.entryAt` is
unset/unreliable? (`entryAt` is optional; not guaranteed populated on every
card.)

### P0-2 — Mapper field contract needs two goldens, not prose

"Do not stamp the mapper from this prose." Before LP0, the spec needs exact
expected-output fixtures (golden JSON) for both `analyzerPositionToOpenTrade`
and the new `analyzerPositionToCloseTrade` — concrete inputs → concrete
expected draft objects — not a bullet-point description of fields. LP0's
unit tests should assert against these goldens directly.

### P0-3 — Price validation and close-package sign

Per-leg exit price validation: require finite and **≥ 0** (zero is
legitimate — an expiry close is worth zero). On an off-tick price, **warn,
don't block** — this logs a fill that already happened, not an order;
blocking Confirm against a guessed tick table stops a member from recording
a real price they actually got.

### P0-4 — Snapshot freeze is not optional for a journal write

Spec's own FI-9 ("cheap invalidation tripwire, non-blocking") is
under-scoped for what this actually is: a write to the member's permanent
book. Required, not optional: freeze a snapshot of the position (legs,
strikes, sides, quantities, entry fills) **at dialog-open time**. Leg
identity in that snapshot — and in `exitPrices` keying — must be
**side + strike + right**, not array index; an index-keyed map silently
mismatches prices to the wrong leg if the underlying legs array reorders
while the dialog is open.

### P0-5 — Always send `account_id` (acceptance criterion as written is false)

v1.0's acceptance criterion says the member choosing an account means "the
server no longer silently defaults it for this path" — but `_ensure_default_account()`
(`server/routes/trade_log/common.py`) is still live and unchanged server-side.
Nothing stops it firing if `account_id` is ever omitted from a payload. The
actual invariant: **this path's client code always sends `account_id`,
unconditionally, on both the open and close POST** — not "the UI offers a
choice." Acceptance criterion needs rewriting to state the hard invariant,
not the UI behavior.

### P0-6 — Hotel review is required, not N/A

India's Phase 4 disposition (v1.0, "N/A — simulated fill, not real capital
movement") is corrected here. This writes to the member's **permanent
record**, feeds **campaign stats**, and manual exit-price entry means a
member can type any number into it. That's the same doctrine class as "real
receipted numbers only" — applied to the ledger that produces the receipts,
not the on-air claim itself. Add Hotel to Phase 4 for journal-honesty review
before this spec re-clears Phase 2.

### PPL sequencing collision (missed by both original bench reviewers — India/Echo/Tango — since neither cross-referenced the PPL spec against this one)

`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` names
`POST /api/me/trade-log/trades` as **its own** active work surface directly:
*"PPL-3 / C1-2: the path Coach named. W2 may seed this path"* (line 501),
and separately documents that `create_trade()` **today** does not call
`match_open_close`, does not require a matched open, does not compare
accounts (line 257) — i.e. PPL's own spec describes moving the close-gate
enforcement this dialog leans on (`_close_gate_or_422`, landed as DL-703)
toward gated-or-excepted states and `PATCH`-based re-keying. v1.0 treats
`create_trade()` as a stable, fixed dependency ("no server changes needed").
It is not fixed — it's a second active program's current work surface.
**Needs an explicit Coach sequencing call**: build after PPL's gate changes
land, coordinate the two boards explicitly, or scope this dialog to be
resilient to either shape.

### AT-TLC-7 — two false greens if adopted as drafted

1. The "no `commitBook` between `onSendToTradeLog:` and `onLockNatural:`"
   guard (`undoStack.test.ts:140-157`) goes **vacuous** after this change —
   once the POST/state logic moves into the dialog component, that source
   slice in `OpfRiskAnalyzer.tsx` empties out, and the assertion "slice
   contains no `commitBook`" passes trivially while testing nothing. Needs
   a replacement assertion that actually exercises the post-refactor code
   path (e.g. assert on the new handler/dialog's actual call sites, not a
   source-slice that may no longer contain the logic at all).
2. Any AT depending on `rehearsal.test.ts` passing is unsound as a gate
   input right now — that file is **already red** (pre-existing, unrelated
   stale assertion, confirmed in Spec v1.0's own Constraints section). Fix
   it first, or don't make it a dependency of this program's gate.

## Resolved (Coach dispositions this session)

1. Open clock = `pos.entryAt`. Fallback when unset: **open question**, not
   yet answered.
2. The Log action is **spent after a successful full round trip** — no
   re-logging an already-fully-processed position. This also answers the
   abandoned-partial-failure case: Log stays available specifically to
   retry the missing close, not to restart from zero (ties to P1: a linked
   card — `tradeLogTradeId` already set — must not produce a second open on
   retry).
3. Tick validation: **warn, don't block** (folds into P0-3).
4. "VP A–F sequencing" — no view from either reviewer; unrelated to this
   spec's content, Coach's own call, not tracked here.
5. Gate-error UX (orphan_close / account_mismatch / partial_units /
   structure_drift, if they ever do surface): show **both** — a
   diagnosable code/chip and one plain sentence underneath. Nobody should
   have to search `partial_units` to know what happened.

## Evidence (spot-checked before this file was written)

- `entryAt?: number` on `AnalyzerPosition`: `web/lib/options-lab/analyzerBook.ts:123`
  (also set at `:421-423`, `:639`, `:666`, `:677-678`).
- PPL/`create_trade()` overlap: `Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md:257,501-502,602-603,618`.

## Next

- Juliet amends the Spec (v1.1) to close P0-1 through P0-6, add the two
  goldens, and add the PPL sequencing note — through the same Phase 1-5
  workflow (amendments to an approved spec are new versions, not silent
  edits).
- India/Echo/Tango + Hotel re-run Phase 2-4 against v1.1.
- LP0 does not seed until v1.1 clears review and Coach re-stamps build
  authority.
