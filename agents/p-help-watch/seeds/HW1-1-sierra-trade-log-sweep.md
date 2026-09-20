# HW1-1 — Sierra · Trade Log sweep batch (calibration)

**Project:** Help Watch + Wiki Follow  
**Agent:** Sierra  
**Depends:** `HW-W0` STAMPED · HW0 seated  
**Feeds:** HW1-G (Trade Log batch) · then remaining app-area PRs

## Intent

Retrospective sweep, **Trade Log area first**. Compare **current as-built** Trade Log (allowlist paths in spec §2.8) to current `server/help_reference/trade-log-record-close.md`, `trade-log-autofilter.md`, and `app-areas.md` Trade Log / New trade sections. **Not** a git-history replay.

Write catch-up Help so members are taught:

- **partial-residual** (1-of-5 still on the book)
- **422** without an explicit payload override on close
- **DELETE 409** of a paired/partial open, naming the blocking close

Plus any other Trade Log drift that is true on the glass (kit confirm, stock/futures close-as-equity, Adherence gone) **if** as-built shows it. Process outcomes only. No profit claims.

## Files in scope

- `server/help_reference/trade-log-record-close.md`
- `server/help_reference/trade-log-autofilter.md`
- `server/help_reference/app-areas.md` — **only** Trade Log / New trade sections
- Board: `agents/p-help-watch/sweep-skipped.md` (start the skipped-list; Trade Log is not a skip)

## Out of scope

Any path outside `server/help_reference/*.md` and this board. Width Fit, LIM, courses, Sessions, Options Lab files. Product trees. Specs. Wiki pages. Matcher. Analyzer. MiniTwo.

If the PR would touch anything outside `help_reference/` → **FAIL**. Do not open the PR. File the would-be diff on the board.

## Output

**One PR** against `main`, Trade Log Help only. Branch is the draft (DL-572). Coach merges or rejects.

Ground truth: the three bullets above **must appear** in the PR or the batch is FAIL.

## Isolation FAIL list

Empty. No `AnalyzerPositionsList.tsx`. No LIM / QFRIC / XS product. No matcher FIFO write.
