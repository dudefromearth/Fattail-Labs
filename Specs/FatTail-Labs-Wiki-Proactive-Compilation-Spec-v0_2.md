# FatTail Labs — Wiki Proactive Compilation Spec v0.2

**Scope statement (doctrine, 2026-08-21)**
- **Active program:** IKI Lab — Wiki.
- **Touches:** this spec (supersedes v0.1); amendments proposed to Member Wiki Spec v0.1 (§3.1, §4), Wiki Interface Spec v0.1 (§6), Template Runner Spec (TR7 — via IKI Template Help Package Spec v0.1). No code, no migrations, no seeds.
- **Touches outside program:** **TWO, both staged, neither seeded:** (a) §6 launcher mount in `AppChrome` (P1) — three-OK; (b) §6 launcher mount on Options Lab routes (frozen tree) — three-OK. v0.2 mounts on **IKI + Wiki routes only**.

> **SUPERSEDED (DL-555).** Spec of record is
> [`FatTail-Labs-Wiki-Spec-v0_2_1.md`](./FatTail-Labs-Wiki-Spec-v0_2_1.md)
> (Wiki Spec v0.2.1 APPROVED). Already superseded as a vehicle per OD-3; absorbed
> into the unified spec. Banner-only; body frozen.

**Status:** SUPERSEDED — see banner. Historical DRAFT v0.2 body below is frozen.
**Date:** 2026-08-21
**Supersedes:** v0.1. Review source: Grok assessment (15 issues, all folded or explicitly held). Changes marked **[v0.2]**.
**Canonical filename:** `Specs/FatTail-Labs-Wiki-Proactive-Compilation-Spec-v0_2.md`

**Parents:**

| Doc | Role |
|---|---|
| Member Wiki Spec v0.1 | Corpus registry §3.1, compile pipeline ①–⑤ §4, laws W1–W11 |
| Wiki Interface Spec v0.1 | Surfaces, component registry §6, admin in-place paths, WI9/WI10 |
| Help System Architecture v0.1 | `help_articles` §5, `surface_key`, `HelpLauncher` pattern, governance §6, parity rule |
| Content Board Spec v1.0 | `content_items` transitions — the **only** approval machinery |
| **IKI Template Help Package Spec v0.1** **[v0.2]** | Help block as a required, named TR7 field (TH1–TH3); this spec consumes it — it does not cite a ruling as spec text |
| Identity-Access Spec v1.0 | Operator role vs product tier (§6, AT-WP18) |
| `infra/deploy.md` | Deploy event — OD-WP1 |
| CLAUDE.md · AGENTS.md · DL-539 | Invariants; frozen trees |

**Coach Content Law:** nothing of Coach's removed. §10 inventory.

---

## 0. Coach's requirement (verbatim in intent, 2026-08-21)

> The wiki agent must be proactive, and flag any new content coming into the repo that has been deployed to production as a potential wiki and help system entry. If there are explicit directives to enter into the wiki then it continues as designed, but if there are not, it should keep a compiled list of things that were not explicitly asked to go into the wiki and ask for approval to enter them into help and wiki. There should be an admin interface in IKI Lab for this agent/admin interaction.

> Maybe this is a panel in the wiki rather than a separate app.

> The "Compile This into Wiki" interface sounds like a feature I might want to include in any part of FatTail Labs. Like a universal bug that follows me around.

> This is an improvement to the wiki system that gives the wiki agent more responsibility and provides the admin with an easier way to make sure developments in FatTail Labs get into the wiki.

## 1. Purpose

Close the gap between "it shipped" and "it's in the wiki and help." The compiler (Member Wiki §4 ③) today acts only on what it is pointed at. This spec gives the agent responsibility to **notice deployments and propose** (§4a), and gives the admin **one gesture** to point it (§6). Two inputs, one pipeline; the directed path is untouched.

## 2. Laws

| # | Law | Source |
|---|---|---|
| **WP1 — Trigger** **[v0.2 restated]** | A candidate is created by **(a)** a production deploy that adds or versions a §3 kind, or **(b)** an admin-pointed submission (WP6). Commits and instructions alone create nothing. | Coach + Grok #2 |
| **WP2 — Directive path unchanged** | Content carrying an explicit wiki/help directive (OD-WP2) flows exactly as Member Wiki §4 ①–⑤. This spec adds no step to it. | Coach |
| **WP3 — Undirected path** **[v0.2 reworded]** | Deployed content with **no** directive enters a persistent candidate list. The agent attaches a **proposal** (§4a) and **waits for compile disposition** by an admin. Nothing is compiled from the list without it. | Coach + Grok #8 |
| **WP4 — Inbox, not a board** **[v0.2: "later" removed]** | The admin surface is a **panel in the Wiki**. Dispositions: **`compile` · `dismiss`**. Approval of the compiled page stays on the content board (W5). The inbox holds no approval state. Snooze is **OD-WP7** and needs a wake condition before it exists. | Coach + Grok #7 |
| **WP5 — Target at compile** **[v0.2 renamed]** | Target (**wiki · help · both**) is set at compile time, in the inbox or launcher. The board never retargets. Help articles are governed by Help Arch §6; wiki links them. | Coach + Grok #8 |
| **WP6 — Admin-pointed input** | A floating, operator-only **"Compile this into Wiki"** affordance. It **creates a candidate row** (origin `admin_pointed`, declared keys only) and may set `disposition=compile` on that row. It never calls the compiler except through the row. | Coach + Grok #9 |
| **WP7 — No page data leaves** **[v0.2 tightened]** | Capture = `surface_key`, **declared** `state_key` (a UI-state token from the surface registry — never router search, never an entity id), route, timestamp, operator identity. Never member content, Family B, or rendered data. *Mike gate.* | Mike rule + Grok #10 |
| **WP8 — Templates are corpus** **[v0.2 corrected]** | A template's help package (IKI Template Help Package Spec §2) **is** its corpus body. A candidate `kind=template` emits when `id@version` is **on the deployed SHA** (WP1a), not at registration. Compile → help article body = the package; wiki **links** it. **No verbatim copy of the package into wiki prose** (W9). | Coach + Grok #6 |
| **WP9 — Nothing lost** | Candidate list is append-only. `dismiss` marks. A dismissed identity re-surfaces on a new version of the same identity. | PDS §9 doctrine |
| **WP10 — Identity and bootstrap** **[v0.2 new]** | Every candidate has an identity key (§3). **First registered SHA is a snapshot:** index only, **zero inbox rows**. Duplicate submit (same identity, disposition `open`/`compiling`) is idempotent — no second row. | Grok #7 |
| **WP11 — Audience** **[v0.2 new]** | Every candidate carries `audience: member \| staff`. Member-audience may become help and/or member wiki. Staff-audience may become staff wiki **only** — never `help_articles`, never member-visible. | Grok #4 |
| **WP12 — No self-candidate** **[v0.2 new]** | A help article or wiki page whose `compiled_from` is a candidate of this system does not re-enter the list. Human-authored help with no wiki link may (wave 2). | Grok #5 |

## 3. Corpus kinds, identity, and waves **[v0.2 restructured]**

`kind` = what the artifact is. `origin` = how it entered (`agent_found` \| `admin_pointed`) — a field on every row, **not a kind** (Grok #1).

| kind | Canonical source | Identity key | Default audience | Wave |
|---|---|---|---|---|
| `template` | Runner registry, on deployed SHA | `id@version` | member | **v0.2** |
| `feature` | `apps` row / route registry + declared `surface_key` | app id + route + `surface_key` | member | **v0.2** |
| *(admin-pointed)* | the surface pointed at (`feature`) | `surface_key` + declared `state_key` | admin-chosen; default member on member routes | **v0.2** |
| `spec` | `Specs/*.md` on deployed SHA | path + version | **staff** | deferred — needs WP11 staff wiki |
| `decision` | `Architecture/00-decision-log.md` | `DL-N` | **staff** | deferred |
| ~~`help_article`~~ | — | — | — | **not a kind** — output (WP12) |

All rows are index rows over canonical sources (W9). Removals and behavior changes on existing routes via registrar: **out of v0.2** (AT-WP19, wave 2); WP6 is the v0.2 path for those.

## 4. Pipeline amendment (Member Wiki §4)

```
  ⓪  DEPLOY EVENT {sha, ts, env=production}  (OD-WP1)        ⓪' ADMIN POINT (WP6)
        ▼                                                          ▼
  ①' REGISTRAR — diff deployed SHA vs last-registered over §3 kinds (WP10: first SHA = snapshot, no rows)
        ▼
      directive present? (OD-WP2) ── yes ──► ③ COMPILER (unchanged) ──► ④ BOARD
        │ no
        ▼
  ①'' CANDIDATE LIST — append-only (WP9, WP10) + PROPOSAL (§4a)
        ▼
  ⓐ  ADMIN INBOX (Wiki panel, WP4): compile [wiki|help|both] · dismiss
        │ compile  →  0–2 content_items minted (§5.2)
        ▼
  ③  COMPILER (unchanged; stubs per OD-WP3) ──► ④ BOARD awaiting_approval ──► published
                                                  └─ reject ──► candidate `compiled_rejected` (§5.2)
```

No return arrow from `published` to ⓪ (WP12). Stages ②, ④, ⑤ unchanged.

### 4a. Proposal object **[v0.2 new — this is the agent's responsibility]**

Attached to every candidate before it is shown:

| Field | Rule |
|---|---|
| `suggested_target` | wiki \| help \| both |
| `audience` | per §3 default; admin may override at compile |
| `suggested_title` | from source (template label, route title) |
| `rationale` | one line, e.g. "New route `journal/fills`; no help article bound to `surface_key=journal.fills`" |
| `suggested_parent` | wiki path or none |
| `member_facing` | bool |

Agent rule of thumb (fixed, not per-row): new/changed **member surface** → help, wiki links · **template** → help (package is body), wiki links · **spec / DL** → staff wiki, never help · **admin-pointed on member route** → help default, wiki optional.

## 5. Admin inbox — Wiki panel

### 5.1 Component (Wiki Interface §6 addition)

| Component | Kind | Surface | Write |
|---|---|---|---|
| **Compile inbox** | Admin region of the Wiki entry (operator session only; WI10 pattern; **stay-put**, never a modal) | Wiki entry | S (operator): disposition on a candidate |

Per row, in order: kind · title · source (deep link) · SHA/date · origin · audience · proposed target · rationale · actions (**Compile** with target override · **Dismiss**). Compile is fire-and-forget; row → `compiling`; panel never blocks on the agent. Empty state text: *"Nothing deployed without a wiki/help directive."* No illustration. Design chain owns density and placement.

### 5.2 Disposition states and board coupling **[v0.2 new]**

`open → compiling → compiled | compiled_rejected` · `open → dismissed`.

- **Both-target mints two `content_items`** (wiki page, help article), each W5-approved independently. `compiling` until both handed to board; then `compiled`.
- **Board rejects either** → candidate `compiled_rejected`, visible, with pointer to the board card. **Not re-approvable from the inbox.** Next move is a new version (WP9) or a new admin-point.

### 5.3 Entity model (OD-WP6 → **sibling table**)

```
wiki_compile_candidates
  id
  identity_key                  -- WP10
  kind                          -- template | feature | spec | decision
  origin                        -- agent_found | admin_pointed
  title, source_ref
  deployed_sha, deployed_at     -- null for admin_pointed
  surface_key, state_key, route -- feature / admin_pointed only; state_key from registry
  audience, suggested_target, suggested_title, rationale, suggested_parent, member_facing
  note                          -- operator one-liner
  disposition                   -- open | compiling | compiled | compiled_rejected | dismissed
  compiled_content_ids          -- 0–2 content_items
  created_at, disposed_at, disposed_by
```

Append-only; disposition is a mark. Candidates are **not** `corpus_items` until compile is chosen.

## 6. Launcher — "Compile this into Wiki" (WP6)

- Pattern: `HelpLauncher` (mount once, ErrorBoundary, role-gated). **Role: operator session** (Identity-Access §: administrator / staff allow-list) — not a product tier (Grok #15).
- First activation opens a small sheet: target chooser (wiki / help / both) · optional one-line note · **Compile now** / **Add to inbox**. Both write the same row; *Compile now* sets `disposition=compile`. No page preview, no screenshot (WP7).
- **Placement:** not the HelpLauncher corner. Design chain decides chord vs. visible operator mark; must read as operator chrome and survive screenshare without painting over member UI (Grok #14).
- **Mount, v0.2:** IKI Lab routes + Wiki routes. **Staged behind three OKs each:** Options Lab routes (frozen tree, DL-539), `AppChrome` (P1). Law remains "every Labs route"; seeds are staged. Packets may be *specified* now; not seeded until OK 3.

## 7. Help system interface

- Target `help` → `help_articles` draft (`status: draft`, `surface_key` from candidate). **OD-WP3 recommendation: stubs + structured fields from source** (help package, surface_key, title). No compiler prose; full help prose stays human + Tango + Hotel. This keeps §8's Hotel non-goal true.
- Wiki links help articles as canonical entities; compiled-from shows the article.
- **Mike write matrix** **[v0.2 new]:**

| Writer | May write | May not |
|---|---|---|
| Registrar | new candidate rows on deploy diff | disposition, corpus, help, page data |
| Launcher | new candidate row (declared keys only) | page content, Family B, search params |
| Operator session | disposition, note, target override | identity, SHA, source ref |
| Compiler | wiki draft + help draft **after** `disposition=compile` | publish (W5), candidate identity |
| Board | `content_items` transitions | candidate table except via `compiled` / `compiled_rejected` |

## 8. Boundaries / non-goals

- No agent-direct publish (W5). No second approval state (WP4). No member-visible inbox or launcher.
- No page content in any capture; no `state_key` from raw URL (WP7).
- No change to compile guidelines or Hotel gate (W6) — **true iff OD-WP3 = stubs.**
- No inbox flood on first index (WP10). No staff kind → member help (WP11). No compiler self-candidate (WP12).
- Removals / behavior changes on existing routes via registrar: wave 2.
- No `AppChrome` or Options Lab seed until OK 3 each.
- No change to Runner compute, Factory, or templates beyond consuming the help package.

## 9. Acceptance

| AT | Evidence |
|---|---|
| AT-WP1 | Second deploy adds a `feature` route with no directive → one row, kind `feature`, origin `agent_found`, correct SHA, proposal attached. |
| AT-WP2 | Deploy with directive → no row; compiler runs; board card appears. |
| AT-WP3 **[v0.2 rewritten]** | Template on deployed SHA → row `kind=template`. Compile target help → `help_articles` draft body **=** help package. Wiki draft (if targeted) **cites** the article in compiled-from; wiki body does **not** contain the package verbatim. |
| AT-WP4 | Dismiss → row marked, not deleted; redeploy at new version → re-surfaces. |
| AT-WP5 | Launcher present for operator session; **absent from DOM** for a Navigator session with no operator role. |
| AT-WP6 | Capture on a Journal route: `surface_key` + registry `state_key` + route only; a URL with a trade id in search does **not** appear in payload (Mike evidence style). |
| AT-WP7 | Compile → board `awaiting_approval`; inbox shows `compiling`; no approve/reject control in inbox. |
| AT-WP8 | Target help → draft row exists; member-invisible. |
| AT-WP9 | Stay-put (W8, WI9) on every inbox action. |
| AT-WP10 | First SHA indexed; inbox empty. Second deploy with one new `feature` → one row. |
| AT-WP11 | Admin-point twice on same identity while `open` → one row. |
| AT-WP12 | Compile from launcher → same row as inbox, `disposition=compile`, board card exists. |
| AT-WP13 | Target both → two `content_items`; rejecting help does not publish help; wiki item still approvable; candidate `compiled_rejected`. |
| AT-WP15 | (wave 2 guard) a `spec` row, if present, has `audience=staff`; compile-to-help refused. |
| AT-WP16 | Help article published by this compiler does not re-enter the inbox. |
| AT-WP17 | = AT-WP3 link-not-copy check, asserted by diff. |
| AT-WP18 | Operator allow-list, not tier: an administrator sees launcher; a staff-allow-listed non-admin sees it; Navigator does not. |
| AT-WP19 | Out of v0.2; named so it is not forgotten. |

## 10. Ideas inventory (nothing omitted)

1–9 as v0.1 (Coach's nine statements, unchanged).
10. **[v0.2]** Grok review items #1–#15 — each folded into a law, OD, or AT above; none dropped. Items held rather than adopted: Options Lab as a v0.2 mount (held — frozen tree, three-OK); chord-vs-FAB (held — design chain's).

**[advisor] items, held as opinion:** sibling table (§5.3); rule-of-thumb wording in §4a; stubs-only for OD-WP3; Foxtrot hook for OD-WP1; wave split in §3.

## 11. Open decisions

| ID | Question | Owner | v0.2 recommendation |
|---|---|---|---|
| OD-WP1 | Deploy event source | Foxtrot / India | Foxtrot hook `{sha, ts, env=production}`; polling HEAD cannot distinguish live from checked-out |
| OD-WP2 | Directive marker | Lima / India | Commit trailer `Wiki: <path\|none>` / `Help: <surface_key\|none>`; spec frontmatter `wiki:` / `help:`; absence = candidate; no third syntax in the help package |
| OD-WP3 | Compiler drafts bodies or stubs | **Coach** | Stubs + structured fields |
| OD-WP4 | Launcher mount | **Coach** | v0.2 = IKI + Wiki; Options Lab and `AppChrome` each three-OK, staged |
| OD-WP5 | First-wave kinds | **Coach** | `template` + `feature` + admin-pointed origin; defer `spec`/`decision` |
| OD-WP6 | Candidate home | India | Sibling table (§5.3) |
| OD-WP7 **[v0.2]** | Snooze disposition | Coach | Only with explicit wake (date or next deploy of identity); otherwise not in v0.2 |

## 12. Review chain

Juliet → India (§5.3, identity keys, two-item mint, `compiled_rejected`, WP12 suppression) → UX → UI (Echo) → Interaction (inbox region, launcher chord/mark) → Tango (every inbox/launcher string; keep Coach's "Compile this into Wiki") → Mike (WP7, write matrix) → Hotel (confirm guidelines unchanged iff OD-WP3 = stubs) → Foxtrot (OD-WP1) → Coach (OD-WP3/4/5/7) → Lima → Juliet seeds → Delta.
