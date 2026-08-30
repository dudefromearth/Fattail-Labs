Saved as [FatTail-Labs-IKI-Lab-Executive-Summary.md](/workspace/artifacts/FatTail-Labs-IKI-Lab-Executive-Summary.md). Full text:

---

# FatTail Labs — IKI Lab

**Status:** Seated understanding (Coach, 2026-08-22). Not BUILD AUTHORITY.  
**Type:** Foundation / executive summary.  
**Expansion:** **I**nformation · **K**nowledge · **I**ntelligence  
**Related:** IKI Lab and Factory Spec v0.1 · Public Data Service Spec v0.1 Part I · Template Runner Spec v0.1 · Member Wiki Spec v0.1

**How to read this.** §§1–6 are Coach’s executive summary (verbatim in intent). §§7–11 are seating from the same session: three apps, audience, license, Intelligence use-mode. Nothing in §§1–6 is removed.

---

## 1. What it is

IKI Lab is the FatTail Labs suite that takes raw market **Information** and transforms it into **Knowledge** and **Intelligence** under license.

The hierarchy is the product, not a label. It is Coach’s frame from the mid-1990s — developed on Wednesday nights with Jerry Shanz under Jelmor (an acronym of their children’s names) — as a thesis about where the newly born internet was going. It described the internet correctly, in that order, over thirty years. It now describes this product. It is the load-bearing structure of the service, not a taxonomy invented for a spec.

---

## 2. The asset

FatTail Labs holds a dataset retail cannot obtain and institutions keep to themselves: full option chains with full greeks, at snapshot cadence, across 18 symbols, every weekly expiry, continuous through regular trading hours. Expensive, licensed, unpublished.

Those 18 names are not “tickers.” They proxy energy, rates, metals, technology, the dollar, and broad equity risk — industries, economies, business cycles, boom and bust. Options are the largest derivatives market in the world, and every second of the session they price a forward-looking opinion with a distribution attached. Every other dataset the wider world works from is backward-looking. Today that opinion is translated for institutions and nobody else.

---

## 3. The thesis

1. **The edge is not the data.** The edge is in how people think, and people think the way they always have. Publishing honest measurements of the chain gives nothing away that matters. There are no crown jewels to withhold.

2. **Nothing is free.** Every level is priced. Price is money or something of equal value — contact with declared intent, attribution, citation, data returned, referral, affiliation. A financial-data list with intent is among the most expensive lists money can buy; this acquires one at near-zero cost.

3. **Near-zero cost structure.** The data is already paid for. Each view is a one-time build. No marginal cost per visitor. The views are produced once and delivered in many forms.

4. **The audience is not traders — as the size of the thing.** Options traders are roughly one percent: the beachhead, closest to what Coach does, easy targets, and the **gateway** into the larger audience. They are part of who might be interested in IKI; they are only a very small part. The real market is everyone whose living depends on what those 18 names price and who would never open a chain: analysts, treasurers, planners, journalists, operators.

5. **The factory, not the launch.** A few dozen views up front, then a standing cadence — dozens a month, a few good ones a month — as a continuous process. Templates are a search as much as an output: some become merely interesting visuals, some become valuable insights, and new angles and businesses will be discovered during development. Multiple models (Claude, Grok, others) generate candidates; divergence between them is signal. The list is the instrument that tests candidates against real people.

6. **Structural tailwind.** As exchanges add more multi-day and multi-week expirations, term-structure resolution improves and the asset appreciates without further work.

7. **Posture: under the radar.** No comparison, no adversary, no “what Bloomberg won’t.” Plain description, organic growth. The terminal frame stays private as understanding, never as copy.

---

## 4. Information → Knowledge → Intelligence

A three-level hierarchy, each level begetting the next. One substrate. Three transaction types.

Where the “intelligence” boundary sits inside a model is not for Coach to adjudicate — “it’s just for me to deliver.” The spec takes no metaphysical position; it specifies what is published, in what form, with what caveats.

| Level | What it is here | Commercial shape |
|---|---|---|
| **Information** | The chain itself. Raw, true, timestamped. The scarce thing. | Exchanged for contact + declared intent |
| **Knowledge** | A **view** — a measurement derived from the chain, organized and presented. Not free. | Licensed, by delivery mode, priced in whatever currency fits the customer (money, attribution, affiliation, data, referral) |
| **Intelligence** | Specialized inference models reading across the whole corpus — patterns no single snapshot contains | **Per product:** the same license as Knowledge, **or** a contract (named parties, defined scope, term, and use). FatTail decides how each Intelligence product is used |

---

## 5. The hard line (valuable, not a compromise)

**Publishable:** what is priced now; today versus its own history; symbol versus symbol; where the surface disagrees with itself; and what actually happened afterward, as historical fact.

**Not publishable:** any claim about what will happen; any probability offered as a claim rather than as the market’s own pricing; anything readable as a position recommendation.

The honest side is the stronger product — the reader draws the conclusion, which is capacity-over-dependency expressed in a data product.

---

## 6. Origin (for the record, dated)

Coach built a convexity heat map months ago to give options traders speed, quality, and cost at once. The AI tooling of the time could not express the intent; the result was a complex architecture with memory leaks that frustrated users. A member named Gary, frustrated and leaning for another view, triggered the inversion that arrived all at once: make the raw option chain the sole input, publish it once through a cached pub/sub gateway, create the OPF, and let templates be the only thing that varies.

That inversion is why a factory is possible and why the cost structure works. Gary left because Coach “wasn’t delivering” — the week before the fix that delivers. Serendipity, and the decision log carries the dated authorship trail.

---

## 7. Three apps inside IKI Lab

IKI Lab is the **suite** (one Apps-grid card, same nav grammar as Practice and Options Lab). Wiki is not renamed away; it lives inside the suite.

| App | Job |
|---|---|
| **Wiki** | Already exists. Agent-curated compiled map. Waits for what we actually create and ship, then files and links it. Does not invent the product. |
| **IKI Factory** | Workspace for developing knowledge and intelligence products (**templates**). Standing cadence. A search, not a launch. |
| **Runner** | The engine. Templates consume OPF / market streams in the client and emit views, streams, notifications. One registry. Options Lab is another **host** of the same engine (different sinks). Not a second runner. |

```
Market / OPF     Information — server updates the model
      │
      ▼
   Runner        engine — template = stream transform, client-side
      │
      ├── visualization / notification / data     → Knowledge (and, where earned, Intelligence)
      └── help block on the template
              │
              ▼
           Wiki     compiled map — waits, then files
              ▲
              │
         IKI Factory   where the template is made
```

Factory produces. Runner runs. Wiki files. None of the three is a second store of truth.

---

## 8. Audience

| Layer | Who | Role |
|---|---|---|
| **Beachhead / gateway** | Options traders (~1%) | Part of the audience. Closest to what Coach already does. How IKI gets used, introduced, and proven. Not the size of the market. |
| **Market** | Analysts, treasurers, planners, journalists, operators | Living depends on what those 18 names **price**. They would never open a chain. Same measurements, different view and language. |

“The audience is not traders” means: **do not size or copy the product as if traders were the customer.** It does not mean traders are out.

Same substrate. Same hard line. **Audience framing** is what changes (already a Runner template-contract field). Beachhead views may assume a chain. Market views must not.

---

## 9. License (“give away” priced in permission)

Not a contradiction. **Open-source-shaped access, not OSI open source.** The repo, OPF, and templates are not thrown over the wall. The **views** are usable under terms.

**Give away** = no money at the Knowledge door.  
**Priced** = email (contact) + agreement to terms (declared intent).

### 9.1 IKI list law

1. FatTail is the only party that may campaign to that email, for campaigns FatTail chooses.
2. That right is **never sold, rented, or assigned** to anyone else.

The expensive list is **acquired**, never resold.

A **processor** sending mail on FatTail’s behalf (e.g. ActiveCampaign) is not a buyer of the right. “Partners may contact you,” list rental, broker appends, and co-reg are forbidden.

This **is** the price of the public Knowledge door. It must be the actual gate, in plain language, before first view — not a buried checkbox.

Labs members who already have a session are **not** a second grab at this checkbox. Practice “campaign” (trader charter) is a different word and a different object.

### 9.2 Doors by level

| Level | Door |
|---|---|
| **Information** | Same shape unless later restricted: email + terms |
| **Knowledge** | This license. Delivery-mode rules (attribution, citation, no-resell as forecast) live **in the terms**, not as a second checkout |
| **Intelligence** | See §10 |

Copy: never “open source” in the UI unless OSI is meant. **Licensed access** / **free to use under terms.**

---

## 10. Intelligence — use mode is per product

Intelligence is **what kind of thing it is** (inference across the corpus, not a single snapshot). It does **not** by itself say how it is sold.

FatTail chooses, **per Intelligence product**, one of two:

| Mode | What it is |
|---|---|
| **Knowledge license** | Same as §9. Email + terms. Exclusive FatTail campaign use. Never sold. |
| **Contract** | Named party, defined scope, term, use. One deal at a time. |

Unset is not a third mode. Unchosen = not shippable.

“One party at a time” applies only to **contract** mode, not to Intelligence as a class. The Factory is where the choice is made. The Runner enforces it (license metadata on the stream). The Wiki may file that the product exists and which mode it is under; the Wiki does not grant the contract.

Operator tooling (wiki agent, compile inbox) is **not** Intelligence.

---

## 11. What IKI Lab is not

- Not Journal, Trade Log, or Family B
- Not a second knowledge store beside lab-wiki
- Not “the wiki agent is Intelligence”
- Not OSI open source
- Not a Bloomberg competitor in public language
- Not a launch of “the IKI product” — it is a factory with a standing cadence
- Not a second Runner in Options Lab; one engine, two hosts

---

## 12. Seating still open (meaning is not)

These are spec/nav/copy tasks, not product confusion:

- Write OD-IKI-1 closed: Factory = workspace for developing templates
- Third IKI Lab nav pill: **Wiki · IKI Factory · Runner** (IKI Lab spec today still laws two pills)
- PDS public surface remains THESIS until a GO
- Email-permission copy (Tango) and counsel review (Mike)
- Revoke-mail vs keep-access: if the email right is the currency, withdrawing it ends the public license — pick that in the terms
- Help / wiki `audience` as drafted (member | staff) is incomplete for IKI; the missing value is **public**

---

*Coach session 2026-08-22. Executive summary §§1–6; seating §§7–12.*