# SSR session map (`session-map.json`)

Config, not code. The tap reloads on mtime change, every phase transition, and at least once per minute. Override path: `LABS_SSR_SESSION_MAP` (absolute). `LABS_SSR_HARDENING` default off ignores the map (poll-all). Flag on + missing/unreadable file fails loud.

**Schema v1:** `version` must be `1`. `timezone` must be `America/New_York`. `default_phases` apply to any enabled tradeable name not listed under `symbols`. Phase tokens: `gth`; `premarket`/`pre` → clock `pre`; `rth`; `postmarket`/`post`/`extended` → clock `extended`. Never list `closed` or `weekend`.

**Overnight GTH (`gth`):** Coach observation 2026-08-18 — **SPX, XSP, IWM, USO** only. Do not invent overnight for the other fourteen.

**Cboe GTH 7:30–9:25 ET** (from 2026-08-17: AAPL, NVDA, TSLA, META, MSFT, AMZN, GOOGL) sits in clock `pre` (04:00–09:30), not overnight `gth`. Remaining ETFs (SPY, QQQ, GLD, TLT, SLV, XLF, UNG): `pre` + `rth` + `postmarket` (Massive published window). No overnight chain.

The 18 names are the enabled tradeable Admin universe (VIX / VIX1D are reference marks, not chain sessions).
