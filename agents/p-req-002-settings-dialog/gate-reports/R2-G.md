# R2-G — REQ-002 TV-model settings dialog

**Verdict:** PASS (artifact / implementer half)  
**Date:** 2026-09-19  
**Seat:** Echo + Charlie  
**Law:** REQ-002 v2 · DL-768 · DL-770 · A10 · A20 · A22  
**Machine:** StudioTwo. `:3000` (node 25784) and `:4000` (uvicorn) left running. No MiniTwo. No `server/symbology`.

**REQ-002 remains OPEN** until AP-1 in Coach’s own browser on StudioTwo (his right-click). This gate does not close the REQ.

**Blob:** `git rev-parse origin/main:artifacts/references/REQ-002-settings-dialog-reference.png` = `bf9fa21ac600cfe0432f2651dcee9080d55258f4` (dispatch gate met).

## GO / NO-GO

**GO** — hierarchical TV-model dialog is on the member VP route: white/black, sidebar icon+label with selected pill, pane group headers, footer Template / Cancel / Ok, live preview, Ok-commit / Cancel-revert, A22 (no draft PUT while open), right-click opens the matching section. Our settings only.

## Evidence

Headed Playwright, `LABS_WEB_BASE_URL=http://studiotwo:3000`, viewport 1600×1200, `web/e2e/req-002-settings-dialog.spec.ts` **1 passed (4.0s)**.

| Shot | File | Claim |
|------|------|--------|
| (a) dialog open, Canvas (gear) | `artifacts/req-002/a-dialog-open-canvas.png` | Title, close ×, icon sidebar, Canvas selected, white/black |
| (a) Scales and lines | `artifacts/req-002/a-dialog-scales.png` | Same section the reference shows; 754×1104 CSS (PNG/2 of 1506×2210) |
| (a) page | `artifacts/req-002/a-page-dialog-open.png` | Member VP `studiotwo:3000/app/options-lab/volume-profile` |
| (b) right-click price scale | `artifacts/req-002/b-right-click-axis.png` | `data-part=axis` Scales and lines |
| (b) right-click layer L2 | `artifacts/req-002/b-right-click-profile.png` | `data-part=L2` Profile |
| Side-by-side | `artifacts/req-002/side-by-side-scales.png` | Left = reference (scaled ½), right = Labs |
| Overlay 50% | `artifacts/req-002/overlay-scales.png` | Same size 754×1104 |
| Overlay 2× | `artifacts/req-002/overlay-scales-2x.png` | Reference pixel size |

Ok/Cancel: e2e toggled VP anchor, Cancel restored snapshot, Ok kept the commit. `SaCanvasProvider` skips `PUT /api/me/sa-surface` while `openPart` is set; Ok clears the snapshot and the effect writes through (A22).

Unit: `cd web && npx tsx lib/saLayerStore.test.ts` → `saLayerStore.test.ts 1 ok` (section icons + right-click map).

## Measured vs build (CSS = PNG/2; PNG wins)

| Measure | Spec / PNG | Build |
|---------|------------|--------|
| Dialog | 1506×2210 PNG → 753×1105 CSS | 754×1104 screenshot |
| Sidebar | ~300 PNG (~20%); measured pill ~453 PNG | 220 CSS |
| Item height | ~48 spec; measured pill 80 PNG = 40 CSS | 40 CSS |
| Title row | ~88 PNG | 56 CSS |
| Footer | ~96 spec; measured 132 PNG = 66 CSS | 66 CSS |
| Row | 44–52 | 48 CSS |
| Dropdown | 36–40 | 36 CSS |
| Checkbox | ~18 | 18 CSS |
| Swatch | ~32 | 32 CSS |
| Paired gap | ~8 | 8 CSS |

## Deviations (enumerated)

**In scope (not defects):**

1. **Our settings only** — sidebar is Canvas / Price / Profile / Analysis / Scales and lines / Status line / Range. Not TV’s Symbol / Trading / Alerts / Events. Pane fields are the inventory (`REQ-002-inventory.md`), not Currency and Unit, lock-price ratio, date format, etc.
2. **Clause 5** — Labs `--font-ui`; white background and black text per Coach. Native checkbox and `input type=color` chrome.
3. **Empty pane** on sections with few fields (Scales and lines has placement + last/hi-lo only). TV’s pane is dense because it has more options. We do not clone those fields.
4. **Sidebar order** — Canvas first (gear landing, inventory). TV’s selected “Scales and lines” is their third item; ours is fifth. Overlay therefore cannot pixel-match the pill.

**Remaining visual deltas (not clause 5; small):**

5. Close × is the HIG xmark stroke, not TV’s glyph.
6. Native selects vs TV’s custom popup; chevron overlay approximates the control.
7. Title 22px / 600 vs TV’s slightly heavier “Settings”.
8. Template dropdown still a few px wider than TV’s compact Template (~118 vs ~100 CSS).

Target was “none beyond clause 5.” 1–4 are lawful. 5–8 are residual chrome, visible in the overlay at the title, close, and Template width. Not hidden.

## Files

- `web/components/sa/SaPartDialog.tsx` — TV-model shell + our fields
- `web/lib/saSettingsSections.ts` — icon ids
- `web/lib/saLayerStore.test.ts` — icon asserts
- `web/e2e/req-002-settings-dialog.spec.ts` — headed evidence
- `artifacts/req-002/*` — shots + comparison

Unchanged this packet: `SaCanvasContext` live preview / Ok / Cancel / A22 write-through; `partFromPointer` / layer-strip / chip right-click.

## Not claimed

AP-1. Coach’s own right-click. MiniTwo. SYM tree. Analyzer / Runner settings.
