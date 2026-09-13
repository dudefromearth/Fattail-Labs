# Orchestrator — Options Lab XSP / SPY Scale

**Juliet** runs this board. Specialists only via seeds. Gates via **Delta** ternary.

**Plan:** [`docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md`](../../docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.3.md) **v1.3**  
**W0 token:** [`agents/go/XS0-W0.md`](../go/XS0-W0.md) **GO** (XS0-0 · **DL-700**)  
**WIDTH-1 prerequisite:** `a27f187` · **DL-699** — done; do not re-plan.

### Critical path

```text
XS0 → XS1 (Create recipes) ─┐
      XS2 (Heatmap columns) ─┼─► XS4 → XS5
      XS3 (SPY listed-snap) ─┘
      [XS-W never — L3 LOCKED]
```

XS1, XS2, XS3 are **siblings after XS0-0**. Heatmap columns do not wait on Create recipes.

| Phase | Name | State |
|-------|------|--------|
| **XS0** | Board · OD-XS* · seeds · AGENTS reassignment · plan hash | **GO** — `XS0-W0.md` · **DL-700** |
| **XS1** | Create / recipe scale + OD-XS7 XSP fallbacks | After XS0-0 |
| **XS2** | Heatmap column resolver + scoped DL-435 reverse in the same PR | After XS0-0 · OD-XS1 (a) |
| **XS3** | SPY listed-snap policy | After XS0-0 · OD-XS2 (a) |
| **XS4** | AT-XS* · pytest · live migrate-152 · Playwright · e2e fold | After XS1 · XS2 · XS3 |
| **XS5** | Arch 29 · AF changelog row · pointer honesty · close | After XS4 |
| **XS-W** | Width picker | **Never this board** (L3) |

**Data law:** Universe overlay (`source === "market_symbol_universe"` ∧ `fixed_points`) is scale SoR. Kind-default must not paint as overlay. AZ-DEF-4: never invent unlisted arithmetic width. Panel and runner consume **one** resolved list (`ChainContext.columnWidths`).

### Gate protocol

1. Seeds executed → evidence in `gate-reports/` or cited paths.
2. **Delta** phase gate: PASS / FAIL / BLOCKED.
3. No SKIP. Coach may descope a JR* item on DL.
4. Overrule of a specialist finding = **DL entry**, not silent waive.

### Seed naming

`XS0-{n}-{agent}-{slug}.md` · `XS1-{n}-…` · `XS2-…` · `XS3-…` · `XS4-…` · `XS5-…`  
Gates: `XS0-G.md` · `XS1-G.md` · `XS2-G.md` · `XS3-G.md` · `XS4-G.md` · `XS5-G.md`

### First actions (Juliet)

1. **XS0-0 GO** stamped. Fire **XS1-0** and **XS2-0** as siblings (separate PRs). Sequence XS1 behind the Dialog board if that GO is still open.
2. XS0-1…9 notes may still land; they do not block XS1/XS2 after GO.

### Isolation (no seeds on these boards)

| Board | Rule |
|-------|------|
| `p-options-lab-heatmap-width-fit` | **Closed** WF1–WF5 · **DL-526**. Do not reopen. WIDTH-1 shots stay at `gate-reports/width1/` |
| `p-options-lab-heatmap` | AF0–AF-Z closed. Do not implement AF-X as this product |
| `p-options-lab-heatmap-lim` | **Active** LIM. Do not touch LIM files |
| `p-quant-friction` | **Active** QFRIC. No quant files. Probe is read-only evidence |
| `p-options-lab-create-edit-dialog` | L3: do not restore Width picker. Delta FAIL if XS1 touches dialog chrome, Tos padlock, or `defaultWidth` |

### Do not

- Reopen closed Width Fit WF1–WF5 or Advanced Fly AF0–AF-Z.
- Edit `AnalyzerPositionsList.tsx`. Touch `fetch_step_floor`. Edit `defaultWidth` (WIDTH-1 Keep).
- Restore a Create Width picker (L3 LOCKED / AT-DLG-22).
- Mutate `HEATMAP_FLY_WIDTHS`. Call `flyWidthsFromProfile` for all symbols.
- Change `productWingHint("XSP")` this packet (OD-XS9 (a)).
- Stop `:3000` / `:4000`. Deploy MiniTwo.
- Treat a passing XS gate as IKI Labs / `observer-light` / Factory catalog progress (**NX18**).
- Coin a new Runner name. Runner **is** Template Runner (`web/lib/runner/`).
- `git add -A`.
