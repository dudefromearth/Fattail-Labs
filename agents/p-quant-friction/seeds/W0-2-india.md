# Seed W0-2 — India — boundary and isolation

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** India · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/india.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Review questions (answer each with a file:line citation)
1. Does §3.7.1 keep **ATRV serving and QLAB governing** — controls bind the runner (QLAB §4.5), the 64-cell ceiling counts control cells (§4.2), and nothing in the design registers a strategy or precomputes a structure?
2. Is O1's grid endpoint **serving, not governing**? If a page can read grids it cannot set, is anything about authority changed? State yes/no and why.
3. Plan §4 isolation: is every file in-program either created under DL-677 or one of the four named exceptions? Is anything needed that is not listed? Is anything listed that is not needed?
4. Does the design introduce a second source of truth anywhere — a fit artifact, a controls table, a cached complex quote?
5. B1: is the reassignment-DL path sufficient under DL-539, or does this board need the three-OK log regardless?

## Verdict
PASS / RETURN with findings in `agents/p-quant-friction/evidence/W0-2-india.md`; line on the token.
