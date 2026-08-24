# Wiki Agent Directive — Compliance Audit (2026-08-23)

**Charge:** [`Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md`](./Wiki-Agent-Directive-and-Compliance-Audit-Charge-v0_1.md) (D1–D7; D7 Coach addendum this day).  
**Authority:** report + proposal only. **No spec. No implementation plan. No code.**  
Changes that follow this report require a **Specification** and an **implementation plan**, then Coach GO through the normal spec → review → approval chain. This document authorizes none of that.

**Method:** as-built vs directive. Exercised reads only (no writes into `lab-wiki`).  
**Open questions (§4 of the charge, plus Q6 for D7) are not resolved here.**

---

## 1. Compliance report

| ID | Verdict | One line |
|----|---------|----------|
| **D1** Agent-fronted, git-funneled writes | **PARTIAL** (Q1 tension) | Git is the SoR; MySQL is a derived cache. **No agent writes page bytes.** Humans write git directly. |
| **D2** Course-change monitoring | **ABSENT** | No `corpus_items`, no registrar, no course→wiki hook. |
| **D3** Help-system-change monitoring | **ABSENT** | No help→wiki pipeline. No `help_articles` table. |
| **D4** Linkage search on update | **ABSENT** | No related engine. `wiki_links_idx` only parses existing `[[wikilinks]]` at reindex. |
| **D5** Admin-callable, context-aware | **PARTIAL** | Idle compile APIs (IKI/wiki four surfaces, stub→board, no git). UI launcher **absent**. Not a session. |
| **D6** IKI template → wiki page | **ABSENT** | `register()` has no wiki hook. IKI Template Help Package spec **not in-tree**. Zero template wiki pages. |
| **D7** Admin-anywhere wiki-agent session | **ABSENT** | No UI, callable from anywhere, that opens a wiki-agent session and takes articulated specs for a new page. |

### D1 — Agent-fronted, git-funneled writes — PARTIAL

**What exists**

- **SoR:** `LABS_WIKI_ROOT` checkout (`wiki_store.wiki_root()`, boot fail-loud in `server/main.py`). Remote `git@github.com:dudefromearth/lab-wiki.git`. 86 pages parsed this run.
- **Derived index only:** `wiki_pages_idx` / `wiki_links_idx` (migration **035**); pin/provenance cache columns (migration **133**). `wiki_store.reindex` is DELETE + rebuild from checkout. Confirmed: no `corpus_items`, no `wiki_refs`. Live: `wiki_pages_idx` n=86, `wiki_links_idx` n=380 — matches `load_pages`.
- **D-12 tick:** `infra/labwiki-sync.plist` — `git pull --ff-only` then `POST /api/admin/wiki/reindex` every 300s. Reindex is **not** a content writer.
- **Oscar charter** seated: `agents/bench/oscar.md`. Runtime `server/wiki_compile_oscar.py` `compile_wiki_stub` mints a **board** card (`product_line=wiki`, `awaiting_approval`) from **deterministic stub markdown**. `on_board_published` **no-ops** filing to git (**DL-545**). No `git commit` anywhere in the wiki server modules.

**Write paths into `lab-wiki` today**

| Path | Through an agent? | Writes git page bytes? |
|------|-------------------|-------------------------|
| Human / Obsidian / `git push` on `lab-wiki` | No | **Yes** (the live SoR path) |
| WI9 admin in-place save | — | **No** — not built (`EditableMarkdown` is not on `/app/wiki/[slug]`) |
| Oscar compile stub | Named Oscar, no model | **No** — board `content_items` only |
| Board publish (`on_board_published`) | Hook | **No** |
| `POST /api/admin/wiki/reindex` | Agent key *or* admin | **No** — index only |
| Sync tick | Agent bearer `wiki:reindex` | Pull only, then reindex |

**Q1 tension (not resolved):** If the agent is the **sole committer**, current human git authorship **contradicts** D1 (would be CONFLICTED). If the agent owns **only its pipeline**, D1’s agent-write half is **ABSENT** and the git SoR half is **COMPLIANT**. Charge forbids picking. Verdict stays **PARTIAL**.

W5 (Member Wiki v0.1): “No agent-direct publish.” As-built, the agent does not publish **or** draft into git.

### D2 — Course-change monitoring — ABSENT

- Member Wiki v0.1 §4 ① registrar → `corpus_items` from `lessons` / `live_sessions` / `resources`: **table missing** (`SHOW TABLES LIKE 'corpus_items'` → none).
- Course/lesson routes do not call wiki modules (`server/routes/*.py` wiki hits: `wiki.py`, `feature_gates.py`, `member.py` — no lesson-save hook).
- Wiki Proactive Compilation v0.2 watcher: as-built `wiki_compile_watcher.py` is a **SHA stub**. Records `wiki_compile_watcher_state.last_sha`. **First SHA writes zero candidate rows.** “Diffing kinds is W3+.” Does **not** watch course content. Does **not** poll production deploys on MiniTwo.
- **Trace (edit a published lesson today):** lesson save updates course DB. Wiki: **nothing**, on any timeline.

### D3 — Help-system-change monitoring — ABSENT

- No `help_articles` table. Help concierge lives in `server/help_reference/*.md` (6 files) plus `help_messages` / `help_questions`.
- Oscar W1: help/both targets **refused** (`assert_wiki_target`).
- No registration of help content into a wiki corpus. No watcher on help_reference or FAQ.

### D4 — Linkage search on update — ABSENT

- Member Wiki v0.1 ⑤ related engine / `wiki_refs`: **not built**.
- `wiki_links_idx` is a **parser** of `[[wikilinks]]` already in page bodies, rebuilt on reindex (`wiki_store.parse_wikilinks` → INSERT). That is not an agent searching for new connections on an update.
- S0 article “See also” / “Linked from” = those parsed links. Empty Related rail (S4 not seated).

### D5 — Admin-callable, context-aware — PARTIAL

**Present (idle APIs, exercised):**

- `GET /api/wiki/compile-inbox` — admin 200 `{"candidates":[],"surfaces":["iki.wiki.entry","iki.wiki.article","iki.runner","iki.factory"]}`; observer **404**; anon **401**.
- `POST /api/wiki/compile-candidates` (admin-point) and compile/dismiss. Capture: `surface_key` + `route` only (`wiki_compile_surfaces.sanitize_capture`). **No entity id. No Family B. No page text. No multi-turn specs.**
- Compile → `compile_wiki_stub` → board card, not git.

**Absent:**

- `web/components/wiki/CompileLauncher.tsx` — **file gone** (DL-545 / S0). No “Compile this into Wiki” on wiki, Factory, Runner, or anywhere else (grep on `web/` ts/tsx: no matches).
- Calling-surface list is **four IKI/wiki routes**, not Practice, Journey, Options Lab, Strategy Lab, courses, or help.

**Suites**

| Surface | Affordance |
|---------|------------|
| `/app/wiki` | Suite nav only. No compile launcher. |
| `/app/iki/runner`, `/app/iki/factory` | Same. |
| Practice, Journey, Options Lab, Strategy Lab, courses, help | **Absent** |

This is a one-shot stub, not D5 “take direction on new pages” and not D7.

### D6 — IKI template pages — ABSENT

- `web/lib/runner/registry.ts` `register()` asserts control defaults and stores the template. **No wiki call.**
- IKI Template Help Package Spec v0.1: **not in-tree** (Wiki Spec v1.2: “not yet in-tree; cited by SHA when landed”). Options Lab help-package spec exists as **DRAFT**, Options Lab program only, **registration gate not live**.
- `load_pages` this run: **no** slugs matching template / heatmap / `sym-fly` / width-fit / spread-tax.

Q4 (page as consequence vs precondition of registration) **not forced** by code — nothing fires.

### D7 — Admin-anywhere wiki-agent session — ABSENT

Coach addendum: an admin interface **callable from anywhere in FatTail Labs**, contextually aware, **tied to the wiki agent**, where the admin **articulates specifications in that session** and requests a page.

**Not this:**

- `/admin/ai` Agent Workbench — bench callsigns / fixtures, not wiki agent, not invocable from member surfaces.
- Help Concierge — member help, not wiki compile.
- Deleted CompileLauncher — one-shot, IKI-only, no session, no articulated spec → git page.
- Compile APIs — `note` ≤1024 chars, no chat, no git write.

Q5/Q6 (floating button vs host chrome vs `/admin/ai`; multi-turn vs form) **unresolved**. As-built forces **neither** — there is no interface.

---

## 2. Gap list (distance from the directive)

BLOCKING = breaks the directive if we claimed it shipped. ADVISORY = preference / vehicle.

| Rank | Gap | Blocking? | Exists | Directive | Between them |
|------|-----|-----------|--------|-----------|--------------|
| 1 | **No wiki-agent session UI (D7 + D5)** | BLOCKING for D7 | `/admin/ai` (wrong agent); idle compile APIs | Admin, from **any** Labs surface, opens a **session** with the wiki agent, **articulates specs**, requests a page | New **spec** for the interface + agent contract; then implementation plan. Cross-tree emit: host chrome or per-suite entry (DL-539 if not wiki-only). |
| 2 | **Agent does not write git (D1)** | BLOCKING for “agent fronts writes” | Human git; Oscar→board stub; publish hook no-ops | Agent funnel writes through git | Spec must answer **Q1** (sole committer vs pipeline-only) and **Q2** (W5 still?). Then server-side git write (never credentials to the model). D-12 already specified. |
| 3 | **No course monitor (D2)** | BLOCKING for D2 | Course hosting as-built; wiki ignores it | Course change → agent updates wiki | Spec: what “change” means; W5 vs mechanical sync (**Q2**). Cross-tree: lesson/live/resource save emit (DL-539). `corpus_items` (Member Wiki S2) is a likely store, not assumed. |
| 4 | **No help monitor (D3)** | BLOCKING for D3 | `help_reference` + help chat tables | Help change → agent updates wiki | Spec: which help artifacts. Cross-tree: help publish emit (DL-539). |
| 5 | **No linkage engine (D4)** | BLOCKING for D4 | `[[wikilinks]]` parse at reindex | On **every** update, agent searches existing content and **builds** connections | Spec: algorithm, review, git write of new links vs index-only. Member Wiki ⑤ is prior art, not as-built. |
| 6 | **No template→wiki (D6)** | BLOCKING for D6 | Runner `register()`; OL help-package spec DRAFT | New template → wiki page **how it fits FatTail Labs** | Spec: **Q4** consequence vs precondition. IKI help-package spec still missing in-tree. Cross-tree: template registration (DL-539). |
| 7 | **Compile overlay is the wrong shape for D7** | ADVISORY | Idle APIs, four `surface_key`s, stub board cards | Session + articulated specs, anywhere | Do not “turn the launcher back on” and call D7 done. Vehicle is **Q3 + Q6**. |
| 8 | **Context is route-only on four IKI keys** | ADVISORY until D5/D7 spec | `sanitize_capture` | Strategy Lab vs Practice vs … plus entity on screen (**Q5**) | Spec. Family B: capture must stay lawful. |

---

## 3. Draft proposal (not a spec, not an implementation plan)

**Next authorized work, if Coach wants any of D1–D7 to ship:**

1. **Coach answers or defers** charge §4 Q1–Q6 (write authority, publish gate, spec vehicle, template coupling, context gathering, D7 vehicle). The audit does not pick.
2. **Juliet drafts a Specification** — either amend Proactive Compilation v0.2 → v0.3 **or** a standalone Wiki Agent spec (Q3). That spec must cover D1–D7 in testable language, including D7 (anywhere-callable admin session, context, articulated page request, git funnel, W5/Q2).
3. **Spec review gates** (India, Echo/Tango, Mike if auth/surface, Hotel if compiled trading claims).
4. **Coach approves the spec** → lands in `Specs/`. Lima logs DLs.
5. **Only then** Juliet writes an **implementation plan** (seeds, allowlists, GO stamps). Factory, Runner, Options Lab, courses, help: **not opened** unless the spec + three-OK (DL-539) say so.

Until step 4–5 complete, **do not code**. Member Wiki v0.1 S0 (pins, rail, git SoR, suite nav) stays as-built. S1 (WI9 save, hover) remains a **separate** Interface-spec remainder — also needs its own GO; it is not D7.

**This proposal does not:** seed `agents/p-wiki/`, touch Factory/Runner, restore CompileLauncher, write `lab-wiki`, or invent Q1–Q6 answers.

---

## 4. Baseline corrections (charge §3)

| Baseline claim | As-built |
|----------------|----------|
| WIK-D1 git SoR + MySQL derived (035) | **Confirmed.** Also 133 pin/provenance cache. DL-545/546. |
| W5 no agent-direct publish | **Holds vacuously** — agent does not write git at all. |
| WI9 admin in-place → checkout | **Specced, not built** (Interface §6). S1 in plan v2.0, not GO’d. |
| Perpetual loop ①–⑤ | W1 spine (read/index/search/article/graph/⌘K) **shipped**. ①–⑤ **not built**. S0 shipped pins + rail shell. |
| Proactive Compilation v0.2 | **Spec only** for deploy-watch / inbox / launcher. As-built: SHA stub + idle APIs + launcher **removed**. |
| IKI Template Help Package v0.1 registration gate | **Spec not in-tree.** Gate **not live.** |

---

## 5. Observed, out of scope (one line each)

- Apps card still titled “IKI Lab / Coming soon” (D-1 unfilled).
- lab-wiki pin frontmatter for Start here is local-checkout only until that repo is committed/pushed.
- `/admin/ai` workbench exists for other bench agents.
- Wiki compile candidate count is 0.
- Oscar Labs charter vs knowledge-vault Oscar are different files (not clobbered).

---

**Signed as audit, not as GO.** 2026-08-23.
