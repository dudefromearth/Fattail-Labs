# ADVISOR — VP / SA watch list

INFRA does not self-review specs. Findings route here.

| # | Watch | Finding if |
|---|--------|------------|
| 5 | **Charting scope (AZ-VP-9-A7 · DL-738)** | Scope creep toward a general charting platform — drawing tools, indicator libraries, watchlists, multi-chart layouts, or any TradingView capability not named in A2–A6 / the SA spec. "TradingView has it" is never, by itself, a reason to build. Specified VP feature wins. |
| 6 | **Layer architecture (AZ-VP-9-A8 · DL-739)** | Mixed spans on one canvas; a layer pre-enabled that the law defaults off; Footprint or GEX treated as a view; Replay treated as a layer; Help/docs that drop "one chart, layers you switch on." |
| 7 | **Dialog singleton (AZ-VP-9-A10 · DL-740)** | Stacked or modal settings dialogs; a canvas part with a one-off settings chrome; a new part that does not inherit the shared dialog by construction. |

Surface seeds must carry standing checks **5**, **6**, and **7**. A hit is a **finding**, not initiative.
