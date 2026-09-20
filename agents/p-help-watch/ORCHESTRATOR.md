# Orchestrator — Help Watch + Wiki Follow

**Juliet** runs this board. **Sierra** writes Help markdown. Gates via **Delta** ternary.

**Spec:** [`Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md`](../../Specs/FatTail-Labs-Help-Watch-and-Wiki-Follow-Spec-v0.3.md) **v0.3 BUILD AUTHORITY**  
**Token:** [`agents/go/HW-W0.md`](../go/HW-W0.md) **STAMPED GO** 2026-09-15 · **DL-704** · seat **Sierra** · sweep = calibration window · straight-to-main **blank**

### Critical path

```text
HW-W0 STAMPED ──► HW0 seated ──► HW1 retrospective sweep
                                  (one PR per app area = calibration window)
                           ──► HW1-G per batch (Coach merge/reject)
                           ──► sweep closed ──► later: straight-to-main tick
Wiki Follow = existing S1 poller after Help is on main. Not a seed on this board.
```

| Phase | Name | State |
|-------|------|--------|
| **HW0** | Seating · watermark · Sierra | **seated** 2026-09-15 · watermark `36699be9` · `sweep_status: pending` |
| **HW1** | Retrospective sweep (as-built vs Help) | **in progress** — Trade Log PR [#11](https://github.com/dudefromearth/Fattail-Labs/pull/11) `c8c65db4` |
| **HW1-G** | Coach merge/reject **each** app-area PR | **waiting** — Trade Log batch |
| **Straight-to-main** | Earned after sweep fully merged + precision | **unticked** |

### Gate protocol

1. Seeds → evidence in `gate-reports/`.  
2. Delta: PASS / FAIL / BLOCKED. No waive.  
3. Sweep PR that touches anything outside `server/help_reference/*.md` = **FAIL**. Do not open the PR. Trade Log PR without partial-residual / 422 / 409 = **FAIL**.  
4. Watermark missing or ahead of `origin/main` = **stop**.  
5. Straight-to-main Help commit before that tick = **FAIL**.

### First actions

1. ~~Stamp `HW-W0`~~ done.  
2. ~~HW0 seating~~ done. **No Help writes in HW0.**  
3. **HW1:** Sierra runs the retrospective sweep. First PR: **Trade Log**. Then other app areas, one PR each, plus skipped-list.

### Language (Volume Profile · AZ-VP-9-A8 · DL-739 · AZ-VP-9-A11 · DL-741)

Member mental model: **one chart, layers you switch on.** Footprint and GEX arrive as **layers**; Replay as a **view**. See [`language-vp-layers.md`](language-vp-layers.md).

Member documentation **organizes by the three uses** (morning routine / trade entry / trade management). **Morning Routine preset = Coach's show configuration by definition.** See [`language-vp-purpose.md`](language-vp-purpose.md). Volume Profile Help is not yet swept — when it is, copy follows that shape.

### Do not

- Tick straight-to-main.  
- Write product, Specs, Wiki pages, or the S1 poller.  
- MiniTwo.  
- Stop `:3000` / `:4000`.  
- `git add -A`.
