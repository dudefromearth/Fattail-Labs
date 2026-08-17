# FatTail Labs — Options Lab OPF Truth & Elegant Failure Doctrine v1.0

**Status:** **SUPERSEDED** by [OT-EF v1.1](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) (2026-08-16 · **DL-396**). Kept as historical text. **Do not implement against v1.0.**

**Status (historical):** **NORMATIVE · Coach doctrine** (2026-08-12)  
**Type:** Product doctrine — positions, Builder, cards, package marks, capital-risk UX  
**Short name:** **OPF Truth · Elegant Failure** · **OT-EF**  
**Filename:** `FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.0.md`  
**DL:** **DL-309**  
**Parents:** [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · [PB Spec v0.3](./FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md) · [Analyzer Spec v0.2](./FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) · [Chain Picker OC6a](./FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md) · [Human Interface Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md)

**Audience:** Coach · India · Juliet · Alpha/Charlie · Echo · every agent that touches Options Lab positions, Builder, package marks, or risk-graph focus.

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
Open/closed changes **mark freshness** (live vs held), not **what contracts exist**.

### A2. Representability

A structure is **representable** if and only if **every leg** can be placed on the OPF-held plane for its expiration:

1. **Expiration** is a listed (or still-selectable 0DTE before settlement) date on the product calendar the plane knows.  
2. **Strike + right** exists as a contract on that expiration’s dual-side generation (or is honestly unpriceable — see Law B).  
3. **Package mark** (when claimed live/held) comes from OPF PackageQuote (or locked D*), never MSC and never a private client formula as SoR.

If any leg fails (1) or (2), the structure is **not representable** for pricing. The system must not pretend otherwise.

### A3. Card = pointer; OPF = instrument truth

| Object | SoR |
|--------|-----|
| **Position card** | Definition of what the member points at (legs, exp, direction, lock) |
| **OPF + dual-side chain** | Whether those legs are real instruments and what they are worth (natural / held) |
| **Viewport** | Visualization of **every shown** (visible) definition under one OPF resolve of the additive book — not a second book, not a radio that drops siblings |
| **Session / print quality** | **Target:** OPF feed (DL-395 · Session/Print Spec v0.1 **DRAFT**). Live vs last known print is what OPF said. **As-built:** Analyzer still uses session-status + clock until that spec is GO. |

Changing expiration or strikes **rebinds the pointer**. It does not mint a fictional option.

### A4. Surfaces in scope (normative)

| Surface | Obligation |
|---------|------------|
| Position Builder (create / edit) | Prefill and strategy regenerate **only** from OPF-held listed strikes; wait for chain hydrate; never emit non-listed strikes |
| Position card | Display package only when representable + quote/lock allows; otherwise Law B state |
| Strike ▲/▼ | Step on listed grid; missing market → Law B (**NOT TRADED**), not a fake mid |
| Analyze / Update | Must not commit a structure that invents non-OPF strikes as if they were real |
| **Risk graph / Surface viewport** | Same Law B names as cards. **No fabricated package curve** (PB-VIEW-6). Keep **scales + grid**; suppress live series when non-representable; optional centered notice using the **same calm title/detail** as the card — **never** internal codes (`PB-VIEW-6`, “dual-side generations”, “fabricated curve”). Expired-only shown book may show at-expiry residual ghost, with **EXPIRED** notice. **Two or more shown positions** draw as **one additive continuous book curve** (DL-394). |

---

## 2. Law B — Elegant failure (truthful named state)

### B1. Never leave the user believing the system is broken

When the plane is cold, sparse, past settlement, budget-throttled, or skewed:

- **Do not** leave a blank price that looks like a bug.  
- **Do not** keep a **stale** debit/credit from a previous pointer after rebind.  
- **Do not** show raw stack traces or opaque “incomplete” without a human label.  
- **Do** show a **named, calm state** and a short truthful explanation (tooltip / notice).

Exceptional cases are **expected** in options (chain edge, post-settlement, interest budget). Reporting them clearly is product quality, not error.

### B2. Package debit/credit field under exception

On exception, the package **price cell is replaced** by a **state label** (not a numeric lie):

| State | Meaning (truth) |
|-------|------------------|
| **EXPIRED** | Pointer’s expiration **calendar day has ended** after **midnight Eastern Time** (`00:00:00` America/New_York — EST or EDT). Not UTC midnight, not the member’s local midnight, not cash close. Same-day cards stay current through 23:59:59 ET. A still-shown card at/after 00:00 ET the next day uses viewport **ghost**. |
| **NOT TRADED** | Exp may be valid; one or more legs have no market on the OPF chain (incl. chain edge / sparse strikes) |
| **CHECK LEGS** | Structure cannot fully bind for other representability reasons |
| **UPDATING** | Atomic resolve in flight — not yet settled |
| **BUDGET LIMIT** | Interest/capacity throttled; definition intact |
| **WAITING** | Epoch/skew wait; not permanent failure |
| **HIDDEN** | Member hid the card |
| *(numeric price)* | Representable + OPF (or lock) mark available — live or held |

**Numeric package is shown only when the system can stand behind it.**

### B3. Atomic resolve

Pointer change (exp, strikes, template rebuild that changes definition) is **one atomic unit**:

1. Definition updates.  
2. System resolves **once** (hydrate → bind every leg → package quote if bindable).  
3. UI settles to **one** final state (price or named failure).  
4. **No** endless re-search or flash loop until the definition changes again (or the member explicitly Refresh).

The position is not a continuous partial-rebuild animation.

### B4. Bind order (every leg)

For each leg, in order:

1. **Expiration** — still selectable / not past settlement; on the product calendar the plane exposes.  
2. **Price** — contract present on the dual-side generation with a usable mark (mid or honest bid/ask midpoint).  

**All legs** must pass. Valid expiration with no strike market → **NOT TRADED** (common at chain edge). That is the plane telling the truth, not a system defect.

---

## 3. Capital-risk framing (non-negotiable intent)

Members may treat Analyzer as a **decision surface** next to real capital decisions (education product, not brokerage — still **capital-adjacent judgment**).

Therefore agents and implementers **must**:

- Prefer **under-claiming** a mark to inventing one.  
- Prefer **named state** to silence.  
- Prefer **listed-grid structure** to “something that looks like SPX.”  
- Treat regressions that invent strikes or flash false prices as **severity: high**.

Marketing and UI copy remain free of profit claims; **instrument honesty** is separate and stricter.

---

## 4. As-built map (implementation anchors)

| Concern | Location (as-built) |
|---------|---------------------|
| Listed structure prefill | `web/lib/options-lab/listedStructure.ts` · Builder `regenerate` |
| Card pointer rebind | `setCardExpiration` · `shiftCardStrikes` in `analyzerBook.ts` |
| Bind assess (exp then price) | `web/lib/options-lab/optionBind.ts` |
| Atomic package resolve | `web/lib/options-lab/usePackageQuotes.ts` |
| Named package display states | `web/lib/options-lab/cardDisplayState.ts` · `AnalyzerPositionsList` |
| Viewport curve policy + notices | `resolveViewportBookPolicy` · `visibleBookTrade` · `combineParsedTrades` · `OpfRiskAnalyzer` risk viewport |
| Unit checks | `optionBind.test.ts` · `cardDisplayState.test.ts` · `analyzerBook.pointer.test.ts` |
| Card EXPIRED vs current | `isOptionPointerExpired` — live through **23:59:59 Eastern Time** of the exp day; EXPIRED at **00:00:00 ET** the next day; then ghost |

This map may grow; **the laws do not weaken** if a path is unfinished — unfinished paths must still not invent instruments.

---

## 5. Agent / bench obligations

1. **India / Juliet:** Any Options Lab position PR that invents non-listed strikes or silent package blanks is **out of doctrine** — reject or fix before GO.  
2. **Charlie / Alpha:** Builder + card + package quote paths must stay aligned with §§1–2.  
3. **Echo:** State labels and tooltips stay calm, capital-safe, non-alarmist, and non-profit-claiming.  
4. **Delta:** Prefer characterization tests for bind + display states over “looks fine in UI once.”  
5. **Coach:** Overrides of this doctrine require a **new DL**, not a silent UI hack.

---

## 6. Relationship to fail-loud platform doctrine

Claude.md / ecosystem **fail loud** (config, missing secrets) remains.

This doctrine is the **member-facing dual** for instrument data:

| Layer | Style |
|-------|--------|
| Platform / config | Fail loud to operators |
| Member instrument surface | **Fail elegant and truthful** — named state, never a lying price |

Both reject **silent wrongness**.

---

## 7. Acceptance litmus (Coach)

A change is **doctrine-compliant** only if:

1. Every prefilled leg strike is on the OPF-held listed chain for its exp (or the UI is waiting with a clear **UPDATING** / loading notice — not a fake structure).  
2. After pointer change, the card settles **once** to either a defendable package mark or a **named** state from §2.2.  
3. A member who walks strikes to the chain edge sees **NOT TRADED** (or equivalent), not a synthetic debit.  
4. Closed market still shows **held** truth when marks exist; never invents open-session live claims.

---

**End of OT-EF v1.0**
