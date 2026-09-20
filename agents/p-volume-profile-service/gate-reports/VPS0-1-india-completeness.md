# VPS0-1 — India completeness pre-flight

**Date:** 2026-09-16 · StudioTwo  
**Agent:** India (executed in-packet; no product edits)

## Command evidence

```
wc -l / shasum -a 1 / grep -c '^## ' / head -1 / last ^##
```

| File | Lines | sha1 | headings | last heading | vs expected |
|------|------:|------|---------:|--------------|-------------|
| `Specs/Volume-Profile-Service-Spec-v0_5.md` | 358 | `a487a702dff7de45f3a0d4ba0ca09199bd2586dd` | 16 | `## 14. Round log` | **MATCH** |
| `Specs/Volume-Profile-Service-Spec-v0_4.md` | 245 | `9b4a56e0dceaa2a4a1f25430dc8cf6356b4b5cd8` | 16 | `## 14. Round log` | **MATCH** |

HEAD line 1: `# Volume Profile Service — Spec v0.5` / `v0.4` respectively.

**Verdict:** COMPLETE. Truncated spaces file is CORRUPT (Lima / DL-705), not this restore.

Isolation: Histogram dual-store and SVP not cited as this spec. VP-L1…L17 present in v0.5 §9. Analysis parked §12. Stage A = SPY→XSP.
