# FatTail Labs — IKI Lab and IKI Factory Spec v0.1

**Status:** DRAFT — Coach 2026-08-21. **v0.1.2** **IKI Lab** is the suite; **inside** it: **Wiki** and **IKI Factory**. **v0.1.1** foundational document = PDS Spec v0.1 Part I (`iki`). Apps-grid card **IKI Lab**. Suite nav like Practice / Options Lab. **OD-IKI-1 CLOSED** 2026-08-23 by IKI Factory Spec v0.1.5 **BUILD AUTHORITY** (**DL-556**). This suite spec remains chrome/naming law; Factory *job* lives in the Factory spec. Member Factory pill stays soon (**OD-F7**).  
**Type:** Product Spec — member **app suite** (naming + chrome + Factory placeholder).  
**Short name:** **IKI**  
**Expansion:** **I**nformation · **K**nowledge · **I**ntelligence  
**Apps card:** **IKI Lab** (replaces the old Wiki **card**)  
**Suite apps (inside IKI Lab):** **Wiki** · **IKI Factory**  
**Filename:** `FatTail-Labs-IKI-Lab-and-Factory-Spec-v0.1.md`

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [Member Wiki Spec v0.1](./FatTail-Labs-Member-Wiki-Spec-v0.1.md) | **IKI Lab content SoR** — compiled map, corpus, privacy firewall. Not replaced. |
| [Wiki Interface Spec v0.1](./FatTail-Labs-Wiki-Interface-Spec-v0.1.md) | IKI Lab **surfaces** (entry, article, search, graph). Card title/blurb **amended** here. |
| [HI Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dark work-surface tokens. Segmented suite nav (same primitive as Practice / Options Lab). |
| North Star v1.2 | Invariant **#8** — process outcomes, never profit claims. IKI is a map, not an oracle. |
| Application Framework v1.0 | Apps catalog card; L4 suite chrome. |
| Dual-subdomain Practice vs Labs (DL-248–250) | **Seams only** — do not split hosts. Entitlement keys later. |
| [Public Data Service Spec v0.1](./FatTail-Labs-Public-Data-Service-Spec-v0_1.md) | **Foundational thesis** for IKI. Part I (executive summary) is stored in IKI Lab. PDS remains THESIS — not GO for a public surface. |

**Does not:** implementation plan until Phase 5 · invent IKI Factory’s job (**OD-IKI-1**) · replace lab-wiki git SoR · a second knowledge store · profit-claim “intelligence” · MSC import.

**Review protocol:** BLOCKING vs ADVISORY. Coach Content Law: nothing in §0 is removed.

---

## 0. Coach intent (do not drop)

**Rename and new app (2026-08-21, verbatim):**

> I want to rename the Wiki Card in the Apps section of the website to the IKI Lab. IKI stands for Information-Knowledge-Intelligence. And I want to create a new app called the IKI Factory. It will use the same Nav we have in other app suites like Practice and Options Lab.

**Seating (Juliet — Coach may discard):**

| Quote | Seat |
|-------|------|
| Rename the **Wiki card** on Apps to **IKI Lab** | **IN-SCOPE** — `/app` grid card title. Slug may stay `wiki` internally until **OD-IKI-2**. |
| **IKI** = Information-Knowledge-Intelligence | **IN-SCOPE** as expansion. Suite name **IKI Lab**. Spell-out: first-use / guide, not a subtitle on every pill (**OD-IKI-5**). |
| New app **IKI Factory** | **IN-SCOPE as a suite app inside IKI Lab** (nav sibling of **Wiki**). **Job of Factory is not specified** — **OD-IKI-1**. Must not invent a CMS, agent mill, or marketplace. |
| **Same nav** as Practice and Options Lab | **IN-SCOPE** — HIG segmented control. One suite chrome. Pills: **Wiki** · **IKI Factory**. |

**Inside the suite (2026-08-21, verbatim — do not drop):**

> Inside IKI lab is the Wiki and the IKI Factory

**Seating:** **IKI Lab** = the Apps card / suite (Options Lab pattern). **Wiki** and **IKI Factory** are the inner apps. Wiki is **not** renamed away; it lives **inside** IKI Lab. **OD-IKI-3** adopted as **Wiki** · **IKI Factory**.

**Foundational document (2026-08-21, verbatim):**

> I want to store the foundational document in the IKI Lab which is an executive summary of what it is to become. It is contained within the following spec FatTail Labs — Public Data Service Spec v0.1

**Seating of that quote:**

| Quote | Seat |
|-------|------|
| Store a **foundational document** in **IKI Lab** | **IN-SCOPE** — a member-wiki page (lab-wiki SoR). Slug **`iki`**. Path `wiki/concepts/iki.md`. |
| It is an **executive summary of what IKI is to become** | **IN-SCOPE** — PDS Spec v0.1 **Part I** (The asset · The thesis · Information → Knowledge → Intelligence · The hard line · Origin). Not Part II service outline. |
| Contained in Public Data Service Spec v0.1 | **IN-SCOPE** — that Part I text is copied into the Lab **verbatim** (Coach Content Law). Spec file stays the engineering/thesis SoR; the Lab page is the member-facing foundation. |

Tango / Hotel notes sit in **§8**. They do not delete this.

---

## 1. Job

**IKI** is the Labs **Information · Knowledge · Intelligence** suite.

| App | Job (this version) |
|-----|-------------------|
| **IKI Lab** | The **suite**. Apps card. Chrome wraps Wiki + Factory. |
| **Wiki** | The compiled map (search, article, graph). Member Wiki + Wiki Interface remain law. Foundational page [[iki]] lives **here**. |
| **IKI Factory** | Inner suite app. **Job: OPEN (OD-IKI-1).** Until Coach seats it: named empty / soon, not a fake Wiki. |

It is **not** a replacement of the lab-wiki git checkout. It is **not** Journal. It is **not** Trader Feed. It is **not** Visualize AI.

**Distribution of labor:**

```
IKI suite chrome (this spec)
  owns: Apps card title, suite nav, routes, Factory placeholder
IKI Lab / Wiki specs
  owns: corpus, compile loop, article/search/graph, privacy
IKI Factory
  owns: nothing until OD-IKI-1
```

---

## 2. Relationship to other specs

| Spec | This document |
|------|----------------|
| **Member Wiki v0.1** | Lab **system**. Amend surface name Wiki → IKI Lab. Tables, git SoR, Hotel gate, W1–W11 **unchanged**. Foundation page lives here (`wiki/concepts/iki.md`). |
| **Public Data Service v0.1** | **Thesis** of what IKI becomes. **Part I** is the Lab foundation page. PDS **does not** GO a public site from this seating. |
| **Wiki Interface v0.1** | Lab **UI**. §1.1 card title **IKI Lab**. One card remains the Apps entry. Inner nav is **new** (this spec). |
| **Practice suite** | **Nav grammar** reference — segmented pills, one card on `/app`, nested apps hidden from the grid. |
| **Options Lab** | **Nav grammar** reference — `OptionsLabChrome` + `OptionsLabNav`. IKI does **not** share Options Lab symbol context. |
| **Application Framework** | Catalog row. Admin sort_order. Dual Surface in-place titles if the catalog is editable. |
| **Future Practice vs Labs hosts** | IKI Lab is closer to Practice (teaching map). Factory *may* later sit on Labs membership — **seam only**, no split now. |

---

## 3. Apps grid

**One top-level card.** Factory is **not** a second `/app` tile (Practice / Options Lab pattern). Nested under the IKI suite.

| Element | Law |
|---------|-----|
| Card title | **IKI Lab** |
| Replaces | Wiki card (DL-167 family / Wiki Interface §1.1) |
| Badge | Keep current Wiki badge until Lab is live; Factory **soon** until OD-IKI-1 + BUILD |
| Blurb | Process, no P&L. Working copy (Tango may stamp): “Information, knowledge, and intelligence — the compiled map of what we teach, and the factory that builds it.” Factory clause **drops** if OD-IKI-1 says Factory is not member-facing. |
| Open | Suite default = **Wiki** (`/app/wiki`) |
| Slug | **OD-IKI-2**. Until then, catalog slug may remain `wiki` with title override **IKI Lab** (same class as `practice-log` titled Practice). |

Guide, home quick-nav, and `/app` meta that say “Wiki” become **IKI Lab** in the same change as the card.

---

## 4. Suite nav (normative)

**Same nav** as Practice and Options Lab:

| Law | |
|-----|--|
| Primitive | HIG **segmented control** — `inline-flex` pill track, `rounded-full`, active fill `color.surface` + elevation 1, 44pt-class min height (`min-h-9` as-built). HI tokens. No raw hex. |
| Placement | Suite chrome, centered above the app body — `PracticeSuiteChrome` / `OptionsLabChrome` family. |
| Pills | **Wiki** · **IKI Factory**. Suite name in breadcrumb is **IKI Lab**. **OD-IKI-3** adopted. |
| Active | `aria-current="page"`. One active pill. |
| Factory before job | Pill **visible**. Destination is a **named soon / empty** (not 404, not a silent Wiki clone). |
| testid | `iki-suite-nav` |
| Not | A second global header. Not Options Lab pills. Not Practice pills. |

**As-built reference (not imported as files):**

- `web/components/practice/PracticeSuiteNav.tsx`
- `web/components/options-lab/OptionsLabNav.tsx`

Charlie implements a **new** `IkiSuiteNav` / `IkiSuiteChrome`. Do not import Practice context (account/date) or Options Lab symbol into IKI.

---

## 5. Routes

| Surface | Path (proposal) | Today |
|---------|-----------------|-------|
| Suite default / IKI Lab entry | `/app/iki/lab` or keep `/app/wiki` | `/app/wiki` |
| Article | `/app/iki/lab/[slug]` or keep `/app/wiki/[slug]` | `/app/wiki/[slug]` |
| Search / graph | under Lab | `/app/wiki/search`, `/app/wiki/graph` |
| IKI Factory | `/app/iki/factory` | **none** |

**OD-IKI-2:** move to `/app/iki/…` vs keep `/app/wiki` as Lab and only add Factory. **Must not** break existing wiki deep links: if paths move, **redirect** `/app/wiki` and `/app/wiki/[slug]`.

---

## 6. IKI Lab (rename)

The Lab **is** the Member Wiki. Rename the **door**, not the engine.

| Keep | Change |
|------|--------|
| lab-wiki git SoR | Member-facing word **Wiki** → **IKI Lab** on the Apps card, chrome, guide |
| Search-first entry, articles, graph, wikilinks | Suite nav above those surfaces |
| Hotel gate, human approval, Invariant #8 | Expansion **IKI** in guide: Information · Knowledge · Intelligence — **capacity**, not “the AI will make you smarter” |
| `/api/wiki/…` until a later rename | Optional Dual Surface catalog title |

As-built “Wiki” in article back-links and switcher labels follow the same rename in the Lab chrome pass.

### 6.1 Foundational document

Coach: store in IKI Lab the **executive summary of what it is to become**, from [Public Data Service Spec v0.1](./FatTail-Labs-Public-Data-Service-Spec-v0_1.md) **Part I**.

| Law | |
|-----|--|
| SoR (engineering thesis) | `Specs/FatTail-Labs-Public-Data-Service-Spec-v0_1.md` Part I |
| SoR (member Lab page) | lab-wiki `wiki/concepts/iki.md` · slug **`iki`** · kind **concept** |
| Body | Part I **verbatim** (The asset · The thesis · Information → Knowledge → Intelligence · The hard line · Origin). Not Part II. |
| Status | `published` (Coach asked to store it in the Lab, not hold as draft) |
| Start here | When IKI Lab chrome ships, [[iki]] is **first** on Start here (Wiki Interface pin). As-built start_here is topics[:8] by title — that is **not** this page until the pin lands (**AT-IKI-9**). |
| PDS status | THESIS. Storing the summary in the Lab **does not** GO the public data service, a public wiki, or Factory workflow. |

**Tango (labeled):** this page is **what IKI becomes**, including commercial exchange terms. It is not a trading signal and not a profit claim about a member’s book. Invariant #8 still governs. Guide copy must not sell the Lab as “the AI will make you money.”

**Hotel (labeled):** the hard line in Part I (describe what is priced and what has happened; never what will happen) is **binding** on this page and on any later Factory output that cites it.

---

## 7. IKI Factory (placeholder)

Coach named the app and seated it on the suite nav. **Coach did not say what it produces.**

Until **OD-IKI-1**:

| Must | Must not |
|------|----------|
| Appear as a nav pill | Clone the Wiki article surface and call it Factory |
| Named empty / soon (title **IKI Factory**, one honest sentence) | Invent compile UI, agent mill, or member “build a wiki” |
| Fail-open: not a 404 | Promise intelligence, P&L, or a second corpus SoR |

**Juliet (labeled, not law — Coach discards):** PDS Part I names **the factory, not the launch** (standing cadence of views; templates as a search). That is the *becoming* in the foundation page. It does **not** close **OD-IKI-1** for the member **IKI Factory** app. Coach still seats what the suite pill *does*.

---

## 8. Language (Tango + Hotel sit beside Coach)

**Coach:** IKI = Information-Knowledge-Intelligence. Card **IKI Lab**. New app **IKI Factory**. Suite nav like Practice / Options Lab.

**Tango (labeled):** IKI is a **map and a workshop**, not a dependency machine. Chrome does not say the Factory will think for the member. Invariant #8 on every blurb. Spell-out belongs in the Guide, not a lecture on the card.

**Hotel (labeled):** “Intelligence” in IKI is **the member’s** (and the compiled map’s honesty), not a trading oracle. Factory copy must not author advice. Wiki Hotel gate still applies to Lab pages.

**Sierra (labeled):** public catalog/guide strings that say Wiki need a rename pass; member-only `/app/wiki` URLs are not SEO in v1.

---

## 9. As-built (check first — not law)

| As-built | Path | Honesty |
|----------|------|---------|
| Apps card Wiki | `web/lib/appsCatalog.ts` slug `wiki` · title Wiki · href `/app/wiki` | **Rename this card** to IKI Lab |
| Wiki open while `soon` | `AppsGrid.tsx` | Keep Lab open-while-soon unless Coach closes it |
| Wiki routes | `web/app/app/wiki/` | Lab surfaces |
| Practice nav | `PracticeSuiteNav` | Grammar only |
| Options Lab nav | `OptionsLabNav` | Grammar only |
| Wiki specs | Member Wiki + Interface v0.1 | Still Lab law |
| Foundation page | `lab-wiki/wiki/concepts/iki.md` | PDS Part I stored **2026-08-21**. Needs git push + reindex to show at `/app/wiki/iki` |

---

## 10. Ideas inventory (Phase 0 — nothing dropped)

| Idea | Seat |
|------|------|
| Wiki Apps card → **IKI Lab** | **IN-SCOPE** · §3 |
| IKI = Information-Knowledge-Intelligence | **IN-SCOPE** · §0 · expansion |
| New app **IKI Factory** | **IN-SCOPE as suite app** · job **OD-IKI-1** |
| Same nav as Practice / Options Lab | **IN-SCOPE** · §4 |
| **Inside IKI Lab:** Wiki and IKI Factory | **IN-SCOPE** · §0 · §4 · **DL-531** |
| One Apps card; Factory nested (not a second tile) | **IN-SCOPE** · Juliet seating of “suites like Practice and Options Lab” |
| Two top-level Apps cards (Lab + Factory) | **FLAGGED** — would break the suite-nav pattern Coach named; Coach may still want it |
| Factory = compile / approve wiki (admin Dual Surface) | **FLAGGED** **OD-IKI-1** |
| Factory = member-authored knowledge | **FLAGGED** **OD-IKI-1** |
| Move routes to `/app/iki/…` | **FLAGGED** **OD-IKI-2** |
| Pill labels Lab / Factory vs IKI Lab / IKI Factory | **ADOPTED as Wiki · IKI Factory** · **OD-IKI-3** · **DL-531** |
| Keep `wiki` slug, title override only | **IN-SCOPE as default** until OD-IKI-2 |
| lab-wiki git SoR unchanged | **IN-SCOPE** |
| Replace Wiki engine | **OUT** |
| Store PDS Part I executive summary as IKI Lab foundation | **IN-SCOPE** · §6.1 · slug `iki` · **DL-528** |

---

## 11. Out of scope

- Implementation / Charlie packets until Phase 5.  
- Inventing Factory workflow, schema, or agents.  
- Forking a second wiki store.  
- Profit claims, trading advice, “AI intelligence” as a product promise.  
- Splitting `practice.fattail.ai` / `labs.fattail.ai` for this suite.  
- Changing Trader Feed, Options Lab, or Practice nav.

---

## 12. Acceptance (when BUILD)

| AT | Criterion |
|----|-----------|
| **AT-IKI-1** | `/app` Wiki card title is **IKI Lab**. No member-facing Apps tile still titled Wiki. |
| **AT-IKI-2** | Opening the card shows suite chrome **IKI Lab** with segmented nav **Wiki** · **IKI Factory**. Grammar matches Practice / Options Lab pills (HI tokens, no raw hex). testid `iki-suite-nav`. |
| **AT-IKI-3** | **Wiki** pill shows today’s wiki entry/search/article/graph job (Wiki Interface). Existing `/app/wiki` deep links still work (same path or redirect). |
| **AT-IKI-4** | **IKI Factory** pill is reachable. Until OD-IKI-1: named soon/empty, not a duplicate Lab, not 404. |
| **AT-IKI-5** | Factory is **not** a second top-level Apps card (unless Coach reverses §3). |
| **AT-IKI-6** | Invariant #8: no profit claims in IKI chrome or Factory empty state. |
| **AT-IKI-7** | Guide / home quick-nav “Wiki” → **IKI Lab** in the same ship. |
| **AT-IKI-8** | lab-wiki SoR and `/api/wiki` still serve Lab content. No second corpus. |
| **AT-IKI-9** | `/app/wiki/iki` (or Lab equivalent) serves the PDS Part I executive summary, published. When IKI chrome ships, it is first on Start here. |

---

## 13. Open decisions (not silent)

| OD | Question | Silent |
|----|----------|--------|
| **OD-IKI-1** | What does **IKI Factory** *do*? Member app vs admin Dual Surface vs compile board? | **CLOSED 2026-08-23** — Factory Spec v0.1.5 BUILD (**DL-556**): admin-only Kanban conveyor Ideas→Live, Gemba, Woo Deploy, Wiki `registration` emit. Member pill remains named soon (**OD-F7**). Original question kept; this row is the seat. |
| **OD-IKI-2** | Routes: `/app/iki/lab` + `/app/iki/factory` (redirect wiki) vs keep `/app/wiki` as Lab? | Default = keep `/app/wiki` as Lab until Coach moves it |
| **OD-IKI-3** | Nav pills: **IKI Lab** · **IKI Factory** vs **Lab** · **Factory**? | **ADOPTED** — pills **Wiki** · **IKI Factory**; suite **IKI Lab** (**DL-531**) |
| **OD-IKI-4** | Catalog slug rename `wiki` → `iki-lab` (migration) vs title-only override? | Default = title-only (practice-log pattern) |
| **OD-IKI-5** | Where the expansion “Information-Knowledge-Intelligence” appears (Guide only vs card blurb vs first visit)? | Default = Guide + card blurb once; not on every pill |

---

## 14. Files (when BUILD — after Coach Phase 5)

| Path | Role |
|------|------|
| This spec | Suite law |
| `web/lib/appsCatalog.ts` | Card title **IKI Lab** |
| `web/lib/homeQuickNav.ts` · guide | Wiki → IKI Lab |
| `IkiSuiteNav` / `IkiSuiteChrome` | New; copy grammar from Practice/Options Lab, not their context |
| Wiki pages | Wrap with IKI chrome; Factory route placeholder |
| Migration | Only if OD-IKI-4 renames slug |
| Tests | AT-IKI-1…8 |

Do **not** start this packet until Coach marks BUILD AUTHORITY.

---

## 15. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v0.1.2** | 2026-08-21 | Coach: **Inside IKI Lab is the Wiki and the IKI Factory.** Suite card IKI Lab; pills Wiki · IKI Factory. **DL-531**. |
| **v0.1.1** | 2026-08-21 | Coach: store PDS Spec v0.1 **Part I** in IKI Lab as the foundational executive summary of what IKI becomes. lab-wiki `wiki/concepts/iki.md`. **DL-528**. |
| **v0.1** | 2026-08-21 | Coach: Wiki Apps card → **IKI Lab**; IKI = Information-Knowledge-Intelligence; new **IKI Factory**; suite nav like Practice / Options Lab. Factory job open. **DL-527**. |
