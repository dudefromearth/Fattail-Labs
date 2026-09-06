# Seed W0-4 — Hotel — optimism audit

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Hotel · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/hotel.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## The question
*"Would this make a member worse if they believed a wrong version of it?"* — applied to §3.7.1 line by line.

## Check
1. Never-better-than-limit (F1): is there any path where price improvement leaks in (e.g. a marketable order filling at natural below the limit — is that "better than limit" or the limit itself)? State the rule the engine must follow.
2. Null-bid law (F3): does abandoning a long leg at $0 at forced exit ever *understate* a loss a real trader would take? Does it ever overstate? Name the direction.
3. `legged` as contrast (F9): is showing it at all a risk — a member picking the flattering shape? State the label Tango must use, or say it should be hidden from members.
4. Era-1 fidelity: confirm no sentence in §3.7.1 implies queue position or depth.
5. O5 reporting rule: two ECDFs side by side, no verdict. Is that enough, or must the page say *why* they differ?
6. The window/re-seat defaults (30 s, improve 1, max 2): are these the optimistic end of what Coach described (10–30 s, sometimes missed)? If so, propose the pessimistic defaults.

## Verdict
PASS / RETURN in `agents/p-quant-friction/evidence/W0-4-hotel.md`.
