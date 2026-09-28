# A1 — Alpha · capture band (mexp2, not live plist)

**Tree:** `~/Fattail-Labs-mexp2`  
**Files:** `server/market_data/ssr_live_capture.py`, `ssr_mexp_capture.py`, tests.  
**Not:** launchd, live archive root, Labs UI, `chain_feed` (A2).

Implement spec §1: `σ_T`, `follow(t)`, `active(t)` ratchet, degenerate IV hold, env `LABS_SSR_BAND_SIGMA=2.5`, `LABS_SSR_BAND_LEAD_SIGMA=0.25`, σ cap 4.0. Retire `wings()` / `book_wings` / `band_scale` / `lead_wings` for capture. Writer uses a **parallel archive path** from env, default not the live folder. No RTH deploy.

Done when K1 tests pass: 0DTE and 5DTE windows; IV <1% holds last good; union never drops a strike.
