# Wiki — What members and admins see

**Where:** `https://labs.fattail.ai/app/wiki`  
**As-built:** 2026-08-24 · Wiki Spec v0.2.1 · **DL-573** (agent on the whole Labs plane)

This is the experience list — what a person actually sees and can do. It is not the engineering packet list.

Nothing here is a profit claim. The wiki is the compiled map of what we teach. Pages publish only when a human approves them.

---

## Lower-right chrome (every Labs page)

```
                    lower right of the page
         ┌──────────────┐   ┌────────┐
         │ Wiki agent   │   │ Help   │
         │ (admin only) │   │ (members) │
         └──────────────┘   └────────┘
```

| Control | Who sees it | Look |
|---|---|---|
| **Wiki agent** | Administrators only | Zinc pill, sentence-case “Wiki agent”, immediately **left of Help** |
| **Help** | Signed-in members (not `/admin`) | Emerald pill, rightmost |

Members never see the Wiki agent — not on Wiki, not on Options Lab, not anywhere. Unauthenticated visitors see neither pill until they sign in (then Help only, unless they are an administrator).

On `/admin/*`, Help is hidden. The Wiki agent stays, still lower-right.

---

## Members and the public

### Find the Wiki

1. Open **Apps**.
2. Open **IKI Lab**.
3. You are on **Wiki** (`/app/wiki`), with the suite pills **Wiki · IKI Factory · Runner**.

Search is first. The home has a search field, **Start here** (pinned pages), and recent pages.

### Read

| Surface | What you get |
|---|---|
| Article | `/app/wiki/{slug}` — title, body, wikilinks into other pages |
| Search | `/app/wiki/search?q=` — page hits with snippets |
| Graph | `/app/wiki/graph` — map of pages and links (list fallback if the graph is large) |
| ⌘K / Ctrl+K | Quick switcher on Wiki routes — jump to a page by title |

**Published pages are readable without signing in.** Drafts are not: unauthenticated and non-admin requests 404. Search engines get published slugs only.

The article rail does **not** yet fill **Related** or **In your practice**. Empty sections stay hidden. That is as-built, not a broken page.

### Help (unchanged)

The emerald **Help** pill is the member concierge — ask a question, attach a screenshot on a bug, talk to a human if the assistant cannot help. It is not the Wiki agent and it does not write wiki pages.

---

## Administrators

The Wiki agent is standing presence: it rides with you on the **entire FatTail app plane** (Apps, Wiki, Options Lab, Trade Log, courses, `/admin`, and the rest of AppChrome), not only inside IKI Lab.

### Open the agent

1. Look lower-right, **left of Help**.
2. Click **Wiki agent**.
3. The message window stays put. Close it with **×**; the pill returns.

The window knows the **surface** and **route** you are on (for example Heatmap → `options-lab` / `/app/options-lab/heatmap`). That context becomes the page if you draft from a session. Unregistered screens are still valid — route-only, less rich.

### What you can do in the window

| Action | What happens |
|---|---|
| **Hand off** | Paste a **finished, publishable** page and one line of intent. Delivery point — nothing is held in the window. Server infers the rest. Thin or profit-claim copy does not become a page. |
| **Open session** | Start a multi-turn session. The agent cites the calling context first. |
| **Send** | Add a turn. Proposals stay in the window. They execute nothing until you act. |
| **Draft to board** | Writes a git draft (`status: draft`) and a board card **awaiting_approval**. Copy: “Draft on the board — you still approve.” Never “Published.” |
| **Seal session** | Freezes the transcript. Follow-on work is a new session that can point at the sealed one. |
| **Drain queued revisions** | Pulls the next linkage-queue items onto the board. You still approve. |

Nothing auto-publishes. You (or another admin) flip `status: published` on the board / in git. Members see it after the wiki host pulls and reindexes.

### Drafts vs published (admin read)

Administrators can still open draft slugs. Members and the public cannot. That is the only extra on the read path.

### What you will not see

- A second Wiki orb on Wiki routes (the old lower-left IKI-only pill is gone).
- The Wiki agent cloning Help’s emerald look.
- The agent for a member or signed-out visitor (the node is not in the DOM).
- A form of schema fields on handoff — artifact + intent only.
- Factory or Help “pushing” wiki pages. Wiki polls published courses and help guides; new map pages appear only after compose + your approval.

---

## What is not a person-facing feature

These shipped in the same program. People do not operate them:

- Help catalog `GET /api/help/guides` (Wiki polls it; Help’s own UI is still the emerald concierge).
- Course catalog poll, content hashes, watermarks, 15-minute tick.
- Source-contract ledger rows.

You experience those only as **new or updated wiki pages after you approve a draft**.

---

## User guides (Help system)

- Members: `docs/Wiki-User-Guide.md` · concierge `server/help_reference/wiki.md`
- Administrators: `docs/Wiki-Agent-User-Guide.md` · concierge `server/help_reference/wiki-agent.md`

## Spec / architecture

- Spec of record: `Specs/FatTail-Labs-Wiki-Spec-v0_2_1.md` (I.1 standing presence, III.3 floating agent, III.2 public read)
- As-built: `Architecture/11-wiki-design.md`
- Decision: **DL-573** (plane-wide mount, left of Help)
