# FatTail Labs — North Star & Member Ethos Spec v1.0

**Status:** **SUPERSEDED** by `FatTail-Labs-North-Star-Member-Ethos-Spec-v1.1.md` (2026-08-03 · DL-210)  
**Historical:** First BUILD AUTHORITY stamp 2026-08-03 · DL-209  

---

> **Do not implement from this file.** Use **v1.1**.

---

## 1. North star

> **FatTail Labs exists to help traders become enlightened.**

**Enlightened** here is **secular and universal** (compatible with all faiths and with none):

| Means | Does not mean |
|-------|----------------|
| **Present, aware, integrated** with life and trading methodology | Mystical conversion or required Buddhist identity |
| Clear seeing of how markets and practice actually work | Guaranteed profit or “never lose” |
| Destructive loops **discoverable, engineered away, manifested** as new habits | Pep talk without behavior change |
| **Tough** — antifragile in body, mind, and spirit by choice | Shame, weakness theater, or dependency on an AI guru |

**Capital expression** (unchanged): **stop the bleeding** — process outcomes, capital preservation, capacity over dependency.  
**Human expression:** enlightenment-as-practice. Apps serve both.

---

## 2. Roots (brand + epistemology)

| Root | Emblem / idea |
|------|----------------|
| **0DTE parent** | Zen **ensō** — impermanence, continuous improvement, stewards of constant change (`0-dte.com`) |
| **FatTail** | Zen-ink **swoosh** — **right-skewed, long, fat-tailed** distribution — **how the world evolves** |
| **Fractals** | Same family of risk/opportunity at every scale; choose a fractal to play |
| **Randomness** | Day close ≈ near coin flip (~48.5/51.5 long-run up bias); clusters + macro noise |
| **Black Swans** | Exist at every fractal; **plan for them at the fractal you play** |
| **Antifragility** | Stress → see gap → replace habit → stronger methodology |
| **Toughness** | Core **enabler** — we are not weak; we **choose** antifragile body, mind, spirit |

These roots inform product copy, curriculum tone, and **all member-facing AI**.

---

## 3. Life practice OS (above methodology)

Above tags (lexicon) and habits (methodology) sits **life practice**:

### 3.1 Four Noble Truths as practice shape (not creed)

| # | Plain truth | Labs / trading | Retrospective |
|---|-------------|----------------|---------------|
| **1** | Struggle is real | Fear, drawdowns, broken process, life load | Inventory of what was hard / diverged |
| **2** | Struggle has causes | Clinging to outcome, haphazard size, oblivion, skipped map | Member **names** the cause — system does not diagnose character |
| **3** | Cessation is **discoverable, engineered, manifested** | New habit **replaces** old via habit-building machine | One checkable replacement; keep-rate verifies |
| **4** | There is a path | Daily A/E/R · weekly retro · monthly wrap · life · toughness | Commitments and next conduct |

### 3.2 Habit-building machine (Truth 3)

```text
discover → design replacement → install (active habit) →
evidence (journal) → verify (next retro) → strengthen
```

Max focus (e.g. ≤2 active habit plans) remains a feature.

### 3.3 Eightfold path (conduct map — optional teaching layer)

Right view / intention / speech / action / livelihood / effort / mindfulness / concentration  
map to clear game model, process intent, honest journal, execution habits, survivable size, maintain/improve routines, presence, focused analysis — **without** requiring religious framing in UI.

---

## 4. Methodology layers (product map)

```text
NORTH STAR — enlightenment-as-practice
    LIFE PRACTICE OS — 4 truths · path · toughness
        METHODOLOGY — Habit / Routines Catalog (future + present habits)
            LEXICON — Tags
            INSTRUMENTS — Journal · Retro · Trade Log · Size/DD · Hard · Journey …
```

| Layer | Job |
|-------|-----|
| **Habit Catalog** (Practice app; name may evolve) | First-class habits nested under Analysis / Execution / Reflection / weekly / monthly / risk / toughness / life — **present, aware, integrated** (opposite of oblivious) |
| **Journal** | Daily evidence of Analysis · Execution · Reflection |
| **Retrospective** | Weekly: coverage gaps (“should be in the journal”), consistency nudges, multi-period patterns, habit machine |
| **Insight plane** (future) | Metrics/trends behind the scenes → tools that **emerge** into Journal and Retro |

**Law:** If a first-class habit is missing from the record → retro: should be there.  
If present but not exploited consistently → retro: nudge (checkable replacement).

---

## 5. Member AI ethos (normative for all member-facing AI)

### 5.1 Single constant

**Code:** `server/labs_member_ai_ethos.py`  
**ID:** `LABS_MEMBER_AI_ETHOS_V1`  
**Composition:** Every member-facing LLM (and documented local-agent stance) **prepends** this ethos to the surface role prompt.

```text
composed_system = LABS_MEMBER_AI_ETHOS_V1 + "\n\n" + SURFACE_ROLE_PROMPT
```

Surface role prompts **retain** their hard bans (Journal interviewer rules, Retro sequence keeper rules).  
**Hard bans and code guardrails win** over any ethos interpretation that would create advice, diagnosis, evaluation, or proselytizing.

### 5.2 Ethos content requirements

The constant MUST encode:

1. North star (enlightenment-as-practice, secular)  
2. World model (fat tails, right skew, fractals, randomness, Swan at chosen fractal)  
3. Play what the market gives; process over P&L theater  
4. Stance: inventory, specificity, member judgment; capacity over dependency  
5. Habit machine framing (replacement, not pep talk)  
6. Toughness as capacity, never shame  
7. No proselytizing; multi-faith / secular OK  
8. Explicit: surface bans below override ethos  

### 5.3 Surfaces in scope (v1.0)

| Surface | Wire |
|---------|------|
| **Journal session agent** (LLM + documented stance) | Composed system prompt |
| **Retrospective sequence agent** | Ethos stamp on sequence guide; stance in role docs; future LLM path uses compose |
| **Future:** Habit Catalog AI, other member copilots | Must import `compose_member_system_prompt` |

**Out of scope for ethos prepend (v1.0):** Admin Process Co-pilot, blueprint November, internal ops agents — they keep production-board doctrine separately (process outcomes, no profit guarantees) and may reference north star in a later revision.

### 5.4 Code guardrails (unchanged duties)

Journal and Retro **code** bans remain authoritative (no motive-naming, no advice, no P&L in process copy, one question, etc.). Ethos does not weaken them.

### 5.5 Versioning

- Ethos ID stamped on agent responses where prompt version is already stamped (`ethos_id`, `prompt_version`).  
- Breaking ethos changes → new `LABS_MEMBER_AI_ETHOS_V2` + Spec bump + DL entry.

---

## 6. Non-AI doctrine surfaces (north star in the app)

The north star is not only an AI preamble. Ship and maintain:

| Surface | How doctrine appears |
|---------|----------------------|
| **CLAUDE.md / agent doctrine** | Positioning + pointer to this Spec |
| **Member Guide** | Short “Why we practice” / north star section; Journal & Retro copy aligned |
| **Retrospective UI** | Ceremony already maps to four-truth shape; copy stays inventory-first |
| **Toughness / Hard** | Linked as core enabler of antifragile path |
| **Journey / meters** | Health of practice string — not moral score of the person |
| **Marketing / pathway** | Stop the bleeding + process outcomes; enlightenment as capacity language, never profit claim |
| **Habit Catalog (future)** | Value-first UX; post-retro install; proof of coverage/consistency |
| **Brand** | Ensō + FatTail swoosh meanings preserved in brand notes |

---

## 7. Trading process truths (for ethos world-model — summary)

Documented so product and AI stay aligned (full trading craft lives in curriculum/playbook):

- Day direction long-run ~48.5/51.5; still effectively near coin flip for single days  
- Win rate often ~45–55%; edge often **magnitude / location / geometry**, not hit rate  
- With-trend average move size > counter-trend (small edge); entry: pullback/pullup into structure → continuation  
- Liquidity structure **strongly influences** path regime (not controls); nodes/wells/crevasses  
- EM exceedance band ~12.5–35% (clustered); width/size risk-adjust with vol  
- VIX playbook = exposure/strategy type; structure map = positioning  

AI **does not lecture** these unprompted; it **assumes** this world when probing absences (size, invalidation, structure in member’s words).

---

## 8. Acceptance criteria (v1.0)

1. Spec landed; DL-209 logged.  
2. `labs_member_ai_ethos.py` ships `LABS_MEMBER_AI_ETHOS_V1` + `compose_member_system_prompt`.  
3. Journal LLM path uses composed system prompt; local mode documents ethos stance; status exposes `ethos_id`.  
4. Retro sequence guide payload includes `ethos_id` / stance pointer.  
5. Characterization tests for compose + journal prompt constants.  
6. Guide includes north-star section; CLAUDE.md points at Spec.  
7. Guardrail tests still green (no advice/motive regressions).

---

## 9. Non-goals (v1.0)

- Full Habit Catalog product (Spec later)  
- Full insight/metrics plane  
- Changing retro ceremony step count  
- Religious UI chrome or mandatory dharma vocabulary in member copy  
- Weakening Journal “interviewer not coach” rules  

---

## 10. Open follow-ons

- Habit Catalog Spec (methodology tree + value-first UX)  
- Insight plane Spec (metrics → Journal/Retro tools)  
- Admin agents optional ethos lite  
- Hotel/Tango formal review of member-facing ethos wording (may amend V1 → V1.1)  
