# PPL3-2 — 422/409 identity scope (Mike)

**Date:** 2026-09-14 · StudioTwo  
**Review of:** PPL3-0 close gates + DELETE 409

## Holds

- Gates and 409 run **after** `require_session` and `_storage_identity_id`. Book load is identity-scoped (`_load_member_book(cur, iid)`).
- Cross-member DELETE of a paired open is **404**, not 409 — does not leak the blocking close id. Test: `test_ppl3_409_does_not_leak_other_identity`.
- Overrides are **per-request JSON** (`allow_orphan_close` etc.). No cookie, no ambient config.
- Family B: no cross-identity pairing. Member B’s orphan close does not see Member A’s opens.

## Does not

New auth plane. Soft-trash schema. Declarations (PPL4).
