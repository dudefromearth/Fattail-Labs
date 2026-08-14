# CL-0-2 — India contract sign

**Date:** 2026-08-13  
**Agent:** India  
**Verdict:** **APPROVED**

Signed against plan v1.1 + spec v0.1 BUILD (DL-327):

- Component contract (`incoming|outgoing`, host strings, no store, optional `appearance` / `startedAt` / `sendKey`)
- Schema `coach_lab_*` with `started_by` and per-message `model` + `effort`
- P1 server-held SoR (`POST /chat` body `{ text }` only)
- **B-CL1** `POST /greet` — idempotent; greeting stamped like any coach turn
- Husk-reset — zero trader turns discarded, not archived
- P5 / H4 — no member Journal / member Retro / member production path reads `coach_lab_*`

This GO is **not** a Journal remount. Retrospective may later mount `ConversationSurface` without modifying the component (reuse note reserved for CL-G-3).
