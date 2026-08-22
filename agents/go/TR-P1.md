# GO token — Template Runner TR-P1 · Browser Runner Shell

**ID:** `TR-P1`  
**Program:** Template Runner  
**Packet:** [`Specs/Template-Runner-Packet-TR-P1-Browser-Shell-v0_1.md`](../../Specs/Template-Runner-Packet-TR-P1-Browser-Shell-v0_1.md)  
**Spec:** Template Runner **v0.1.2** — [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) (canonical) · revision text [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1_1.md`](../../Specs/FatTail-Labs-Template-Runner-Spec-v0_1_1.md)  
**Gate:** **TR-P1-G**  
**DL:** **DL-533**

**DL-328:** Delta gates TR-P1 by **this file**. Chat is not a stamp.

---

## Coach stamp

- [x] **GO** — fire TR-P1 (browser Runner shell)  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Coach  
**Date:** 2026-08-21  

Coach stamped **GO** in session. Specialist notes may still land; they do **not** block W1.

This GO covers **packet TR-P1 only**. The rest of the Runner spec (IKI host, controls, composition, license, thesis SSE process) stays **THESIS**.

---

## W0 — door citations (artifact)

| Piece | Path |
|-------|------|
| WS gateway | `server/routes/market_stream.py` — `WS /api/me/market/stream` |
| Tab singleton | `web/lib/market/MarketSocket.ts` — `getMarketSocket()` |
| Interest API | `MarketSocket.setChainInterest(id, ChainSub \| null)` · `subscribe(fn)` · `poke()` |
| Current chain hook | `web/lib/market/useOptionChainBus.ts` — `content_hash` on `chain` messages → `hash` |
| Heatmap templates (read-only) | `web/lib/options-lab/templates/{registry,symFly,flySurfacePipeline,types}.ts` |
| Tile function (current path) | `FlySurfacePipeline.ingest` + `symFlyTemplate.assignColors` (HeatmapChainPanel fly surface) · `buildGrid` for non-fly |
| Heatmap route | `web/app/app/options-lab/heatmap/page.tsx` — suite home `web/app/app/options-lab/page.tsx` is a **redirect** to heatmap |

**Arch:** 28 §4.1–4.3 · 34 · DL-419 / DL-420  
**Law:** TR1–TR12 · HM1–HM20 (heatmap-form) · SI #2 #4 #5 #10

**Folder name:** `web/lib/runner/` (packet default; India did not rename).

---

## W0 — files (declare)

**Create**

- `web/lib/runner/registry.ts`
- `web/lib/runner/subscribe.ts`
- `web/lib/runner/run.ts`
- `web/lib/runner/sinks/render.ts`
- `web/lib/runner/templates/heatmap.ts`
- `web/lib/runner/__tests__/shell.test.ts`
- `web/lib/runner/__tests__/fixtures.ts`

**Touch**

- `web/app/app/options-lab/heatmap/page.tsx` — one flag conditional  
  *(packet named `options-lab/page.tsx`; that file only `redirect`s to heatmap. Mount belongs on the heatmap route.)*

**Read only:** `web/lib/market/*` · heatmap template source · `server/`

**Out:** IKI · controls · live/data/notify sinks · composition · license · any `server/` or `web/lib/market/` edit · heatmap template source.

---

## Flag

`NEXT_PUBLIC_LABS_RUNNER_SHELL` — missing or `0` → current path; `1` → shell path. Missing is **not** fail-loud (shell is additive).

---

## W0 socket baseline (2026-08-21, `/app/options-lab` → heatmap)

DevTools-equivalent: Playwright `page.on("websocket")` after `/api/auth/dev-login`.

| Socket | Count |
|--------|-------|
| `WS /api/me/market/stream` | **1** |
| Next HMR (`/_next/webpack-hmr`) | 2 (dev only; not market) |

Flag off (env missing) = this baseline. Flag on uses `getMarketSocket()` + `HeatmapChainPanel`; unit test: two runner interests, one socket instance. Market socket count cannot rise.
