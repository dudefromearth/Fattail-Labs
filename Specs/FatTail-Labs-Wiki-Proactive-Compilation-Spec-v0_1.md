# FatTail Labs — Wiki Proactive Compilation Spec v0.1

**Scope statement (doctrine, 2026-08-21)**
- **Active program:** IKI Lab — Wiki.
- **Touches:** this spec (new); amendments proposed to Member Wiki Spec v0.1 (§3.1 corpus kinds, §4 flow) and Wiki Interface Spec v0.1 (§6 components). No code, no migrations, no seeds in this document.
- **Touches outside program:** **ONE** — §6 floating affordance mounts in `AppChrome` (P1 platform chrome). **Three-OK item under DL-539.** Flagged here; not specified beyond the mount point until Coach's first OK.

**Status:** DRAFT for Juliet — advisor draft, no authority. Juliet owns it from here.
**Date:** 2026-08-21
**Type:** Feature amendment to the Wiki (Member Wiki v0.1 + Wiki Interface v0.1, both DRAFT)
**Canonical filename:** `Specs/FatTail-Labs-Wiki-Proactive-Compilation-Spec-v0_1.md`

**Parents (normative where noted):**

| Doc | Role |
|---|---|
| Member Wiki Spec v0.1 | Corpus registry (§3.1), compile pipeline ①–⑤ (§4), laws W1–W11 |
| Wiki Interface Spec v0.1 | Surfaces, component registry (§6), admin in-place paths, WI9/WI10 |
| Help System Architecture v0.1 | `help_articles` model (§5), `surface_key`, `HelpLauncher` pattern, governance (§6), parity rule |
| Content Board Spec v1.0 | `content_items` transitions; the **only** approval machinery |
| Quebec Poller Spec v1.0 | Scheduled tick pattern |
| Template Runner Spec TR7 | Template contract — help block (Coach ruling 2026-08-21) |
| `infra/deploy.md` (Foxtrot) | "Deployed to production" as an event — OD-WP1 |
| CLAUDE.md · AGENTS.md · DL-539 | Invariants; frozen trees |

**Coach Content Law:** nothing of Coach's removed. §10 inventory.

---

## 0. Coach's requirement (verbatim in intent, 2026-08-21)

> The wiki agent must be proactive, and flag any new content coming into the repo that has been deployed to production as a potential wiki and help system entry. If there are explicit directives to enter into the wiki then it continues as designed, but if there are not, it should keep a compiled list of things that were not explicitly asked to go into the wiki and ask for approval to enter them into help and wiki. There should be an admin interface in IKI Lab for this agent/admin interaction.

> [On placement] Maybe this is a panel in the wiki rather than a separate app.

> The "Compile This into Wiki" interface sounds like a feature I might want to include in any part of FatTail Labs. Like a universal bug that follows me around.

> This is an improvement to the wiki system that gives the wiki agent more responsibility and provides the admin with an easier way to make sure developments in FatTail Labs get into the wiki.

## 1. Purpose

Close the gap between "it shipped" and "it's in the wiki and help." Today the compiler agent (Member Wiki §4 stage ③) acts only on what it is pointed at — transcripts and course entities. Everything else that lands in production is invisible to it unless a commit says "add to wiki." This spec gives the agent the responsibility to **notice deployments on its own**, and gives the admin **one gesture, from anywhere,** to point it.

Two inputs, one pipeline. The existing compile → board → approve path does not change.

## 2. Laws (WP1–WP9)

| # | Law | Source |
|---|---|---|
| **WP1 — Deploy is the trigger** | The agent watches **production deploys**, not commits, not instructions. A thing is a candidate the moment it is live. | Coach |
| **WP2 — Directive path unchanged** | Content that carries an explicit wiki/help directive flows exactly as Member Wiki §4 ①–⑤ today. This spec adds no step to it. | Coach |
| **WP3 — Undirected path** | Deployed content with **no** directive enters a persistent **candidate list** ("deployed, not asked for"). The agent proposes each for help and/or wiki and waits for admin approval. Nothing is compiled from this list without it. | Coach |
| **WP4 — Inbox, not a board** | The admin surface is a **panel in the Wiki**, not a fourth IKI app. It is an inbox: admin disposes each candidate as *compile* · *dismiss* · *later*. Approval of the **compiled page** stays on the content board (W5). The inbox holds no approval state of its own. | Coach ("panel in the wiki") · no-second-store |
| **WP5 — Target on approval** | Compile may target **wiki**, **help**, or **both**. A help article, once targeted, is authored and governed under Help Architecture §6 (Tango every string, Hotel concepts); the wiki links it. | Coach |
| **WP6 — Admin-pointed input** | A floating, admin-only **"Compile this into Wiki"** affordance is available on every Labs route. It captures `surface_key` + state and submits a candidate to the same list as WP3, flagged *admin-pointed*. | Coach ("universal bug") |
| **WP7 — No page data leaves** | WP6 captures `surface_key`, `state_key`, route, and timestamp. **Never** member content, never Family B, never the rendered data on the page. Same rule as Help Architecture §5. *Mike gate.* | Mike rule |
| **WP8 — Templates are corpus** | A Runner template's required **help block** (TR7: purpose · information→knowledge · why · how · scenarios · non-claim · data output) is a corpus entry. Registration of a template emits a deploy candidate automatically. | Coach (template help ruling) |
| **WP9 — Nothing lost** | The candidate list is append-only. *Dismiss* marks, never deletes. A dismissed candidate re-surfaces if the same artifact deploys again at a new version. | Candidate-register doctrine (PDS §9) |

## 3. What counts as "deployed content" (corpus kinds added)

Member Wiki §3.1 `corpus_items.kind` today: `lesson | live_session | youtube_video | resource`. This spec adds:

| kind | Source of truth | Registrar detects by |
|---|---|---|
| `spec` | `Specs/*.md` on the deployed SHA | new file or version bump since last deploy |
| `decision` | `Architecture/00-decision-log.md` | new DL entry since last deploy |
| `template` | Runner registry (`id@version`) | new registration; help block is the body |
| `help_article` | `help_articles` (Help Arch §5) | new published row |
| `feature` | `apps` row / route registry (Application Framework) | new app or route |
| `admin_pointed` | WP6 submission | always a candidate; no detection |

All are **index rows over canonical sources** (W9). No content copied.

## 4. Pipeline amendment (Member Wiki §4)

```
  ⓪  DEPLOY EVENT (Foxtrot) ── SHA + timestamp ──────────────────────────┐
        ▼                                                                │
  ①' REGISTRAR — diff deployed SHA vs last-registered SHA over §3 kinds; │
      + WP6 admin-pointed submissions                                    │
        ▼                                                                │
      directive present? ── yes ──► ③ COMPILER (unchanged) ──► ④ BOARD  │
        │ no                                                             │
        ▼                                                                │
  ①'' CANDIDATE LIST (persistent, append-only, WP9)                      │
        ▼                                                                │
  ⓐ  ADMIN INBOX (Wiki panel, WP4): compile [wiki|help|both] · dismiss · later
        │ compile                                                        │
        ▼                                                                │
  ③  COMPILER (unchanged) ──► ④ BOARD awaiting_approval ──► published ───┘
```

Stages ②, ④, ⑤ unchanged. ③ gains no new authority — it compiles what it is given.

**Directive detection (①'):** a deploy item "has a directive" when the deploying commit message, the spec's doc-parity section, or the template help block carries an explicit wiki/help marker. The marker syntax is **OD-WP2** (Lima/India); this spec only requires that it be explicit and machine-detectable.

## 5. Admin inbox — Wiki panel (Wiki Interface §6 addition)

| Component | Kind | Surface | Write |
|---|---|---|---|
| **Compile inbox** | Admin panel (admin session only; members never see it, WI10 pattern) | Wiki entry, admin region | S (admin): dispose candidate |

Contents per candidate: kind · title · source ref (deep link) · deployed SHA/date · origin (*agent-found* / *admin-pointed*) · proposed target (wiki / help / both, agent's suggestion) · actions.

Design chain owns layout, placement, density, empty state, and the "later" affordance. **Not specified here.** HIG per Human Interface v1.0; Echo + UX/Interaction gate.

## 6. Floating admin affordance — "Compile this into Wiki" (WP6)

- Pattern: `HelpLauncher` (Help System v1.0 §3) — mounted once, behind an ErrorBoundary, role-gated.
- Role: **administrator only.** Never rendered for other roles.
- Captures: `surface_key`, `state_key` (if any), route, timestamp, admin identity. **Nothing else** (WP7).
- Submits: one candidate row, origin `admin_pointed`, proposed target chosen by the admin at submit (wiki / help / both), optional one-line note.
- Result: appears in the inbox (§5); admin may compile immediately from the launcher or later from the inbox.
- **Mount point: `AppChrome` — P1 platform chrome, outside the active program.** This is the three-OK item. Until Coach's third OK, the affordance may be specified but the mount packet may not be seeded. Alternative mount (IKI routes only) is a fallback the design chain may propose, but it defeats "follows me around" and is not what Coach asked for.

## 7. Help system interface

- Targeting *help* creates a **draft** `help_articles` row (`status: draft`, `surface_key` from the candidate). Body authored by the compiler as a draft; governed by Help Arch §6 before publish.
- **OD-WP3:** whether the compiler drafts help bodies or only creates the stub for a human. Coach: "something like that" — not ruled.
- Wiki links help articles as a canonical entity (§3 `help_article` kind); the wiki page "compiled-from" list shows the help article as a source.
- Help parity rule (Help Arch §6) now has a mechanism: the deploy that changes a behavior also produces the candidate that updates its article.

## 8. Boundaries / non-goals

- No agent-direct publish (W5 stands).
- No second approval state (WP4).
- No member-visible inbox or affordance.
- No page content in any capture (WP7).
- No change to compile guidelines or Hotel gate (W6).
- No change to the Runner, Factory, or templates beyond consuming the already-ruled help block.
- No write to `AppChrome` without three OKs.

## 9. Acceptance (for Juliet's plan; verifiable)

| AT | Evidence |
|---|---|
| AT-WP1 | Deploy a spec version bump with no directive → candidate appears in inbox with kind `spec`, correct SHA, origin `agent-found`. |
| AT-WP2 | Deploy with explicit directive → no inbox candidate; compiler runs as today; board card appears. |
| AT-WP3 | Register a template with help block → candidate kind `template`; compile → wiki draft contains purpose/why/how/scenarios verbatim from the block. |
| AT-WP4 | Admin dismisses candidate → row marked, not deleted; redeploy same artifact at new version → re-surfaces. |
| AT-WP5 | Floating affordance: renders for administrator; **absent from DOM** for navigator/activator/observer. |
| AT-WP6 | Capture payload on a Journal route contains `surface_key` and route only — **no** journal text, tag names, or trade fields (Mike evidence style, Privacy §11). |
| AT-WP7 | Compile → board `awaiting_approval`; inbox shows candidate as *compiling* and holds no approve/reject control. |
| AT-WP8 | Target *help* → `help_articles` draft row exists with matching `surface_key`; invisible to members. |
| AT-WP9 | Stay-put (W8, WI9) holds on every inbox action. |

## 10. Ideas inventory (nothing omitted)

1. Agent must be proactive; flag new content deployed to production as potential wiki and help entry.
2. Explicit directive → continues as designed.
3. No directive → compiled list of not-explicitly-asked items; ask for approval to enter into help and wiki.
4. Admin interface in IKI Lab for agent/admin interaction.
5. "Maybe this is a panel in the wiki rather than a separate app" — ruled panel.
6. "Compile This into Wiki" as a universal affordance on any part of Labs — "a universal bug that follows me around."
7. Improvement gives the wiki agent more responsibility and the admin an easier way to make sure developments get into the wiki.
8. (Earlier tonight) Template help block: purpose · information→knowledge as data or display · why · how · scenarios; lives in the help system; wiki picks it up and links it.
9. (Earlier tonight) Wiki is agent-curated, always looking for new developments in the repo; spec as intended; gap is that today it only works if told at commit time.

**[advisor] items, held as opinion — Coach may discard:** WP9 append-only; the §3 kind list; deploy-event as Foxtrot's (vs. a git hook); "later" as a third disposition; compiling help bodies (OD-WP3); the fallback IKI-only mount in §6.

## 11. Open decisions

| ID | Question | Owner |
|---|---|---|
| OD-WP1 | What is the "deployed to production" event — a Foxtrot deploy hook emitting SHA, or the registrar polling MiniTwo's checkout HEAD? | Foxtrot / India |
| OD-WP2 | Directive marker syntax (commit trailer, frontmatter key, help-block flag). | Lima / India |
| OD-WP3 | Compiler drafts help article bodies, or creates stubs only. | Coach |
| OD-WP4 | Three-OK on `AppChrome` mount for the floating affordance. | **Coach — OK 1 of 3 requested here.** |
| OD-WP5 | Which §3 kinds ship in the first wave. | Coach / Juliet |
| OD-WP6 | Candidate list home: `corpus_items` with `status: candidate`, or a sibling table. | India |

## 12. Review chain (INSTRUCTIONS §5)

Juliet (owns draft) → India (entity model, checkout write path, OD-WP6) → UX → UI (Echo) → Interaction → Tango (every admin-facing string; inbox copy) → Mike (WP7, agent write authority) → Hotel (compile guidelines unchanged — confirm) → Foxtrot (OD-WP1) → Sierra (only if any candidate kind is public) → Coach → Lima → Juliet seeds → Delta gates.
