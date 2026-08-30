# Redis cache and SSE gateway — which docs spec them

**Status:** Reference map (2026-08-21)  
**Parents:** Arch **28** (Market Bus as-built) · Arch **30** (OPF) · Market Bus Spec v1.0.1  
**Not:** a new transport. This file only **points** at the specs that already bind Redis and the subscribe plane.

They live in **different docs**. “SSE gateway” is **not** the as-built market door.

---

## Pipeline (where these sit)

```text
Massive API
    │  feeds / single-flight miss only
    ▼
Redis generation store  (mb:* + pub/sub)     ← this is the Redis cache
    │
    ▼
OPF L0–L4  (facts → listed chain → package quote)
    │
    ├── as-built member door ──► WS /api/me/market/stream   ← Coach’s “SSE gateway”
    │                              MarketSocket · one socket / tab
    └── thesis only ───────────► SSE gateway (Template Runner TR3)
                                   one-way reader of the same store
```

**Market Bus** moves **facts**. **OPF** is what those facts mean as a **position**. The subscribe door is how the **client** gets the model; templates / sheets run in the browser.

---

## Redis cache (as-built · law)

This is the Market Bus **generation store**: last-value + pub/sub. Keys `mb:*`. Redis is **never** exposed to the browser.

| Doc | What it specs |
|-----|----------------|
| [`Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md`](../Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md) **v1.0.1** | **Normative.** **MB2** shared store; **§1.1** Redis posture reversal (vs Arch 18 MySQL-only marks); **§5** key layout (`mb:sym:*`, `mb:chain:*`, `mb:session:*`, `mb:pub`); **MB9** Redis not public; **MB10 / MB12** fail-loud if Redis is down or config missing. |
| [`Architecture/28-massive-market-bus.md`](./28-massive-market-bus.md) | **As-built topology.** Massive → `chain_feed` / `sym_feed` → Redis → API → one WS/tab + HTTP hydrate. |
| Chain Picker Spec v1.0.2 **OC15** | Older **in-process** cache (bench **H1-2**). Redis **supersedes** that for multi-worker (**MB-P1**). Do not treat both as “OC15 done.” |
| [`Architecture/18-shared-live-marks-stream.md`](./18-shared-live-marks-stream.md) | **MySQL** `market_live_marks` for Curate — **not** the Redis bus. Dual-write / fallback. Product UI mids still use Arch 28 §4.4. |
| OPF Spec v0.2.1 · Arch **30** L0–L1 | OPF **reads** this Redis plane. It does not invent a second live cache. **OPF1:** apps/packs must not call Massive. |

**Code (as-built, not spec):** `server/market_data/market_bus/` · Redis URL from config · `LABS_MARKET_BUS=1`.

---

## “SSE gateway”

Coach’s name for **subscribe to the model, rest in the client**. As-built that door is a **WebSocket**, not SSE.

### As-built subscribe plane (law)

| Doc | What it specs |
|-----|----------------|
| Market Bus Spec **§6** · Arch **28** | Member transport: `WS /api/me/market/stream` · `web/lib/market/MarketSocket.ts` · **one market WebSocket per tab**. |
| OPF Spec v0.2 **OPF3** · Arch **30** | Live chain generations = **WebSocket** (+ HTTP hydrate). **Not SSE** as market transport. |
| Keep-Warm Spec v0.1.2 · **DL-419** | Coach: *“This is why we developed the SSE gateway and subscribe to it with the client, so that we can get what we need from the server and do the rest in the client.”* Seating: that **subscribe plane**; as-built = Market Bus one WS. |
| [`docs/Options-Lab-Subscribe-Then-Price-Audit-v1.0.md`](../docs/Options-Lab-Subscribe-Then-Price-Audit-v1.0.md) · **DL-420** | Same seating. **Do not add a second SSE** for market generations. Analyzer/Builder join the existing socket; do not poll a second Massive path. |

### Thesis SSE gateway (not GO)

A **real SSE process** — thin one-way reader over the **same** Redis / OPF store, for IKI / Template Runner — is **DRAFT / THESIS** only.

| Doc | Status |
|-----|--------|
| [`Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`](../Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md) **TR3** | Coach: *“SSE is a gateway.”* Downstream of Market Bus / OPF; **does not** replace Options Lab WS. AT if it ships: **same generation hash** on both doors. **Not BUILD AUTHORITY.** |
| PDS Spec v0.1 · IKI Lab PDS Spec v0.2 | Origin story: chain-as-sole-input + cached pub/sub + SSE gateway + OPF + templates. Not BUILD. |

**[advisor]** TR3’s SSE door is a **published-copy** gateway (IKI / public / one-way). It is not a second Massive writer and not a second generation store.

### Not the market gateway

| Doc | What it is |
|-----|------------|
| Alerts Manager Spec v1.0 · Arch 28 note · **DL-464** | `GET /api/me/alerts/stream` — member-identity WS **or** SSE. Lawful second socket. **Not** Massive. **Not** precedent for a second **market** socket. |
| Blueprint / copilot chat streams | Process-chat SSE. Unrelated to chain generations. |

MSC `sseBus` / `EventSource` under `strategy-lab-proto/` is **prototype / MSC reference**, not Labs law. Do not import.

---

## Do / do not

| Do | Do not |
|----|--------|
| Spec Redis here: Market Bus Spec §5 + Arch 28 | Treat Arch 18 MySQL marks as the live chain cache |
| Spec the member subscribe door here: Market Bus §6 (WS) | Ship a second market SSE because Coach said “SSE gateway” |
| Keep OPF3: WS for generations | Call Massive from Next.js or per-widget sockets |
| Cite Template Runner TR3 if discussing a **future** IKI SSE door | Assume TR3 is as-built |

---

## Pointers (one hop)

- Market Bus as-built: Arch **28**  
- OPF layers: Arch **30**  
- Redis keys + WS endpoint: Market Bus Spec v1.0.1 §5–§6  
- Coach “SSE gateway” seating: Keep-Warm v0.1.2 · DL-419 · Subscribe-then-price audit v1.0  
- Thesis SSE: Template Runner Spec v0.1 TR3  

**DL-532.**
