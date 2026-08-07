# How Visualize AI works

**Spec:** `Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md` (draft · DL-236)  
**App:** `labs.fattail.ai/app/visualize-ai` — top-level Apps card (sibling of Strategy Lab)  
**Architecture:** `Architecture/21-visualize-ai.md` · Design: `Architecture/22-visualize-ai-design.md`

**Status:** Design/spec only; not shipped as product code yet.

**Future home (DL-249 — intent only):** Visualize AI is **exclusive to Practice**
(`practice.fattail.ai`) as part of the coaching suite — **not** the Labs bot product.
**Today:** still designed/shipped against the single host `labs.fattail.ai`; do not
block current Navigator access based on the future split.

---

## Purpose

Visualize AI lets **paid members** with full Labs access — including **Observer trial** (Navigator parity for a 6-week weekly term), Activator, and Navigator — **ask in plain language** for charts of **options market structure** — SPX, VIX term (~1-day through ~30-day), Greeks, IV, ranges, correlations — and **see real data**, not model-invented numbers.

North star: *“Ask about the options structure I trade around — see it, don’t guess.”*

---

## Core idea (how a turn works)

```text
You type a question
    → AI proposes a ChartPlan (what to plot, not the numbers)
    → Labs runs closed tools (Massive / ChainStore / live marks / correlation)
    → ChartArtifact (series + honesty labels) is rendered
    → Assistant explains in process language, not “edge” talk
```

**Invariant:** The model chooses *what* to chart; **server tools supply every price, Greek, IV, and ρ**. No raw Massive access from the browser.

---

## Who can use it

| Who | Access |
|-----|--------|
| Signed-out | Sign-in wall |
| Free no-plan (no paid membership) | Denied — **not** “Observer” |
| **Observer** (paid trial) | **Full use** — **same privileges as Navigator** for the term |
| Activator / Navigator / admin | Full use |

**Observer product:** weekly subscription, **ends after 6 weeks**; feature access = Navigator (DL-128 / DL-194). Implemented via `feature_role` elevation, not a free plan. Rate limits protect AI/Massive cost. AC target: `app:visualize-ai`.

---

## Workspace UX

**Vertical stack** (not left/right by default):

- **Top (primary):** interactive chart canvas (Plotly) — this is where you **preview** the rendered graph
- **Bottom:** conversation (starter prompts, messages, composer)
- **Honesty strip** above the canvas: proxies (e.g. SPX→SPY, VIX→VIXY), stale data, missing entitlements
- **Chart actions (v1.0):**
  - **Save** — download the chart as a PNG (browser save/download so you choose folder/filename where the OS allows)
  - **Copy** — put the chart image on the system clipboard so you can paste into docs, chat, slides, etc.

Conversation **above** the canvas is an allowed alternate; still vertical. Not a popup and not chat-only preview.

Example prompts: “Show VIX1D vs VIX”, “0DTE SPX put delta by strike”, “SPX range vs VIX1D”, “Correlation SPY vs QQQ”.

---

## What it can chart

| Family | Examples |
|--------|----------|
| Vol term | VIX1D (~1d), optional VIX9D, VIX (~30d) |
| Underlier / range | SPX (or labeled SPY proxy), daily range % |
| Greeks / IV | Delta/gamma/theta/vega by strike, IV smile/heatmap (from chain snapshots) |
| Correlation | Pair or vs-benchmark Pearson of daily returns |
| Marks | Live mid / day OHLC from shared marks stream |

**Tools** are a fixed catalog (universe, live marks, vol series, daily bars/range, corr, chain snapshot, greeks_by_strike, iv_grid, etc.). No free Python/SQL plotting.

**Honesty rules:** missing Massive index entitlement → labeled proxy; missing Greeks → omit/unavailable, no silent BS fill; heavy SPX chains filtered (expiry, moneyness, caps).

---

## AI behavior (member ethos)

Each turn:

1. **Distress gate** (always on)
2. **Member ethos** system prompt (structure literacy, not trade advice)
3. LLM → validated **ChartPlan** JSON
4. Tools run → **ChartArtifact**
5. Assistant summary that cites sources/as_of/proxies

Forbidden: buy/sell recommendations, profit promises, “this is an edge.”

---

## Data & infrastructure it reuses

- Shared live marks + VIX/VIX1D (Strategy Lab stream)
- Massive (bars, option chain snapshots)
- Local **ChainStore** (prefer fresh snap over re-paginating full SPX chains)
- Correlation module (on-demand only — **not** on Curate comparison hot path)

Calls are **user-initiated**, rate-limited, cost-capped.

---

## What it is *not*

- Curriculum tutor (Ask Vexy)
- Admin process co-pilot
- Voice (text first; STT later on same API)
- Server-side chart library (reopen past charts inside Labs) — v1.1; local Save/Copy are v1.0
- Strategy Lab itself (Design → Curate → Deploy stays separate)

---

## One-line summary

**Visualize AI is an ethos-bound chat for Observer trial (Navigator parity), Activator, and Navigator that turns questions about options structure into tool-backed charts (vol, SPX, Greeks/IV, corr) in a vertical chart-above-conversation workspace, with proxy honesty and no invented market numbers.**
