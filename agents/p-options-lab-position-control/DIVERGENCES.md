# Position Control — divergence log

Hit something the Spec or plan does not cover: reason it out, decide, log it, continue.
A law the team believes is wrong is an entry here, not an interruption.

---

## D-PC-1 — Sessions files left in the working tree

**What the plan or Spec said:** Packet allowlists only. Diff ⊆ seed files. DL-539 freeze on Sessions.

**What we did instead:** Left `web/app/resource/sessions/page.tsx` and `web/components/resources/sessions/SessionControls.tsx` unstaged. Did not commit. Did not revert.

**Why:** They predate this program and are not on any PC seed. Reverting would discard someone else's freeze-tree work. Staging them would fail India at PCZ.

**Reversible?** Yes — whoever owns Sessions can commit or revert them.

**Who decided:** Juliet. Visible at PC0/PC1 commit gate.

---

## D-PC-2 — TM rehearsal-ended drop is not an undo step

**What the plan or Spec said:** PC-UNDO-4 lists member writes on the stack. PC-UNDO-5 lists quote merges, overlay preview, hydrate, name/POS re-derivation, promotion.

**What we did instead:** When Time Machine ends, dropping rehearsal cards does not push. Undo will not restore practice cards that TM just cleared.

**Why:** That drop is not a member verb. It is session-clock, closer to hydrate than to delete. Ruled out: pushing it, which would let Cmd-Z resurrect rehearsal cards after "Rehearsal ended."

**Reversible?** Yes — one `commitBook("delete", …)` around that filter.

**Who decided:** Juliet. PC4-G.

---

## D-PC-3 — Visibility, entry time, close, and handoff ingest sit on the stack

**What the plan or Spec said:** PC-UNDO-1 "Every book write is reversible." PC-UNDO-4 enumerates card writes, dialog patches, overlay commit, lock/unlock, Keep/Unlock, POS scale, delete, accepted repair, strategy rebuild.

**What we did instead:** Treat Show/Hide, entry-time edit, Analyzer close, and heatmap/suite ingest as `card` (or `create-submit` for ingest) and push them.

**Why:** PC-UNDO-1 is the wider law; PC-UNDO-4 is examples of member verbs, not an exclusive list. They are not on the off-stack list. Ruled out: leaving them un-undoable, which would violate PC-UNDO-1.

**Reversible?** Yes — stop calling `commitBook` at those four sites.

**Who decided:** Juliet. PC4-G.

---

## D-PC-4 — POS stepper is `scaleCardPos`; card chrome waits for PC8

**What the plan or Spec said:** PC2 item 4: "POS stepper writes `ratio × POS` on every leg." PC-HIG-9 puts the QTY quick-pick on the card.

**What we did instead:** Landed `scaleCardPos` / `scaleLegPos` with tests (AT-PC-40 · AT-PC-26). Did not add a stepper control on the card in this packet.

**Why:** Card affordances are PC8 (ToS card). Shipping a second qty chrome now would fight PC-VOCAB-8. The function is the stepper; the control is PC8.

**Reversible?** Yes — wire `scaleCardPos` to a card control at PC8.

**Who decided:** Juliet. PC2-G.

---

## D-PC-5 — Book backup is a dated rollback, not a second store

**What the plan or Spec said:** PC2 item 6: idempotent read migration of old books. Coach chose option (c): backup then lazy-rewrite.

**What we did instead:** On first `loadPositions` after this packet, copy the live book to `ft_options_lab_analyzer_positions_v2__backup_2026-09-11` (never overwrite). Then migrate in memory and write the live key. Restore is `restoreAnalyzerBookFromBackup()` (one step). The backup is a rollback path. PCZ lists it under "still open" so Coach can delete it when satisfied.

**Why:** An undated orphan key would sit forever. Ruled out: dual-read forever (b); rewrite with no backup (a).

**Reversible?** Yes — `restoreAnalyzerBookFromBackup()`, or:

```
localStorage.setItem('ft_options_lab_analyzer_positions_v2', localStorage.getItem('ft_options_lab_analyzer_positions_v2__backup_2026-09-11'));
sessionStorage.setItem('ft_options_lab_analyzer_positions_v2', localStorage.getItem('ft_options_lab_analyzer_positions_v2__backup_2026-09-11'));
location.reload();
```

**Who decided:** Coach (option c) · Juliet (dated key + restore). PC2-G.

---

## D-PC-6 — Presets manager removed from the dialog, not yet in workspace chrome

**What the plan or Spec said:** §5.1 "the presets / defaults manager (relocates to Analyzer workspace chrome)".

**What we did instead:** Removed it from `PositionBuilder`. Did not add workspace chrome in PC5.

**Why:** The dialog must not keep it. Workspace chrome is not this packet. Ruled out: leaving it in the footer (violates §5.1).

**Reversible?** Yes — mount the same store on Analyzer chrome later.

**Who decided:** Juliet. PC5-G.

---

## D-PC-7 — Dialog Limit still writes `net_debit_override`

**What the plan or Spec said:** PC6: kill `net_debit_override` as a source (eight dialog sites). `CardLockState` is the only lock.

**What we did instead:** CHECK PRICE and lock field live on `CardLockState`. Dialog Limit input still writes `net_debit_override` as leftover chrome.

**Edit-mode displayed price (PC8):** the dialog reads `CardLockState` (`cardLock.mode === "locked"` / `packageDebitPerShare`). Create still uses `net_debit_override` because no record exists until Submit. Limit in Edit calls `lockLimit` / `unlockCard`. AT-PC-05 remains PASS.

**Why:** Lock law is satisfied on the card path this packet owns. Stripping every dialog override site without a replacement Limit→lockLimit wire would leave Create with no lock gesture. Ruled out: shipping CHECK PRICE blocked on a full dialog rewrite.

**Reversible?** Yes — Create still writes the override; Edit no longer does.

**Who decided:** Juliet. PC6-G · closed at PC8.

**Residual (PCZ still-open, not a reopen):** the Edit *gate* reads `CardLockState`; the ToS-script `costBasis` path still reads `position.net_debit_override` (`PositionBuilder.tsx` ~1259). Sound today because `lockLimit` writes the mirror. A future lock writer that skips the mirror would show a stale number in the dialog while the card is right. AT-PC-05 catches same-tick lock/canvas divergence; it would not catch that. Left as a named residual rather than a new test on one writer — the defect is “any lock path that forgets the mirror,” not the current `lockLimit`.

---

## D-PC-8 — PC-LIFE-7 snapshot deferred; Spec over-specified the column

**What the plan or Spec said:** PC9b writes a structure snapshot column (catalogue name · ratio · POS · `lockSource` · basis + CHECK PRICE · residual-leg state · AnalyzerPosition id). Plan named `migrations/NNN_analyzer_promotion_snapshot.sql`.

**What we did instead:** Mapper rewrite only. No `ALTER TABLE`. No JSON snapshot bolted onto `member_trade_log_trades`. Coach 2026-09-11: the Trade Log already carries `strategy` and is the next project; do not add a column to a table about to be refactored.

**Evidence — eight snapshot fields, six already stored or derivable:**

| PC-LIFE-7 field | Home today |
|-----------------|------------|
| Catalogue name | `member_trade_log_trades.strategy` (via `FAMILY_TO_STRATEGY`) |
| Normalized ratio | Derivable from `member_trade_log_legs.quantity` (PC2 GCD) |
| POS | Derivable — GCD of those quantities |
| `lockSource` | Coarse: mapper `order_type` LMT vs MKT (PC9b) |
| Basis at Log | `trades.net_price` (same number as the script copy, AT-PC-54) |
| AnalyzerPosition id | Reverse only: `tradeLogTradeId` on the card |
| CHECK PRICE state | Not stored. Lock chrome, not a Trade Log fact. |
| Residual-leg state | **No home.** The only genuinely new fact. Not recoverable later without historical chain data. |

**Why:** The Spec asked for a snapshot of data the schema mostly already carries. That is over-specification, not a build shortfall. Flag for **v1.3** once the Trade Log refactor settles the table. Findings carried to `agents/p-trade-log/PC-LIFE-7-carry-forward.md`.

**Reversible?** Yes — add a column in that program if the refactor still wants one. Not here.

**Who decided:** Coach 2026-09-11 · Juliet PC9b-G.

