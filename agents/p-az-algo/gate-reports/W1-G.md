# W1-G — Delta math gate

**Verdict:** **PASS** (re-run 2026-08-20 · AZ-ALGO v1.0.2 / **DL-488**)

Floor default **0.25**. Knobs are fixture **inputs**. Ten numbered W1 fixtures green at 25. Parameterization proof: a different `trail_floor_pct` does not recut expects.

```
cd web && npx --yes tsx lib/options-lab/algoTrailMath.test.ts
algoTrailMath W1
  ok  Reason off or blank uses the built-in engine; on stores the prompt
  ok  member knobs default 75 / 75 / 25 (placeholders, not fixture law)
  ok  unspecified decay end is session EoD; clock hits fMin at that instant
  ok  0 locked D* debit (positive OPF) is the entry debit — not only negative lock
  ok  1 symmetric long call fly, body > spot → eligible; ATM body not
  ok  2 credit / short fly → not eligible
  ok  3 arm at U ≥ entry_pct · D
  ok  4 H ratchet; S = f × H
  ok  5 E(t) up (IV pop) does not raise f (A1)
  ok  6 near invert between spot and xH
  ok  7 B1 far-side blow-through records exit_side far
  ok  8 recross body → side near
  ok  9 invert missing → named; P&L backstop only then
  ok  10 threaten enter 0.20 G, leave 0.25 G
  ok  knobs are inputs: a different floor does not recut this set
  ok  Recorded payload mode labels demo vs live

16 tests passed
```

Fixture **7** (far-side blow-through → `exit_side: far`) green. Fixture **5** (IV pop does not loosen `f`) green. Recorded demo example: `mode: "demo_whatif"` → holder `Recorded · demo`.

Shared set: `web/lib/options-lab/algoTrailConformance.ts`.

**Next:** W2 Builder (no `HostPnLChart.tsx`).
