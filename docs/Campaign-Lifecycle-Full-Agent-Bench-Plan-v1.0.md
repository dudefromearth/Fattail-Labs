# Campaign Lifecycle — Full Agent Bench Plan v1.0

**Date:** 2026-08-08  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-campaign-lifecycle/`](../agents/p-campaign-lifecycle/)  
**Concept (product law):** [`Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md) — especially **§4.5** (signature · amendments · renewal cycles), **§4.5.5** Open/Archive, **§4.5.5b** offered create, **§4.5.6** signature permanence, **§8** acceptance **#10 · #23–#30**  
**Related:** Practice Charter + Day bench (library/editor patterns already shipping); export pack when model bumps  
**Guide:** `/guide` · **as-built only** (F1)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · AGENTS.md  

**Spec review close (2026-08-08):** Concept §4.5 + D1–D3 + minors **passed**. This plan is **execution law** after Coach **W0-0 GO**.  

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates are **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Mission

Ship the **complete contract lifecycle** for Practice Campaigns so the charter is real paperwork, not a sticky note:

| Mechanism | Meaning |
|-----------|---------|
| **Signature** | First activation freezes `signed_at` + immutable `signed_terms` |
| **Amendments** | Post-signature charter edits append honest history (mirror, never judgment) |
| **Pause / Resume** | Clock event (`active` ↔ `planned`); no re-sign |
| **Terminal archive** | Open / Archive library; status sole authority |
| **Renew / Cycle** | Successor draft + predecessor lineage; **cycle number derived** |
| **Permanence** | Hard-delete only if zero stamps **and** never signed |

**Doctrine:** Umpire · day atom · campaign optional · Sacred #8 · no Journey coupling (DL-068) · Family B · evidence over assertion · Guide as-built · no waived gates · declare files before touch.

**Nothing removed from current optional multi-active / default / import paths** except violations of §4.5 (side-effecting list GET already removed).

---

## 1. Locked decisions (from Concept Spec + review)

| ID | Decision | Spec anchor |
|----|----------|-------------|
| **D1** | Library **Open / Archive** (no second archive flag). Terminals live in Archive. Renew from archive/detail. No P&L/completion-rate chrome. | §4.5.5 · #30 |
| **D2 (a)** | **Signature is permanence.** DELETE requires zero stamps **and** `signed_at IS NULL`. Signed-unperformed → abandon only. | §4.5.6 · #10 |
| **D3** | **GET list never creates.** Empty Open view = **offered** one-tap create. | §4.5.5b · #15 |
| **Pause ships** | `active` ↔ `planned`; same signature; status amendments optional for timeline. | §4.5.3 · #25 |
| **Cycle not version** | Member word **Cycle**; cycle # **derived**, never stored. | §4.5.4 · #27 |
| **Charter fields** | `title` · `goals_md` · `starting_capital` · `account_id` · `starts_at` · `ends_at` | §4.5.1 |
| **Not charter** | `is_default`, cover image, UI prefs | §4.5.1 |
| **Never signed display** | Terminals without `signed_at` show **Never signed** (not empty Signed block). | §4.5.9 · #28 |
| **F1** | Guide as-built only; lifecycle chrome copy ships **with** feature PRs. | Sacred #11 |

### 1.1 Bench seating (normative)

| ID | Amendment |
|----|-----------|
| **S1** | **Kilo** co-agent on every seed that lands testable surface: **L1-1**, **L2-1**, **L3-1**, **L4-1**, **L5-1**, **X1-1** + phase K-gates. No Delta product gate without Kilo pack. |
| **S2** | **W0-4 Charlie:** strip live Guide of unbuilt lifecycle promises (Signed terms, Amendments list, Renew) until those PRs land. |
| **S3** | **Mike** co-agent on L1 (schema Family B), L2 (amendments API), X1 (export/import lineage). |
| **S4** | **W0-G cold-start:** phase seeds must be **files on disk** before W0-G PASS — not stub tables alone. |
| **S5** | **Tango** owns Renew / Signed / Cycle / Never signed / Terms as of / amendment list neutrality (ban: goalpost, are you sure, unlock). |
| **S6** | **Hotel** no-op on methodology unless copy invents process prescriptions — confirm at L-G-Hotel. |

---

## 2. Full bench roster

### 2.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | GO, ship/no-ship, arbiter of D1–D3 and any product conflict |
| **Juliet** | Board, seeds, sequencing — **never executes product packets** |
| **India** | Schema: self-FK, amendments table, `signed_terms` JSON; derived cycle; no dual-write truth; keep/kill for any extra table |

### 2.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | Migrations; domain transitions; signature/amend/renew APIs; DELETE permanence; pack export/import |
| **Charlie** | Library Open/Archive; empty offer card; editor Signed/Amendments/Lineage/Renew; Guide per feature PR |
| **Echo** | Library density; editor density; Open/Archive segment control; cycle chip |
| **Mike** | Family B on amendments + lineage traversal + pack keys |
| **Foxtrot** | Only if deploy/migrate order or env paths change |

### 2.3 Quality & copy

| Callsign | Role |
|----------|------|
| **Delta** | All gates; ternary; evidence; **requires Kilo packs** |
| **Kilo** | Characterization for acceptance #10, #23–#30 |
| **Lima** | DL + Spec as-built notes + Guide parity + schema model bump |
| **Tango** | Vocabulary + ban list greps |
| **Hotel** | Confirm no methodology overreach (expected no-op) |

### 2.4 Not seated

Golf · content studio · prop/coach counterparty work · Journey meters.

---

## 3. Sacred invariants (all seeds)

1. Standalone repo — no MSC imports.  
2. Config fail-loud.  
3. Family B — every row scoped by `identity_id`.  
4. **Umpire** — no hard process gates blocking Trade Log/Journal.  
5. **Day atom** — campaign wraps; does not replace.  
6. **Campaign optional** — zero campaigns still valid.  
7. **Goodhart** — create/amend/cycle count ≠ Journey boost.  
8. **No profit theater** on campaign surfaces.  
9. **No unlocks** for scores.  
10. **Guide as-built only** (F1).  
11. **GET list never creates** (D3).  
12. **Signature is permanence** (D2).  
13. **Terminal = read-only** charter fields.  
14. **`signed_terms` immutable** after real signature.  
15. **Cycle # derived**, never stored.  
16. Evidence over assertion; declare files; no waived Delta gates.  
17. Documentation parity same body of work as ship.

---

## 4. As-built vs program (honest)

### 4.1 Landed (substrate — do not rebuild)

| Item | Status |
|------|--------|
| Campaign CRUD, multi-active, account, capital, goals, `is_default` | **LANDED** |
| Pause / Resume (`active` ↔ `planned`) domain transitions | **LANDED** |
| Library card grid + covers + dedicated editor route | **LANDED** |
| Open/Archive UI segmentation (library) | **PARTIAL** (UI landed; polish + empty archive copy in L0) |
| Empty library offered create (no GET side-effect) | **LANDED** (list GET fixed; empty offer card) |
| DELETE stamp-based permanence | **LANDED**; **signed_at check ready** once column exists |
| Signature / amendments table / Renew / pack lineage | **NOT LANDED** |
| Editor Signed / Amendments / Lineage / Renew chrome | **NOT LANDED** |

### 4.2 Program target (this board)

| Item | Phase |
|------|--------|
| Schema: `signed_at`, `signed_terms`, `signed_terms_backfilled`, `predecessor_campaign_id` | **L1** |
| Table: `member_practice_campaign_amendments` | **L1** |
| Domain: sign on first activate; amend on charter PATCH; terminal reject; Renew | **L2** |
| Backfill migration honesty | **L1** |
| Editor: Signed / Terms as of / Never signed · Amendments list · Lineage · Renew | **L3** |
| Library: Open/Archive polish · Cycle chip · Renew entry from archive | **L0 / L3** |
| Pack export/import model bump | **X1** |
| Guide as-built + Lima DL | **Z** |

---

## 5. Phases, seeds, gates

### Phase W0 — Program lock

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on this bench plan + D1–D3 + seating S1–S6 |
| **W0-1** | India | Keep/kill: charter field set; `signed_terms` shape; amendments table; no cycle column; no dual-write |
| **W0-2** | Lima | Point Decision Addendum / Own Spine if needed; DL slot for lifecycle lock |
| **W0-3** | Juliet | **Materialize all phase seeds** as cold-start files (S4) |
| **W0-4** | Charlie | Guide strip: no member-visible Signed/Amendments/Renew until L3 ships |
| **W0-G** | Delta | Plan lock; Guide as-built; cold-start seeds on disk; D1–D3 written |

### Phase L0 — Library integrity (short; may parallel L1 after W0-G)

| Seed | Agent | Intent |
|------|-------|--------|
| **L0-1** | Charlie · Echo · Tango | Open/Archive segment polish; empty Open offer card copy; empty Archive state; no instructional walls |
| **L0-G** | Delta · Kilo | Open lists only non-terminal; Archive only terminal; GET list creates zero rows |

### Phase L1 — Schema + migration

| Seed | Agent | Intent |
|------|-------|--------|
| **L1-0** | India | Written DTO: `signed_terms` JSON keys = charter fields only; amendment row shape; predecessor FK rules |
| **L1-1** | Alpha · Mike · **Kilo** | Migrations: columns + `member_practice_campaign_amendments`; backfill §4.5.7; Family B indexes; **Kilo:** migrate dry-run + column presence tests |
| **L1-G** | Delta · Kilo | Columns present; backfill flags honest; no data loss on existing campaigns |

### Phase L2 — Domain + API

| Seed | Agent | Intent |
|------|-------|--------|
| **L2-1** | Alpha · Mike · **Kilo** | Sign on first activate / create-as-active; multi-field PATCH → N amendments; status amendments for pause/resume/complete/abandon; terminal PATCH charter → 4xx; DELETE rejects signed; **Kilo** acceptance #10, #23–#26 |
| **L2-2** | Alpha · **Kilo** | `POST …/renew`: terminal only; draft successor; predecessor FK; multi-successor; **Kilo** #27 chain of 3 |
| **L2-3** | Alpha | `GET …/amendments` (identity-scoped); no UPDATE/DELETE routes for amendments |
| **L2-G** | Delta · Kilo · Mike | Full L2 pack; Family B greps; no Journey imports of lifecycle metrics |

### Phase L3 — Editor + library product UI

| Seed | Agent | Intent |
|------|-------|--------|
| **L3-1** | Charlie · Echo · Tango · **Kilo** | Editor: Signed / Terms as of / Never signed; Amendments list (neutral); Lineage chip; Renew on terminal; save still works; cover stays library-only |
| **L3-2** | Charlie · Echo · Tango | Library: Cycle chip (density per Echo); Archive Renew affordance if not only on detail; Open/Archive empty states |
| **L3-G-Tango** | Tango | Ban list greps on amendment/renew chrome |
| **L3-G-Echo** | Echo | Density + Open/Archive + cycle chip |
| **L3-G-Hotel** | Hotel | No methodology prescriptions invented |
| **L3-G-Kilo** | Kilo | UI smoke + API parity for signed display states |
| **L3-G** | Delta | Editor + library match §4.5.5; Kilo+Tango+Echo required |

### Phase X1 — Export / import pack

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | India · Lima | Schema model_version bump plan (1.2); predecessor_export_key; amendments array |
| **X1-1** | Alpha · Mike · **Kilo** | Export signature + amendments + lineage; import additive; missing predecessor → pending report not silent drop; **Kilo** round-trip |
| **X1-G** | Delta · Kilo · Mike | Pack green for lifecycle fields |

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z-1** | Lima · Charlie | Spec as-built notes; Guide parity; DL lifecycle lock |
| **Z-G** | Delta | Program PASS — all phase gates + Kilo packs present |

---

## 6. Gate matrix

| Phase | Gate | Agents | Evidence |
|-------|------|--------|----------|
| W0 | **W0-G** | Delta | GO; D1–D3; W0-4 Guide; cold-start seeds on disk |
| L0 | **L0-G** | Delta · Kilo | Open/Archive + empty offer; GET never creates |
| L1 | **L1-G** | Delta · Kilo | Migrations + backfill honesty |
| L2 | **L2-G** | Delta · Kilo · Mike | Sign/amend/renew/DELETE API; Family B |
| L3 | **L3-G-Tango / Echo / Hotel / Kilo** | specialists | Copy / density / pedagogy / tests |
| L3 | **L3-G** | Delta | Requires specialist rows |
| X1 | **X1-G** | Delta · Kilo · Mike | Pack round-trip |
| Z | **Z-G** | Delta | Program close |

**No waived gates.**

---

## 7. Sequencing

```text
W0-G
  ├─► L0* (library integrity) ──► L0-G
  ├─► L1* (schema) ──► L1-G ──► L2* (domain/API) ──► L2-G ──► L3* (UI) ──► L3-G
  │                                                              │
  └─► X1* after L2-G (pack needs domain) ───────────────────────┴─► Z-G
```

**Critical path:** `W0-G → L1-G → L2-G → L3-G → X1-G → Z-G`  
**Parallel:** `L0 ∥ L1` after W0-G; `X1` after L2-G; L3 blocked on L2-G.

---

## 8. Acceptance map (spec §8 → seeds)

| Spec # | Seed completion |
|--------|-----------------|
| #10 Permanence + signature | L2-1 · L1-1 |
| #15 GET never creates | L0-1 (already mostly true) · L0-G |
| #23 Signature | L2-1 · L3-1 |
| #24 Amendments | L2-1 · L3-1 |
| #25 Pause/Resume | L2-1 (domain landed; status amendments if not already) |
| #26 Terminal read-only | L2-1 · L3-1 |
| #27 Renew / cycles | L2-2 · L3-1 · L3-2 |
| #28 Backfill / Never signed | L1-1 · L3-1 |
| #29 Library vs editor | As-built; L3 polish |
| #30 Open/Archive | L0-1 · L3-2 |

---

## 9. File ownership (indicative)

| Area | Paths |
|------|--------|
| Migrations | `migrations/10x_*.sql` |
| Domain / API | `server/practice_spine_domain.py` · `server/routes/practice_spine.py` |
| Tests | `server/tests/test_practice_spine.py` (+ new focused modules if needed) |
| Export / import | `server/export_domain.py` · `server/import_domain.py` · `Specs/schemas/practice-campaign-v1.json` · Member Practice Export Spec |
| Library UI | `web/app/app/practice/campaign/page.tsx` |
| Editor UI | `web/app/app/practice/campaign/[campaignId]/page.tsx` |
| Guide | `web/app/guide/page.tsx` · `web/lib/guide.ts` — **per feature PR only** |
| Spec as-built | Concept Spec §9 / §13 · Lima |

---

## 10. Out of program (do not expand this board)

| Item | Why |
|------|-----|
| Journey meters for cycle/amendment counts | Goodhart / DL-068 |
| Prop / coach counterparty structure | Spec §7 |
| Closed `campaign_type` enum | Umpire |
| Hard pre-register trade ban | Umpire risk |
| Weekly pivot full C2 rebuild | Separate board unless only “read signed terms” stub |
| Marketing Campaign Workflow | Different product word |
| Auto-create on signup / on list GET | D3 / §1 |

---

## 11. Coach GO checklist

- [ ] D1–D3 accepted (already in Concept Spec; reaffirm)  
- [ ] S1–S6 seating accepted  
- [ ] Pause ships (already domain + UI; L2 adds status amendments if missing)  
- [ ] Member word **Cycle** accepted  
- [ ] Explicit **GO** on W0-0  

**After GO, before W0-G:** Juliet materializes seeds; Charlie W0-4 Guide strip; Delta does not pass W0-G on stub tables alone (S4).

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-08-08 | Concept §4.5 lifecycle + D1–D3 closed in Member Campaign Concept Spec |
| 2026-08-08 | **Full Agent Bench Plan v1.0** — signature · amendments · renew cycles · Open/Archive · pack; board `p-campaign-lifecycle` |

---

*Implementation starts only after Coach GO on W0-0.*
