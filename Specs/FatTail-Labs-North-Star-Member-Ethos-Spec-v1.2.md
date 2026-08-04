# FatTail Labs — North Star & Member Ethos Spec v1.2

**Status:** **BUILD AUTHORITY** (Coach 2026-08-03; v1.2 distress/register/privacy)  
**Supersedes:** v1.1 (and v1.0 historical)  
**Decision log:** DL-209 · DL-210 · **DL-211**  
**Parents:** Journal Session · Member Data Privacy · Hard · Coach Content Law  

**Review gates:** Hotel (§7 priors) · Tango (register + distress copy) · Mike (Family B LLM opt-in)

---

## 1. North star

> **FatTail Labs exists to help traders become enlightened.**

Secular: present, aware, integrated; habit-engineered cessation; toughness as enabler.  
Capital: **stop the bleeding** — process outcomes, never profit claims.

---

## 2–4. Roots, life practice OS, methodology layers

Unchanged in spirit from v1.1 (ensō/swoosh, 4-truth shape, habit machine, Habit Catalog as methodology).  

**Truth 1:** struggle when present **or** explicit nothing-hard — manufacturing struggle is a **spec violation**.

---

## 5. Member AI ethos

### 5.1 Composition + fallback

**Code:** `server/labs_member_ai_ethos.py` · **ID:** `LABS_MEMBER_AI_ETHOS_V1_2`  
Any wording edit bumps id + Spec patch + DL.

```text
LABS_MEMBER_AI_ETHOS_MODE=on  → composed = ethos + surface role
LABS_MEMBER_AI_ETHOS_MODE=off → surface role only
```

### 5.2 Ethos content requirements

1–8 as v1.1 (north star, qualitative world model, process stance, habit machine, toughness, no proselytize, bans override).

**9. Distress (hard-ban class — code guardrail, not ethos-only)**  

| Rule | |
|------|--|
| **Target test** | Gate on metaphor **aimed at the self** (self-harm, suicide, no will to live) — **not** vocabulary intensity |
| **Trading vernacular** | Does **not** fire on position/P&L compression: e.g. trade killed me, blew up, slaughtered, dead in the water, account bled out, **suicide spread**, stop the bleeding |
| **Limitation** | Flat crisis without self-harm keywords may be missed; prefer false negative on vernacular over constant false positive |
| **Enforcement** | **Code** in Journal agent path — **independent of `LABS_MEMBER_AI_ETHOS_MODE`** (gate stays on when ethos off) |
| **After stop** | Session **stays open**. Member may keep writing. Gate re-evaluates **each turn**. Non-distress turns resume normal agent behavior. No day-long lockout |
| **Support paths (named only)** | (1) Free writing in journal; (2) US **988** Suicide & Crisis Lifeline; (3) **https://www.iasp.info/suicidalthoughts/** for local resources; (4) Labs membership/product support is **not** crisis care — do not route crisis to founder unstructured |
| **AI role** | Not a crisis counselor; no therapy; no trading advice in the hold |

### 5.3 Language register (agent output only)

| Setting | Meaning |
|---------|---------|
| `plain` | **Default.** Process/survival doctrine; low combat-guru register |
| `vernacular` | Mild trading idiom OK in agent speech |
| `mirror` | Reflect member idiom for rapport — **suspended when distress gate fires** |

| Applies to | Does not apply to |
|------------|-------------------|
| Agent / system copy generation | **Member input** — never censor journal capture (CJ-1) |
| Optional future retro/Journey **system** chrome (Tango) | Doctrine thesis “stop the bleeding” (stays) |

**Hard rule:** Register **never** modulates the distress gate. Intensity dial ≠ smarter classifier.

**Compression vs identification:**  
- Compression: “that trade killed me” → process journal continues.  
- Identification: self-harm / suicide aimed at person → stop interview.

### 5.4 Code guardrails

Journal validator bans unchanged.  
Distress path in `journal_session_agent` always active.  
Validator is not the distress classifier (separate).

### 5.5 Versioning

Any ethos wording change → new id. MODE=off does not disable distress.

### 5.6 Family B → LLM

| Rule | v1.2 |
|------|------|
| **Default** | Journal **agent LLM is opt-in** (affirmative enable), not silent opt-out default, for Family B content |
| Purpose / minimize / export-purge / no training-on-customer unless DPA+notice | As v1.1 |
| Plain-text journal without agent | Always primary; never requires LLM |

Implementation of opt-in flag may land with Journal profile settings; Spec is binding.

### 5.7 Model-in-the-loop eval (non-blocking CI)

| Eval | Cadence |
|------|---------|
| Composed prompt still contains surface bans | CI (string / unit) |
| Validator rejects advice/motive samples | CI |
| Vernacular corpus does **not** fire distress; self-harm corpus **does** | CI |
| Live model: member fishes for advice → no advice under composed prompt | **Scheduled** eval (not blocking every CI) — Kilo owns harness later |

---

## 6–7. Non-AI surfaces · Trading priors

§7 numbers remain **qualitative in LLM body**.  
`world_model_priors_for_hotel()` holds dated Coach priors with `hotel_status=pending_ratification` — **not** consumed by product APIs or prompts until Hotel ratifies.

---

## 8. Acceptance criteria (v1.2)

1. Spec v1.2 + DL-211.  
2. Ethos id `LABS_MEMBER_AI_ETHOS_V1_2`; MODE=off fallback for compose only.  
3. Distress gate fires on self-harm corpus; **does not** fire on trading-vernacular corpus (tests).  
4. Distress with `LABS_MEMBER_AI_ETHOS_MODE=off` still stops interview.  
5. After distress_hold, session remains usable (documented + no lock flag).  
6. DISTRESS_ACK names 988 + IASP; no founder crisis routing.  
7. Register design documented; default plain; mirror off under distress.  
8. Priors not in prompt body; hold until Hotel.  
9. Family B LLM **opt-in** documented as default policy.

---

## 9. Non-goals

- Meter that dials **member** vocabulary  
- AI as licensed crisis care  
- Blocking CI on live LLM eval day one  
- Shipping unratified % into member-facing APIs  

---

## 10. Follow-ons

- Hotel §7 ratification  
- Profile field `language_register`  
- Journal agent opt-in UX  
- Scheduled model-in-the-loop eval  
- Habit Catalog Spec (separate)  
