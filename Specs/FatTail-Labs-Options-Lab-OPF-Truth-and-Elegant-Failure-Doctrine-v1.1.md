# FatTail Labs — Options Lab OPF Truth & Elegant Failure Doctrine v1.1

**Status:** **NORMATIVE · Coach doctrine** (2026-08-16)  
**Type:** Product doctrine — positions, Builder, cards, package marks, capital-risk UX  
**Short name:** **OPF Truth · Elegant Failure** · **OT-EF**  
**Filename:** `FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md`  
**Supersedes:** [OT-EF v1.0](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md) (historical; Coach text kept and extended here)  
**DL:** **DL-309** (origin) · **DL-393** (EXPIRED = midnight ET) · **DL-394** (additive book) · **DL-395** (OPF session/print · DRAFT spec) · **DL-396** (this revision: two clocks + fold) · **DL-409** (IV NO as Law B state) · **DL-445** (Surface never clock-blocked) · **DL-446** (Surface expired wireframe ghost)

**2026-08-16 amendment (DL-409):** **IV NO** is a Law B named state. Listed
contract on the held generation with no exact/locked usable IV → no mark,
no sheet. Surface / Analyzer must not invent a fourth hole name. Echo owns
the member phrase; the token stays `IV NO`. Not a v1.2 fork — dated fold
into this v1.1.

**2026-08-18 amendment (Coach · DL-445):** Surface analysis is **never
clock-blocked**. Law C still forbids claiming a residual or expired book
is **live**. It does **not** unmount the 3D tent or replace it with a
blocking **HELD / RESIDUAL** / **EXPIRED** card. Those names are
provenance on a still-drawn residual / ghost sheet. Book clock uses
remaining listed life (every shown leg). Holes that still replace the
tent: **IV NO** · **CHECK LEGS** · **WAITING** · **UPDATING**.  
**Parents:** [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · [PB Spec v0.3](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md) · [Analyzer Spec v0.2](./FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) · [Session/Print Authority Spec v0.1](./FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md) (**DRAFT**) · [Strategy Lab Guiding Doctrine v1.0](./FatTail-Labs-Strategy-Lab-Guiding-Doctrine-Spec-v1.0.md) · [Chain Picker OC6a](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) · [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md)

**Audience:** Coach · India · Juliet · Alpha/Charlie · Echo · Delta · Hotel · every agent that touches Options Lab positions, Builder, package marks, risk-graph focus, or Strategy Lab backtest / forward-walk.

**Doctrine only until the bench plan’s Echo and Delta gates.** No member chrome until **Echo seeds labels**. No code until **Delta’s characterization list** exists. Plan: [`docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md`](../docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md).

---

## 0. Why this is highest order

Options Lab is not a toy blotter. Members use **position cards** and **Builder** to form views of structures that, in real trading, put **capital at risk**.

A system that:

- invents strikes that are not on the OPF-held chain,  
- shows a debit/credit that is not backed by real contracts,  
- or fails **silently** (blank field, spinner forever, raw error),  

…teaches the wrong lesson and can mislead judgment under money stress.

Therefore:

> **Truth of the instrument plane + elegant, named failure are capital-risk doctrine.**  
> They rank with fail-loud config and “never MSC as pricing SoR.”

---

## 1. Law A — OPF is the only truth for positions

### A1. Single universe

There is **one** universe of options for create, edit, prefill, strike nudge, and package display:

**The dual-side chain generations the OPF holds** (listed expirations + listed strikes + contract marks on that plane).

There is **no**:

- alternate “paper” strike grid,  
- arithmetic placeholder structure presented as real,  
- client-only invention of strikes “until the chain loads” shown as a finished position.

**RTH vs closed does not create a second universe.**  
Open/closed/extended changes **mark freshness** (live vs last print / held), not **what contracts exist**.

### A2. Representability

A structure is **representable** if and only if **every leg** can be placed on the OPF-held plane for its expiration:

1. **Expiration** is a listed date on the product calendar the plane knows, and the **card pointer** is not past the EXPIRED clock (Law C).  
2. **Strike + right** exists as a contract on that expiration’s dual-side generation (or is honestly unpriceable — see Law B).  
3. **Package mark** (when claimed live/held) comes from OPF PackageQuote (or locked D*), never MSC and never a private client formula as SoR.

If any leg fails (1) or (2), the structure is **not representable** for pricing. The system must not pretend otherwise.

After the **settlement clock** and before the **EXPIRED clock**, the structure may still be representable as **held / residual** — **never live** (Law C).

### A3. Card = pointer; OPF = instrument truth

| Object | SoR |
|--------|-----|
| **Position card** | Definition of what the member points at (legs, exp, direction, lock, defined debit) |
| **OPF + dual-side chain** | Whether those legs are real instruments and what they are worth (natural / last print / held) |
| **Viewport** | Visualization of **every shown** (visible) definition as **one additive continuous book** (DL-394). Not a radio. Not a second book. |
| **Session / print quality** | **Target:** OPF feed (DL-395 · Session/Print Spec v0.1 **DRAFT**). **As-built:** Analyzer still uses session-status + clock until that spec is GO. |

Changing expiration or strikes **rebinds the pointer**. It does not mint a fictional option.

### A4. Surfaces in scope (normative)

| Surface | Obligation |
|---------|------------|
| Position Builder (create / edit) | Prefill and strategy regenerate **only** from OPF-held listed strikes; wait for chain hydrate; never emit non-listed strikes |
| Position card | Display package only when representable + quote/lock allows; otherwise Law B state. After settlement, before midnight ET: **held / residual**, never a live claim. |
| Strike ▲/▼ | Step on listed grid; missing market → Law B (**NOT TRADED**), not a fake mid |
| Analyze / Update | Must not commit a structure that invents non-OPF strikes as if they were real |
| **Risk graph / Surface viewport** | Same Law B names as cards. **No fabricated package curve** (PB-VIEW-6). Keep **scales + grid**. **Every shown card** draws as **one additive continuous book curve** (DL-394 · PB-VIEW-4 **retired**). Expired-only book may show at-expiry residual **ghost**. **Surface tent stays** after settlement and after EXPIRED — clocks label the claim (`as_of residual` / `as_of expired`); they do not lock analysis (**DL-445**). After EXPIRED: Surface is **wireframe, no fill** (**DL-446**). |
| **Strategy Lab backtest / forward-walk** | **Law A consumer** (SL-GD39). Same listed universe. No invented strikes on gold or silver. |

### A5. A trade is one atomic position

A **trade** is **one atomic position** regardless of leg count (SL-GD22 · SL-GD40). Batman, fly, vertical — **one** position. Log, backtest events, orders, exits, and outcome buckets address the **position**, never a leg.

### A6. Tier is a state

Gold / silver (and live / last print / expired) are **named states** of the tape or the pointer — same honesty class as Law B. A silver result must not render as gold. A last print must not render as live. A residual between settlement and midnight must not render as live.

---

## 2. Law B — Elegant failure (truthful named state)

### B1. Never leave the user believing the system is broken

When the plane is cold, sparse, past settlement, budget-throttled, or skewed:

- **Do not** leave a blank price that looks like a bug.  
- **Do not** keep a **stale** debit/credit from a previous pointer after rebind.  
- **Do not** show raw stack traces or opaque “incomplete” without a human label.  
- **Do** show a **named, calm state** and a short truthful explanation (tooltip / notice).

Exceptional cases are **expected** in options (chain edge, post-settlement, interest budget). Reporting them clearly is product quality, not error.

**Last known print is not an outage.** Do not flash **OPF unavailable** when OPF holds a last print (DL-395).

### B2. Package debit/credit field under exception

On exception, the package **price cell is replaced** by a **state label** (not a numeric lie) — except **held residual** and **defined debit on an EXPIRED ghost**, which may show the **frozen defined debit** plus the named state (Coach 2026-08-16).

| State | Meaning (truth) |
|-------|------------------|
| **EXPIRED** | **EXPIRED clock** (Law C): next **midnight Eastern Time** after the expiration calendar date. Viewport **ghost** uses the **defined debit**. |
| **HELD / RESIDUAL** | **Between clocks** (Law C): after OPF settlement instant, before midnight ET. Last print / residual. **Never live.** |
| **NOT TRADED** | Exp may be valid; one or more legs have no market on the OPF chain (incl. chain edge / sparse strikes) |
| **IV NO** | Listed contract is on the held generation but has no exact/locked usable IV at this instant (time machine: at snap \(t\)). No mark, no sheet. Not a cue to interpolate. Distinct from **NOT TRADED** (strike not listed / not held). |
| **CHECK LEGS** | Structure cannot fully bind for other representability reasons |
| **UPDATING** | Atomic resolve in flight — not yet settled |
| **BUDGET LIMIT** | Interest/capacity throttled; definition intact |
| **WAITING** | Epoch/skew wait; not permanent failure |
| **HIDDEN** | Member hid the card |
| *(numeric price)* | Representable + OPF (or lock) mark available — **live** or **held / last print**, labeled |

**Numeric package is shown only when the system can stand behind it.** Member-facing words for HELD / RESIDUAL wait for **Echo’s label seed**. Until then this table is doctrine, not chrome.

Surface / Analyzer must **not invent a fourth hole name** for a missing
listed IV. Echo owns the member phrase; the token stays **`IV NO`**.

### B3. Atomic resolve

Pointer change (exp, strikes, template rebuild that changes definition) is **one atomic unit**:

1. Definition updates.  
2. System resolves **once** (hydrate → bind every leg → package quote if bindable).  
3. UI settles to **one** final state (price or named failure).  
4. **No** endless re-search or flash loop until the definition changes again (or the member explicitly Refresh).

The position is not a continuous partial-rebuild animation.

### B4. Bind order (every leg)

For each leg, in order:

1. **Expiration (EXPIRED clock)** — card still current through 23:59:59 ET of the exp date.  
2. **Settlement (τ clock)** — after the OPF expiry instant, a still-current card is **held / residual**, never live.  
3. **Price** — contract present on the dual-side generation with a usable mark (live NBBO or last print, as OPF said).

**All legs** must pass. Valid expiration with no strike market → **NOT TRADED**. That is the plane telling the truth, not a system defect.

---

## 3. Law C — Two clocks (Coach 2026-08-16 · **DL-396**)

There are **two** clocks. They are not the same fact.

| Clock | Instant | Owns | Used for |
|-------|---------|------|----------|
| **τ / settlement** | OPF expiry instant (PM default **16:00 America/New_York** on the expiration date; AM = open/SOQ). **OPF29.** | Pricing τ, settlement, “is this still a live option?” | Model T+0, 0DTE τ, live-mark eligibility |
| **EXPIRED** | **Next midnight Eastern Time** after the expiration **calendar date** (`00:00:00` America/New_York of the following day). **DL-393.** | Card pointer / Law B **EXPIRED** | When the card becomes EXPIRED and the viewport may ghost |

**The window between them is Held / residual, never live.**

Example (PM-settled, exp day D):

| Wall (ET) | τ / settlement | Card pointer | Mark claim |
|-----------|----------------|--------------|------------|
| D 15:59 | Not yet settled | Current | Live if OPF says live |
| D 16:00–23:59:59 | Settled | Still **current** (not EXPIRED) | **Held / residual only** |
| D+1 00:00:00 | Settled | **EXPIRED** | Ghost + defined debit |

Not UTC midnight. Not the member’s local midnight. Not cash close as the EXPIRED clock. Cash close / OPF expiry instant is the **other** clock.

---

## 4. Additive book (DL-394 · PB-VIEW-4 retired)

**PB-VIEW-4** (exactly one focused definition) is **retired** as product law.

Viewport = **every shown card**, independent Show checkbox, **one additive continuous** OPF book curve. Highlight (focus) does not un-show siblings.

See PB Spec v0.3 **PB-VIEW-4** one-line retirement.

---

## 5. Capital-risk framing (non-negotiable intent)

Members may treat Analyzer as a **decision surface** next to real capital decisions (education product, not brokerage — still **capital-adjacent judgment**).

Therefore agents and implementers **must**:

- Prefer **under-claiming** a mark to inventing one.  
- Prefer **named state** to silence.  
- Prefer **listed-grid structure** to “something that looks like SPX.”  
- Treat regressions that invent strikes or flash false prices as **severity: high**.  
- Never claim **live** in the Held/residual window.

Marketing and UI copy remain free of profit claims; **instrument honesty** is separate and stricter.

---

## 6. Strategy Lab join (three amendments · SL-GD39–41)

Folded here so Law A is not Options-Lab-only. Guiding Doctrine v1.0 §18 carries the same three lines.

| ID | Amendment |
|----|-----------|
| **SL-GD39** | Backtest and forward-walk are **Law A consumers**. Same OPF-held listed universe. No invented strikes on gold or silver. |
| **SL-GD40** | A trade is **one atomic position** (restates SL-GD22). BT/FW events, exits, and buckets address the position. |
| **SL-GD41** | **Tier is a state** (gold \| silver), same honesty as live \| last print \| expired. Never render silver as gold. |

---

## 7. As-built map (implementation anchors)

| Concern | Location (as-built) |
|---------|---------------------|
| Listed structure prefill | `web/lib/options-lab/listedStructure.ts` · Builder `regenerate` |
| Card pointer rebind | `setCardExpiration` · `shiftCardStrikes` in `analyzerBook.ts` |
| Bind assess (exp then price) | `web/lib/options-lab/optionBind.ts` |
| Atomic package resolve | `web/lib/options-lab/usePackageQuotes.ts` |
| Named package display states | `web/lib/options-lab/cardDisplayState.ts` · `AnalyzerPositionsList` |
| Viewport book | `visibleBookTrade` · `resolveViewportBookPolicy` · `useOpfRiskGraph` |
| EXPIRED clock | `isOptionPointerExpired` / `newYorkCalendarDate` — midnight ET |
| τ / settlement clock | OPF `tau.py` · Spec §3.7 — **not** the same function as EXPIRED |
| Session (as-built shim) | `session-status` + clock — **not** target SoR (Session/Print DRAFT) |

Unfinished paths must still not invent instruments.

---

## 8. Agent / bench obligations

1. **India / Juliet:** Any position PR that invents non-listed strikes, silent package blanks, or a **live** claim in the Held/residual window is **out of doctrine**.  
2. **Charlie / Alpha:** Builder + card + package + viewport stay aligned with Laws A–C.  
3. **Echo:** **No chrome** until the **label seed** lands (Live · Pre/post · Off market · last print · Held residual · EXPIRED).  
4. **Delta:** **No code** in this program until the **characterization list** exists (plan W2). Prefer bind + display-state + two-clock + additive-book tests.  
5. **Hotel:** Live vs last print vs residual must not be readable as a liftable quote when it is not.  
6. **Coach:** Overrides require a **new DL**.

---

## 9. Relationship to fail-loud platform doctrine

| Layer | Style |
|-------|--------|
| Platform / config | Fail loud to operators |
| Member instrument surface | **Fail elegant and truthful** — named state, never a lying price |

Both reject **silent wrongness**.

---

## 10. Review next-steps (folded · doctrine only)

From Session/Print Spec v0.1 review packet + Coach 2026-08-16 rulings. **Not chrome. Not code.**

| # | Next step | Owner | Gate |
|---|-----------|-------|------|
| 1 | Two clocks encoded here (Law C) | Lima (this file) | Done in v1.1 |
| 2 | PB-VIEW-4 one-line retirement (additive book) | Lima | Done in v1.1 / PB v0.3 |
| 3 | **Echo seeds labels** — Live · Pre/post · Off market · last print · Held residual · EXPIRED | Echo | **No chrome until this seed** |
| 4 | **Delta characterization list** — two clocks, additive book, last-print ≠ outage, Law A on BT/FW, tier as state | Delta | **No code until this list** |
| 5 | Session/Print Spec v0.1 sequential review (India → Echo/Tango → Hotel → Coach GO) | Juliet schedules | Envelope still **DRAFT** |
| 6 | Juliet executes the bench plan **only after** 3, 4, and 5 | Juliet | Plan W3+ |

---

## 11. Acceptance litmus (Coach)

A change is **doctrine-compliant** only if:

1. Every prefilled leg strike is on the OPF-held listed chain for its exp (or the UI is waiting with **UPDATING** — not a fake structure).  
2. After pointer change, the card settles **once** to a defendable mark or a **named** state from §2.2.  
3. A member who walks strikes to the chain edge sees **NOT TRADED**, not a synthetic debit.  
4. After settlement and before midnight ET the card is **held / residual**, **never live**.  
5. After midnight ET a still-shown card is **EXPIRED** + ghost with **defined debit**.  
6. Two or more **shown** cards add on one continuous book curve.  
7. Closed / last print is not flashed as **OPF unavailable**.  
8. Backtest / forward-walk does not invent strikes (Law A consumer).  
9. Silver is never drawn as gold (tier is a state).

---

## 12. Document control

| Version | Date | Notes |
|---------|------|-------|
| **v1.0** | 2026-08-12 | Origin · DL-309 |
| **v1.1** | 2026-08-16 | Two clocks · additive book retired PB-VIEW-4 · six next-steps · SL Law A consumer / atomic / tier-as-state · DL-396 |

**End of OT-EF v1.1**
