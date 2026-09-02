# LIM1-G — Config + computeLim

**Gate:** LIM1-G  
**Delta** ternary  
**Date:** 2026-09-02  
**Plan:** `docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.2.md` v1.2  
**Spec:** LIM v0.4.3 **BUILD AUTHORITY** sha1 `01f638f590492520236b3607edde487b949d6016`  
**Token:** `agents/go/OLLIM-W0.md` — **GO** (LIM0-0 · **DL-651**)

## Verdict

**PASS**

`limConfig.ts` + `computeLim` land against Spec v0.4.3 (E15–E17). Hotel F1–F9 goldens match without rounding. Frozen GEX and Width Fit tests still pass. No UI, trail, registry, panel, or `gex.ts` rewrite. C2: config parse is lazy; other templates still register.

---

## Command evidence

```
cd /Users/ernie/Fattail-Labs/web
npx --yes tsx lib/options-lab/templates/lim.test.ts
lim.test.ts ok

npx --yes tsx lib/options-lab/templates/chainContext.test.ts
chainContext GEX 10 tests passed

npx --yes tsx lib/options-lab/templates/widthFit.test.ts
widthFit.test.ts ok

shasum -a 1 "Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.3.md"
01f638f590492520236b3607edde487b949d6016
```

AT-LIM28 (compute): `rg LIM_CONF_ web/lib/options-lab/templates/lim.ts web/lib/options-lab/templates/limConfig.ts` → zero hits.  
AT-LIM26: `rg yUnclamped web/lib/options-lab/templates/lim.ts` → zero hits.

---

## Files

| Path | Bytes | First line |
|------|------:|------------|
| `web/lib/options-lab/templates/limConfig.ts` | 5763 | `/**` |
| `web/lib/options-lab/templates/lim.ts` | 6697 | `/**` |
| `web/lib/options-lab/templates/lim.test.ts` | 13454 | `/**` |
| `seeds/out/LIM1-0-hotel-charlie-out.md` | 2110 | `# LIM1-0 — Config + computeLim (out)` |
| `seeds/out/LIM1-1-kilo-out.md` | 1881 | `# LIM1-1 — Calculation fixtures (out)` |
| `seeds/out/LIM1-2-hotel-out.md` | 2388 | `# LIM1-2 — Formula match (out)` |

`types.ts` / `registry.ts` / `HeatmapChainPanel.tsx` / `gex.ts` **not** edited.

---

## AT share this gate

Green: **AT-LIM1–13, 16, 17, 17b, 19, 20, 26, 28, 29, 30, 31.**

Held for later phases: 10, 14, 15, 18, 21–25, 27, 32.

---

## Does not

Fire LIM2 · UI · trail · glow · MiniTwo · `.env` keys (fail-loud stays; panel does not activate LIM yet).
