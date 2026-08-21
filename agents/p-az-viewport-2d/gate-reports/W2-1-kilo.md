# W2-1 — Kilo Packet A ATs

**Verdict:** **PASS**

```
cd web && npx --yes tsx lib/risk-graph/pnlChartViewPolicy.test.ts
pnlChartViewPolicy
  ok  AT-2D-AF-1 … AT-CLICK-1 / AT-WH-1 / AT-AZ-WIRE-1 source
9 tests passed
```

AT-VS-1 / AT-2D-AF-7 covered by `userAdjusted` gating. AT-CLICK-1: `bindChartHost` pointerdown pan, host `contextmenu` is the alert menu. AT-WH-1: `{ passive: false }`. Strike handles already wired as-built (later Packet B land); not a Packet A fail.
