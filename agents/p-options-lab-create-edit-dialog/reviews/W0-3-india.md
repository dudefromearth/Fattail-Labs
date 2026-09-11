# W0-3 — India · Specs integrity

**Date:** 2026-09-11
**Verdict:** **APPROVED**
**Spec:** `Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_4.md`
**Plan:** `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`

## Content check

`head -1` reads `Spec v0.4`. Counts: `DLG-VOCAB-3` 1 · `AT-DLG-15` 2 ·
`Do not build Preview, Entry time, or Submit` 1 · `The Done link` 2. Non-zero.

Plan AT-DLG-1…15 all present in the Spec. `DLG-VOCAB-1` and `DLG-VOCAB-3` present
(`DLG-VOCAB-2` present in Spec §2). Frozen Position Control Spec v1.2 unedited.

## Isolation

- `Specs/` holds the versioned contract (v0.4) and prior baseline (v0.3). The
  plan lives in `docs/`. No review/disposition artifact in `Specs/` for this program.
- No MSC. No IKI fork. DL-539 freeze not lifted for other trees.
- Parent OPF / HI / North-star / Position Control v1.2 paths intact.

## § Bench delta

W0 content-check commands and the AT-DLG pack are now grep-complete against disk.
Next India invocation does not re-derive the live file.

## § Flagged ideas

Inventory intact. PC-VOCAB-1 supersession is logged (DL-690), not executed as a
v1.2 edit — carry to v1.3.
