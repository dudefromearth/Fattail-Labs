# Seed W0-5 — Tango — control copy and the unfitted face

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Tango · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/tango.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## The question
*"Would a bleeding trader, short on trust and time, feel respected and taught by this?"*

## Deliver
1. Labels for the six controls and their grid values, in member language, no jargon left unexplained (`edge_ticks` is not a label). "Limit: pay up to $0.50" beats "abs 0.50".
2. The sentence that sits on the face when `fill_model = unfitted_pessimistic` — what it means, what it is not, in ≤ 25 words.
3. The sentence for a fitted state: `n_orders`, date range, and that it is Coach's own fills, not the market's.
4. Wording for `abandoned_legs[]` at a forced exit — plain, not alarming, not softened.
5. The `legged` contrast label per Hotel's W0-4 finding.
6. No control may present a value as "recommended". Confirm the defaults are marked as **defaults**, nothing more.

## Verdict
Copy sheet in `agents/p-quant-friction/evidence/W0-5-tango.md`; PASS / RETURN on the token.
