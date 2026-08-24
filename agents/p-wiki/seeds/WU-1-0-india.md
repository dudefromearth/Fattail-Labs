# WU-1-0 — India discovery gate (chrome ruling B)

**Plan:** Wiki Spec v0.2.1 · **GO WU-1** · ruling **(B)** · **DL-555**  
**Isolation:** confirm Help mount; do not touch AppChrome.

## Discovery (filed)

| Item | Finding |
|------|---------|
| Host | `web/components/AppChrome.tsx` lines 16, 35–39 (`HelpLauncher`) |
| Root wrap | `web/app/layout.tsx` line 56 |
| Frozen | **Yes** (DL-539) |

**Coach ruling (B):** wiki-owned layouts only. Keep/evolve `WikiAgentPanel`. Standing-presence defect on frozen surfaces accepted until a later three-OK.

## Completion

This seed is a gate, not a code packet. Proceed to WU-1-1…6. STOP if AppChrome or root layout would be edited.
