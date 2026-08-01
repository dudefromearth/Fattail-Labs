# FatTail Labs — Hard & Mental Toughness Spec v1.0

**Status:** **BUILD AUTHORITY** for Track C (Coach GO 2026-07-31 · H0)  
**As-built H1:** migration `059` · `hard_domain.py` · `/api/me/hard*` · tests green (DL-178)  
**As-built H2:** `/app/toughness*` UI · PhysiologyCite · Apps card (DL-179)  
**As-built H3:** MT on Journey process meters + `pi-weights-v1-option1+mt` (DL-180)  
**Date:** 2026-07-31  
**Product owner:** Coach  
**Program:** `agents/p-fattail-hard/`  
**Parents:** Process Integrity Scoring Guidance v0.4 §5 · Journey Experience v1.0 §4 · Privacy v0.1 · Identity/Access · Agent Model Interface v1.0 · DL-173–176  

**Coach Content Law (doctrine §11):** Nothing of Coach’s is removed from this document.  
Labeled notes (`Agent:`, `Tango:`, `Mike:`, `Hotel:`) are **objections or implementation notes** for Coach to accept or throw out — not deletions.

**Plan defaults used (Coach GO without override):**  
Photos deferred in **H2 code**, requirement **kept in Spec**. True 75 = credited offering. Progressive FatTail Hard = primary interactive program. Route `/toughness` + Practice link. H2/H3 before agent. MT weights ratified at H3-1.

---

## 1. Purpose

FatTail Hard and True 75 Hard train **persistence and willpower under voluntary load** — capacity that Process Integrity treats as **Mental Toughness**.

**Physiological thesis (Coach):** The program is designed around the **anterior mid-cingulate cortex (aMCC)** — associated with **mental toughness** / willpower (“willpower muscle”) — strengthened through repeated challenging use. **Member-facing product shall cite these underpinnings** (§4). Product language prefers **mental toughness**; scientific sources may use “tenacity” as their term.

**Not:** P&L training, medical treatment, guaranteed brain growth, membership requirement.

---

## 2. Coach product inventory (C1–C10 — locked)

| ID | Requirement | Spec home |
|----|-------------|-----------|
| C1 | True 75 Hard offered as-is; full credit Andy Frisella | §5 |
| C2 | FatTail Hard progressive / menu-driven program | §6 |
| C3 | Mental Toughness is a PI dimension from Hard compliance | §8 |
| C4 | Empty until enrolled; enters composite when enrolled | §8 |
| C5 | Physiological underpinnings **must be cited** on Hard surfaces | §4 |
| C6 | Science pack: Touroutoglou et al. 2020 *Cortex* + verified secondaries | §4 · source pack |
| C7 | Agent: explain MT; help choose/adjust variants | §9 |
| C8 | Voluntary; never membership gate; floor-support when PI crashes | §3, §9 |
| C9 | Compliance: streak, completion %, daily consistency; recovery after miss (progressive) | §7–8 |
| C10 | Self-assessment / physical limitations inform menu adaptation | §6.4, §10 |

---

## 3. Invariants

| ID | Rule |
|----|------|
| H1 | Never score P&L or promise trading profits from Hard. |
| H2 | Never guarantee aMCC growth / clinical outcome. |
| H3 | Never gate membership, trial, or Navigator on Hard. |
| H4 | MT empty for non-enrolled / paused / exited — no silent zero. |
| H5 | Hard compliance **private**; never contribution board / peer rank. |
| H6 | Family B-adjacent: export/purge with Practice Export when shipped. |
| H7 | Cite physiology on every member-facing Hard surface (C5). |
| H8 | Fail loud on missing config / invalid variant weights. |
| H9 | Standalone Labs; no MSC code. |
| H10 | Coach Content Law — no silent de-scope of §2 inventory. |

**Floor-support (PI Spec v0.4 §9):** Do not **auto-enroll** or **stack max hardship because PI crashed**.

> **Agent note (not a deletion of C7):** Coach v0.1 said the agent may offer Hard when PI or MT is low. That stands as **voluntary offer**. Floor-support forbids **punitive escalation** and auto-enroll. Short progressive sprint as *invitation* is allowed; “your score is bad so start 75 Hard now” is not.

---

## 4. Physiological underpinnings (mandatory citation)

### 4.1 Member-facing requirements

Every Hard surface (hub, True 75 page, FatTail Hard enroll, daily log chrome, MT meter hint, agent Hard explainers, related courseware) **must** present:

1. **What** is trained — **mental toughness** / persistence when effort is costly.  
2. **Where** — **anterior mid-cingulate cortex (aMCC)**.  
3. **Why Hard** — repeated voluntary challenge under load.  
4. **Named sources** — Sources / Further reading block; paraphrase-and-attribute only.

### 4.2 Canonical source pack

**File:** `agents/p-fattail-hard/science/aMCC-source-pack-v1.md`  

**Primary (required):**

- Touroutoglou, A., Andreano, J., Dickerson, B. C., & Barrett, L. F. (2020). The tenacious brain: How the anterior mid-cingulate contributes to achieving goals. *Cortex, 123*, 12–29.  
  DOI: [10.1016/j.cortex.2019.09.011](https://doi.org/10.1016/j.cortex.2019.09.011) · PMID: 31733343 · PMC: PMC7381101  

**Abstract-grounded claims (allowed with cite):**

- The paper’s term **tenacity** = persistence in the face of challenge; **product copy uses mental toughness** for the same capacity.  
- aMCC is proposed as a **network hub** performing **cost/benefit computations** necessary for that capacity.  
- aMCC integrates signals for attention, encoding, movement in service of **goal attainment**.  
- Literature reviewed in that paper associates aMCC connectivity/activity with grit, persistence, effort willingness (secondaries listed in source pack — cite via primary or after Hotel verify).

**Forbidden claims:** see PI Spec §5.1b + source pack red lines.

### 4.3 Gates before copy ships

Hotel (claims) · Tango (capacity/shame) · Bravo (pack expand) · Sierra/Charlie (cite UI).

---

## 5. True 75 Hard (C1)

| | |
|--|--|
| **What** | Original free program by **Andy Frisella**, offered **as-is** |
| **Credit** | Full credit on page and in any agent speech |
| **Location** | `labs.fattail.ai/toughness` (or `/toughness`) |
| **Tracking** | Member may **link** True 75 enrollment in Labs for MT scoring (honor-system daily log) **or** run FatTail Hard as tracked primary |
| **Trademark** | Counsel review before marketing scale — **build constraint**, not product deletion |

---

## 6. FatTail Hard (C2)

### 6.1 Core rules (Coach v0.1 — retained)

| Rule | Notes |
|------|--------|
| Daily reading | 10 pages non-fiction (default; progressive variants may scale) |
| Consistent diet with zero cheating | Menu defines “diet” per variant |
| Daily progress photo / **record** | **Coach requirement kept.** **H2 implementation default:** progress **record** (text/checkbox) required; **photo upload deferred to H4** unless Coach advances — photo remains in Spec, not removed |
| No alcohol | Or social-only in softer progressive variants |

### 6.2 Adaptable menu (Coach v0.1)

- **Workouts:** two 45-min sessions, single session, Japanese/Hindu squats, chair work, breathwork, 10k steps, rucking, Vinyasa/Bikram yoga, Tai Chi, Matt Furey-style bodyweight, weight training, etc.  
- **Water:** scaled by body weight (default ≈ 0.5 oz per lb) with pacing guidance  
  > **Mike/Hotel note:** Health-adjacent guidance — disclaimer required; not medical advice.  
- **Program lengths (Coach):** **20 / 40 / 75 days** — breakthrough periods; progressive ladder  
- **Miss policy:** fail or miss any required activity → **restart from day one** (no grace)  
- **Ladder psychology (Coach — member copy):**  
  - After **20**, many want to stop; some continue to 40. Completing **20 twice** before 40 feels possible is allowed and often wise (capacity, not failure).  
  - At **40**, most hit a **major period of despair**; getting through it under the rules makes the end reachable.  
  - **75** is the far end — stack rungs; do not skip the hard middle.  
- **Life & priorities (Coach — member copy):** Many are unprepared for how the program **changes life and priorities**, especially **no drinking** and **no diet cheating**. Vacations, weddings, holidays, and other real events **challenge resolve**; rules do not pause — hold them or restart day one.
- **Progressive difficulty:** start with 20-day, then 40, then 75; menu load may increase

### 6.3 Variant model (implementation)

```
variant_id, label, sprint_days, tasks[] (id, label, kind, required),
alcohol_rule, diet_rule, photo_required, progressive_rung
```

Config-driven, fail loud if missing.

### 6.4 Physical limitations (C10)

Optional self-report / self-assessment fields may **filter or suggest** menu options. Never block enrollment solely for skipping self-assessment. Privacy: special-category careful; collect only when needed for menu (Mike H1).

---

## 7. Daily compliance (C9)

| Signal | Definition (v1) |
|--------|------------------|
| **Day complete** | All **required** tasks for enrolled variant marked done that calendar day (America/New_York) |
| **Streak** | Consecutive complete days from attempt start; miss breaks streak |
| **Miss / fail** | Any incomplete prior calendar day under `miss_policy: restart` → **clear logs, reset to day one** |
| **Completion rate** | complete_days / enrolled_days in rolling window (sprint length) |
| **Consistency** | Optional: variance of completion (later) |

**How it works (member copy — required on hub):** Programs develop **Mental Toughness**. Follow the full prescribed days; complete all required activities each day without fail; fail any activity → start from day one; hard but effective for physiology and mindset; progress the ladder (20→40→75) for real change. Intro **video** slot on hub (YouTube via `HARD_INTRO_VIDEO_ID` when published).

---

## 8. Mental Toughness dimension (C3–C4)

### 8.1 Empty rules

| State | MT meter |
|-------|----------|
| Never enrolled | **empty** (exclude from overall) |
| Paused / exited | **empty** |
| Enrolled active | **live** — raw 0–100 from compliance |

### 8.2 Raw formula (gradeable — H3 locks constants)

```
# Proposed v1 — Coach ratifies at H3-1
streak_pct     = 100 * min(streak_days, streak_cap) / streak_cap
completion_pct = 100 * complete_days / max(1, days_in_window)
raw_mt         = round(0.5 * streak_pct + 0.5 * completion_pct)
# optional recovery bonus: +min(5, recovery_events) — only if variant enables
```

`streak_cap` default = sprint_days or 30 (profile/variant). Fail loud if window invalid.

### 8.3 Composite weights when MT enrolled

Six-meter Option 1 tables remain for unenrolled. When MT live, use **seven-weight maps** (sum 100) or renorm six after inserting `W_mt`.

**Proposed starting point (Coach ratify H3-1):**

| Profile | W_mt (proposed) |
|---------|-----------------|
| observer_trial | 10 |
| activator | 12 |
| navigator_monthly | 12 |
| navigator_annual | 12 |
| alumni | 8 |
| free_observer | 8 |
| administrator | 12 (same as nav monthly) |

Other meters scale so total = 100. Bump `scoring_model_version` (e.g. `pi-weights-v1-option1+mt`).

Journey Experience Spec §4.1 amended in **same** body of work as H3 ship.

### 8.4 Display

- Label: **Mental Toughness**  
- Hint: compliance process signal + one-line aMCC cite pointer  
- Detail: streak · completion % · variant name  

---

## 9. Agent (C7)

**Depends on:** Track B prerequisites (scoped credentials, phase routing).

**Can:**

- Explain MT raw and physiology (with source IDs)  
- Help choose True 75 vs FatTail Hard vs sprint length  
- Adjust progressive menu within rules  

**Cannot:**

- Auto-enroll  
- Write role / meter_profile  
- Prescribe Hard as punishment for PI crash  
- Invent uncited neuroscience  

**Coach v0.1 preserved:** When PI or MT is low, agent may **offer** an entry point (prefer short progressive sprint for early members). Floor-support still applies (§3 Agent note).

---

## 10. Privacy & security

| Data | Class | Default |
|------|-------|---------|
| Enrollment, daily task booleans | Personal practice | Private |
| Progress photos (when shipped) | Sensitive | Private; separate consent; export/purge |
| Body weight (water calc) | Health-adjacent | Optional; private; minimize retention |
| Diet / alcohol compliance | Personal | Private |

Mike owns H1 Privacy amend if classes need new Spec text. No board exposure.

---

## 11. Domain model (outline — H1 builds)

```
hard_enrollments
  id, identity_id, program_kind (true_75|fattail_hard),
  variant_id, status (active|paused|completed|exited),
  started_at, ended_at, sprint_days, consent_json

hard_daily_logs
  id, enrollment_id, log_date, tasks_json, complete bool,
  progress_note (text), photo_resource_id NULL,
  created_at

hard_variants  (config table or code constants fail loud)
  variant_id, definition_json
```

Timezone: **America/New_York** for day boundaries unless Coach chooses member local later.

---

## 12. API (outline — H1/H2)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/me/hard` | session — status, active enrollment, streak |
| POST | `/api/me/hard/enroll` | body: program_kind, variant_id |
| POST | `/api/me/hard/daily` | body: date, tasks |
| POST | `/api/me/hard/pause` \| `/exit` | |
| GET | `/api/me/journey/scores` | MT meter when non-empty |

---

## 13. UI surfaces (H2)

| Route | Content |
|-------|---------|
| `/toughness` | Hub: why (aMCC + cites), True 75 card, FatTail Hard card, my status |
| `/toughness/true-75` | As-is description + Frisella credit + optional link enrollment |
| `/toughness/fattail-hard` | Enroll + variant picker + progressive menu |
| `/toughness/today` | Daily log |
| Practice suite link | Entry to hub |

Echo owns layout; Charlie implements.

---

## 14. Phased delivery (from plan)

| Phase | Scope |
|-------|--------|
| **H0** | This Spec + source pack + Coach GO — **this document** |
| **H1** | Schema, privacy, domain API |
| **H2** | UI + daily log + cites + True 75 |
| **H3** | MT meter + composite |
| **H4** | Photos + full menu depth |
| **H5** | Agent |
| **H6** | Export/purge + close |

---

## 15. Characterization tests (minimum)

- Unenrolled → MT empty  
- Enrolled, zero completes → raw low, **not** empty  
- Enrolled, full compliance → high raw  
- Exit → empty again  
- Weighted overall with MT changes vs six-only  
- Isolation by identity_id  
- Cite block present (content/fixture test where applicable)  

---

## 16. Open for Coach (non-blocking for H0 lock)

1. Ratify proposed MT weights §8.3 at H3-1  
2. Advance photos to H2 vs keep H4  
3. Counsel timing for True 75 branding  
4. Water default 0.5 oz/lb — keep or soft-only guidance  

---

## 17. Traceability

| Coach source | Landing |
|--------------|---------|
| PI Scoring v0.1 §8 | §5–6 this Spec |
| PI Scoring v0.4 §5 restore | Whole document |
| DL-174 aMCC | §4 |
| DL-175 cite physiology | §4 mandatory |
| DL-176 Coach Content Law | Header + H10 |
| Implementation plan C1–C10 | §2 |

---

**End of Hard & Mental Toughness Spec v1.0**  
H0 exit: this Spec + source pack + ORCHESTRATOR frozen · H1 may begin on Coach/Juliet signal.
