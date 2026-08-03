# FatTail Labs — North Star & Member Ethos Spec v1.1

**Status:** **BUILD AUTHORITY** (Coach 2026-08-03; **v1.1** review fixes same day)  
**Supersedes:** `FatTail-Labs-North-Star-Member-Ethos-Spec-v1.0.md` (v1.0 remains historical)  
**Product:** FatTail Labs (`labs.fattail.ai`) — subsidiary practice OS of **0DTE** (`0-dte.com`)  
**Decision log:** DL-209 (GO) · **DL-210** (v1.1 completeness)  
**Parents:** Journal Session Spec · Journal Retrospective Spec · Member Data Privacy · Hard Mental Toughness · Coach Content Law  

**Review gates (substance):** Hotel (trading priors §7) · Tango (member wording, distress, capacity) · Mike (LLM Family B §5.6) — may amend wording without reversing north star.

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
| **0DTE parent** | Zen **ensō** — impermanence, continuous improvement, stewards of constant change |
| **FatTail** | Zen-ink **swoosh** — **right-skewed, long, fat-tailed** distribution — how the world evolves |
| **Fractals** | Same family of risk/opportunity at every scale; choose a fractal to play |
| **Randomness** | Day close near coin flip long-run (slight upside bias); clusters + macro noise — **priors dated in §7** |
| **Black Swans** | Exist at every fractal; plan for them at the fractal you play |
| **Antifragility** | Stress → see gap → replace habit → stronger methodology |
| **Toughness** | Core **enabler** — we choose antifragile body, mind, spirit |

---

## 3. Life practice OS

### 3.1 Four Noble Truths as practice shape (not creed)

| # | Plain truth | Labs / trading | Retrospective |
|---|-------------|----------------|---------------|
| **1** | Struggle is real **when it is** | Fear, drawdowns, broken process, life load — **or a quiet/steady period** | Inventory of what was hard **or** explicit **“nothing hard this period”** (valid; do not manufacture struggle) |
| **2** | Struggle has causes (when present) | Clinging, haphazard size, oblivion, skipped map | Member **names** the cause — system does not diagnose character |
| **3** | Cessation is **discoverable, engineered, manifested** | New habit replaces old via habit machine | One checkable replacement; keep-rate verifies |
| **4** | There is a path | Daily A/E/R · weekly retro · monthly wrap · life · toughness | Commitments and next conduct |

**Truth 1 branch — nothing hard:** A period with no material struggle is **valid**. Ceremony uses **“nothing here”** / steady readings. Manufacturing obstacles to “complete” the form is a **spec violation**.

### 3.2 Habit-building machine (Truth 3)

```text
discover → design replacement → install → evidence (journal) → verify (retro) → strengthen
```

### 3.3 Eightfold path — optional teaching layer (no required religious UI)

---

## 4. Methodology layers

```text
NORTH STAR → LIFE PRACTICE OS → METHODOLOGY (Habit Catalog)
  → LEXICON (Tags) → INSTRUMENTS (Journal · Retro · Trade Log · Hard · …)
```

**Law:** Missing first-class habit evidence → should be in the record. Inconsistent exploitation → nudge. Multi-period before asserting patterns.

---

## 5. Member AI ethos

### 5.1 Single constant + composition

**Code:** `server/labs_member_ai_ethos.py`  
**ID:** `LABS_MEMBER_AI_ETHOS_V1_1` (any wording edit **must** bump id — §5.5)  

```text
composed_system = ethos_body + "\n\n" + SURFACE_ROLE_PROMPT
# unless LABS_MEMBER_AI_ETHOS_MODE=off → surface role only (production fallback)
```

Hard bans and **code** guardrails **win** over ethos interpretation.

### 5.2 Ethos content requirements

The constant MUST encode:

1. North star (enlightenment-as-practice, secular)  
2. World model (qualitative fat tails, skew, fractals, randomness, Swan) — **not** unsourced percentages in the LLM body (§7)  
3. Play what the market gives; process over P&L theater  
4. Stance: inventory, specificity, member judgment; capacity over dependency  
5. Habit machine framing (replacement, not pep talk)  
6. Toughness as capacity, never shame  
7. No proselytizing; multi-faith / secular OK  
8. Explicit: surface bans + code guardrails override ethos  
9. **Distress case (hard-ban class):** If the member shows genuine acute distress, crisis, or self-harm language — **stop the interview**. No further absence probes, no cause-mining, no “one more process question,” no trading advice. Acknowledge briefly, invite plain-text or human support paths the product already allows, and **do not** continue the ceremony of inventory. **Code MUST enforce** stop-interview when distress heuristics fire; ethos alone is insufficient.  

### 5.3 Surfaces in scope

| Surface | Wire |
|---------|------|
| Journal session agent | Composed system + **code distress gate** before LLM/local probes |
| Retrospective sequence agent | Ethos stamp + stance; Truth 1 empty branch already via nothing-here |
| Future member copilots | `compose_member_system_prompt` + distress rules where conversational |

Out of scope v1.1: Admin Process Co-pilot, blueprint agents (optional later).

### 5.4 Code guardrails

Journal validator bans (motive, advice, praise/blame, P&L, meters, multi-q, chart claims, etc.) remain authoritative.  
**New:** distress stop-interview path in `journal_session_agent` (no probe, fixed safe acknowledgment).  
Retro: no manufacturing struggle when inventory empty (existing nothing-here).

### 5.5 Versioning and fallback

| Rule | |
|------|--|
| **Any** ethos wording change | New id (`…_V1_2`, …) + Spec patch or minor + DL line — not only “breaking” changes |
| **Production regression** | Env `LABS_MEMBER_AI_ETHOS_MODE=off` → bare surface role prompt only; stamp `ethos_id=off` |
| Stamp | `ethos_id` on agent status / sequence guide |

### 5.6 Family B → LLM (privacy terms)

Journal (and any member transcript) is **Family B** (Member Data Privacy Spec).

| Rule | Requirement |
|------|-------------|
| **Lawful processing** | Agent/LLM turns only when product mode is on **and** member invokes agent path (or product-documented default with notice). Plain-text journal without agent remains primary. |
| **Purpose limitation** | Provider may process turn content **only** to generate the agent reply for that session. No training-on-customer-data claim unless contract + notice say so (configure provider accordingly). |
| **Provider** | Fail-loud AI config (`ai/config`); current stack documents xAI/Grok path when `LABS_JOURNAL_AGENT_MODE=llm`. Keys never in prompts. |
| **Minimization** | Send transcript window + structured absences needed for the turn — not full career history by default. |
| **Retention** | Labs stores member/agent messages in DB (exportable). Provider retention per vendor DPA; minimize logging of full prompts in Labs ops. |
| **Export / purge** | Agent messages and session text remain in Practice export/purge scope (Journal Session + Portability specs). Ethos does not create a second store. |
| **Consent / notice** | Privacy notice must disclose that optional journal agent sends conversation content to an AI processor. Mike + counsel for production notice copy. |
| **Distress** | Stop-interview still stores only the brief acknowledgment; do not escalate content to extra processors. |

---

## 6. Non-AI doctrine surfaces

| Surface | How doctrine appears |
|---------|----------------------|
| CLAUDE.md / bench doctrine | North star + Spec pointer |
| Member Guide | “Why we practice”; Journal/Retro aligned |
| Retrospective UI | Four-truth **shape**; nothing-here when quiet |
| Toughness / Hard | Core enabler |
| Journey | Practice health, not moral score |
| Marketing | Stop the bleeding; no profit claims |
| Habit Catalog (future) | Value-first UX |
| Brand | Ensō + swoosh meanings |

---

## 7. Trading process priors (world model — sourced, dated)

**LLM ethos body uses qualitative language only** (near coin-flip days, win rate often near half, exceedances uncommon but clustered).  
**Exact bands** live in code as `WORLD_MODEL_PRIORS` for product/docs — **not** asserted to members by AI unless the member stated them.

| Prior | Approx. value | Source | As-of | Review |
|-------|---------------|--------|-------|--------|
| Day close up/down long-run | ~48.5% down / ~51.5% up (near coin flip + slight up bias) | Coach product prior (long-term distribution analysis stated 2026-08-03); **Hotel to ratify or replace with published series** | 2026-08-03 | **≤12 months** or regime note |
| Typical process win rate band | ~45–55% | Coach craft prior (collector / with-trend magnitude edge) 2026-08-03; not a grade target | 2026-08-03 | ≤12 months |
| Expected-move exceedance | ~12.5–35% of days (clustered) | Coach empirical band + `expected-move.png` product artifact; Hotel/research to refine | 2026-08-03 | ≤12 months |
| With-trend magnitude edge | Avg with-trend move > counter-trend (small) | Coach strategy prior 2026-08-03 | 2026-08-03 | with playbook |

**Invariant:** Unsourced numbers must not enter production AI system prompts.  
**Cadence:** Review §7 at least annually or when Hotel issues a new series; bump prior `as_of` and Spec patch.

Qualitative truths (no % required): liquidity **strongly influences** path; VIX playbook = exposure; structure map = positioning; plan for Swan at chosen fractal.

---

## 8. Acceptance criteria (v1.1)

1. Spec v1.1 + DL-210.  
2. `LABS_MEMBER_AI_ETHOS_V1_1` + compose + `LABS_MEMBER_AI_ETHOS_MODE` fallback.  
3. Journal LLM uses compose; status exposes `ethos_id`.  
4. Retro sequence guide stamps ethos.  
5. **Behavioral guardrail eval:** composed prompt still contains surface bans; sample **violating** agent outputs still fail `validate_agent_turn`; distress input → **no** absence probe / interview continues.  
6. Guide + CLAUDE.md current.  
7. Existing journal/retro guardrail tests green.  
8. §7 priors table present with source + as_of + review; LLM ethos body has **no** bare 48.5/51.5 or 12.5–35% strings.  
9. §5.6 privacy terms for Family B → LLM documented.

---

## 9. Non-goals

- Full Habit Catalog product  
- Full insight plane  
- Changing retro step count  
- Required religious UI  
- Weakening interviewer-not-coach rules  
- AI as crisis counselor or licensed care (distress = **stop interview**, not treat)

---

## 10. Follow-ons

- Habit Catalog Spec  
- Insight plane Spec  
- Hotel ratification of §7 series  
- Tango pass on distress copy  
- Mike/counsel privacy notice for journal agent  
- Admin agents optional ethos lite  
