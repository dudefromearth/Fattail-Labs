# W4-1 — Alpha OPF session envelope

**Agent:** Alpha  
**Depends on:** **W1-G + W2-G + W3-G** (W3-0 already GO · DL-397)  
**Plan phase:** W4  
**Status:** Ready to expand/fire when the third of those gates passes.  
**HOW law:** India W3-1 H1–H4 · **DL-398** OD-SESS Accepts

## Intent (locked)

Every ladder, package-quote, and resolve **carries or cites** `opf_session`.

Facts: `market` · `printing` · `print_quality` · `as_of` · `generation_as_of`.

## OD-SESS Accepts (do not relitigate)

| ID | Honor |
|----|--------|
| **OD-SESS-1 / H2** | `print_quality` + `generation_as_of` on **every** mark-bearing payload. Cite-by-hash only for `market` / `printing` after snapshot. No second WS. Keep `mark_mode` / `mark_source`. |
| **OD-SESS-2 / H1** | `mb:session:market_status` remains Massive L0 (`sym_feed`). OPF **computes** `opf_session`. Do not overwrite that key. Do not call Massive from the envelope writer. Redis-only L0 read; missing session doc → named incomplete, not a clock. |
| **OD-SESS-3** | Product table / profile for open→extended (index 16:15 vs equity 16:00). OPF states it. Not a client constant. Not τ. |
| **OD-SESS-4** | Do **not** delete `/session-status` in W4. Labeled shim until W5. |
| **H3** | `print_quality=live` forbidden after that contract’s OPF29 expiry instant, even if Massive is still printing extended. |
| **H4** | Session `last_print` ≠ Law C Held/residual. Do not collapse them. |

## Files likely in scope (expand on fire)

- `server/` package-quote, resolve, chain ladder assemble
- OPF session compute next to existing mark_mode
- Types shared with the client (envelope only — no Analyzer chrome)
- Characterization: CL-11, CL-13, CL-21 (W2 list)

## Forbidden

Client Massive. Second WebSocket. Changing OPF29. Deleting mark_mode. Deleting `/session-status`. Chrome (W5). Merge-all-visible (NX9). Clock as SoR in the writer.

## Done when

Ladder, package-quote, and resolve each carry or cite `opf_session` per H2. AT-SESS-1 fixture exists or is handed to W8. India dual-truth check if a new route appears (Mike auth if new).
