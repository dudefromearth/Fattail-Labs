# FatTail Labs — IKI Lab Public Data Service Spec v0.2

**Status:** **DRAFT / THESIS** — not BUILD AUTHORITY. Coach has not given GO.  
**Date:** 2026-08-21  
**Current revision:** **v0.2** — supersedes v0.1 (renamed; IKI Lab composition; template runner generalization; §1/§2 'read-only / no signals' **withdrawn as advisor error**)  
**Type:** Business + service Spec — a publishing surface built on the firm's option-chain data, organized by the Information → Knowledge → Intelligence hierarchy. IKI Lab has zero auth responsibility. Identity is platform-level (Accounts & Capital); IKI consumes the shared `/app/*` guard.  
**Short name:** **IKI Lab** (Information–Knowledge–Intelligence). OD-PDS1 **CLOSED** by Coach 2026-08-21.  
**Canonical filename:** `Specs/FatTail-Labs-IKI-Lab-Public-Data-Service-Spec-v0_2.md`  
**Sibling:** `Specs/FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md` (DL-528; not reviewed by advisor — alignment pending)  
**Source of this draft:** voice session + desktop rulings 2026-08-21 (Coach walking; advisor layer transcribing). Every ruling below was spoken by Coach. Where the advisor added structure or opinion it is labeled **[advisor]**.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| `Architecture/00-decision-log.md` | Binding rulings; DL entry proposed in §15 |
| [OPF Spec v0.2](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · Arch 30 | The governed pricing plane PDS reads **downstream of**, never directly |
| [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | Template contract PDS views descend from (chain-in, view-out) |
| [Member Wiki Spec v0.1](./FatTail-Labs-Member-Wiki-Spec-v0_1.md) | Internal wiki = source of record for public explanations (§11) |
| [SEO Spec v1.3](./FatTail-Labs-SEO-Spec-v1_3.md) | Public-surface copy rules; Sacred Invariant #8 |
| CLAUDE.md · AGENTS.md · INSTRUCTIONS.md §2 | Sacred invariants — #8 (process outcomes only) and #9 (capacity over dependency) apply to every public word |

**Coach Content Law (doctrine §11 · DL-176):** Nothing of Coach's is removed. §13 is the ideas inventory; if anything from the session is missing there, that is a defect in this document.

---

# Part I — Executive Summary

## The asset

FatTail Labs holds a dataset retail cannot obtain and institutions keep to themselves: full option chains with **full greeks**, at snapshot cadence, across **18 symbols**, every weekly expiry, continuous through regular trading hours. Expensive, licensed, unpublished.

Those 18 names are not "tickers." They proxy energy, rates, metals, technology, the dollar, and broad equity risk — industries, economies, business cycles, boom and bust. Options are the largest derivatives market in the world, and every second of the session they price a **forward-looking opinion with a distribution attached**. Every other dataset the wider world works from is backward-looking. Today that opinion is translated for institutions and nobody else.

## The thesis

1. **The edge is not the data.** The edge is in how people think, and people think the way they always have. Publishing honest measurements of the chain gives nothing away that matters. There are no crown jewels to withhold.
2. **Nothing is free.** Every level is priced. Price is money **or something of equal value** — contact with declared intent, attribution, citation, data returned, referral, **affiliation**. A financial-data list with intent is among the most expensive lists money can buy; this acquires one at near-zero cost.
3. **Near-zero cost structure.** The data is already paid for. Each view is a one-time build. No marginal cost per visitor. The views are produced once and delivered in many forms.
4. **The audience is not traders.** Options traders are roughly one percent — the beachhead, closest to what Coach does, easy targets. The real market is everyone whose living depends on what those 18 names price and who would never open a chain: analysts, treasurers, planners, journalists, operators.
5. **The factory, not the launch.** A few dozen views up front, then a standing cadence — dozens a month, a few good ones a month — as a continuous process. Templates are a **search** as much as an output: some become merely interesting visuals, some become valuable insights, and new angles and businesses will be discovered during development. Multiple models (Claude, Grok, others) generate candidates; divergence between them is signal. **The list is the instrument** that tests candidates against real people.
6. **Structural tailwind.** As exchanges add more multi-day and multi-week expirations, term-structure resolution improves and the asset appreciates without further work.
7. **Posture: under the radar.** No comparison, no adversary, no "what Bloomberg won't." Plain description, organic growth. The terminal frame stays private as understanding, never as copy.

## The organizing principle: Information → Knowledge → Intelligence

A three-level hierarchy, each level begetting the next. Coach's frame from the mid-1990s — developed on Wednesday nights with Jerry Shawns under a company called **Jelmor** (an acronym of their children's names) — as a thesis about where the newly born internet was going. It described the internet correctly, in that order, over thirty years. It now describes this product, and it is the **load-bearing structure** of the service, not a taxonomy invented for this document.

| Level | What it is here | Commercial shape |
|---|---|---|
| **Information** | The chain itself. Raw, true, timestamped. The scarce thing. | Exchanged for **contact + declared intent** |
| **Knowledge** | A view — a measurement derived from the chain, organized and presented. **Not free.** | **Licensed**, by delivery mode, priced in whatever currency fits the customer (money, attribution, affiliation, data, referral) |
| **Intelligence** | Specialized inference models reading across the whole corpus — patterns no single snapshot contains. | **Contractual.** Named parties, defined scope, term, and use. One party at a time. |

One substrate. Three transaction types. Where the "intelligence" boundary sits inside a model is not for Coach to adjudicate — "it's just for me to deliver." The spec therefore takes no metaphysical position; it specifies what is published, in what form, with what caveats.

## The hard line (valuable, not a compromise)

Publishable: what is priced now; today versus its own history; symbol versus symbol; where the surface disagrees with itself; and **what actually happened afterward, as historical fact**. Not publishable: any claim about what *will* happen, any probability offered as a claim rather than as the market's own pricing, anything readable as a position recommendation. The honest side is the stronger product — the reader draws the conclusion, which is capacity-over-dependency expressed in a data product.

## Origin (for the record, dated)

Coach built a convexity heat map months ago to give options traders speed, quality, and cost at once. The AI tooling of the time could not express the intent; the result was a complex architecture with memory leaks that frustrated users. A member named Gary, frustrated and leaning for another view, triggered the inversion that arrived all at once: **make the raw option chain the sole input**, publish it once through a cached pub/sub gateway, create the OPF, and let **templates** be the only thing that varies. That inversion is why a factory is possible and why the cost structure works. Gary left because Coach "wasn't delivering" — the week before the fix that delivers. Serendipity, and the decision log carries the dated authorship trail.

---

# Part II — Service Specification (outline, v0.1)

## §1 Purpose and scope

- **IKI Lab** is the app suite (renamed from the Wiki suite by Coach, 2026-08-21). At v0.2 it contains: **Wiki** (the FatTail wiki), **IKI Factory** (empty at this date), and the **IKI template runner** (to be created).
- Publishes **measured views** derived from the option chain across the supported symbol universe. IKI Lab has zero auth responsibility. Identity is platform-level (Accounts & Capital); IKI consumes the shared `/app/*` guard.
- No advice, no recommendations, no forecasts (hard line, Part I).
- **Withdrawn (advisor error, v0.1 §1/§2):** "publication only · read-only · no signals · nothing a visitor does affects any Labs system." Coach never ruled this; it was derived and survived by silence. Replaced by §2a.
- Part of FatTail. No adversarial positioning (§12).

## §2 Data plane

- Source: the existing chain-snapshot infrastructure and OPF.
- IKI consumes a **published copy** of chain/snapshot data; it does not write into the governed pricing plane or member records, and places no load on them.
- Staleness of the copy is **declared on every view** (§5).

## §2a The IKI template runner (Coach rulings, verbatim in intent)

1. "The IKI heatmap is a **generalized heatmap template runner**." It runs any template in the registry. "Stop trying to put limitations on it."
2. The Options Lab heatmap provides visualizations like GEX; **so does IKI**. Nothing the Options Lab heatmap can show is excluded from IKI.
3. Purpose differs by template, not by host: the Options Lab heatmap finds trades and sends them to the Analyzer; an IKI template may send **notifications**, **fire signals into an API**, be **pure visual**, or have **any number of uses besides presentation**.
4. Output forms: **heatmaps, charts, graphs** — **static and live**.
5. Templates **can have controls** to vary the output.
6. Output is **visual and/or data**.

**[advisor] consequences:** one template registry, one runner, two hosts (Options Lab, IKI Lab). The template contract (§4) gains **controls**, **output kind**, and **exit/action**. The runner's data output is the production engine for the licensed delivery modes (§8), not a display layer in front of them. A signal is an action, not a claim: **it fires on a measurement condition the consumer chose, never on a forecast** — wording for Coach to ratify (OD-PDS5). Generalizing beyond HM v0.2's heatmap-shaped contract is a contract version bump; advisor recommends a parent **Template Runner Spec** consumed by both hosts rather than growing the Heatmap spec's name (OD-PDS9).

## §3 Hierarchy mapping (binding)

Every artifact PDS produces is classified as **Information**, **Knowledge**, or **Intelligence** (Part I table). The classification determines its exchange terms (§7) and its delivery modes (§8). No artifact ships unclassified.

## §4 View contract

The heart of the spec; what makes the factory possible. A **view** is:

1. a **measurement** (declared inputs, declared method, versioned),
2. a **presentation**,
3. an **honesty declaration** (missing-data behavior, proxies, staleness),
4. an **audience framing** (who it is translated for),
5. **controls** — what the viewer can vary (may be none),
6. **output kind** — visual, data, or both; static or live,
7. **exit / action** — what a click or condition does: none · Analyzer · notification · API signal · other declared target.

The same measurement may ship as multiple views under different framings (trader / analyst / treasurer / journalist).

## §4a Runner ↔ Wiki interface (Coach ruling 2026-08-21)

**"The IKI Runner produces Knowledge and Intelligence. The Wiki consumes it and links it."**

- Direction is **one way: runner → wiki.** The wiki has no dependency on the runner; the runner has no dependency on the wiki.
- Every runner output is an addressable artifact (§8 provenance: template id, version, inputs, timestamp). The wiki **links** to it by that address and may **embed** it (static or live) via a new Display component registration under Wiki Interface v0.1 §6.
- Factory promotion may **publish a view's explanation page into the wiki** through the existing D-11 commit/staged-write path (Member Wiki v0.1) — never a second write path.
- Because the wiki holds the link, a view can resolve its own explanation by the same reference. No reverse index is maintained in the runner.
- **[advisor]** This is the hierarchy made into plumbing: Information (chain copy) → runner → Knowledge/Intelligence artifacts → wiki (consumer, index, narrative). Hotel's mandatory gate on the wiki (Member Wiki v0.1 reviewer table) therefore covers every runner artifact the wiki surfaces.

## §5 Honesty rules

- Gaps stay gaps. No interpolation, no fill, no silent zeros.
- Proxies labeled. Timestamps visible. Staleness visible.
- **A failure state is a first-class output**, not an error page. Members are given everything — all information, all caveats, **the ability to see the fail**. Showing gaps as gaps is *more* compelling; honesty and quality point the same direction.
- Every view carries its **explicit non-claim**.
- Credibility mechanism: institutional authority is not available; **showing the work** is.

## §6 Identity and consent layer

- Email + intent. **Intent is a structured choice, not free text** — it is the segmentation key.
- Consent recorded. No dark patterns. One-click unsubscribe.
- Treated with more care than the views, because the list is the asset.
- No linkage to Labs member accounts (§9).

## §7 Exchange terms (not "pricing")

Every level is priced; currency varies by level and customer.

| Level | Currencies accepted |
|---|---|
| Information | contact + intent |
| Knowledge | money · attribution · citation · affiliation · data returned · referral — per delivery mode (§8) |
| Intelligence | **contract** — negotiated, named parties, scope, term, permitted use |

The free tier launches **genuinely complete**. What, if anything, is later held back comes out of observed demand, **not advance planning** (Coach: not yet knowable).

## §8 The asset and its delivery modes

Each view is a **produced, versioned digital asset with provenance** (source data, timestamp, method, version) — and therefore **licensable**. "Free to look, licensed to use."

| Mode | Form | Typical exchange |
|---|---|---|
| On-site view | page | contact + intent |
| Embed | iframe/script in a third-party page or dashboard | attribution / affiliation |
| Static export | image / PDF for decks and reports | attribution or money |
| Data file | the numbers behind the view | money |
| API | programmatic access | money (higher) |
| Scheduled delivery | same view to an inbox on a cadence | contact / money |
| Syndication | a publication runs it | attribution / affiliation |
| **Event / signal** | notification or webhook fired into a consumer's API on a declared measurement condition | contract (Intelligence tier) or money |

Produce once, monetize many times. License terms differ by mode. **OD-PDS2:** whether the licensable asset is *each view*, *the collection*, or both (Coach confirmed the per-view reading; collection-level licensing not yet ruled).

## §9 The factory

- Candidate → review → published pipeline; a **standing 24-hour process**, not a project.
- **Inherited chrome** so nothing is designed twice.
- **Candidate register**: no generated idea is ever lost — including failures and views judged merely interesting.
- **Multi-model generation** (Claude, Grok, others) with a process that treats divergence as signal.
- **The list tests candidates.** Open/convert/return data (§10) feeds back into what gets built next. **[advisor, held as opinion]** popularity finds compelling views, not necessarily valuable ones; a second signal (Coach's trading and coaching side) may be needed so quiet-but-true views survive. Coach: this will reveal itself in operation; do not plan it now.

## §10 Site measurement

Which views get opened, converted on, returned to, exported, embedded. This is the **discovery instrument** for both the factory and the future paid/contract tiers.

## §11 Wiki

- Every view ships with its explanation: what the measurement is, why it matters, what it does not claim, how to read it — written directly off the view contract (§4).
- **Build a public wiki; source it from the existing member wiki.** The internal wiki remains the system of record; the public wiki is a curated, read-only downstream subset (same pattern as §2).
- **[advisor]** The public wiki would be the indexable SEO/AEO surface. **Wiki Interface Spec v0.1 §1: no public rendering, no SEO surface in v1; public subset is a v2 decision (Sierra).** Therefore an OD (OD-PDS10), not a given.
- Sacred Invariant #8 applies to every public word.
- **IKI Lab foundation (2026-08-21 · DL-528):** Coach stored **Part I of this spec** (executive summary of what IKI is to become) in the member wiki as slug **`iki`** (`wiki/concepts/iki.md`). See [IKI Lab and Factory Spec v0.1](./FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md) §6.1. This does **not** GO the public wiki or this service.

## §12 Boundaries and non-goals

- Not advice. No profit or outcome claims (SI #8). No forecasts (hard line, Part I).
- No writes into the governed pricing plane or member records.
- Not a terminal.
- No comparison or adversarial copy (Bloomberg frame is private understanding only).
- Not a separate company: **all of this is part of FatTail**.

## §13 Ideas inventory (nothing omitted)

Coach's statements this session, preserved verbatim in intent:

1. Scarce data: full chains + full greeks, snapshot cadence, 18 symbols, every weekly expiry, continuous RTH.
2. The edge is in how people think, not the data; publishing costs nothing that matters.
3. Nothing free — email + intent; "list is worth money"; financial lists are the most expensive, "I can get it for free."
4. Three legs: free honest views → list; the list + feeding coaching/education for sustained recurring income; paid tier from deliberate scarcity chosen later from demand.
5. Factory: few dozen up front; dozens a month, a few good ones a month; daily 24-hour process; cost is small one-time token math per template.
6. Templates as a search: interesting visuals, valuable insights, and **new businesses discovered during development** — some deliberately designed into templates.
7. Multi-model discovery (Claude, Grok, others) with the right process accelerates it.
8. The list is the instrument: "as we're building the list, we test these ideas with the list."
9. Audience is not traders; 18 symbols are industries, economies, cycles; traders ≈ 1%, the beachhead; "every single one of them would be interested."
10. "Everything comes down to the options" — biggest derivative market in the world.
11. Business grows as multi-day/multi-week expirations grow.
12. Give members everything — all information, all caveats, the ability to see the fail.
13. "A window on a Bloomberg terminal" → "what Bloomberg won't" → **reversed**: under the radar, organic, no competing.
14. Specialized inference models providing intelligence with the data; a **hard line, but a valuable line**.
15. Information → Knowledge → Intelligence; one begets the next; a universal model Coach felt was the precursor to intelligence.
16. Intelligence is the corpus; models are developing their own kind of intelligence; "not for me to know, just for me to deliver."
17. Knowledge is **not** free. Charge money or something of equal value. **Affiliation** counts. Intelligence is **contractual**.
18. Digital asset with a license; **modes of delivery** of the asset.
19. Envisioned ~30 years ago: Jelmor, Jerry Shawns, Wednesday cribbage 7pm–2am; the hierarchy as a vision of where the internet was going; Jerry died ~11 years ago.
20. "When I see opportunity, I go towards it."
21. Origin: convexity heat map (speed/quality/cost all three); memory leaks; Gary; chain-as-sole-input + cached pub/sub + SSE gateway + OPF + templates, all at once.
22. Provenance as defense against idea theft (Working Girl). Gary: subverted customers, dominated coaching sessions; left because of non-delivery.
23. Kismet / serendipity.
24. This is fodder for the wiki; develop the public wiki, use the internal one as source.
25. "All of this is part of FatTail."
26. The working relationship: "it takes me to make you brilliant… a continuous improvement loop."

27. Executive summary placement: one version in Options Lab under the Heatmap (origin story); one with the Wiki (thesis). Coach stored Part I as wiki slug `iki` (DL-528).
28. Rename the Wiki app suite → **IKI Lab**; it contains Wiki and **IKI Factory**; recreate a version of the heatmap in it.
29. IKI heatmap purpose is very different from Options Lab's; clicks may send notifications or fire signals into an API; some pure visual (GEX).
30. IKI can provide everything Options Lab's heatmap provides; it is a **generalized heatmap template runner**; no limitations.
31. Runner produces charts and graphs, static and live; templates have controls; output visual and/or data.
32. There should be an interface to the Wiki: the IKI Runner produces Knowledge and Intelligence; the Wiki consumes it and links it.
33. Need a harness for OPF and a framework for running templates; templates consume OPF streams → knowledge/intelligence as modified streams, notifications, visualizations. Template runs in the client browser. Server only updates the model; SSE; client subscribes. SSE is a gateway. (→ Template Runner Spec v0.1)

**[advisor] Items added by the advisor, labeled as opinion, not Coach's:** the "prophecy" fourth level (withdrawn — Coach's); the initial free/paid split putting knowledge in the free tier (withdrawn — corrected by Coach); the second-signal concern in §9; the seven delivery modes in §8 as an enumeration of Coach's "modes of delivery"; the wiki-as-SEO-surface point in §11; **the v0.1 'read-only / publication only / no signals' posture (withdrawn in v0.2 — it limited the runner without a ruling)**; the Options-Lab-vs-IKI comparison table offered in chat (withdrawn — it implied IKI gets a subset).

## §14 Open Coach decisions

| ID | Question |
|---|---|
| OD-PDS1 | **CLOSED 2026-08-21:** suite = **IKI Lab**; apps = Wiki, IKI Factory, IKI template runner. Jelmor stays in backstory/exec summary; spec-body mention still Coach's call. |
| OD-PDS2 | Licensable asset = each view, the collection, or both (§8). |
| OD-PDS3 | **Implementation (Coach 2026-08-21), not a decision.** Launch surface = IKI runner host (IKI-P2) with registered templates (`sym-fly@0.2`, `spread-tax@0.1`) — Information window + Knowledge sample. |
| OD-PDS4 | **Legal/licensing.** Redistribution rights on vendor chain data under the current license(s). **Blocking-class risk** — the only item that could stop the project cold. Counsel review before any public surface. |
| OD-PDS5 | Hard-line wording for the Intelligence tier: the exact sentence that goes on every inference output (draft: "We describe what is priced and what has happened. We never tell you what will happen."). |
| OD-PDS6 | Which symbols, and whether "18" is named publicly or the universe is described by sector proxy. |
| OD-PDS7 | Relationship to FatTail Intelligence (StudioOne research project) — is PDS its publishing surface, or a sibling consumer of the same data plane? |
| OD-PDS8 | Governance lane: does IKI Lab get its own bench/board under AGENTS.md §6, and who reviews public copy (Tango/Sierra gate assumed). Note: IKI Factory is the first IKI component with writes (candidate register, promote-to-published) → SI #7 human publish gate + agent attribution (INSTRUCTIONS.md §11.4) apply. |
| OD-PDS9 | **Resolved toward parent spec:** [Template Runner Spec v0.1](./FatTail-Labs-Template-Runner-Spec-v0_1.md) drafted. Coach rulings folded there: browser execution · server updates the model · SSE is a gateway · client subscribes. Ratification pending. |
| OD-PDS10 | Public wiki rendering / SEO subset — Wiki Interface v0.1 says v2. When, and what subset. |
| OD-PDS11 | Exit/action governance: which action targets a template may declare at launch (Analyzer · notification · API signal · other), and the consent/contract required for each. |

## §15 Proposed decision-log entry (paste-ready)

```
## 2026-08-21 — DL-XXX IKI Lab Public Data Service thesis + runner rulings (no GO)

**Coach (voice session, advisor transcribed):** New business line, part of FatTail.
Public, email-gated publishing surface over the firm's option-chain data, organized
by Coach's Information → Knowledge → Intelligence hierarchy (origin: Jelmor, ~1995).

Rulings:
- Edge is in how people think, not the data; publishing honest measurements gives
  nothing away. Free tier launches complete; any later scarcity from observed demand.
- Nothing free: each level priced in money or equal value (contact+intent,
  attribution, citation, affiliation, data, referral). Knowledge is NOT free.
  Intelligence is contractual.
- Each view is a versioned digital asset with provenance; licensed by delivery mode.
- Audience is everyone the 18 symbols' industries touch; traders are the beachhead.
- Factory, not launch; standing 24h candidate process; candidate register; list as test
  instrument; multi-model generation.
- Hard line: describe what is priced and what has happened; never what will happen.
- Posture: under the radar, organic, no comparison copy.
- Public wiki built downstream of the member wiki (source of record).
- IKI reads a published copy of the data plane; no writes into pricing plane or member records.
- Suite = IKI Lab (Wiki · IKI Factory · IKI template runner). DL-528 stored Part I as wiki `iki`.
- IKI heatmap = generalized template runner: any template, heatmap/chart/graph, static or live,
  controls, output visual and/or data, exit = none | Analyzer | notification | API signal.
  No limitation on purpose. v0.1 'read-only / no signals' withdrawn as advisor error.
- Runner → Wiki, one way: runner produces Knowledge/Intelligence; wiki consumes, links, embeds.

Spec: Specs/FatTail-Labs-IKI-Lab-Public-Data-Service-Spec-v0_2.md (DRAFT / THESIS).
Closed: OD-PDS1. Open: OD-PDS2–11 (naming, asset scope, free tier, LICENSING-blocking, hard-line
wording, symbol disclosure, relation to FatTail Intelligence, governance lane).
No GO. No board. No seeds.
```

## §16 Next steps (as stated by Coach / held by advisor)

1. Coach rules OD-PDS1–8; OD-PDS4 (licensing) goes to counsel first.
2. **Category + audience map** — categories beyond the trader frame (cost of execution, time/decay, dislocation, cross-symbol, event/calendar structure, liquidity topography, regime vs own history, presentation as its own axis) crossed with non-trader framings (sector uncertainty, cross-asset stress, market-vs-consensus disagreement, what's priced for an unwatched event).
3. **Research pass** — real problems across *all* audiences that these views solve; work backward from problem to view.
4. **Wide breeding pass** — generate, catalog, classify candidates into the register; every one finished, honest, complete; failures shown.
5. Wiki page template derived from the §4 view contract.
6. Align this spec with `FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md` (DL-528) once uploaded; resolve any overlap by DL, not by picking one in code.
