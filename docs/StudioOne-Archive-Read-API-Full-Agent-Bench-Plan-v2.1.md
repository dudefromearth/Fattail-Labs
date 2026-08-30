# StudioOne Archive Read API — Full Agent Bench Plan v2.1

**Date:** 2026-08-27  
**Plan revision:** **v2.1**  
**Canonical filename:** `docs/StudioOne-Archive-Read-API-Full-Agent-Bench-Plan-v2.1.md`  
**Supersedes:** v2.0 (same packets; law is now **v0.8 + Amendment A1**)  
**Owner (orchestration):** Juliet  
**W0 artifact:** [`agents/go/SOAR-W0.md`](../agents/go/SOAR-W0.md)  
**Board:** [`agents/p-studioone-archive-read/`](../agents/p-studioone-archive-read/)

**Law Delta reads:**

| Doc | Role |
|-----|------|
| Spec **v0.8** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md) |
| **Amendment A1** | [`Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md`](../Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8-Amendment-A1.md) — **does not supersede v0.8**; both files together |

Packets, DAG, AT-SOAR table, NX, and FP1–FP24 from **plan v2.0** stand except as this file overrides. No product code in W0. Dash bounce = **Coach W5-GO**.

---

## 0. What A1 changes

**A1-1.** Strike v0.8’s claim that the NY local-date test is silently wrong. Window and local-date **agree on every ordinary day**. Window is preferred (explicit; same `today_ny()`/`ensure_day` the tap uses). They **diverge only on fall-back Sunday**. NX18 already said this; A1 makes it spec law. Coach Content Law: struck prose is advisor §1, not §0.

**A1-2.** Hole **`AMBIGUOUS INSTANT`** (200, named, skipped) plus the DST cascade **in the spec**: nearest `captured_at` else `as_of` (reject if >5 min) → neighbour-monotonic → in-window `st_mtime` → `AMBIGUOUS INSTANT`. Named exception to no-envelope-opens. Same cascade plan v1.7/v2.0 already locked as FP20.

**A1 does not:** resolve §9b (still your tick); repair Seek/`sorted`/`i % 64`; repair §4.2/4.3 “expiration required”; repair §8 “reconstruction retired”; repair §7 `no-store`. Those stay **Lima W8**.

---

## 1. Tick list (W0-BA)

`dst-A` is **no longer a plan invention**. Accepting A1 **is** dst-A. env-A (envelope field quote) remains a tick so W0 records the store read.

| # | Juliet rec |
|---|------------|
| **A1** | **Accept Amendment A1** (strike local-date proof; add `AMBIGUOUS INSTANT` + cascade) |
| **spec-C** | Implement §2 (expiration optional). Query lines leftover → W8 |
| **§9b** | `t`-order always on store `chain/<SYM>/` (88/127 wrap) |
| **env-A** | Accept `captured_at` quote on store wrap file |
| **§9.1–4** | Accept spec positions (retention, `marks/`, TAP RESTART, symbols) |

Advisor-set numbers in v0.8 + A1 stand unless overridden on `SOAR-W0.md`.

FP20 in v2.0 = A1-2. W2 implements the amendment text, not a quieter `json.loads`.

---

## 2. India / Hotel / Lima

- **W0-2:** Quote A1-1 and A1-2. Do not treat struck v0.8 proof as law.  
- **W0-4:** `OUT OF WINDOW` vs `AMBIGUOUS INSTANT` as A1-2.  
- **W8:** Leftover list **exactly** A1 “does not carry”: Seek paragraph, expiration required query lines, §8 reconstruction-retired, §7 `no-store`. Plus fold A1 into a reissued spec **only at Coach’s word**.

---

## 3. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v2.1** | 2026-08-27 | **Stamp target.** Law = v0.8 + **Amendment A1**. Packets unchanged from v2.0. |
| **v2.0** | 2026-08-27 | First full packet DAG against v0.8. SUPERSEDED same day by A1. Do not stamp. |
| **v1.7 … v1.0** | 2026-08-27 | Review deltas only. Not packet-complete. Do not stamp. |

**One-line law:**  
**Delta reads v0.8 and A1 together; W2 places clocks in the NY-midnight window and, on the one Sunday hour, opens that file; if nothing can separate two in-window candidates, the hole is AMBIGUOUS INSTANT.**

W0-G evidence is those two spec files + this plan + `SOAR-W0.md`. Not v0.7. Not plan v1.1. Do not reissue v0.8 until Coach says.
