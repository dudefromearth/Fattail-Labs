# Charter — p-options-lab-trade-log-promotion

**Program:** Options Lab Analyzer — Trade Log Promotion Dialog
**Spec:** `Specs/FatTail-Labs-Options-Lab-Analyzer-Trade-Log-Confirmation-Spec-v1_0.md`
**Plan:** `docs/Options-Lab-Analyzer-Trade-Log-Confirmation-Full-Agent-Bench-Plan-v1.0.md`

Coach's intent (Phase 0, verbatim): "there is no control over how that trade
gets input into the log... a dialog should appear allowing you to choose
whether to send the position as opened or closed, and to also choose account
and campaign."

Give the member explicit control (account, campaign, open-vs-open+close) over
how a Position Card promotes to the Trade Log, replacing today's silent
one-click POST. Continues PC9b's promotion mapper (`p-options-lab-position-control`,
PCZ-closed 2026-09-11); does not reopen that program's other closed packets.

**Out:** broker OMS · Trade Log's own UI (`TradeSheet.tsx`) · cross-dialog
locking with the Builder/edit dialog (FI-5, flagged) · live-quote-derived
exit prices (FI-6, deferred).

**Governance:** `AnalyzerPositionsList.tsx`/`OpfRiskAnalyzer.tsx` are named
"does not touch" in DL-700, DL-702, DL-703 (no active tree covers them).
Coach, verbatim: *"Fuck DL-539 and my word overrides it and every other
directive you created without my approval."* This project exists under that
explicit override.

**Status:** GO — Coach override of DL-539, 2026-09-21.
