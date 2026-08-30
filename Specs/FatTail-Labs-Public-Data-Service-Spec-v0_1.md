# FatTail Labs — Public Data Service Spec v0.1

**Status:** **DRAFT / THESIS** — not BUILD AUTHORITY. Coach has not given GO.  
**Date:** 2026-08-21  
**Current revision:** **v0.1**  
**Type:** Business + service Spec — a public, email-gated publishing surface built on the firm's option-chain data, organized by the Information → Knowledge → Intelligence hierarchy  
**Short name:** **PDS** (working — see OD-PDS1, naming)  
**Canonical filename:** `Specs/FatTail-Labs-Public-Data-Service-Spec-v0_1.md`  
**Source of this draft:** voice session 2026-08-21 (Coach walking; advisor layer transcribing). Every ruling below was spoken by Coach. Where the advisor added structure or opinion it is labeled **[advisor]**.

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

- A public site publishing **measured views** derived from the option chain across the supported symbol universe (18 today; grows with the data plane).
- Gated by **email + stated intent**.
- **Publication only.** No advice, no signals, no recommendations, no forecasts.
- **Read-only.** Nothing a visitor does affects any Labs system.
- Part of FatTail. Not a separate brand or adversarial positioning (§10).

## §2 Data plane

- Source: the existing StudioOne/StudioTwo chain-snapshot infrastructure and OPF.
- PDS is **read-only, downstream, isolated**. It consumes a **published copy** of chain/snapshot data; it never calls the governed pricing plane directly and can place no load on anything that matters.
- Staleness of the copy is **declared on every view** (§4).
- **[advisor]** Mirrors the governed-source / read-only-downstream pattern already proven for the data plane; the same pattern is reused for the wiki in §11.

## §3 Hierarchy mapping (binding)

Every artifact PDS produces is classified as **Information**, **Knowledge**, or **Intelligence** (Part I table). The classification determines its exchange terms (§7) and its delivery modes (§8). No artifact ships unclassified.

## §4 View contract

The heart of the spec; what makes the factory possible. A **view** is:

1. a **measurement** (declared inputs, declared method, versioned),
2. a **presentation**,
3. an **honesty declaration** (missing-data behavior, proxies, staleness),
4. an **audience framing** (who it is translated for).

The same measurement may ship as multiple views under different framings (trader / analyst / treasurer / journalist).

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
- The public wiki is the indexable SEO/AEO surface; the views themselves are visual and hard to index.
- Sacred Invariant #8 applies to every public word.
- **IKI Lab foundation (2026-08-21 · DL-528):** Coach stored **Part I of this spec** (executive summary of what IKI is to become) in the member wiki as slug **`iki`** (`wiki/concepts/iki.md`). See [IKI Lab and Factory Spec v0.1](./FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md) §6.1. This does **not** GO the public wiki or this service.

## §12 Boundaries and non-goals

- Not advice. No profit or outcome claims (SI #8). No forecasts (hard line, Part I).
- No account linkage to Labs members. No writes into Labs.
- Not a terminal. Not real-time execution data.
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

**[advisor] Items added by the advisor, labeled as opinion, not Coach's:** the "prophecy" fourth level (withdrawn — Coach's); the initial free/paid split putting knowledge in the free tier (withdrawn — corrected by Coach); the second-signal concern in §9; the seven delivery modes in §8 as an enumeration of Coach's "modes of delivery"; the wiki-as-SEO-surface point in §11.

## §14 Open Coach decisions

| ID | Question |
|---|---|
| OD-PDS1 | **Name** of the service / surface. Jelmor stays in the backstory and the executive summary; whether it appears in the spec body is Coach's call (Coach: "I don't know if it belongs in the spec"). |
| OD-PDS2 | Licensable asset = each view, the collection, or both (§8). |
| OD-PDS3 | What the free Information tier shows at launch — a window on the raw chain, a sample of Knowledge, or both. |
| OD-PDS4 | **Legal/licensing.** Redistribution rights on vendor chain data under the current license(s). **Blocking-class risk** — the only item that could stop the project cold. Counsel review before any public surface. |
| OD-PDS5 | Hard-line wording for the Intelligence tier: the exact sentence that goes on every inference output (draft: "We describe what is priced and what has happened. We never tell you what will happen."). |
| OD-PDS6 | Which symbols, and whether "18" is named publicly or the universe is described by sector proxy. |
| OD-PDS7 | Relationship to FatTail Intelligence (StudioOne research project) — is PDS its publishing surface, or a sibling consumer of the same data plane? |
| OD-PDS8 | Governance lane: does PDS get its own bench/board under AGENTS.md §6, and who reviews public copy (Tango/Sierra gate assumed). |

## §15 Proposed decision-log entry (paste-ready)

```
## 2026-08-21 — DL-XXX Public Data Service thesis recorded (no GO)

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
- PDS reads a published copy of the data plane; read-only, isolated, no Labs writes.

Spec: Specs/FatTail-Labs-Public-Data-Service-Spec-v0_1.md (DRAFT / THESIS).
Open: OD-PDS1–8 (naming, asset scope, free tier, LICENSING-blocking, hard-line
wording, symbol disclosure, relation to FatTail Intelligence, governance lane).
No GO. No board. No seeds.
```

## §16 Next steps (as stated by Coach / held by advisor)

1. Coach rules OD-PDS1–8; OD-PDS4 (licensing) goes to counsel first.
2. **Category + audience map** — categories beyond the trader frame (cost of execution, time/decay, dislocation, cross-symbol, event/calendar structure, liquidity topography, regime vs own history, presentation as its own axis) crossed with non-trader framings (sector uncertainty, cross-asset stress, market-vs-consensus disagreement, what's priced for an unwatched event).
3. **Research pass** — real problems across *all* audiences that these views solve; work backward from problem to view.
4. **Wide breeding pass** — generate, catalog, classify candidates into the register; every one finished, honest, complete; failures shown.
5. Wiki page template derived from the §4 view contract.
