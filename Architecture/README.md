# Architecture — FatTail Labs

As-built architecture and design documentation for the FatTail Labs platform
(`labs.fattail.ai`). These documents describe **the system as implemented**, not a
wishlist. Feature contracts remain in `Specs/`; binding decisions remain in
`00-decision-log.md`.

| Document | Contents |
|---|---|
| [00-decision-log.md](./00-decision-log.md) | Append-only decisions (canonical) |
| [01-system-overview.md](./01-system-overview.md) | Product purpose, topology, major layers, boundaries |
| [02-backend-design.md](./02-backend-design.md) | FastAPI service, modules, API surface, AI runtime |
| [03-frontend-design.md](./03-frontend-design.md) | Next.js app structure, rendering modes, admin UX |
| [04-domain-data-model.md](./04-domain-data-model.md) | MySQL domain, migrations map, key relationships |
| [05-security-and-access.md](./05-security-and-access.md) | Identity, roles, sessions, media, commerce boundaries |
| [06-operations-and-verification.md](./06-operations-and-verification.md) | Env, deploy, tests, evidence culture |
| [07-audit-snapshot-2026-07-23.md](./07-audit-snapshot-2026-07-23.md) | Retroactive code/docs audit findings |
| [08-canonical-course-model.md](./08-canonical-course-model.md) | Portable Course graph: export/import/validate architecture |
| [09-canonical-course-design.md](./09-canonical-course-design.md) | Admin UX design for packages |
| [10-resources-design.md](./10-resources-design.md) | Resources: first-class versioned library |
| [11-wiki-design.md](./11-wiki-design.md) | Member Wiki: lab-wiki checkout → derived index → /app/wiki |
| [12-retrospective-report-dto.md](./12-retrospective-report-dto.md) | Retrospective workspace DTO (gather/report/comparison) — as-built v0.6 |
| [13-habit-catalog-design.md](./13-habit-catalog-design.md) | Habit Catalog methodology layer — **design locked**, pre-Spec |
| [09-strategy-lab-tradier.md](./09-strategy-lab-tradier.md) | Strategy Lab data/exec split (Massive / Tradier) + shared Curate marks |
| [14-strategy-lab-execution-responsibility.md](./14-strategy-lab-execution-responsibility.md) | OA-class host + user/broker custody (v1.1) |
| [15-trade-log-manual-management.md](./15-trade-log-manual-management.md) | Trade Log manual entry/close/trash design (as-built) |
| [16-strategy-lab-vs-option-alpha-positioning.md](./16-strategy-lab-vs-option-alpha-positioning.md) | Same service type, opposite doctrine (DL-217) |
| [17-strategy-lab-growth-playbook.md](./17-strategy-lab-growth-playbook.md) | Design+Curate all → Deploy Coach → provision |
| [18-shared-live-marks-stream.md](./18-shared-live-marks-stream.md) | Shared symbol universe + live stream + correlation (MySQL marks / Curate) |
| [28-massive-market-bus.md](./28-massive-market-bus.md) | **Market Bus:** Massive → feeds → Redis → one WS/tab → shared client (Options Lab, scale) |
| [29-options-lab-heatmap-templates.md](./29-options-lab-heatmap-templates.md) | **Options Lab Heatmap:** chain template framework (flies, verticals, GEX) over one live model |
| [30-options-pricing-foundation.md](./30-options-pricing-foundation.md) | **Options Pricing Foundation (design):** multi-exp data plane + use-case model packs · apps wire later |
| [31-structure-surface-replay.md](./31-structure-surface-replay.md) | **SSR (thesis):** 3D package-surface backtest / forward-walk · one day first · MC distributions |
| [19-strategy-lab-as-built-map.md](./19-strategy-lab-as-built-map.md) | Code/spec/route map for Curate/Deploy as-built |
| [20-strategy-lab-curate-board-performance.md](./20-strategy-lab-curate-board-performance.md) | Multi-bot Curate board performance/stability (DL-231) |
| [21-visualize-ai.md](./21-visualize-ai.md) | Visualize AI system architecture (pre-impl · DL-236) |
| [22-visualize-ai-design.md](./22-visualize-ai-design.md) | Visualize AI UX / interaction design (pre-impl · DL-236) |
| [23-bots-marketplace.md](./23-bots-marketplace.md) | Bot Marketplace Framework architecture (pre-impl · DL-243) |
| [24-bots-marketplace-design.md](./24-bots-marketplace-design.md) | Bot Marketplace Framework UX (pre-impl · DL-243) |
| [25-dual-subdomain-practice-labs.md](./25-dual-subdomain-practice-labs.md) | **Future:** practice.fattail.ai vs labs.fattail.ai (DL-248) |
| [26-strategy-lab-member-timeline.md](./26-strategy-lab-member-timeline.md) | **NOW:** Design+Curate lock; Deploy UX for members; Tradier real-money gated (DL-252) |
| [32-strategy-lab-guiding-doctrine.md](./32-strategy-lab-guiding-doctrine.md) | **Guiding light:** position don’t predict · book-level shape · VP memory · DL-382–386 |
| [33-strategy-lab-3d-surface.md](./33-strategy-lab-3d-surface.md) | **3D Surface first-ship as-built** · `/app/options-lab/surface` · App Spec v0.1.8 · Autofit v0.1.6 · multi-DTE front-exp (**DL-427**) · never clock-blocked (**DL-445**) · DL-401–427 · 445 |

**Market Bus / Options chain (2026-08-10) — as-built live market plane:**

| Doc | Role |
|---|---|
| Arch **28** | Massive → feed → Redis → API → one WebSocket → shared client · **§4.4 live underlier mids UI standard** |
| Arch **29** | **Heatmap templates** (design): flies / verticals / GEX over one chain model · diff once · many views |
| Arch **30** | **Options Pricing Foundation** (design): L0–L4 data plane + day/outlook/backtest packs · foundation before app wiring |
| Arch **31** | **SSR thesis:** package-surface replay · MC distributions · one day first · Spec `FatTail-Labs-Structure-Surface-Replay-Spec-v0_1.md` |
| Spec **OPF v0.2.1** | `Specs/FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md` — normative law (OPF1–33); v0.1 superseded |
| Bench **OPF** | `docs/Options-Pricing-Foundation-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-pricing-foundation/` |
| Spec **Position Builder/Book v0.3** | `Specs/FatTail-Labs-Options-Lab-Position-Builder-Spec-v0_3.md` — VIEW-7 + B5; v0.2 SUPERSEDED; **DL-306** |
| Bench **Position Builder** | `docs/Options-Lab-Position-Builder-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-lab-position-builder/` · DL-297 |
| Spec **Analyzer v0.2.1** | `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` — six buckets · Risk/Surface · OD-AZ1–8 Accept · advisor fold; v0_1 SUPERSEDED; **DL-301…306** |
| Spec **Surface Autofit v0.1.1** | `Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md` — **ACCEPTED** · **DL-421** · bench `docs/Options-Lab-Surface-Autofit-Full-Agent-Bench-Plan-v1.0.md` · **DL-422** |
| Spec **Analyzer Keep-Warm v0.1.2** | `Specs/FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md` — **BUILD AUTHORITY** · last paint · Working 2.5s / Away 5s / Idle posture · live sheet **local** · **DL-418** · **DL-419** |
| Audit **subscribe-then-price v1.0** | `docs/Options-Lab-Subscribe-Then-Price-Audit-v1.0.md` — generation subscribe vs local sheet · **DL-420** |
| Bench **Analyzer residual** | `docs/Options-Lab-Analyzer-Residual-Full-Agent-Bench-Plan-v1.0.md` (**v1.0.1**) · board `agents/p-options-lab-analyzer/` · **DL-305/306** |
| Doctrine **OT-EF v1.1** | `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md` · two clocks · additive book · **DL-396** |
| Spec **Session/Print v0.1** | `Specs/FatTail-Labs-OPF-Session-and-Print-Authority-Spec-v0.1.md` — **WHETHER = BUILD** (DL-397) · HOW review still lands · OPF34–36 |
| Bench **OT-EF / Session-Print** | `docs/OT-EF-Session-Print-and-Two-Clocks-Full-Agent-Bench-Plan-v1.0.md` (**v1.0.1**) · board `agents/p-ot-ef-session-print/` — no chrome until Echo labels; no code until Delta list; W4 when W1-G+W2-G+W3-G pass |
| Spec **Heatmap Templates v0.2** | `Specs/FatTail-Labs-Options-Lab-Heatmap-Templates-Spec-v0_2.md` — product law (DRAFT); v0.1 superseded |
| Bench plan | `docs/Options-Lab-Heatmap-Templates-Full-Agent-Bench-Plan-v1.0.md` · board `agents/p-options-lab-heatmap/` |
| Spec | `Specs/FatTail-Labs-Massive-Market-Bus-Shared-Client-Spec-v1.0.md` v1.0.1 |
| Chain surface | `Specs/FatTail-Labs-Options-Chain-Picker-Spec-v1.0.2.md` · route `/app/options-lab` |
| Bench | `docs/Massive-Market-Bus-Full-Agent-Bench-Plan-v1.0.md` · `agents/p-market-bus/` |
| Marks (Curate) | Arch **18** MySQL path — do not confuse with Redis `mb:*` |
| Decisions | **DL-282…286** |

**Strategy Lab member timeline (2026-08-07) — current product focus:**

| Doc | Role |
|---|---|
| Arch **26** | Design+Curate lock; full Deploy except real-broker $; admin Tradier dogfood |
| Arch **17** | Growth playbook (aligned) |
| Arch **32** · Spec **SL-GD v1.0** · **DL-382–386** | Guiding doctrine for every phase (position, don’t predict; VP trigger + market memory) |
| Position paper | [`docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md`](../docs/Strategy-Lab-Position-We-Position-We-Dont-Predict.md) |
| Docs | `docs/Strategy-Lab-Member-Timeline.md` |
| Decisions | **DL-251** · **DL-252** |

**Native apply (2026-08-19) — Chair GO · submit writes Cole’s seven fields + tag 18:**

| Doc | Role |
|---|---|
| Spec **v0.1** | `Specs/FatTail-Native-Apply-Form-Spec-v0.1.md` — apply law · lock.md · tag 18 |
| Ship path | `docs/Native-Apply-Ship-Path.md` — Labs `/apply` exists; fattail.ai host stays open (OQ-1) |
| Decisions | **DL-450** (spec) · **DL-451** (write) · **DL-452** (one-at-a-time · two beats · eyes stay put) · **DL-453** (invite copy · Heaven before Hell) · **DL-454** (accept next to the field) |

**Dual subdomain future (2026-08-07) — INTENT ONLY (architect in anticipation; do not implement split now):**

| Doc | Role |
|---|---|
| Arch **25** | Practice vs Labs products · Community segments · Visualize Practice-only · Labs membership + grandfather |
| Docs | `docs/Dual-Subdomain-Practice-vs-Labs.md` |
| Decisions | **DL-248** · **DL-249** · **DL-250** |

**Bot Marketplace Framework (2026-08-06) — design locked, pre-implementation:**

| Doc | Role |
|---|---|
| Spec **v0.1.2** | `Specs/FatTail-Labs-Bot-Marketplace-Framework-Spec-v0.1.md` — **monetize FatTail Lab Bots** + limited Navigator share (DL-247) |
| Arch **23** | Lane A commercial · Lane B peer · trust/download |
| Design **24** | Catalog provision UX + Navigator peer share |
| Decisions | **DL-243** · **DL-244** · **DL-247** |

**Visualize AI (2026-08-06) — design locked, pre-implementation:**

| Doc | Role |
|---|---|
| Spec **v0.1** | `Specs/FatTail-Labs-Visualize-AI-Spec-v0.1.md` — Coach intent; review → v1.0 |
| Arch **21** | Topology, tools, Massive/ChainStore, access, isolation from Curate |
| Design **22** | Hub card, workspace HIG, chart honesty, starter prompts |
| Decision | **DL-236** |

**Strategy Lab process runtime (2026-08-05 → 2026-08-06):**  
`Specs/Strategy-Lab-Process-Runtime-Spec-v1.2.md` — multi-member Curate primary; amends v1.1.  
`Specs/Strategy-Lab-Curate-and-Deploy-Surface-Spec-v1.0.md` — **as-built Curate/Deploy surface authority** (v1.0.2 board + nav).  
`Specs/Strategy-Lab-Process-Runtime-Spec-v1.1.md` — base instance/envelope/decision-log (still read with v1.2).  
`Architecture/14-strategy-lab-execution-responsibility.md` — execution responsibility (DL-214/216).  
`Architecture/20-strategy-lab-curate-board-performance.md` — comparison hot path + browser mount budget.  
`docs/Strategy-Lab-Curate-Runtime-User-Guide.md` — member operator guide.  
`docs/Strategy-Lab-MSC-Broker-Adapter-Assessment-2026-08-06.md` — two-layer brokerage concept (no MSC code).

**Community app (2026-08-06) — BUILD AUTHORITY (Coach Phase 5 / DL-239 · WP connector DL-240):**  
`Specs/FatTail-Labs-Community-App-Spec-v1.0.md` **v1.0.2** — `/app/community`;
Discord second-window on guild **FatTail AI**; member connect + Discord name via
**fattail.ai WP plugin** (Labs consumes; no parallel Labs OAuth); date-aware role
reconcile (DL-237–**240**); channels General + Practice + Strategy Lab + Toughness;
FatTail/member bot shares. Execution: `agents/p-community/` — **C1a PASS** (shell + shelves; bridge off until C1b).

**Trade Log manual management (2026-08-05):**  
`Architecture/15-trade-log-manual-management.md` — structure-first entry, close gates, trash, blotter open strip.  
Spec authority: `Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md` **§16**.

**Practice / retrospectives (2026-07-29) — p-retrospective R1b–R7 PASS:**

| Doc | Role |
|---|---|
| Spec **v0.6** as-built | `Specs/FatTail-Labs-Journal-Retrospective-Spec-v0.6.md` |
| Journey §4.1a | Cadence meter formula + profiles |
| Board / gates | `agents/p-retrospective/` |

**Member Practice export (2026-07-29):**

| Doc | Role |
|---|---|
| Spec **v1.0** | `Specs/FatTail-Labs-Member-Practice-Export-Spec-v1.0.md` |
| Board | `agents/p-member-export/` |

**Hardening phases (2026-07-23) — complete A–G:**

| Phase | Status | Specs |
|---|---|---|
| **A** Agent identity + dual admin shell | Shipped | Agent-Identity, Admin-Dual-Surface |
| **B** Kanban backlog / production board | Shipped | Content-Board |
| **C** Package checklist + freeze + AI attach | Shipped | Production-Package |
| **D** Multi-module Labs draft placement | Shipped | Production-Package (§5–6) |
| Notifications | Shipped | Admin-Notifications |
| **E** Pool, SSO contracts, smoke tests | Shipped | Phase-E-Hardening |
| **F** Signed CDN (Bunny Stream) | Shipped | Lesson-Video-Signed-CDN |
| **G** Cast + HeyGen factory (G1–G5) | Shipped | Cast-HeyGen v1.0 + **v1.1** |

**Related**

- Product parent: `Specs/FatTail-Labs-Course-Hosting-Spec-v1.0.md`
- Cast / HeyGen: `Specs/FatTail-Labs-Cast-HeyGen-Spec-v1.1.md`, `docs/P2-Cast-and-HeyGen-Production.md`
- P1 / P2 charters: `agents/p1-foundation/CHARTER.md`, `agents/p2-foundation/CHARTER.md`
- Deploy playbook: `infra/deploy.md`
- Operator guide: `docs/ADMIN-GUIDE.md` (board, cast, HeyGen, packages, agents, alerts)
- WooCommerce + WordPress SSO: `docs/WooCommerce-SSO-Integration-Guide.md`
- Marketing platform (design draft): `docs/Marketing-Platform-Architecture.md`
- Capabilities map: `docs/P2-Capabilities-for-P1.md`
- Cast files: `docs/studio/cast/`

**How to amend**

1. Change code only with an approved or versioned **Spec** when behavior changes.  
2. Log the decision in **00-decision-log.md** the same day.  
3. Update the architecture doc that owns the layer so `Architecture/` stays truthful.  
4. India blocks drift: docs that contradict code are defects.
