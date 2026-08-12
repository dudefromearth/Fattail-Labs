# Orchestrator — Options Lab Heatmap Templates

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

## Active residual — Advanced Fly (implementation plan v1.1.1)

**Plan:** [`docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-Advanced-Fly-Full-Agent-Bench-Plan-v1.1.md)  
**Spec:** [`Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md`](../../Specs/FatTail-Labs-Options-Lab-Heatmap-Advanced-Fly-Spec-v0_2.md) (v0.2.1)

### Critical path

```text
AF0 → AF-H → AF-M → AF-U → AF-K → AF-Z
         [AF-X optional Wave‑2]
         [AF-X2 SRS — Coach only]
```

| Phase | Name | Blocks |
|-------|------|--------|
| **AF0** | Spec GO · OD-AF1…11 · seeds · Spec sha1→DL | All AF build |
| **AF-H** | flySurfaceHistory · AF17 · open seam (market-plane) | Time-derivative modes |
| **AF-M** | Wave‑1 metrics · Credit mag+CR · slope/curvature | AF-U polish · AF-K |
| **AF-U** | Value IA · signed color · copy | AF-K |
| **AF-K** | AT-AF1…17 | AF-Z |
| **AF-Z** | DL · Arch 29 · close | — |
| **AF-X** | Wave‑2 | optional |
| **AF-X2** | SRS | Coach Accept only |

**Data law:** Same OPF-held dual-side chain as Symmetric Fly / GEX / ladder (`ChainContext` via `useOptionChainBus`). Pure template. **No second Massive path. No package-quote.**

### Gate protocol

1. Seeds executed → evidence in `gate-reports/` or cited paths.  
2. **Delta** phase gate: PASS / FAIL / BLOCKED.  
3. No SKIP. Coach may descope AF-X / AF-X2 on DL.  
4. Overrule of a specialist finding = **DL entry**, not silent waive.

### Seed naming

`AF0-{n}-{agent}-{slug}.md` · `AF-H1-{n}-…` · `AF-M1-…` · `AF-U1-…` · `AF-K1-…` · `AF-Z1-…`  
Gates: `AF0-G.md` · `AF-H1-G.md` · `AF-M1-G.md` · `AF-U1-G.md` · `AF-K1-G.md` · `AF-Z1-G.md`

### First actions (Juliet)

1. Materialize cold seeds for **AF0** from plan §9.  
2. Sit AF0-1…AF0-9 specialists.  
3. **AF0-G** → Coach **AF0-0** (OD-AF* + Spec sha1 in DL).  
4. Unblock **AF-H1-0** history module.

### Do not

- Fire AF-H/M before **AF0-0**.  
- Second fly matrix alongside sym-fly after ship.  
- Fetch Massive or OPF package-quote from `computeCell`.  
- Fabricate edge slope as zero; violate AF17.  
- Merge Advanced Fly into GEX.  
- Ship SRS as profit/edge claim.

---

## Parent program path (historical)

```text
W0 → D → F → S → V → G → [X] → K → Z
```

| Phase | Notes |
|-------|--------|
| **W0** | **GO stamped** `gate-reports/W0-0-coach-go.md` |
| **S / V** | Landed base sym-fly — **product surface superseded by Advanced Fly** |
| **G** | GEX separate; keep |

Parent plan: [`docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md)
