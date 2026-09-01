# P0-G — India

**Agent:** India  
**HEAD at start:** `59295ac`  
**Date:** 2026-09-01  
**Law:** spec v0.2.2 + plan as folded at `374ed86` · P0 docs only  
**Authorized:** P0 only

**Verdict:** **PASS**

---

## Check

| Requirement | Result |
|-------------|--------|
| Docs match the tree | **Yes.** Arch 30 §17c + inline as-built notes. Original design claims remain (Coach Content Law). |
| Thirteen honesty items landed, each with file and line | **Yes.** §17c table items **1–13**. Also inlined at §3, §4, §6.1, §9, §10, §11, §12, §14, §17b. |
| Missing cites named, not invented | **Yes.** §17c last paragraph: `docs/OPF-REFERENCE-v1_1.md` absent; L4-A v0.4 absent (v0.1 exists). B4 report-only. W0-1 substitution in force. |
| Canonical hyphenated paths are law | **Yes.** Plan: `docs/OPF-Generation-Plane-Spec-v0.2.2-Full-Agent-Bench-Plan-v1.1.md` (sha1 `8ae7f22`). Spec hyphenated. |
| Spaces-named plan cannot be read as the plan | **Yes.** Body replaced with a pointer to the hyphenated path and `374ed86`. File not deleted. Spec/errata duplicates were byte-identical; left as-is. |
| GP18a and GP21 errata where a builder will hit them | **Yes.** §17c items **11** and **12**. DL-647 restates both. |
| DL-647 same day, newest at top | **Yes.** `Architecture/00-decision-log.md` immediately after the intro, before DL-646. Dated 2026-09-01. |
| No `server/` or `web/` diff | **Yes.** (India: confirm in the commit.) |
| `infra/deploy.md` untouched | **Yes.** |
| Five Python modules untouched | **Yes.** DL-539 1/3 still binds them. |

### Item map (Arch 30)

| # | Where a builder hits it |
|---|-------------------------|
| 1 | §10 note + §17c.1 — `store.py:41–44` |
| 2 | §3 + §11 notes + §17c.2 — `pricing.py:28` |
| 3 | §4 note + §17c.3 — GXA0 / OD-GP3 evidence |
| 4 | §6.1 note + §17c.4 — `chain_ladder.py:308–309` |
| 5 | §12 note + §17c.5 — `generation.py:53–60` |
| 6 | §17b Archive row + §17c.6 |
| 7 | §17b L4 row + §17c.7 — `pricing.py:27, 95–115` |
| 8 | §17b Dual keys row + §17c.8 — `chain_feed.py:23–27, 45–48` |
| 9 | §14 note + §17c.9 — `opfPricingApi.ts:216–218` |
| 10 | §9 note + §17c.10 — `interest.py:31–36, 102–113` |
| 11 | §17c.11 + DL-647 — GP18a scoped to listed-token / `keys.py`; `generation.py` is P2-1 |
| 12 | §17c.12 + DL-647 — GP21 wings-only |
| 13 | §17b Dual keys + §17c.13 — `chain_feed.py:59–62` recorded, not fixed |

## What this PASS unblocks / does not

P0-G PASS unblocks **P1a in the DAG only**. It does **not** start P1a (separate GO). **P2-0 stays blocked:** DL-539 is 1/3; the five modules stay frozen. No product code in P0.
