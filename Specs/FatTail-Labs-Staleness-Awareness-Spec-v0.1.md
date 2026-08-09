# FatTail Labs — Staleness Awareness Spec v0.1

**Status:** DRAFT — for Coach ratification and bench review (not as-built)  
**Date:** 2026-08-09  
**Source proposal:** [`docs/FatTail-Labs-Staleness-Awareness-Model-v0_1.md`](../docs/FatTail-Labs-Staleness-Awareness-Model-v0_1.md)  
**Parents / companions:**  
- [Capital Spec v0.3](./FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md)  
- [Funding Spec v0.2](./FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md)  
- [Campaign Amendment — Top Level Is the Account](./FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md)  

**Review:** Advisor review 2026-08-09 (S-1…S-3) folded  

**Type:** Product / UX / architecture authority — honesty of **declared** capital numbers vs **derived** truth; as-of chains; display grammar without nagging  

**Purpose:** The campaign-blind capital layer runs on numbers only the trader can keep true (starting balances, self-reported buying power, member-recorded cash movements, allocations). Staleness is the principal honesty burden: the difference between **witnessing reality and witnessing a memory of it**.

---

## 0. Mission

**Staleness is not an error state; it is an honest property of a declared number.** The platform never treats a stale figure as *wrong* — it may still match reality. It treats staleness as **unknown freshness** and shows age so no decision is silently made against a number from three weeks and forty trades ago.

**Obligation: display, never demand.** The member decides when refresh is worth their time.

---

## 1. Laws

| ID | Law |
|----|-----|
| **S1 — Display never demand** | No modals, required confirms, or trade-path steps solely for staleness. |
| **S2 — Derived never stale** | Numbers recomputed from history are always fresh by construction. |
| **S3 — Declared carries as-of** | Every declared figure has an as-of (and activity clock where fills exist). |
| **S4 — Composed inherits oldest** | A figure built from declared inputs shows the **oldest relevant as-of** in its chain. |
| **S5 — Two clocks** | Staleness = time since stated **and** activity since stated (fills, movements, relevant amendments). |
| **S6 — Quiet register** | Same voice as variance lines: small, neutral, factual. No amber/red “aging shame.” |
| **S7 — No enforcement** | Nothing blocked, dimmed, or gated *because* it is old. |
| **S8 — No inferred reality** | Platform never guesses unrecorded bank moves; only measures against recorded declarations. |
| **S9 — Postures respected** | Arbitrary buying-power posture is not aged as stale (member opted out of tracking). |
| **S10 — No second store** | As-of chains derived at read time — no stored “staleness score” SoR. |
| **S11 — Nudge budget** | Honesty prompt lives inside OD-3.3 two-nudge budget; never on trade path. |

---

## 2. Two kinds of numbers

| Kind | Examples | Staleness |
|------|----------|-----------|
| **Derived** | Fill P&L, trading curve, master DD dollars (from fills), live account balances | **Never stale** — recompute |
| **Declared** | Starting balance (once set), cash movements (record lag), self-reported BP, **allocation claims**, tolerated DD, balance-confirm as-of | **Can go stale** — true only as-of stated |
| **Composed** (S4) | **Overcommit ratios** (declared claims ÷ derived balances); solved size; funding provenance lines | **Inherit oldest relevant declared as-of** in the chain — not “never stale” (Advisor S-1) |

**Unentered starting balance:** absence, not zero — surface “Starting balance not set” (gap), never fabricate 0.

---

## 3. The two clocks

| Clock | Meaning |
|-------|---------|
| **Time since stated** | Calendar age of the declaration |
| **Activity since stated** | Fills executed, cash movements recorded, allocation amendments on sources since declaration |

Quiet aging on clock 1; **worth composing** when clock 2 runs — activity makes an old number more likely wrong.

**Standard unit (proposal):** `"as of 12 days / 40 fills ago"` wherever fills exist. Time-only where no activity clock applies.

---

## 4. Staleness by layer

### 4.1 Account (root)

| Declared figure | Behavior |
|-----------------|----------|
| **Starting balance** | Historical once set; **missing** = gap surface |
| **Cash movements** | Record lag via backdating; show last-movement recency next to fill recency |
| **Buying power — self-report** | Age + fills since stated |
| **Buying power — arbitrary** | Posture label; **no** aging display |
| **Buying power — live sync** | “Last synced …” on sync **failure** (when live path exists). **Note (Advisor S-3):** when live ships, Echo may add low-prominence success timestamp for trust — non-blocking now |

**Honesty prompt (bounded):** Accounts & Capital may show a rare quiet line: how long since balances were last **confirmed**, with one-tap **“confirm as current”** that refreshes as-of **without editing values**.  

- Never modal  
- Never on trade paths  
- Never repeated within a cycle (cycle length: Coach disposition)  
- Inside two-nudge budget (OD-3.3)  
- Confirmation itself is a declared fact with its own as-of  

### 4.2 Campaign

| Figure | Inherits | Adds |
|--------|----------|------|
| **Allocation claim** | Live balances are derived (fresh); claim sized at declaration | Allocation-age vs source drift (“declared 60d ago; Account A since −$8k”) — **snapshot wraps only** |
| **Funding provenance** | Source existence / balance | Source-drift **witness** = effect (Funding Spec); staleness = age of claim |
| **Drawdown latitude** | Allocation it scaled to | As-of latest amendment of latitude or allocation |

**Dependency on Capital OD-5 (wrap live vs snapshot) — Advisor S-2:**  
Claim-age and “source since −$8k” **only apply when wrap/proportion claims are snapshots**. If a wrap **tracks live balance**, claim ≡ balance by construction: no claim-staleness line; W-Overcommit-source may not fire. Read this section as **conditional** on that disposition.

**Display rule:** at most **one quiet composed line** on campaign surface = oldest relevant as-of in chain. Detail one tap deeper. Variance witnesses remain **separate** lines (what reality did); staleness explains **how old the intent is**.

### 4.3 Trade moment

| Surface | Rule |
|---------|------|
| **Solved size** | Provenance label with chain oldest as-of: *“Solved from Campaign X allocation — as of 12 days / 40 fills ago.”* Not a warning. |
| **BP gate (self-report)** | Answer includes basis-age: *“within stated buying power (as of …)”* |
| **BP gate (live)** | Omit age — figure is true when synced |
| **Staleness as gate** | **Forbidden.** Member may knowingly trade on old numbers forever. Duty is that *knowingly* stays true. |
| **Interruptions** | Inline text only on surfaces already read — never confirm dialog. |

---

## 5. Display grammar (system-wide)

1. **As-of** everywhere a declared number renders (relative; two-clock where activity exists).  
2. **Composed figures** → oldest link; detail one tap deeper.  
3. **Quiet register** — same typography as variance; no aging colors that judge.  
4. **Display, never demand** — single bounded honesty prompt (§4.1).  
5. **Confirmation is cheap** — one tap re-affirms currency without value edit.  
6. **Postures respected** — arbitrary BP not aged.  

---

## 6. Data / architecture (indicative — India)

| Concern | Approach |
|---------|----------|
| As-of storage | On declared rows: `stated_at` / `buying_power_as_of` / movement `occurred_at` / `recorded_at` / allocation `amended_at` |
| Balance confirmation | Identity or account-level `balances_confirmed_at` (declared) |
| Staleness computation | **Derived at read** from clocks + activity counts — never a stored grade |
| Activity counts | Count fills / movements with `exec_at` / `occurred_at` > stated_at |

No staleness scores, streaks, or process-integrity feeds.

---

## 7. Non-goals

- Staleness scoring, grading, or virtue streaks  
- Inferred staleness (bank scrape, heuristics)  
- Enforcement because old  
- Profit-adjacent framing (“money left on the table”)  
- Trade-path friction for refresh  
- Aging arbitrary-posture BP  

---

## 8. Open dispositions (Coach)

1. **Honesty-prompt cadence** — proposal: surface-only, ≤ once per cycle, cycle length TBD, two-nudge budget.  
2. **Activity threshold** for composing into campaign line — proposal: any source activity after declaration qualifies; tune Echo/Tango after contact.  
3. **Two-clock unit everywhere** vs time-only at account — proposal: two-clock wherever fills exist.  
4. Whether “confirm as current” is per-account or whole capital surface.  

---

## 9. Acceptance (post-ratification)

1. Derived master DD never shows as-of aging chrome.  
2. Self-report BP shows two-clock as-of after fills.  
3. Arbitrary BP shows posture, no aging line.  
4. Solved size line includes oldest chain as-of when presented.  
5. Confirm-as-current updates as-of only (values unchanged) — Kilo.  
6. Honesty prompt never appears on trade create/import path.  
7. No red/amber “stale” semantic colors on capital surfaces.  
8. Oldest-link: allocation declared before movement and fills → composed line uses oldest relevant declaration.  

---

## 10. Review gates

| Holder | Question |
|--------|----------|
| **Tango** | Aging without nagging; “knowingly” preserved; nudge budget |
| **Echo** | As-of grammar; two-clock; one-line composition; tap-deeper |
| **India** | Derived-at-read chains; no second store |
| **Hotel** | Basis-age on solved size / BP answer never softens live hard wall |
| **Kilo** | §§9 characterization |
| **Lima** | Staleness model DL on ratification |

---

## 11. Document history

| Version | Date | Change |
|---------|------|--------|
| **v0.1.1** | 2026-08-09 | Advisor S-1…S-3: overcommit as composed; OD-5 dependency on claim-age; live-sync success timestamp note. |
| **v0.1** | 2026-08-09 | Formal Spec from staleness awareness model: derived vs declared, two clocks, layers, display grammar, honesty prompt. |

---

*Show the age. Never force the refresh. The trader’s practice includes the right to be loose — as long as they are not lied to about how loose.*
