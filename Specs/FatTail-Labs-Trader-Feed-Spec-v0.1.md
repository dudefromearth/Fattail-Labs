# FatTail Labs — Trader Feed Spec v0.1

**Status:** DRAFT — Coach 2026-08-21. **v0.1.3** product renamed **Trader Feed** (**TF**) — Coach: “Yes rename it.” (**DL-517** · **OD-FN-10** adopted). Former spec name **Feature Narrative** (**FN**) through v0.1.2. **v0.1.2** market-, position-, and trader-aware **continuous narrative**; customized **per venue**; same **base market info** (**DL-516**). **v0.1.1** per-host **instructions prompt**; **continuous scroll** of **timestamped posts**; Journal-shaped, **generalized**. A Labs-wide **floating Narrative** for **trader review**. **Replaces** the T Ortho narrative box. **Supplements** Algo Alert. **May be used** in other FatTail Labs features. Not BUILD AUTHORITY until Coach Phase 5.  
**Type:** Product Spec — Labs **chrome primitive** (host features supply context).  
**Short name:** **TF**  
**Product name:** **Trader Feed**  
**Former name:** Feature Narrative (**FN**) through v0.1.2  
**Hosts (v0.1):** Surface **T Ortho** (`/app/options-lab/surface`) · Analyzer **Algo Reason** (`/app/options-lab/analyzer`) · other Labs features later  
**Filename:** `FatTail-Labs-Trader-Feed-Spec-v0.1.md`

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [HI Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dark work-surface **tokens**. No raw hex. Floatable `Modal` dialect (no scrim — same family as Alert Builder / Position Builder). |
| [OT-EF](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · **DL-309** | Representable or **named state**. Never invent strikes, IV, debit, or package marks in the body. |
| [Keep-Warm v0.1.2](./FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md) | Last paint · Working / Away / Idle. Idle = no heavy resolve. |
| Arch **28** | One market WebSocket. No client Massive. |
| North Star v1.2 · doctrine learner-capacity | **Sacred Invariant #8** — Labs copy is process outcomes, **never profit claims**. |
| [AZ-ALGO](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) | **Algo host.** Trail, Reason, house base, voices, mount law. TF does not own the algo. |
| [OL-TO](./FatTail-Labs-Options-Lab-Surface-T-Ortho-Spec-v0.1.md) | **T Ortho host.** Observation-only squawk (Journal-agent boundary). TF does not own the contour. |
| [AZ-ALB](./FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) | Floatable grammar reference (no scrim, drag header, canvas live). TF is **not** the Alert Builder. |
| [Journal Session Spec v0.6](./FatTail-Labs-Journal-Session-Spec-v0.6.md) | **Shape parent** for the tape (bounded scroll, timestamped posts, instruction prompt). **Not** the Journal product (no calendar, week map, retrospective, composer-as-record). T Ortho **boundary** still: observation, never “what to do.” |

**Does not:** implementation plan · a bench board until Phase 5 · merge Algo trail eval into Surface · merge T Ortho observation into Algo · import `TimeOrthoEggPanel` as law · a second market WebSocket · client Massive · Tradier / flatten · profit-claim copy · unconstrained chat (**FI-032**).

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Risk language may not promote an advisory into a constraint. Coach Content Law: nothing in §0 is removed.

---

## 0. Coach intent (do not drop)

**New feature (2026-08-21, verbatim):**

> So, this is a new feature I am proposing. It will take the place of the narrative box in T Ortho, and it will supplement the Algo Alert feature, and it may be used in other geatures throughout FatTail Labs.

**Job and awareness (2026-08-21, verbatim — do not drop · also DL-513):**

> Both of these features are to feed a floating Narrative for trader review

> So, the Narrative is feature-specific and contectually aware including aware of the trader and their current position(s) they are examining

**Seating of those two quotes (Juliet — Coach may discard):**

| Quote | Seat |
|-------|------|
| Floating Narrative for **trader review** | **IN-SCOPE** — this is the job of **Trader Feed** (formerly Feature Narrative) |
| Feature-specific · contextually aware of **this trader** and the **position(s) they are examining** | **IN-SCOPE** — awareness law (§4) |
| **Takes the place of** the narrative box in T Ortho | **IN-SCOPE** — T Ortho host; egg narrative pane is superseded |
| **Supplements** the Algo Alert feature | **IN-SCOPE** — Algo still owns trail / Reason / knobs / HUD; TF is the viewport Reason feeds |
| **May be used** in other FatTail Labs features | **IN-SCOPE as reuse law** (§3.3). Catalog of *which* next hosts is **FLAGGED** (**FI-038**) |

**Tape and prompt (2026-08-21, verbatim — do not drop · DL-515):**

> Each place the feature is employed, it will have an instructions prompt to follow. The narrative will be a continuous scroll, so the user can view older posts. The posts will be timestamped. This feature is very similar to the Jounaling feature. But it is generalized

**Seating of that quote (Juliet — Coach may discard):**

| Quote | Seat |
|-------|------|
| Each employment has an **instructions prompt** to follow | **IN-SCOPE** — required on every host pack (§6). Algo house base **is** that prompt; T Ortho now has one too (**OD-FN-2** closed as adopted). “Instructions” = **what the narrative follows**, not “what the trader should do.” |
| **Continuous scroll** so the user can view **older posts** | **IN-SCOPE** — Journal-shaped tape (§5.1). Bounded region; older posts remain; member can scroll up. |
| Posts are **timestamped** | **IN-SCOPE** — visible stamp on every post, not a hover (§5.1). |
| **Very similar to Journaling**, but **generalized** | **IN-SCOPE as shape** — Journal Session Spec v0.6 §1.4 / §8.3 is the proven tape + prompt. TF does **not** replace Journal. Calendar, week map, retrospective, tags, uploads, composer-as-the-record stay **out** unless a host declares them. |

**Trader Feed (2026-08-21, verbatim — do not drop · DL-516):**

> One of my members referred to this feature as the trader feed. A merket and position and trader aware contrinuous narrative. It is customized per venue. But largely based on the same base market info.

**Seating of that quote (Juliet — Coach may discard):**

| Quote | Seat |
|-------|------|
| Member name **Trader Feed** | **ADOPTED as product name** · short name **TF** · filename `FatTail-Labs-Trader-Feed-Spec-v0.1.md` (**DL-517** · **OD-FN-10**) |
| **Market** and **position** and **trader** aware **continuous narrative** | **IN-SCOPE** — awareness law (§4). Continuous = the post tape (§5.1). Market is first-class, not an implied overlay. |
| Customized **per venue** | **IN-SCOPE** — **venue** = an employment of Trader Feed (T Ortho, Algo, later). Customization = that venue’s **instructions prompt** + voice + examining positions. Same as “each place” (**DL-515**). |
| Largely the same **base market info** | **IN-SCOPE** — one market plane (Arch 28 + OPF-held). Venues do **not** mint a second Massive, a second chain, or a private mark store. They **read** the same base and **narrate** it for this venue / this trader / these positions (§4.1). |

**Rename (2026-08-21, verbatim — do not drop · DL-517):**

> Yes rename it.

**Seating:** the product **is** **Trader Feed**. Spec title, short name **TF**, and filename follow. Former name **Feature Narrative** (**FN**) is kept in history (v0.1–v0.1.2, **DL-514…516**). Issued IDs **AT-FN-*** / **OD-FN-*** stay (they were numbered under FN).

**Earlier seating (DL-513), not dropped:** “two hosts, two products — no shared store, no algo/trail on T Ortho.” That **isolation of eval and copy** remains law. This spec **reshapes the chrome**: one **Trader Feed** primitive, **N isolated context packs**. It does **not** merge the two features into one story.

Tango / Hotel notes sit in **§8** beside this text. They do not delete it.

---

## 1. Job

**Trader Feed** is the **Labs floating pane** whose job is **trader review**: a **market-, position-, and trader-aware continuous narrative**, **customized per venue**, largely from the **same base market info**. (Former spec name: Feature Narrative.)

It is a **generalized Journal-shaped tape**: timestamped **posts**, **continuous scroll**, an **instructions prompt** at each venue. It is **not** the Journal product. It is **not** unconstrained chat (**FI-032**). It is **not** the Alert Builder. It is **not** the T Ortho egg (position list, capture, tape prefs). It is **not** the algo trail engine.

*(Earlier draft said “not a chatbot.” **RESHAPED**, not dropped: not a free chat; **is** a Journal-like post tape.)*

| It is | It is not |
|-------|-----------|
| One **chrome** (floatable glass, drag, **post tape**, named fail) | One **story** for every host |
| **Feature-specific** — the host names the voice **and** the instructions prompt | A generic market squawk; a shared prompt across hosts |
| **Context-aware** of **this member** and the **position(s) they are examining** | Another member’s book; a symbol with no examining position dressed up as a review |
| A **supplement** to Algo (viewport for Reason) | A second Algo product |
| The **replacement** for the T Ortho **narrative box** | A replacement for T Ortho the map, or for Algo knobs / trail / HUD |
| **Journal-shaped** (scroll + stamps + prompt) | Journal itself (calendar, week, retrospective, composer-as-record) |
| **Trader Feed** — one **base market**, N **venue** narratives | A second market bus / chain / Massive per venue |
| **Market-aware** on the OPF-held plane | A generic ticker squawk with no examining position |

**Distribution of labor:**

```
Venue / host (T Ortho · Algo · later)
  owns: mount, voice, boundary, examining positions, **instructions prompt**, copy SoR
Trader Feed
  owns: chrome, drag, tokens, clamp, persist-per-venue, fail-open shell,
        **post tape** (timestamps, continuous scroll, markdown bodies)
Shared market plane (Arch 28 · OPF)
  owns: **base market info** every venue reads — never a second Massive
```

---

## 2. Relationship to other specs

| Spec | This document |
|------|----------------|
| **OL-TO** | T Ortho **squawk** is a **host**. Observation-only (sheet geometry, IV since entry, τ burn, contour distance). **Never** instruction. **No algo, no trail.** TF **replaces** the egg narrative box; OL-TO still owns the map, path, What-if cursor (**TO-B1**). |
| **AZ-ALGO** | Algo **Reason floater** is a **host**. Trail math, Reason checkbox, house base, member focus, GEX/VP/greeks voices stay AZ-ALGO. TF **supplements**: Reason checked → TF mounts with the Algo context pack. **ALGO-N1** still: no narrative on the Builder **panel**. **ALGO-R1** still: Reason is the mount gate. |
| **AZ-ALB** | Floatable **grammar** (no scrim, drag header, canvas live). TF uses that dialect. TF is not Type → Algo and does not Save an alert. |
| **ALM** | Algo house **base prompt** remains in-place on `/app/alerts` (**DL-511**). TF does not grow a second CMS. |
| **HI** | Tokens. 44pt controls. No close-dot. No raw hex. |
| **OT-EF / DL-309** | Body cites OPF-held facts or a **named state**. Invented structure in this pane is **severity: high**. |
| **Keep-Warm / Arch 28** | Cadence and one WS. Pulse/paint stay with the host (Algo overlay pulse is AZ-ALGO). **Base market info** for every venue. |
| **Journal** | **Shape parent** (v0.6 §1.4 scroll + visible timestamps; §8.3 admin prompt). T Ortho **boundary** still = Journal agent: observation, never “what to do.” TF does **not** import calendar, week map, retrospective, tags, uploads, or the composer-as-the-record. Other hosts declare their own boundary. |
| **FTI** | Research grid. Not a TF host in v0.1. |

**Juliet (labeled, not a block):** sharing **chrome** is not sharing **eval**. Algo `f` / `H` / `S` never run on Surface. T Ortho contour never prices the Analyzer trail.

---

## 3. Replace · supplement · reuse

### 3.1 Takes the place of the T Ortho narrative box

As-built `TimeOrthoEggPanel` mixes **narrative** (session copy, optional `/session-note`) with **other egg chrome** (position list, capture, tape prefs). Coach named the **narrative box**.

| Replace | Do not silently delete |
|---------|------------------------|
| Egg **narrative pane** (session copy / session-note body) | Position list, capture, tape-kind prefs — remain egg / Surface until Coach seats **OD-FN-4** |
| Egg as the **SoR** for trader-review copy on T Ortho | T Ortho the **map** (OL-TO §3) |
| Shared egg `localStorage` key `ft_options_lab_narrative_pos_v1` as TF law | A remembered drag position — TF uses a **new per-host key** (§5) |

T Ortho **voice** stays OL-TO §5: observation only; Journal-agent boundary; Invariant #8.

### 3.2 Supplements Algo Alert

Algo Alert remains AZ-ALGO. TF does **not** replace:

- Type → Algo knobs, Trail Settings, Reason checkbox, optional focus prompt  
- House base on `/app/alerts`  
- Trail math, dashed verticals, overlay, pulse, HUD, Recorded payload  
- **ALGO-N1** (no narrative paragraph **on the Builder**)

TF **is** the viewport **ALGO-R1** already described as “T Ortho–similar.” Checking Reason mounts **Trader Feed** with the **Algo context pack**. Uncheck unmounts. Clearing the prompt does not unmount. Reason still does **not** change the trail, the alert, or the position.

Coach’s original “window similar to T Ortho” (**AZ-ALGO §0.7**) is this primitive — not a fork of the egg.

### 3.3 May be used in other FatTail Labs features

Any later feature may **host** Trader Feed by declaring a **context pack** (§6) in **its** spec.

v0.1 does **not** auto-mount TF on Journal, Heatmap, Practice, Strategy Lab, Community, or Visualize AI. Those names are **FLAGGED** as candidates (**FI-038**). A host that has not declared a pack **must not** mount TF.

---

## 4. Awareness law

Every mounted instance is a **Trader Feed**: **market-, position-, and trader-aware**, **continuous**, **customized per venue**.

| Aware of | Meaning |
|----------|---------|
| **This venue** | Host id is visible (title **Trader Feed** · subtitle the venue). Algo copy does not appear on T Ortho. T Ortho observation does not appear on Algo. Customization = this venue’s instructions prompt + voice. |
| **This trader** | Session member only. Never another member’s book. Never a house-wide “the desk.” Display name vs second-person **OD-FN-5**. |
| **Examining position(s)** | The host’s Shown / focused / bound card(s) on **this** surface. If none: **named empty** (“no examining position”) — not a generic market tape dressed as a review, not an invented fly. |
| **This market** | The **base market info** already on the Labs plane for the examining underlier / sheet (§4.1). Not a second quote. Unrepresentable → named, not invented. |

**Must-not:**

- Cross-fill SPY→SPX or any other proxy as if it were the examining underlier.  
- Narrate a hidden / not-Shown card as if it were under review.  
- Keep a prior position’s copy after rebind without an atomic settle (OT-EF: last paint of the **shell** may remain; body must not keep a lying debit).  
- Open a per-venue Massive, extra WebSocket, or private mark store.

### 4.1 One base market · N venue narratives

Coach: customized **per venue**, largely the **same base market info**.

**Venue** = an employment of Trader Feed (`host_id`: `t-ortho` · `algo-reason` · later). Same word as “each place” (**DL-515**).

**Base market info** (shared; every venue **reads**; none **owns**):

| Layer | Source | Honesty |
|-------|--------|---------|
| Underlier mid / last | Live underlier pattern (Arch **28** §4.4) | `useLiveUnderlierMarks` + `bindUnderlierMark`. No ad-hoc Massive. No SPY→SPX. |
| Chain / listed strikes / package | OPF-held generation | OT-EF. Representable or named. |
| Session / τ / last-trade clock | OPF + session/print already on the plane | Do not invent a third clock. |
| GEX / heatmap cells | Held profile / Heatmap on this suite | Cite if **held**. Omit or name if not. |
| Volume Profile | Only if **engaged** on this venue | Omit entirely if off (AZ-ALGO §9.2). |

Venues **customize** with the instructions prompt, voice/boundary, examining positions, and which of those layers they **cite**. They do **not** get a different strike list, a different mid, or a different generation than the rest of Labs.

**Juliet (labeled):** one market truth, N narratives — the same class as one WebSocket / one OPF plane. A T Ortho post and an Algo post may **say different things** about the same print. They must not **disagree on the print**.  

---

## 5. Chrome (normative)

**Primitive:** kit `Modal` in the **floatable** dialect (AZ-ALB / Position Builder).

| Law | |
|-----|--|
| Scrim | **None.** Host canvas / map stays live. `aria-modal=false`. |
| Drag | Header grab. On-screen clamp. |
| Persist | `localStorage` key **per host**: `ft_labs_trader_feed_pos_<host_id>`. Do **not** reuse `ft_options_lab_narrative_pos_v1` or the unused `ft_labs_feature_narrative_pos_*` draft keys. Do **not** share one key across hosts (Analyzer vs Surface would fight). |
| Default seat | **Host-declared.** Algo: left of the canvas (same family as Alert Builder — next to **+**, not the far right). T Ortho: **OD-FN-1** (egg as-built defaulted far right — do not bless that silently). |
| Title | **Trader Feed**. Venue as subtitle (T Ortho · Algo · later). |
| Tokens | Dark-pinned HI. No raw hex in TF chrome. |
| Close | Kit `IconButton` + `xmark`, accessible name **Close** — not a close-dot. Host may also unmount via its own gate (Reason off, leave T Ortho, Idle). Esc does **not** kill an Algo alert. |
| Body | **Post tape** (§5.1). Markdown per post. Host voice. Continuous scroll of older posts. |
| Fail-open | While mounted, **never a silent empty tape**. Named states: **WAITING** · **UPDATING** · **AI quiet** · **no examining position** · host OT-EF names (EXPIRED · NOT TRADED · CHECK LEGS · …). A named post is a post (timestamped). |
| Last paint | Keep-Warm Idle: shell **and tape** stay; no new heavy resolve. Do not blank on Away. |
| Not | `TimeOrthoEggPanel`. Not Alert Builder. Not a second GEX/VP page. Not the Journal screen. |
| testid | Root `data-trader-feed="<host_id>"`. Host aliases may remain: Algo `analyzer-algo-narrative` (**AT-ALGO-R3**); T Ortho `surface-t-ortho-squawk` (**AT-TO-4**). |

**Instances:** **one TF instance per host** on a page. Two hosts on one page (if that ever ships) = two instances, two keys, two context packs — unless Coach seats **OD-FN-3** as a single switching pane.

### 5.1 Post tape (Journal-shaped, generalized)

Coach: continuous scroll so the member can view **older posts**; posts are **timestamped**; **similar to Journaling**, **generalized**.

**Shape parent:** Journal Session Spec v0.6 **§1.4** (required feature, not a styling preference). Cite, do not import the Journal page.

| Law | |
|-----|--|
| **Post** | One timestamped body. Markdown. Host voice (title / speaker = this feature, not a generic “Bob” unless the host names it). |
| **Tape** | Append-only while the instance is mounted (and across remounts for as long as **OD-FN-8** durability holds). Older posts **remain**. Newest at the **bottom** (Journal convention). |
| **Bounded scroll** | The tape has a **fixed height** and its own overflow. Adding posts never lengthens the host page. Short tapes do not stretch the pane. |
| **View older** | Member scrolls **up**. Reaching top/bottom of the tape does **not** chain-scroll the page. |
| **Stick to newest** | A new post scrolls the tape to the bottom **unless** the member has scrolled up to read — then position is **held**, not yanked (Journal §1.4). |
| **Reopen** | Lands at the **most recent** post. |
| **Timestamp** | **Visible** on every post, beside the speaker / host label. Not a hover title, not a tooltip, not selection-only. Immutable UTC; display in **America/New_York** (same honesty family as Journal §4). |
| **Empty** | Named empty post (“no examining position” / **WAITING**), still timestamped — never a silent blank region. |

**A post is not:** a replace-in-place session note (egg `/session-note` overwrite). The egg’s single mutating paragraph is what this tape **replaces**.

**Speaker:** the **host** (T Ortho · Algo · later). Member-authored posts need a **composer**; that is **OD-FN-7**, not silent. Journal’s “member always writes first” does **not** apply until a host declares a composer.

### 5.2 Instructions prompt (every employment)

Coach: **each place** TF is employed has an **instructions prompt to follow**.

| Law | |
|-----|--|
| Required | Every host pack includes one **instructions prompt**. No host without a prompt. Missing prompt = fail-loud for that host (do not silently fall back to another host’s prompt). |
| Job | The prompt is what the **narrative follows**. **Venue-specific.** Aware of this **market**, this **trader**, and examining **position(s)** (§4). Must not divert from the venue’s primary purpose. |
| Not | Member-facing **trading instruction** (“what to do”). T Ortho boundary still forbids that. Algo still does not flatten. |
| Isolation | Prompts do **not** cross venues. Algo house base is not T Ortho’s prompt. Base **market facts** are shared; **prompts** are not. |
| Stack | **Instructions prompt** (venue / house) → optional **member focus** (Algo Reason field today) → standing context (**base market info**, trader, examining positions, engaged overlays). |
| Edit | Dual Surface **in-place** on the host’s production URL when the viewer is an administrator — same family as Algo on `/app/alerts` (**DL-511**) and Journal’s admin-editable prompt (v0.6 §8.3). Members never see the house editor. **Where** each host’s editor sits: **OD-FN-9**. |
| Version | Stamp a prompt version on posts when the model runs (Journal stamps `prompt_version_id`). Local fail-open posts may omit a model version and must still timestamp. |

**Algo today:** house base **is** the instructions prompt; Reason markdown is optional **focus** (AZ-ALGO §5.4–5.5). Unchanged.

**T Ortho:** now **has** an instructions prompt (this clause **adopts** former **OD-FN-2**). Observation-only boundary unchanged. Editor location **OD-FN-9**.

---

## 6. Context pack (host contract)

A host **must** supply these. TF **must not** invent them.

| Field | Required | |
|-------|----------|--|
| `host_id` | yes | Stable token for this **venue**: `t-ortho` · `algo-reason` · later ids from the host spec |
| Title | yes | Member-facing pane is **Trader Feed**. Venue label (“T Ortho” · “Algo”) is the subtitle. |
| Mount predicate | yes | When the pane exists. T Ortho: named-view **T Ortho** on. Algo: Reason **checked** and alert Live (Waiting/Armed) or Recorded (last tape); hide on Idle. |
| Examining positions | yes | Ids + labels + OPF-representable facts the voice may cite. Empty → named empty. |
| Trader | yes | Session member identity for awareness (no other members). |
| Voice / boundary | yes | What the body **may** say and **must not** say. |
| Copy SoR | yes | Local sentences and/or model stack. Omit-when-off overlays (GEX/VP) stay with the host. Posts append to the tape; they do not overwrite it. |
| **Instructions prompt** | **yes** | What the narrative **follows** at this employment (§5.2). House / host prompt. Missing = fail-loud. |
| Member focus | no | Optional overlay (Algo Reason field). Must not divert. Not a substitute for the instructions prompt. |
| Model policy | yes | When the model runs vs local fail-open. Algo: house + optional focus while **Armed**. T Ortho: prompt required; model vs local cadence **OD-TO-2** (prompt existence is no longer the open question). |
| Cadence | yes | Keep-Warm Working / Away. Not 1s. New **posts** on Working ticks; Idle appends none. |
| Default seat | yes | CSS-inch / host-rect rule. |
| testid alias | no | Existing AT ids. |

**Isolation:** context packs do **not** share prompts, stores, tapes, or eval. Algo house base is **not** the T Ortho prompt. T Ortho has **no** Reason checkbox.

**Atomic settle:** on examining-position change, the host rebinds the pack **once**. TF does not flash-search a new fly.

---

## 7. Host catalog (v0.1)

### 7.1 T Ortho — `t-ortho`

| | |
|--|--|
| Spec | OL-TO §5 |
| Job | Trader review of **this** path on the **spot × time** map |
| Boundary | Observation **only**. Sheet geometry, IV shift since entry, τ burn, contour distance. **Never** instruction. **Never** “what to do.” Journal-agent same boundary. **No algo, no trail.** |
| Mount | Surface named-view **T Ortho**. Unmount when leaving that detent (last paint of the shell may remain until unmount). |
| Instructions prompt | **Required** (§5.2). Observation-only purpose (geometry, IV-since-entry, τ burn, contour distance). Must not author “what to do.” Editor **OD-FN-9**. |
| Model | Prompt required. Cadence / model-vs-local still **OD-TO-2**. Do not copy the egg’s 3-minute overwrite `/session-note` — posts **append**. |
| Replaces | Egg narrative box (mutating paragraph → timestamped tape) |

### 7.2 Algo Reason — `algo-reason`

| | |
|--|--|
| Spec | AZ-ALGO §5.4 · §9 |
| Job | Trader review of **this** 0DTE OTM butterfly **on this trail** |
| Boundary | Play-by-play of GEX (if on), VP (if engaged else **omit**), greeks / debit / gamma / probabilities, decay, near vs far (**ALGO-B1**). **Not** a flatten. **Not** Builder copy (**ALGO-N1**). |
| Mount | Reason **checked**. Prompt optional. Model **Armed only**. Waiting: standing / waiting copy. Recorded: last tape. Idle: hide. |
| Instructions prompt | House base on `/app/alerts` (**DL-511**) **is** the instructions prompt. Optional Reason markdown = **focus**, not a substitute. |
| Model | House then optional member **focus**. Must not divert from primary purpose (AZ-ALGO §0.7 / §9.2). Fail-open **AI quiet** as a **timestamped** named post. |
| Supplements | Algo Alert |

### 7.3 Later hosts

Not listed = not a host. **FI-038**.

---

## 8. Language (Tango + Hotel sit beside Coach)

**Coach job** is trader review: the **Trader Feed** — market-, position-, and trader-aware continuous narrative, customized per venue, same base market info. Each venue **follows** its instructions prompt. The body is a **timestamped post tape**.

**Tango (member-facing copy — labeled):** Labs chrome, titles, and TF **posts** speak **process**. They do **not** promise P&L, “maximize profit,” or “bank it.” Algo’s stay-in / clip-small job remains AZ-ALGO §0.8 **as job**, not as a TF headline. Invariant #8 / ALM #5 still govern what **Labs** says. Tango stamps **vocabulary before Bob quotes** any host.

**Tango (instructions prompt vs trading instruction — labeled):** Coach’s “instructions prompt” is **prompt-the-narrative**. It is **not** a license for T Ortho (or any observation host) to tell the member what to trade. Journal-agent boundary on T Ortho is unchanged.

**Hotel:** every number and structure in the body is a measurement on the **OPF-held plane** (and overlays the host has **engaged**). Do not invent a greek, a wall, a VP node, an IV cell, or a heatmap cell. Wrong structure here is **severity: high**.

**Tango (capacity):** TF is a review surface, not a dependency machine. It does not tell the member what to do (T Ortho) and does not close the fly (Algo).

**Tango (name — labeled):** **Trader Feed** is the product name (member-referred, Coach adopted). It still must not promise P&L. Tango stamps the title before Bob quotes it.

**Victor / Whiskey (opinion, not a block):** review is **via negativa** on what is representable now — not a forecast of the right tail.

---

## 9. Cadence / bus

| Law | |
|-----|--|
| Keep-Warm | Working / Away / Idle. Idle = no heavy resolve (local or model). |
| One WS | Arch 28. TF does not open Massive or a second socket. |
| Last paint | Leaving the tab does not blank the shell. Rebind must not flash a lying prior mark. |
| Model tick | Bounded. Not a chat. Algo: not every Keep-Warm tick. Each tick that speaks **appends a post**; it does not rewrite the last paragraph. T Ortho: sheet+path facts on Working cadence as posts. |

---

## 10. As-built (check first — not law)

Recorded so this spec does not accidentally bless the egg or the W3 Algo panel as the product SoR.

| As-built | Path | Honesty |
|----------|------|---------|
| Egg panel | `TimeOrthoEggPanel` | Glass, drag, session copy, optional `/session-note`, **position list**, capture, **tape prefs**. Mixes observation, book chrome, and chart settings. **Narrative pane** is what TF replaces. Other chrome is **OD-FN-4**. |
| Egg persist | `ft_options_lab_narrative_pos_v1` | **Not** TF’s key. |
| Algo panel (W3) | `AlgoNarrativePanel` · `analyzer-algo-narrative` | Local sentences; GEX/VP omit-when-off. **Not** a timestamped post tape (mutating / latest-block). Spec-ahead Reason / house base / give-up math may not all be in that panel. TF **hosts** this job; the W3 file is not law. |
| Alert Builder float | `Modal` floatable | Grammar reference. Different job. |
| Journal session | `/app/journal` · Journal Session Spec v0.6 | **Shape reference:** bounded scroll, visible timestamps, admin prompt. **Not** TF chrome. Do not import calendar / week / retrospective / composer into TF unless **OD-FN-7**. |

**Law:** do **not** import egg chrome (position list, capture, tape prefs, `bg-black/70`, egg storage key) into Trader Feed.

---

## 11. Ideas inventory (Phase 0 — nothing dropped)

| Idea | Seat |
|------|------|
| New Labs-wide feature: floating Narrative for trader review | **IN-SCOPE** · §0 · §1 |
| Feature-specific; aware of this trader and examining position(s) | **IN-SCOPE** · §4 · **DL-513** job/awareness kept |
| Takes the place of the T Ortho **narrative box** | **IN-SCOPE** · §3.1 |
| Supplements Algo Alert | **IN-SCOPE** · §3.2 · ALGO-R1 mount stays with Reason |
| May be used in other FatTail Labs features | **IN-SCOPE as reuse law** · §3.3 · catalog **FLAGGED** **FI-038** |
| One chrome, N isolated context packs | **IN-SCOPE** · reshape of DL-513 “two products” **chrome**; eval isolation **kept** |
| Two hosts, two products (DL-513 seating) | **RESHAPED →** this spec for chrome; isolation of store/eval/voice **kept** |
| No algo / no trail on T Ortho | **IN-SCOPE** · OL-TO · §7.1 |
| ALGO-N1 no narrative on Builder panel | **IN-SCOPE** · unchanged |
| ALGO-R1 Reason checkbox mounts the floater | **IN-SCOPE** · floater **is** TF |
| Journal-agent observation boundary on T Ortho | **IN-SCOPE** |
| HI tokens, no scrim, drag, fail-open named | **IN-SCOPE** |
| Per-host localStorage; do not share egg key | **IN-SCOPE** |
| Do not import `TimeOrthoEggPanel` | **IN-SCOPE** |
| Egg position-list / capture / tape prefs | **OUT** of TF · **OD-FN-4** whether the rest of the egg remains |
| Unconstrained LLM chat | **FLAGGED** **FI-032** |
| Analyzer VP overlay so Algo voice can cite VP | **FLAGGED** **FI-031** (host voice; not TF chrome) |
| Auto-mount on Journal / Heatmap / Practice / Strategy Lab / Community / Visualize AI | **FLAGGED** **FI-038** |
| Single switching pane when two hosts share a page | **FLAGGED** **OD-FN-3** |
| T Ortho house-prompt editor (Dual Surface) | **ADOPTED as existence** · every host has an instructions prompt (§5.2). **Where** T Ortho’s editor sits remains **OD-FN-9** |
| Each employment has an **instructions prompt** to follow | **IN-SCOPE** · §5.2 · **DL-515** |
| Continuous scroll of **older posts** | **IN-SCOPE** · §5.1 · Journal §1.4 shape |
| Posts are **timestamped** (visible) | **IN-SCOPE** · §5.1 |
| Very similar to Journaling, but **generalized** | **IN-SCOPE as shape** · Journal is not replaced · **DL-515** |
| “Not a chatbot” (v0.1 draft) | **RESHAPED →** not unconstrained chat (**FI-032**); **is** a Journal-like post tape |
| Member composer inside TF (Journal two-way) | **FLAGGED** **OD-FN-7** · **FI-039** — Coach named posts + Journal similarity; did not name a composer |
| Tape durability (session vs server) | **FLAGGED** **OD-FN-8** |
| Egg overwrite `/session-note` as TF body | **OUT** — posts append |
| Member name **Trader Feed** | **ADOPTED as product name** · **DL-516** · **DL-517** |
| Market + position + trader aware **continuous narrative** | **IN-SCOPE** · §4 · **DL-516** |
| Customized **per venue** | **IN-SCOPE** · venue = employment · §4.1 |
| Same **base market info** across venues | **IN-SCOPE** · Arch 28 + OPF-held · no second Massive |
| Rename spec file / short name FN → Trader Feed | **ADOPTED** **OD-FN-10** · **DL-517** — product **Trader Feed** (**TF**); file `FatTail-Labs-Trader-Feed-Spec-v0.1.md` |

---

## 12. Out of scope

- Implementation plan / Charlie packets until Coach Phase 5.  
- MSC import · extra market WebSocket · client Massive.  
- Inventing IV, strikes, debit, or trail underliers.  
- Closing / flattening / Tradier.  
- Profit-claim notifications or Bob copy before Tango vocabulary.  
- Teaching the member a second empty-holder essay.  
- Merging Surface T Ortho eval with Analyzer trail eval.  
- Replacing ISO/RISK tents, Heatmap pages, or Alerts Manager.  
- FatTail Intelligence research grid as a silent host.  
- Replacing the Journal product (calendar, week map, retrospective, composer-as-record). Journal remains Journal.  
- Importing Journal tags, uploads, or “member always writes first” until **OD-FN-7**.  
- A per-venue market bus, chain generation, or Massive path. Base market info is **one plane**.

---

## 13. Acceptance (when BUILD)

| AT | Criterion |
|----|-----------|
| **AT-FN-1** | One floatable chrome (no scrim, header drag, clamp, HI tokens, no raw hex, no close-dot). Not `TimeOrthoEggPanel`. Not Alert Builder. |
| **AT-FN-2** | Per-host persist key `ft_labs_trader_feed_pos_<host_id>`. Egg key **not** written. Algo and T Ortho do not share a key. |
| **AT-FN-3** | T Ortho host: egg **narrative box** is gone; TF `t-ortho` mounts on the T Ortho detent with observation-only **posts** (geometry, IV-since-entry, τ burn, contour distance). **No** “what to do.” **No** algo/trail copy. Names **this trader’s examining position(s)**. Instructions prompt **exists**. |
| **AT-FN-4** | Algo host: Reason checked → TF `algo-reason` mounts (alias `analyzer-algo-narrative` may remain). Unchecked → unmount. Does **not** change arm / `S` / Recorded / the position. Builder panel still has **no** narrative paragraph (**ALGO-N1**). |
| **AT-FN-5** | Empty examining set → named “no examining position,” not a generic tape, not an invented structure. |
| **AT-FN-6** | Invariant #8: no profit claims in TF chrome or Labs body. Tango vocabulary before Bob. |
| **AT-FN-7** | OT-EF: unrepresentable cite → named state, not a lying number. Last paint of the **shell** may remain. |
| **AT-FN-8** | Keep-Warm: Idle is not 1s resolve. One market WS. Away does not blank the shell. |
| **AT-FN-9** | A feature without a declared context pack does **not** mount TF. |
| **AT-FN-10** | Fail-open: mounted + quiet model → **AI quiet** as a **timestamped post** (or host local post), never a silent empty tape. |
| **AT-FN-11** | Every host pack has an **instructions prompt**. Missing prompt fails loud. Algo and T Ortho do not share a prompt. |
| **AT-FN-12** | Tape is a **bounded** scroll region. Older posts remain. Newest at bottom. Visible timestamp on every post (not hover). New post sticks to bottom unless the member has scrolled up. |
| **AT-FN-13** | A new tick **appends** a post. It does not overwrite the previous post’s body (egg `/session-note` family is out). |
| **AT-FN-14** | Chrome title is **Trader Feed**; venue is visible as subtitle. T Ortho and Algo do not share an instructions prompt. |
| **AT-FN-15** | Both venues that cite a mid / listed strike / package mark **agree on the print** (same OPF-held / live-underlier bind). They may **narrate** it differently. No per-venue Massive. |

Host ATs (AT-TO-4…6, AT-ALGO-R3…R8) remain in those specs and **point here** for chrome.

---

## 14. Open decisions (not silent)

| OD | Question | Silent |
|----|----------|--------|
| **OD-FN-1** | T Ortho default seat (egg as-built far right vs left-of-map vs last drag). | **None** — Coach seats at Phase 5 |
| **OD-FN-2** | T Ortho model: stay local, or Dual Surface house prompt like Algo? | **ADOPTED** — every host has an instructions prompt (**DL-515**). Cadence / model-vs-local remains **OD-TO-2**. |
| **OD-FN-3** | Two hosts on one page: two instances (default in §5) vs one switching pane. | Default = two instances |
| **OD-FN-4** | After narrative replace: keep egg position-list / capture / tape prefs, or retire `TimeOrthoEggPanel` entirely? | **None** — Coach seats |
| **OD-FN-5** | Trader display: member name vs second-person “you.” | **None** — Echo + Tango |
| **OD-FN-6** | First *other* Labs host after T Ortho + Algo (**FI-038**). | Catalog flagged; not auto |
| **OD-FN-7** | Member **composer** in TF (Journal two-way) vs host-voice posts only? | **None** — Coach seats. Default until then: **host-voice posts only** |
| **OD-FN-8** | Tape durability: this session / this mount vs server record (Journal-like). | **None** — Coach seats. Must not silently pick MySQL. |
| **OD-FN-9** | Where each host’s instructions-prompt **editor** lives (Dual Surface URL). Algo is `/app/alerts`. T Ortho unset. | **None** — Coach seats |
| **OD-FN-10** | Rename spec / short name **FN** → **Trader Feed**, or keep FN as spec and Trader Feed as chrome? | **ADOPTED** — product **Trader Feed** (**TF**); file `FatTail-Labs-Trader-Feed-Spec-v0.1.md` (**DL-517**) |

---

## 15. Files (when BUILD — after Coach Phase 5)

| Path | Role |
|------|------|
| This spec | Law |
| Shared chrome | `web/components/…/TraderFeed` (name at packet time) — floatable shell only |
| T Ortho host pack | Surface T Ortho detent; unmount egg narrative pane |
| Algo host pack | Reason mount; wrap or replace `AlgoNarrativePanel` |
| Tests | Isolation (no algo copy on T Ortho); empty examining; persist keys; ALGO-N1; AT-FN-1…15; prompt isolation; append-not-overwrite; timestamp visible; scroll-hold when reading older; same-print across venues |

Do **not** start this packet until Coach marks this spec BUILD AUTHORITY. Do **not** serialize onto `HostPnLChart.tsx` without India naming the overlap with `p-az-algo` W4 and `p-az-viewport-2d`.

---

## 16. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v0.1.3** | 2026-08-21 | Coach: **Yes rename it.** Product **Trader Feed** (**TF**). Filename `FatTail-Labs-Trader-Feed-Spec-v0.1.md`. Former Feature Narrative (**FN**) kept in history. **OD-FN-10** adopted. **DL-517**. |
| **v0.1.2** | 2026-08-21 | Member name **Trader Feed**. Market + position + trader aware continuous narrative. Customized per **venue**; same **base market info** (Arch 28 + OPF). **DL-516**. |
| **v0.1.1** | 2026-08-21 | Coach: each employment has an **instructions prompt**; tape is a **continuous scroll** of **timestamped posts**; Journal-shaped, **generalized**. **OD-FN-2** adopted (prompt existence). **DL-515**. |
| **v0.1** | 2026-08-21 | Coach: new Labs-wide Feature Narrative — replaces T Ortho narrative box; supplements Algo Alert; reusable across Labs. Job = floating narrative for trader review; feature-specific; aware of this trader and examining position(s). Reshapes DL-513 chrome seating (one primitive, isolated packs). **DL-514**. |
