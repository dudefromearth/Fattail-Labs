# GO token — Analyzer Algo Alert W0 (v2 live-eval / PaR)

**ID:** `AZALGO-W0`  
**Program:** Options Lab Analyzer Algo Alert (AZ-ALGO) — **v2** (arm → mechanical entry → GEX-guided profit-retention **guide**)  
**Plan:** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md) **v2.0**  
**Spec:** AZ-ALGO **v2.2.2 BUILD AUTHORITY** — [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md`](../../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md)  
**Board:** `agents/p-az-algo/`  
**DL:** **DL-664** (this stamp) · **DL-663** (token + plan land) · **DL-662** (E23/E24)

**Status:** **STAMPED GO** — 2026-09-03. Spec v2.2.2 **BUILD AUTHORITY**. Plan v2.0 accepted. P0 may write seeds. **P1 does not fire until P0-G PASS.** Product code is still closed in P0.

**DL-328:** Delta gates AZ-ALGO P0 / P1-fire by **this file**. Chat is not a stamp. Gate name is **P0-G**. A chat “go” is not this stamp.

v1.0.3 [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) is the **W1–W4 as-built record**. Do not stamp or execute remaining W5–W-G against it.

---

## Preconditions (file must name these)

| Check | Value |
|-------|--------|
| Plan revision | **v2.0** (stamped with this token) |
| Spec | AZ-ALGO **v2.2.2 BUILD AUTHORITY** — file on disk at land `6653745` |
| Spec sha1 (whole file, at land) | `b757ba3f4b3816fcaebae857aeda70dff488ecdc` |
| Spec sha1 (whole file, at stamp) | `b757ba3f4b3816fcaebae857aeda70dff488ecdc` |
| Appendix B fixtures 1–18 | **On disk, handwritten** — [`agents/p-az-algo/evidence/ALGO-B-appendix-b-goldens.md`](../p-az-algo/evidence/ALGO-B-appendix-b-goldens.md) |
| Fixtures 1–16 freeze | Against v2.2.1 sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5`. E23/E24 did **not** change a 1–16 value. Do not recompute 1–16 against v2.2.2. |
| Fixtures 17–18 | Against v2.2.2 (E23 floor formula (c) · E24 at-body tie-break) |
| Errata in force | **E1–E24** |
| Live eval | **Its own phase (E17).** Plan **P5**. Only exit **AT-ALGO-18**. `algoEval.ts` is not a file of any other phase (**NX13**). |
| Proposed line | Labelled **proposed** until Spec §14 clears it (**E8**). Passing §14 is the only promotion. This GO does **not** pass §14. |
| HUD fourth row | **Guide**. Payload key `guide_print`. AT-ALGO-17 resolves to Guide. |
| W1–W4 | Stand as executed. Do not re-seed. |

---

## OD-ALGO-1…5 (Coach disposes)

| ID | Question | Spec / Juliet default | Coach |
|----|----------|----------------------|-------|
| **OD-ALGO-1** | HUD fourth row: **Guide** (E13) or **Stop** (§0.1.11 verbatim)? The product has no stops; the label is an instruction on a chart. Payload key `guide_print` either way. | **Guide** | **DISPOSED: Guide.** HUD fourth row reads **Guide**. Payload key `guide_print` unchanged. AT-ALGO-17 resolves to Guide. Tango may freeze copy. **Confirmed 2026-09-03.** |
| **OD-ALGO-2** | `k` constant vs regime-dependent | Constant at `k_base` until fitted (after §14.5) | [x] **Accept** — k constant at `k_base` until §14.5 fits it |
| **OD-ALGO-3** | Entry trigger formula | `manual_confirm` stand-in persists under E9 | [x] **Accept** — `manual_confirm` stand-in persists under E9 |
| **OD-ALGO-4** | Six-vendor GEX comparison findings into `gamma_factor` | Percentile normalization as specified | [x] **Accept** — percentile normalization as specified |
| **OD-ALGO-5** | Analyzer VP overlay (FI-031) so arming has a home in-app | **Out of this spec** | [x] **Accept** — Analyzer VP overlay out of this spec |

---

## DL-539 / doctrine §15 (implementation fire)

P0 is token / seeds / goldens — **no `web/` edit**. **P1 is the first code packet.**

If `AGENTS.md` still names **IKI Lab** as the only active program at P1-fire, P1 additionally needs either (a) a reassignment DL or (b) **three successive Coach OKs** recorded on this token before the first `web/` edit. One OK is not three. A break resets the count. This GO does **not** fill that log.

| # | Date | Coach OK recorded |
|---|------|-------------------|
| 1 | — | [ ] |
| 2 | — | [ ] |
| 3 | — | [ ] |

Do not collect OKs in chat.

---

## Coach stamp

Stamp **one**. Do not treat a chat line as this block.

- [x] **GO** — Spec v2.2.2 **BUILD AUTHORITY**. Plan v2.0 accepted. P0 may write seeds; P1 may fire after **P0-G**.
- [ ] **Amend** — reason below; board stays DRAFT; no code
- [ ] **Stop**

**Signed:** Coach (Ernie Varitimos)  
**Date:** 2026-09-03  

**Spec sha1 at stamp:** `b757ba3f4b3816fcaebae857aeda70dff488ecdc`

Delta does **not** treat chat “go” as this stamp — **this file is the stamp** (**DL-328**).
