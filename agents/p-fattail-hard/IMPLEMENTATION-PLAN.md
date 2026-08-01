# FatTail Hard — Implementation Plan

**Program:** `agents/p-fattail-hard/`  
**Product owner:** Coach  
**Authority:** PI Scoring Spec v0.4 §5 (restored Coach scope) · DL-173–176 · v0.1 Hard intent  
**Status:** **H0–H3 COMPLETE** · Spec + API + UI + MT composite · **H4/H5 optional next**  

---

## 0. Coach product (locked — do not remove)

Everything below is **Coach-specified**. Agents may put labeled objections **beside** items; they may not delete them (doctrine §11).

| # | Requirement |
|---|-------------|
| C1 | **True 75 Hard** offered as-is with full credit to Andy Frisella |
| C2 | **FatTail Hard** — proprietary progressive / menu-driven program (reading, diet integrity, workouts, water goal, progress record, lengths **20/40/75**, miss → restart day one) |
| C3 | **Mental Toughness** is a Process Integrity dimension fed by Hard compliance |
| C4 | MT **empty until enrolled**; when enrolled, MT **enters the composite** (published weights + renorm); never zero non-enrollees; never inject MT because other meters are weak |
| C5 | **Physiological underpinnings must be cited** (aMCC / mental toughness / willpower) on Hard surfaces — not slogan-only (DL-175 · §5.1b) |
| C6 | Anchor science pack starts with Touroutoglou et al. 2020 *Cortex* “The tenacious brain”; expand under Hotel/Bravo |
| C7 | Agent may help choose / adjust Hard variants and explain scores (Track B dependency) |
| C8 | Hard is **voluntary capacity training** — never membership gate; never prescribed *because* PI crashed (floor-support) |
| C9 | Compliance: streak, completion rate, daily consistency; optional recovery after miss (progressive) |
| C10 | Self-assessment / physical limitations can inform menu adaptation when that surface exists |

**Process outcomes only:** compliance and capacity framing — never P&L, never “guaranteed aMCC growth,” never medical diagnosis.

---

## 1. Success criteria (program done when)

1. Member can discover True 75 (credited) and FatTail Hard from Labs.  
2. Member can enroll, log daily compliance, see streak/completion.  
3. PI meters show `mental_toughness` when enrolled; empty when not; overall uses seven-weight map when active.  
4. Every Hard surface cites aMCC physiology with named sources.  
5. Privacy: consent, private by default, export/purge, no board exposure.  
6. Characterization tests for enrollment, dual empty MT, weighted composite.  
7. Spec + Journey amend + decision log same body of work as ship.

---

## 2. Phases

### H0 — Spec lock & source pack (no product UI yet)

**Goal:** Single build-authority Hard Spec (versioned) that **includes all of C1–C10** (not a reduced subset). Opinions inline, labeled.

| Task | Agent | Deliverable |
|------|-------|-------------|
| H0-0 | Coach | GO on this plan + any open product calls (§4) |
| H0-1 | Juliet | Draft `Specs/FatTail-Labs-Hard-Mental-Toughness-Spec-v1.0.md` — full Coach scope |
| H0-2 | Bravo | Source pack: Touroutoglou 2020 + verified secondaries; claim inventory |
| H0-3 | Hotel | Scientific claim shapes allowed/forbidden; aMCC copy accuracy |
| H0-4 | Tango | Capacity, shame, floor-support, diet/photo language; objections **beside** text not deletions |
| H0-5 | Mike | Privacy classes (photos, health-adjacent), consent, Family B, export/purge outline |
| H0-6 | India | Domain model vs Journey PI; MT composite rules; no parallel scoring engine |
| H0-G | Delta | Spec lock gate — evidence: every C1–C10 present in Spec |

**Exit:** Hard Spec v1.0 **BUILD AUTHORITY** + Lima DL.  
**Counsel (outside agents):** True 75 trademark / derivative naming — Coach action item, not silent kill.

---

### H1 — Domain & privacy spine

**Goal:** Data model and privacy before any daily habit UI.

| Task | Agent | Deliverable |
|------|-------|-------------|
| H1-1 | Mike + India | Data classes, consent flags, retention; Privacy Spec amend if needed |
| H1-2 | Alpha | Migrations: e.g. `hard_enrollments`, `hard_daily_logs`, variant config, identity-scoped |
| H1-3 | Alpha | Domain API: enroll / pause / exit / daily check-in / streak read (no public board) |
| H1-4 | Kilo | Characterization: isolation, empty-unenrolled, no cross-identity leak |
| H1-G | Delta | Schema + API evidence |

**MVP data (v1 can be lean):**

- Enrollment: program kind (`true_75` \| `fattail_hard`), variant id, started_at, status  
- Daily log: date, tasks completed (structured booleans / menu picks), optional notes  
- **Photos:** phase as **optional later slice** if Coach wants v1 without them — **do not delete C2 progress-record requirement**; either implement or keep as explicit **deferred-with-Coach-note** still in Spec  

---

### H2 — Member surfaces + physiology copy

**Goal:** Discover, understand why (aMCC), enroll, daily log.

| Task | Agent | Deliverable |
|------|-------|-------------|
| H2-1 | Sierra + Hotel | Final cite blocks + allowed copy from source pack |
| H2-2 | Echo | Toughness hub / enroll / daily log UX (HIG) |
| H2-3 | Charlie | Routes: e.g. `/toughness` or Practice suite surface; True 75 credit page; FatTail Hard enroll + daily |
| H2-4 | Tango | Review all member strings |
| H2-5 | Kilo | UI/API smoke + isolation |
| H2-G | Delta | Walkthrough evidence + cite blocks present |

**Must ship on first UI:**

- True 75 offering + credit  
- FatTail Hard enroll + daily compliance  
- aMCC physiology section + Sources  
- Exit anytime → MT empty again  

---

### H3 — Mental Toughness meter + composite

**Goal:** Process Integrity reflects Hard when enrolled (C3–C4).

| Task | Agent | Deliverable |
|------|-------|-------------|
| H3-1 | Coach | Ratify **MT weight table** when enrolled (or seven-weight maps per profile) |
| H3-2 | Alpha | `mental_toughness` raw from compliance (streak / completion / consistency formula — gradeable, fail loud) |
| H3-3 | Alpha | `PROCESS_METER_WEIGHTS` seven-way when enrolled; renorm; bump `scoring_model_version` |
| H3-4 | Charlie | ProcessMeter shows MT when non-empty; empty state honest |
| H3-5 | Kilo | Dual empty (unenrolled vs enrolled low compliance); weighted overall tests |
| H3-6 | Lima | Journey Spec §4.1 amend + DL |
| H3-G | Delta | Scores API evidence with/without enrollment |

**Formula direction (to lock in H0 Spec):**

```
# sketch — finalize in Hard Spec
raw_mt = f(streak_vs_cap, completion_rate_window, recovery_bonus?)
empty if not enrolled or paused
else include with weight W_mt; other weights renormalize or use fixed 7-map
```

---

### H4 — Progressive menu polish (FatTail Hard depth)

**Goal:** Full menu: workout options, water by body weight, sprint lengths, progressive load (C2 depth).

| Task | Agent | Deliverable |
|------|-------|-------------|
| H4-1 | Coach + Juliet | Lock v1 menu inventory (what ships vs later) |
| H4-2 | Alpha + Charlie | Variant config + picker + daily tasks per variant |
| H4-3 | Tango | Limitations / modified menu language |
| H4-G | Delta | Multi-variant enrollment evidence |

---

### H5 — Analyst / chat (depends on Track B)

**Goal:** C7 — explain MT, help choose variant, never Hard-as-punishment.

| Task | Agent | Deliverable |
|------|-------|-------------|
| H5-0 | Juliet | Confirm Track B phase (P2 vs P3) |
| H5-1 | Mike | Scoped agent credentials |
| H5-2 | Alpha + Charlie | Tools: read Hard state + PI meters; recommend variants with sources |
| H5-G | Delta | No admin-cookie writes; no PI-crash → force Hard |

**May ship after H2–H3** so members already have the program without waiting on chat.

---

### H6 — Portability & close

| Task | Agent | Deliverable |
|------|-------|-------------|
| H6-1 | Alpha | Practice Export / purge for Hard rows |
| H6-2 | Lima + India | As-built Spec parity |
| H6-G | Delta | Program complete |

---

## 3. Sequencing diagram

```
H0 Spec + science pack + Coach GO
        ↓
H1 Domain + privacy + API
        ↓
H2 UI + True 75 + FatTail Hard daily + aMCC cites
        ↓
H3 MT meter + composite weights  ←── needs Coach weight integers
        ↓
H4 Menu depth (can overlap late H2 if Coach prioritizes)
        ↓
H5 Agent (after Track B prerequisites)
        ↓
H6 Export + close
```

**Recommended first ship:** H0 → H1 → H2 → H3 (minimum lovable: enroll, log, score, cite physiology).  
H4/H5 deepen without blocking that spine.

---

## 4. Open product calls for Coach (before or during H0)

| # | Question | Default if you want speed |
|---|----------|---------------------------|
| Q1 | Photos in **v1** daily log or deferred (still listed in Spec)? | Defer photos to H4; keep requirement in Spec |
| Q2 | Alcohol / diet rules: full True 75 parity in FatTail Hard v1 or softer progressive only? | Progressive menu v1; True 75 page = external/as-is description |
| Q3 | MT weight when enrolled (e.g. 12% nav monthly + renorm)? | Propose in H0 Spec; you ratify at H3-1 |
| Q4 | Route home: `/toughness` vs under Practice suite? | `/toughness` + Practice link |
| Q5 | Who may enroll (trial vs activator+)? | Activator+ and trial optional opt-in |
| Q6 | Track B timing vs Hard UI | Ship H2/H3 without agent first |

---

## 5. Explicit non-blocks (opinions stay opinions)

These are **not** reasons to remove C1–C10:

- “Hard is a different business” → **opinion** (build with privacy/counsel constraints)  
- “Engagement meters exist already” → Hard is **capacity / aMCC** story, not duplicate Live  
- “Monday can’t ship all of it” → **phase** H2–H3 first; do not delete scope  

**True blocks only:** MSC boundary, Family B isolation, fail-loud config, no P&L scoring, no silent admin-agent writes.

---

## 6. Agent map

| Callsign | Role on Hard |
|----------|----------------|
| Coach | Product, weights, menu GO |
| Juliet | Board, seeds, phase order |
| India | Spec/domain integrity |
| Bravo + Hotel | Science pack + claims |
| Tango | Capacity, shame, floor-support |
| Mike | Privacy, consent, agent auth |
| Alpha | Schema, domain, MT composite |
| Charlie + Echo | UI/UX |
| Sierra | Cite blocks / public copy if any |
| Kilo | Tests |
| Delta | Gates |
| Lima | DL + Spec parity |

---

## 7. Immediate next action

1. **Coach:** Approve this plan (or edit Q1–Q6 answers in place).  
2. **Juliet:** Create `ORCHESTRATOR.md` + H0 seeds under `agents/p-fattail-hard/`.  
3. **H0-1:** Hard Spec v1.0 with **full C1–C10** and physiology § mandatory.

No code until H0 GO unless Coach orders a spike (synthetic only).
