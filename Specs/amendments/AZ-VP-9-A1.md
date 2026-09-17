# Amendment AZ-VP-9-A1 — Analyzer Spec v0.2, law AZ-VP-9

**Date:** 2026-09-17
**Authority:** Coach — Q10 = (b) (DL-714) and Coach Decision 1, verbatim:
"Raw bins stay on StudioOne the collector, bins are available through an
API."
**Applies to:** FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md, law
AZ-VP-9 (§0.3.2 / §1.16.2).

## Original law (superseded in part)

> "Volume Profile = bins only — no candlesticks on the VP surface." ·
> "Member-facing surface = volume profile bins (volume-by-price
> histogram). No candlesticks on the VP viewport."

## Amended law (AZ-VP-9 as amended)

The member-facing volume profile surface at /app/options-lab/
volume-profile renders **Structural Analysis Service objects** over the
price axis, per Structural-Analysis-Service-Spec §8. Raw
volume-by-price bins are **internal**: they live on the data end and
are available only through the Volume Profile Service API to entitled
computing consumers (VP-L18), and no member surface renders them. The
"no candlesticks" clause of the original law is unchanged and carries
forward.

## Route fate (interim)

/app/options-lab/volume-profile remains the product's home. Its canvas
is replaced by the SA surface at SA Phase-1 ship. Until then, the
existing client-binned canvas persists strictly as a residual estimator
(VP-L8) — it never consumes Volume Profile Service bins — and it dies
under the VP §2 kill rule when the SA surface lands and consumer
cutover completes.

## Standing

This record is the citable law for AZ-VP-9 until the Analyzer spec's
next revision folds it into the parent text, at which point that
revision's change table cites this file. Any surface work citing
AZ-VP-9 without this amendment is citing superseded law.
