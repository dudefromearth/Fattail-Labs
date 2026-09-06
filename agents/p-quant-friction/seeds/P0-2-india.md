# Seed P0-2 — India — docs match the tree

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** India · **Phase:** P0 · **Feeds gate:** P0-G
**Read first:** `agents/bench/india.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Check
DL-679 present and consistent with DL-678; `AGENTS.md` line truthful; ADMIN-GUIDE names nothing that does not yet exist as if it existed (controls are "specified", not "available", until P3-G); no product code moved (`git diff --stat 9a9cf1f -- server web` empty).

## Verdict
PASS / RETURN in `agents/p-quant-friction/evidence/P0-2-india.md`.
