# Strategy Lab — Curate Run Environment  
### User guide (v1.1)

**Audience:** Members using **Curate** to prove a process with sim capital  
**Status:** Shipped · terminology Bot/Strategy/Position · board stability DL-231 · nav DL-232  
**Not this guide:** Full Design pack designer details, Deploy/Tradier live, journal/habits  

### Terminology (read this first)

| Term | Meaning |
|------|---------|
| **Bot** | The thing you design and run (dashboard cards). Correct name for “items running in Curate.” |
| **Strategy** | An **attribute of the bot** — pack / methodology type (e.g. butterfly), not the bot itself |
| **Position** | An **instance of the bot** — one open or closed package the bot created |

### Suite navigation

Top bar: **Design · Curate · Deploy · Archive** only.  

**Symbols** is under **Design** (sub-nav: Board | Symbols) — assign underlyings for back test /  
forward walk, and browse the shared universe. **Curate** re-selects a symbol when you start a  
sim run. **Deploy** has no symbol step (only curated bots).

---

## 1. What Curate is (and is not)

| Curate **is** | Curate is **not** |
|---------------|-------------------|
| A **run environment** for process automation | Your broker account |
| **Sim capital** + **simulated broker** | Tradier paper or live |
| **Shared live marks** (Massive stream → DB) | Per-member market sockets |
| Scan + manage loops with a **decision log** | Guaranteed P&L or edge proof |
| Safe multi-member practice / multi-bot compare | Deploy (orders to Tradier) |

**Doctrine:** process over profit theater. Curate answers: *Does my envelope + open/close logic behave honestly under a clock?* — not *How much would I have made?*

**Fill model id:** `mark_mid_v1` (always labeled in API and UI).

---

## 2. How to use it (UI)

### 2.1 Prerequisites

1. Sign in to FatTail Labs.  
2. Open **Apps → Strategy Lab**.  
3. In **Design**, create/configure a bot (pack designer). Assign a **symbol** (underlying).  
4. Move/promote the bot into the **Curate** bin (phase `curation`).

### 2.1a Multi-bot exercise seed (optional)

To populate Curate with a diverse case book (winners, losers, paused, envelope blocks, etc.):

```bash
cd server && set -a && source ../.env && set +a
.venv/bin/python seed_curate_demo.py --email you@example.com --replace --diversify-all
```

Then open **Strategy Lab → Curate** as that email.

### 2.2 Curate dashboard

1. Open suite **Curate**.  
2. The **run board** shows bot runs (grid or table): equity≈, vs alloc, open risk, **Runtime** (since last Arm), mini equity path.  
3. **Filter / sort** as needed. When filtered, the badge shows **shown/total** (e.g. `4/22`) and amber **Filter on**.  
4. Large boards are **paginated** (12 runs per page) so the browser stays stable.  
5. **Advance all Curate bots** runs one tick for every armed/running instance.  
6. Live marks strip shows the shared stream; VIX / Daily VIX for regime context.

### 2.3 Open a Curate run (work area)

1. Select a bot in the **Curate** column (or Design path then promote).  
2. In the work area: **Run this bot in Curate**.  
3. **Select symbol** for this sim run (may match Design underlying).  
4. Set **Allocation $** and **Risk / open $**.  
5. Click **Run in Curate** → then **Arm** → **Advance (one tick)** or use dashboard tick-all.

| Control | Meaning |
|---------|---------|
| **Arm** | Instance may run ticks; **resets Runtime** clock |
| **Advance (one tick)** | Manage open positions first, then scan for new risk |
| **Pause** | Stop further ticks until re-armed |

First successful tick promotes `armed` → `running`.

### 2.4 What you should look at

| Surface | Meaning |
|---------|---------|
| **Status** | `draft` → `armed` → `running` (or `paused` / `halted`) |
| **Runtime** | Time since last Arm (start/restart) |
| **Cash / Realized** | Sim book capital |
| **Open positions** | Packages still open |
| **Decision log** | Gates, opens, closes (process truth) |
| **Correlation calculator** | Optional (Design → Symbols or Curate footer) — **not** required for board load |

---

## 3. Under the covers — architecture (member-facing)

```text
  Shared Massive stream  →  market_live_marks (one table, all members)
           │
           ▼
  Curate tick (manage → scan) per bot instance
           │
           ├─ sim broker fills (mark_mid_v1)
           ├─ decision_log
           └─ comparison API (fast book metrics for the board)
```

**Board load is intentionally lean:** comparison does **not** re-fetch correlation from Massive  
on every poll. Use the calculator when you need ρ between symbols.

**Family B:** every instance and position is scoped to your identity.

---

## 4. Ops notes (operators)

```bash
# Shared marks poller
cd server && set -a && source ../.env && set +a
.venv/bin/python -m market_data.live_stream --interval 5

# Migrations (includes run_started_at)
.venv/bin/python migrate.py
```

Performance contract: `Architecture/20-strategy-lab-curate-board-performance.md`.

---

## 5. Document control

| Ver | Date | Note |
|-----|------|------|
| 1.0 | 2026-08-06 | Initial Curate operator guide |
| **1.1** | **2026-08-06** | Suite nav Design/Curate/Deploy/Archive; Symbols under Design; board filter/runtime/pagination; lean comparison |
