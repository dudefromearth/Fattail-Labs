# W1 live browser walk

**Date:** 2026-08-28  
**Host:** this workspace `http://localhost:3000` (not `Fattail-Labs-apply-dev` on :3001 — that tree has no toolbar).  
**Auth:** `/api/auth/dev-login`  
**Spec:** `web/e2e/tm-w1-strip-order.spec.ts`  
**Result:** **PASS** (1.6s)

## What the walk found

The first screenshot at 1440×900 showed Autofit then a clipped date field. Play/Pause/Stop/Reset were off the right edge. Two unit files could not see that.

Fix in this same packet: the dark strip is one horizontal row with `overflow-x-auto`. Strikes/in + Autofit stay nowrap; Time Machine sits immediately right; PiP after. Scrolling the transport into view shows the full strip.

## Bounding-box order (desktop)

Strikes/in → Autofit → Time Machine → PiP. Play and Reset have non-zero boxes. Compact 390×844: Autofit not to the right of TM on the same row.

## Evidence

- `agents/p-options-lab-tm/evidence/w1-strip-desktop.png`
- `agents/p-options-lab-tm/evidence/w1-strip-desktop-transport.png` — Autofit, date, Play, Pause, Stop, 10×/20×/50×, Reset, PiP
- `agents/p-options-lab-tm/evidence/w1-strip-compact.png`
- `agents/p-options-lab-tm/evidence/w1-strip-loaded.png`

W3 watermark is also paint-only. Same walk is required there — screenshots of all three hosts, not unit tests alone.
