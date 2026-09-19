# VP Profile API — Contract v1.0

**Status:** FROZEN interface contract. Extracted from
Volume-Profile-Service-Spec-v0_6_1.md (§7, §8) — that spec remains the
law; this file is the build-against artifact for both tracks. Any
change = Contract v1.1 with a Supersedes note; neither track may drift
from it silently.
**Date:** 2026-09-17
**Server (production):** StudioOne. **Dev instance:** StudioTwo (APPS,
read-only over the local store). **Clients:** computing consumers only
(SA service, Strategy Lab, ops). Member-class tokens: 403, always.

## Endpoints

```
GET /v1/profile/{target_symbol}/{kind}
    kind ∈ session | developing            (composite: fenced, later)
    query: session_date=YYYY-MM-DD | as_of=<UTC ns>, row=<override>
GET /v1/profile/{target_symbol}/range
    query: from=YYYY-MM-DD, to=YYYY-MM-DD,
           price_lo=<num>, price_hi=<num>, row=<override>
GET /v1/health
```

target_symbol ∈ SPX | XSP. XSP is dual-source (SPY and MES): pass
`source=SPY|MES` on XSP requests; omitted → both sources returned as
separate payload entries in one envelope, never merged.

## Response envelope (profile + range)

```json
{
  "target_symbol": "SPX",
  "source": "ES",
  "kind": "session",
  "session_date": "2026-09-17",
  "as_of": 1789660800000000000,
  "computed_at": 1789660815000000000,
  "profile_generation_id": "g-01J8...",
  "parameter_set_hash": "sha256:...",
  "status": "COMPLETE",
  "flags": { "mapping": "OK", "approximation": "none" },
  "gaps": [ { "from_ns": 0, "to_ns": 0, "cause": "DISCONNECT" } ],
  "mapping": {
    "ratio": 1, "offset_published": 2.48, "offset_fit": 2.51,
    "fit_as_of": 1789660810000000000, "residual_rmse": 0.04,
    "sample_count": 213, "mark_source": "chainstore"
  },
  "vp_row": 0.25,
  "bins": [ { "price": 6558.00, "volume": 100 },
            { "price": 6558.25, "volume": 0 } ]
}
```

Rules the shape encodes (normative, from the spec): bins are
**source-space** integers on the vp_row grid, ascending, zero rows
present across the traded span, never rewritten by mapping activity;
consumers apply `ratio` and `offset_published` themselves; `status` ∈
UNAVAILABLE|GAPPED|COMPLETE; `flags.mapping` ∈ OK|STALE|FAILED and
never blocks bins; new `profile_generation_id` ⇔ payload changed;
`/range` returns the summed eligible histogram for the slice (futures
ranges in target space per roll-coherence), gaps from all covered
sessions listed.

## Errors

401 unauthenticated · **403 member-class token on any /v1/profile\***
(body: `{"error":"computing_consumers_only"}`) · 404 unknown
target/kind · 422 bad range/params · 503 UNAVAILABLE with status body.

## /v1/health

```json
{ "collectors": { "SPY": {"live": true, "last_print_ns": 0},
                  "ES": {...}, "MES": {...} },
  "gap_report": [...], "mapping_fit": {...}, "backup_watch": "OK" }
```

## Mock fidelity requirement

The APPS mock serves byte-shaped instances of this envelope built
from spec fixtures F1, F2, F5, F8 (numbers in VP v0.6.1 §10),
including one GAPPED and one mapping-STALE example. A client that
works against the mock works against the service, or the contract
gets the version bump — not the client a workaround.
