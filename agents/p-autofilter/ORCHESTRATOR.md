# P-Autofilter Orchestrator

**Active slice:** Trade Log only — **CLOSED**.  
Juliet runs this board. Specialists via seeds. Delta ternary gates.

**Plan:** [`docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`](../../docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md)  
**Spec:** [`Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`](../../Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md) **BUILD AUTHORITY** · **DL-584** · **DL-586**  
**Parked:** Autofilter Spec v0.2 / plan v1.1 (journal, records, five remaining deferred columns). Not the next GO.

**Next slice:** Strategy column **GO SPEC DL-587** · **O1/O2 DL-588** · **TLAS1-G PASS** · **TLAS2-G PASS** — TLAS3 not fired  
[`Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md`](../../Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md) · plan [`docs/Trade-Log-Autofilter-Strategy-Column-Full-Agent-Bench-Plan-v1_0.md`](../../docs/Trade-Log-Autofilter-Strategy-Column-Full-Agent-Bench-Plan-v1_0.md)

```text
TLAF0 → TLAF1 extract → TLAF2 Trade Log cut (first deploy) → TLAF3 Help → TLAF4 close
```

| Phase | State |
|-------|--------|
| **TLAF0** reviews · O1 report · GO SPEC | **TLAF0-G PASS** · **GO SPEC DL-584** |
| **TLAF1** shared component (internal) | **TLAF1-G PASS** |
| **TLAF2** title bar + removals (**first deploy**) | **TLAF2-G PASS** |
| **TLAF3** Help | **TLAF3-G PASS** |
| **TLAF4** close | **TLAF4-G PASS** — **closed** |

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
| TLAF3-1-lima | Lima | **done** `help_reference/trade-log-autofilter.md` + app-areas |
| TLAF3-2-kilo | Kilo | **done** `reviews/TLAF3-2-kilo.md` |
| TLAF3-G | Delta | **PASS** `gate-reports/TLAF3-G.md` |
| TLAF4-1-lima | Lima | **done** spec v0.1.1 · DL-586 · Arch 15 §5.4 |
| TLAF4-G | Delta | **PASS** `gate-reports/TLAF4-G.md` |
| TLAS0 | — | skipped by GO SPEC (Coach) |
| TLAS0-5-lima | Lima | **done** **DL-587** |
| TLAS1-1-charlie | Charlie | **done** Strategy `ColumnDef` after Campaign |
| TLAS1-2-kilo | Kilo | **done** `reviews/TLAS1-2-kilo.md` |
| TLAS1-G | Delta | **PASS** `gate-reports/TLAS1-G.md` |
| TLAS2-1-lima | Lima | **done** help + Arch 15 §5.4 |
| TLAS2-2-kilo | Kilo | **done** `reviews/TLAS2-2-kilo.md` |
| TLAS2-G | Delta | **PASS** `gate-reports/TLAS2-G.md` |
| TLAS3+ | — | not fired |

**Do not:** fire TLAS1 from chat · unpark journal/records · add Account/Expiry/Right/Entry source/Adherence in this slice · rewrite Find and Badge · restore `blotter-campaign-filter`.
