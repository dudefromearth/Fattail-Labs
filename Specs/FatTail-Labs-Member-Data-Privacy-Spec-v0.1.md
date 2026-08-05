# FatTail Labs — Member Data & Privacy — Per-Member Surfaces + Governed Admin Access — Spec v0.1

**Status:** **Approved for build (direction)** (2026-07-25, Coach — W0 review chain complete). Mike D-* defaults accepted for Cut B planning; counsel/DPIA status = **scheduled before production Family B**. Amendments = new version.  
**Phase:** **P1** (member system of record). Introduces **new domain surfaces** + a privacy/consent governance model. Spec-first. Not P2. **Carries legal weight — see §8.**  
**Drafting author:** Juliet (per bench workflow)  
**Landed in repo:** 2026-07-25 (as draft for review; no Coach approval yet)

**Underpins / resolves:**  
- [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md) **Family B** (Trade Log, Journal, Playbook, Journey)  
- Application Framework decision **T-D1** (member-authored private tools; no sharing v1)  
- Application Framework **T-D5** process-first framing (schema direction; detail here + domain data models)

**Sibling (not superseded):**  
- Identity / Access, Enrollment, Progress Tracking — Journey **reuses** progress (no second store)  
- Application Framework Parts A–C — page templates + edit paths; **this** doc owns isolation, consent, admin access modes, aggregates

**Reviewers (PENDING — none have signed off):**

| Gate | Reviewer | Concern |
|---|---|---|
| Auth / privacy / isolation / audit | **Mike** | Per-user isolation, consent mechanics, access audit, encryption posture |
| Architecture / product boundary | **India** | New surfaces; no second store of truth; overlap with existing progress surface |
| Member psychology / trust | **Tango** | Consent is honest not coercive; members feel respected, not surveilled |
| Trading-education accuracy | **Hotel** | Reporting framed process-first; no profit-claim leakage |
| SEO / marketing boundary | **Sierra** | Aggregate metrics never become externally-facing profit claims |
| Gate | **Delta** | Evidence at phase end |
| Approver | **Coach** (Ernie) | Ship / scope |

**Recommend legal counsel review + a data-protection impact assessment (DPIA) before build** (§8). *This spec is not legal advice.*

---

## 1. Intent

> Every member owns a private set of personal data surfaces — **Trade Log, Journal, Playbook, Journey** — that they author or that the system records for them. The admin can (a) analyze **de-identified aggregate metadata** across members for reporting, and (b) examine an **individual** member's data **only with that member's explicit, scoped, revocable consent**, with every access audited. Member trust is the product; access is visible, minimal, and consented — never surveillance.

### Success criteria

1. Each member's data is **private-by-default** and **isolated** — no member can read another's; no admin reads content without consent.  
2. Aggregate reporting operates on **derived metrics / aggregates only** — never raw content — and cannot re-identify small cohorts.  
3. Individual examination requires **explicit, scoped, time-boxed, revocable** member consent and is **fully audited.**  
4. Analytics consent and individual-access consent are **separate, granular, revocable** — never bundled, never coerced.  
5. Members can **view, export, and delete** their own data (data-subject rights).  
6. All data lives in the **FastAPI/MySQL system of record** — no parallel store; Journey **reuses** the existing progress surface, not a copy.

---

## 2. The member data surfaces

| Surface | What it is | Authorship | Default |
|---|---|---|---|
| **Trade Log** | The member's record of trades they took | Member-authored | private |
| **Journal** | The member's process/adherence reflection (calendar-structured) | Member-authored | private |
| **Playbook** | The member's personal setups/rules/strategy, adapted from the method | Member-authored | private |
| **Journey** | The member's progression/engagement record (enrollment, pathway, completion, adherence streaks) | **System-recorded** (derived) | private |

- **DS-1** Trade Log, Journal, Playbook are **authored content**; Journey is **derived/behavioral**.  
- **DS-2** Journey **extends the existing enrollment/progress surface** (P1) — it aggregates and presents it; it does **not** create a second progress store. **Sources of truth:** `enrollments`, `lesson_progress`, and existing member progress APIs per `FatTail-Labs-Progress-Tracking-Spec-v1.0` and enrollment specs — not a `journey_*` copy table.  
- **DS-3** Playbook is on-thesis (the member building *their own* process = capacity over dependency); it is personal, not a re-hosting of course content.

### 2.1 Named consumers (other specs — do not inherit silent defaults)

Specs that store Family B–scoped data must be **named here** so retention, purge, export, and admin access are deliberate — not accidental inheritance of Trade Log defaults.

| Consumer | Source spec | Class | Retention / purge note |
|---|---|---|---|
| **`AttestationRecord`** (live arming ceremony) | [`Strategy-Lab-Process-Runtime-Spec-v1.1.md`](./Strategy-Lab-Process-Runtime-Spec-v1.1.md) §18 | **Legal-evidence** (system-recorded, member-confirmed) | **Does not** follow ordinary authored-content purge by default. Retention may be **longer** than Journal/Trade Log (proof of informed live arming). **Counsel decides** before first production store (**D-7**). Member **export** required; admin read under §4.2 or legal hold only. |
| Strategy Lab decision log / order-intent tags | Process Runtime Spec | Process audit trail | Family B isolation; retention per Process Runtime L-S3 + export path; not a surprise share surface |
| Read-only coach share of strategy card (future) | Versioning recommendations | Consent-gated share | Must use §4.2 individual examination / dedicated consent — never silent Family B leak |

**DS-4** New Family B artifacts (especially legal-evidence) **must** be added to this table before production write.
### Framework mapping

| Surface | Application Framework template (Family B) | Notes |
|---|---|---|
| Trade Log | Trade Log template | Member CRUD; process-first schema (T-D5) |
| Journal | Journal template (Calendar variant) | Member CRUD |
| Playbook | Playbook template | Member CRUD |
| Journey | Journey template | System-derived UI over progress — not a content copy |

---

## 3. Ownership & member rights

- **MR-1** The member owns their data. Private-by-default; no sharing to other members in v1.  
- **MR-2** Members can **view, export, and delete** their **authored** surfaces: Trade Log, Journal, Playbook.  
- **MR-2b Journey:** Members can **view and export** Journey. Journey is **derived** (DS-2); there is no separate Journey row store to delete. Erasure of Journey-visible facts follows **account deletion** and/or deletion rules on underlying progress/enrollment data (Progress + Identity specs) — not a fake “delete journey copy.”  
- **MR-3** Deleting a member's **authored** data removes it from content stores and from **future** aggregates; already-computed aggregates are non-reversible only if already de-identified beyond re-linkage (define retention — D-4).

---

## 4. Admin access — two distinct, separately-consented modes

### 4.1 Aggregate reporting / analytics (the "metadata across all users" ask)

- **AG-1** Operates on **derived metrics and aggregates only** — e.g. adherence rates, completion, engagement, streak distributions. **Never raw entries.** "Metadata" is defined as this derived set (D-1); content is out of scope for this mode entirely.  
- **AG-2** **De-identification + minimum-cohort guard:** no aggregate may be small enough to single out an individual (a k-anonymity-style floor; **threshold = D-2**). No back-door re-identification by combining narrow filters.  
- **AG-3** Purpose-limited to product/education analysis. **Members are notified**, and analytics participation is governed by its **own consent/opt-out** (D-3), separate from §4.2.  
- **AG-4** Aggregate outputs are **internal analysis.** Any externally-facing metric obeys invariant #8 — **process outcomes only, never profit claims.** Aggregate P&L is **not** a marketing surface. (Sierra + Hotel gate.)

### 4.2 Individual examination (the "with a user's permission" ask)

- **IN-1** Reading a specific member's content requires that member's **explicit, informed consent**, granted per request — **scoped** (which surfaces), **time-boxed** (expires), and **revocable at any time.**  
- **IN-2** The **admin cannot self-authorize.** Consent is a recorded member action, not an admin setting. No standing/blanket admin read of member content.  
- **IN-3** **Every access is audited:** who accessed, which member, which surfaces, when, under which consent grant. The audit log is append-only and reviewable.  
- **IN-4** Consent for individual examination is **separate** from analytics consent (§4.1) and from ToS acceptance. Bundling or pre-checking is prohibited (dark-pattern; Tango).  
- **IN-5** Scope is minimal: consent to show a coach your Journal does not expose your Trade Log.

---

## 5. Consent model

- **CN-1** Consent is **granular** (per surface, per purpose), **revocable**, and **logged** with timestamp + scope.  
- **CN-2** Two independent consent tracks: **analytics/aggregate** (§4.1) and **individual examination** (§4.2). Neither implies the other.  
- **CN-3** Consent requests are plain-language, non-coercive, and never a precondition for using the tool itself (you can journal privately without consenting to anything).  
- **CN-4** Revocation is immediate and ends future access; the audit trail of prior consented access is retained (integrity).

---

## 6. Privacy-by-design principles (Mike gate)

- **PD-1 Data minimization** — collect/derive only what a stated purpose needs.  
- **PD-2 Purpose limitation** — analytics data is not repurposed for individual profiling.  
- **PD-3 Per-user isolation** — every read is authorized against the requesting identity; a member can never reach another member's data; admin content reads only via §4.2.  
- **PD-3b Isolation key** — member content and progress rows are scoped by Labs **`identity_id`** (same key as `lesson_progress` and session identity). Provider-local IDs are never the isolation primary key.  
- **PD-4 Storage limitation / retention** — define retention for content, aggregates, and audit logs (D-4).  
- **PD-5 Encryption at rest** for personal content (posture — D-5).  
- **PD-6 Audit integrity** — access and consent logs are append-only and tamper-evident.  
- **PD-7 Fail loud** — an access without a valid, in-scope, unexpired consent is denied with a reason; never a silent allow (config/auth doctrine: fail loud).  
- **PD-8 No admin back door** — Course Family A edit mode, `/admin/*` boards, support tools, and DB admin convenience **do not** authorize reading Family B raw content. Only §4.1 (aggregates) or §4.2 (consented examination) may surface member tool data to operators.

---

## 7. Doctrine & trust (Tango + Hotel)

- **TR-1** This surface **is** the member-trust promise. Consent visible, access minimal and logged — the opposite of a surveillance product. A bleeding trader must feel their honest, ugly journal is *safe*, or they won't write it honestly, and the tool loses all value.  
- **TR-2** Reporting and any tool copy stay **process-first**: adherence, plan-vs-execution, discipline — not profit celebration. Trade Log / Journal schema default to process fields with P&L as one neutral field (Application Framework T-D5 / process-not-P&L).  
- **TR-3** No leaderboards, no member-visible comparisons in v1 — comparison surfaces manufacture the status dynamics that fight capacity-over-dependency.

---

## 8. Legal posture (flag, not legal advice)

This is **personal data**, and trade/behavioral records are arguably **sensitive**. Personal data + analytics + third-party (admin) access implicates data-protection principles (lawful basis, purpose limitation, data minimization, consent, subject access/erasure). **Recommend counsel review and a DPIA before build**, and that privacy notice + consent language be written or reviewed by counsel. Written here as principles because the design must satisfy them regardless of jurisdiction; the specifics are counsel's call, not this spec's.

---

## 9. Decisions required (land in the decision log on approval)

| ID | Decision | Owner |
|---|---|---|
| **D-1** | Precise definition of analytics "metadata" (the derived-metric allowlist; content excluded) | India + Mike + Hotel |
| **D-2** | Minimum-cohort threshold for aggregates (re-identification floor) | Mike |
| **D-3** | Analytics consent/opt-out mechanism (separate from individual-access consent) | Mike + Tango |
| **D-4** | Retention for content, aggregates, and audit logs | Mike + India |
| **D-5** | Encryption-at-rest posture for member content | Mike + Foxtrot |
| **D-6** | Whether Journey exposes any member-visible gamified streaks (wellbeing check) | Tango |
| **D-7** | **AttestationRecord** retention vs member purge / account deletion (legal-evidence of live arming) — may exceed ordinary content retention | **Counsel** + Mike + India (before first live attestation stored) |

---

## 10. Open actions before implementation

| ID | Action |
|---|---|
| **A-1** | Map Journey onto the **existing** enrollment/progress data — reuse, don't duplicate (no second store of truth). |
| **A-2** | Author the **data model** for Trade Log, Journal, Playbook (entities, per-user keys, isolation) — blocks build. |
| **A-3** | Design the **consent + audit** tables/flows (grant, scope, expiry, revoke, access log). |
| **A-4** | Confirm **entitlements**: which plans unlock which member tools (pillar 5 / Application Framework T-A4). |
| **A-5** | Draft privacy notice + consent copy for counsel review (§8). |

---

## 11. Definition of done

- [ ] Change declared and approved before implementation  
- [ ] Per-user isolation verified live: two members cannot read each other's data (curl as each)  
- [ ] Individual admin read **denied without** a valid, in-scope, unexpired consent; **allowed with**; both **audited** (show the log)  
- [ ] Aggregate endpoint returns **no raw content** and enforces the minimum-cohort floor (test with a tiny cohort → suppressed)  
- [ ] Analytics consent and individual-access consent are **separate**, revocable; revocation ends access  
- [ ] Member export + delete work; delete removes from future aggregates  
- [ ] No externally-facing profit-claim metric (Sierra + Hotel signed)  
- [ ] Journey reuses existing progress surface; no parallel store; no MSC imports; no hardcoded IDs/hosts  
- [ ] Characterization tests added (isolation, consent gating, audit, cohort floor); suite green  
- [ ] Decision-log entries landed same day (D-1..D-6); data-model + consent/audit specs landed (A-2/A-3)  
- [ ] Legal review / DPIA status recorded (§8)  
- [ ] `docs/ADMIN-GUIDE.md` updated (reporting + the consent-gated examination procedure)  
- [ ] Application Framework Family B references this spec as privacy authority  

---

## 12. Layer placement (with Application Framework)

```
L4 Application Templates (Family B tools)
L3 HIG
L2 Component Contract (tool entry components)
L1 Display–Edit Mode (Family B = member CRUD path)
L0 System of record + **THIS SPEC** (isolation, consent, admin access, aggregates)
```

Admin **content** edit (Family A) remains Application Framework + In-Place Admin.  
Admin **member-data** access is **only** §4.1 aggregates or §4.2 consented examination — never silent read of private journals via course admin tools.

---

*DRAFT v0.1 — proposal only. No authority until Coach approves and Lima logs the decision(s). Not legal advice. Where it conflicts with a pillar or the decision log, the source wins and this draft is the bug.*
