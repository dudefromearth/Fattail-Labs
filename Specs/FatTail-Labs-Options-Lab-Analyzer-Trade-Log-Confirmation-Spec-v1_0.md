# Options Lab Analyzer — Trade Log Confirmation Dialog

**Spec version:** v1.0
**Status:** BUILD AUTHORITY (Coach GO — DL-539 override, this session)
**Board:** `agents/p-options-lab-trade-log-promotion/`

## Phase 0 — Coach intent (verbatim, preserved)

> Let's turn to the Analyzer, Position Card feature called "log" which sends a
> closed position to the Trade Log. The problem is there is no control over how
> that trade gets input into the log. So, here the change I want. When you click
> on the Log link, a dialog should appear allowing you to choose whether to send
> the position as opened or closed, and to also choose account and campaign that
> it should be associated with.

Follow-up disposition from Coach (same session, answered via clarifying
questions — Phase 0 refinement, not a later phase overriding intent):

- When "Closed" is chosen, default behavior is a **full round trip**: an open
  fill and a linked close fill, created together — not a lone/orphan close.
  The dialog also offers an explicit option to send **only** an opened
  position (today's existing behavior).
- Exit/close leg fill prices are **entered manually** in the dialog — no
  attempt to back-derive them from the card's aggregate `closedPnl` (that
  number is a single signed book-mark figure, not itemized per leg).

## Problem statement

The Position Card's "Log" button (`web/components/options-lab/AnalyzerPositionsList.tsx`
~line 1084-1099) currently fires immediately on click:
`onSendToTradeLog(pos.id)` in `web/components/options-lab/OpfRiskAnalyzer.tsx`
(lines 1866-1896) builds a draft via `analyzerPositionToOpenTrade(pos, new
Date())` and POSTs it straight to the Trade Log with **no member input**.

Two concrete gaps:

1. **No open/closed control.** The mapper (`web/lib/options-lab/analyzerToTradeLog.ts`
   lines 85-123) always emits `pos_effect: "TO_OPEN"` legs — even when the card
   already shows the position as closed (`pos.closedAt` set). The Trade Log
   never learns the position was actually closed unless the member separately
   closes the *same* trade later, manually, inside the Trade Log UI itself.
2. **No account/campaign control.** The draft carries no `account_id` /
   `practice_campaign_id` at all. The server (`create_trade()`,
   `server/routes/trade_log/trades.py:424-625`) silently falls back to
   `_ensure_default_account()` and whatever campaign-memory resolution
   `practice_spine_domain.resolve_trade_campaign_id()` picks — the member has
   no say in either.

## Success metrics / acceptance criteria

- Clicking **Log** on a Position Card always opens a confirmation dialog first
  — no trade is created on click alone.
- The member can explicitly choose an **account** before any trade is created
  (server no longer silently defaults it for this path).
- The member can explicitly choose a **campaign**, or leave it undirected
  (server memory/eligibility resolution still applies when left blank — this
  is a legitimate choice, not a gap).
- The member can choose to log the position as **Open only**, or — when the
  card is already closed — **Open + Close** (a full realized round trip),
  which is the default whenever `pos.closedAt` is already set.
- When "Open + Close" is chosen, the member enters real exit fill prices per
  leg before the dialog will submit; nothing is fabricated or defaulted to a
  fake price.
- A partial failure (open succeeds, close fails) is reported truthfully as
  partial, never as full success — matches the OPF Truth / Elegant Failure
  doctrine's "never a silent lie" standard even outside the Options Lab's
  P&L-critical surfaces.
- No regression to existing Log-button gating (hidden for rehearsal cards,
  disabled during Time Machine) or to the undo-stack exclusion of this
  promotion path (it must continue to bypass `commitBook`, per the existing,
  deliberately-tested constraint — see Constraints below).

## Member experience impact

- Adds one interaction step (a modal) to a previously single-click action.
  This is the point of the change — control over where money-tracking data
  lands is worth one extra click for a workflow that writes to a member's
  permanent Trade Log record.
- No existing flow is removed. A member who wants close to today's exact
  behavior (open-only) can still get it — but must now actively pick an
  account (the dialog does not silently inherit a server default; resolved
  below via a single-account pre-select).
- Touches only the Options Lab **Analyzer** surface (Family B app chrome, not
  Family A course/catalog). No change to the Trade Log app itself.

## Scope boundaries

**In scope**

- A new confirmation dialog on the existing Log button, reusing the existing
  `Modal` primitive (`web/components/ui/Modal.tsx`) and the same
  import/composition pattern as `AlertBuilderDialog.tsx` (`Modal`/`Button`/
  `IconButton`, footer Cancel + primary Confirm).
- Account selection, reusing the existing `fetchAccounts()`
  (`web/lib/tradeLogAnalytics.ts:89-96`) + `TradeSheet.tsx`'s account-`<select>`
  pattern (lines 1557-1591) for data/wiring — styled with `AlertBuilderDialog.tsx`'s
  tokenized `field`/`lab` classes, not `TradeSheet.tsx`'s own non-tokenized
  `field` const (Echo review finding — see Review verdicts).
- Campaign selection, reusing `fetchEligibleCampaigns()`/`fetchCampaigns()`
  (`web/lib/practiceSpineApi.ts:516-548`) + `TradeSheet.tsx`'s campaign-`<select>`
  pattern (lines 2231-2259, including its `!c.is_ledger` filter).
- Open-only vs. Open+Close toggle (`SegmentedControl`), with manual per-leg
  exit price entry for the close path.
- A new close-side mapper, `analyzerPositionToCloseTrade`, in
  `web/lib/options-lab/analyzerToTradeLog.ts`, modeled on the Trade Log's own
  `buildCloseDraftFromOpen` (`web/lib/tradeLog.ts:693-730`).

**Explicitly out of scope**

- No server-side changes. `create_trade()` already accepts `account_id`,
  `practice_campaign_id`, and (via `_intended_open_from_book`) an
  `intended_open_id` pairing hint — confirmed by direct reading of
  `server/routes/trade_log/trades.py:424-625` and
  `server/trade_log_domain/close_gates.py`.
- No change to how the Trade Log's *own* UI (`TradeSheet.tsx`) creates or
  closes trades — this spec only touches the Analyzer's promotion path.
- No cross-dialog locking between this new dialog and the existing position
  Builder/edit dialog (`onEdit`) — see Constraints, FI-5.
- No auto-derivation of exit prices from live per-leg quotes or from the
  card's aggregate `closedPnl` — Coach's explicit choice this session.

## Known constraints and risks

- **Undo-stack exclusion is load-bearing and tested.** The existing
  `onSendToTradeLog` handler deliberately bypasses `commitBook` and uses raw
  `setPositions`/`linkTradeLogId` instead — `web/lib/options-lab/undoStack.test.ts:140-157`
  slices `OpfRiskAnalyzer.tsx`'s source between `"onSendToTradeLog:"` and
  `"onLockNatural:"` and asserts no `commitBook` call appears in that slice.
  Any rewrite of this handler must preserve that shape (same prop/key name,
  same non-`commitBook` state path) — a rename or restructure would make the
  guard's `indexOf` silently return -1 rather than fail loud.
- **`rehearsal.test.ts` string-matches the raw button source** (`/onSendToTradeLog
  && !pos\.rehearsal/` against `AnalyzerPositionsList.tsx`). The prop/callback
  name must not change for this reason too. (This specific test is already
  failing today on an unrelated stale assertion — pre-existing, not caused by
  or fixed by this work.)
- **No per-leg exit price exists anywhere on `AnalyzerPosition` today.**
  `LegInput` (`web/lib/options-lab/positionTypes.ts:21-30`) only has
  `entry_price`; the only live pricing on the card is aggregate
  (`livePackagePerShare`, `lastNatSigned`). Manual entry is therefore not
  just Coach's preference but close to the only accurate option available
  without new quote plumbing (out of scope).
- **Editing a card while its Log dialog is open** could desync per-leg exit
  prices (keyed by leg index) from what the member sees when confirming.
  Nothing in the existing `builderOpen`/`editId` state machinery prevents
  both dialogs being open simultaneously. Flagged (FI-5), not solved here.
- **Position Control promotion semantics (AT-PC-45, PC9b) are the prior art
  this spec extends**, not replaces — `analyzerToTradeLog.ts`'s own header
  comment ("Mapper rewrite (PC9b / PC-LIFE-10)...") and `canPromoteToTradeLog`'s
  two gates (Time Machine, rehearsal) are unchanged invariants this spec must
  respect, not redesign.

## High-level flow

1. Member clicks **Log** on a Position Card (unchanged entry point, unchanged
   double gate: hidden for rehearsal AND refused inside the handler if
   `pos.rehearsal` — `rehearsal.test.ts:78-89` confirms both checks exist
   independently; neither is redundant with the other and this spec touches
   neither).
2. Dialog opens (kit `Modal`, styled per `AlertBuilderDialog.tsx`'s tokenized
   `field`/`lab` classes). Contents: Account select (pre-selected when exactly
   one active account exists; blank and required only when 2+ exist),
   Campaign select (defaults to "Undirected"), and — only if
   `pos.closedAt != null` — a `SegmentedControl` Log-as toggle defaulted to
   "Open + Close." If the card is still open, the toggle is absent and only
   "Open only" is possible.
3. If "Open + Close": a compact per-leg price grid (not a stacked sentence
   list — real concern for 4-leg Iron Condors) with a live running net
   debit/credit total, plus a close timestamp (default `pos.closedAt`,
   editable). Confirm stays disabled until every leg has a real entered price
   and an account is chosen.
4. On Confirm: adopt `AlertDialog`'s `busy` convention — both footer buttons
   disable, Confirm label swaps to "Sending…", Esc/scrim disabled — since
   this is two sequential network calls, not the synchronous save
   `AlertBuilderDialog` itself uses. Open fill is created first; on success
   it's linked to the card (`linkTradeLogId`) exactly as today. If
   Open+Close, the close fill is created second, pinned to the just-created
   open via `intended_open_id` (so the server's structural auto-pairing/close-gates
   — `_close_gate_or_422`, `orphan_close`/`account_mismatch`/`partial_units`/
   `structure_drift` — have an unambiguous target and shouldn't realistically
   trigger on this path, since legs/account are identical to the open, just
   reversed).
5. Success/partial-failure/failure are reported as distinct, truthful states.
   On partial failure (open landed, close failed): keep the dialog open with
   an inline `Banner tone="warning"` naming exactly what succeeded/failed,
   and change Confirm to retry only the close leg — never a blank re-submit
   of both. When "Open only" is chosen on an already-closed card, the success
   message must not claim a future Trade Log close will sync back here
   (`applyTradeLogCloseIfAny` no-ops permanently once `pos.closedAt` is set —
   `web/lib/options-lab/analyzerTradeLogSync.ts:29`); use distinct copy for
   that case. Dialog closes only on a fully successful path.
6. (Flagged, not solved here) if the card's legs/strikes mutate underneath an
   open Log dialog with entered exit prices, the dialog should at minimum
   visibly invalidate those stale entries rather than let the member confirm
   against legs that no longer match. Worth doing in the same pass if
   trivial, not a hard requirement to ship v1.

## Ideas inventory

| ID | Idea | Disposition | Notes |
|----|------|--------------|-------|
| FI-1 | Account select starts blank, forcing an explicit choice rather than pre-selecting a default | **IN-SCOPE, refined by FI-8** | Directly serves Coach's stated problem — a silent default was the complaint. Refined: blank only matters when there's a real choice (2+ accounts). |
| FI-2 | Campaign select defaults to "Undirected (or memory if set)", matching `TradeSheet.tsx` convention | **IN-SCOPE** | Reuses established pattern; campaign choice is genuinely optional per the server contract. |
| FI-3 | Open+Close is the default toggle state when the card is already closed | **IN-SCOPE** | Explicit Coach answer this session. |
| FI-4 | Manual per-leg exit price entry (vs. auto-derived from `closedPnl`) | **IN-SCOPE** | Explicit Coach answer this session. |
| FI-5 | Cross-dialog locking so editing a card while its Log dialog is open can't desync exit prices | **FLAGGED** | Real gap, not solved here — no existing state machinery for it. Follow-up candidate. |
| FI-6 | Auto-derive close leg prices from live per-leg quotes (new plumbing) | **DEFERRED** | Would require new quote wiring not currently on `AnalyzerPosition`. Natural "if we ever want less typing" follow-up. |
| FI-7 | Let "Open only" on an already-closed card silently reuse today's "Linked — a Trade Log close will close it here too" message | **FLAGGED → RESHAPED** | Misleading once `pos.closedAt` is set — `applyTradeLogCloseIfAny` no-ops permanently. Reshaped into distinct copy (High-level flow step 5). |
| FI-8 | Pre-select account when the member has exactly one active account; leave blank only at 2+ | **ADOPTED** | Folded into High-level flow step 2. |
| FI-9 | Cheap invalidation tripwire if a card's legs mutate while its Log dialog is open | **ADOPTED, non-blocking** | Folded into High-level flow step 6 — do in the same pass if trivial, not required for v1. Distinct from FI-5 (full cross-dialog locking), which stays flagged. |
| FI-10 | Compact per-leg price grid + live running net debit/credit total for Open+Close entry | **ADOPTED** | Folded into High-level flow step 3 — answers multi-leg (Iron Condor) crowding with a concrete layout direction. |
| FI-11 | House convention: any `Modal`-composed dialog doing async network calls adopts `AlertDialog`'s `busy` pattern | **FLAGGED** | This dialog adopts the convention regardless (step 4); flagged as a reusable kit pattern worth documenting in the HI Spec — not currently written down anywhere. |

## Review verdicts (Phase 2-3)

| Reviewer | Domain | Verdict | Summary |
|----------|--------|---------|---------|
| **India** | Spec & architecture | RETURNED (build readiness), resolved below | Every technical/architectural claim checked out on direct read (server support, undo-stack test, close-gate alignment). Block was **DL-539**: target files are named "does not touch" in three recent decisions (DL-700, DL-702, DL-703); no active tree covers them; Position Control (original PC9b owner) is closed. |
| **Echo** | HIG / design | **APPROVED** | Design intent is HIG-compliant, kit-only, no invented chrome. Named `SegmentedControl` for the toggle; caught a real styling-source conflict between the two cited reference patterns (resolved in Scope boundaries); named the `busy`-state convention for the two-POST async flow; specified a real layout answer for multi-leg price entry. |
| **Tango** | Member experience | **APPROVED** | No capacity/dependency or profit-claim/humiliation violation; the confirmation gate is a legitimate data-integrity control, not a retention mechanic. Contributed FI-8 (single-account pre-select) and FI-9 (staleness tripwire). |

Phase 4 (domain specialists — Hotel/Sierra/Mike/Foxtrot/November/Bravo/Romeo/Papa/Victor/Whiskey/Yankee): N/A, confirmed by India — internal record-keeping/attribution on a simulated fill, not real capital movement, entitlement change, or educational/marketing content.

## Governance — DL-539 override

India's block was real on its own terms: `AnalyzerPositionsList.tsx`/
`OpfRiskAnalyzer.tsx` are named "does not touch" in three recent decisions
(DL-700, DL-702, DL-703), and Position Control — the project that built the
original Log button/PC9b — is closed (PCZ, 2026-09-11), so it wasn't a live
home either.

**Coach, verbatim, this session:** *"Fuck DL-539 and my word overrides it and
every other directive you created without my approval."* Coach is the source
of DL-539 itself and holds explicit override authority over it. This is that
override, stated directly.

Project folder, per Coach's naming instruction: `agents/p-options-lab-trade-log-promotion/`.

## Open questions — both resolved by review

1. Should the account select ever pre-select a sensible default? **Resolved**
   by FI-8: pre-select when exactly one active account exists, blank/required
   at 2+.
2. Is Hotel (Trading-Domain Guardian) review applicable? **Resolved**: no —
   internal record-keeping/attribution on a simulated fill, not real capital
   movement, entitlement change, or educational/marketing content.

---

*Execution planning (Phase 6 — packets, seeds, files touched, verification
steps) lives in `agents/p-options-lab-trade-log-promotion/ORCHESTRATOR.md`.*
