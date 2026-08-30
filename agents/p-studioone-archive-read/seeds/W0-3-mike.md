# Seed W0-3 — Mike auth boundary

**Project:** p-studioone-archive-read  
**Agent:** Mike  
**Phase:** W0  
**Depends:** W0-2  
**Law:** SO-AR v0.8 + Amendment A1 · §6 · §7 session-only  
**Gate it feeds:** W0-G · W4

## Ask

**APPROVED** or **RETURNED**. BLOCKING vs ADVISORY.

1. Archive routes on StudioOne: Bearer required **once live**. No member cookie on StudioOne.  
2. Labs: send Bearer **when configured**. Absent config → **501** `ARCHIVE NOT CONFIGURED`, not 401.  
3. Malformed token/URL at Labs boot → abort (present-and-invalid).  
4. HTML dash `/` and existing `/api/status` stay LAN-open (collector UI).  
5. Member replay: **session only** — no tool entitlement (v0.8 §7). Admin stats/cadence: **administrator**.  
6. Token never in a browser bundle.

## Done when

Written verdict. No product code.
