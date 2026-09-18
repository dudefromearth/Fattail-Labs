# Orchestrator — Volume Profile Service

**Instance:** **GROK BUILD — INFRA** (**DL-720**). StudioTwo build/board. StudioOne only in CP-1 windows. Never `git add -A`. Do not stop StudioTwo `:3000` / `:4000`.

**OPS-DASH (DL-734 / DL-737):** **CONSOLIDATED · LIVE** at **`http://studioone.local:5055`**. One pane. StudioTwo `:5056` **retired**. Board [`OPS-DASH.md`](OPS-DASH.md).

**Does not execute:** `SADEV*` (APPS · ingest READ-ONLY). **`HM*` / `OD-GC*`** (GBH · Heatmap gex-cal). **Does not self-review specs** (ADVISOR).

**GBH disambiguation (DL-747):** the Heatmap **gex-cal** template is **not** this program's future "heatmap overlay" (SA-edges). Distinct products. Separate Labs routes (volume-profile vs heatmap).

**Roll week (DL-748):** OHLC uses derived lead-contract (volume + Contracts calendar). Session/developing bins still mix front+next until Coach answers `Q-roll-week-bin-eligibility.md`. No silent profile payload change.

**Contention:** collector wins on StudioTwo. Cross-instance conflict → **STOP, report to Coach** — never INFRA↔APPS↔GBH.

---

## Mission order — SINGULAR DRIVE (Coach 2026-09-17 · DL-727)

Everything not on this line is **parked** or **serves it**. Touched only when the drive is blocked or a CP-1 window is idle.

1. **DOWNLOAD** the data needed to create the bins
2. **CREATE** the bins
3. **CREATE** the API to get the bins

| Step | Maps onto | When |
|------|-----------|------|
| **1** | Tonight’s collector **migration PLUS backfill PROMOTED** | After 16:00 ET: VPSB ACT B (stop StudioTwo writer **before** StudioOne starts; prefer 17:00–18:00 CT halt), then vendor-floor backfill tranches: SPY equities floor · ES **2017-04** · MES **2019-05**. Disk-checked, resumable, integrity vs vendor manifests. **VPB-Q1** (historical mark source) evidence rides along — **does not block binning in source space**. |
| **2** | **VPS2** as tokened | Session + developing Engine. F3 golden = v0.6.1 (bins byte-identical across offset republish). **VPS2b (DL-742):** Q6=(c) all-history running per-row totals — fence lifted for this backing store only; `kind=composite` publish still fenced. Dev first; prod per footprint. |
| **3** | **VPS4 pulled forward** | API **build** on StudioTwo **NOW** against frozen **Contract v1.0**. Install behind its gate once Engine goldens are green. Auth classes + 403 fixture F6 included. Any contract change = **v1.1 through Coach**, never silent drift. |

**Report cadence:** one screen per evening window — tranche progress, bins coverage (sessions binned per symbol), API status.

**Governance:** **EVENING AUTORUN** (**DL-735**). launchd `ai.fattail.labs.autorun` **16:05 ET** weekdays. Human trigger for the evening chain is a **NO-GO**. Timer executes only `evening-queue.json`, in order; packet clock gates + CP-1 still enforce. Empty queue = one-line no-work. **Exactly one** autonomous trigger.

**Tonight's queue (16:05 ET autorun):** **tranche 1 only** (2026-09-16 descending). Engine, API, futures writer **cut over to StudioOne** 2026-09-18 06:39 ET (**DL-736**).

**Backfill law (DL-732):** newest first, contiguous **[floor … now]**, no holes. **Bin as you land.** Coverage floor published per source. `/range` below floor = **422 refuse** (Contract v1.1 candidate for an explicit floor field — do not improvise).

---

**Working spec (data end):** VP **v0.6.1** sha1 `7e3bbedc58e1cbadc2ce96bb820bf93059f8806d` (427) · **DL-730**. v0.6 remains on disk as baseline.  
**API contract (frozen):** [`Specs/VP-API-Contract-v1_0.md`](../../Specs/VP-API-Contract-v1_0.md) · 85 · sha1 `b403937af18140eb7900ccfa72437e7f3e9bc5aa` · parent = **v0.6.1 landed** · **DL-726** / **DL-730**.  
**App end:** SA **v0.4 authored** sha1 `d68060cc5221b83170d39aeace5e8fb8b7470c51` (540 · 22 `## `) · **DL-731**. Supersedes v0.3.1. **DL-728 pointer CLOSED.** NOT BUILD. Advisor round 2 vs **v0_3_1**; dispositions → **v0.4.1 via Coach**.  
**AZ-VP-9-A1:** [`Specs/amendments/AZ-VP-9-A1.md`](../../Specs/amendments/AZ-VP-9-A1.md) sha1 `53bf74daa8a2b67ac3073d6fdb92bfed9b297ab0` (41) · **MATCH**.  
**AZ-VP-9-A7:** [`Specs/amendments/AZ-VP-9-A7.md`](../../Specs/amendments/AZ-VP-9-A7.md) sha1 `efcaa297c80e8e4410a24bbbeb8aec68987e3e6c` (40 · 2 `## ` · last `## Standing`) · **MATCH** · **DL-738**. Scope boundary over A2–A6.  
**AZ-VP-9-A8:** [`Specs/amendments/AZ-VP-9-A8.md`](../../Specs/amendments/AZ-VP-9-A8.md) sha1 `7c30e2d3a906c7acc87262a680a0263ba30bd7fc` (45 · 2 `## ` · last `## Standing`) · **MATCH** · **DL-739**. Layer architecture consolidating A2–A7. Footprint/GEX = layers; Replay = view.  
**AZ-VP-9-A10:** [`Specs/amendments/AZ-VP-9-A10.md`](../../Specs/amendments/AZ-VP-9-A10.md) sha1 `3d29f050d19983392262c005131163ed9a4ec983` (36 · 2 `## ` · last `## Standing`) · **MATCH** · **DL-740**. Universal settings dialogs, one at a time.  
**AZ-VP-9-A11:** [`Specs/amendments/AZ-VP-9-A11.md`](../../Specs/amendments/AZ-VP-9-A11.md) sha1 `20984fe478152c7f8424bc1c652657265f346380` (59 · 5 `## ` · last `## Standing`) · **MATCH** · **DL-741**. Purpose law: morning routine / trade entry / trade management. **L-POSITION** named. Morning Routine preset = Coach's show configuration.  
**AZ-VP-9-A12:** [`Specs/amendments/AZ-VP-9-A12.md`](../../Specs/amendments/AZ-VP-9-A12.md) sha1 `417dc65af3960593cbda2c06d5dd36c00f31b247` (55 · 2 `## ` · last `## Standing`) · **MATCH** · **DL-742**. Full-history profile. **VPS2b** Q6=(c) running totals authorized. Until it serves, `/range` full covered span.  
**AZ-VP-9-A13:** [`Specs/amendments/AZ-VP-9-A13.md`](../../Specs/amendments/AZ-VP-9-A13.md) sha1 `292a711a94fd6d31cc18750da86f7f1fa3f35d15` (51 · 3 `## ` · last `## Standing`) · **MATCH** · **DL-744**. TV look parity. Benchmark: [`benchmarks/a13-tv-look-2026-09-18/`](benchmarks/a13-tv-look-2026-09-18/). Coach's eye is the gate.  
**AZ-VP-9-A14:** [`Specs/amendments/AZ-VP-9-A14.md`](../../Specs/amendments/AZ-VP-9-A14.md) sha1 `4489d35bd98115c9b8b5a5d255a2db4d938a68a7` (55 · 4 `## ` · last `## Standing`) · **MATCH** · **DL-745**. Local-feel. ETag = generation id (transport).  
**AZ-VP-9-A15:** [`Specs/amendments/AZ-VP-9-A15.md`](../../Specs/amendments/AZ-VP-9-A15.md) sha1 `671e11365d95032353b923abfbf4403d0477b56a` (39 · 2 `## `) · **MATCH** · **DL-746**. Round-2 look. Benchmark: [`benchmarks/a15-tv-look-round2-2026-09-18/`](benchmarks/a15-tv-look-round2-2026-09-18/).  
**AZ-VP-9-A16:** [`Specs/amendments/AZ-VP-9-A16.md`](../../Specs/amendments/AZ-VP-9-A16.md) sha1 `156577a1d3fea9d4d33e6ac8c6606afc2841a008` (26 · 2 `## `) · **MATCH** · **DL-746**. Per-instrument tick. No surface tick table.  
**AZ-VP-9-A17:** [`Specs/amendments/AZ-VP-9-A17.md`](../../Specs/amendments/AZ-VP-9-A17.md) sha1 `99d135b3b9fb2fec3917f8c91b34908e172058bd` (47 · 2 `## `) · **MATCH** · **DL-749**. Behavioral parity default. A4/A11 x-window default **struck**.  
**AZ-VP-9-A18:** [`Specs/amendments/AZ-VP-9-A18.md`](../../Specs/amendments/AZ-VP-9-A18.md) sha1 `60778d811d4fc802f3998e05a6725373b3a582fb` (31 · 2 `## `) · **MATCH** · **DL-752**. One design every ticker. A18.4 per-symbol surface paths are findings.

**Governance — surface seeds (standing checks):**  
5. Specified VP feature wins over chart generality. Scope creep toward a general charting platform is a **finding**, not initiative. (**AZ-VP-9-A7** · **DL-738**)  
6. One canvas, independent layers. Do not mix spans. Do not pre-enable a layer the law defaults off. Do not treat Replay as a layer or Footprint/GEX as views. (**AZ-VP-9-A8** · **DL-739**)  
7. Settings dialogs are one reusable floating singleton — never stacked. (**AZ-VP-9-A10** · **DL-740**)  
8. A feature serving none of the three uses fails A7. L-POSITION is a named future layer, not a view. Morning Routine house default is Coach's show chart. (**AZ-VP-9-A11** · **DL-741**)  
9. Primary profile is full-history / x-invariant. Visible-time aggregation is a finding (VRVP). (**AZ-VP-9-A12** · **DL-742**)  
10. Look is judged against the filed TV screenshots. Muted/hollow candles as the default is a finding. (**AZ-VP-9-A13** · **DL-744**)  
11. Spinner-first pan/zoom is a finding. Invented bars to look fast is a finding. Missing ETag on a generation-keyed payload is a finding. (**AZ-VP-9-A14** · **DL-745**)  
12. Axis figures smaller than the round-2 TV shots, hollow un-bordered candles as default, dead y-void beyond 75 px padding, or labels like `7687.11` are findings. (**AZ-VP-9-A15** · **DL-746**)  
13. A hardcoded 0.25 (or any per-symbol tick table) in surface code is a finding. (**AZ-VP-9-A16** · **DL-746**)  
14. A surface report to Coach without A17.5 parity attestation is a finding. Blank-future default x-window is a finding. (**AZ-VP-9-A17** · **DL-749**)  
15. Per-symbol code paths in surface work are findings. (**AZ-VP-9-A18.4** · **DL-752**)  
**Git:** `vp/seated-law-v0.6` · **DL-724**.  
**Law:** **CP-1** · **DL-707**  
**Token:** `VPS0-W0` STAMPED **DL-706** · VPS0 **CLOSED**

### Drive status

| Phase | State |
|-------|--------|
| **Step 1 download** | ES+MES **LIVE** StudioTwo. Backfill **newest-first** from yesterday; REST/flat-files **HOLD until 16:00 ET** (CP-1). Tranche 1 tonight after migration. |
| **Step 2 bins** | Session + developing **LIVE** StudioOne. **VPS2b** authorized (dev first) for Q6=(c) running totals. `kind=composite` publish still fenced. |
| **VPS3 mapping** | **Top data-end after VPS2b (DL-744).** Surface is source-space until `flags.mapping=OK`. `VPS3-W0` **not stamped**. ETA: build at stamp; S1 member-useful **tonight 16:05** if stamped today, else **2026-09-19 16:05**. |
| **Step 3 API** | Dev sidecar — APPS reads [`DEV-API.md`](DEV-API.md) (never scan ports). Contract **v1.1**. `/v1/health` coverage is the flip signal. |
| **SADEV*** | APPS-owned · `SA-DEV-W0` **STAMPED** **DL-723**. Cites authored v0.4 (**DL-731**); still NOT BUILD. |
| **Tonight** | VPS1-G carry → VPS2 ACT 3 (GO only) → VPSB ACT B → backfill tranche 1 |

### Do not

- SSH StudioOne / MiniTwo / DudeTwo **outside** a named CP-1 window.  
- Two writers on one store.  
- Stop `:3000` / `:4000`.  
- Publish `kind=composite` (backing store is VPS2b; route stays fenced).  
- Invent missing courier specs to force a sha1.  
- Drift Contract v1.0.
