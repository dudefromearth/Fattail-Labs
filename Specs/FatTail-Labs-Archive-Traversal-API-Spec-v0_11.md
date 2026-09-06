# FatTail Labs — Archive Traversal API Spec v0.11

**Status:** **AS BUILT** (DL-679). v0.10 §3.7.1 was DESIGN; this file records that it
shipped on 2026-09-06 in the unfitted state, with the errata from plan v1.1.

**Supersedes:** v0.10 (2026-09-06) as the living status of §3.7.1 and of AT-ATRV-36.
**Body of law:** still [`FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md`](./FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md)
except the rows below. Do not fork a second copy of §§1–3.6.

**Plan:** [`docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md`](../docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md)
**Token:** `agents/go/QFRIC-W0.md` · **DL-679**

---

## What shipped

`server/quant/friction.py` + `simulate.py` complex path + `/api/me/quant/controls` +
`controls{}` on `/simulate` and `/sweep` + Monte Carlo page chips.

**Fitted vs unfitted at close:** **unfitted.** OD-ATRV-13 Not yet. `fill_model:
unfitted_pessimistic`, `fit_id: null`. `LABS_QUANT_FILL_FIT_PATH` unset. No depth,
no VIX fit, no queue position. P4 did not fire.

## Errata vs v0.10 (from plan v1.1 D1–D7)

| ID | As built |
|---|---|
| **F5 split** | `complex`: `LABS_QUANT_FILL_P_UNFITTED` is P(fill within the window). `legged`: still the v0.9 per-snapshot constant (contrast). |
| **Cell count** | 64 is **control-axis tuples**. Entry pooling stays on `MAX_PATHS × 10`. |
| **AT-ATRV-36** | **Superseded** by AT-ATRV-44: `exit.touched_at` vs `exit.filled_at`. A mid-mark touch is not an exit. |
| **AT-ATRV-16/18 complex** | Tax is `(limit − complex_mid)` + per-contract fees, per order side. Eight crossings remain the `legged` contrast. |
| **K** | Snapshots actually inside the window on that day. Never a global 2 s. |
| **regime_factor** | Multiplies fitted `P_fit` only. Unfitted hazard is never scaled. |
| **Tick** | Declared in `friction.py` (`XSP`: $0.01). Not read from the store. |
| **Selling marketable** | `limit ≤ complex_natural`. |
| **abs chips** | Page: $0.30 · $0.50 · $1.00. API: $0.01 grid in [$0.05, $5.00]. |

## Non-claims

No depth. No VIX-fitted regime. No fill history in the repo. No fill better than the limit.

---

| Version | Date | Notes |
|---|---|---|
| **v0.11** | 2026-09-06 | As built, unfitted. DL-679. |
