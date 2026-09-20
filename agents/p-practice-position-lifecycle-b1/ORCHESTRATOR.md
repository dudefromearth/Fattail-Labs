# Orchestrator — Practice Position Lifecycle B1

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Plan:** [`docs/Practice-Position-Lifecycle-B1-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Practice-Position-Lifecycle-B1-Full-Agent-Bench-Plan-v1.1.md) **v1.1**  
**Spec:** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_4.md`](../../Specs/FatTail-Labs-Practice-Position-Lifecycle-B1-Spec-v0_4.md) **v0.4**  
**Planning token:** [`agents/go/PPLB1-W0.md`](../go/PPLB1-W0.md) **AWAITING STAMP**

### Critical path

```text
PPLB1-0 (planning) ──► [PPL3-G + PPL4-G] ──► PPL5 ──► PPL6 ──► PPL7 ──► PPL8
                         HARD BARRIER           events   chrome   re-rec  import
```

| Phase | Name | State |
|-------|------|--------|
| **PPLB1-0** | Planning stamp · D-B1-2…9 block | **WAIT** — token not stamped |
| **PPL5** | Transformation + revocation events | **blocked** on PPL3-G + PPL4-G + `PPL5-W0` |
| **PPL6** | Drawer lifecycle group | **blocked** on PPL5-G. **Never merge with PPL5** |
| **PPL7** | Re-recognition + badge | **blocked** on PPL6-G |
| **PPL8** | Import proposal + Journal/Retro | **blocked** on PPL7-G |

### Gate protocol

1. Seeds → evidence in `gate-reports/`.  
2. Delta: PASS / FAIL / BLOCKED. No waive.  
3. Product-code seed before PPL3-G **and** PPL4-G = **FAIL**.  
4. Diff containing `AnalyzerPositionsList.tsx` unless `PPL7-W0` names it = **FAIL**.  
5. Matcher FIFO in a B1 diff = **FAIL**.

### First actions

1. Coach stamps `PPLB1-W0` (planning + D-B1 block).  
2. **Finish B0 PPL3 then PPL4** on `p-practice-position-lifecycle`.  
3. Then `PPL5-W0`. Do not open PPL6 because PPL5 exists.

### Do not

- Combine PPL5 and PPL6.  
- Ship a leg-out button.  
- Re-open B0 ODs.  
- Stop `:3000` / `:4000`. Deploy MiniTwo.  
- `git add -A`.  
- Treat this plan as a build GO.
