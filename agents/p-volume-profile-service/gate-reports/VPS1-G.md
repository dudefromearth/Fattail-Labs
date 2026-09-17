# VPS1-G — Ingest install (ACT 3)

**Delta** · 2026-09-16 ~20:32–20:38 ET · StudioOne  
**Stamp:** `VPS1-W0` **STAMPED** · **DL-709** · overrule **DL-710** (tier = bookkeeping)

## Clock / CP-1

| | |
|--|--|
| StudioTwo clock | **20:31 ET** GATE PASS |
| BEFORE | `chain_feed` **538** · log 20:32 · `wrote mb:ladder:SPX:2026-09-16:w25:dual` · `sym_feed` **535** |
| AFTER | `chain_feed` **538** unchanged · log 20:36 still writing ladders · `sym_feed` **82012** (KeepAlive after kill test) |
| Rollback | **Not executed** (no chain degradation). Rehearsed: restore `.vps1-act3-bak` + LaunchAgents `vps1-act3-bak-20260916` and `launchctl kickstart` **sym_feed only**. |

## Install

- Files: `vp_ingest/*`, Q4 fixture, extended `sym_feed.py` on StudioOne tree
- `run.sh`: `export LABS_VP_SPY_TRADES=1`
- kickstart `user/503/ai.fattail.labs.sym-feed` only
- Log: `vp spy trades ingest thread started` (twice: install + KeepAlive)
- First process **81779**: two `:443` sockets (REST + second peer — WS **ESTABLISHED**, not refused)
- After kill: **82012** still `LABS_VP_SPY_TRADES=1`; one `:443` at 20:38 (WS reconnecting or delayed)

## Quotes (1 minute)

`mb:sym:SPY` keys unchanged: `symbol, feed, mid, bid, ask, prev_close, source, label, ts, seq`. `seq` advanced ~6 s. Same shape as pre-install.

## Prints / gaps

- `{LABS_MARKET_DATA_ROOT}/vp/ingest/SPY/` — **no files yet** (20:35–20:38 ET, after 20:00 extended-hours end; tape silent)
- Kill test: SIGTERM **81779** only; KeepAlive → **82012**; **chain_feed 538 untouched**. Process death did **not** flush a gap line (daemon thread). Harness on StudioTwo already proved gap JSONL (`tests/test_vp_spy_trades_ingest.py`).

## Verdict

**VPS1-G: PASS** on tonight’s **mechanics** (extend installed, quotes undisturbed, chain_feed clean, WS not refused on first connect).

**Carry:** first **full-RTH** capture verification (volume sanity + condition-code distribution) **after tomorrow’s close**.

**VPS2: NO-GO** until that RTH pass **and** Coach ticks:

1. **Q5** odd-lot eligibility (reviewers lean **EXCLUDE** for member-facing histograms)
2. **Q4** ambiguity-resolution (id 0 / other ambiguous codes **EXCLUDED-and-flagged** for Engine)

`VPS2-W0` not created. Install **left running** for tomorrow RTH.
