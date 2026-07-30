# P-Member-Export Orchestrator

**Mission:** Canonical Practice export formats (Journal, Retrospective, Journey) +
member “Download my data” pack.

**Spec:** [`Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md`](../../Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md)

**Program status:** **SHIPPED (two-way)** — Spec v1.1 + export/import + Profile UI

| Phase | Status |
|-------|--------|
| Spec v1.0 export | **done** |
| Spec v1.1 two-way | **done** |
| API export + import | **done** |
| Tests | **done** (`test_member_export.py` incl. round-trip) |
| Profile Download + Load | **done** |
| Formal Delta gate | optional follow-up |

## Surfaces

| Format | Path |
|--------|------|
| Pack export | `GET /api/me/export?format=zip\|json` |
| Pack import | `POST /api/me/import/detect\|preview\|commit` (additive only) |
| Purge Practice | `POST /api/me/practice-data/purge` (keep membership) |
| Demo pack | `server/seed_practice_demo_pack.py` · see [`DEMO.md`](./DEMO.md) |
| Journal | `GET /api/me/export/journal` |
| Retrospective | `GET /api/me/export/retrospectives` |
| Journey | `GET /api/me/export/journey` |
| Trade Log | existing `/api/me/trade-log/export` + import |
