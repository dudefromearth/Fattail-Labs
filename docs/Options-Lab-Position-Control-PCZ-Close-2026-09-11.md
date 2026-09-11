# Position Control — PCZ close

**Revision:** 5  
**Date:** 2026-09-11  
**Supersedes:** revision 4 (PC8-D QTY unit)  
**Machine:** Coach's MacBook (dev)  
**Reader:** Coach — you were not required to sit with every packet. This is the program.

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-09-11 | First close. PC9b waiting on Coach schema pick. |
| 2 | 2026-09-11 | PC9b ran mapper-only. Snapshot deferred to Trade Log refactor (D-PC-8). |
| 3 | 2026-09-11 | PC8-D card density. ✕ vs Close and entry-time off the card flagged for Spec v1.3 (D-PC-9). |
| 4 | 2026-09-11 | PC8-D superseding pass. QTY is one ToS unit; stepper resting symmetric; `--hit-min` grown-only. Three-leg card 290px → 60px. |
| 5 | 2026-09-11 | PC8-E item 6. Dedicated ToS padlock, white both states, own column past the price stepper. |

Nothing deploys. PC9b ran as **mapper only**. The snapshot column was not added.

---

## What was built

One `AnalyzerPosition` per id. Card, dialog, and canvas are views of it. Three litmus tests: pricing is the same everywhere; opening Edit writes nothing; the member owns the shape.

Eleven packets landed. Sessions files were never committed.

| Packet | Commit | What the gate found |
|--------|--------|---------------------|
| **PC0** | `ebaa723` | Edit keeps `rehearsal` and `visible`. TM practice cards cannot become Trade-Log-eligible by opening Edit. |
| **PC1** | `4685b9e` | Cboe tick bands. One DTE horizon. Unknown product fails loud. |
| **PC4** | `a8c0351` | Bounded undo (50, session-only). Member book writes reverse; quotes and hydrate do not. |
| **PC2** | `9437cc6` | Actual contracts on legs. POS = GCD. Classifier (signed pattern in strike order). CUSTOM arrived at, never picked. Dated localStorage backup, written once. |
| **PC3** | `8c92ef5` | Structure signal. Quote merge is a leaf — a late quote cannot resurrect a structure that moved. |
| **PC5** | `3f95e98` | Opening Edit writes zero fields. Create is off-book until Submit. Cancel / Submit vs Close. Asserted in CI, not by screenshot. |
| **PC6** | `a59291b` | `CardLockState` is the only lock. CHECK PRICE on the lock. ToS script always `@LMT`; pending CHECK PRICE script uses live mid. Numeral strikethrough in amber — the strike carries the state. |
| **PC7** | `a939c0f` | Constraint at the control. `<select>` never writes `options[0]` on render (fixture, not a click-through). Empty ladder is loading. Roll proposed, not applied. |
| **PC8** | `f1d536a` | ToS card: ten columns, seven editable fields, padlock pair, grow-on-hover stepper, QTY quick-pick through POS. Edit dialog displayed *gate* reads `CardLockState`. |
| **PC9a** | `c434634` | Autofit subscribes to the structure signal. Overlay never. Create-Submit and first show always fit; afterwards only when geometry escapes. AF-L5 amended in place. |
| **PC9b** | `0f5d921` | Mapper rewrite only. `order_type` from `lockSource`; no fill from stored `entry_price`; no `contracts` multiplier. Log gated `tmActive` AND `!rehearsal`. Residual does not block. **No schema.** |

---

## Look at this first

1. **Litmus 1 is closed on the lock**, with one named residual (below). Edit reads `CardLockState`. Create still uses the draft override because no record exists until Submit.
2. **The dated Analyzer book backup** from PC2 is still on the machine: `ft_options_lab_analyzer_positions_v2__backup_2026-09-11`. Delete it when you are satisfied the qty migration held. Restore remains one step until then.
3. **PC-LIFE-7 snapshot** is deferred to the Trade Log refactor — not a gap here. Findings: `agents/p-trade-log/PC-LIFE-7-carry-forward.md`.

---

## Every divergence

| ID | What | Why | Reversible |
|----|------|-----|------------|
| **D-PC-1** | Sessions `page.tsx` and `SessionControls.tsx` left unstaged | Not on any PC seed. Revert would discard someone else's freeze-tree work. Stage would fail India. | Yes — Sessions owner commits or reverts. |
| **D-PC-2** | TM “Rehearsal ended” drop is not an undo step | Session-clock, closer to hydrate than delete. Cmd-Z must not resurrect practice cards. | Yes — one `commitBook("delete")` around that filter. |
| **D-PC-3** | Show/Hide, entry time, close, heatmap ingest sit on the undo stack | PC-UNDO-1 is the wider law; PC-UNDO-4 is examples. | Yes — stop calling `commitBook` at those sites. |
| **D-PC-4** | POS function in PC2; card stepper waited for PC8 | Card chrome is PC8. Function landed; control landed at PC8. | Done at PC8. |
| **D-PC-5** | Book backup is a dated rollback, not a second store | You picked (c). Key is dated. Backup never overwrites. | Yes — `restoreAnalyzerBookFromBackup()`, or the two-line localStorage copy in DIVERGENCES.md. |
| **D-PC-6** | Presets manager removed from the dialog, not yet Analyzer workspace chrome | Dialog must not keep it. Workspace chrome was not PC5. | Yes — mount the same store on Analyzer chrome later. |
| **D-PC-7** | Dialog Limit leftover chrome; Edit gate now reads the lock | Closed at PC8 for the *gate*. Residual below. | Create still writes the override. |
| **D-PC-8** | PC-LIFE-7 snapshot not written as a column | Spec over-specified data the schema mostly already carries. Coach: Trade Log is the next refactor. Six of eight fields stored or derivable. | Yes — that program, not this one. |

---

## Still open

### PC-LIFE-7 snapshot — deferred, named home

Spec §9 **Promotion snapshot** stays open **here** and is **reassigned** to the Trade Log refactor. Not unfinished work on this board.

Coach 2026-09-11: do not bolt JSON onto a table that is about to be refactored. The Spec asked for a snapshot of data the schema mostly already carries (six of eight fields). That is over-specification; flag for **v1.3**.

Carry-forward (four findings): `agents/p-trade-log/PC-LIFE-7-carry-forward.md`

1. Two vocabularies, no shared definition (`FAMILY_TO_STRATEGY` is convention).
2. Residual-leg state at Log has no home — the only new fact.
3. Ratio and POS are derivable from `legs.quantity` (confirm CUSTOM and BWB).
4. Reverse link is weak: `trade_id` on the card is durable; a card id on a trade is not.

Spec §9 **Promotion mapper** is **closed** (PC-LIFE-10).

### D-PC-7 residual — dialog displayed *value*

The Edit *gate* reads `CardLockState`:

```
const overrideActive =
  mode === "edit" ? lockActive : position.net_debit_override != null;
```

The ToS-script `costBasis` path still reads `position.net_debit_override` (`PositionBuilder.tsx` ~1259). Sound today: `lockLimit` writes that field as a mirror, so the number is a derived copy, not a second source.

Narrow fragility: a future path that sets a lock **without** writing the mirror shows a stale number in the dialog while the card is right. AT-PC-05 catches same-tick lock/canvas divergence; it would not catch that.

Not a reopen. Named here so it is not reconstructed from memory.

### Dated backup key — Coach may delete

`localStorage` / `sessionStorage` key:

`ft_options_lab_analyzer_positions_v2__backup_2026-09-11`

Written once on first load after PC2. Never overwritten. Live book is `ft_options_lab_analyzer_positions_v2`. When you are satisfied, delete the backup key. Until then, restore is:

```
localStorage.setItem('ft_options_lab_analyzer_positions_v2', localStorage.getItem('ft_options_lab_analyzer_positions_v2__backup_2026-09-11'));
sessionStorage.setItem('ft_options_lab_analyzer_positions_v2', localStorage.getItem('ft_options_lab_analyzer_positions_v2__backup_2026-09-11'));
location.reload();
```

### Echo remaining (PC8-G task, not a failed gate)

Sign the QTY unit against `docs/reference/tos/tos-qty-stepper.png` at 100% zoom (`gate-reports/pc8-d/qty-rest.png`, `qty-unit-rest.png`). Resting stepper is 18px, halves 8.5/8.5, caret 18×18. Grown is 44×44 = `--hit-min`. Three-leg card is 60px (`pc8-d/after.png`). Exclusive z-index on hover/focus so adjacent grown steppers do not compete.

Sign the padlock against `docs/reference/tos/tos-padlock-locked.png` and `tos-padlock-unlocked.png` (`gate-reports/pc8-e/card-locked.png`, `card-unlocked.png`). White both states. Solid body locked, outlined unlocked. Own column, vertical grid rule. Footprint 22×18 identical.

### Spec §9 rows deferred (named home)

- Promotion snapshot (PC-LIFE-7) → Trade Log refactor / v1.3. See D-PC-8.
- Card ✕ at the right edge (not stacked with Close); entry-time editor in the Edit dialog, not on the card. Spec v1.2 §5.2. **v1.3.** See D-PC-9.
- Per-leg live on the **card** — the card correctly shows no per-leg price (PC-VOCAB-6). Dialog MARK/IV remain live.

### Spec §9 rows closed

Edit session fields · visible · quote merge · bound Edit · Create off-book · Edit Close · opening Edit writes nothing · Undo · classifier / CUSTOM / actual contracts / POS · CHECK PRICE · tick source · no `type=date` · DTE horizon · Autofit trigger · symbol groups · delete confirmation · focus wiring · padlock / stepper / QTY · **promotion mapper**.

### Environment (not a gate)

Local API `127.0.0.1:4000` hit the 10-hour process cap during PC6 and was restarted (pid 74249, git `a59291b`). Recorded so a timeline gap is not reconstructed from memory.

---

## Standing

Coach is product owner. Delta, India, Tango and Hotel gate; escalation to Juliet. Works, tests pass, looks right — Echo and Tango own “looks right.” One commit per packet, declared files only. No deploy.

Program code is complete on this machine. The snapshot question lives with the Trade Log refactor. No deploy.
