# ADVISOR — VP / SA watch list

INFRA does not self-review specs. Findings route here.

| # | Watch | Finding if |
|---|--------|------------|
| 5 | **Charting scope (AZ-VP-9-A7 · DL-738)** | Scope creep toward a general charting platform — drawing tools, indicator libraries, watchlists, multi-chart layouts, or any TradingView capability not named in A2–A6 / the SA spec. "TradingView has it" is never, by itself, a reason to build. Specified VP feature wins. |
| 6 | **Layer architecture (AZ-VP-9-A8 · DL-739)** | Mixed spans on one canvas; a layer pre-enabled that the law defaults off; Footprint or GEX treated as a view; Replay treated as a layer; Help/docs that drop "one chart, layers you switch on." |
| 7 | **Dialog singleton (AZ-VP-9-A10 · DL-740)** | Stacked or modal settings dialogs; a canvas part with a one-off settings chrome; a new part that does not inherit the shared dialog by construction. |
| 8 | **Purpose / L-POSITION (AZ-VP-9-A11 · DL-741)** | A feature that serves none of morning routine / trade entry / trade management; Morning Routine preset treated as anything other than Coach's show configuration; L-POSITION shipped as a view or in structure colors; Help that is not organized by the three uses. |
| 9 | **Full-history profile (AZ-VP-9-A12 · DL-742)** | Profile that re-aggregates on visible time (VRVP); silent truncation of the coverage floor; shipping `kind=composite` before a proposed endpoint; treating `/range` below floor as a silent partial. |
| 10 | **TV look parity (AZ-VP-9-A13 · DL-744)** | Profile not flush to the axis; muted/hollow candles as the default; missing last-price tag; light chrome inside the app frame; a look that would fail Coach's eye against the filed ES1! 2026-09-18 screenshots. |
| 11 | **Local-feel (AZ-VP-9-A14 · DL-745)** | Spinner-first pan/zoom; fabricated bars for speed; generation-keyed payload without ETag; developing served as `immutable`. |
| 12 | **Round-2 look (AZ-VP-9-A15 · DL-746)** | Axis type smaller than the annotated TV shots; un-bordered candles; fixed sparse time labels; y-void beyond ~75 px padding; labels like `7687.11`. |
| 13 | **Instrument tick (AZ-VP-9-A16 · DL-746)** | Hardcoded 0.25 or any client-side per-symbol tick table; ES→SPX without re-deriving the scale from metadata. |
| 14 | **Parity attestation (AZ-VP-9-A17.5 · DL-749)** | Any look/behavior report reaching Coach without a side-by-side checklist attestation vs the TV benchmark, plus numbered-law deviations. Blank-future default x-window. TV-standard behavior treated as needing Coach dictation. |
| 15 | **One design every ticker (AZ-VP-9-A18.4 · DL-752)** | Per-symbol code paths in surface work; bespoke chrome for primary pairs; a symbol switch that changes layout or behavior. |
| 16 | **Axis labeling (AZ-VP-9-A19 · DL-753)** | Off-ladder / awkward-decimal price labels; time labels that skip the largest changing unit; crowding/overlap; orphan gridlines without labels. |
| 17 | **Defaults dropdown (AZ-VP-9-A21 · DL-754)** | A settings dialog without Save as default / Reset to default / Reset to house default in the A10 footer. |
| 18 | **Settings survive (AZ-VP-9-A22 · DL-755)** | Browser storage treated as the home of record for VP/SA settings; a layout change that silently discards member state; a browser-only workaround for missing profile-store persistence. |
| 19 | **Right-click settings (AZ-VP-9-A20 · DL-758)** | A canvas object whose right-click (or long-press) does not open that object's A10 dialog; browser context menu on the chart surface. |

Surface seeds must carry standing checks **5**–**19**. A hit is a **finding**, not initiative.
