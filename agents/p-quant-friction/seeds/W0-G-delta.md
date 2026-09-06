# Seed W0-G — Delta — W0 gate

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Delta · **Phase:** W0 · **Feeds gate:** P0
**Read first:** `agents/bench/delta.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Verdict rule
PASS only if: token W0-0 stamped by Coach (not chat); dispositions OD-12/13/14, O1, O6, B1 ticked; seven review reports exist with verdicts on the token; **no file under `server/` or `web/` changed since `9a9cf1f`** (`git diff --stat 9a9cf1f -- server web` empty, ▶ RUN ON: MacBook); spec sha1 at stamp equals sha1 at land.
BLOCKED if any review is missing. FAIL if product code moved.

## Report
`agents/p-quant-friction/gate-reports/W0-G.md` with the commands and their output.
