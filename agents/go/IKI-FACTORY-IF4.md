# GO token — IKI Factory IF-4

**ID:** `IKI-FACTORY-IF4`  
**Board:** `agents/p-iki-factory/`  
**Spec:** Factory Spec v0.1.5 **BUILD AUTHORITY** (**DL-556**)

## Coach stamp

- [x] **GO IF-4**
- [x] **B5** — Factory Live record + Woo product + publication signal only (plan default). **No** Runner write. **No** Wiki envelope. Coach named **GO IF-4** 2026-08-24 without naming `web/lib/runner/**` or three OKs.
- [x] **GO IF-5** — granted 2026-08-24 · **DL-578**
- [ ] **Runner register** — not granted (would need three successive OKs on this token)

**Signed:** Coach  
**Date:** 2026-08-24

## Law

When Built-ready **and** product type / tier / free-vs-paid **and** not Hold → auto-Deploy:

1. Factory writes its own **Published** record first (lane `live`). Woo comes after.
2. Woo step is **stubbed** (`iki_factory_woo.woo_step`). Does not return success. Named reason on the Published card. Never pull back to Build.
3. Expose a **publication signal** (the Live / Published transition). Wiki polls later. Factory does not POST a Wiki envelope.

Admin product type / tier / free-vs-paid **is** the human promotion under invariant #7. Published is that gate’s result, not a bypass. Free Published templates are obtainable. Paid with no product attached are not. Missing product spec → stay in Build. Hold skips; clear Hold resumes.

**Never:** WC API interface · Wiki envelope · `contracts:deliver` · wiki git · Runner (`web/lib/runner/**`) · AppChrome · `gemba.md` rewrite · invented prices.
