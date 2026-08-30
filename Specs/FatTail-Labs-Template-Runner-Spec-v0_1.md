# FatTail Labs — Template Runner Spec v0.1

**Status:** **DRAFT / THESIS** except **TR-P1 GO** (`agents/go/TR-P1.md` · **DL-533**). Rest of this spec is not BUILD AUTHORITY.  
**Date:** 2026-08-21  
**Current revision:** **v0.1**  
**Type:** Architecture + contract Spec — an **OPF harness** and a **template framework** shared by Options Lab and IKI Lab  
**Short name:** **Runner** (TR)  
**Canonical filename:** `Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md`  
**Resolves:** OD-PDS9 (IKI Lab PDS Spec v0.2) — parent Runner spec rather than a Heatmap spec bump  
**Source:** Coach rulings, desktop session 2026-08-21. Advisor structure labeled **[advisor]**.

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| `Architecture/00-decision-log.md` | Binding; DL entry proposed in §9 |
| [Market Bus Spec v1.0.1](./FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1_0.md) · Arch 28 (as-built DL-282–286) | MB1 feed-owned upstream · MB2 Redis generation store + pub/sub · MB5 interest-driven · MB7 snapshot-then-delta |
| [OPF Spec v0.2](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) · Arch 30 | The **model** the server updates; packs `pack_id@semver`; "tools wire in by declaring a use case" (Arch 30 §1.4); **Not: SSE as market transport** (see TR3) |
| [Heatmap Templates Spec v0.2.1](./FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md) | HM6 purity lifts to Runner law (TR5); HM1–HM21 remain binding for heatmap-form templates. **HM21** is inspector tab-session prefs, not the TR14 book. |
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

## 1. Mission

One **harness** exposing OPF as subscribable streams through a gateway; one **framework** running designed templates in the browser; templates are **stream transforms** whose outputs are modified streams, notifications, and/or visualizations. Two hosts — Options Lab and IKI Lab — mount the same Runner with different sinks. Hierarchy as topology: Information (OPF streams) → templates → Knowledge / Intelligence.

## 2. Laws (TR1–TR12)

| # | Law | Source |
|---|---|---|
| **TR1 — Server updates the model** | The server's only Runner-facing job is to keep the OPF model current (Market Bus feeds → OPF data/pricing plane). No template logic server-side. | Coach |
| **TR2 — Client subscribes** | Templates execute **in the client browser**. The client subscribes to model streams; nothing is pushed to a template it did not subscribe to (MB5 interest law inherited). | Coach |
| **TR3 — SSE is a gateway** | SSE is a **boundary component**, not a transport law. It is the one-way door through which Runner clients receive model updates. It sits **downstream of** the Market Bus / OPF plane and therefore does not contradict Arch 30 "Not: SSE as market transport" — the gateway is not the market plane. **[advisor]** Options Lab's existing WS path (`/api/me/market/stream`) is unaffected; whether Options Lab's Runner mount also moves to the gateway is OD-TR2. | Coach / [advisor] boundary reading |
| **TR4 — Template = stream transform** | A template consumes one or more **input streams** and emits any of: **modified streams**, **notifications**, **visualizations**. It declares all three sets. | Coach |
| **TR5 — Purity (HM6 lifted)** | A template is a pure function of its input streams, controls, and version. No hidden state, no fetches, no persistence. Persistence of produced streams is the bus/gateway's job, never the template's. | HM6 → TR |
| **TR6 — Composition** | A template's **modified stream** is a first-class stream another template may subscribe to **within the same client session**. Intelligence templates may consume Knowledge streams rather than raw OPF. | [advisor] from TR4 |
| **TR7 — Declared contract** | Every template declares: id, version, **input streams**, **controls**, **output kind** (visual · data · both; static · live), **sinks** (render target · stream topic · notification · exit/action), **honesty declaration**, **audience framing**, **explicit non-claim**. (PDS §4 view contract, items 1–7.) | PDS §4 |
| **TR8 — One registry** | One template registry. Options Lab and IKI Lab are **hosts**, not owners. No host-specific fork of a template; host differences are sink bindings. | PDS §2a consequence · no second store of truth |
| **TR9 — No limitation on purpose** | Any output form (heatmap · chart · graph · data), any use (find a trade · notify · signal an API · pure visual · other). The Runner imposes no purpose. | Coach: "stop trying to put limitations on it" |
| **TR10 — Honesty at the stream** | Every stream carries provenance (source generation, timestamp, `epoch_quality`, staleness). Gaps propagate as gaps (no fill); failure states are first-class stream values the template must render/emit, not swallow. | PDS §5 · OPF elegant-failure doctrine |
| **TR11 — Signals fire on what is** | A notification or API signal fires on a **measurement condition the subscriber chose**, never on a forecast. (Hard line, PDS Part I.) Wording OD-PDS5. | Coach hard line |
| **TR12 — Fail loud** | Missing gateway config, unknown template id/version, undeclared sink, or a template attempting I/O aborts with a named error. No silent defaults. | SI #2 |
| **TR14 — Stream book** | The runner may retain recent **input streams** it already subscribed to, **on the client**, under a **member-expressed byte budget**. Templates remain pure (TR5) and do not read the book. Default display is Live (current generation). Average and Scrubber are explicit host views that select stored streams, then `run()`. Same `content_hash` does not add a slot. Gaps stay gaps. One book per tab, shared by every registered template (TR8). **TR13** (IKI-P3 host chrome) is a different law and is not this book. **HM21** is a different law: inspector control *choices* (including the cache-budget detent / Instant Replay **playback-time** stop) live in `sessionStorage` `ft_labs_heatmap_session`; the book itself is RAM generations and is never written into that blob. Closing the tab drops both. **Instant Replay** ([TMI Spec v0.1](./FatTail-Labs-Options-Lab-Time-Machine-Instant-Replay-Spec-v0_1.md)) is the named Scrubber: member story is **playback time**; sample interval is host write policy; internal ceiling remains 32 MiB. | Coach GO **DL-574** · HM21 **DL-575** · Instant Replay **DL-594** · plan TRSB v1.0.4 |

## 3. Architecture (boundary sketch)

```
Massive ──► feed processes (MB1) ──► Redis generations + pub/sub (MB2)
                                            │
                                            ▼
                                  OPF data + pricing plane   ◄── "server updates the model" (TR1)
                                            │
                          ┌─────────────────┴───────────────────┐
                          ▼                                     ▼
              WS /api/me/market/stream                 **SSE gateway** (TR3)
              (Options Lab, as-built, MB7)             one-way · downstream · published copy
                          │                                     │
                          ▼                                     ▼
                 ┌──────────────── Template Runner (browser, TR2) ────────────────┐
                 │  subscribe ──► template(s) ──► modified streams (TR6)          │
                 │                       ├──► visualization (render sink)        │
                 │                       ├──► notification sink                   │
                 │                       └──► exit/action (Analyzer · API signal) │
                 └────────────────────────────────────────────────────────────────┘
     Host: Options Lab (exit → Analyzer)         Host: IKI Lab (sinks → wiki embed · webhook · notify · data)
```

**[advisor]** Nothing new is invented server-side except the SSE gateway itself (a thin one-way reader over the existing store). No server-side template runtime. No second transport for the governed plane.

## 4. Hosts and sinks

| Host | Mounts | Default sinks | Notes |
|---|---|---|---|
| Options Lab | Runner + existing WS | render · exit → Analyzer | Today's heatmap = one template in the registry |
| IKI Lab | Runner + SSE gateway | render · wiki embed (PDS §4a) · notification · API signal · data artifact (PDS §8 modes) | Public, email-gated |
| Headless client **[advisor]** | Runner under the existing agent scheduler (VM browser tier) | data artifact · scheduled delivery · unattended signals | For §8 delivery modes that need output when no member is present. Cite, don't reinvent (OD-TR3). |

## 5. Unattended operation **[advisor — Coach to confirm]**

Browser execution + "a standing 24-hour process" reconcile as: the **Factory** runs continuously (producing templates); **templates** run whenever a client (member, public visitor, or headless scheduler client) subscribes. Scheduled / API / contractual deliveries are served from headless-client output. No server runtime is implied.

## 6. Migration from HM v0.2 **[advisor]**

1. Registry: HM v0.2 templates register unchanged as `output kind = visual/heatmap, static-per-generation`. Byte-identical regression against the current heatmap is the first AT. **AS-BUILT TR-P1** (`web/lib/runner/` · evidence `web/lib/runner/__tests__/shell.test.ts` · **DL-533**). Flag `NEXT_PUBLIC_LABS_RUNNER_SHELL` (missing/`0` = current path; `1` = shell). Zero `server/` change. Heatmap template source unchanged.
2. Gateway: stand up SSE gateway reading the same generations the WS path serves; AT: same generation hash on both doors.
3. Controls + live + data output: contract additions per TR7 with no change to existing templates. **AS-BUILT TR-P2 (controls + live)** · **TR-P3 (TR8 one path at flag 1)** — `HeatmapChainPanel` off the shell host · **DL-534** · **DL-536**. Data output remains THESIS. Heatmap Templates Spec v0.2 **unchanged**. The TR-P2 selector/unmount interest drop is resolved in TR-P3.
4. IKI host mount.
5. Composition (TR6) and notification/signal sinks last — they are the first things with consent/contract implications (OD-PDS11).

## 7. Ideas inventory (nothing omitted)

1. Harness for OPF; framework for running designed templates; consume OPF streams → knowledge/intelligence as modified streams, notifications, visualizations.
2. Template runs in the client browser.
3. Server only updates the model; SSE; client subscribes.
4. SSE is a gateway.
5. (Carried from PDS §2a) generalized runner; GEX and all Options Lab visualizations; charts/graphs; static/live; controls; visual and/or data; clicks → notifications / API signals.
6. (Carried from PDS §4a) Runner produces Knowledge and Intelligence; Wiki consumes and links.

**[advisor] items, held as opinion:** TR3 boundary reading of Arch 30; TR6 composition; headless client; §5 reconciliation; §6 migration order; the earlier "server-side vs browser" choice I framed as open — Coach closed it.

## 8. Open Coach decisions

| ID | Question |
|---|---|
| OD-TR1 | Stream vocabulary: which OPF outputs are gateway streams at v1 (chain generations · marks · per-leg IV · greeks · package quotes · session/quality)? |
| OD-TR2 | Does Options Lab's Runner mount stay on WS, or also move behind the SSE gateway? (Arch 30 posture untouched either way.) |
| OD-TR3 | Headless client = existing agent scheduler? Confirm or name a different mechanism. |
| OD-TR4 | **WITHDRAWN as IKI auth (DL-540).** Email + structured intent is a **platform auth gate (DL-543)**, not an IKI mint. IKI consumes the shared `/app/*` guard. |
| OD-TR5 | Composition scope: same-session only (TR6 as written), or may a published Knowledge stream be re-served through the gateway to other clients? (This is the point at which server state appears — flagged, not recommended.) |
| OD-TR6 | Which sinks ship at launch per host (cross-ref OD-PDS11). |

## 9. Proposed decision-log entry (paste-ready)

```
## 2026-08-21 — DL-XXX Template Runner thesis (no GO)

**Coach:** One OPF harness + one template framework shared by Options Lab and IKI Lab.
- Server updates the model. SSE is a gateway (boundary, not transport law; downstream
  of the bus — Arch 30 "Not SSE as market transport" stands). Client subscribes.
- Templates run in the client browser. Template = stream transform: OPF streams in →
  modified streams, notifications, visualizations out. Pure (HM6 lifted).
- One registry; hosts differ by sinks. No limitation on purpose or output form.
- Signals fire on measurement conditions the subscriber chose, never forecasts.
Spec: Specs/FatTail-Labs-Template-Runner-Spec-v0_1.md (DRAFT / THESIS). Resolves OD-PDS9.
Open: OD-TR1–6. No GO. No board.
```
