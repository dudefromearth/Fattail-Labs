# Seed P0-1 — Lima — DL-679, AGENTS.md line, ADMIN-GUIDE stub

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Lima · **Phase:** P0 · **Feeds gate:** P0-G
**Read first:** `agents/bench/lima.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Task (docs only — no product code)
1. Land DL-679 from the W0-1 draft in `Architecture/00-decision-log.md` (same day as W0-G).
2. B1 per Coach's tick: edit the `AGENTS.md` active-program line to name Quant Lab active alongside LIM (LIM untouched; DL-539 freeze unchanged) — **this line only** — or confirm the three-OK log is full on the token.
3. `docs/ADMIN-GUIDE.md` quant section: the six controls and grids; `LABS_QUANT_FILL_FIT_PATH` (optional; set-but-bad aborts boot); what `unfitted_pessimistic` means to an operator; that fill history never enters the repo.
4. Note on the token that AT-ATRV-36's touch semantics are superseded when P1-G passes (recorded in ATRV v0.11 at W-G).

## Files
`Architecture/00-decision-log.md` · `AGENTS.md` (one line) · `docs/ADMIN-GUIDE.md`. Nothing else.

## Done when
Committed; ▶ RUN ON: MacBook `git push origin main`; P0-2 can read the tree and find every statement true.
