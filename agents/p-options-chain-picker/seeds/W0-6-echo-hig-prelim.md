# W0-6 — Echo: HIG prelim design pack (Apple HIG for Labs web)

**Agent:** Echo  
**Gate:** W0-G  
**Authority:** Human Interface Spec v1.0 · Apple HIG pillars adapted to Labs web

## Task

Produce a **preliminary** (but HIG-compliant) design note for `/app/market/chain-ladder` **before** production polish is treated as complete:

### Must cover

| Pillar | Deliverable |
|--------|-------------|
| **Clarity** | Control hierarchy: Symbol → Contract (next 3) → Side → Sigma → ladder; one primary content region |
| **Deference** | Chrome thin; chain table is the hero; no emoji chrome |
| **Depth** | Canvas → control card → scrollable table |
| **Consistency** | Only kit selects/inputs/type; no invent tokens |
| **Feedback** | Loading, empty, 503, “no change,” row flash (changed strikes only) |
| **Hit targets** | Selectors / interactive rows ≥ **44×44 pt** |
| **Keyboard** | Tab order documented; focus rings required |
| **A11y** | Labels; AA contrast; reduced-motion note for flash |
| **Nav** | Market/Analyzer parent — **not** Practice suite pill (DL-232) |

### Explicit bans

- `prompt()` / `alert()`  
- Icons-only unlabeled controls  
- P&L valence coloring on cells  
- MSC-skinned chrome  
- “We’ll do HIG later” for prelim sketches used as build authority  

## Out of scope

Domain Massive math (Hotel/Alpha). Production code (Charlie after W0-G).

## Completion

`gate-reports/W0-6-echo-hig-prelim.md` — design pack accepted by Coach or Delta at W0-G.
