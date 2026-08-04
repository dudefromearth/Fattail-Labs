# Strategy Lab Prototype — Step-by-Step User Guide

**App URL:** http://localhost:8501  
**Life cycle:** **Design → Curation → Deployment**  
**Modes:** **Basic** (default, simple) · **Pro** (extra friction controls + denser metrics)

This guide matches the current Streamlit prototype (`strategy-lab-proto/app.py`).

---

## Precept #1 — No absolute false results

**Never include things that produce absolute false results.**

| Simple (OK) | Lying (never) |
|-------------|----------------|
| Hide friction knobs in Basic | Zero costs / “costs off” backtests |
| Pro edits slippage to match broker | Mid-price fantasy that looks like a real edge |
| Say “daily open proxy” when that’s what we sim | Claim 14:30 fills without minute data |

Friction is **always** applied. Basic only locks defaults; it does not invent free trades.

**ATM / OTM + direction**

| Control | Options |
|---------|---------|
| **1 · ATM / OTM** | **ATM** (Basic only ATM) · **OTM** (Pro) |
| **2 · Direction** (always required) | **Below** · **Above** · **Both** |
| **3 · OTM R2R** (Pro + OTM only) | **Nearest** to target · **Minimum** (e.g. 12+) |

Direction is independent of structure (not butterfly-only).  
Example: 1DTE SPY 3-wide fly, **Both**, closing, OTM, R2R minimum 12 → put and call sides scanned OTM; each side only enters if R2R ≥ 12.

R2R = max profit ÷ debit = (wing − debit) / debit, from session fills.

---

## Before you start

### 1. Start the app (if it is not running)

```bash
cd /Users/ernie/Fattail-Labs/strategy-lab-proto
set -a && source .env && set +a
../server/.venv/bin/streamlit run app.py --server.port 8501
```

Open **http://localhost:8501** and hard-refresh (Cmd+Shift+R) if the page looks stale.

If you ever see `ImportError: cannot import name '…' from 'engine.spec'`, hard-refresh once — the app purges stale `engine.*` modules on each run. If it persists, restart Streamlit (kill the process on port 8501 and re-run the command above).

### 2. Confirm Massive

1. At the top, expand **1 · Check Massive connection**.  
2. Click **Ping Massive now**.  
3. You should see a green success and JSON with `"ok": true`.

If that fails, fix `strategy-lab-proto/.env` (`MASSIVE_API_KEY=...`) and restart Streamlit.

### 3. Pick a mode

| Mode | Use when |
|------|----------|
| **Basic** | Learning the path; **ATM strikes only**; fixed friction defaults |
| **Pro** | **OTM via nearest R2R match**; edit friction; denser metrics |

Same three steps in both modes. Pro does **not** skip honesty gates.

---

## The big picture (one screen)

Scroll the page top to bottom:

```
Board (Design | Curation | Deployment)
    ↓
2 · Design Spec   (rules for the selected strategy)
    ↓
2b · Risk graph   (at expiry + real-time mark; no time path)
    ↓
3 · Run test      (Massive backtest)
    ↓
Results + gate actions
    ↓
Curation / Deployment panels (when the card is in that stage)
```

**Select a strategy** by clicking its name under Design, Curation, or Deployment. The rest of the page edits/tests **that** card.

---

# Path A — Create a new strategy end-to-end

## Step A1 — Create

1. Scroll to **Create another strategy** (under the Board).  
2. Enter a short **Hypothesis** (required later if you rewrite Spec). Example:  
   *“Buy defined-risk 0DTE long condors when the day is established.”*  
3. Choose a **Template**:  
   - Long Condor  
   - **Long Butterfly** (+1/−2/+1 all-call or all-put; Direction picks the right)  
   - Put Debit  
   - Call Debit  
4. Click **Create**.  
5. The new card appears under **Design** and becomes selected (▶).

> First launch also auto-seeds one sample IC so the board is never empty.

---

## Step A2 — Design (write the rules)

With the strategy selected:

1. In **2 · Design Spec**, set:  
   - **Name**  
   - **Hypothesis** (must be non-empty to save)  
   - **Symbol** — lookup + dropdown + chips. **ETFs are the good substitutes for futures** when running options tests (Massive has futures, not options on futures): ES→SPY, NQ→QQQ, CL→USO, GC→GLD (or SPX/XSP/NDX for cash index options).  
   - **Structure**  
   - **Wing width ($)**  
   - **Positions**  
   - **Capital context** (for context only in this prototype)  
   - **Skip FOMC** (recommended on)  
   - Optional: **Only trade small open moves** + max %  
   - **DTE**: **0** or **1** only (same-day or next-session expiry)  
   - **Entry session**: morning (~10:00), afternoon (~14:30), closing (~15:45) ET  
   - **Fill when**: session time, and/or condition (e.g. open-move band)  
   - **Exit**: Hold to expiry **or** take profit as **% of max profit** or **% of risk (debit)**  
2. Check **I will not retune rules mid-campaign**.  
3. Read the blue **plain-English** sentence — if it’s wrong, fix the fields.  
4. Click **Save Spec**.  
5. Scroll to **2b · Risk graph studio** — graphical shape builder with **handles**:

| Control | What it does |
|---------|----------------|
| **Amber handles** on the zero line | **Drag** to resize (outer short wings / body longs) — same idea as MSC |
| **Shift + drag** | Slide the **entire position** strike-by-strike on the price scale (yellow spot stays; tent moves) |
| **Structure / Direction / Wing** | Also editable via controls under the chart |
| **Viewport** | **Sticky** pan/zoom (MSC viewState). **Autofit** only when you click it — not on every drag |
| **What-If** | Time / vol / spot (view only) |
| **Apply shape to Spec** | Commits structure · direction · wing · ATM/OTM · positions to Design |

| Curve | Meaning |
|-------|---------|
| **Blue** | At-expiration payoff |
| **Magenta** | Real-time mark (Theo single IV) |

P&L = mark − cost basis (MSC authority). Cumulative equity is only on **backtest results**.

**Friction (always on in every backtest)**

Friction is **not** Pro-only. Every run applies costs. **Basic** locks defaults; **Pro** only unlocks editing.

| Cost | What it is | Basic (fixed) | Pro |
|------|------------|---------------|-----|
| **Open / close slippage** | $ worse than mid on premium | $0.05 / $0.05 | Editable |
| **Commission** | $ per option contract per side (open & close) | $0.50 | Editable |
| **Fees** | Exchange/reg $ per contract per side | $0.10 | Editable |

Example: iron condor or iron butterfly = **4 legs**. One position, round-turn ≈  
`4 × 2 × (commission + fees)` plus premium slippage in the fill model.  
Defaults are illustrative — use Pro to match your broker.

---

## Step A3 — Test (backtest on Massive)

1. Scroll to **3 · Run test (Massive backtest)**.  
2. Set **Start** / **End** dates (defaults are fine).  
3. Set **Max sessions** low first:  
   - Basic: **10–12**  
   - Pro: **15–20**  
   Each day can call Massive several times; large windows are slow.  
4. Click **▶ Run backtest now**.  
5. Wait for completion (often 30s–2 min for ~12 sessions).

### Read the results

| Metric | Meaning |
|--------|---------|
| **Total P/L** | Sum of simulated trade P/L (after slippage + commission + fees) |
| **Max drawdown** | Worst peak-to-trough on the trade sequence |
| **Win rate** | Share of trades with P/L > 0 |
| **Trades** | Count of days that entered |
| **Holdout** | `ok` / `weaker` / `broken` / `too_few_trades` (last ~30% of trades) |

Read the **Verdict** sentence. Open **Skipped days** if trades = 0 (FOMC, no contracts, API issues, etc.).

### Honest limits of this prototype

- Entry **time** (e.g. 14:30) is a **label**; pricing uses **daily** option open/close, not minute chains.  
- Good for process + API wiring; not institutional fill fidelity.

---

## Step A4 — Gate after the test

Three buttons under **4 · Gate actions**:

### Keep designing

- Stay in Design.  
- Change Spec → **Save Spec** → **Run backtest** again.

### Send to Curation

Moves the card from Design → **Curation** (the book).

Blocked if:

- Holdout is **broken**  
- Too few trades (&lt; 3 in this prototype)  
- **Basic** already has 1 strategy in Curation  
- **Pro** already has 3 in Curation  

### Kill strategy

1. Type a **Kill reason** (required), e.g. *holdout weak* or *not my style*.  
2. Click **Kill strategy**.  
3. Card moves to the **Killed** expander — that is a **process win**, not a failure of nerve.

---

## Step A5 — Curation (the book)

When the selected card’s stage is **curation**:

1. Confirm it shows under the **Curation** column on the Board.  
2. Scroll to **Curation · start campaign**.  
3. Set **Campaign start** and **Campaign end** (end date required in spirit — campaigns end on purpose).  
4. Click **Start paper Deployment**.  
5. Card moves to **Deployment**.

Curation meaning: *this Spec earned a book slot* — not “live money yet” in this prototype (paper campaign only).

**Basic:** focus on **one** curated strategy.  
**Pro:** up to **three** in the book.

---

## Step A6 — Deployment (campaign)

When the card is in **Deployment**:

1. Review the campaign JSON (start / end / paper flag).  
2. (In a full product you would log trades here; this prototype links the *idea* of a campaign.)  
3. When done, write **one process lesson** in the retrospective box.  
4. Click **End campaign → back to Design**.  
5. Card returns to **Design** for the next version; lesson is stored on the card.

**Rule:** do not silently rewrite rules mid-campaign. New idea = new Spec version (re-test in Design, then re-curate).

---

# Path B — Run and test an *existing* strategy

Use this when a card is already on the Board (sample seed, previous create, or after a campaign ends).

## B1 — Select it

1. On the **Board**, click the strategy name under **Design**, **Curation**, or **Deployment**.  
2. The button shows **▶** when it is active.  
3. Everything below edits/tests **that** id (`2 · Design Spec — \`xxxxxxxx\``).

## B2 — If it is in Design

1. Review / edit Spec → **Save Spec**.  
2. **Run backtest now**.  
3. Act on the gate: Keep designing / Curation / Kill.

## B3 — If it is already in Curation

1. Select it under **Curation**.  
2. You do **not** need to re-create it.  
3. Optionally go back: only by killing or (after deploy) ending a campaign into Design.  
4. To re-test rules:  
   - Best practice: treat a material rule change as a **new Design cycle** (clone via **Create** with same hypothesis, or edit only if still in Design).  
   - In this prototype, if you need a fresh test after curation, prefer **Create** a new card so book history stays clear.  
5. When ready: **Start paper Deployment**.

## B4 — Re-test without losing the card (recommended workflow)

| Goal | What to do |
|------|------------|
| Tweak and re-run while still designing | Edit Spec → Save → Run test (same Design card) |
| Test a variation side by side | **Create** a second strategy (new template/hypothesis), run test, compare verdicts |
| Strategy failed holdout | **Kill** with reason; create a cleaner Design |
| Strategy already curated | Start campaign, **or** end campaign later and redesign |
| After a live/paper campaign lesson | End campaign → Design → change Spec → test again → re-curate |

## B5 — Quick “validate what I already trade”

1. **Create** with template closest to what you trade.  
2. Rewrite **Hypothesis** and Spec to match **your real rules** (not the template defaults).  
3. **Save Spec**.  
4. **Run backtest** with an honest window.  
5. Decision:  
   - **Send to Curation** only if holdout is not broken and trade count is usable.  
   - Else **Kill** with a written reason or Keep designing.

---

# Path C — Full cycle checklist (print this)

```
[ ] App running on :8501
[ ] Massive ping OK
[ ] Mode chosen (Basic / Pro)

DESIGN
[ ] Create strategy (or select existing Design card)
[ ] Hypothesis + Spec complete
[ ] Risk shell acknowledgment checked
[ ] Save Spec
[ ] Run backtest (small max sessions first)
[ ] Read P/L, DD, trades, holdout, verdict
[ ] Inspect skipped days if needed
[ ] Decide: Keep designing | Curation | Kill

CURATION
[ ] Card appears under Curation
[ ] Book limit respected (Basic 1 / Pro 3)
[ ] Set campaign dates
[ ] Start paper Deployment

DEPLOYMENT
[ ] Card under Deployment
[ ] Run the window (paper discipline)
[ ] Write one retrospective lesson
[ ] End campaign → Design (next cycle)
```

---

# Troubleshooting

| Symptom | What to do |
|---------|------------|
| Page looks empty / old | Hard-refresh Cmd+Shift+R; confirm Streamlit is on 8501 |
| No strategies | Click **Create** or reload — app auto-seeds one IC if empty |
| Ping fails | Check `.env` key; restart Streamlit from `strategy-lab-proto` with `source .env` |
| Backtest 0 trades | Open **Skipped days**; try SPY, fewer filters, different date range |
| Backtest very slow | Lower **Max sessions** to 8–12 |
| Cannot Send to Curation | Holdout broken, too few trades, or book limit full |
| Cannot Kill | Enter a non-empty kill reason |

---

# What “done” looks like for one cycle

1. **Design:** Spec saved, backtest finished, verdict read.  
2. **Curation:** Survivor sits in the book (not every idea).  
3. **Deployment:** Time-boxed paper campaign with an end date and one written lesson.  
4. **Loop:** Lesson feeds the next Design — most new ideas still die early.

---

*Prototype guide. Not investment advice. Process metrics only — no profit promises.*
