# VP Profile API — Contract v1.1

**Status:** FROZEN interface contract. **Supersedes:**
VP-API-Contract-v1_0.md (sha1 b403937af18140eb7900ccfa72437e7f3e9bc5aa).
**Date:** 2026-09-17
**Change (sole):** coverage is now expressible — v1.0 could not honestly
represent an archive with a moving backfill floor. Everything else in
v1.0 carries forward byte-for-byte in meaning; clients built to v1.0
remain valid except where they call /range below coverage.

## Added: coverage block

Every /profile and /range payload gains:

```json
"coverage": { "floor_session": "2026-09-17",
              "ceiling_session": "2026-09-17" }
```

`floor_session` = oldest session in the solid contiguous archive
interval for the requested source; `ceiling_session` = newest. Backfill
is strictly newest-first, so coverage is always one solid interval —
a hole is a service defect, never a payload state.

/v1/health gains, per source:

```json
"coverage": { "floor_session": "...", "ceiling_session": "...",
              "sessions_binned": 1 }
```

## Added: /range below-coverage law

Default: a /range with `from` earlier than `floor_session` is REFUSED —
**422** body:

```json
{ "error": "range_below_coverage", "coverage_floor": "2026-09-17" }
```

Opt-in partial: `allow_partial=true` on the request → **200**, summed
over the covered slice only, with the truncation explicit:

```json
"coverage": { "requested_from": "2026-01-01", "served_from":
  "2026-09-17", "served_to": "2026-09-17", "truncated": true }
```

A consumer that sets allow_partial owns rendering the truncation
(SA surfaces carry the coverage floor on their provenance line). A 200
without `truncated: true` is a complete sum. Silent partials remain
forbidden in every mode.

## Unchanged from v1.0

Endpoints, params, envelope, source-space law, dual-source XSP rule,
error set (422 gains the body above), 403 deny, mock fidelity — the
mock adds one below-coverage case (422) and one allow_partial case
(truncated: true).
