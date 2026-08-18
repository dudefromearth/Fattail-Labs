# W0-6 Lima — Decision log filed

**Project:** SSR Collector Hardening  
**Agent:** Lima  
**Date:** 2026-08-18  
**Parents:** [`W0-6-lima-cadence-math.md`](./W0-6-lima-cadence-math.md) · [`W0-G.md`](./W0-G.md)

**Did not:** implement collector features · restart StudioOne · change
`LABS_SSR_CHAIN_EVERY_S` or `LABS_SSR_HARDENING` · rewrite Friday
**2026-08-14** · edit Spec **§0**.

---

## Verdict

| Stamp | Value |
|-------|--------|
| **Path** | **GO** |
| **DLs** | **DL-432** · **DL-433** |
| **Spec §0** | **untouched** |

---

## Filed

| ID | Title | What it records |
|----|--------|-----------------|
| **DL-432** | Gold tap cadence remains 2s pending Coach pick | Band **2–5s**. Live **2s**. W0-6: RTH 18 names @ 2s ≈ **4.06 GB/day** uncompressed. Tap is a Redis reader — tap cadence ≠ Massive; **`chain_feed` interval** is the quota lever. Env **not** changed. |
| **DL-433** | SSR Collector Hardening Spec v1.0 **BUILD AUTHORITY** | Coach auto-GO 2026-08-18 · W0-G PASS. Flag `LABS_SSR_HARDENING` default **0**. Cut over **between phases** only. Alert channel **OPEN**. Friday **2026-08-14** not rewritten. |

Spec Status line stamped **BUILD AUTHORITY** (header only). Phase 0
packet in §0 is the same Coach words as the W0-G checksum.

Board: W0-G **PASS GO**. **P1 unblocked** for code behind flag=0.
**No mid-gth kickstart.**

---

**GO** — DLs on the log. Lima → Juliet / Alpha (P1).
