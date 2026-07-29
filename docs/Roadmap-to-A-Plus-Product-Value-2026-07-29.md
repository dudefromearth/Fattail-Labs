# Roadmap to A+ — Usefulness · Practicality · Consumer Value

**Date:** 2026-07-29  
**Baseline grades** ([Product-Value-Assessment](./Product-Value-Assessment-2026-07-29.md)):

| Dimension | Now | Target |
|-----------|-----|--------|
| Usefulness | **B+** | **A+** |
| Practicality | **A−** | **A+** |
| Overall consumer value | **B** | **A+** |

**Thesis:** Architecture/harden (H0–H3) is largely done. A+ is **not** more refactor.
A+ is **finishing the Practice loop members already see in the nav**, plus keeping
education delivery excellent—without profit theater or dependency products.

**Primary consumer:** Trader-learner under stress — capacity over dependency;
process outcomes only (Tango).

---

## 1. What “A+ across the board” means (definition of done)

A+ is achieved only when **all three** are true:

### Usefulness = A+
1. Member can complete a **weekly process ritual** in-product (journal → retro → journey).  
2. Member can capture **personal rules/setups** (Playbook v0) without leaving Labs.  
3. Trade Log → Reports → Journal remain coherent (already true post-harden).  
4. Empty suite tiles **gone** or **honestly demoted** (no first-class vaporware).  
5. Course path remains the primary skill transfer surface (not degraded).

### Practicality = A+
1. New member reaches first useful Practice outcome in **&lt; 30 minutes** (import or 3 fills + Reports glance + Journal day).  
2. Weekly retro creatable without support/docs spelunking.  
3. Large books remain usable (virtualize and/or date filters if load pain is real).  
4. Failures stay fail-loud; no identity/book mixups (already strong).  
5. Ops scripts never mistaken for product.

### Consumer value = A+
1. Labs is recommendable as **primary membership education + process OS** for FatTail.  
2. Substitutes (Sheets + LearnDash-only + Discord notes) feel **strictly worse** for the process loop.  
3. Trust: privacy + honest metrics + process framing hold under Tango/Hotel review.  
4. Perceived polish: nav promise ≈ nav payload.

**Out of scope for A+ (do not chase):**
- Live broker APIs  
- Profit guarantees / P&L theater  
- Agent co-author as requirement for retro (agent is optional, post-manual)  
- Full MSC product merge  
- Aesthetic-only chart rewrites  

---

## 2. Scoring method (impact × effort)

| Score | Impact (I) | Effort (E) |
|-------|------------|------------|
| **5** | Moves a headline grade a full letter (e.g. B→A) or kills major trust leak | Multi-week multi-agent program |
| **4** | Clear grade step (half–full letter) on 1–2 dimensions | 1–2 weeks, Spec + build + gate |
| **3** | Noticeable member value; solid but not grade-defining | Several days–1 week |
| **2** | Polish / secondary lift | 1–3 days |
| **1** | Nice-to-have | Hours |

**Leverage score** = `Impact / Effort` (higher = do first among similar impact).  
**Priority band:**

| Band | Rule |
|------|------|
| **P0 — Must** | I ≥ 4 and required for A+ definition |
| **P1 — Should** | I ≥ 3; high leverage or unblocks P0 |
| **P2 — Scale** | I 2–3; practicality at book size or polish |
| **P3 — Later / optional** | Agent, deep analytics, Strategy Lab depth |

---

## 3. Gap → grade map (what is holding scores down)

| Gap | Hits usefulness | Hits practicality | Hits value | Severity |
|-----|-----------------|-------------------|------------|----------|
| Retrospective content missing (shell only) | High | Med (nav tax) | High | **Critical** |
| Playbook shell only | High | Med | High | **Critical** |
| Journal = day book, weak personal narrative spine | High | Med | High | **Critical** |
| Journey doesn’t surface process milestones from Practice | Med | Low | Med | High |
| Suite / Apps “soon” surfaces | Med | Low | Med | Medium |
| Large blotter / full-book analytics load | Low–Med | High if books huge | Med | Medium (data-dependent) |
| Onboarding to first Practice win unclear | Med | High | Med | High |
| Course content cadence (ops, not code) | High | Low | High | Critical **ops** |
| Estimated PnL education | Low | Low | Low–Med | Low |

---

## 4. Work packages ranked by impact / effort

### Tier A — Highest leverage (build A+)

| ID | Work package | Impact | Effort | I/E | Band | Lifts |
|----|--------------|--------|--------|-----|------|-------|
| **W1** | **Journal entry spine (J0)** — persist day notes (kinds + body); calendar dots for *content* not only trades | 5 | 4 | 1.25 | P0 | U, V, P |
| **W2** | **Retrospective J1+J2** — kind + badge + week confirm + corpus roll-up (manual) | 5 | 4 | 1.25 | P0 | U, V |
| **W3** | **Retrospective J3** — manual template on `/app/retrospective` (sections, edit/save) | 4 | 3 | 1.33 | P0 | U, V |
| **W4** | **Playbook v0** — CRUD personal setups/rules (markdown + tags + link to strategy codes); list + sheet | 5 | 4 | 1.25 | P0 | U, V |
| **W5** | **Journey Y0** — retro milestones + last retro + deep link into Practice | 4 | 2 | 2.00 | P0 | U, V, P |
| **W6** | **First-win onboarding** — post-login path: import or seed 1 account → open Reports → open Journal day (guide or empty-state CTA chain) | 4 | 2 | 2.00 | P0 | P, V |

### Tier B — Solidify A / prevent regression

| ID | Work package | Impact | Effort | I/E | Band | Lifts |
|----|--------------|--------|--------|-----|------|-------|
| **W7** | **Nav honesty pass** — no first-class empty destinations; demote or finish; Apps “soon” clarity | 3 | 1 | 3.00 | P1 | V, P |
| **W8** | **Empty states + estimated PnL education** — one clear sentence + link to Trade Log when path empty | 3 | 1 | 3.00 | P1 | P, V |
| **W9** | **Journal ↔ Trade Log deep links polish** — bidirectional default paths; “log this day” CTA | 3 | 2 | 1.50 | P1 | U, P |
| **W10** | **H4 scale (if evidence)** — blotter virtualize and/or `from`/`to` on list/analytics | 3 | 3 | 1.00 | P2 | P |
| **W11** | **Reports process cards** — adherence mix if data present; keep equity but not sole hero | 3 | 3 | 1.00 | P1 | U, V |
| **W12** | **Spec flip + bench project** — Journal-Retro Spec v0.2 approved; `agents/p-journal-retro/` seeds | 3 | 2 | 1.50 | P0 process | Enables W1–W5 |

### Tier C — Ops / content (non-code but grade-critical)

| ID | Work package | Impact | Effort | I/E | Band | Owner |
|----|--------------|--------|--------|-----|------|-------|
| **C1** | **Flagship course pathway quality** — stop-the-bleeding sequence complete, honest outcomes | 5 | 4* | 1.25 | P0 | Coach + content |
| **C2** | **Live session reliability** — schedule truth, join path, replays in library | 4 | 3* | 1.33 | P0 | Ops + Foxtrot as needed |
| **C3** | **Resource library hygiene** — pin key worksheets to flagship | 3 | 2* | 1.50 | P1 | Content |
| **C4** | **Member-facing “how to use Practice” short** — 5-min guide in-app or course lesson | 3 | 2* | 1.50 | P1 | Sierra/Tango |

\*Effort is human/content time, not engineering weeks.

### Tier D — Explicitly later (do **not** put on A+ critical path)

| ID | Work package | Impact | Effort | Why later |
|----|--------------|--------|--------|-----------|
| **L1** | Retro agent co-author (A1) | 3 | 5 | Dependency risk; manual path must exist first |
| **L2** | Longitudinal agent brief (A2) | 3 | 5 | Same |
| **L3** | Strategy Lab full workspace | 3 | 5 | Parallel product surface; dilutes Practice A+ focus |
| **L4** | Wiki depth expansion | 2 | 4 | Secondary value |
| **L5** | Chart library rewrite | 1 | 4 | Aesthetics ≠ grade |
| **L6** | Live broker integration | 2 | 5 | Doctrine / boundary; wrong product |

---

## 5. Impact × effort matrix (visual)

```text
Impact
  5 │  W1 W2 W4     C1
    │     W3
  4 │  W5 W6        C2     W11 W10
    │  W12
  3 │  W7 W8 W9 C3 C4
    │
  2 │           L1 L2 L3
  1 │              L5
    └──────────────────────── Effort →
         1    2    3    4    5
```

**Do first (upper-left / high I/E):** W7, W8, W5, W6, W12, then W1→W2→W3, W4, C1/C2.

---

## 6. Phased program (execution order)

### Phase 0 — Gate & honesty (≤ 1 week)  
**Goal:** Stop leaking value; unlock Spec-first build.

| Step | Work | Agents |
|------|------|--------|
| 0.1 | Coach confirms A+ definition + open Spec questions (Journal-Retro §11 D1–D8) | Coach |
| 0.2 | Juliet drafts **v0.2** Journal-Retro Spec + **Playbook Spec v0.1** (minimal) | Juliet → India |
| 0.3 | Echo + Tango + Hotel review gates | Echo, Tango, Hotel |
| 0.4 | Coach **approve for build** → Lima decision log → `agents/p-journal-retro/`, `agents/p-playbook/` | Coach, Lima, Juliet |
| 0.5 | **W7 nav honesty** — if Playbook/Retro not starting immediately, keep honest “soon” but don’t oversell shell copy | Charlie, Tango |

**Exit:** Approved Specs + boards; no coding without Spec.

**Grade effect:** Value +0.1 (trust); enables rest.

---

### Phase 1 — Kill suite tax + first win (1–2 weeks)  
**Goal:** Practicality → **A**; value perception up.

| Order | Package | Why now |
|-------|---------|---------|
| 1 | **W6** First-win onboarding CTAs | Cheap practicality A |
| 2 | **W8** Empty states + estimated PnL education | Cheap trust |
| 3 | **W5** Journey Y0 (can start after J1; stub “retros coming” only if J1 delayed—prefer after J1) | High I/E |
| 4 | **W9** Deep-link polish | Glue |

**Exit:** New member path documented; empty states honest; Journey ready to receive milestones.

**Expected grades:** Usefulness B+ → **A−**; Practicality A− → **A**; Value B → **B+**.

---

### Phase 2 — Journal spine + Retrospective (core A+ path) (3–6 weeks)  
**Goal:** Usefulness & value → **A / A**.

| Order | Package | Spec slice | Depends |
|-------|---------|------------|---------|
| 1 | **W1** Journal entry spine | J0 | Spec lock |
| 2 | **W2** Retro kind + week roll-up | J1 + J2 | J0, P0 done |
| 3 | **W3** Manual retro template | J3 | J2 |
| 4 | **W5** Journey milestones | Y0 | J1 |
| 5 | Optional **W11** process cards on Reports | — | data available |

**Exit:** Member can write notes, create end-of-week retro with corpus, edit template, see milestone on Journey—**without agent**.

**Expected grades:** Usefulness **A**; Value **A**; Practicality **A**.

---

### Phase 3 — Playbook v0 (parallelizable after Phase 0 Spec) (2–4 weeks)  
**Goal:** Completes Practice promise; value → **A+**.

| Package | Scope (v0 only) |
|---------|-----------------|
| **W4** | Table of personal setups; fields: name, structure notes (md), risk rules (md), tags, optional strategy code, active flag; Family B isolation; suite nav **live** |

**Non-goals v0:** backtest, broker attach, social share, AI generation.

**Expected grades:** Usefulness **A+**; Value **A+** (with Phase 2).

---

### Phase 4 — Scale & polish (evidence-gated) (1–3 weeks)  
**Goal:** Practicality → **A+**.

| Package | Gate |
|---------|------|
| **W10** H4 virtualize/filters | Coach GO only if list/analytics lag &gt; threshold (e.g. &gt;2s or complaints) |
| **W11** if not done | Process-first Reports balance |
| HIG pass Echo | No layout regressions on new surfaces |

**Expected grades:** Practicality **A+**.

---

### Phase 5 — Content ops (continuous, parallel all phases)  
**Goal:** Hold education at A+ so Practice doesn’t become the only story.

| Package | Cadence |
|---------|---------|
| **C1** Flagship pathway | Ongoing |
| **C2** Live reliability | Weekly ops checklist |
| **C3** Resources | Per course ship |
| **C4** “How to Practice” micro-lesson | Once after Phase 1 |

Without C1–C2, overall value **cannot** hit true A+ even with perfect Practice tools.

---

### Phase 6 — Agent (post A+, optional)  
**L1/L2** only after Phase 2 manual path is excellent + Mike privacy review.  
Agent **must not** be required for A+ definition above.

---

## 7. Grade trajectory (planned)

| Milestone | Usefulness | Practicality | Value |
|-----------|------------|--------------|-------|
| **Now** (post-harden) | B+ | A− | B |
| After Phase 1 | A− | A | B+ |
| After Phase 2 | A | A | A |
| After Phase 3 | **A+** | A | **A+** |
| After Phase 4 (if needed) | A+ | **A+** | A+ |
| After C1–C2 sustained | A+ | A+ | **A+ locked** |

---

## 8. Dependency graph

```text
Coach decisions ──► Spec v0.2 (Journal-Retro) ──┬──► J0 (W1) ──► J1/J2 (W2) ──► J3 (W3)
                     Playbook Spec v0.1 ────────┤                      │
                                               │                      ▼
W6/W7/W8 (cheap) ──────────────────────────────┤               Y0 (W5)
                                               │
                                               └──► Playbook v0 (W4)  [parallel to J*]

H4 (W10) ── only if scale pain
A1/A2 ── after J3 + privacy
C1–C4 ── parallel entire program
```

---

## 9. Bench / agent ownership (when Specs approved)

| Package | Primary | Reviewers / gates |
|---------|---------|-------------------|
| Specs + boards | Juliet, India | Coach, Echo, Tango, Hotel, Mike (agent later) |
| J0–J3, Y0 | Alpha (API/schema), Charlie (UI), Echo | Mike isolation, Kilo tests, Tango copy, Delta gates |
| Playbook v0 | Alpha + Charlie | India model, Echo, Tango, Delta |
| W6–W9 polish | Charlie | Echo, Tango |
| H4 | Charlie + Alpha | India, Kilo, Coach GO |
| Content C* | Coach / Sierra / ops | Tango, Hotel |

Projects (suggested):  
`agents/p-journal-retro/` · `agents/p-playbook/` · optional `agents/p-practice-polish/`

---

## 10. Success metrics (evidence, not vibes)

| Metric | Target for A+ claim |
|--------|---------------------|
| Time-to-first-Practice-win (new member, guided) | ≤ 30 min |
| Retro completion path | Create + save J3 template without support ticket |
| Suite honesty | Zero first-class pages that are pure “coming soon” without clear CTA to live tools |
| Isolation regression | Zero; pytest trade_log + new journal isolation green |
| Grade re-assessment | Re-run Product-Value-Assessment checklist; all three dimensions A+ |
| Content | Flagship pathway complete + live sessions reliable for 4 consecutive weeks |

Delta does **not** pass “A+” without evidence pack (demo walkthrough + tests + Spec parity).

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Scope explosion into Strategy Lab / Wiki / Agent | Phase 0 freeze; L* list is hard backlog |
| Shame cadence in retro | Tango on all copy; no red “missed week” scores |
| Playbook becomes spreadsheet clone | v0: rules capacity, not P&L |
| Spec delay blocks all build | Phase 1 polish (W6–W8) can ship under existing Specs |
| Content ops ignored | C1–C2 on same board as engineering; Coach owns |
| Over-engineering Journal | J0 minimal fields only; no Vexy required |

---

## 12. Recommended 90-day plan (compressed)

| Days | Focus |
|------|-------|
| **1–7** | Phase 0 Spec lock + W7/W8 honesty |
| **8–21** | W6 + W1 (J0) start |
| **22–50** | W2 + W3 (retro) + W5 (Journey) |
| **30–60** | W4 Playbook v0 (parallel once Spec ready) |
| **60–75** | Integration polish W9, W11; Delta gates |
| **Ongoing** | C1–C4 content |
| **75–90** | Re-grade; H4 only if metrics demand; **no agent unless Coach expands A+ definition** |

---

## 13. Immediate next actions (Coach)

1. **Approve** this A+ definition (or edit §1).  
2. Answer Journal-Retro open decisions (Spec §11) — especially week-end day, warn vs block mid-week, agent timing.  
3. Authorize Juliet to open **Playbook Spec v0.1** (minimal) + Journal-Retro **v0.2 for build**.  
4. Confirm content track owner for **C1/C2** (without this, A+ value is unstable).  
5. Explicitly **defer** L1–L6 until post-A+.

---

## 14. One-page priority stack (print this)

| # | Do | I | E | Why |
|---|----|---|---|-----|
| 1 | Spec lock (W12) | 3 | 2 | Unlocks everything |
| 2 | Nav/empty honesty (W7/W8) | 3 | 1 | Stop value leak |
| 3 | First-win path (W6) | 4 | 2 | Practicality A |
| 4 | Journal J0 (W1) | 5 | 4 | Usefulness foundation |
| 5 | Retro J1–J3 (W2/W3) | 5+4 | 4+3 | Kill shell tax |
| 6 | Journey Y0 (W5) | 4 | 2 | Close the loop |
| 7 | Playbook v0 (W4) | 5 | 4 | Complete Practice promise |
| 8 | Content C1/C2 | 5+4 | ops | Value floor |
| 9 | H4 only if pain (W10) | 3 | 3 | Practicality A+ |
| 10 | Agent later | — | — | Not on critical path |

---

**Document status:** Plan for Coach review — not an approved Spec.  
**Related:** Product-Value-Assessment · Journal-Retrospective Spec v0.1 · Trade Log Spec §15 · p-practice-harden CHARTER (closed H0–H3).  
