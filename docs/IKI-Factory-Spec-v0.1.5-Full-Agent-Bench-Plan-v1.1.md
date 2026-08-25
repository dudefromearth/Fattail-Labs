# IKI Factory Spec v0.1.5 — Full Agent Bench Plan v1.1

**Program:** IKI Lab (suite) · IKI Factory (inner app).  
**Spec of record:** [`Specs/FatTail Labs — IKI Factory Spec v0.1.5`](../Specs/FatTail%20Labs%20%E2%80%94%20IKI%20Factory%20Spec%20v0.1.5) **BUILD AUTHORITY** (**DL-556**). **GO IF-1…IF-5** (**DL-559 · 567 · 569 · 577 · 578**). Store / WC API not granted.  
**Gemba charter (seated, compliant):** [`agents/bench/gemba.md`](../agents/bench/gemba.md) — Coach rewrite 2026-08-23. Conveyor, Hold, plan-as-approval. **SC-0 (DL-562):** invariant 9 realigned to publication-signal-only (not a Factory rewrite packet). Help Package / registration push **SUPERSEDED**.  
**Supersedes (plan, not spec):** [`docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.0.md`](./IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.0.md) (assumed a stale charter and invented **IF-0**). Also supersedes [`docs/IKI-Factory-Full-Agent-Bench-Plan-v1.0.md`](./IKI-Factory-Full-Agent-Bench-Plan-v1.0.md) (Factory Spec **v0.1.2**).  
**Parents:** IKI Lab and Factory Spec v0.1 · Wiki Spec **v0.2** (Unified; v0.2.1 is the current Wiki packet) · North Star v1.2 (Invariant #8) · Public Data Service Spec v0.1 Part I · Agent Identity Spec v1.0.  
**Juliet.** Execution plan only. No product code until Coach stamps **BUILD AUTHORITY** on the spec **and** **GO IF-1**. Seeds are written in the same body of work as each GO, not before.

**Board (after GO):** `agents/p-iki-factory/` — not created until BUILD. Do not fold this into `agents/p-iki-lab/` (Runner chrome) or `agents/p-wiki/` (Wiki Agent).  
**Isolation (DL-539):** Factory writes stay in Factory domain + admin Factory surface + Gemba **principal** (charter is already seated — do not touch it in implementation packets except the SC-0 i4/i8/i9 signal-only diffs, already landed). Wiki **publication signal at Deploy** and WooCommerce product **create** are named obligations. Factory does **not** emit a Wiki envelope. **Writes** into Wiki Agent consume path, Runner (`web/lib/runner/**`), Options Lab, Market Bus, Trade Log, or `AppChrome` need Coach naming plus three successive OKs where those trees are frozen.

---

## Up front

Nothing of Coach’s Factory Spec v0.1.5 or the rewritten Gemba charter is dropped. This plan does not invent a Factory job — v0.1.5 already seats it (admin Kanban + **Gemba** + **conveyor**). **SC-0 (DL-562):** Help Package Deploy gate **SUPERSEDED**; Deploy exposes a publication signal only. The charter now laws that covenant. It does **not** treat DRAFT as BUILD.

Coach Content Law (doctrine §11 · DL-176): objections sit beside Coach’s text, labeled. Blocks below are **sequencing**, not edits to the spec or the charter.

**v1.0 plan error (corrected here):** Juliet treated `gemba.md` as stale and sequenced **IF-0** (India diff + Lima rewrite + Coach charter stamp) before IF-2. Coach rewrote the charter. **IF-0 is cancelled.** The charter is an input, not a packet.

---

## What changed from plan v1.0 (this spec) and from spec v0.1.2

| Source | Plan consequence |
|--------|------------------|
| **Coach rewrite of `agents/bench/gemba.md`.** Conveyor (invariants 3–6), Hold sacred, plan attachment = Spec approval. **SC-0:** invariant 9 = publication signal only (no envelope, no push). CUSTOMIZATION: IF-1 before runner; IF-2+ needs live `gemba` principal + registry; IF-4 needs B5 live-path, **not** a Help Package spec. COMPLETION / COOPERATION complete. | **IF-0 cancelled.** B3 (stale charter) **absorbed**. Do not create `factory.md`. Do not edit `gemba.md` in Factory **implementation** packets (SC-0 i4/i8/i9 diffs already landed from the wiki board). Remaining roster hygiene (`AGENTS.md`, bench README one-liner) is Lima at GO SPEC — not a gate. |
| **OD-F8 Gemba seated.** Principal `gemba`. Not Quebec, Bravo, Oscar, Golf. | Plan-against-v0.1.2 **B3 (new archetype)** remains absorbed. |
| **OD-F9 Conveyor.** Ideas→Research auto; Research→Spec **Admin only**; Spec→Build auto when Spec-ready + repo plan attached (unless Hold); Build→Deploy auto when Built-ready + product spec (unless Hold). Every auto-move visible. Hold always available. | IF-1 ships Hold + drag/click. Conveyor Spec→Build is **IF-3**. Conveyor Deploy is **IF-4**. IF15 / AT-IF-15 are first-class. |
| **OD-F5 Plan attachment = Spec approval.** | IF-3 must not invent a second Approve button. Charter invariant 6. |
| **OD-F10 SUPERSEDED (SC-0 · DL-562).** Original: complete Help Package + push `kind=registration`. **Replacement:** Deploy exposes a **publication signal only**. No envelope, no hook, no wiki page bytes. Wiki polls, hashes, composes or L12-declines. | IF-4 is **smaller**. No Help Package spec. No completeness belt-stop. No `contracts:deliver` from Factory. `Specs/FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` remains Options Lab Heatmap, not this. |
| **Parents = Wiki Spec v0.2.** | Neighbor quote is Wiki Spec v0.2.1 II.1 (SC-0: S3 = Wiki-side compose after publication signal). |
| **IF-2+ cannot ship without live `gemba` principal + versioned skills registry.** | In the spec **and** in the charter CUSTOMIZATION. IF-1 may ship chrome + Idea cards + Hold without the research runner. |
| **Commerce OD-F6.** WooCommerce is the platform-wide commerce entry point. Native Stripe superseded-unless-Coach-revives. INSTRUCTIONS.md §11.1 update is Lima, not product code. | Mike designs Labs → WP **product create**. No Stripe. |

---

## Juliet review (labeled)

Coach’s spec text stays in `Specs/`. Coach’s charter stays in `agents/bench/gemba.md`. Nothing below deletes either.

### Blocking for *sequencing* (not for spec or charter content)

| # | Item |
|---|------|
| **B1** | Spec header is **DRAFT**. Reviewers in the spec are **PENDING** (India, Mike, Echo+Tango, Hotel, Delta). Sequential gates → Coach **Phase 5 BUILD** → Lima DL → **then** GO IF-1. This plan is not a spec stamp. |
| **B2** | Member pill `/app/iki/factory` stays **named soon** until Coach opens it (spec §2, OD-F7). The Kanban is **admin-only**. Juliet’s default mount: **`/admin/iki-factory`**. Tick below if Coach wants the board *on* the suite pill instead (still admin-gated). |
| **B3** | **Absorbed.** Gemba charter is Coach-rewritten and compliant with OD-F8/F9/F10. No IF-0. |
| **B4** | **DEAD.** There is no Help Package (Source Contract v0.1.4 · **DL-560**). IF-4’s Wiki obligation is **expose a publication signal at Deploy**. Nothing else. Does **not** block IF-4. |
| **B5** | **Template live-path vs Runner freeze.** Spec §2 says deployed templates join the existing / future **template registration** path (no parallel corpus). As-built Runner registry is `web/lib/runner/registry.ts` — IKI Runner tree, DL-539. W0 must **quote** the live path. If that path is Runner, IF-4 does **not** write `web/lib/runner/**` without three successive OKs. Default until Coach ticks: Factory **Live record + Woo product + publication signal**; Runner consume is a **named later packet**, not silent coupling. |

### Coach dispositions (tick)

**B2 — Where the board lives**

- [ ] **Admin only** — `/admin/iki-factory` (plan default). `/app/iki/factory` remains the member soon page (`data-testid="iki-factory-soon"`).  
- [x] **Suite pill** — `/app/iki/factory` is the board, admin-gated. Non-admin sees soon. `/admin/iki-factory` redirects here. **Coach 2026-08-24 · DL-566.**

**B5 — Where a Live template lives (IF-4)**

- [x] **Factory Live + publication signal only** (plan default). No Runner write. No Wiki envelope. **Coach GO IF-4 2026-08-24 · DL-577.**  
- [ ] **Runner register** — Coach names `web/lib/runner/**` and records **three successive OKs (DL-539)** on the GO IF-4 token.

**B4 — Help Package spec** — **DEAD.** Not a stamp. Not an IF-4 precondition. Source Contract v0.1.4 (**DL-560**) superseded Help Package. IF-4 exposes a publication signal only.

### Opinions (Coach may discard)

| # | Item |
|---|------|
| **O1** | Reuse **Content Board Kanban grammar** (drag, 44pt, HI tokens, column chrome) **not** `content_items` tables, Quebec columns, or `BoardKanban.tsx` in-place. Factory lanes are a different machine. New component under `web/components/admin/` Factory-named. |
| **O2** | First registered research skill can be a **stub** that fail-louds “no skills registered” until Coach names a skill (e.g. symbol-entity map / opportunity-finder). Do not silently invent research. Empty registry + Idea pickup → Idea card **Blocked** with reason (IF8). |
| **O3** | Conveyor tick = in-process poller (Quebec / Wiki Agent pattern). Do **not** add a MiniTwo launchd daemon for IF-1…IF-3 unless Foxtrot names it. |
| **O4** | Canonical hyphenated spec copy at BUILD: `Specs/FatTail-Labs-IKI-Factory-Spec-v0.1.5.md` pointing at the space/em-dash file Coach landed. Tools choke on the current filename. Lima, not a rewrite of Coach’s text. |
| **O5** | IF-1 auto-pickup = move Idea → Research **without** running skills (card shows “waiting for skills” / picked). IF-2 attaches the 24 h window. Matches spec §10 and Gemba CUSTOMIZATION. |
| **O6** | Do not add a Spec “Approve” control. Plan attachment **is** approval (OD-F5; charter invariant 6). Echo: the attach control’s copy must say so, or Tango will see a missing gate that the spec forbids inventing. |
| **O7** | At GO SPEC, Lima adds Gemba to root `AGENTS.md` and updates the bench README one-liner (still says “human-gated Spec→Build→Live”). Roster hygiene only — **not** a rewrite of `gemba.md`. |

---

## Archetype — Gemba (seated; charter is law)

Spec OD-F8 and the rewritten charter closed the seat. **Do not create `agents/bench/factory.md`.** **Do not reuse Quebec / Bravo / Oscar / Golf.** **Do not edit `gemba.md` in implementation packets.**

| Existing seat | Why it does not cover Factory |
|---------------|-------------------------------|
| **Quebec** | Content Vision → course/YouTube Kanban, HeyGen, `content_items`. Different lanes, different SoR. Two factories on one callsign collides. |
| **Bravo** | Course source packs. Not a versioned skill registry, not card materialization, not Woo Deploy, not conveyor. |
| **Wiki Agent / Oscar** | Downstream: git wiki pages from **contracts**. Factory **must not** write wiki pages (spec §7, §9; charter “What you never touch”). Wiki Agent **polls** the publication signal after Live. |
| **Alpha / Charlie** | Build the surface, API, job runner. They are not the 24 h research worker and do not own conveyor judgment. |
| **Golf** | Reserved (Ask Vexy). Do not steal. |

**Two layers, one callsign (Wiki Agent pattern):**

| Layer | Who | Job |
|-------|-----|-----|
| **Gemba (bench)** | Charter as written. “Go to the Gemba” at gates. | Owns the covenant. Reviews actual registry / cards / runs. Does not write Charlie chrome. |
| **Gemba (runtime)** | Agent Identity principal `gemba` | Pickup, research window, ranking/materialization, intra-lane state, conveyor auto-advances, Deploy side-effects. Alpha implements the services; they **run as** `gemba`. |

**Charter law the packets must implement (quote, do not re-derive):**

- Ideas→Research **auto**.  
- Research→Spec **never** without Admin selection (invariant 3).  
- Spec→Build **auto** when Spec-ready + plan attached + not Hold (invariant 4). Plan attachment **is** Spec approval (invariant 6).  
- Build→Deploy **auto** when Built-ready + product type/tier/free-vs-paid + not Hold (invariants 4 and 9).  
- Hold is sacred (invariant 5). Every auto-move visible with reason.  
- Missing inputs / timeout / error → Blocked/Failed, belt stops (invariant 8).  
- Deploy **exposes a publication signal**. Gemba never writes wiki pages and never builds a Wiki envelope (invariant 9, SC-0).  
- WooCommerce only (invariant 16). No profit claims (invariant 15). No invention (invariant 7).  
- CUSTOMIZATION: IF-1 may ship before the skills runner; IF-2+ needs live `gemba` principal + versioned registry; IF-4 needs B5 live-path, not a Help Package spec.

India at W0 **quotes** the charter against the spec. A contradiction would be a RETURN to Coach, not a Lima rewrite packet.

---

## Intent (spec §0–§1)

Admin-only Kanban, fronted by **Gemba**, operated as a **controlled conveyor**. Admin deposits Ideas. Gemba auto-picks them, runs registered versioned skills ≤24 h, ranks findings, materializes top results (≤10 or fewer) as Research cards. **Only Admin** selects which Research cards go to Spec. Thereafter the belt moves when required inputs are present and the card is not on Hold: Spec-ready + repo plan → Build; Built-ready + product spec → Deploy. Gemba deploys the template, creates the WooCommerce subscription product, makes it store-visible, and **exposes a publication signal**. The Factory does not know the Wiki agent exists. Every card carries Priority (Low / Medium / High) and full lineage. Failures, timeouts, and missing inputs stop the belt with a visible reason. Admin may Hold, Rework (Admin chooses destination), Archive, or override. Only **Live** is member-visible. No invention. No parallel knowledge store. WooCommerce only.

Success = **IF1–IF15** / **AT-IF-1…15**.

---

## What ships / what does not

**Ships (after BUILD + matching GO):**

1. Admin Kanban: Ideas → Research → Spec → Build → Live.  
2. Drag-and-drop + click-to-advance/detract; invalid moves stay put with a reason.  
3. Priority Low/Medium/High; owner; lineage; **Hold**.  
4. Gemba pickup + versioned skill registry (from IF-2).  
5. Spec draft; plan attachment as Spec approval; conveyor Spec→Build (IF-3).  
6. Conveyor Deploy when product spec present: template Live + Woo subscription product + store visibility + **publication signal** (IF-4). No Wiki envelope. No hook. Wiki polls.  
7. Card-visible auto-move reasons, blocked/failed reasons, owner notify.

**Does not ship in this program:**

- Opening the **member** Factory pill (unless B2 = suite pill).  
- Wiki page bytes (Wiki Agent / WU-3). New-vs-update **declaration** is Wiki-side.  
- Native Stripe.  
- Inventing research when the registry is empty.  
- Reusing `content_items` / Quebec columns / editing `BoardKanban.tsx` in place.  
- Options Lab, Runner compute (unless B5 = Runner + three OKs), Market Bus, Trade Log, `AppChrome`.  
- A second Spec-approval act.  
- Gemba choosing Rework destination.  
- Padding findings to 10.  
- A charter rewrite (Coach already did that).

---

## Store law

| Truth | Where |
|-------|--------|
| In-progress Factory work | **New** Factory tables (cards, lanes, priorities, lineage, agent actions, Hold, blocked reason, auto-move log). Spec §2: operational SoR. **Not** `content_items`. |
| Deployed templates | Existing / future **template registration** path. No second corpus. W0 quotes the path; B5 decides whether IF-4 writes Runner. |
| Wiki pages | Git only. Factory **exposes a publication signal** at Deploy. Wiki Agent polls, composes Wiki-side, drafts the page or L12-declines, and **declares** new vs update. |
| Commerce | WooCommerce subscription product only (OD-F6). Labs currently **receives** Woo webhooks; IF-4 **creates** products (outbound). |
| Skills | Versioned registry (OD-F3). Gemba may invoke only registered versions. |
| Factory Agent covenant | `agents/bench/gemba.md` (seated). Runtime actor is principal `gemba`. |

---

## Already built — do not rebuild

| Piece | As-built |
|-------|----------|
| IKI suite nav + member Factory pill | `IkiSuiteChrome` · `/app/iki/factory`. Admin: Kanban (**DL-566**). Member: Live catalog (**DL-577**). |
| Content Board Kanban | `/admin/board` · `BoardKanban.tsx` · `content_items`. **Grammar only.** |
| Wiki Agent portal | `POST/GET /api/wiki-agent/contracts` · `wiki_contracts` · `contracts:deliver` (**DL-548…554**). Factory does **not** POST. S3 compose is Wiki-side (WU-3 / SC-3b). |
| Wiki-side pollers | GET-only (**DL-549**). **The** Factory→Wiki path under Source Contract (signal, not a bridge to a later push). |
| Woo inbound | Identity / membership webhooks. **Not** product create. |
| Gemba charter | `agents/bench/gemba.md` — **Coach-rewritten, v0.1.5-compliant. Do not rebuild.** |
| Agent Identity | `agent_principals` + `/admin/agents`. **No `gemba` principal yet.** |
| Runner registry | `web/lib/runner/registry.ts` — **out** unless B5 + three OKs. |

**Not built:** **GO IF-5** hardening. Named production research skill. Wiki SC-3b poll of the Factory signal. Runner consume (B5 not Runner). MiniTwo deploy. Roster line in root `AGENTS.md` / bench README one-liner (O7) if still stale.

---

## Locked only after Coach stamp

Until Phase 5 these are **spec proposals**, not house law:

| ID | Spec proposal | Blocks if Coach rules otherwise |
|----|---------------|----------------------------------|
| **OD-F1** | Lane names Ideas → Research → Spec → Build → Live | Schema + Echo chrome |
| **OD-F2** | Priority Low / Medium / High | Card field |
| **OD-F3** | Extensible versioned skill registry | IF-2 |
| **OD-F4** | Ranked list ≤24 h; top ≤10 or fewer become cards | IF-2 |
| **OD-F5** | Repo plan attached; attachment **is** Spec approval | IF-3 — no extra Approve |
| **OD-F6** | WooCommerce subscription product; platform-wide commerce | IF-4; INSTRUCTIONS.md §11.1 |
| **OD-F7** | Board admin-only; only Live member-visible | Mike + B2 |
| **OD-F8** | Gemba / `gemba` / `agents/bench/gemba.md` | IF-2 principal (charter already seated) |
| **OD-F9** | Conveyor + Hold + visible auto-moves | IF-1 Hold; IF-3/IF-4 conveyor |
| **OD-F10** | SUPERSEDED: publication signal at Deploy; no envelope; no hook | IF-4 (smaller); B4 closed |

**Already house law (do not reopen):** DL-539 isolation · WooCommerce-only commerce (CLAUDE.md; this spec generalizes) · Invariant #8 · WIK-D1 git wiki pages · W5 no agent publish · Family B firewall · OD-IKI-1 was “Factory job open” — **this spec is the close**, logged when Coach stamps BUILD. **Gemba charter text** is Coach’s; packets implement it, they do not amend it.

---

## Critical path

```text
Coach: spec reviews + Phase 5 BUILD + Lima DL (OD-F1…F10, OD-IKI-1 closed)
  → W0 India/Mike/Echo inventory (read-only; quote charter, do not rewrite it)
    → GO IF-1
      → IF-1 Board + Ideas + Hold
        → IF-1-G Delta
          → GO IF-2  (needs live gemba principal + versioned skills registry)
            → IF-2 Research
              → IF-2-G
                → GO IF-3
                  → IF-3 Spec + Build + conveyor Spec→Build
                    → IF-3-G
                      → GO IF-4  (needs B5 ticked; Help Package spec **not** required)
                        → IF-4 Deploy + Live + conveyor + publication signal
                          → IF-4-G
                            → GO IF-5
                              → IF-5 Hardening → IF-5-G
```

Each phase: Coach stamp · DL · Delta ternary. Lima same day. **Never skip India or Delta.**

Wiki WU-3 / SC-3b (poll + Wiki-side compose) is a **neighbor stamp**, not this critical path. Factory does not POST a Wiki envelope. A missing Wiki poller is Wiki’s problem (L7 / OD-13), not a Factory Blocked reason and not a license to write wiki pages.

---

## Phases (map spec §10)

### W0 — Inventory (read-only)

**India + Mike** (architecture + admin/auth). **Echo** looks at `BoardKanban.tsx` as **grammar**, not copy.

Prove, by artifact quote:

- Content Board tables vs Factory need (do not share `content_items`).  
- `/admin` session vs `useIsAdmin` vs agent bearer.  
- Woo webhook **inbound** vs needed **outbound** product create.  
- Wiki publication signal (Factory spec §6/§9 SC-0) + Wiki Spec v0.2.1 II.1 (Wiki-side compose; no Factory envelope).  
- `/app/iki/factory` placeholder.  
- Gemba charter **as seated** vs spec §3.3–3.5 / OD-F9 / OD-F10 (confirm match; **RETURN** only if a real contradiction remains — do not open a rewrite packet).  
- Runner registry path (feeds **B5**).  
- Agent Identity seed principals (no `gemba` yet).

**Does not write.** Does not touch `gemba.md`.

### IF-1 — Board + Ideas (AT-IF-7, 11, 14; Hold chrome for IF15)

Spec §10 and Gemba CUSTOMIZATION: Kanban + drag/click + Idea cards + Priority + ownership + basic agent pickup + Hold. Proves IF7, IF11, IF14. **May ship before the skills-pipeline runner.**

| Agent | Job |
|-------|-----|
| **Mike** | Admin-only API + page. Non-admin 403. Member `/app/iki/factory` unchanged unless B2 = suite pill. |
| **Alpha** | Migration: Factory cards, lanes, priority, owner, lineage, transitions (append-only), **Hold**, blocked/failed reason. Not `content_items`. Idea create. Pickup stub: auto-move Idea → Research **without** skills (O5). Reject Research→Spec unless actor is Admin. |
| **Echo** | Board HIG: five lanes, drag, click-advance/detract, empty Ideas, priority chips, Hold affordance, ≥44pt, tokens. |
| **Charlie** | Board UI at the B2 mount. Admin creates Idea. Drag/click with client+server validation. Invalid drop stays put; reason on the card. |
| **Tango** | Empty-state and Hold copy: workshop, not oracle. No profit claims. |
| **Kilo** | Isolation; invalid-move 422 + visible reason; non-admin 403; Hold persists across reload; Research→Spec as Gemba bearer rejected. |
| **Lima** | DL + spec honesty (as-built board path); AdminNav link (named overlap with admin chrome — seed lists `AdminNav.tsx`); O7 roster lines if not done at GO SPEC. |

**Gemba runtime:** not required to research in IF-1. Pickup stub is enough. **Do not edit the charter.**

### IF-2 — Research (AT-IF-1, 2, 8, 10)

**Requires** live `gemba` principal **and** versioned skills registry (spec §10; charter CUSTOMIZATION). Charter is already seated.

| Agent | Job |
|-------|-----|
| **Mike** | Mint / seed principal `gemba` with Factory scopes. **No** `contracts:deliver` — Factory does not POST a Wiki envelope. Not an admin cookie. |
| **Alpha** | Skill registry table (id, version, status). Research window (24 h from pickup). Findings JSON on Idea; child Research cards ≤10 with rank + reason + sources; remainder on parent. Empty registry → Blocked on Idea, no padding. |
| **Charlie** | Research lane chrome: rank, reason, sources; remainder on parent; fail/timeout/Blocked. |
| **Hotel** | Review default skill **output shape** (no advice, no profit claims). Does not author the skill. |
| **Kilo** | Empty registry fail-loud; window expiry visible; no padded 10; only registered versions invoked. |
| **Foxtrot** | Only if W0 says the window cannot be an in-process poller. Default: no new launchd (O3). |

**Default skill:** none until Coach names one. Pickup with empty registry is a **passing** IF-2 gate if the card Blocked reason is truthful.

### IF-3 — Spec + Build + conveyor Spec→Build (AT-IF-4, 5, 9, 15)

Charter workflow step 5 and invariants 4–6.

| Agent | Job |
|-------|-----|
| **Alpha** | On Admin Research→Spec: Gemba drafts Template Spec onto the card from proposal + sources + Admin notes; Spec-ready; notify owner. Conveyor: Spec-ready **and** repo plan ref attached **and** not Hold → auto-advance to Build; implement **only** against that plan + Spec; Built-ready; notify. No second approval column. Rework destination is Admin’s. Waiting-for-plan is a visible intra-lane state, not a silent stall. |
| **Charlie** | Spec-ready / Built-ready / waiting-for-plan / auto-move reason / Hold / Rework destination picker. |
| **Echo + Tango** | Visible auto-move feedback; attach-plan copy = approval (O6); Hold is obvious. |
| **Kilo** | No auto Research→Spec; conveyor Spec→Build only with both inputs and not Hold; Hold blocks then resumes; Gemba cannot choose Rework lane; plan attachment treated as approval (no extra flag required). |

### IF-4 — Deploy + Live + conveyor + publication signal (AT-IF-6, 13, 15)

**Requires** B5 ticked. **Does not** wait on a Wiki-side field list (B4 dead). Charter invariant 9 (signal-only). Wiki SC-3b may still be unstamped — Factory still Deploys; Wiki composes when it polls; Gemba does not write pages and does not construct a Wiki-side contract. No delivery hook. IF-4 is smaller.

| Agent | Job |
|-------|-----|
| **Mike** | WooCommerce **product create** design (HMAC, fail-loud, no Stripe). **No** `contracts:deliver` from Factory. |
| **Alpha** | Deploy transaction: Live template (per B5) + Woo subscription product + store visibility + **publication signal**. Conveyor fires when Built-ready + product type/tier/free-vs-paid + not Hold. Missing product spec → stay in Build, visible “waiting for product spec.” No Wiki POST. |
| **India** | Quote Source Contract §6: Factory obligation is the signal only. No Wiki-side field-list completeness checker. |
| **Hotel** | Live artifact strings: no profit claims, no invented fit. |
| **Kilo** | Deploy without product spec rejected; Hold blocks Deploy; non-Live never member-listed; **zero** wiki page files and **zero** Wiki envelopes from Factory tests. |

**Wiki Agent tree:** poll-only from the Wiki board. Factory seeds do not edit Wiki.

### IF-5 — Hardening (AT-IF-3, 8, 12, 14, 15)

Lineage queries; notification reliability (existing admin notify plane); failure injection (timeout, empty registry, missing product spec, Woo create fail); Hotel pass on agent-drafted strings; drag invalid-move matrix; Hold reliability (set, conveyor skipped, clear, conveyor resumes); auto-move reason always present. No Help Package completeness gate.

---

## Seeds (written when the matching GO is stamped)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|-------|
| W0-1…3 | India, Mike, Echo | GO SPEC / BUILD | B2/B5 ticks |
| IF-1-0 | India | **GO IF-1** | schema + conveyor state machine (no auto Research→Spec; Hold; plan-as-approval as a field, not a second act) |
| IF-1-1 | Mike | GO IF-1 | IF-1-2 |
| IF-1-2 | Alpha | IF-1-0, IF-1-1 | IF-1-4 |
| IF-1-3 | Echo | GO IF-1 | IF-1-4 |
| IF-1-4 | Charlie | IF-1-2, IF-1-3 | IF-1-5 |
| IF-1-5 | Kilo | IF-1-4 | IF-1-G |
| IF-1-6 | Lima | IF-1-G | DL + AdminNav honesty + O7 roster if needed |
| IF-2-* | Mike, Alpha, Charlie, Hotel, Kilo | **GO IF-2** + live `gemba` principal + registry | IF-2-G |
| IF-3-* | Alpha, Charlie, Echo, Tango, Kilo | **GO IF-3** | IF-3-G |
| IF-4-* | Mike, Alpha, India, Hotel, Kilo | **GO IF-4** + B5. **No delivery hook.** Publication signal only. IF-4 smaller. | IF-4-G |
| IF-5-* | Alpha, Kilo, Hotel | **GO IF-5** | IF-5-G |

**No IF-0 seeds.** Juliet writes pasteable seeds **in the same body of work as each GO**, not before. IF-3 seeds **must** encode plan-attachment-as-approval and conveyor-unless-Hold as settled spec and charter, not as an OD to reopen.

---

## File allowlists (proposed — freeze at each GO)

Exact list is W0 output. Direction:

| Area | Likely paths | When |
|------|----------------|------|
| Admin UI | `web/app/admin/iki-factory/` · `web/components/admin/` Factory board (**new**; do not edit `BoardKanban.tsx` unless Coach ticks reuse-in-place) · `web/components/admin/AdminNav.tsx` (one link) | IF-1 |
| Member pill | `web/app/app/iki/factory/page.tsx` | **only if B2 = suite pill** |
| API | `server/routes/` Factory admin router (**new**) | IF-1 |
| Domain | `server/` Factory domain + conveyor + registry modules (**new**) | IF-1…IF-4 |
| Schema | `migrations/NNN_iki_factory*.sql` | IF-1, IF-2 |
| Agent identity | principal `gemba` seed / admin Agents page | IF-2 |
| Tests | `server/tests/test_iki_factory*.py` · web characterization | each slice |
| Docs | this plan · Lima DL · spec status flip on BUILD · INSTRUCTIONS.md §11.1 pointer · root `AGENTS.md` / `agents/bench/README.md` one-liner (O7) | GO SPEC / IF-1-6 / IF-4 |
| Wiki portal | **never from Factory** — Wiki polls the publication signal | Wiki board SC-3b |
| Runner | `web/lib/runner/**` | **never** unless B5 + three OKs |
| Gemba charter | `agents/bench/gemba.md` | **never** in this program |

**Never in these packets unless named:** `web/lib/runner/**` · Options Lab · Market Bus · Trade Log · `AppChrome` · `BoardKanban.tsx` internals · wiki git write · `content_items` · `agents/bench/gemba.md`.

---

## Neighbor boards (India artifact-quote rule)

| Assertion | Quote from |
|-----------|------------|
| Wiki Agent S3 compose | Wiki Spec v0.2.1 **II.1** (SC-0 rewrite) + Source Contract §6 + portal as-built `server/routes/wiki_agent.py`. Factory does not POST. |
| Member Factory pill is soon | `web/app/app/iki/factory/page.tsx` as-built |
| Content Board is a different Kanban | Content Board Spec v1.0 + `/admin/board` |
| WooCommerce is commerce SoR | Factory spec v0.1.5 header + OD-F6 · CLAUDE.md commerce |
| Gemba is the Factory Agent | Factory spec OD-F8 + `agents/bench/gemba.md` **as seated** |
| Isolation | **DL-539** · this plan header |
| Publication signal | Factory spec §6 / §9 (SC-0) + Source Contract §3.5 / §6. Help Package field list **gone**. |
| Wiki poll of Factory | Wiki Spec v0.2.1 II.1 (SC-0) + Source Contract §6 + Gemba invariant 9 (signal-only) |

Do not assert “Wiki Agent PASS on registration” without quoting `agents/p-wiki/` / Wiki Spec v0.2.1 plan **WU-3** row.

---

## Notifications (spec §8)

- **Primary:** on the card (auto-move reasons, blocked/failed reasons, Spec-ready, Built-ready, waiting-for-plan, waiting-for-product-spec).  
- **Secondary:** owning Admin, existing admin notification plane (`AdminNotifications` / the path already used for admin). No new channel in IF-1.  
- Notify on: Spec ready, Build complete, conveyor move, failure/block/escalation.

---

## Gates

| Gate | Evidence |
|------|----------|
| **R0 / BUILD** | Review notes; Coach stamp on spec v0.1.5 + OD-F1…F10; Lima DL (OD-IKI-1 closed); B2 ticked; charter quoted as seated (no rewrite) |
| **IF-1-G** | Admin creates Idea; non-admin 403; drag/click; invalid Research→Spec as agent rejected; Hold sets; member pill unchanged unless B2; not `content_items`; `gemba.md` untouched |
| **IF-2-G** | `gemba` principal live; empty registry → Blocked with reason, **zero** invented findings; window expiry visible; ≤10 cards, remainder on parent; only registered versions |
| **IF-3-G** | Admin-only Research→Spec; Spec-ready + notify; plan attach auto-advances unless Hold; no extra Approve; Rework destination is Admin’s; auto-move reason on card |
| **IF-4-G** | Missing product spec stays in Build with reason; product spec + not Hold → Live + Woo product + store visible + publication signal; **no** Wiki envelope; **no** wiki page bytes from Factory; non-Live not member-listed |
| **IF-5-G** | Lineage query; injected failures visible; Hotel grep clean; Hold skip + resume; invalid-move matrix |

Delta never modifies work under review. Verdicts: **PASS / FAIL / BLOCKED**. A waived gate is a doctrine violation.

---

## Out of scope until Coach names it

- Member-facing Factory workflow (unless B2 = suite pill).  
- Factory choosing Rework destination.  
- Padding research to 10.  
- Stripe.  
- Second wiki store / Gemba writing pages.  
- IKI Template Help Package spec — **SUPERSEDED** (Source Contract; not a Factory deliverable).  
- Runner registry writes without B5 + three OKs.  
- DL-539 frozen trees without three OKs.  
- MiniTwo / production deploy unless Coach names the host.  
- Rewriting `agents/bench/gemba.md`.

---

## GO checklist (Coach)

- [x] Spec reviews complete (or Coach expedites like DL-457 / DL-479, **named**). Coach expedited Phase 5 (**DL-556**); sequential reviewer notes remain owed as W0 + later gates.  
- [x] Phase 5 **BUILD AUTHORITY** + Lima DL (OD-F1…F10 as stamped; **OD-IKI-1 closed**) — **DL-556**.  
- [x] **B2** mount ticked — suite pill `/app/iki/factory`, admin-gated (**DL-566**).  
- [x] **GO IF-1** (**DL-559**).  
- [x] **GO IF-2** (live `gemba` principal + registry) — **DL-567**.  
- [x] **GO IF-3** — **DL-569**.  
- ~~B4 Help Package spec~~ **DEAD** — not a stamp; does not block IF-4 (**DL-560**).  
- [x] **B5** Live-path — Factory Live + signal only (**DL-577**).  
- [x] **GO IF-4** — **DL-577**.  
- [x] **GO IF-5** — **DL-578**.  
- [ ] **Amend**  
- [x] **Stop** — nowhere left without the store / WC API (later program).

**Signed:** Juliet (plan **v1.1**). Spec **BUILD AUTHORITY** (**DL-556**). **GO IF-1…IF-5**. Store not granted.  
**Date:** 2026-08-23

---

## Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.1 IF-5** | 2026-08-24 | **GO IF-5** hardening (**DL-578**). Woo remains named stub. Stop — store is a later program. |
| **v1.1 IF-4** | 2026-08-24 | **GO IF-4** + **B5** Factory Live only (**DL-577** Coach rulings: Published first, Woo stub, free obtainable). |
| **v1.1 SC-0-G** | 2026-08-24 | Four SC-0 diffs on record (**DL-565**). Gemba i9 signal-only; board card has no Help Package chrome. **GO IF-2 unstamped.** |
| **v1.1 B4-dead** | 2026-08-24 | **B4 DEAD** (**DL-563**). Does not block IF-4. SC-0 list includes IKI Factory board card. |
| **v1.1 SC-0** | 2026-08-24 | Source Contract supersession (**DL-560 · DL-562**). IF-4 **smaller**: publication signal only; no envelope, no hook, no Help Package completeness gate. B4 closed. Gemba i9 realigned (wiki-board SC-0, not a Factory rewrite packet). |
| **v1.1 IF-1** | 2026-08-23 | **GO IF-1** + **B2** admin mount (**DL-559**). **GO IF-2 not granted.** |
| **v1.1 BUILD** | 2026-08-23 | Coach Phase 5 **BUILD AUTHORITY** (**DL-556**). GO checklist BUILD ticked. **GO IF-1 still open.** |
| **v1.1** | 2026-08-23 | Coach rewrote `agents/bench/gemba.md` to match v0.1.5. **IF-0 cancelled.** B3 absorbed. Charter is an input, not a packet. Allowlist forbids editing `gemba.md`. IF-2 depends on live principal + registry only. O7: Lima roster/`README` one-liner at GO SPEC. |
| **v1.0** | 2026-08-23 | First Juliet plan from Factory Spec v0.1.5. Incorrectly sequenced IF-0 on a stale charter. SUPERSEDED. |
