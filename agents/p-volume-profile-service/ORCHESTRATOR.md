# Orchestrator — Volume Profile Service

**Instance:** **GROK BUILD — INFRA** (**DL-720**). StudioTwo build/board. StudioOne only in CP-1 windows. Never `git add -A`. Do not stop StudioTwo `:3000` / `:4000`.

**Does not execute:** `SADEV*` (APPS · ingest READ-ONLY). **Does not self-review specs** (ADVISOR).

**Contention:** collector wins on StudioTwo. Cross-instance conflict → **STOP, report to Coach**.

---

## Mission order — SINGULAR DRIVE (Coach 2026-09-17 · DL-727)

Everything not on this line is **parked** or **serves it**. Touched only when the drive is blocked or a CP-1 window is idle.

1. **DOWNLOAD** the data needed to create the bins
2. **CREATE** the bins
3. **CREATE** the API to get the bins

| Step | Maps onto | When |
|------|-----------|------|
| **1** | Tonight’s collector **migration PLUS backfill PROMOTED** | After 16:00 ET: VPSB ACT B (stop StudioTwo writer **before** StudioOne starts; prefer 17:00–18:00 CT halt), then vendor-floor backfill tranches: SPY equities floor · ES **2017-04** · MES **2019-05**. Disk-checked, resumable, integrity vs vendor manifests. **VPB-Q1** (historical mark source) evidence rides along — **does not block binning in source space**. |
| **2** | **VPS2** as tokened | Session + developing Engine; **composite fenced**. F3 golden = v0.6.1 (bins byte-identical across offset republish) **before** tonight’s install byte-match. Extend over backfilled history as tranches land. |
| **3** | **VPS4 pulled forward** | API **build** on StudioTwo **NOW** against frozen **Contract v1.0**. Install behind its gate once Engine goldens are green. Auth classes + 403 fixture F6 included. Any contract change = **v1.1 through Coach**, never silent drift. |

**Report cadence:** one screen per evening window — tranche progress, bins coverage (sessions binned per symbol), API status.

**Tonight (unchanged order):** VPS1-G SPY full-RTH check → VPS2 ACT 3 (**only on GO**) → VPSB ACT B migration → backfill tranche 1.

---

**Working spec (data end):** VP **v0.6.1** sha1 `7e3bbedc58e1cbadc2ce96bb820bf93059f8806d` (427) · **DL-730**. v0.6 remains on disk as baseline.  
**API contract (frozen):** [`Specs/VP-API-Contract-v1_0.md`](../../Specs/VP-API-Contract-v1_0.md) · 85 · sha1 `b403937af18140eb7900ccfa72437e7f3e9bc5aa` · parent = **v0.6.1 landed** · **DL-726** / **DL-730**.  
**App end:** SA **v0.3.1** sha1 `8298b572f10784c9e43848c93da50b6a630e3321` (367) · **DL-730**. `Specs/Structural-Analysis-Service-Spec-v0_4.md` is a **DIRECTIVE POINTER** (SA-L11) — **not BUILD** · **DL-728**.  
**AZ-VP-9-A1:** [`Specs/amendments/AZ-VP-9-A1.md`](../../Specs/amendments/AZ-VP-9-A1.md) sha1 `53bf74daa8a2b67ac3073d6fdb92bfed9b297ab0` (41) · **MATCH**.  
**Git:** `vp/seated-law-v0.6` · **DL-724**.  
**Law:** **CP-1** · **DL-707**  
**Token:** `VPS0-W0` STAMPED **DL-706** · VPS0 **CLOSED**

### Drive status

| Phase | State |
|-------|--------|
| **Step 1 download** | ES+MES **LIVE** on StudioTwo (`ai.fattail.labs.vp-futures`). SPY ingest **installed** on StudioOne (VPS1-G mechanics). Migration + backfill **tonight**. Gap defect **fix today** before migration. |
| **Step 2 bins** | VPS2 Engine goldens on StudioTwo (F1/F2/F3-corrected/F5/F7). Composite **fenced**. StudioOne install **tonight iff VPS1-G full-RTH GO**. |
| **Step 3 API** | Contract **frozen**. Build starts StudioTwo against v1.0; **install gated** on Engine goldens. |
| **SADEV*** | APPS-owned · `SA-DEV-W0` **STAMPED** **DL-723**. Does not build against the v0.4 pointer. |
| **Tonight** | VPS1-G carry → VPS2 ACT 3 (GO only) → VPSB ACT B → backfill tranche 1 |

### Do not

- SSH StudioOne / MiniTwo / DudeTwo **outside** a named CP-1 window.  
- Two writers on one store.  
- Stop `:3000` / `:4000`.  
- Publish composite.  
- Invent missing courier specs to force a sha1.  
- Drift Contract v1.0.
