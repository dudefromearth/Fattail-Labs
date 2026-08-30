# Orchestrator — IKI Lab

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Active program (DL-539):** IKI Lab. Do not drift. **Read-only** of out-of-scope
files: three OKs granted 2026-08-22 (GO token). **Write** still frozen unless
B3 / a separate write three-OK.

**IKI-P3 plan:** [`docs/IKI-Lab-Runner-HIG-Chrome-Full-Agent-Bench-Plan-v1.0.md`](../../docs/IKI-Lab-Runner-HIG-Chrome-Full-Agent-Bench-Plan-v1.0.md) **v1.0.1 AMEND**  
**Token:** [`agents/go/IKI-P3.md`](../go/IKI-P3.md)  
**W0:** [`W0-inventory.md`](./W0-inventory.md) · evidence [`evidence/iki-p3/W0-inventory.md`](./evidence/iki-p3/W0-inventory.md)

### IKI-P3 critical path

```text
W0 DONE
  → Coach disposes B1·B2·B3·C1 and stamps GO W1
    → W1 Charlie → W1b Kilo → Echo ∥ Tango
      → Lima W0s (spec file) → W2 TR13+DL → IKI-P3-G
```

| Phase | Name | State |
|-------|------|--------|
| **IKI-P1** | Public session | **WITHDRAWN** DL-540 |
| **IKI-P2** | Host mount | **PASS** IKI-P2-G |
| **IKI-P3 W0** | Heatmap chrome study | **DONE** (in evidence) |
| **IKI-P3 plan** | Juliet v1.0.1 | **GO W1** 2026-08-22 · B1 Echo+Tango · B2 hide-like-Heatmap · B3 Yes · C1 three states |
| **IKI-P3 W1** | Charlie | **in progress** |
| **IKI-P3 W1b** | Kilo | blocked on W1 |
| **IKI-P3 W1c** | Echo | blocked on W1b |
| **IKI-P3 W1d** | Tango | blocked on W1b · blocked if B1 = Hold |
| **IKI-P3 W0s** | Lima spec file | before W2 |
| **IKI-P3 W2** | Lima TR13 + DL | blocked on Echo + Tango + W0s |
| Wiki Spec v1.2 | Deploy watcher + Oscar + inbox | **separate board** `agents/p-wiki-v12/` · plan WAIT Coach GO W0 |
| **IKI-P3-G** | Delta | not opened |

### Do not

- Start W1 without B1–B3 and C1 ticked.  
- Treat disable-don’t-hide as Juliet law (B2 is Coach’s).  
- Edit `sinks/render.ts` unless B3 = Yes.  
- Invent Market closed.  
- Skip Echo or Tango.  
- Guess the live Runner spec filename.
