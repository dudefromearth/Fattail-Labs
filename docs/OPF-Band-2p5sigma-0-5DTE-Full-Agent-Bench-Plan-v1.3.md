# OPF — Full book, SPX and XSP, 0–5 DTE — Full Agent Bench Plan v1.3

**Status:** ACCEPTED 2026-09-28. One addition to Foxtrot's W4 gate. W4 stays clock-gated. This file does not load launchd.  
**Supersedes:** `docs/OPF-Band-2p5sigma-0-5DTE-Full-Agent-Bench-Plan-v1.2.md` (bytes unchanged).  
**Spec:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_3.md` is the law and is not edited. Its plan pointer still names v1.2. This file is the plan Foxtrot reads for the W4 load.  
Date: 2026-09-28.  
Machine: StudioOne, `~/Fattail-Labs-mexp2`. **CP-1.** The running collector is not modified.

**Coach, 2026-09-28, verbatim.** Add to Foxtrot's W4 gate, before any parallel launchd load: `ssr_fullbook.py` and its tests are present in `~/Fattail-Labs-mexp2` on StudioOne at the commit W1-G reviewed, the tests pass there in that tree's venv, and the fullbook_capture plist's script and working directory name that tree. Two trees is how Friday nearly lost a session; W4-G states which tree runs Tuesday's capture.

---

## What changed from v1.2

| | v1.2 | v1.3 |
|---|---|---|
| W4, before any parallel launchd load | Clock line only | The three checks below, and W4-G names the tree |

Everything else in v1.2 stands: the ceiling, the 1,198-contract book, the disk figures 7.43 GB and 14.52 GB, the keys, `ssr/fullbook_capture`, CP-1, the pids, W5–W7.

---

## W4 gate, before any parallel launchd load

Tuesday's fullbook capture runs from StudioOne `~/Fattail-Labs-mexp2`. W4-G states that sentence, with the evidence below. A load that cannot state it does not load.

1. `server/market_data/ssr_fullbook.py` and `server/tests/test_ssr_fullbook.py` are present in `~/Fattail-Labs-mexp2` at the commit W1-G reviewed.
2. `pytest tests/test_ssr_fullbook.py` passes in that tree's venv.
3. The fullbook_capture plist's script and working directory both name `~/Fattail-Labs-mexp2`.

W1-G (2026-09-28) passed those tests on StudioTwo `~/Fattail-Labs`. The two files were untracked. HEAD `46a555f6` does not contain them. Until a commit contains the bytes that gate passed, and that commit is what `~/Fattail-Labs-mexp2` has checked out, W4 does not load the plist.

Live pid 73887 is not killed. Feed pid 73931 is not restarted. Band pid 74138 stays on `ssr/band_capture`.
