# P-Autofilter Orchestrator

**Active slice:** Trade Log only.  
Juliet runs this board. Specialists via seeds. Delta ternary gates.

**Plan:** [`docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1.0.md)  
**Spec:** [`Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md`](../../Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md) · GO SPEC **DL-584**  
**Parked:** Autofilter Spec v0.2 / plan v1.1 (journal, records). Not the next GO.

```text
TLAF0 → TLAF1 extract → TLAF2 Trade Log cut (one commit, FIRST DEPLOY) → TLAF3 Help → TLAF4 close
```

| Phase | State |
|-------|--------|
| **TLAF0** reviews · O1 report · GO SPEC | **TLAF0-G PASS** · **GO SPEC DL-584** |
| **TLAF1** shared component (internal) | **TLAF1-G PASS** — not a deploy |
| **TLAF2** title bar + removals (**first deploy**) | **TLAF2-G PASS** — stopped |
| **TLAF3** Help | after Coach GO TLAF3 |
| **TLAF4** close | after TLAF3-G |

| Seed | Agent | Status |
|------|-------|--------|
| TLAF0-1-india | India | **done** `reviews/TLAF0-1-india.md` |
| TLAF0-2-echo-tango | Echo, Tango | **done** `reviews/TLAF0-2-echo-tango.md` |
| TLAF0-3-hotel | Hotel | **done** `reviews/TLAF0-3-hotel.md` |
| TLAF0-4-kilo | Kilo | **done** `reviews/TLAF0-4-kilo.md` |
| TLAF0-G | Delta | **PASS** `gate-reports/TLAF0-G.md` |
| TLAF1-1-charlie | Charlie | **done** extract + Find and Badge consumer |
| TLAF1-2-kilo | Kilo | **done** `apply.test.ts` |
| TLAF1-G | Delta | **PASS** `gate-reports/TLAF1-G.md` |
| TLAF2-1-charlie | Charlie | **done** title bar + one stream + removals |
| TLAF2-2-echo | Echo | **done** `reviews/TLAF2-2-echo.md` |
| TLAF2-3-kilo | Kilo | **done** `reviews/TLAF2-3-kilo.md` |
| TLAF2-G | Delta | **PASS** `gate-reports/TLAF2-G.md` |
| TLAF3+ | — | not fired |

**Do not:** fire TLAF3/TLAF4 from chat · journal/records · delete Practice date chrome globally · restore `blotter-campaign-filter` beside Autofilter · rewrite Find and Badge · remove playbook select.
