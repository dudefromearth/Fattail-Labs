# IKI Factory Spec v0.1.5 — Full Agent Bench Plan v1.0

**SUPERSEDED** 2026-08-23 by [`docs/IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md`](./IKI-Factory-Spec-v0.1.5-Full-Agent-Bench-Plan-v1.1.md). Coach rewrote `agents/bench/gemba.md`; IF-0 and B3 (stale charter) are cancelled. Keep this file as the v1.0 plan of record.

**Program:** IKI Lab (suite) · IKI Factory (inner app).  
**Spec of record:** [`Specs/FatTail Labs — IKI Factory Spec v0.1.5`](../Specs/FatTail%20Labs%20%E2%80%94%20IKI%20Factory%20Spec%20v0.1.5) **DRAFT** — not BUILD AUTHORITY.  
**Supersedes (plan, not spec):** [`docs/IKI-Factory-Full-Agent-Bench-Plan-v1.0.md`](./IKI-Factory-Full-Agent-Bench-Plan-v1.0.md) (written against Factory Spec **v0.1.2**).  
**Parents:** IKI Lab and Factory Spec v0.1 · Wiki Spec **v0.2** (Unified; v0.2.1 is the current Wiki packet) · North Star v1.2 (Invariant #8) · Public Data Service Spec v0.1 Part I · Agent Identity Spec v1.0.  
**Juliet.** Execution plan only. No product code until Coach stamps **BUILD AUTHORITY** on the spec **and** **GO IF-1**. Seeds are written in the same body of work as each GO, not before.

**Board (after GO):** `agents/p-iki-factory/` — not created until BUILD. Do not fold this into `agents/p-iki-lab/` (Runner chrome) or `agents/p-wiki/` (Wiki Agent).  
**Isolation (DL-539):** Factory writes stay in Factory domain + admin Factory surface + Gemba charter / principal. Wiki Agent `registration` **emit** and WooCommerce product **create** are named obligations. **Writes** into Wiki Agent consume path, Runner (`web/lib/runner/**`), Options Lab, Market Bus, Trade Log, or `AppChrome` need Coach naming plus three successive OKs where those trees are frozen.

---

## Up front

Nothing of Coach’s Factory Spec v0.1.5 is dropped. This plan does not invent a Factory job — v0.1.5 already seats it (admin Kanban + **Gemba** + **conveyor** + **complete Help Package** Deploy gate). It does **not** treat DRAFT as BUILD.

Coach Content Law (doctrine §11 · DL-176): objections sit beside Coach’s text, labeled. Blocks below are **sequencing**, not edits to the spec.

---

## What changed from plan v1.0 (spec v0.1.2 → v0.1.5)

| Spec v0.1.5 | Plan consequence |
|-------------|------------------|
| **OD-F8 Gemba seated.** Charter `agents/bench/gemba.md`. Principal `gemba`. Not Quebec, Bravo, Oscar, Golf, or a job-named “Factory Agent.” | Plan v1.0 **B3 (new archetype)** is **absorbed**. Seat exists. Remaining work is **charter alignment** to conveyor + OD-F10 (see **IF-0**) and a live `gemba` principal before IF-2. |
| **OD-F9 Conveyor.** Ideas→Research auto; Research→Spec **Admin only**; Spec→Build auto when Spec-ready + repo plan attached (unless Hold); Build→Deploy auto when Built-ready + product spec + **complete Help Package** (unless Hold). Every auto-move visible. Hold always available. Failures and missing inputs stop the belt. | IF-1 ships Hold + drag/click. Conveyor Spec→Build is **IF-3**. Conveyor Deploy is **IF-4**. IF15 / AT-IF-15 are first-class, not optional chrome. Plan v1.0 “Admin signals Build / Deploy” is **wrong** against v0.1.5. |
| **OD-F5 Plan attachment = Spec approval.** No separate approval act downstream. | IF-3 must not invent a second Approve button. Attaching the repo plan **is** the approval. |
| **OD-F10 Help Package completeness.** Deploy requires every field the Wiki `registration` contract requires. Incomplete packages stop the belt. Deploy always carries enough to write a complete Wiki page. Deploy **triggers** the registration contract (push). Wiki-side poller is the acceptable bridge until the Factory hook ships (Wiki Spec OD-5). Wiki-side declares new vs update. | Plan v1.0 **O3** (“flag missing fields; do not block Live”) is **revoked**. IF-4 **blocks** on completeness. IF-4 end-to-end waits on Coach **directing** the IKI Template Help Package spec and **naming file + version** (same A5 as Wiki WU-3 / WA-5). No self-assign. `Specs/FatTail-Labs-Options-Lab-Template-Help-Package-Spec-v0_1.md` is **Options Lab Heatmap**, not this. |
| **Parents = Wiki Spec v0.2.** | Neighbor quote is Wiki Spec v0.2 / v0.2.1 II.1 `kind=registration`, not Wiki Agent v0.1.2 alone. |
| **IF-2+ cannot ship without live `gemba` principal + versioned skills registry.** | IF-1 may ship chrome + Idea cards + Hold without the research runner. IF-2 is the first packet that **requires** the principal. |
| **Commerce OD-F6 generalized** (already in v0.1.2; still law). WooCommerce is the platform-wide commerce entry point. Native Stripe superseded-unless-Coach-revives. INSTRUCTIONS.md §11.1 update is Lima, not product code. | Unchanged. Mike designs Labs → WP **product create**. No Stripe. |

---

## Juliet review (labeled)

Coach’s spec text stays in `Specs/`. Nothing below deletes it.

### Blocking for *sequencing* (not for spec content)

| # | Item |
|---|------|
| **B1** | Spec header is **DRAFT**. Reviewers in the spec are **PENDING** (India, Mike, Echo+Tango, Hotel, Delta). Sequential gates → Coach **Phase 5 BUILD** → Lima DL → **then** GO IF-1. This plan is not a spec stamp. |
| **B2** | Member pill `/app/iki/factory` stays **named soon** until Coach opens it (spec §2, OD-F7). The Kanban is **admin-only**. Juliet’s default mount: **`/admin/iki-factory`**. Tick below if Coach wants the board *on* the suite pill instead (still admin-gated). |
| **B3** | **Gemba charter is seated and stale.** `agents/bench/gemba.md` still laws the v0.1.2 belt: “strictly human-gated,” “Deploy only after explicit Admin authorization,” “Never auto-advance a card past Research. Never Deploy without explicit Admin signal,” “flag Help Package fields.” Spec v0.1.5 OD-F9/F10 contradict those sentences. **IF-0** (charter align) is required before IF-2/IF-3. Charter is also truncated (COMPLETION REQUIREMENTS stops after one checkbox; no COOPERATION / closer). Do not run conveyor code against the stale charter. |
| **B4** | **IF-4 end-to-end waits** until Coach **directs creation** of the IKI Template Help Package spec and **names file + version**. No self-assign. Completeness cannot be tested against an unnamed field list. Wiki WU-3 / WA-5 is the **receiver**; this program is the **emitter**. |
| **B5** | **Template live-path vs Runner freeze.** Spec §2 says deployed templates join the existing / future **template registration** path (no parallel corpus). As-built Runner registry is `web/lib/runner/registry.ts` — IKI Runner tree, DL-539. W0 must **quote** the live path. If that path is Runner, IF-4 does **not** write `web/lib/runner/**` without three successive OKs. Default until Coach ticks: Factory **Live record + Woo product + registration emit**; Runner consume is a **named later packet**, not silent coupling. |

### Coach dispositions (tick)

**B2 — Where the board lives**

- [ ] **Admin only** — `/admin/iki-factory` (plan default). `/app/iki/factory` remains the member soon page (`data-testid="iki-factory-soon"`).  
- [ ] **Suite pill** — replace `/app/iki/factory` with the board, still admin-gated (403 / empty for non-admin). Member pill is then the board, not “Coming soon.”

**B5 — Where a Live template lives (IF-4)**

- [ ] **Factory Live + emit only** (plan default). No Runner write in this program.  
- [ ] **Runner register** — Coach names `web/lib/runner/**` and records **three successive OKs (DL-539)** on the GO IF-4 token.

**B4 — Help Package spec (IF-4 stamp precondition)**

- [ ] File: `Specs/________________` version ________ (Coach fills; Juliet does not invent the name).

### Opinions (Coach may discard)

| # | Item |
|---|------|
| **O1** | Reuse **Content Board Kanban grammar** (drag, 44pt, HI tokens, column chrome) **not** `content_items` tables, Quebec columns, or `BoardKanban.tsx` in-place. Factory lanes are a different machine. New component under `web/components/admin/` Factory-named. |
| **O2** | First registered research skill can be a **stub** that fail-louds “no skills registered” until Coach names a skill (e.g. symbol-entity map / opportunity-finder). Do not silently invent research. Empty registry + Idea pickup → Idea card **Blocked** with reason (IF8). |
| **O3** | Conveyor tick = in-process poller (Quebec / Wiki Agent pattern). Do **not** add a MiniTwo launchd daemon for IF-1…IF-3 unless Foxtrot names it. |
| **O4** | Canonical hyphenated spec copy at BUILD: `Specs/FatTail-Labs-IKI-Factory-Spec-v0.1.5.md` pointing at the space/em-dash file Coach landed. Tools choke on the current filename. Lima, not a rewrite of Coach’s text. |
| **O5** | IF-1 auto-pickup = move Idea → Research **without** running skills (card shows “waiting for skills” / picked). IF-2 attaches the 24 h window. That matches spec §10 “IF-1 can ship before the full skills-pipeline runner.” |
| **O6** | Do not add a Spec “Approve” control. Plan attachment **is** approval (OD-F5). Echo: the attach control’s copy must say so, or Tango will see a missing gate that the spec forbids inventing. |

---

## Archetype — Gemba (already seated)

Spec OD-F8 closed the v1.0 question. **Do not create `agents/bench/factory.md`.** **Do not reuse Quebec / Bravo / Oscar / Golf.**

| Existing seat | Why it does not cover Factory |
|---------------|-------------------------------|
| **Quebec** | Content Vision → course/YouTube Kanban, HeyGen, `content_items`. Different lanes, different SoR. Two factories on one callsign collides. |
| **Bravo** | Course source packs. Not a versioned skill registry, not card materialization, not Woo Deploy, not conveyor. |
| **Wiki Agent / Oscar** | Downstream: git wiki pages from **contracts**. Factory **must not** write wiki pages (spec §7, §9). Wiki Agent consumes `registration` after Live. |
| **Alpha / Charlie** | Build the surface, API, job runner. They are not the 24 h research worker and do not own conveyor judgment. |
| **Golf** | Reserved (Ask Vexy). Do not steal. |

**Two layers, one callsign (Wiki Agent pattern):**

| Layer | Who | Job |
|-------|-----|-----|
| **Gemba (bench)** | Charter + IF-0 + “go to the Gemba” reviews | Owns the covenant. Does not write Charlie chrome. |
| **Gemba (runtime)** | Agent Identity principal `gemba` | Pickup, research window, ranking/materialization, intra-lane state, conveyor auto-advances, Deploy side-effects. Alpha implements the services; they **run as** `gemba`. |

**Charter debt (IF-0 must fix before IF-2):** align IDENTITY / MISSION / DOMAIN / Invariant 3 / Workflow 4 / Invariant 12 with OD-F9 + OD-F10:

- Ideas→Research **auto**.  
- Research→Spec **never** without Admin selection.  
- Spec→Build **auto** when Spec-ready + plan attached + not Hold. Plan attachment **is** Spec approval.  
- Build→Deploy **auto** when Built-ready + product type/tier/free-vs-paid + **complete Help Package** + not Hold.  
- Hold disables auto-advance. Every auto-move visible with reason. Missing inputs / timeout / error → Blocked/Failed, belt stops.  
- Deploy **pushes** `kind=registration` with the complete package. Gemba never writes wiki pages. Wiki-side poller is the bridge until the hook lands.  
- Complete the truncated COMPLETION / COOPERATION sections from `agent-template.md`.

`agents/bench/README.md` already lists Gemba but still says “human-gated Spec→Build→Live.” Root `AGENTS.md` roster does **not** list Gemba. Lima files both at IF-0 / GO SPEC.

---

## Intent (spec §0–§1)

Admin-only Kanban, fronted by **Gemba**, operated as a **controlled conveyor**. Admin deposits Ideas. Gemba auto-picks them, runs registered versioned skills ≤24 h, ranks findings, materializes top results (≤10 or fewer) as Research cards. **Only Admin** selects which Research cards go to Spec. Thereafter the belt moves when required inputs are present and the card is not on Hold: Spec-ready + repo plan → Build; Built-ready + product spec + **complete Help Package** → Deploy. Gemba deploys the template, creates the WooCommerce subscription product, makes it store-visible, and **delivers** the Wiki Agent `registration` contract. Every card carries Priority (Low / Medium / High) and full lineage. Failures, timeouts, and missing inputs stop the belt with a visible reason. Admin may Hold, Rework (Admin chooses destination), Archive, or override. Only **Live** is member-visible. No invention. No parallel knowledge store. WooCommerce only.

Success = **IF1–IF15** / **AT-IF-1…15**.

---

## What ships / what does not

**Ships (after BUILD + matching GO):**

1. Admin Kanban: Ideas → Research → Spec → Build → Live.  
2. Drag-and-drop + click-to-advance/detract; invalid moves stay put with a reason.  
3. Priority Low/Medium/High; owner; lineage; **Hold**.  
4. Gemba pickup + versioned skill registry (from IF-2).  
5. Spec draft; plan attachment as Spec approval; conveyor Spec→Build (IF-3).  
6. Conveyor Deploy when product spec + complete Help Package present: template Live + Woo subscription product + store visibility + **registration push** (IF-4). Wiki-side poller acceptable until the push hook exists.  
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

---

## Store law

| Truth | Where |
|-------|--------|
| In-progress Factory work | **New** Factory tables (cards, lanes, priorities, lineage, agent actions, Hold, blocked reason, auto-move log). Spec §2: operational SoR. **Not** `content_items`. |
| Deployed templates | Existing / future **template registration** path. No second corpus. W0 quotes the path; B5 decides whether IF-4 writes Runner. |
| Wiki pages | Git only. Factory **emits** `kind=registration` (complete Help Package). Wiki Agent drafts the page and **declares** new vs update. |
| Commerce | WooCommerce subscription product only (OD-F6). Labs currently **receives** Woo webhooks; IF-4 **creates** products (outbound). |
| Skills | Versioned registry (OD-F3). Gemba may invoke only registered versions. |

---

## Already built — do not rebuild

| Piece | As-built |
|-------|----------|
| IKI suite nav + member Factory pill | `IkiSuiteChrome` · `/app/iki/factory` “Coming soon.” (`data-testid="iki-factory-soon"`). **DL-531 / DL-547**. |
| Content Board Kanban | `/admin/board` · `BoardKanban.tsx` · `content_items`. **Grammar only.** |
| Wiki Agent portal | `POST/GET /api/wiki-agent/contracts` · `wiki_contracts` · `contracts:deliver` (**DL-548…554**). `kind=registration` **receiver** is WU-3 / WA-5, not this board. |
| Wiki-side pollers | GET-only OD-5 pattern (**DL-549**). Acceptable **bridge** until Factory push. |
| Woo inbound | Identity / membership webhooks. **Not** product create. |
| Gemba charter file | `agents/bench/gemba.md` (stale vs conveyor — IF-0). |
| Agent Identity | `agent_principals` + `/admin/agents`. **No `gemba` principal yet.** |
| Runner registry | `web/lib/runner/registry.ts` — **out** unless B5 + three OKs. |

**Not built:** Factory tables, admin Factory board, Hold, conveyor, skill registry, `gemba` principal, research window, Spec/Build runner, Woo product create, Help Package completeness gate, registration **push**.

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
| **OD-F8** | Gemba / `gemba` / `agents/bench/gemba.md` | IF-0, IF-2 |
| **OD-F9** | Conveyor + Hold + visible auto-moves | IF-1 Hold; IF-3/IF-4 conveyor |
| **OD-F10** | Complete Help Package required for Deploy; push registration; poller bridge until hook | IF-4; B4 |

**Already house law (do not reopen):** DL-539 isolation · WooCommerce-only commerce (CLAUDE.md; this spec generalizes) · Invariant #8 · WIK-D1 git wiki pages · W5 no agent publish · Family B firewall · OD-IKI-1 was “Factory job open” — **this spec is the close**, logged when Coach stamps BUILD.

---

## Critical path

```text
Coach: spec reviews + Phase 5 BUILD + Lima DL (OD-F1…F10, OD-IKI-1 closed)
  → W0 India/Mike/Echo inventory (read-only)
    → IF-0 Gemba charter align (India + Lima; Coach stamps charter)
      → GO IF-1
        → IF-1 Board + Ideas + Hold
          → IF-1-G Delta
            → GO IF-2  (needs live gemba principal + registry)
              → IF-2 Research
                → IF-2-G
                  → GO IF-3
                    → IF-3 Spec + Build + conveyor Spec→Build
                      → IF-3-G
                        → GO IF-4  (needs Help Package spec named + B5 ticked)
                          → IF-4 Deploy + Live + conveyor + registration push
                            → IF-4-G
                              → GO IF-5
                                → IF-5 Hardening → IF-5-G
```

Each phase: Coach stamp · DL · Delta ternary. Lima same day. **Never skip India or Delta.**

Wiki WU-3 (registration **consume**) is a **neighbor stamp**, not this critical path. Factory may emit into a portal that still fail-louds `kind=registration` until WU-3 lands — that is visible Blocked on the Factory card (IF8), not a license to write wiki pages.

---

## Phases (map spec §10)

### W0 — Inventory (read-only)

**India + Mike** (architecture + admin/auth). **Echo** looks at `BoardKanban.tsx` as **grammar**, not copy.

Prove, by artifact quote:

- Content Board tables vs Factory need (do not share `content_items`).  
- `/admin` session vs `useIsAdmin` vs agent bearer.  
- Woo webhook **inbound** vs needed **outbound** product create.  
- Wiki Agent envelope + `kind=registration` (Wiki Spec v0.2 II.1) + WA-5 / WU-3 status.  
- `/app/iki/factory` placeholder.  
- Gemba charter vs OD-F9/F10 (the stale sentences).  
- Runner registry path (feeds **B5**).  
- Agent Identity seed principals (no `gemba`).

**Does not write.**

### IF-0 — Gemba charter align (AT: OD-F8/F9/F10 honesty)

Required before IF-2. May run **parallel** with IF-1.

| Agent | Job |
|-------|-----|
| **India** | Diff `agents/bench/gemba.md` against spec §3.3–3.5, §5–7, OD-F9, OD-F10. List every sentence that still forbids conveyor or treats Help Package as optional. Charter remains Gemba — no rename. |
| **Lima** | Rewrite charter to v0.1.5 covenant; complete truncated COMPLETION / COOPERATION from `agent-template.md`; roster Gemba in root `AGENTS.md`; conveyor language in `agents/bench/README.md`. Nothing of Coach’s spec is dropped. |
| **Coach** | Stamps the aligned charter before GO IF-2. |

**Does not:** product schema, board UI, principal mint (that is IF-2 Mike).

### IF-1 — Board + Ideas (AT-IF-7, 11, 14; Hold chrome for IF15)

Spec §10: Kanban + drag/click + Idea cards + Priority + ownership + basic agent pickup + Hold. Proves IF7, IF11, IF14.

| Agent | Job |
|-------|-----|
| **Mike** | Admin-only API + page. Non-admin 403. Member `/app/iki/factory` unchanged unless B2 = suite pill. |
| **Alpha** | Migration: Factory cards, lanes, priority, owner, lineage, transitions (append-only), **Hold**, blocked/failed reason. Not `content_items`. Idea create. Optional pickup stub: auto-move Idea → Research **without** skills (O5). Reject Research→Spec unless actor is Admin. |
| **Echo** | Board HIG: five lanes, drag, click-advance/detract, empty Ideas, priority chips, Hold affordance, ≥44pt, tokens. |
| **Charlie** | Board UI at the B2 mount. Admin creates Idea. Drag/click with client+server validation. Invalid drop stays put; reason on the card. |
| **Tango** | Empty-state and Hold copy: workshop, not oracle. No profit claims. |
| **Kilo** | Isolation; invalid-move 422 + visible reason; non-admin 403; Hold persists across reload; Research→Spec as Gemba bearer rejected. |
| **Lima** | DL + spec honesty (as-built board path); AdminNav link (named overlap with admin chrome — seed lists `AdminNav.tsx`). |

**Gemba runtime:** not required to research in IF-1. Pickup stub is enough.

### IF-2 — Research (AT-IF-1, 2, 8, 10)

**Requires** Coach-stamped IF-0 charter **and** live `gemba` principal **and** versioned skills registry (spec §10).

| Agent | Job |
|-------|-----|
| **Mike** | Mint / seed principal `gemba` with Factory scopes (and `contracts:deliver` when IF-4 needs it — may wait IF-4). Not an admin cookie. |
| **Alpha** | Skill registry table (id, version, status). Research window (24 h from pickup). Findings JSON on Idea; child Research cards ≤10 with rank + reason + sources; remainder on parent. Empty registry → Blocked on Idea, no padding. |
| **Charlie** | Research lane chrome: rank, reason, sources; remainder on parent; fail/timeout/Blocked. |
| **Hotel** | Review default skill **output shape** (no advice, no profit claims). Does not author the skill. |
| **Kilo** | Empty registry fail-loud; window expiry visible; no padded 10; only registered versions invoked. |
| **Foxtrot** | Only if W0 says the window cannot be an in-process poller. Default: no new launchd (O3). |

**Default skill:** none until Coach names one. Pickup with empty registry is a **passing** IF-2 gate if the card Blocked reason is truthful.

### IF-3 — Spec + Build + conveyor Spec→Build (AT-IF-4, 5, 9, 15)

| Agent | Job |
|-------|-----|
| **Alpha** | On Admin Research→Spec: Gemba drafts Template Spec onto the card from proposal + sources + Admin notes; Spec-ready; notify owner. Conveyor: Spec-ready **and** repo plan ref attached **and** not Hold → auto-advance to Build; implement **only** against that plan + Spec; Built-ready; notify. No second approval column. Rework destination is Admin’s. Waiting-for-plan is a visible intra-lane state, not a silent stall. |
| **Charlie** | Spec-ready / Built-ready / waiting-for-plan / auto-move reason / Hold / Rework destination picker. |
| **Echo + Tango** | Visible auto-move feedback; attach-plan copy = approval (O6); Hold is obvious. |
| **Kilo** | No auto Research→Spec; conveyor Spec→Build only with both inputs and not Hold; Hold blocks then resumes; Gemba cannot choose Rework lane; plan attachment treated as approval (no extra flag required). |

### IF-4 — Deploy + Live + conveyor + registration (AT-IF-6, 13, 15)

**Requires** B4 (Help Package spec named) **and** B5 ticked. Wiki WU-3 may still be unstamped — then push is attempted, wiki fail-loud is a Factory **Blocked** reason, Gemba does not write pages.

| Agent | Job |
|-------|-----|
| **Mike** | WooCommerce **product create** design (HMAC, fail-loud, no Stripe). `gemba` `contracts:deliver` for the portal POST. |
| **Alpha** | Deploy transaction: Live template (per B5) + Woo subscription product + store visibility + **POST** `kind=registration` with complete Help Package. Conveyor fires when Built-ready + product type/tier/free-vs-paid + **complete** package + not Hold. Incomplete package → stay in Build, visible “waiting for Help Package.” |
| **India** | Quote Wiki registration contract field list from the **named** Help Package spec (artifact quote, not a table assertion). Completeness checker is that list. |
| **Hotel** | Live artifact + package strings: no profit claims, no invented fit. |
| **Kilo** | Deploy without product spec **or** incomplete package rejected; Hold blocks Deploy; non-Live never member-listed; registration payload completeness; no wiki page files written from Factory tests. |

**Wiki Agent tree:** emit-only from this board. Poller bridge: if push is not yet wired, wiki-side GET of Factory Live/read API is the OD-5 stand-in — implemented on the **Wiki** board (WU-3), not by editing Wiki from Factory seeds.

### IF-5 — Hardening (AT-IF-3, 8, 12, 14, 15)

Lineage queries; notification reliability (existing admin notify plane); failure injection (timeout, empty registry, incomplete package, Woo create fail, portal reject); Hotel pass on agent-drafted strings; drag invalid-move matrix; Hold reliability (set, conveyor skipped, clear, conveyor resumes); Help Package completeness gate; auto-move reason always present.

---

## Seeds (written when the matching GO is stamped)

| Seed | Agent | Depends | Feeds |
|------|--------|---------|-------|
| W0-1…3 | India, Mike, Echo | GO SPEC / BUILD | B2/B5 ticks, IF-0 |
| IF-0-1 | India | BUILD | IF-0-2 |
| IF-0-2 | Lima | IF-0-1 | Coach charter stamp · GO IF-2 |
| IF-1-0 | India | **GO IF-1** | schema + conveyor state machine (no auto Research→Spec) |
| IF-1-1 | Mike | GO IF-1 | IF-1-2 |
| IF-1-2 | Alpha | IF-1-0, IF-1-1 | IF-1-4 |
| IF-1-3 | Echo | GO IF-1 | IF-1-4 |
| IF-1-4 | Charlie | IF-1-2, IF-1-3 | IF-1-5 |
| IF-1-5 | Kilo | IF-1-4 | IF-1-G |
| IF-1-6 | Lima | IF-1-G | DL + AdminNav honesty |
| IF-2-* | Mike, Alpha, Charlie, Hotel, Kilo | **GO IF-2** + IF-0 stamped + `gemba` | IF-2-G |
| IF-3-* | Alpha, Charlie, Echo, Tango, Kilo | **GO IF-3** | IF-3-G |
| IF-4-* | Mike, Alpha, India, Hotel, Kilo | **GO IF-4** + Help Package spec named + B5 | IF-4-G |
| IF-5-* | Alpha, Kilo, Hotel | **GO IF-5** | IF-5-G |

Juliet writes pasteable seeds **in the same body of work as each GO**, not before. IF-3 seeds **must** encode plan-attachment-as-approval and conveyor-unless-Hold as settled spec, not as an OD.

---

## File allowlists (proposed — freeze at each GO)

Exact list is W0 output. Direction:

| Area | Likely paths | When |
|------|----------------|------|
| Gemba charter | `agents/bench/gemba.md` · `agents/bench/README.md` · root `AGENTS.md` | IF-0 |
| Admin UI | `web/app/admin/iki-factory/` · `web/components/admin/` Factory board (**new**; do not edit `BoardKanban.tsx` unless Coach ticks reuse-in-place) · `web/components/admin/AdminNav.tsx` (one link) | IF-1 |
| Member pill | `web/app/app/iki/factory/page.tsx` | **only if B2 = suite pill** |
| API | `server/routes/` Factory admin router (**new**) | IF-1 |
| Domain | `server/` Factory domain + conveyor + registry modules (**new**) | IF-1…IF-4 |
| Schema | `migrations/NNN_iki_factory*.sql` | IF-1, IF-2 |
| Agent identity | principal `gemba` seed / admin Agents page | IF-2 |
| Tests | `server/tests/test_iki_factory*.py` · web characterization | each slice |
| Docs | this plan · Lima DL · spec status flip on BUILD · INSTRUCTIONS.md §11.1 pointer (Lima) | GO SPEC / IF-4 |
| Wiki portal | `POST /api/wiki-agent/contracts` **client from Factory** | IF-4 emit only |
| Runner | `web/lib/runner/**` | **never** unless B5 + three OKs |

**Never in these packets unless named:** `web/lib/runner/**` · Options Lab · Market Bus · Trade Log · `AppChrome` · `BoardKanban.tsx` internals · wiki git write · `content_items`.

---

## Neighbor boards (India artifact-quote rule)

| Assertion | Quote from |
|-----------|------------|
| Wiki Agent `registration` contract | Wiki Spec v0.2 / v0.2.1 **II.1** + portal as-built `server/routes/wiki_agent.py` + WU-3 / WA-5 **unstamped** until Help Package spec named |
| Member Factory pill is soon | `web/app/app/iki/factory/page.tsx` as-built |
| Content Board is a different Kanban | Content Board Spec v1.0 + `/admin/board` |
| WooCommerce is commerce SoR | Factory spec v0.1.5 header + OD-F6 · CLAUDE.md commerce |
| Gemba is the Factory Agent | Factory spec OD-F8 + `agents/bench/gemba.md` (after IF-0: conveyor sentences) |
| Isolation | **DL-539** · this plan header |
| Help Package field list | **Named** IKI Template Help Package spec (B4) — **not** Options Lab Heatmap Help Package |
| OD-5 poller bridge | Wiki Spec v0.2 II.3 + Factory spec §9 |

Do not assert “Wiki Agent PASS on registration” without quoting `agents/p-wiki/` / Wiki Spec v0.2.1 plan **WU-3** row.

---

## Notifications (spec §8)

- **Primary:** on the card (auto-move reasons, blocked/failed reasons, Spec-ready, Built-ready, waiting-for-plan, waiting-for-Help-Package).  
- **Secondary:** owning Admin, existing admin notification plane (`AdminNotifications` / the path already used for admin). No new channel in IF-1.  
- Notify on: Spec ready, Build complete, conveyor move, failure/block/escalation.

---

## Gates

| Gate | Evidence |
|------|----------|
| **R0 / BUILD** | Review notes; Coach stamp on spec v0.1.5 + OD-F1…F10; Lima DL (OD-IKI-1 closed); B2 ticked |
| **IF-0** | Charter text matches conveyor + OD-F10; COMPLETION section complete; `AGENTS.md` lists Gemba; bench README conveyor language; Coach stamp on charter |
| **IF-1-G** | Admin creates Idea; non-admin 403; drag/click; invalid Research→Spec as agent rejected; Hold sets; member pill unchanged unless B2; not `content_items` |
| **IF-2-G** | `gemba` principal live; empty registry → Blocked with reason, **zero** invented findings; window expiry visible; ≤10 cards, remainder on parent; only registered versions |
| **IF-3-G** | Admin-only Research→Spec; Spec-ready + notify; plan attach auto-advances unless Hold; no extra Approve; Rework destination is Admin’s; auto-move reason on card |
| **IF-4-G** | Incomplete Help Package stays in Build with reason; complete + product spec + not Hold → Live + Woo product + store visible + registration POST (or documented poller bridge); no wiki page bytes from Factory; non-Live not member-listed |
| **IF-5-G** | Lineage query; injected failures visible; Hotel grep clean; Hold skip + resume; invalid-move matrix |

Delta never modifies work under review. Verdicts: **PASS / FAIL / BLOCKED**. A waived gate is a doctrine violation.

---

## Out of scope until Coach names it

- Member-facing Factory workflow (unless B2 = suite pill).  
- Factory choosing Rework destination.  
- Padding research to 10.  
- Stripe.  
- Second wiki store / Gemba writing pages.  
- IKI Template Help Package spec (Coach directs file + version).  
- Runner registry writes without B5 + three OKs.  
- DL-539 frozen trees without three OKs.  
- MiniTwo / production deploy unless Coach names the host.

---

## GO checklist (Coach)

- [ ] Spec reviews complete (or Coach expedites like DL-457 / DL-479, **named**).  
- [ ] Phase 5 **BUILD AUTHORITY** + Lima DL (OD-F1…F10 as stamped; **OD-IKI-1 closed**).  
- [ ] **B2** mount ticked.  
- [ ] **IF-0** charter stamped (required before GO IF-2).  
- [ ] **GO IF-1**.  
- [ ] Later, separately: **GO IF-2** · **GO IF-3**.  
- [ ] **B4** Help Package spec file + version filled **before** GO IF-4.  
- [ ] **B5** Live-path ticked **before** GO IF-4.  
- [ ] **GO IF-4** · **GO IF-5**.  
- [ ] **Amend**  
- [ ] **Stop**

**Signed:** Juliet (plan v1.0 against Factory Spec v0.1.5 — **no build authority**)  
**Date:** 2026-08-23

---

## Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0** | 2026-08-23 | Juliet plan from Factory Spec **v0.1.5**. DRAFT spec. Gemba seated (OD-F8); charter align is IF-0. Conveyor OD-F9. Help Package completeness OD-F10; IF-4 blocked on named Help Package spec. Plan attachment = Spec approval. Registration **push**; wiki poller bridge until hook. Admin board default `/admin/iki-factory`. Supersedes Factory plan v1.0 (spec v0.1.2). |
