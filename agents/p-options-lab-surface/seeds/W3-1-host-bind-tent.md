# W3-1 — Host + Law B + exact/locked tent

**Project:** Options Lab 3D Surface  
**Agents:** Charlie · Alpha  
**Depends:** W0-G · W1-G · W2-G  
**Feeds:** W3-1-G  
**Order:** first W3 packet

## In scope

| Who | Files |
|-----|--------|
| Charlie | `web/lib/risk-graph/surfaceScene/` (new) · `web/app/app/options-lab/surface/page.tsx` · `web/components/options-lab/surface/` · `web/lib/optionsLabSuite.ts` (`surface` pill) |
| Alpha | `web/lib/risk-graph/surfaceModel.ts` — **τ-window** (`tauLo` / `tauHi`) only |

Host Law B states on the workspace, including **IV NO**. Bind
exact/locked only. Named empty state if no shown book. v0.1 may draw
one shown structure as a **named slice**. Last-minute **law** on the
live tent (OPF29 τ, hole → IV NO, residual after settlement).

## Out of scope

Time-machine **feed**. Mini graphic. Camera HUD beyond a default ISO
pose. Playhead walk. Planes HUD. Saved views. **Migration.** MiniTwo.
MSC. Backtest. Reopening S1–S8. Growing `3d/alpha.js`.

## Evidence (W3-1-G)

- Desktop + phone browser walk: route `/app/options-lab/surface` fills
  the host; Law B / IV NO named on a hole; exact/locked tent draws.  
- Curl: page is a member route (auth), not a public leak.  
- Tests: T-IV-1…4 · T-WIN-1/2 · T-LM-2/3 · T-TM-2 bind path · T-LM-1
  cite present (no second τ).
