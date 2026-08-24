# SC-1-2 — Characterization (Kilo)

**Plan:** GO SC-1 · feeds SC-1-G

## Proves

- Unknown `source_kind` → 400 + ledger `rejected` + `unknown_source_kind`. No watermark.
- Incomplete required set → `failed-partial` + reason listing missing fields. No invented title/body. No watermark.
- Valid envelope → `accepted` + `contract_id` + watermark round-trip. GET queryable.
- `acquired_by=skill` accepted; unknown `acquired_by` rejected.
- Watermark table has no `body` / `body_md`.
- `kind=session` without `source_kind` still `validated`.

House box: tolerated 8 (OPF + Curate) only.
