# Visualize AI — System Architecture

**Status:** Design locked (pre-implementation) — Spec v0.1 · DL-236  
**Spec authority:** [`Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md`](../Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md)  
**UX design:** [`22-visualize-ai-design.md`](./22-visualize-ai-design.md)  
**Depends on:** [18-shared-live-marks-stream.md](./18-shared-live-marks-stream.md), [09-strategy-lab-tradier.md](./09-strategy-lab-tradier.md) (Massive data plane), [20-strategy-lab-curate-board-performance.md](./20-strategy-lab-curate-board-performance.md) (corr isolation)

---

## 1. Purpose

Member app that turns **natural-language questions** into **options-market structure charts** using:

- Shared live marks / vol reference (VIX, VIX1D)
- Massive REST (daily bars, option chain snapshots)
- Local **ChainStore** (collect-forward SPX chains)
- Deterministic **correlation** module
- Scoped **member AI** (ethos + distress), **not** free-form general chat

Strategy Lab remains design → curate → deploy. Visualize AI is **explore / educate / chart**.

---

## 2. Topology

```text
┌──────────────── web (Next.js) ────────────────┐
│  /app  hub card                                 │
│  /app/visualize-ai  workspace                   │
│    ChatPanel ──► visualizeAiApi.ts              │
│    ChartCanvas (Plotly) ◄── ChartArtifact JSON  │
└───────────────────────┬─────────────────────────┘
                        │ session cookie
                        ▼
┌──────────────── server (FastAPI) ───────────────┐
│  routes/visualize_ai.py                         │
│    require_session + Navigator-parity gate      │
│    (Observer trial via feature_role · Act/Nav/admin) │
│    app:visualize-ai AC target                   │
│         │                                       │
│         ▼                                       │
│  visualize_ai_agent.py                          │
│    distress · ethos · complete(agent=…)         │
│    ChartPlan validate                           │
│         │                                       │
│         ▼                                       │
│  visualize_ai_tools.py                          │
│    ├── live_marks / vol_reference               │
│    ├── correlation (on-demand)                  │
│    ├── MassiveClient (bars, chain)              │
│    └── ChainStore (prefer fresh snap)           │
│         │                                       │
│         ▼                                       │
│  visualize_ai_domain.py  (sessions/messages/    │
│                           artifacts · Family B) │
└─────────────────────────────────────────────────┘
          │                         │
          ▼                         ▼
   MySQL labs                  Massive API
   visualize_*                 (+ proxies when 403)
   market_live_marks
   market_symbol_universe
```

---

## 3. Core invariant

| Layer | May produce numbers? |
|-------|----------------------|
| LLM | **No** — ChartPlan intent only |
| Tools | **Yes** — sole source of series/Greeks/IV/ρ |
| UI | Renders `ChartArtifact` only |

If a tool fails or a Greek field is missing, the artifact records `unavailable` / error — **never** model fill.

---

## 4. Module map (target)

| Module | Role |
|--------|------|
| `server/routes/visualize_ai.py` | HTTP surface `/api/me/visualize-ai/*` |
| `server/visualize_ai_domain.py` | CRUD sessions, messages, artifacts |
| `server/visualize_ai_agent.py` | Surface role, plan parse, turn orchestration |
| `server/visualize_ai_tools.py` | Closed tool implementations |
| `server/market_data/massive_client.py` | Extend as needed (OHLC, index tickers); fail loud |
| `server/market_data/chain_store.py` | Read latest snap for underlier |
| `server/market_data/correlation.py` | Pair / relative (reuse) |
| `server/market_data/live_marks.py` | Universe + marks + vol ref (reuse) |
| `server/labs_member_ai_ethos.py` | `compose_member_system_prompt` |
| `web/app/app/visualize-ai/page.tsx` | Route shell |
| `web/components/visualize-ai/*` | Workspace UI |
| `web/lib/visualizeAiApi.ts` | Client |

**Do not** import MarketSwarm / MSC code. Massive and Labs stores only.

---

## 5. Data plane

### 5.1 Shared marks (read path)

Reuse the multi-member stream (Arch 18):

- `GET`-equivalent internal: `live_marks` list / vol_reference  
- Visualize **must not** start a per-member Massive poller  
- Stale heartbeat → honesty banner on charts that depend on marks  

### 5.2 Historical bars

- `MassiveClient.fetch_daily_closes` (and OHLC extension for range %)  
- Symbol resolution: product symbol → feed/proxy via universe (same as correlation)  
- Cap `days`; cache optional short TTL  

### 5.3 Option chains & Greeks

```text
User asks for smile / IV heatmap
        │
        ▼
  chain_snapshot(underlier, filters)
        │
        ├─ if ChainStore age < T  → use local snap (source=chain_store)
        └─ else Massive fetch_option_chain (filtered, max_pages)
        │
        ▼
  extract greeks/IV by field map (Spec §A)
        │
        ▼
  greeks_by_strike | iv_grid | greeks_summary
```

Full SPX chains are multi-page (limit 250). Tools **require** filters; refuse unbounded requests.

### 5.4 VIX term structure (~1d–30d)

| Tenor | Series | Required for v1 |
|-------|--------|-----------------|
| ~1d | VIX1D | Yes |
| ~9d | VIX9D if entitled | Optional |
| ~30d | VIX | Yes |

`vol_term_structure` returns only available tenors + honesty for gaps.

### 5.5 SPX

- Product language: **SPX**  
- Series: `I:SPX` when entitled, else **SPY proxy** with flags (Curate parity)  
- Chains: default underlier mapping `SPX` → Massive chain ticker (`I:SPX` or plan-specific)  

### 5.6 Capability matrix

Tool `capability_matrix` (and `GET .../capability`) exposes:

```json
{
  "spx_index": "entitled|proxy|unavailable",
  "vix": "…",
  "vix1d": "…",
  "vix9d": "…",
  "option_chain_greeks": "…",
  "daily_aggs": "…"
}
```

Filled from probe + runtime 403 handling; never hardcode “true index” without evidence.

---

## 6. Isolation from Strategy Lab hot paths

| Rule | Why |
|------|-----|
| Correlation only inside Visualize turn or explicit tool call | DL-231 / Arch 20 |
| No Visualize work inside `GET .../comparison` | Board p95 |
| Chain fetch timeouts + max pages | Cost / tail latency |
| Shared marks read-only from DB | One stream for all members |

---

## 7. Access control

```text
request
  → require_session
  → evaluate app:visualize-ai
       default: feature_role / plan grants Navigator-parity tools
                (active observer-trial elevated · activator · navigator · admin)
       free no-plan → deny (not “Observer”)
  → rate limit turns (AI / Massive cost)
  → 401 anon | 403 free no-plan / policy | 200 entitled
```

**Observer product (DL-128 / DL-194):** paid **6-week** weekly trial; **same privileges as Navigator** for the term via `feature_role`. There is **no free Observer plan**.

When chart library ships: `visualize-ai` ∈ **DATA_BEARING_APPS**.

---

## 8. Persistence

Migration **090** (or next free):

| Table | Contents |
|-------|----------|
| `visualize_sessions` | identity-owned chat sessions |
| `visualize_messages` | user/assistant turns + ethos_stamp |
| `visualize_artifacts` | plan + series + honesty + tools_used |
| `apps` row | `visualize-ai` seed |

All reads/writes filter by `identity_id` of the session owner.

---

## 9. AI runtime

| Piece | Choice |
|-------|--------|
| Entry | `ai.complete` |
| Agent id | `visualize_ai` |
| System | Ethos v1.2 + `SURFACE_ROLE_VISUALIZE_AI` |
| Distress | Code gate always |
| Logging | `ai_invocations` task `visualize_ai_turn` |
| Fixture mode | Tests must run without live LLM (plan fixture) |

Turn orchestration options (both valid if invariant holds):

1. **Plan-then-execute:** one completion → ChartPlan → tools → optional second completion for prose.  
2. **Tool-calling loop:** provider tools mapped 1:1 to closed catalog (still no free HTTP).

---

## 10. Frontend architecture

| Concern | Approach |
|---------|----------|
| Route | Client workspace behind auth probe |
| Layout | **Vertical stack** — canvas above conversation by default (DL-246); not left/right primary |
| State | Session id, messages, current artifact |
| Charts | Plotly.js react component; props = ChartArtifact |
| Export | Save PNG + Copy clipboard (client-only, DL-245) |
| Honesty | Dedicated banner component from `honesty[]` + capability |
| Empty | Starter prompt chips → seed first turn |
| Fail | Inline tool errors; no blank chart without message |

Details: [22-visualize-ai-design.md](./22-visualize-ai-design.md).

---

## 11. Ops & env

| Variable | Role |
|----------|------|
| `MASSIVE_API_KEY` | Bars + chain (fail loud when tools need it) |
| `MASSIVE_API_BASE` | Optional override |
| `LABS_CHAIN_STORE_ROOT` | Chain archive path |
| `MASSIVE_CHAIN_UNDERLIER` | Collector default (`I:SPX`) |
| `LABS_VISUALIZE_CHAIN_FRESH_SECONDS` | Prefer store if younger (proposed default 120) |
| `LABS_MEMBER_AI_ETHOS_MODE` | on/off preamble (distress still on) |
| AI keys | Existing XAI/Anthropic Labs AI config |

Collector remains Strategy Lab ops; Visualize is a **reader** of ChainStore + on-demand Massive.

---

## 12. Testing strategy

| Layer | Evidence |
|-------|----------|
| Access | 401 / 403 / 200 |
| Tools | Fixture chain → greeks series; missing field → unavailable |
| Proxy | Forced 403 path sets proxy notes |
| Agent | Fixture plan → non-empty artifact |
| Ethos | Distress blocked; no profit language in role tests |
| Isolation | No import of comparison path into visualize tools |
| Perf | Caps on days/pages; timeout unit tests |

---

## 13. Implementation phases (architecture view)

| Phase | Arch milestone |
|-------|----------------|
| A | Probe matrix · apps seed · route shell · gate |
| B | Tools module + capability API + canvas without LLM |
| C | Agent turns + persistence + full tests |
| D | Library endpoints + DATA_BEARING |
| E | STT client path; new tools only via Spec bump |

---

## 14. Related decisions

| DL | Topic |
|----|--------|
| DL-236 | Visualize AI product + docs |
| DL-224 | VIX + VIX1D reference |
| DL-223 | Shared universe |
| DL-231 | Correlation never on comparison hot path |
| DL-186 | Massive data; ChainStore collect-forward |
| DL-209–211 | Member AI ethos |

---

## 15. As-built status

**Not implemented** at doc write time. This document is the **target architecture** for Spec v0.1. When Phase C lands, convert status to **AS-BUILT** and list concrete files/migrations with evidence.
