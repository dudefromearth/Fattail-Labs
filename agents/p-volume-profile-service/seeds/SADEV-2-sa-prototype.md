# SADEV-2 — SA detection prototype

**Namespace:** `SADEV*` · **Owner:** GROK BUILD — APPS  
**Depends:** SADEV-1 (or local histograms). **INFRA:** do not execute.

## Intent

Prototype SA v0.3 detection (DRAFT §4) as a **computing consumer** of
VP contract histograms (`vp_client` → mock, then live). Never raw prints
as SoR. Never write the collector store. DEV-ONLY. Contract mismatch =
report, not a shim.
