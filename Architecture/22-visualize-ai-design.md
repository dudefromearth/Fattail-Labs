# Visualize AI — UX & Interaction Design

**Status:** Design locked (pre-implementation) — Spec v0.1 · DL-236 · DL-245 · **DL-246**  
**Spec authority:** [`Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md`](../Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md)  
**System architecture:** [`21-visualize-ai.md`](./21-visualize-ai.md)  
**Owners:** Echo (HIG) · Charlie (implement) · Tango (member psychology) · Hotel (educational framing)

---

## 1. Intent

Members ask about **options market structure** in plain language and **see** SPX, VIX term, Greeks, IV, ranges, and correlations — without P&L theater, without trusting invented numbers.

**Feel:** Calm research bench. Process literacy. Apple-HIG discipline on Labs chrome; interactive Plotly only inside the chart canvas.

---

## 2. Information architecture

```text
/app                          Apps hub
  └── Visualize AI card  →  /app/visualize-ai
         ├── Honesty strip
         ├── Chart canvas (primary — top by default)
         ├── Conversation (below canvas by default)
         └── (v1.1) Library drawer
```

**Not nested** under Practice or Strategy Lab. Breadcrumb:

`Apps › Visualize AI`

Optional later: Strategy Lab chrome link “Visualize…” → same route with query `?underlier=SPX`.

---

## 3. Hub card

| Element | Spec |
|---------|------|
| Title | Visualize AI |
| Blurb | Process-first; mention SPX / VIX / Greeks without “edge” language |
| Status badge | `soon` during build; `live` at ship |
| Open rule | **Observer trial (Navigator parity) · Activator · Navigator · admin** when live; free no-plan denied |
| Order | After Strategy Lab in top-level grid |

**Copy bans (Tango):** profit claims, “winning setups,” “guaranteed,” rank pressure.

---

## 4. Workspace layout (Coach — vertical)

### 4.1 All breakpoints — vertical stack (normative)

**Not** a default left/right split. Conversation and chart are stacked **vertically**.

**Default order (recommended):** canvas **above**, conversation **below** — chart is the product preview.

```text
┌─ Apps › Visualize AI ──────── [New session] [Library v1.1] ─┐
│ ┌─ Honesty strip (proxy / stale / entitlement) ───────────┐ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ Chart canvas (primary · ~55–65% height) ───────────────┐ │
│ │ title · Save · Copy                                     │ │
│ │ Plotly figure · legend · as_of                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─ Conversation (~35–45% height · independent scroll) ────┐ │
│ │ messages · tools_used chips · starter chips             │ │
│ │ ┌ composer ───────────────────────────────────────────┐ │ │
│ │ │ text…                                        Send   │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Alternate order:** conversation **above**, canvas **below** — allowed if product testing prefers chat-first; still a single vertical stack (Spec R10).

### 4.2 Regions

| Region | Role |
|--------|------|
| Honesty strip | Proxy / stale / entitlement notes for the **current** chart |
| Chart canvas | **Live render** — interactive Plotly (not a popup, not chat-only) |
| Conversation | Dialogue, tool chips, starter prompts, composer |

### 4.3 Density

- Prefer one chart per turn (replace canvas on new chart; keep history in chat).  
- Canvas and conversation scroll independently.  
- Composer sticky to the bottom of the conversation pane (or bottom of viewport on short screens).  

---

## 5. Conversation design

### 5.1 Message types

| Role | UI |
|------|-----|
| User | Right-aligned bubble; plain text |
| Assistant | Left-aligned; markdown-lite (bold, lists); no raw JSON |
| System | Rare; access/error only |

### 5.2 After a successful turn

1. Assistant short **structure-literate** summary (2–5 sentences).  
2. **Tools used** chips: e.g. `vol_term_structure`, `greeks_by_strike`.  
3. Chart canvas updates to latest `ChartArtifact`.  
4. Honesty strip merges new notes (dedupe).  

### 5.3 After failure

- Assistant explains what failed in plain language.  
- Canvas unchanged or shows last good chart with “last good” caption.  
- No empty white Plotly with spinner forever — timeout message at tool SLA.

### 5.4 Composer

- Single-line expanding to ~4 lines.  
- Send on ⌘/Ctrl+Enter and button.  
- Disable while turn in flight (spinner on Send).  
- **Voice (later):** mic button left of field → STT inserts text; same Send path.

### 5.5 Starter prompts (empty session)

Chips (not marketing):

1. Show VIX1D vs VIX — short-dated vs 30-day vol  
2. SPX range vs VIX1D this month  
3. 0DTE SPX put delta by strike  
4. IV by strike for next weekly expiry  
5. Correlation SPY vs QQQ (60 days)  

Click → fills composer or auto-sends (prefer auto-send for low friction).

---

## 6. Chart canvas

### 6.1 Library

**Plotly.js** (recommended) for:

- multi_line / dual_axis  
- scatter  
- vol_term (categorical or line)  
- greeks_by_strike  
- iv_heatmap  
- histogram  

Product chrome (headers, buttons, chips) stays Labs HIG tokens — Plotly themed to match background/grid, not default “finance dashboard neon.”

### 6.2 Chart header

| Element | Content |
|---------|---------|
| Title | From artifact |
| Subtitle | Underlier · window · source (massive \| chain_store \| composite) |
| as_of | Human-local time of data |
| **Save** | v1.0 — download/save-as PNG (member picks location via browser UX) |
| **Copy** | v1.0 — chart image to system clipboard for paste elsewhere |

### 6.3 Honesty strip

Always visible when any of:

- Proxy series (SPX→SPY, VIX→VIXY, …)  
- Stale marks / stale chain snap  
- Capability unavailable (e.g. no VIX9D)  
- Partial Greeks (some strikes missing)  

Tone: **informative**, not alarming. Example:

> SPX series uses **SPY proxy** (index feed not entitled). VIX1D from shared marks. Chain snap 47s old.

### 6.4 Empty canvas

Before first chart: quiet illustration or simple guide line —

> Ask for structure — vol term, range vs VIX, Greeks by strike. Numbers come from market data tools, not guesses.

---

## 7. Access & empty states

| State | UI |
|-------|-----|
| Anon | Sign-in CTA (standard Labs) |
| Free no-plan | Soft upgrade — **not** called “Observer”; Observer is paid 6-week trial |
| **Observer trial** / Activator / Navigator / admin | Full workspace (Observer ≡ Navigator features for the term) |
| Entitled, AI offline | Tools-only path if available; else honest “AI unavailable; try again” |
| Massive key missing (ops) | Fail loud for tools that need it; don’t pretend charts |
| Rate limited | Clear “try again later” — no shame framing |

---

## 8. Educational framing (Hotel / Tango)

### Do

- Label charts as **structure** / **context** / **literacy**.  
- Prefer “here is the smile” over “this means buy puts.”  
- Show n, as_of, method (e.g. Pearson daily simple returns).  

### Don’t

- “Edge,” “guaranteed,” “easy money,” win-rate theater.  
- Rank members by chart quality.  
- Imply model opinion is market data.  

Surface role text in Spec §9 is authoritative; UI must not re-introduce banned framing via empty states or chip labels.

---

## 9. Interaction flows

### 9.1 First chart (happy path)

```text
Open /app/visualize-ai
  → create session (or resume latest)
  → empty canvas + starter chips in conversation pane
  → user: “Show VIX1D vs VIX”
  → turn in flight (composer disabled)
  → canvas: vol_term dual series
  → conversation: summary + tool chips
  → honesty: proxies if any
```

### 9.2 Greeks smile

```text
user: “0DTE SPX put delta by strike”
  → tools: chain_snapshot → greeks_by_strike
  → canvas: strike on x, delta on y
  → honesty: chain source + age; missing greeks dropped with note
```

### 9.3 Correlation

```text
user: “Correlation SPY QQQ 60d”
  → correlate_pair
  → canvas: optional scatter of aligned returns + annotation ρ
  → or scalar callout + small scatter (prefer both if data)
```

---

## 10. Component inventory (target)

| Component | Responsibility |
|-----------|----------------|
| `VisualizeAiWorkspace` | Vertical layout, session load, turn orchestration client |
| `VisualizeChatPanel` | Messages, chips, composer |
| `VisualizeStarterPrompts` | Empty chips |
| `VisualizeChartCanvas` | Plotly bind to ChartArtifact |
| `VisualizeChartExport` | v1.0 Save + Copy (PNG download + clipboard) |
| `VisualizeHonestyStrip` | Proxy/stale/capability notes |
| `VisualizeAccessGate` | Anon + free no-plan walls; Observer trial / paid tiers allowed |
| `VisualizeLibrary` | v1.1 server-side saved chart list |

Test ids (Kilo): `visualize-ai-workspace`, `-composer`, `-send`, `-messages`, `-chart`, `-honesty`, `-starter`, `-save`, `-copy`.

---

## 11. Visual tokens

Follow Labs site appearance / HIG tokens:

- Background: app surface  
- Borders: hairline  
- Accent: existing Labs accent for Send / primary  
- Plotly: muted series colors; colorblind-safe pair for VIX1D vs VIX  
- Type: SF-like system stack already in Labs  

No dark “trading terminal” skin unless site appearance theme demands it.

---

## 12. Accessibility

- Composer labeled; focus management after Send.  
- Chart: Plotly modebar keyboard; provide **tabular summary** (collapsible) for key points (ρ, ATM delta, last VIX1D).  
- Honesty strip not color-only (icon + text).  
- Reduced motion: disable Plotly transitions when `prefers-reduced-motion`.  
- Vertical stack: ensure canvas resize handle or min-heights so chart remains usable on short viewports.  

---

## 13. Voice / AI

**Out of MVF.** Visualize AI does not package bots. No auto-summary of “edge.”  
Voice STT later: same composer path.

---

## 14. Success heuristics (Echo / Tango)

1. First useful chart in **&lt; 2 turns** for a starter prompt.  
2. Member never wonders if numbers are “AI guesses.”  
3. Proxy mode is **obvious** within first glance.  
4. Greeks chart does not read as a trade ticket.  
5. Chart is immediately visible without hunting a popup; conversation does not cover it by default.  
6. **Observer trial** member can complete a chart turn with the same access as Navigator.

---

## 15. Out of design scope (v1)

- Multi-chart dashboard tiles  
- Real-time streaming redraw every second  
- Drawing tools / fib overlays  
- Social share of charts  
- Mobile-native app shell  
- Default horizontal dual-pane (rejected — Coach vertical)  

---

## 16. Related

- Spec v0.1 §3.2 (Observer ≡ Navigator), §10.1 (vertical layout), R6/R8/R9/R10  
- Arch 21 topology  
- DL-128 / DL-194 (Observer term + feature_role) · DL-236 · DL-245 · **DL-246**  
