# Observer post-trial gift surface — note

**Date:** 2026-09-13  
**Revision:** **v0.6** (same day — boundary made durable outside chat). v0.1 inferred three Options Lab heatmap templates (**wrong**). v0.2 named IKI Labs Runner + Analyzer as the gift. v0.3: those two are a **platform**. v0.4: XSP/SPY scale is **not** this goal. v0.5: Width Fit is a **switcher template**; `observer-light` is DL-only; Runner **is** `web/lib/runner/`. v0.6: **DL-328** — chat does not count; copies of the boundary live on the plan (**NX18**), this note, and **FI-049**.  
**Status:** **NOTE** — standing context for later design and review. Not a Spec. Not BUILD AUTHORITY. Not a membership-policy change.  
**Raised by:** Coach, 2026-09-13.  
**Recorded by:** Juliet / Grok.  

### How to use this note

Keep it in mind when writing or reviewing **later** IKI Labs, Runner, Factory, Analyzer, and membership designs. Do **not** enlarge the current XSP/SPY packet to “address IKI.”

**Durable boundary (must survive a new session; chat does not count — DL-328):**

> I will not treat a passing XSP/SPY gate as progress on the bigger goal.

Copies: this note · plan v1.2 **NX18** + GO checklist tick · **FI-049** (`Architecture/flagged-ideas.md`). A later session that “fixes IKI while we’re in XS*” has violated all three.

**Runner is Template Runner.** `web/lib/runner/registry.ts`, Spec v0.1 / v0.1.1, DL-681. Not a coined product name. Do **not** re-raise a collision with `web/lib/runner/`.

**Coach (2026-09-13):** *The SPY/XSP change is only to fix a glaring problem with the current templates; it in no way addresses the much bigger goal, and it is not intended to. Context so that as we develop, you can create and review designs with that knowledge.*

**Parents already on disk (do not re-litigate):**

| Doc | Role |
|-----|------|
| **DL-681** (`Architecture/00-decision-log.md`) | 0DTE Live funnel. If they do not convert: **IKI Labs Runner and Analyzer as gifts**, plus token heatmaps, then market IKI products. Free plan **`observer-light`**. Runner + Analyzer **are Options Lab**; IKI products are **plug-ins to the Runner** |
| [`docs/FatTail-Labs-IKI-Lab-Executive-Summary.md`](./FatTail-Labs-IKI-Lab-Executive-Summary.md) | IKI Lab suite: Wiki · **Factory** · **Runner**. Factory produces templates. Runner runs them. Knowledge door is licensed (contact + intent), not OSI open source |
| [`docs/Dual-Goal-Product-Strategy-2026-07-29.md`](./Dual-Goal-Product-Strategy-2026-07-29.md) | G1: Observer trial → Navigator. Trial = Navigator Practice parity for the term |
| [`docs/Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.2.md`](./Options-Lab-XSP-SPY-Scale-Full-Agent-Bench-Plan-v1.2.md) | **Separate packet.** Fixes a glaring scale bug on **current** templates. Does **not** deliver IKI Labs, observer-light, Factory catalog, or the base capability |
| [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) | Runner = template engine over OPF. Options Lab is another **host** of the same engine |
| IKI Factory Spec v0.1.5 | Where new templates are made. Standing cadence. Not a launch |

---

## Coach restatement (2026-09-13) — this revision

> Gift the **Analyzer** and **Heatmap** (under the name **Runner**) in a new app suite called **IKI Labs**. Offer **new templates** created in the **IKI Factory**, that they may want to purchase on subscription.

That is the gift. Not “leave them Advanced Fly, Broken-wing, and Vertical inside Options Lab.”

**Coach, same day, further:** Heatmap and Analyzer are a **base capability** that can run potentially **hundreds of new templates with great depth**, extending **beyond the options chain**. Options chains are the **first substrate**. Revenue from Factory templates on subscription keeps retired trial members in orbit and raises the chance they take **Navigator** later.

---

## Base capability (v0.3)

Runner + Analyzer are not a consolation prize of two screens. They are the **host**:

| Layer | What it is | What it is not |
|-------|------------|----------------|
| **Base capability (gift)** | **Runner** = Template Runner already on disk (`web/lib/runner/registry.ts`: *“One registry. Hosts differ by sink bindings, not by forked templates.”* Spec `FatTail-Labs-Template-Runner-Spec-v0_1.md` / `v0_1_1.md`. DL-681. **Not a new product name.**) + Analyzer. Depth enough to run a catalog | A frozen trio of Options Lab templates; a second engine beside `web/lib/runner/` |
| **First substrate** | The OPF-held option chain — 18 names, full greeks, snapshot cadence (IKI Lab exec summary §2) | The only substrate forever |
| **Catalog (subscription)** | IKI Factory templates — potentially hundreds, great depth, some still chain-shaped, some not | The gift itself |
| **Orbit / revenue** | Retired trial members keep the host; they may buy templates; they remain on the list; Navigator annual stays the coaching conversion | A second high-ticket tier that replaces coaching |

```text
First substrate: option chains (OPF)
        │
        ▼
Base capability (gift)     Runner  ←→  Analyzer
        │                    │
        │                    └── token heatmap (pick) + view a structure
        │
        ▼
Factory catalog            10s → 100s of templates, subscription
        │
        ├── still on the chain (beachhead / traders)
        └── later substrates (analysts, treasurers, operators — IKI §3.4, §8)
```

**Why gift the host, not a view.** A view they outgrow. A host they already have is why the next Factory template is a **plug-in sale**, not a new app install. That is the orbit: cheap to serve (published grids / templates, DL-681), priced as re-engagement, aimed at **Navigator later**, not at replacing Navigator now.

**Beyond the chain (intent, not this note’s build).** IKI Lab exec summary: the audience is not traders as the size of the thing; the 18 names proxy industries and cycles; beachhead views may assume a chain, market views must not. As-built, **both** ends of Runner are chain-shaped: `RunnerStreams` is `{ chain?: unknown; … }` and `HeatmapTiles` is `rows: { strike }`, `cols: { widthPts }` (`web/lib/runner/registry.ts`). `RunnerOutputKind` is only `"visual/heatmap"`. Widening input **and** output is a Runner / Factory program when Coach names it. This note only records that the **gifted host must be able to grow** — a second engine for “non-chain templates” would orphan the orbit.

**What v0.1 got wrong, restated.** Advanced Fly, Broken-wing, and Vertical are candidate **token** templates on the first substrate. They are not the product. The product is the base capability.

---

## Corrected understanding (v0.2, still in force)

**IKI Labs** is the suite they keep. Two gifts sit in it:

| Gift | Name in IKI Labs | What it is as-built | Job in the orbit |
|------|------------------|---------------------|------------------|
| **Runner** | Heatmap, named Runner | Template Runner engine (`web/lib/runner/**` + heatmap templates). Options Lab Heatmap is another host of the same engine (exec summary §7) | The host they already have. Pick / see the chain through a template |
| **Analyzer** | Analyzer | Options Lab Analyzer (risk graph + book / Create-Edit) | View and work a structure |

**Factory templates** are not the gift. They are the **subscription**: new views the Factory builds, sold as plug-ins into a Runner the member already owns. That is why the gift is the engine, not a frozen trio of templates. DL-681: *“Everything IKI sells afterwards is another plug-in for a Runner the member already has, which is the whole mechanism of the email offers.”*

```text
IKI Factory  →  templates (Knowledge / Intelligence products)
                     │  subscription plug-ins
                     ▼
IKI Labs suite
  ├── Runner   ← Heatmap engine (gift)  — already running a token template
  └── Analyzer ← view / work a structure (gift)
```

**What v0.1 got wrong.** Advanced Fly, Broken-wing, and Vertical were inferred as “the three templates we give away.” Coach named the **engine** (Heatmap → Runner) and the **Analyzer**, in the **IKI Labs** suite, with Factory output as the paid catalog. Those three templates may still be the **token heatmap** that ships with the gratuitous Runner (DL-681: “one heatmap for picking”). That is a token, not the product. The product is the Runner they keep so later templates have somewhere to plug in.

**Funnel (DL-681, unchanged by this restatement):**

```text
0DTE Live
  → Observer trial (Navigator Practice parity for the term)
      → Navigator annual (group coaching) 
      → or observer-light: IKI Labs Runner + Analyzer (gift)
            → email list
            → Factory templates / Strategy Lab on subscription
```

Trial still expires **coaching**, not the tools (capacity over dependency). The gift is how they stay in orbit without the coaching room.

---

## Impact on the first substrate (still true, narrower)

The Runner they are gifted **is** the heatmap engine. Whatever **token** template ships with it on the chain (Advanced Fly, Broken-wing, Vertical, or a later Factory view) consumes the **same column-width resolver** and the **same OPF chain**. Analyzer Create consumes the **recipe + listed-snap** resolver.

So XSP/SPY scale honesty is still load-bearing for the **first substrate of the gift**:

- A gifted Runner on XSP that paints **10…50** is the unfillable ladder, on the orbit surface.
- A gifted Analyzer that seeds 1-wide then `handleTemplate`s back to 20 **disagrees with the Runner they were just given**.
- QQQ/IWM 10…50 on that engine is still the B3 deferred defect **if** the gift door can select those symbols.
- **Width Fit is its own Heatmap template** (`WIDTH_FIT_TEMPLATE_ID = "width-fit"`, `widthFitTemplate.ts`: *“Coach: Template switcher, not Value”*). It is **not** a value mode on Advanced Fly. `symFlyTemplate.valueModes` has ten modes and `width_fit` is not among them. Entitlement is the same class of question as LIM and GEX (OQ4) — token with the gifted Runner, paid Factory plug-in, or paid Options Lab only. Do not silently ship it because Advanced Fly shipped.
- Factory subscription templates plug into that same Runner. If the engine lies about scale on the first substrate, every later chain-shaped IKI product inherits the lie. Non-chain templates inherit a host that was taught to shrug at listed truth.

Scale work does not become an IKI Factory packet. It becomes **honesty on the host IKI Labs is about to give away** — the host that has to survive hundreds of templates.

---

## As-built checks (2026-09-13)

Verified on disk. Do not re-open as naming debates.

| Claim | Verdict |
|-------|---------|
| **Runner is Template Runner** | **True.** `web/lib/runner/registry.ts` L1–3; Spec v0.1 / v0.1.1. Coach was using the existing name (DL-681). A “product name vs `web/lib/runner/` collision” warning is **wrong — disregard**. Hosts differ by sink bindings, not by forked templates |
| **Width Fit is a switcher template** | **True.** `widthFitTemplate.ts` L2, L10–18. Not a `sym-fly` value mode (`widthFit.test.ts` L216) |
| **`RunnerStreams` is chain-only** | **True.** `{ chain?: unknown; content_hash?; epoch_quality?; stale? }` (`registry.ts` L58–63). `RunnerOutputKind` is the single literal `"visual/heatmap"` (L24) |
| **`HeatmapTiles` is chain-shaped too** | **True.** `rows: { strike }`, `cols: { widthPts }` (`registry.ts` L42–56). Beyond-the-chain is blocked on **output type**, not only input |
| **DL-681 “token heatmaps”** | Quoted accurately, including that phrase |
| **`observer-light` in the tree** | **Absent.** DL-681 named it; grep of the repo is empty. Gap, not OQ |

---

## Naming tension (do not silently resolve)

**DL-681 (2026-09-06):** *“The Runner and the Analyzer are Options Lab … IKI products are plug-ins to the Runner.”* HOST row “IKI Labs Runner + Analyzer” **reads Options Lab Runner + Analyzer**.

**Coach 2026-09-13:** gift them **in a new app suite called IKI Labs**; Heatmap **under the name Runner**.

Possible readings (Coach chooses; this note does not):

1. **Same as DL-681.** IKI Labs is the suite chrome (Wiki · Factory · Runner). The gift is Options Lab’s Runner host + Analyzer, labelled IKI Labs for the observer-light door. Plug-ins remain Factory products.
2. **IKI Labs is a distinct Apps-grid suite** that *contains* Runner + Analyzer as first-class apps, with Options Lab remaining the paid/trader host of the same engines.

v0.1 assumed (2) for Options Lab leftovers. DL-681 reads closer to (1). Today’s sentence can be either. **India / HOST** own the row; this note only flags the seam.

---

## Open questions (Coach — when ready)

1. **Token heatmap** — which template(s) ship with the gratuitous Runner? One (DL-681 “one heatmap for picking”) or Advanced Fly + Broken-wing + Vertical?
2. **HOST row** — confirm reading (1) or (2) above. Does observer-light open `/app/options-lab` chrome, `/app/iki` suite chrome, or both?
3. **Analyzer gift** — risk graph + book + Create/Edit, or view-only (“Analyzer for viewing them,” DL-681)?
4. **Width Fit / LIM / GEX** — each is a **template-switcher entry**, not a value mode. Token with the gifted Runner, paid Factory plug-in, or paid Options Lab only? (Width Fit: `id: "width-fit"`.)
5. **Symbol set on the gift door** — SPX-class only, or XSP / SPY / QQQ / IWM? Decides whether XS-ETF is a gift-surface defect.
6. **~~`observer-light` in `provider_plan_map`?~~ Answered 2026-09-13.** Zero occurrences of `observer-light` / `observer_light` in the repo (no migration, no server, no client). DL-681 named a plan that **has not landed**. That is a decision-log-versus-reality gap, not an open question. Mike/India still owe the identity spec if Coach still wants that plan name.
7. **Factory subscription** — same ~$5–10 re-engagement products (DL-681), sold as Runner plug-ins, not a second high-ticket tier?
8. **Second substrate** — when (not whether) `RunnerStreams` widens past `chain` **and** `HeatmapTiles` widens past `{ strike }` / `{ widthPts }`. Until then, “beyond the options chain” is intent on the gifted host, not a parallel engine. Output is chain-shaped too, not only input.
9. **Navigator later** — confirm the gift’s job is **keep-warm toward Navigator annual**, not a permanent substitute for coaching. Coaching still expires at trial end (DL-681).

---

## Relationship to XSP / SPY scale (v0.4)

Two programs. Do not merge them.

| | XSP/SPY (plan v1.2) | This note (IKI Labs orbit) |
|--|---------------------|----------------------------|
| **Job** | Stop current Advanced Fly / Create templates treating XSP and SPY as mini-SPX | Gift Runner + Analyzer as a **base capability**; Factory templates on subscription; keep retired trial members in orbit toward Navigator |
| **Scope** | Two symbols, current templates, listed honesty | Host, catalog, membership remainder, later substrates |
| **Success** | 1-wide listed XSP Create; overlay heatmap columns; SPX unmoved | Hundreds of templates, depth, revenue, orbit — **not** claimed by XS4-G |
| **Intentionally not** | IKI Labs suite, `observer-light`, Factory catalog, stream widening past `chain` | Fixing XSP/SPY 10…50 / Create 20 |

The first substrate of the gifted host **happens to be** the same heatmap engine and Analyzer. Honesty on XSP/SPY still matters when those symbols are on that engine. It is **not** a slice of the bigger goal, not a phase-0 of IKI Labs, and not a reason to grow the XS* DAG.

When a later design is written or reviewed: ask whether the host can still run a catalog, whether a new template is a plug-in or a second engine, whether observer-light is being asked to expire tools, whether “beyond the chain” forks Runner. Those questions live here. They do not live on `XS0-W0`.

---

## Disposition

**PARKED as standing design context.** No board, no seeds, no entitlement change, no Spec bump. **Not in the XSP/SPY DAG.**

v0.1’s “three heatmap templates + Analyzer as Options Lab remainder” is **withdrawn as the gift set**.

The gift is the **base capability**: **IKI Labs Runner (Heatmap) + Analyzer**. Options chains are the **first substrate**. Factory templates — potentially hundreds, great depth, later off-chain — are the **subscription catalog** that plugs into that host. Revenue and a longer orbit raise the chance of **Navigator** later. Coaching is still the paid conversion, not the gift.

When Coach wants this executed: membership / Access Control owns `observer-light`; IKI Factory owns the catalog; Template Runner owns the plug-in contract and any later stream widening; XSP/SPY scale owns honesty on the first substrate if those symbols are on the gift. Do not let a later reader treat 10…50 on a $1 product as “fine for IKI Labs,” and do not fork a second engine for “non-chain templates.”
