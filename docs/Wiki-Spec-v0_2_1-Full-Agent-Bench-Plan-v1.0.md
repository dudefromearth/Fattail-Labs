# Wiki Spec v0.2.1 — Full Agent Bench Plan v1.0

**Program:** Wiki (unified organism).  
**Spec of this packet:** [`Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md`](../Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md) **APPROVED** (**DL-555**). **GO WU-0** granted (docs seating). **WU-1** waits on chrome ruling.  
**Supersedes (on spec approval, per IV.4):** Member Wiki v0.1 · Wiki Interface v0.1 · Wiki Agent v0.1.3 lineage · Proactive Compilation v0.2 (already OD-3). Sources get a SUPERSEDED banner; they are never deleted.  
**Parents as-built:** Arch **11** · **DL-545…554** · WA-1-G…WA-4-G PASS on board [`agents/p-wiki/`](../agents/p-wiki/).  
**Prior plan (history, not this GO):** [`docs/Wiki-Agent-Full-Agent-Bench-Plan-v0_1_2.md`](./Wiki-Agent-Full-Agent-Bench-Plan-v0_1_2.md).

Juliet. **No product code until Coach stamps GO WU-0 / GO WU-1 / …** Seeds are written in the same body of work as each GO, not before.

**Isolation (Coach, standing):** Wiki development only. Factory, Runner, Options Lab, Market Bus, Trade Log, `AppChrome` — **not touched** unless Coach names them and, for frozen trees, records **three successive OKs (DL-539)**. Spec I.1 v0.2.1: standing presence never licenses a frozen mount.

---

## What this program is

One wiki. Git holds page bytes. One agent fronts every write through two-sided contracts. Humans gate every publication. Published contents are **wide open by default** (DL-551). Direct agent communication is **admin-only** (DL-553). The remaining *build* is the four IV.5 slices — not a rebuild of WA-1…WA-4.

Coach’s frame (spec §0): *like the court stenographer, but way more.*

---

## What is already shipped (do not rebuild)

| Slice | Proof |
|-------|--------|
| Member wiki S0 | `/app/wiki` search-first, git pins, article rail shell, graph, ⌘K, IkiSuiteChrome (**DL-546/547**) |
| WA-1 portal + ledger | `POST/GET /api/wiki-agent/contracts`, `wiki_contracts`, `contracts:deliver`, session columns (**DL-548**) |
| WA-2 pollers + Oscar | GET-only pollers, pointer registry, git `status: draft` → board `awaiting_approval`, Hotel guidelines, retired annotates (**DL-549**) |
| WA-3 linkage | `wiki_refs`, FULLTEXT + title boost, reverse-pass rollup + `wiki_linkage_queue` (**DL-550**) |
| WA-4 session | open → accrete → seal; context-into-entry; wiki-layout `WikiAgentPanel`; queue drain (**DL-554**) |

Store law unchanged (I.2). W5 unchanged. Family B firewall unchanged.

---

## What this plan ships (remaining, each its own stamp)

Matches spec **IV.5**. Nothing in I.5 (corpus / YouTube / “In your practice” / Ask mode / D-1 name) is seeded until Coach calls it.

| Slice | Spec | Ships | Stamp |
|-------|------|--------|-------|
| **WU-0 Seat** | IV.4, IV.6 | Spec approval DL · SUPERSEDED banners (banner-only) · Arch 11 as-built · **owed WA-4 record checks** (Member Wiki edit + Arch 05) · Help-bot discovery filed | **GO WU-0** after **GO SPEC** |
| **WU-1 Floating agent** | III.3, III.4, I.1 | Discovery confirmed · launcher + message window · `/app` hub context provider · in-window adoption proposal · dispose WA-4 wiki-layout panel (one line) | **GO WU-1** + **chrome ruling** |
| **WU-2 Public read** | III.2, I.3 | Unauthenticated published-page read · Sierra SEO/AEO · Mike exposure · contamination sweep of member-gating on the read path · drafts 404 unauthenticated · no Family B / “In your practice” on public pages | **GO WU-2** — Coach stamps **timing**; Sierra + Mike reviews **before** the stamp request |
| **WU-3 Registration / S3** | II.1 `iki_factory_template` · Source Contract | Poll Factory **publication signal at Deploy** → hash vs Wiki-side watermark → compose envelope **Wiki-side** → draft template page that **declares new vs update** **or** L12-decline | **SC-0 landed (DL-562).** Code waits **GO SC-3b** when the Factory signal exists. Help Package spec **not required** (SUPERSEDED). |
| **WU-C Corpus** | I.5 | Registrar, transcriber, YouTube backfill, personal rail, Ask mode | **when Coach calls them** — not this page |

---

## Juliet review (labeled)

Coach’s spec text stays in `Specs/`. Nothing below deletes it.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| **B1** | File header is **DRAFT**. India + Mike first → remaining reviewers → Coach **GO SPEC** → Lima DL → **then** GO WU-0. This plan is not a spec stamp. |
| **B2** | **Help Concierge mounts in frozen AppChrome.** Discovery is below. WU-1 chrome-adjacent code does **not** start without Coach’s chrome ruling (three-OK **or** narrowed lawful mounts). India gates the discovery seed **before** any chrome-adjacent code (spec IV.5.1). |
| **B3** | WU-2 access *rule* is already directed (DL-551). Stamp is **timing**. Sierra + Mike reviews cover implementation, not whether — and they **precede** any stamp request. |
| **B4** | **Closed (SC-0 · DL-562).** Help Package spec is SUPERSEDED. WU-3 / SC-3b polls the Factory publication signal; Wiki composes. `Specs/FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` remains Options Lab Heatmap, not this. |
| **B5** | `web/app/layout.tsx` line 56 (`<AppChrome>{children}</AppChrome>`) is a second host of the same freeze. Not a free seam. WA-1 `main.py` was the last free router-mount. |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| **O1** | Once a lawful floating launcher exists, **retire** the WA-4 wiki-layout FAB (`WikiAgentPanel` mount in `web/app/app/wiki/layout.tsx`). Keep the session API. Two admin orbs is Echo-hostile (R0-3: do not invent a second floating button beside Help). If chrome is **narrowed to wiki-owned layout only**, **keep** `WikiAgentPanel` — it is already the lawful mount. |
| **O2** | Do **not** revive `CompileLauncher` / compile-inbox. Idle `wiki_compile_*` APIs stay idle (OD-3). |
| **O3** | `/app` hub context provider lives in wiki-owned registry code that *reads* hub route/entity; it does not restyle the hub. Hub file touches are a declared list on the WU-1 allowlist, or they wait. |
| **O4** | Public sitemap/JSON-LD for wiki pages should follow existing course JSON-LD patterns (Sierra names the shape). Do not invent a third SEO stack. |
| **O5** | Factory **emit of a Wiki envelope is gone.** Factory IF-4 exposes a publication signal only. Wiki WU-3 / SC-3b ships the **poller** on that signal + Wiki-side compose. |

---

## Discovery report — Help bot mount (WU-1 precondition)

Named deliverable of spec IV.5.1. Filed here so Coach can rule **before** GO WU-1. India confirms on WU-1-0; this is not a license.

| Item | Finding |
|------|---------|
| **Component** | `web/components/HelpLauncher.tsx` — member-facing Help Concierge (authenticated members; `return null` on `/admin` and unauthenticated). Spec: Help Concierge v1.x. |
| **Host file (frozen)** | `web/components/AppChrome.tsx` |
| **Exact lines** | **16** `import HelpLauncher from "@/components/HelpLauncher";` · **35–39** `{!isAdminApp && !isApply && ( <ErrorBoundary><HelpLauncher /></ErrorBoundary> )}` |
| **Root wrapper** | `web/app/layout.tsx` **line 56** `<AppChrome>{children}</AppChrome>` |
| **Tree** | Platform chrome. **Frozen under DL-539.** |
| **Open?** | **No** — host is AppChrome. `HelpLauncher.tsx` itself is Help-system code; cloning its *pattern* into a **new** wiki-owned file is lawful. **Inserting a sibling into AppChrome is not**, without three-OK. |
| **Visibility difference (law)** | Help launcher: members. Wiki launcher: **administrators only**. Must be a **distinct** component. Proven both layers (DOM absent for non-admin **and** session API 403/404). |

**Consequence:** “Always reachable wherever the admin is” on Options Lab / Strategy Lab / Trade Log **requires** AppChrome (or root layout) — three-OK, Coach’s ritual. Until that ruling, lawful mounts are **program-owned layouts** (wiki layout already holds `WikiAgentPanel`) plus any other **open** file Coach names.

### Chrome ruling (Coach fills one)

- [ ] **(A) Three successive OKs** on `web/components/AppChrome.tsx` lines 16 and 35–39 to mount a **new** admin-only `WikiAgentLauncher` sibling of Help (not a Help edit). Root layout stays as-is.  
- [ ] **(B) Narrow:** wiki-owned layouts only (keep or evolve `WikiAgentPanel`). Not AppChrome. Standing-presence defect on frozen surfaces is **accepted until a later three-OK**.  
- [ ] **(C) Coach names a different open host file:** ________ (path + lines).

This plan does **not** treat Help’s presence as license. No undeclared seams.

---

## Owed WA-4 record checks (IV.5.1 / IV.6)

Shown and dispositioned here. WU-0 Lima records the same in the unification DL.

### (a) Member Wiki v0.1 in-place edit

`git diff -- Specs/FatTail-Labs-Member-Wiki-Spec-v0.1.md` (WA-4 packet):

| Hunk | Disposition |
|------|-------------|
| **Actor (read)** / **Visibility** rewritten to wide-open-by-default; as-built still member-session until public-read slice; drafts 404 except admin | **KEEP as history.** Absorbed by spec I.3 / DL-551. On GO SPEC, this file gets a SUPERSEDED **banner only** (IV.4: never edited further). |
| **D-3** row → **DISSOLVED (DL-551/552)** | **KEEP as history.** Same absorption. |
| Header **Door rename (DRAFT)** IKI Lab Apps card · DL-527 | **Unrelated to wiki access.** Flag only — do not fold into v0.2.1 as access law. D-1 (member-facing name) remains I.5. |

The drafter’s “9-line” note under-counted: the access hunk is three table/OD rows; the IKI door line is a separate prior edit. Reconciled against I.3 / IV.3: access hunk matches; door-rename does not belong to this unification.

### (b) `Architecture/05-security-and-access.md`

Seven lines under §1 Goals: **DL-552** access doctrine + **DL-551** wiki directed rule (wide open by default; restrictions only when Coach names them). **DECLARED.** Aligns with I.3. Not a wiki-page-bytes change. WU-0 Lima may add a pointer to Wiki Spec v0.2.1; no other Arch 05 rewrite.

### (c) Agent spec v0.1.3 India carve (IV.6.a)

In-tree v0.1.3 §7: sealed session transcript is **contract evidence** on the ledger; page bytes remain git-only; `source_change` / `registration` still “pointers and summaries.” Spec v0.2.1 **II.5** restates that carve. **India R0 confirms match**; any wording drift is corrected to the in-tree v0.1.3 text (Coach Content Law: do not silently drop the carve).

---

## Store law (unchanged — every slice)

1. Git is the only writer of wiki **page bytes**.  
2. MySQL = derived index + contracts ledger (state; sealed transcript = **evidence**, not a page).  
3. Reindex is the only writer of `wiki_pages_idx` / `wiki_links_idx`.  
4. Tests restore `LABS_WIKI_ROOT`.  
5. Git credentials never go to `ai.complete()`.  
6. No MSC imports. No hardcoded secrets/hosts/ports.

---

## Critical path

```
GO SPEC  after R0 (India + Mike first; Sierra; Echo+Tango; Hotel)
  Lima unification DL + SUPERSEDED banners  →  WU-0-G

GO WU-0  (docs only — no chrome, no public read)
  WU-0-1  India   citation map · Help-mount confirmation · record-check disposition
  WU-0-2  Lima    banners · Arch 11 · DL pointer
       → WU-0-G Delta

GO WU-1  [chrome ruling A / B / C required]
  WU-1-0  India     discovery gate (this report). STOP if ruling missing.
  WU-1-1  Echo+Tango  launcher + window (R0-3 notes; members never see it)
  WU-1-2  Charlie     component + lawful mount only
  WU-1-3  Alpha       context-provider registry (fail-loud) + /app hub first provider
  WU-1-4  Mike        admin-only both layers; launcher ≠ Help
  WU-1-5  Juliet/Charlie  dispose WikiAgentPanel (keep vs retire — one line, per chrome ruling)
  WU-1-6  Kilo        session still WA-4 path; first turn cites context; non-admin DOM+API
       → WU-1-G Delta

GO WU-2  [Coach timing]  Sierra review + Mike review filed first
  WU-2-0  Sierra    SEO/AEO (sitemap, JSON-LD, meta, extractable answers)
  WU-2-1  Mike      exposure (unauthenticated 404 on drafts; no member-personal data;
                    no “In your practice” / Family B on public pages)
  WU-2-2  Alpha     unauthenticated read of status=published; drafts 404
  WU-2-3  Charlie   public article/entry; contamination sweep of member-gating UI
  WU-2-4  Kilo      published 200 unauthenticated; draft 404; rail absent
       → WU-2-G Delta

WU-3 / SC-3b   SC-0 diffs landed (DL-562). Code waits Factory publication signal + GO SC-3b.
WU-C           blocked — Coach calls corpus phases
```

**Never in these packets:** Options Lab / Runner internals · Factory job (except GET-only poller if WU-3) · compile-inbox · MiniTwo unless asked · apps-card title (D-1) · AppChrome without three-OK.

---

## File allowlists (when stamped)

### WU-0 (docs)

| Area | Touch |
|------|--------|
| Four SUPERSEDED specs | **Banner only** — Member Wiki v0.1 · Interface v0.1 · Agent v0.1.3 · (Compilation already OD-3) |
| `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` | Status → APPROVED (Coach-directed nits only) |
| `Architecture/00-decision-log.md` | Unification DL |
| `Architecture/11-wiki-design.md` | Spec-of-record pointer |
| `agents/p-wiki/` | board + this plan citation |

**WU-0 never:** product code · AppChrome · public read · registration.

### WU-1 (after chrome ruling)

| Area | Touch |
|------|--------|
| `web/components/wiki/` | **New** `WikiAgentLauncher` + message window (wiki-owned). Pattern from Help; **not** a HelpLauncher edit. |
| Mount host | **Only** the file Coach named in A / B / C |
| `server/` wiki-agent | Context-provider registry (config, fail-loud). Session API already WA-4. |
| `/app` hub provider | Declared hub files only; no hub restyle |
| Tests | Both-layers admin-only; unregistered surface = route-context session |

**WU-1 never:** `web/components/HelpLauncher.tsx` behavior change · AppChrome unless ruling **(A)** · `web/app/layout.tsx` unless Coach names it · member-visible copy · public read.

### WU-2 (after Sierra + Mike)

| Area | Touch |
|------|--------|
| `server/routes/wiki.py` | Published pages readable without session; drafts 404 unauthenticated **and** for non-admin members |
| `web/app/app/wiki/**` | Public render of published pages; login wall removed for those reads; admin panel still `useIsAdmin` |
| SEO | Sierra-named sitemap / JSON-LD / titles — follow course catalog patterns |
| Rail | “In your practice” **never** on unauthenticated responses (code + test) |

**WU-2 never:** Family B endpoints · session API opened to the public · drafts visible · registration.

### WU-3 / WU-C

Not an allowlist until Coach stamps.

---

## Seeds

Juliet writes pasteable seeds **in the same body of work as each GO**, not before.

| Seed | Agent | Depends | Feeds |
|------|--------|---------|-------|
| R0-1 | India | GO SPEC pending | Coach |
| R0-2 | Mike | after India or ∥ per Coach | Coach |
| R0-3 | Sierra | public-read implications (may file notes now; **blocks WU-2 stamp**) | Coach |
| R0-4 | Echo + Tango | floating launcher + window | Coach |
| R0-5 | Hotel | obligations carry forward; guidelines remain law | Coach |
| WU-0-* | India, Lima | **GO WU-0** | WU-0-G |
| WU-1-* | India, Echo, Charlie, Alpha, Mike, Kilo | **GO WU-1** + chrome ruling | WU-1-G |
| WU-2-* | Sierra, Mike, Alpha, Charlie, Kilo | **GO WU-2** + reviews in-tree | WU-2-G |
| WU-3-* / SC-3b | Alpha, Kilo | Factory publication signal exists + **GO SC-3b** | SC-3b-G |
| WU-C-* | — | Coach calls I.5 | — |

---

## Gates

| Gate | Evidence |
|------|----------|
| **R0** | Review notes filed; Coach stamp on spec v0.2.1; unification DL number |
| **WU-0-G** | SUPERSEDED banners only (diffstat proves no body rewrite); Arch 11 cites v0.2.1; record checks (a)(b) in the DL; Help-mount table matches this plan |
| **WU-1-G** | Discovery file+lines quoted; mount file = Coach ruling; launcher **absent** in non-admin DOM; session open 403/404 non-admin; `ftl_ag_` → `session_requires_human`; admin open cites `{surface, route, entity}`; `/app` hub provider enriches entity; unregistered surface still valid (route only); propose-and-dispose (in-window proposal does not execute); WikiAgentPanel disposed per O1/ruling; house box tolerated **8** only (OPF+curate; SSR flake non-chargeable); `git diff --stat` vs allowlist; **AppChrome empty unless ruling A** |
| **WU-2-G** | Unauthenticated GET published slug → 200; draft slug → 404; admin still sees drafts; “In your practice” node **absent** on public HTML; Sierra artifacts present; Mike checklist signed; no member-personal payload on public routes; contamination sweep: no leftover “sign in to read the wiki” on published pages; **unpublish-transition** (Coach-endorsed 2026-08-23): published → draft returns public 404 **and** drops from the sitemap (prove before/after) |
| **WU-3-G / SC-3b-G** | (when stamped) Factory signal → Wiki compose; draft declares **new** or **update**; fit from envelope + linkage; thin material → L12 `failed-partial` + reason, no page, no retry; Factory writes **no** envelope and **no** wiki page bytes; W5 |
| **WU-C-G** | (when stamped) per I.5 criteria from Member Wiki v0.1, re-cited |

House box: tolerated 8 (OPF `test_cl21_ladder_http_carries_opf_session` + 7 Curate `Phase 'development' is full`). SSR flips non-chargeable (DL-550 routing). Any other new failure is that packet’s problem.

---

## R0 charge (reviews, no code)

**Order:** India + Mike first (spec header). Then Sierra, Echo+Tango, Hotel.

| ID | Agent | Question |
|----|--------|----------|
| R0-1 | **India** | Unification introduces no new store or boundary. Citation map IV.3 correct. II.5 matches v0.1.3 §7 carve. I.1 does not punch DL-539. IV.6 deltas dispositioned as in this plan. |
| R0-2 | **Mike** | Public read exposure (III.2) is implementable without leaking Family B or drafts. Floating launcher admin-only is distinct from Help. Principal model (`contracts:deliver` vs admin cookie) unchanged. Arch 05 seven-line doctrine is the right home. |
| R0-3 | **Sierra** | First Sierra gate for this program. Public wiki pages: sitemap, JSON-LD, unique titles, extractable answers. Notes may land at R0; **WU-2 does not stamp without the review in-tree**. |
| R0-4 | **Echo + Tango** | Floating launcher prominence without member-facing noise. Message window: propose-and-dispose; no “I’ll write you an edge”; “Draft on the board — you still approve.” Do not clone Help’s member emerald FAB. |
| R0-5 | **Hotel** | No-invention / no-profit / guidelines artifact remain law for every remaining draft class including registration pages. |

---

## Coach stamp

- [x] **Spec v0.2.1** APPROVED (hunks 2–4 confirmed as the bump)  
- [x] **GO SPEC** — **DL-555**; SUPERSEDED banners authorized  
- [x] **Chrome ruling for WU-1:** **(B)** narrow wiki-owned; keep/evolve WikiAgentPanel; AppChrome untouched  
- [x] **GO WU-0** (docs-only; this packet)  
- [x] **GO WU-1** (ruling B · **DL-557**)  
- [x] **WU-2 timing** — stamped 2026-08-23 · **GO WU-2** · **DL-558**  
- [ ] **WU-3 / SC-3b** — SC-0 diffs landed (**DL-562**). Code waits Factory publication signal + **GO SC-3b**. Help Package spec not required.  
- [ ] **WU-C** — not this page  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Juliet (plan v1.0) · Coach stamp 2026-08-23 (GO SPEC + GO WU-0 + GO WU-1 ruling B)  
**Date:** 2026-08-23
