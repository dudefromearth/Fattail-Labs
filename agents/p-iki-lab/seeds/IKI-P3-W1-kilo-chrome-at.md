# IKI-P3-W1b — Chrome characterization

**Project:** IKI Lab · IKI-P3  
**Agent:** Kilo  
**Depends:** IKI-P3-W1 Charlie  
**Feeds:** Echo · Tango · IKI-P3-G  
**GO:** `agents/go/IKI-P3.md`

## In scope

| File | Touch |
|------|--------|
| **If B3 = Yes:** `web/lib/runner/__tests__/iki-p3-chrome.test.ts` | **Create.** Rail mounted; selector bar gone |
| **If B3 = No:** `web/app/app/iki/runner/iki-p3-chrome.test.ts` or Playwright in `agents/p-iki-lab/evidence/iki-p3/` | Same criteria; do not write under `web/lib/runner/__tests__/` |
| Existing `shell.test.ts` `p2.test.ts` `p3.test.ts` `iki-p2-host.test.ts` | **Run only** — must stay green |

## Out of scope

Changing `run()`, templates, or hash fixtures. Editing Options Lab. Editing `render.ts` if B3 = No.

## Law

Chrome must not change the data path. Through-`run()` tilesHash at default identity equals pre-W1.

## Completion (verifiable)

1. Existing Runner suites pass. New chrome test passes.  
2. tilesHash through `run()` unchanged.  
3. `/app/iki/runner` market WS **1**; keyboard Tab through rail; computed min height of rail controls ≥44px; visible `runner-template-selector` = 0.  
4. `npm run build` clean.

## Gate share

Paste command output into evidence / IKI-P3-G.
