# FatTail Labs — Visualize AI Spec v0.1

**Status:** Draft — Coach intent locked (2026-08-06); pending India · Echo · Tango · Mike · Hotel review → Coach v1.0  
**Type:** Member app / AI-assisted market structure visualization  
**Product path:** `/app/visualize-ai` (today on `labs.fattail.ai`; **future home `practice.fattail.ai` only** — DL-249)  
**Parents:**
- Course Hosting Spec v1.0 (Apps hub)
- North Star Member Ethos Spec v1.2 (member AI ethos + distress)
- Agent Model Interface Spec v1.0 (`complete()` spine; not open member chat)
- Strategy Lab Curate-and-Deploy Surface Spec v1.0 (shared marks, vol ref, correlation)
- Access Control Spec v0.3+ (`app:{slug}` targets)
- Architecture: [21-visualize-ai.md](../Architecture/21-visualize-ai.md), [22-visualize-ai-design.md](../Architecture/22-visualize-ai-design.md), [18-shared-live-marks-stream.md](../Architecture/18-shared-live-marks-stream.md)  
**Decision log:** DL-236 · DL-245 · DL-246 · **DL-249** (Practice-exclusive)  

**Subdomain (future intent · DL-249 — not current cutover):** **Exclusive to Practice**
when the dual-host world ships. Design for Practice home; **until cutover**, implement
on the current unified host without blocking today’s Navigator suite.

---

## 0. Summary

**Visualize AI** is a top-level member **Apps** product on the **Practice** product. The resident AI turns **text** (voice later) into **chart plans**. The **platform** runs a **closed set of deterministic tools** against **Massive** (and the local option **ChainStore**) and renders **honest** series: **SPX**, **VIX term (~1-day through ~30-day)**, **option Greeks / IV**, ranges, correlations, and any other **entitled** Massive data.

| Principle | Rule |
|-----------|------|
| **No invented numbers** | Model never supplies prices, Greeks, IV, or ρ |
| **Tools only** | Closed catalog; no raw Massive passthrough to browser |
| **Proxy honesty** | Index 403 → labeled proxy (SPY/VIXY), never silent |
| **Process literacy** | Structure charts, not profit theater or “edge signals” |
| **Paid member access** | **Observer** (paid 6-week trial) has **Navigator parity** for features; Visualize AI open to Observer trial · Activator · Navigator · admin — **not** free no-plan accounts |

**North star:** “Ask about the options structure I trade around — SPX, vol term, Greeks — see it, don’t guess.”

---

## 1. Problem statement

### 1.1 Today

- Strategy Lab exposes **live marks**, **VIX/VIX1D**, and **on-demand Pearson correlation**, but not a conversational chart builder.
- Offline research (`scripts/vix_vs_daily_range.py`) proves demand for VIX vs range style plots — not a member surface.
- Massive **option chain snapshots** and **ChainStore** exist for Strategy Lab; **Greeks/IV are not a member visualization product**.
- Free-form member chat is intentionally **not** the platform pattern (scoped agents only: journal, etc.).

### 1.2 Requirements (member)

| ID | Requirement |
|----|-------------|
| R1 | Open **Visualize AI** from the Apps hub as a first-class card. |
| R2 | Ask in **plain language** for charts of market/options structure. |
| R3 | See **SPX** (or labeled proxy), **VIX1D + VIX** (and optional mid-tenors), **Greeks/IV** when data exists. |
| R4 | Trust that series come from **server tools**, not model hallucination. |
| R5 | Always see **proxy / stale / entitlement** honesty labels. |
| R6 | **Observer = Navigator parity (Coach / DL-128 / DL-194):** **Observer** is a **paid trial** (weekly, ends after **6 weeks**), not a free plan. During the trial, Observer has **exactly the same access privileges as Navigator**. Visualize AI is available to identities with full Labs tool access via `feature_role`: active **Observer trial**, **Activator**, **Navigator**, **administrator**. **Free no-plan** accounts are **not** Observer and are **denied**. Anonymous denied. Rate limits still bound AI/Massive cost. |
| R7 | No trade recommendations or profit claims in assistant output. |
| R8 | **Save chart to disk** — member can download the current chart as an image (PNG preferred) to a path of their choosing (browser save/download UX). |
| R9 | **Copy chart to clipboard** — member can place the current chart image on the system clipboard for paste into docs, chat, slides, etc. |
| R10 | **Vertical workspace (Coach):** conversation and chart canvas are stacked **vertically** (not side-by-side primary layout). Chart is the primary visual; conversation sits **above or below** the canvas per layout rule §10. |

### 1.3 Non-goals (v0.1 / v1.0)

- Voice I/O (designed API-ready; ship text first).
- Free-form Python/SQL execution or arbitrary code plots.
- Unfiltered Massive HTTP from the client.
- Curriculum Q&A (Ask Vexy / Golf — separate).
- Admin Process Co-pilot reuse as member chat.
- Multi-year full-chain re-fetch on demand (use ChainStore collect-forward).
- Server-side “chart library” gallery (personal cloud library of past charts) — **v1.1**; **not** the same as R8 local save.

---

## 2. Scope

### 2.1 In scope (v1.0 ship target)

- App registration: slug `visualize-ai`, title **Visualize AI**, href `/app/visualize-ai`.
- **Vertical** workspace: conversation stacked with chart canvas (see Design doc §4 / Spec §10).
- Sessions, messages, chart artifacts (Family B, identity-scoped).
- Agent turn: text → `ChartPlan` JSON → tools → `ChartArtifact` → UI.
- Tool catalog §5 (Massive-first).
- Access: **Observer trial (Navigator parity) · Activator · Navigator · admin** (R6); free no-plan denied; AC target `app:visualize-ai`.
- Ethos preamble + distress gate on every turn.
- Characterization tests for access, tools, schema, ethos.
- **Client export of the current chart (Coach):**
  - **Save to disk** — PNG (or equivalent raster) via browser download / “Save as” so the member chooses directory (or browser Downloads policy).
  - **Copy to clipboard** — chart image on the system clipboard for paste elsewhere.
  - Fail loud when clipboard API or export is unavailable (permission denied, insecure context); never silent no-op.

### 2.2 Deferred

| Item | Phase |
|------|--------|
| Server-side saved chart library (list/reopen past artifacts in Labs) | v1.1 |
| Strategy Lab “Open in Visualize AI” deep-link | v1.1 |
| Browser STT → same turn API | v1.2+ |
| New Massive SKUs after plan upgrade | Spec bump + tool add |
| Labeled model (BS) Greeks if Massive omits | Only if Hotel + Spec amend |
| Vector export (SVG) / multi-page PDF | Optional later; PNG is v1.0 floor |

---

## 3. Product placement & access

### 3.1 Hub

| Field | Value |
|-------|--------|
| Slug | `visualize-ai` |
| Title | Visualize AI |
| href | `/app/visualize-ai` |
| status | `soon` during build; `live` at ship |
| sort | After `strategy-lab` in hub `TOP_LEVEL_ORDER` |
| Nesting | **Top-level** Apps card (not under Practice or Strategy Lab) |

**Blurb (draft — Tango polish):**  
“Ask in plain language. Charts from options structure — SPX, VIX term, Greeks, IV — process over P&L theater.”

### 3.2 Access matrix (Coach — Observer ≡ Navigator)

**Product truth (binding):**

| Term | Meaning |
|------|---------|
| **Observer** | **Paid trial** membership (`observer-trial`): **weekly** billing, **terminates after 6 weeks**. **Feature access = Navigator** for the whole term (DL-128, DL-194). |
| **Not Observer** | Free self-serve signup with **no plan** (“free no-plan”) — previews only where product allows; **not** the Observer product. |

| Actor | Result |
|-------|--------|
| Anonymous | Sign-in wall |
| Free no-plan (no paid membership) | **Denied** (soft upgrade path — not “free Observer”) |
| **Observer trial** (active) | **Full use** — same privileges as Navigator (via `feature_role`) |
| Activator | Full use |
| Navigator | Full use |
| Administrator | Full use |
| Policy `app:visualize-ai` | Admin-configurable; default matches **Navigator-level** tool access (includes elevated Observer trial) |
| Saved artifacts (when library ships) | Data-bearing: owner read/export never hard-locked |

**Implementation:** `require_session` + `feature_role` / plan check consistent with other Navigator-parity surfaces (DL-194). Do **not** invent a separate “role = observer cookie means free access” path. Rate-limit turns to protect AI/Massive cost.

### 3.3 Relationship to Strategy Lab

- **Sibling** product: explore/chart vs design→curate→deploy.
- Shared: symbol universe, live marks, vol reference, correlation module, Massive client, ChainStore.
- Must **not** put Visualize tool work on the Curate comparison hot path (DL-231).

---

## 4. Architecture (normative summary)

Full topology: [Architecture/21-visualize-ai.md](../Architecture/21-visualize-ai.md).

```text
Member text
    → POST /api/me/visualize-ai/sessions/{id}/turn
    → distress gate + compose_member_system_prompt(SURFACE_ROLE_VISUALIZE)
    → LLM → ChartPlan (JSON schema only)
    → tool runner (market_data.* · Massive · ChainStore)
    → ChartArtifact (series + grids + honesty)
    → UI (Plotly.js recommended)
```

**Invariant:** The model chooses *what* to plot; code fetches *all* numeric content.

---

## 5. Data plane & tools

### 5.1 Massive entitlement matrix (pre-ship appendix)

Before freezing tool field paths, Alpha/Foxtrot run an **admin probe** (not product) with production `MASSIVE_API_KEY` and record:

| Probe | Purpose | Status values |
|-------|---------|----------------|
| `I:SPX`, `I:XSP` | True index marks | `entitled` \| `proxy` \| `unavailable` |
| `I:VIX`, `I:VIX1D`, optional `I:VIX9D` | Vol tenors ~1d–30d | same |
| Equity/ETF daily aggs | SPY, QQQ, universe | same |
| `/v3/snapshot/options/{underlier}` | Chain + **greeks/IV keys** | document exact JSON paths |
| Other plan SKUs | Coach special data | tool or unavailable |

**Ship rule:** UI and tool responses include `entitlement` and `proxy_note` whenever not pure entitled index data. Appendix lives in Spec §A (filled after probe) and may be mirrored in Arch 21.

### 5.2 First-class series

| Series | Product meaning | Source |
|--------|-----------------|--------|
| **SPX** | Cash index underlier for index options literacy | `I:SPX` or labeled **SPY proxy** |
| **VIX1D** | ~1-day / Daily VIX | Universe + marks / Massive |
| **VIX** | ~30-day IV index | same |
| **VIX9D** (optional) | Mid short-dated tenor if entitled | probe |
| **Greeks** | delta, gamma, theta, vega | Massive chain row fields |
| **IV** | Implied vol per contract | Massive chain row fields |
| **Daily range %** | `(H−L)/C × 100` | Massive OHLC |
| **Correlation ρ** | Pearson daily simple returns | `market_data.correlation` |

### 5.3 VIX “1–30 day” product meaning

| Horizon | Primary series |
|---------|----------------|
| ~1 day | VIX1D |
| ~9 day (if entitled) | VIX9D or nearest |
| ~30 day | VIX |

Missing tenors are **omitted** with honesty notes — no silent interpolation in v1.0 unless Spec amend.

### 5.4 Greeks & IV rules of truth

1. Prefer Massive contract fields on snapshot rows (exact keys locked in §A after inventory).  
2. **Never** let the LLM invent a Greek or IV.  
3. If a contract lacks Greeks: omit point or mark `unavailable` — **no silent BS fill** unless Spec amends with Hotel-approved **labeled model Greeks**.  
4. Chain tools **must** filter (expiry, right, moneyness, max contracts). Unbounded full-SPX all-expiries → fail loud.  
5. Prefer **ChainStore** snap when age &lt; `LABS_VISUALIZE_CHAIN_FRESH_SECONDS` (default proposal: 120); else live Massive with timeout.

### 5.5 Closed tool catalog (v1.0)

| Tool ID | Inputs (summary) | Outputs (summary) |
|---------|------------------|-------------------|
| `universe_list` | — | symbols + roles |
| `live_marks` | symbols[] | mid, day OHLC, prev, change, proxy |
| `vol_reference` | — | VIX, VIX1D (+ optional tenors) |
| `vol_term_structure` | tenors[] optional | available tenor points |
| `vol_index_series` | symbol, days | date[], value[], proxy notes |
| `daily_closes` | symbol, days | date[], close[] |
| `daily_range` | symbol, days | date[], range_pct[] |
| `daily_range_vs_vol` | underlier, vol_index, days | aligned series |
| `correlate_pair` | a, b, days | ρ, n, interpretation |
| `correlate_relative` | symbols[], benchmark, days | list/matrix |
| `chain_snapshot` | underlier, expiry filters | contracts, as_of, source live\|store |
| `greeks_by_strike` | underlier, expiry, right, greek | strike[], values[], iv[] |
| `iv_grid` | underlier, expiries, moneyness | 2d grid |
| `greeks_summary` | filters | aggregates |
| `capability_matrix` | — | entitled \| proxy \| unavailable per capability |

**Optional v1.1:** `member_equity` from trade-log reports-book (process equity only).

### 5.6 Performance & cost

| Rule | Detail |
|------|--------|
| On-demand only | User-initiated turns; no background Massive fan-out per member |
| Isolation from Curate | Must not run on comparison hot path (DL-231) |
| Caps | `days` max (e.g. 756); chain max contracts/pages; tool timeout |
| Cache | Optional short TTL for chain snaps and corr results |
| Rate limit | Align with journal agent AI invocations |

---

## 6. Chart plan & artifact DTOs

### 6.1 Chart types (v1.0)

`multi_line` · `dual_axis` · `scatter` · `histogram` · `correlation_matrix` · `vol_term` · `greeks_by_strike` · `iv_heatmap` · `greeks_profile`

### 6.2 ChartPlan (model output — validated)

```json
{
  "chart_type": "vol_term",
  "title": "string",
  "underlier": "SPX",
  "x": { "kind": "date | strike | tenor", "label": "string" },
  "series": [
    { "id": "vix1d", "label": "VIX1D", "tool": "vol_index_series", "symbol": "VIX1D" }
  ],
  "chain_filter": {
    "expiry": "0dte | weekly | YYYY-MM-DD",
    "right": "call | put | both",
    "greek": "delta | gamma | theta | vega | iv",
    "moneyness_pct": 5
  },
  "window": { "days": 60 },
  "assistant_summary": "short process-literate explanation"
}
```

Invalid plans → user-visible error; no partial invent.

### 6.3 ChartArtifact (server — SoR for render)

| Field | Meaning |
|-------|---------|
| `id` | Artifact id |
| `chart_type` | From plan (after validate) |
| `title` | Display title |
| `series` | Array of `{ id, label, x[], y[], unit? }` or grid payload |
| `honesty` | List of proxy/stale/entitlement strings |
| `as_of` | ISO timestamps of data sources |
| `tools_used` | Tool ids + params (audit) |
| `source` | massive \| chain_store \| live_marks \| composite |

---

## 7. API surface

All under session auth + **Navigator-parity entitlement** (Observer trial elevated via `feature_role`, Activator, Navigator, admin) unless noted (R6).

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/me/visualize-ai/sessions` | Create session |
| `GET` | `/api/me/visualize-ai/sessions` | List sessions |
| `GET` | `/api/me/visualize-ai/sessions/{id}` | Session + messages + latest artifact |
| `POST` | `/api/me/visualize-ai/sessions/{id}/turn` | `{ message }` → `{ reply, chart?, tools_used, ethos_stamp }` |
| `GET` | `/api/me/visualize-ai/capability` | Capability / entitlement matrix |
| `POST` | `/api/me/visualize-ai/tools/{tool_id}` | Optional non-AI tool preview (same gate; rate limited) |
| `POST` | `/api/me/visualize-ai/charts` | Save artifact (v1.1) |
| `GET` | `/api/me/visualize-ai/charts` | Library (v1.1) |
| `DELETE` | `/api/me/visualize-ai/charts/{id}` | Delete (v1.1) |

### 7.1 Turn response shape (normative sketch)

```json
{
  "message": { "id": 1, "role": "assistant", "content": "...", "ethos_stamp": {} },
  "chart": { "...ChartArtifact..." },
  "tools_used": [{ "tool": "greeks_by_strike", "ok": true, "ms": 120 }],
  "errors": []
}
```

---

## 8. Domain model (MySQL)

Migration number: next free after applied set (plan: **090**).

### 8.1 `apps` seed

```sql
INSERT INTO apps (slug, title, blurb, status, sort_order)
SELECT 'visualize-ai', 'Visualize AI',
  'Ask in plain language. Charts from options structure — SPX, VIX term, Greeks — process first.',
  'soon', 50
WHERE NOT EXISTS (SELECT 1 FROM apps WHERE slug = 'visualize-ai');
```

### 8.2 Tables

**`visualize_sessions`**

| Column | Type | Notes |
|--------|------|--------|
| id | BIGINT PK | |
| identity_id | BIGINT | owner |
| title | VARCHAR | optional |
| created_at / updated_at | TIMESTAMP | |

**`visualize_messages`**

| Column | Type | Notes |
|--------|------|--------|
| id | BIGINT PK | |
| session_id | BIGINT FK | |
| role | ENUM/VARCHAR | user \| assistant \| system |
| content | TEXT | |
| ethos_stamp | JSON | nullable |
| created_at | TIMESTAMP | |

**`visualize_artifacts`**

| Column | Type | Notes |
|--------|------|--------|
| id | BIGINT PK | |
| session_id | BIGINT FK | |
| identity_id | BIGINT | denormalized owner |
| chart_plan_json | JSON | validated plan |
| series_json | JSON | ChartArtifact payload |
| honesty_json | JSON | |
| tools_used_json | JSON | |
| created_at | TIMESTAMP | |

Identity isolation: every query scoped by `identity_id` from session (Family B).

If library ships: add `visualize-ai` to **`DATA_BEARING_APPS`**.

---

## 9. AI surface role

### 9.1 Invocation

- `complete(..., agent="visualize_ai")` (registry entry).  
- System prompt = `compose_member_system_prompt(SURFACE_ROLE_VISUALIZE_AI)`.  
- Task id for logs: `visualize_ai_turn`.  
- Distress gate **always** runs in code (independent of ethos MODE).

### 9.2 Surface role constraints (Hotel / Tango)

- Educational **structure literacy** only.  
- No buy/sell recommendations; no profit promises; no “this is an edge.”  
- Prefer vol term, ranges, Greeks smiles, correlations as **context**, not signals.  
- Always mention data source, as_of, and proxy when present.  
- Output register: plain default (vernacular optional later).

### 9.3 Model contract

1. Parse user intent into **ChartPlan** only (schema-constrained).  
2. May request tools by plan; server executes tools (tool-calling loop or plan-then-execute — implementation choice, same invariant).  
3. Assistant natural language **summarizes** tool results; does not replace series.

---

## 10. Frontend contract

Design authority: [Architecture/22-visualize-ai-design.md](../Architecture/22-visualize-ai-design.md).

| Surface | Path |
|---------|------|
| Hub card | `/app` |
| Workspace | `/app/visualize-ai` |
| Components | `web/components/visualize-ai/*` |
| API client | `web/lib/visualizeAiApi.ts` |

### 10.1 Vertical workspace layout (Coach — R10)

**Normative:** primary layout is a **vertical stack**, not a left/right split.

```text
┌─ Apps › Visualize AI ──────── [New session] … ─┐
│ Honesty strip (when needed)                    │
│ ┌─ Chart canvas (primary visual) ────────────┐ │
│ │ title · Save · Copy · Plotly · as_of       │ │
│ └────────────────────────────────────────────┘ │
│ ┌─ Conversation ─────────────────────────────┐ │
│ │ messages · tools chips · starter prompts   │ │
│ │ composer                                   │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

| Rule | Spec |
|------|------|
| Orientation | **Vertical** on all breakpoints (desktop and mobile) |
| Default order | **Chart canvas above**, conversation **below** (chart is the product preview) |
| Alternate order | Conversation **above** canvas is allowed if product testing prefers chat-first; must remain a single vertical stack (not a dual-pane horizontal default) |
| Height split (default) | Canvas ~55–65% of workspace; conversation ~35–45% (scroll independently) |
| Preview | Interactive Plotly **in the canvas** — not only in chat bubbles, not a popup, not a separate browser window |
| Density | One current chart on the canvas; new turn replaces canvas; chat keeps text history |

### 10.2 Chart renderer & export

**Chart renderer:** Plotly.js recommended for multi-axis, scatter, heatmaps (Echo HIG chrome).

**Chart canvas actions (v1.0 — Coach):**

| Control | Behavior |
|---------|----------|
| **Save / Download** | Export current figure as **PNG** (preferred). Use browser download or File System Access `showSaveFilePicker` where supported so the member can pick a directory/filename; otherwise standard download to the browser’s default location with a clear toast. Filename suggestion: `{title-slug}_{YYYYMMDD}.png`. |
| **Copy** | Write chart image to **clipboard** (`image/png` via Clipboard API). Toast on success; fail-loud message if denied or unsupported. |

Implementation notes (non-normative): Plotly `toImage` / `Plotly.downloadImage` or canvas snapshot of the chart container. Client-only — **no** server round-trip required for R8/R9. Server chart library (v1.1) is separate.

**Starter prompts (ship with empty state):**

- Show VIX1D vs VIX — short-dated vs 30-day vol  
- SPX range vs VIX1D daily equivalent this month  
- 0DTE SPX put delta smile for today’s expiry  
- IV by strike for next weekly expiry  
- Correlation SPY vs QQQ last 60 days  

---

## 11. Security & privacy

| Concern | Rule |
|---------|------|
| API keys | Server only (`MASSIVE_API_KEY`); never to browser |
| Family B | Sessions/messages/artifacts per identity |
| AI logs | `ai_invocations`; no cross-member leakage |
| Mike | Rate limits; turn size caps; no open SSRF via tool params |
| Mike | Symbol/underlier allowlist from universe + known vol indices |

---

## 12. Acceptance criteria (v1.0)

1. Apps hub shows **Visualize AI**; **Observer trial / Activator / Navigator / admin** open workspace.  
2. **Vol term:** “Show VIX1D vs VIX” → interactive chart from tools.  
3. **SPX:** “SPX daily range vs VIX1D” → series match server tools; proxy labeled if needed.  
4. **Greeks:** “SPX put delta by strike for today’s expiry” → from Massive/ChainStore fields only.  
5. **IV:** smile or heatmap from chain IV fields.  
6. **Corr:** pair correlation with ρ and honesty.  
7. Anon 401; **free no-plan 403**; **Observer trial 200** (Navigator parity); capability matrix honest.  
8. **Save chart** produces a PNG download the member can place under a chosen path (browser save UX).  
9. **Copy chart** places a PNG (or equivalent image) on the clipboard; paste works into a standard image-accepting target (e.g. local doc or notes app). Fail loud if clipboard blocked.  
10. Workspace is **vertical**: chart canvas and conversation stacked (canvas primary above by default).  
11. Spec + Arch + Design + DL + tests ship with the feature.

---

## 13. Phased delivery

| Phase | Deliverable |
|-------|-------------|
| **A** | Massive entitlement probe · app row · shell page · hub card · access gate |
| **B** | Tools API (vol, range, corr, chain/Greeks/IV) · Plotly canvas without agent · **Save + Copy chart** |
| **C** | Sessions + agent turns · starter prompts · full tests · ethos |
| **D** | Server chart library (reopen past artifacts) · Strategy Lab deep-link |
| **E** | Voice STT · expanded Massive SKUs |

---

## 14. Review gates (before implementation)

| Gate | Owner | Focus |
|------|-------|--------|
| India | Architecture, Family B, product boundary, apps model | |
| Echo | HIG, workspace layout, Plotly chrome | |
| Tango | Capacity-over-dependency, blurb, empty states | |
| Mike | Auth, rate limits, Massive key, tool allowlists | |
| Hotel | Greeks as literacy; no edge/profit framing | |
| Coach | Approve → **v1.0** | |
| Lima | DL + Arch index parity | |

---

## Appendix A — Massive entitlement matrix (to be filled)

| Capability | Massive path / symbol | Result | Notes |
|------------|----------------------|--------|-------|
| SPX index | `I:SPX` | _TBD_ | |
| XSP index | `I:XSP` | _TBD_ | |
| VIX | `I:VIX` | _TBD_ | |
| VIX1D | `I:VIX1D` | _TBD_ | |
| VIX9D | `I:VIX9D` | _TBD_ | optional |
| SPY daily aggs | `SPY` | _TBD_ | |
| Option chain SPX | `/v3/snapshot/options/…` | _TBD_ | |
| Greeks field path | e.g. `greeks.delta` | _TBD_ | lock after sample |
| IV field path | e.g. `implied_volatility` | _TBD_ | lock after sample |

---

## Appendix B — Related documents

| Doc | Role |
|-----|------|
| [Architecture/21-visualize-ai.md](../Architecture/21-visualize-ai.md) | System architecture |
| [Architecture/22-visualize-ai-design.md](../Architecture/22-visualize-ai-design.md) | UX / interaction design |
| [Architecture/18-shared-live-marks-stream.md](../Architecture/18-shared-live-marks-stream.md) | Shared marks + vol ref |
| [Architecture/20-strategy-lab-curate-board-performance.md](../Architecture/20-strategy-lab-curate-board-performance.md) | Never block comparison on corr |
| Ethos Spec v1.2 | Member AI preamble + distress |
| DL-236 | Product decision |

---

## Appendix C — Changelog

| Version | Date | Notes |
|---------|------|--------|
| v0.1 | 2026-08-06 | Coach plan approved; data plane includes Greeks, VIX 1–30d, SPX, entitled Massive |
| v0.1 | 2026-08-07 | **Coach:** R8/R9 — save chart to OS (download/save-as) + copy chart image to clipboard in **v1.0** (client-side); server library stays v1.1 |
| v0.1 | 2026-08-07 | **Coach:** R10 vertical stack (canvas above conversation by default); **R6 Observer** = paid 6-week trial with **Navigator parity** (not free plan); free no-plan denied |
