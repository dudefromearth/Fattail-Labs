# Seed W0-1 — Lima — hashes, DL-679 draft, B1 disposition

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Lima · **Phase:** W0 · **Feeds gate:** W0-2…7
**Read first:** `agents/bench/lima.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Task
1. Record on the token: sha1 of the spec and of the plan at stamp (`shasum <file>`, ▶ RUN ON: MacBook, repo root). Confirm the spec sha1 at land is `9e148f787d87b8eda6435f4b0ea3014814380a3f`; if it differs, stop and report — the spec moved after the plan was written.
2. Draft DL-679 (the stamp entry) in `agents/p-quant-friction/evidence/DL-679-draft.md` — not in the decision log yet. Cite DL-674, 677, 678.
3. Draft the B1 disposition per Coach's tick: either the reassignment DL text (Quant Lab active alongside LIM; LIM untouched; DL-539 five-module freeze unchanged) or open the three-OK log on the token.
4. Confirm every document the plan cites exists at the path given. Where one does not, name it on the token; do not author it.

## Done when
Token preconditions table has no "—" in the sha1 rows; DL-679 draft exists; B1 draft exists; missing-doc report (possibly empty) is on the token.
