# LIMS-1 — LIM straddle scale (amendment v0.4)

**Project:** Options Lab Runner — GEX (Quad Window) / LIM
**Agent:** Charlie (compute, chrome, tests) · Lima (DL-820, Arch 29, spec v0.4.8) · Delta (gate)
**Authority:** `LIM-Straddle-Scale-Amendment-v0_4.md` · DL-817 · DL-818 · DL-819 · DL-820
**GO:** `agents/go/LIMS-W0.md` (three OKs, 2026-10-08). Coach, 2026-10-08: "WTF just build the fucking thing already" — files outside the token list that this build needs are in scope. v0.4.7 is not edited.

## Files

- `web/lib/options-lab/templates/lim.ts`
- `web/lib/options-lab/templates/limConfig.ts`
- `web/lib/options-lab/templates/limChrome.ts`
- `web/lib/options-lab/templates/lim.test.ts`
- `web/lib/options-lab/templates/lim.straddle-spx.json`
- `web/lib/options-lab/templates/limQuadrant.test.ts`
- `web/lib/options-lab/templates/lim.c2.test.ts`
- `web/lib/options-lab/templates/lim.zeroFetch.test.ts`
- `web/lib/options-lab/templates/lim.vocab.test.ts`
- `web/.env`, `web/.env.local` (gitignored; backups `*.bak-2026-10-08-straddle`), `web/.env.example`
- `Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.8.md`
- `Architecture/29-options-lab-heatmap-templates.md`
- `Architecture/00-decision-log.md` (DL-820 only)

## Out of scope

v0.4.7. Amendments v0.1–v0.4. The held per-symbol env map. MS-9 and any admin notification. MiniTwo. A commit.

## Rule

`k` = 3.2712422351724415. `x = 100·tanh(centrePts / (k·S))`. `xUnclamped = 100·r`. No X clamp. No per-symbol lookup. Missing straddle uses the §3 sentence. Y unchanged.

## Done when

AT-LIMS1–6 and AT-LIMS9 pass in `lim.test.ts`. AT-LIMS4 admin half is named as a gap. AT-LIMS8 is zero in product code, tests, env, and Arch 29, and the historical hits are listed. StudioTwo Next :3000 was restarted so the public key is inlined. Production was not started.
