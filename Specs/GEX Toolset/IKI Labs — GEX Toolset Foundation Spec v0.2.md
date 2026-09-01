# IKI Labs — GEX Toolset Foundation Spec v0.2

**Status:** **DRAFT** — amendment. Not build authority.
**Date:** 2026-09-01
**Current revision:** **v0.2**
**Supersedes:** [v0.1](./IKI-Labs-GEX-Toolset-Foundation-Spec-v0_1.md) — **only** in the clauses
named in §2. Everything else in v0.1 stands unchanged.
**Canonical filename:** `Specs/IKI-Labs-GEX-Toolset-Foundation-Spec-v0_2.md`
**Type:** Amendment — **scope boundary** and the **staging insertion contract**

**Why this exists.** Coach, 2026-09-01:

> *The Factory can have several entry points up until staging, where the product is prepped as a
> user facing product with landing page, product, guides, catalog entry etc. These products will
> enter the pipeline right before that staging operation.*
>
> *The full factory pipeline starts with a product idea, then progresses to a staged product. The
> full factory process is out of scope for this development project, however I will provide
> specifications so we can insert it into the pipeline.*

v0.1 §2 described a component model without naming the boundary between **what this project builds**
and **what the Factory does with it**. An implementer reading v0.1 could reasonably have started
building staging machinery. This amendment draws that line and specifies the handover.

**The six tool specs are unaffected.** They are tool contracts; none of them reaches the boundary
this amendment draws.

---

## 1. Not reopened

This amendment does not touch, and may not be cited to revisit:

- **GXF7–GXF11** — the formula freeze, `gex_v2` ownership, the unsigned flow lens
- **GXF14, GXF15** — volume accounting separated from hygiene; roll detection before clamp
- **GXF19–GXF22** — per-book session windows, the 16:00/16:15 state, AM settlement, post-close accrual
- **GXF25–GXF29** — plane assignment, the plane's real shape, plane failure behaviour
- **GXF30–GXF34** — the coverage contract and the layered declaration rule
- **GXF35–GXF40** — copy law
- Anything in §§3–18 of v0.1 not named in §2 below

---

## 2. Amendments

### 2.1 §0 — amended: the Factory, and where these tools enter it

v0.1 §0 said IKI Labs is *"a pipeline that creates tools."* True, and incomplete. The Factory is a
**staged pipeline with several entry points**, running from product idea to staged product:

```text
   idea ──► … several entry points, each admitting work at its own maturity … ──┐
                                                                                │
                                                        ┌───────────────────────┘
                                                        ▼
                                              ►►  THIS PROJECT ENTERS HERE  ◄◄
                                                        │
                                                        ▼
                                                    STAGING
                                        landing page · product record
                                        guides · catalog entry · …
                                                        │
                                                        ▼
                                              live, subscribable component
```

**GXF48 — the Factory pipeline is OUT OF SCOPE for this development project.** Its stages, entry
points, gates, tooling and staging operation are specified separately by Coach. This project does
not design them, build them, or assume their shape.

**GXF49 — this project's terminal deliverable is a component ready for staging insertion,
not a live member feature.** The definition of done for the toolset is the insertion contract in
§2.3 — satisfied, evidenced, and handed over. Landing page, product record, catalog entry and
member guides are **staging's** outputs, produced by the Factory from what we hand it.

**GXF50 — do not build ahead of the boundary.** No landing page, no catalog row, no pricing surface,
no product marketing copy is produced by this project. Building staging machinery before its
specification arrives is how a parallel, ungoverned path becomes normal — the failure
`INSTRUCTIONS` §11.5 already names in this repo, and the one the "no autonomy theater" non-goal
exists to prevent.

### 2.2 §2 — amended: what the component model does and does not cover

v0.1 §2 defined `ToolComponent` and its laws GXF3–GXF6. **Those stand**, with their scope now
stated:

| In scope — this project | Out of scope — the Factory |
|---|---|
| The component **object**: id, version, entitlement key, plane declaration, layout, handoff flag | The **registry the Factory stages into**, and the staging operation itself |
| The component's **runtime contract**: what it computes, its output schema, its coverage object | The **catalog entry**, its copy, its placement and its merchandising |
| The **entitlement key** the component declares | The **plan mapping** that key resolves through at staging, and any pricing |
| **Draft status** on the object (GXF5) | The **human promotion gate** that flips it, which is staging's (invariant 7) |
| **Version pinning semantics** (GXF6) | Subscription lifecycle, billing, renewal, cancellation |
| The **L1 payload** and **L2 surface** declaration layers (GXF31) | **L3 guides and wiki pages — Oscar's** (GXF47, unchanged) |
| The **landing-page facts** listed in §2.3 | The **landing page** |

**GXF51 — the component is built to be staged, not built staged.** Every field in §2.1 of v0.1
exists so the Factory has something to act on. None of them is populated by this project beyond its
own truthful value: `status` stays `draft`, and `label` is a working name until Echo settles it
(**OD-GXF2**).

### 2.3 New — the staging insertion contract

**GXF52 — a component is ready for insertion when, and only when, all of the following exist and
are evidenced.** This is the handover, and it is the toolset's definition of done.

| # | Artifact | Owner | Evidence |
|---|---|---|---|
| **1** | The component object, complete and valid, `status: draft` | Build | Registry entry; schema validation passes |
| **2** | Runtime contract: output schema, units, sign convention, `algo_version`, all versioned and immutable per **GXF6** | Build | Schema published; version recorded |
| **3** | The coverage object, on every response and every artifact | Build | **AT-AN1** passes |
| **4** | The on-surface declaration strip (L2), persistent, never a hover | Build | **AT-AN2**, **AT-AN3** pass |
| **5** | Full acceptance-test transcript for that component, including its AN-series tests | Build → Delta | Commands and output attached |
| **6** | Live evidence: curl the API, read it back, walk the UI | Build → Delta | Transcript + browser walk (invariant 4) |
| **7** | **Guide source pack** — the five items in v0.1 §16, with every magnitude carrying its fixture count (**GXF39**) | Build → **Oscar** | Handed over; Oscar writes L3 |
| **8** | **Landing-page facts** — what the component computes, what it does not, its known limits, its scope, in the register's language | Build → staging | A facts sheet, **not** marketing copy (**GXF50**) |
| **9** | Copy-law attestation: banned strings absent from payload field names, chrome, and any print template | Build → Echo/Tango | **AT-GP11**, **AT-NC3**, **AT-PF9** and siblings |
| **10** | Entitlement key declared; universe and session gates enforced | Build → Mike | **AT-NC10** and siblings |
| **11** | Open decisions for that component **disposed**, not carried | Coach | OD table shows Accept / Override per row |
| **12** | Decision-log entry and spec/architecture parity landed | Lima | Same day as approval (invariant 6) |

**GXF53 — an incomplete insertion is not inserted.** A component missing any row above does not
enter staging early "to be finished there." Staging's inputs are these twelve artifacts; a partial
handover moves unfinished work across a governance boundary, which is the one thing the boundary
exists to prevent.

**GXF54 — the facts sheet is not marketing copy, and the distinction is enforceable.** Row 8 is a
statement of what the component computes, what it declines to claim, and where it is known to be
limited — written in the register's register (**GXF13**, **GXF36**, **GXF39**). Staging turns facts
into a landing page. This project does not write the page, and it does not write a facts sheet that
is a page in disguise.

### 2.4 §18 — non-goals extended

Add to v0.1 §18:

- **The Factory pipeline itself** — its stages, entry points, gates, tooling, and the staging
  operation (**GXF48**)
- **Landing pages, product records, catalog entries and pricing surfaces** (**GXF50**)
- **Member guides and wiki pages** — Oscar's (**GXF47**, restated here because it is a boundary,
  not only an ownership note)
- **Subscription lifecycle** — billing, renewal, cancellation. Providers own checkout; the app never
  invents charges

### 2.5 §19 — open decisions amended

| # | Change |
|---|---|
| **OD-GXF9** | **Superseded.** Subscription lifecycle is out of scope (§2.4). Version pinning **semantics** stay in scope (**GXF6**); the subscription's *behaviour* on a new version is the Factory's decision |
| **OD-GXF11** | **NEW.** At which Factory entry point do the six components formally enter — one insertion for the family, or one per component? **Recommendation: one per component**, because **OD-GS4** and **OD-NC4** already stage the Surface and the Card behind the others. A family-level insertion would hold four finished components hostage to two that are deliberately later |
| **OD-GXF12** | **NEW.** Does the facts sheet (row 8) have a template, and who owns it? **Recommendation: Lima owns the template, Hotel reviews the limits section.** A per-component freehand facts sheet will drift into copy by the third one |

---

## 3. Acceptance tests (additions)

| ID | Test |
|---|---|
| **AT-GXF14** | A component whose insertion pack is missing any **GXF52** row is rejected at the boundary; the rejection names the missing rows |
| **AT-GXF15** | No build artifact of this project contains a landing page, catalog row, pricing surface or product marketing copy (**GXF50**) |
| **AT-GXF16** | Every component ships `status: draft`; no build path sets it otherwise (**GXF51**, invariant 7) |
| **AT-GXF17** | The facts sheet passes the same copy-law check as surface copy — banned strings absent, no mechanism→outcome step, every magnitude carrying its fixture count (**GXF54**) |

---

## 4. Document control

| Version | Date | Notes |
|---|---|---|
| v0.1 | 2026-09-01 | Initial foundation |
| **v0.2** | 2026-09-01 | **Scope boundary amendment.** §0 amended with the Factory's shape and this project's entry point immediately before staging. **GXF48** Factory pipeline out of scope; **GXF49** terminal deliverable is a component ready for insertion, not a live feature; **GXF50** do not build ahead of the boundary; **GXF51** built to be staged, not built staged; **GXF52** the twelve-row insertion contract; **GXF53** partial handover refused; **GXF54** facts sheet is not marketing copy. §18 non-goals extended; OD-GXF9 superseded; OD-GXF11–12 opened. AT-GXF14–17 |

**One-line law:**
**This project builds six components and hands each one over complete — object, contract, coverage,
strip, evidence, guide source and facts — and builds nothing on the far side of the staging line.**