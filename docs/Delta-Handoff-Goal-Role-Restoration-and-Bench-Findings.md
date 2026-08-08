# Delta Handoff — Goal Role Restoration + Bench Findings A–C
## For: Structured Practice Spec v1.0 → v1.1 · Bench Plan v1.0 → v1.1

**From:** Claude (advisor layer) · Coach-ratified 2026-08-08  
**Fold status (2026-08-08):** **FOLDED** into  
- Spec: [`Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.1.md`](../Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.1.md)  
- Bench: [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md`](./Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md)  
- Model narrative: [`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](./Campaign-Model-Change-Structured-Practice-Instances-Bounds.md) (Two Roles section)  

**Headline:** The **goal mode** of charter bounds — Coach's founding statement of the blood-panel model ("these attributes can be **goals to measure against** as well as limits") — was lost between the model narrative and the spec. Everything became boundary/variance machinery; the affirmative measured-goal half vanished into `goals_md` prose. **Coach: "that was really the whole point."** This delta restores it as a first-class role, plus the three bench-plan findings from the same review round.

---

## D1 — The Two Roles (spec §2 Law 7 + §5.2 + §7 + §10)

### Concept (add to Law 7 opening, before the all-bands rule)

Every bound carries a **role**: `boundary` or `goal`. Same attributes, same all-bands grammar, same dimensions and n-floors — different witness semantics:

| | **Boundary** (corridor) | **Goal** (mark) |
|--|------------------------|------------------|
| Meaning | Operate **within** this range | Measure **toward** this range |
| Witness | Outside = **variance**, recorded; feeds Variance Audit | **Never variance.** Feeds **progress**: current draw vs goal, trend across pivots |
| Panel | Corridor bars, in/out of range | Marker approaching band, trend arrow — "tracking toward / tracking away," never "failing" |
| Critical | Eligible (Invalidation clause is a boundary) | **Ineligible** — a goal cannot terminate a contract |
| Post-mortem | "Where did I operate outside my corridors?" | "Did I reach what I declared I was reaching for?" |
| Charter architecture | Capital Mandate / Scope | **Desired Outcomes** — the North Star block's measured half |

A fill cannot breach a goal; only the season's accumulating panel approaches or misses one. §1 doctrine holds exactly: goals are falsifiable expectations read directionally — measured against, never promised, never platform-graded, never fed to Journey. Qualitative goals (learning campaign's "competence demonstrated") stay in `goals_md` narrative v1; checkable qualitative commitments = future OD.

### Spec edits

1. **§2 Law 7:** insert Two Roles table + paragraph above the all-bands rule; all-bands rule text gains "both roles."
2. **§5.2 bounds table:** + `role ENUM('boundary','goal')` NOT NULL; `is_critical` constrained to boundary-role rows (domain-enforced).
3. **§7 lifecycle table:** goals are charter fields like boundaries — signature freezes, post-sign changes amend (no new row needed; confirm wording covers both roles).
4. **§6 surfaces:**
   - Charter detail / bounds editor: role selector per bound; **North Star block gains structured Desired Outcomes** (goal-role bounds) beside `goals_md` narrative.
   - Panel: dual rendering (corridors vs progress-toward with trend).
   - Weekly pivot: reads both ledgers — variance audit (boundaries) + goal progress (goals).
   - Post-mortem: closes on both questions (corridor conduct + goals reached).
5. **§10 acceptance, add:**
   - **#17** Goal-role rows never produce variance (no fill, no panel reading); goal progress renders with trend; respects n-floor ("gathering").
   - **#18** `is_critical=true` on a goal-role row rejects 4xx fail-loud.
   - **#19** Export/import round-trips `role`.
6. **§13:** no new dispositions (roles are Coach-locked, not open).
7. **Copy (Tango):** goal-side vocabulary — progress register ("tracking toward," "reached," "short of"), never grade register ("passing/failing"); ban list extends.

### Bench plan edits

| Seed | Delta |
|------|-------|
| W0-2 (Hotel) | Frame cells ship **goal defaults** alongside boundary defaults per style × horizon (e.g. Classic fly · Short: boundary win-rate 40–60 **and** optional goal avg-R:R ≥ 12) |
| W0-3 (Tango) | Vocabulary map gains goal progress register + ban extension |
| B1-0 / B1-1 | `role` column in enum/DTO freeze and CRUD; critical-rejects-goal domain rule (**Kilo #18**) |
| B3-1 | Panel derivation splits by role: corridor state vs progress+trend (**Kilo #17**) |
| U2-1 | Panel UI dual rendering; charter form Desired Outcomes block (Echo + Tango) |
| X1-1 | Pack round-trips role (**Kilo #19**) |
| Acceptance map | Add #17 → B3-1·U2-1 · #18 → B1-1 · #19 → X1-1 |

---

## D2 — Bench finding A: default-account genesis has no implementing seed

Acceptance #1 requires "default account + ledger exist before first action," but account creation is member-initiated as-built and **no seed provisions a member's first account**. "Practice provision" (Law 1) is undefined.

**Spec edit (§2 Law 1):** define — the default account is provisioned at the member's **first Practice-suite touch** (idempotent; same furniture logic as the ledger: the account is the book, the ledger its first page; provisioning is not a signature). Label = Tango vocabulary map (candidate: "My Book" / "Default").
**Bench edit:** M2-1 scope + account genesis (provision-on-first-touch, Family B, idempotency, Kilo #1 extended); W0-3 Tango adds default-account label.

## D3 — Bench finding B: journal stamping stays optional

M3-2's "journal stamp same rules if applicable" invites inverting the wrong object. **Edit M3-2:** "Journal `practice_campaign_id` remains **optional** (OD-1.4); **Law 2 applies to trades only.** No decision gate on the composer."

## D4 — Bench finding C: landed hard-gate audit

**Edit B2-1 (or M2 scope):** "Audit for and remove any landed term/bounds hard-rejects (interim §4.7a class). Kilo regression: fill after `ends_at` logs successfully with window variance, no 4xx."

---

## Disposition summary

| Item | Status |
|------|--------|
| D1 goal role | **Coach-ratified — FOLDED as law in Spec v1.1** (Law 7 Two Roles · §5.2 `role` · #17–#19) |
| D2 account genesis | **FOLDED** (Spec §2.1 + bench M2-0; reaffirmed in v1.1) |
| D3 journal optional | **FOLDED** (Spec Law 2 item 5 · bench M3-2) |
| D4 hard-gate audit | **FOLDED** (Spec §7 trading-window · bench M2-5 / B2-1) |

*The goal role is not an addition — it is a restoration of the model's founding requirement. Boundary-only shipping would have inverted the blood-panel metaphor into pure surveillance; the panel exists to show a member both where they operated and whether they reached what they declared.*
