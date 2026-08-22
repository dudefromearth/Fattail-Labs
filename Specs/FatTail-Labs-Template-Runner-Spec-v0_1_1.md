# FatTail Labs — Template Runner Spec v0.1

**Status:** **DRAFT / THESIS** except **TR-P1 GO** (`agents/go/TR-P1.md` · **DL-533**). Rest of this spec is not BUILD AUTHORITY.  
**Date:** 2026-08-21  
**Current revision:** **v0.1.2** — TR3 corrected per Arch 34 / DL-419 / DL-420: "SSE gateway" = the as-built subscribe plane (`WS /api/me/market/stream`); no second market door. OD-TR2 collapsed, OD-TR8 answered.  
**Type:** Architecture + contract Spec — an **OPF harness** and a **template framework** shared by Options Lab and IKI Lab  
**Short name:** **Runner** (TR)  
**Canonical filename:** `Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`  
**Resolves:** OD-PDS9 (IKI Lab PDS Spec v0.2) — parent Runner spec rather than a Heatmap spec bump  
**Source:** Coach rulings, desktop session 2026-08-21. Advisor structure labeled **[advisor]**.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| `Architecture/00-decision-log.md` | Binding; DL entry proposed in §9 |
| [Arch 34 — Redis cache and SSE gateway](../Architecture/34-redis-cache-and-sse-gateway.md) (DL-532) | **Which doc binds what.** Coach's "SSE gateway" seats on the as-built WS subscribe plane (DL-419); do not add a second market SSE (DL-420) |
| [Market Bus Spec v1.0.1](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1_0.md) · Arch 28 (as-built DL-282–286) | MB1 feed-owned upstream · MB2 Redis generation store + pub/sub · MB5 interest-driven · MB7 snapshot-then-delta |
| [OPF Spec v0.2](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · Arch 30 | The **model** the server updates; packs `pack_id@semver`; "tools wire in by declaring a use case" (Arch 30 §1.4); **Not: SSE as market transport** (see TR3) |
| [Heatmap Templates Spec v0.2](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM6 purity lifts to Runner law (TR5); HM1–HM20 remain binding for heatmap-form templates |
| [IKI Lab PDS Spec v0.2](./FatTail-Labs-IKI-Lab-Public-Data-Service-Spec-v0_2.md) | IKI host: view contract, delivery modes, hierarchy |
| Wiki Interface v0.1 · Member Wiki v0.1 | Wiki as consumer of Runner output (PDS §4a) |
| CLAUDE.md · AGENTS.md · INSTRUCTIONS.md §2 | Sacred invariants; no second store of truth; fail loud |

**Coach Content Law (doctrine §11 · DL-176):** Nothing of Coach's is removed. §7 inventory.

---

## 0. Coach's statement (verbatim in intent)

> What I need is a harness for OPF, and a framework that supports the running of various templates we design. They essentially consume OPF data streams, transform those streams into knowledge and intelligence as modified streams, notifications and/or visualizations.

> The template runs in the client browser.

> All the server does is update the model, the SSE, and a client subscribes to it.

> SSE is a gateway.

> OD-TR1: I think everything is a stream. · OD-TR5: They must abide by the license. · OD-TR4: auth is correct.

## 1. Mission

One **harness** exposing OPF as subscribable streams through a gateway; one **framework** running designed templates in the browser; templates are **stream transforms** whose outputs are modified streams, notifications, and/or visualizations. Two hosts — Options Lab and IKI Lab — mount the same Runner with different sinks. Hierarchy as topology: Information (OPF streams) → templates → Knowledge / Intelligence.

## 2. Laws (TR1–TR12)

| # | Law | Source |
|---|---|---|
| **TR1 — Server updates the model** | The server's only Runner-facing job is to keep the OPF model current (Market Bus feeds → OPF data/pricing plane). No template logic server-side. | Coach |
| **TR2 — Client subscribes** | Templates execute **in the client browser**. The client subscribes to model streams; nothing is pushed to a template it did not subscribe to (MB5 interest law inherited). **Everything the model produces is a stream** (OD-TR1): generations, marks, per-leg IV, greeks, package quotes, session, quality — no curated subset; interest is the only filter. | Coach |
| **TR3 — "SSE gateway" = the subscribe plane** | Coach's term for *subscribe to the model, do the rest in the client* (DL-419). **As-built it is `WS /api/me/market/stream` + `web/lib/market/MarketSocket.ts`, one socket per tab, snapshot-then-delta (MB7).** The Runner subscribes through this door. **No second market transport** (DL-420, OPF3, Arch 30). The wire being WebSocket rather than SSE changes nothing in this spec. Auth = member session (as-built); public IKI clients need a session minted from email + intent (OD-TR4 → OD-TR9). A literal one-way SSE process for anonymous public scale remains **THESIS** and is not required by any law here. | Coach · Arch 34 |
| **TR4 — Template = stream transform** | A template consumes one or more **input streams** and emits any of: **modified streams**, **notifications**, **visualizations**. It declares all three sets. | Coach |
| **TR5 — Purity (HM6 lifted)** | A template is a pure function of its input streams, controls, and version. No hidden state, no fetches, no persistence. Persistence of produced streams is the bus/gateway's job, never the template's. | HM6 → TR |
| **TR6 — Composition under license** | A template's **modified stream** is a first-class stream. Within the same client session any template may subscribe to it. A produced Knowledge/Intelligence stream may be **published back through the gateway** to other clients **only under the terms of its license** (PDS §8); the license, not a runner law, governs re-serving. Published streams become part of the model the server maintains (TR1 holds). Intelligence templates may consume Knowledge streams rather than raw OPF. | Coach OD-TR5 |
| **TR7 — Declared contract** | Every template declares: id, version, **input streams**, **controls**, **output kind** (visual · data · both; static · live), **sinks** (render target · stream topic · notification · exit/action), **honesty declaration**, **audience framing**, **explicit non-claim**. (PDS §4 view contract, items 1–7.) | PDS §4 |
| **TR8 — One registry** | One template registry. Options Lab and IKI Lab are **hosts**, not owners. No host-specific fork of a template; host differences are sink bindings. | PDS §2a consequence · no second store of truth |
| **TR9 — No limitation on purpose** | Any output form (heatmap · chart · graph · data), any use (find a trade · notify · signal an API · pure visual · other). The Runner imposes no purpose. | Coach: "stop trying to put limitations on it" |
| **TR10 — Honesty at the stream** | Every stream carries provenance (source generation, timestamp, `epoch_quality`, staleness). Gaps propagate as gaps (no fill); failure states are first-class stream values the template must render/emit, not swallow. | PDS §5 · OPF elegant-failure doctrine |
| **TR11 — Signals fire on what is** | A notification or API signal fires on a **measurement condition the subscriber chose**, never on a forecast. (Hard line, PDS Part I.) Wording OD-PDS5. | Coach hard line |
| **TR12 — Fail loud** | Missing gateway config, unknown template id/version, undeclared sink, or a template attempting I/O aborts with a named error. No silent defaults. | SI #2 |

## 3. Architecture (as-built + Runner)

```
Massive ──► chain_feed / sym_feed (MB1) ──► Redis mb:* + mb:pub (MB2)
                                                   │
                                                   ▼
                                    OPF L0–L4 — "server updates the model" (TR1)
                                                   │
                                                   ▼
                              WS /api/me/market/stream  ← Coach's "SSE gateway" (as-built)
                              MarketSocket · one socket / tab · snapshot-then-delta
                                                   │
                 ┌──────────────── Template Runner (browser, TR2) ────────────────┐
                 │  subscribe ──► template(s) ──► modified streams (TR6, license) │
                 │                       ├──► visualization (render sink)        │
                 │                       ├──► notification sink                   │
                 │                       └──► exit/action (Analyzer · API signal) │
                 └────────────────────────────────────────────────────────────────┘
     Host: Options Lab (exit → Analyzer)     Host: IKI Lab (sinks → wiki embed · webhook · notify · data)
```

**Nothing new server-side.** Same door for both hosts. Redis never exposed to the browser (MB9). Published Knowledge streams under TR6 ride the same socket as new topic families — a Market Bus Spec amendment (new `mb:*` family + topic), not a new transport (OD-TR10).

## 4. Hosts and sinks

| Host | Mounts | Default sinks | Notes |
|---|---|---|---|
| Options Lab | Runner + existing WS | render · exit → Analyzer | Today's heatmap = one template in the registry |
| IKI Lab | Runner + same WS door | render · wiki embed (PDS §4a) · notification · API signal · data artifact (PDS §8 modes) | Public, email-gated |
| Headless client **[advisor]** | Runner under the existing agent scheduler (VM browser tier) | data artifact · scheduled delivery · unattended signals | For §8 delivery modes that need output when no member is present. Cite, don't reinvent (OD-TR3). |

## 5. Unattended operation **[advisor — Coach to confirm]**

Browser execution + "a standing 24-hour process" reconcile as: the **Factory** runs continuously (producing templates); **templates** run whenever a client (member, public visitor, or headless scheduler client) subscribes. Scheduled / API / contractual deliveries are served from headless-client output. No server runtime is implied.

## 6. Migration from HM v0.2 **[advisor]**

1. Registry: HM v0.2 templates register unchanged as `output kind = visual/heatmap, static-per-generation`. Byte-identical regression against the current heatmap is the first AT. **AS-BUILT TR-P1** (`web/lib/runner/` · evidence `web/lib/runner/__tests__/shell.test.ts` · **DL-533**). Flag `NEXT_PUBLIC_LABS_RUNNER_SHELL` (missing/`0` = current path; `1` = shell). Zero `server/` change. Heatmap template source unchanged.
2. Gateway: **exists** (Arch 28 §4.1). AT: Runner-subscribed `chain` snapshot `content_hash` equals `useOptionChainBus` hash on the same topic.
3. Controls + live + data output: contract additions per TR7 with no change to existing templates.
4. IKI host mount.
5. Composition (TR6) and notification/signal sinks last — they are the first things with consent/contract implications (OD-PDS11).

## 7. Ideas inventory (nothing omitted)

1. Harness for OPF; framework for running designed templates; consume OPF streams → knowledge/intelligence as modified streams, notifications, visualizations.
2. Template runs in the client browser.
3. Server only updates the model; SSE; client subscribes.
4. SSE is a gateway.
5. (Carried from PDS §2a) generalized runner; GEX and all Options Lab visualizations; charts/graphs; static/live; controls; visual and/or data; clicks → notifications / API signals.
6. (Carried from PDS §4a) Runner produces Knowledge and Intelligence; Wiki consumes and links.

**[advisor] items, held as opinion — and one withdrawn:** earlier TR3 "reading A" (a separate SSE process as the IKI door) — **withdrawn v0.1.2**; Arch 34/DL-419 show Coach meant the as-built subscribe plane; TR6 composition; headless client; §5 reconciliation; §6 migration order; the earlier "server-side vs browser" choice I framed as open — Coach closed it.

## 8. Open Coach decisions

| ID | Question |
|---|---|
| OD-TR1 | **CLOSED:** everything is a stream. |
| OD-TR2 | **COLLAPSED** — one door, `WS /api/me/market/stream`, both hosts. |
| OD-TR3 | Headless client = existing agent scheduler? Confirm or name a different mechanism. |
| OD-TR4 | **CLOSED:** email + intent session token. |
| OD-TR5 | **CLOSED:** re-serving is governed by the stream's license, not by a runner law. TR6 restated. Consequence: gateway must carry published Knowledge streams outbound, with license terms attached as stream metadata. |
| OD-TR8 | **ANSWERED** by Arch 28 §4.1 / Arch 34: session-cookie auth; ops `hello·sub·unsub·ping`; server `hello·chain·sym·session·err·pong`; MB7 snapshot-then-delta. |
| OD-TR9 | Public IKI client session: how email + intent mints a session the WS door accepts (Mike). Scope of `market_symbol_universe` interest a public session may hold. |
| OD-TR10 | Market Bus Spec amendment for published Knowledge streams as a new topic family (TR6) — key layout, writer (browser→API publish route), license metadata (OD-TR7). |
| OD-TR7 | License metadata on a published stream: minimum fields (licensor, terms id, permitted modes, attribution, expiry) and where enforced (gateway subscribe-time). |
| OD-TR6 | Which sinks ship at launch per host (cross-ref OD-PDS11). |

## 9. Proposed decision-log entry (paste-ready)

```
## 2026-08-21 — DL-XXX Template Runner thesis (no GO)

**Coach:** One OPF harness + one template framework shared by Options Lab and IKI Lab.
- Server updates the model. "SSE gateway" = as-built subscribe plane WS /api/me/market/stream
  (DL-419); no second market door (DL-420). Client subscribes.
- Templates run in the client browser. Template = stream transform: OPF streams in →
  modified streams, notifications, visualizations out. Pure (HM6 lifted).
- One registry; hosts differ by sinks. No limitation on purpose or output form.
- Signals fire on measurement conditions the subscriber chose, never forecasts.
- Everything the model produces is a stream. Gateway auth = email+intent token.
- Produced Knowledge/Intelligence streams may be re-served through the gateway only
  under their license; the license governs, not a runner law.
Spec: Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md (DRAFT / THESIS). Resolves OD-PDS9.
Closed: OD-TR1, TR4, TR5, TR8; TR2 collapsed. Open: OD-TR3, TR6, TR7, TR9, TR10. No GO. No board.
```
