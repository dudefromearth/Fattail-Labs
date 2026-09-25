# Orchestrator notes — Trade Log Promotion Dialog

**Juliet** owns seed materialization and phase sequencing.
**Coach** owns GO / ship.
**Delta** owns phase gates.

**Plan:** `docs/Options-Lab-Analyzer-Trade-Log-Confirmation-Full-Agent-Bench-Plan-v1.0.md`
**Spec:** `Specs/FatTail-Labs-Options-Lab-Analyzer-Trade-Log-Confirmation-Spec-v1_0.md`

**MACHINE: StudioTwo (dev).** No MiniTwo. No staging.

Phase DAG: `LP0 → LP1 → LP2 → LPZ`

## LP0 — Mapper

Files: `web/lib/options-lab/analyzerToTradeLog.ts`, `web/lib/options-lab/analyzerToTradeLog.test.ts`

- Add `analyzerPositionToCloseTrade(pos, {exitPrices, exitAtMs, accountId,
  campaignId, intendedOpenId})` — models `buildCloseDraftFromOpen`
  (`web/lib/tradeLog.ts:693-730`): flip leg side, `pos_effect: "TO_CLOSE"`,
  `fill_price` from caller-supplied `exitPrices` (never defaulted/fabricated),
  `net_side` flipped from the open draft's, `net_price` derived from entered
  per-leg prices (BUY = cost, SELL = credit; net > 0 → DEBIT else CREDIT),
  `exec_at` from `exitAtMs`, `intended_open_id` passthrough.
- Extend `analyzerPositionToOpenTrade`'s signature to accept
  `accountId?: number` / `campaignId?: number`, include as `account_id` /
  `practice_campaign_id` in the returned draft.
- Unit tests (tsx-run style, no framework import, matching the file's
  existing convention): leg flip, net_side flip, net_price sign,
  `intended_open_id` passthrough, account/campaign passthrough on the open
  mapper.

Gate: `npx --yes tsx lib/options-lab/analyzerToTradeLog.test.ts` green.

## LP1 — Dialog component

File: `web/components/options-lab/LogToTradeLogDialog.tsx` (new)

Pattern: `AlertBuilderDialog.tsx` (`Modal`/`Button`/`IconButton` imports,
`workSurface="dark"`, footer Cancel + primary Confirm, `disabled={!canSave}`).

- Account `<select>`: `fetchAccounts()` (`web/lib/tradeLogAnalytics.ts:89-96`),
  filtered `status === "active"`, pre-selected when exactly one, blank +
  required at 2+. Styled with `AlertBuilderDialog.tsx`'s tokenized
  `field`/`lab` classes — not `TradeSheet.tsx`'s own `field` const (Echo:
  non-tokenized, non-44pt).
- Campaign `<select>`: `fetchEligibleCampaigns({accountId, execAt})`
  (`web/lib/practiceSpineApi.ts:536-548`), re-fetched on account change,
  filtered `!c.is_ledger`, first option "Undirected (or memory if set)".
- `SegmentedControl` Log-as toggle: "Open + Close" / "Open only". Present
  and defaulted to "Open + Close" only when `pos.closedAt != null`; absent
  otherwise.
- Open+Close mode: compact per-leg price grid (not stacked sentences — real
  concern for 4-leg Iron Condors), live running net debit/credit total,
  close timestamp (datetime-local, default `pos.closedAt`). `toDatetimeLocal`
  helper duplicated locally (not exported from `AlertBuilderDialog.tsx`).
  Confirm disabled until every leg has a valid nonzero price + account chosen.
- Busy state on Confirm: `AlertDialog`'s `busy` convention (disable both
  footer buttons, label → "Sending…", disable Esc/scrim) — two sequential
  network calls, not `AlertBuilderDialog`'s synchronous save.
- Partial-failure UI: inline `Banner tone="warning"` naming exactly what
  succeeded/failed; Confirm retries only the failed leg.
- No network I/O in the dialog itself — `onConfirm(payload)` hands a
  fully-formed payload back to the caller.

Gate: Echo re-review against the design packet above (screenshots or live
UI, light/dark, narrow viewport) before LP2 wires it in.

## LP2 — Wiring

Files: `web/components/options-lab/OpfRiskAnalyzer.tsx`,
`web/components/options-lab/AnalyzerPositionsList.tsx` (verify unchanged)

**Do not rename the `onSendToTradeLog` prop/key.** Threaded through five
spots in `AnalyzerPositionsList.tsx` (list props type ~326, destructure
~369, row pass-down ~740, row prop type ~893, row destructure ~837) before
the click handler ~1084-1099; also string-matched literally by
`web/lib/options-lab/rehearsal.test.ts:89` and sliced-by-name in
`web/lib/options-lab/undoStack.test.ts:140-157` (the PC4 host guard: no
`commitBook` between `"onSendToTradeLog:"` and `"onLockNatural:"` — Log
promotion is deliberately excluded from the undo stack, AT-PC-45).

- `AnalyzerPositionsList.tsx`: unchanged. Same prop, same call, same gating
  (hidden for `pos.rehearsal`, disabled while `tmActive`).
- `OpfRiskAnalyzer.tsx`: add `logDialogPositionId` state. `onSendToTradeLog`
  (currently lines 1866-1896) changes from "build draft and POST" to
  re-check `canPromoteToTradeLog`, then open the dialog. New
  `handleConfirmSendToTradeLog(id, {accountId, campaignId, mode, exitPrices?,
  exitAtMs?})`, called from the dialog's `onConfirm`, holds the submit logic
  per Spec §High-level flow steps 1-6. Keep `setPositions`/`linkTradeLogId`
  for state updates — never `commitBook` on this path.

Gate: `npx --yes tsx lib/options-lab/analyzerToTradeLog.test.ts` and
`npx --yes tsx lib/options-lab/undoStack.test.ts` both green;
`npx tsc --noEmit` clean.

## LPZ — Delta gate

- Manual click-through on StudioTwo dev: build a position, close it on the
  card, click Log → confirm Open+Close default, pick account, leave campaign
  undirected, enter exit prices, Confirm → verify two trades land in Trade
  Log correctly paired (not orphaned), on the chosen account.
- Repeat for a still-open position → dialog shows Open only (no toggle),
  confirm → exactly one open trade created.
- Repeat choosing Open only explicitly on an already-closed card → confirm
  notice text reflects it won't auto-sync a future close.
- Confirm Log button/dialog still absent/disabled for rehearsal cards and
  during Time Machine (manual click-through; `tm-w7-rehearsal.spec.ts` is
  the live Playwright check, unaffected by this work since prop/gating is
  unchanged).
- `undoStack.test.ts` PC4 host guard still passes (no `commitBook` regression).

## Rules of engagement

- One seed in flight per agent unless Juliet schedules parallel non-conflicting
  files.
- Out-of-scope file need → stop, report, re-seed.
- Evidence beats demo — command output, not "it should work."
- Coach actions (GO, ship) are explicit — agents flag blockers, they do not
  invent scope.
