# W0 India Review — Application Framework + Member Data & Privacy

**Agent:** India  
**Date:** 2026-07-25  
**Seed:** `seeds/w0-india-spec-review.md`  
**Verdict (review complete):** **PASS**  
**Spec verdicts after Juliet amendments (2026-07-25):** both specs **APPROVED (architecture)** pending remaining W0 reviewers + Coach.

---

## 1. Boundary

| Check | Result |
|---|---|
| Standalone repo / no MSC imports | **OK** — Framework §0, S3; Privacy §1.6; doctrine |
| Family B in Labs MySQL only | **OK** — Privacy success #6; no parallel store |
| Journey reuses progress | **OK** — Privacy DS-2; Progress Tracking Spec v1.0 (`lesson_progress`, enrollments, `/api/me/continue`) is the real surface |
| Calendar extends `live_sessions` (T-D4) | **OK** — Framework C3.2; Live Sessions specs already single store |
| Product boundary (API-only MSC) | **OK** — no new MSC coupling |

**Journey map (A-1):** Journey **must** aggregate only:

- `enrollments` / course enrollment state  
- `lesson_progress` (Progress Tracking Spec §2–3)  
- Existing pathway/continue endpoints as available  

**Forbidden:** `journey_*` tables that copy completion percents.

---

## 2. Layering

| Check | Result |
|---|---|
| L1 Display–Edit / L2 Components / L4 Templates | **OK** — Framework §2 |
| Privacy at L0 with system of record | **RETURNED (fix required)** — diagram lists only FastAPI/MySQL; text defers to Privacy but diagram must name **Member-Data-Privacy** as L0 co-authority for Family B |
| No dual shell vs template registry | **OK** — single Framework of record; In-Place Editing System superseded |
| Domain specs remain entity authority | **OK** — Framework “does not supersede” domain specs |

---

## 3. Family A as-built (C4)

| Template | Map vs code | Verdict |
|---|---|---|
| Course Presentation | EditProvider, CourseTabs, lesson page — matches Part E | **OK** |
| Hub Page | HubEditProvider, HubFaq — matches | **OK** |
| Catalog Listing | CatalogGrid — matches | **OK** |
| Resources Library | ResourceLibrary — matches | **OK** |
| Calendar / Schedule | Live sessions + EventEditor — “converge stay-put” honest GAP | **OK as GAP** (W1c) |
| Slot policy “enforced” | Prose tables only — no runtime registry | **RETURNED (clarify)** — must state **documentation-enforced in v1**; no false claim of compiler enforcement |

Discussion/Students as read regions without full component rows: **acceptable GAP**, not blocking.

---

## 4. Family B + privacy model (T-D1)

| Check | Result |
|---|---|
| Private-by-default, no share v1 | **OK** |
| Dual admin modes (aggregate vs consented individual) | **OK** — necessary product boundary |
| Admin cannot self-authorize | **OK** — IN-2 |
| Separate consent tracks | **OK** — CN-2 |
| Isolation server-side | **OK** direction; **must** lock key = `identity_id` (Labs identity) |
| Domain models before build | **OK** — A-2 blocks W2 feature UI; plan already sequences this |

**RETURNED (Privacy MR-2):** “Delete … Journey records” conflicts with DS-2 (Journey is derived).  
**Required fix:** Journey = view/export of underlying progress/enrollment; **delete** follows account/progress deletion policy, not a separate Journey store erase.

**RETURNED (cross-cutting):** Explicit invariant: **`/admin/*` and course admin tools never read Family B content except Privacy §4.2.**

---

## 5. Decisions (India recommendations)

| ID | Recommendation |
|---|---|
| **F-D1** | **APPROVE** — Framework is L1+L2+L4 of record |
| **F-D2** | **APPROVE** — lesson URLs are Course Presentation regions |
| **T-D1** | **APPROVE** directionally — privacy model in Member-Data-Privacy v0.1 |
| **T-D2** | **APPROVE cut:** ship **W0+W1 first**; **W2+ only after** Gate 0 + Mike defaults on D-2/D-5 + counsel/DPIA **status recorded** (may be “scheduled”, not complete) |
| **T-D3** | **APPROVE** — finite Journal ⟵ Calendar variant |
| **T-D4** | **APPROVE** — extend live_sessions only |
| **T-D5** | **APPROVE** directionally — Hotel signs field list at W4 |
| **Privacy D-1** | Open — **blocks aggregate endpoints (W7)**; not W1 |
| **Privacy D-2** | Open — Mike default required before W7; recommend k≥5 or k≥10 |
| **Privacy D-3** | Open — blocks analytics opt-out UX |
| **Privacy D-4** | Open — blocks delete/retention semantics |
| **Privacy D-5** | Open — Mike+Foxtrot; **blocks production Family B content** if encryption promised |
| **Privacy D-6** | Open — Tango; default **no gamified public streaks** until decided |

### Blocking before **W2 code**

1. Coach Gate 0 approval of both specs (post-amendment).  
2. Mike review PASS.  
3. Explicit **identity_id** isolation key in Privacy spec.  
4. MR-2 Journey delete clarification.  
5. D-5 posture sentence (even if “platform disk encryption + app-level TBD”).

### Blocking before **W4+ content**

- A-2 data model spec/migration design (W2a seed).  
- T-D5 field list Hotel/Tango.

### Blocking before **W7**

- D-1, D-2, D-3.

---

## 6. Spec verdicts

| Spec | Verdict |
|---|---|
| Application Framework v1.0 | **APPROVED** (post-amendment: L0 privacy, slot policy v1, AF-B1, T-D2 cut) |
| Member Data & Privacy v0.1 | **APPROVED** (post-amendment: MR-2/2b, PD-3b, PD-8, DS-2 sources) |

---

## 7. Required amendments (Juliet — exact)

### Application Framework v1.0

1. **§2 diagram / L0 table:** Add Member-Data-Privacy as L0 co-authority for Family B data access.  
2. **C1 / S1:** Slot policy is **documentation-enforced in v1** (characterization + review); runtime registry optional later.  
3. **New invariant (Part A or C2):** Admin surfaces (`/admin/*`, course edit mode) **must not** read Family B raw content except via Privacy §4.2.  
4. **T-D2 recommendation line:** Prefer W0+W1 formalize-first cut.

### Member Data & Privacy v0.1

1. **MR-2:** Split authored surfaces (full CRUD+delete) vs Journey (view/export; delete = underlying progress/account policy).  
2. **PD-3 / new:** Isolation key = Labs **`identity_id`** (same as `lesson_progress`).  
3. **New PD-8 or admin note:** Course in-place admin and `/admin` boards are **not** consent bypasses.  
4. **DS-2:** Name Progress Tracking Spec + enrollment tables as the Journey sources.

---

## 8. T-D2 ship cut (explicit)

**India recommendation:**  

1. **Cut A (now):** W0 → W1 Family A formalize + stay-put proof.  
2. **Cut B (next project phase):** W2 privacy spine → W3 Journey → W4 Trade Log → …  

Do **not** start Trade Log UI before Gate 2.

---

## Report status

**PASS** — review complete with RETURNED + required changes enumerated.  
Next: Juliet applies §7 amendments → Mike / Echo+Tango / Hotel+Sierra → Coach/Lima → Gate 0.
