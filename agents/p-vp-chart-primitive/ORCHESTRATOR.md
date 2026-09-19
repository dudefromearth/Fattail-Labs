# AZ-VP-9-A23 — VP Chart Primitive Migration

**Spec:** `Specs/AZ-VP-9-A23.md` **BUILD AUTHORITY**  
**Source sha1:** `3880bb2b7aba10586188a409515a07b751f44cbd` (verified 2026-09-19)  
**Token:** DL-764  
**Machine:** StudioTwo only. Do not stop :3000/:4000. No MiniTwo.

Coach stamp: zOrder `"top"`; overlay flag W1-G→W3 only, then demolished.

| Gate | Packet | Agent | Status |
|------|--------|-------|--------|
| W1-G | Attach primitive; overlay behind flag | Charlie | **PASS** (GO) |
| W2-G | Lifecycle hygiene | Charlie | **PASS** (GO) |
| W3-G | Demolition | Charlie | **PASS** (GO) |
| W4-G | Verify + DL/arch/India | Charlie + Kilo · Lima · India | **PASS (GO)** · **DL-765** · Arch 35 · India MATCH (line-count deviation recorded) |

Grok Build orchestrates. Implementers execute. Auto-GO on clean gates. Stop + GO/NO-GO on a problem.

**Open (outside A23, do not chase):** `GET /api/app/vp/v1/structure/SPX?kind=developing&include_bins=true` returned **500** on StudioTwo during A23 diagnose (2026-09-19). `/api/me/sa-surface` was **400** for `identity_id=0` (dev-login, no identity row) — not the same bug. Neither blocks the primitive pass.
