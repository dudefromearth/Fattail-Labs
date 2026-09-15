# Orchestrator — Practice Position Lifecycle (B0)

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Plan:** [`docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md) **v1.1** (Advisor SOUND)  
**Spec:** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`](../../Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md) **v0.1.1 BUILD AUTHORITY**  
**W0 token:** [`agents/go/PPL0-W0.md`](../go/PPL0-W0.md) **GO** · **DL-702**

### Critical path

```text
PPL0 → PPL1 (characterization) → PPL2 (read models) → PPL3 (API + kit)
                                                    ↘ PPL4 (OD-gated)
```

| Phase | Name | State |
|-------|------|--------|
| **PPL0** | Board · spec v0.1.1 · GO · AGENTS seating | **PASS** `PPL0-G.md` · **GO** `PPL0-W0.md` · **DL-702** |
| **PPL1** | W0 characterization (lock the lies) | **PASS** `PPL1-G.md` · 44 passed · tests-only |
| **PPL2** | W1 read models (slot SoR) | **PASS** `PPL2-G.md` · remaining_units 4 live · grain `partial_residual` |
| **PPL3** | W2 POST+PATCH 422 · DELETE 409 · kit confirm | **PASS** `PPL3-G.md` · inventory `ppl3-close-writers.md` |
| **PPL4** | W3 coverage window · states · declarations · hold | **blocked** on OD-9 / 22 / FI-PPL-1 (OD-21 silent default already on token) |

### Gate protocol

1. Seeds executed → evidence in `gate-reports/` or cited paths.  
2. **Delta** phase gate: PASS / FAIL / BLOCKED.  
3. No SKIP. Coach may descope a JR* item on DL.  
4. Overrule of a specialist finding = **DL entry**, not silent waive.  
5. Diff containing `AnalyzerPositionsList.tsx` or LIM/QFRIC/XS product files is **FAIL**.

### Seed naming

`PPL0-{n}-{agent}-{slug}.md` · `PPL1-…` · `PPL2-…` · `PPL3-…` · `PPL4-…`  
Gates: `PPL0-G.md` · `PPL1-G.md` · `PPL2-G.md` · `PPL3-G.md` · `PPL4-G.md`

### First actions (Juliet)

1. **PPL0-G PASS.** Fire **PPL1-0** (Kilo characterization). Do not skip. Do not start PPL2.  
3. After PPL1-G: fire **PPL2** (Alpha + Charlie siblings on server vs client slot grain).  
4. Do **not** open PPL4 because the board exists.

### Isolation (no seeds on these boards)

| Board | Rule |
|-------|------|
| `p-options-lab-heatmap-lim` | **Active LIM.** No PPL* seeds. No LIM files |
| `p-quant-friction` | **Active QFRIC.** No quant files |
| `p-options-lab-xsp-spy-scale` | **Active XS.** No XS files |
| Options Lab Analyzer / OPF / Market Bus / IKI / GSC | Frozen |

### Do not

- Rewrite `match_open_close` FIFO.
- 422 import orphans (OD-25 silent default).
- Absorb C1 partial-residual into C2 unfinished cycle.
- Restyle Import Manager. Port `trash_reason` chips.
- Stop `:3000` / `:4000`. Deploy MiniTwo.
- `git add -A`.
- Treat this plan as a GO.
