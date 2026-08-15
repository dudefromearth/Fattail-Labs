# SSR historical inventory — 2026-08-14

Taken **after** the live tap confirmed writing. No Massive re-download of existing SPY prints. Opening 0DTE chain for these days is **NO CHAIN** unless a dated snapshot exists (current client is live-only).

| Day | Role | Tape | Rows / bytes | Chain | IV | VIX | Note |
|---|---|---|---|---|---|---|---|
| 2024-08-05 | build | TAPE OK | 1,274,926 / 23 MB | NO CHAIN | IV NO | VIX pending | Unwind crash |
| 2024-08-08 | build | TAPE OK | 570,760 / 11 MB | NO CHAIN | IV NO | VIX pending | Recovery trend |
| 2024-07-11 | build | TAPE OK | 458,828 / 9 MB | NO CHAIN | IV NO | VIX pending | CPI trend |
| 2024-09-18 | build | TAPE OK | 621,421 / 11 MB | NO CHAIN | IV NO | VIX pending | FOMC |
| 2024-11-06 | build | TAPE OK | 666,118 / 13 MB | NO CHAIN | IV NO | VIX pending | Election gap |
| 2024-12-18 | build | TAPE OK | 772,910 / 15 MB | NO CHAIN | IV NO | VIX pending | FOMC |
| 2026-08-04 | build | TAPE OK | 825,707 / 17 MB | NO CHAIN | IV NO | VIX pending | Recent |
| 2026-08-05 | build | TAPE OK | 697,027 / 16 MB | NO CHAIN | IV NO | VIX pending | Recent |
| 2026-08-06 | build | TAPE OK | 614,064 / 14 MB | NO CHAIN | IV NO | VIX pending | Recent |
| 2026-08-07 | build | TAPE OK | 579,676 / 13 MB | NO CHAIN | IV NO | VIX pending | Recent |
| 2026-08-10 | holdout | TAPE OK | 559,277 / 13 MB | NO CHAIN | IV NO | VIX pending | Do not tune |
| 2026-08-11 | holdout | TAPE OK | 522,895 / 12 MB | NO CHAIN | IV NO | VIX pending | Do not tune |
| 2026-08-12 | holdout | TAPE OK | 496,267 / 12 MB | NO CHAIN | IV NO | VIX pending | Do not tune |
| 2026-08-13 | holdout | **NO TAPE** | 3,037 / 97 KB | NO CHAIN | IV NO | VIX pending | Pulled 05:11 ET — broken. Do not overwrite. |
| 2026-08-14 | holdout / today | **TAPE OK** | 464,585 / 11 MB | **CHAIN OK** (live tap) | **IV OK** | **VIX OK (labeled proxy)** | Saturday proof day. Prints `tape/SPY-trades.parquet` provenance `massive_trades_day` (not live_capture). |

Saturday engine proof uses **today’s live_capture** (chain + IV + SPY marks now; prints after the close). Historical days have tape for path walking; they do **not** have an opening listed chain until a lawful dated snapshot exists.
