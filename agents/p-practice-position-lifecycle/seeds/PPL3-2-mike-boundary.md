# PPL3-2 — 422/409 identity scope

**Project:** Practice Position Lifecycle  
**Agent:** Mike  
**Depends:** PPL3-0  
**Feeds:** PPL3-G

## Intent

Review, do not invent a new auth plane.

- 422/409 still identity-scoped. Cross-member 404 stays 404 (do not leak existence via 409).
- Overrides are per-request payload, never ambient.
- Family B: no cross-identity.

## Files in scope

Review of PPL3-0 diff. Optional test for isolation on 409.

## Out of scope

SSO. Soft-trash schema. Declarations (PPL4).

## Done when

Written note in gate-reports: isolation holds; 409 does not leak other identities.
