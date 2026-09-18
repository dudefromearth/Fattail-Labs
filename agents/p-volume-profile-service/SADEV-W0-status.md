# SA-DEV-W0 — APPS status

**Instance:** GROK BUILD — APPS · namespace `SADEV*` · **DL-723**  
**Token:** [`agents/go/SA-DEV-W0.md`](../go/SA-DEV-W0.md) **STAMPED GO** (act 1 amended mock-first 2026-09-17)

**Contract:** [`Specs/VP-API-Contract-v1_1.md`](../../Specs/VP-API-Contract-v1_1.md)  
India pre-flight StudioTwo: 59 lines · sha1 `d01b3dd9bfbac3bbcafb34110ef7d06cd6650915` · 3 `## ` · last `## Unchanged from v1.0` · **MATCH**. Supersedes v1.0 `b403937af18140eb7900ccfa72437e7f3e9bc5aa` (**DL-733**).

| Act | State |
|-----|--------|
| 1 Mock + live | **FLIPPED** `LABS_SA_DEV_VP_API_BASE=http://127.0.0.1:4010` (DEV-API.md). Fixture harness remains `harness=fixture`. Contract v1.1. SPY coverage null on this store — named NO COVERAGE. |
| 2 SA detection | `server/sa_dev/detect.py` — SA v0.3 F1/F2 goldens; integration consumes contract bins |
| 3 Dev canvas | `/admin/sa-dev` — Live binds to payload: request developing; if `session_date` ≠ trading date fall back to `kind=session` and label `Session — MM-DD (closed)`. Fixtures unchanged. |

**Report (not a shim):** contract cites `Volume-Profile-Service-Spec-v0_6_1.md` §10. That file is **not on disk**. F1/F2/F5 numbers taken from seated **v0.6** §10. F8 has no numeric tape in v0.6 — mock sums F2+F1 over two session dates (qualitative F8). Coach to land v0.6.1 if those bytes must match a different tape.

**SA-L11 (SA v0.4 · DL-725):** Structure shipping; Replay, Footprint / Market Delta, GEX Overlay, Characterization, Exploration = IN-DEVELOPMENT with §8.1 doctrine. Reserved keys `UNSERVED`. Alerts not a view (SA-L10).

**Does not.** Write `{LABS_MARKET_DATA_ROOT}/vp/ingest/`. Production Options Lab. VPS*/VPSB*. StudioOne. Work around the contract.
