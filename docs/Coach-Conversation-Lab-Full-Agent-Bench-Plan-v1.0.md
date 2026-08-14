# Coach Conversation Lab & ConversationSurface — Full Agent Bench Plan v1.0 (rev **v1.1**)

**Date:** 2026-08-13
**Owner (orchestration):** Juliet
**Authority:** Coach (GO / ship)
**Board:** [`agents/p-coach-conversation-lab/`](../agents/p-coach-conversation-lab/)
**Plan revision:** **v1.1** — folds advisor review of plan v1.0 (B-CL1 `POST /greet` · husk-reset · DL receipt citation)
**Spec:** [`Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md`](../Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md) — **BUILD AUTHORITY** · **DL-327**.
**Advisor reviews:**
- Spec rev 1: [`docs/Advisor-Review-Coach-Conversation-Lab-Spec-v0.1-2026-08-13.md`](./Advisor-Review-Coach-Conversation-Lab-Spec-v0.1-2026-08-13.md)
- Spec rev 2: [`docs/Advisor-Review-Coach-Conversation-Lab-Spec-v0.1.1-2026-08-13.md`](./Advisor-Review-Coach-Conversation-Lab-Spec-v0.1.1-2026-08-13.md) — H1–H4 + S1–S7 folded; P1–P8 resolved in this plan
- Plan v1.0: [`docs/Advisor-Review-CL-Bench-Plan-v1_0-2026-08-13.md`](./Advisor-Review-CL-Bench-Plan-v1_0-2026-08-13.md) — **B-CL1 blocking**; advisories 1–5 folded here
**Visual law (Coach, binding):** [`docs/references/coach-lab-imessage-reference.jpg`](./references/coach-lab-imessage-reference.jpg) — source `/Users/ernie/Pictures/msg.jpg`
**Design frame:** [`Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md`](../Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md)
**Parents:** Defect Artifact 2026-08-13 §2 (G1–G4) · Journal Session v0.6 §1.4 · Human Interface Spec v1.0 (tokens/HIG; messaging pane is a named G4 exception)
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · overrule-not-waive · evidence over assertion

Specialists execute **only** via seeds. Coordination through **Coach** or **Juliet**.
Delta gates: **PASS / FAIL / BLOCKED** — never waived.

**Charter scope (this plan):** **CL-0 → CL-4** (component + lab page + proxy + persist/export + controls).
**Later, same spec, not this critical path:** **CL-V** voice (§7 / S7).

**Fenced — do not implement:**
- Journal remount onto `ConversationSurface` (own gated packet; this GO is not license)
- Member Journal / member Retro ingest of `coach_lab_*` (H4)
- B-Name resolution · heat gate · B-Journey-Feed · B-Personalize · B-Campaign-bind
- Voice Path A/B (toggle stays disabled-with-reason)
- Real instruction set / Stage 3 character page

---

## 0. Mission

Build two things, cleanly separated:

1. **`ConversationSurface`** — a reusable, journal-agnostic messaging component whose look is the Coach-supplied iMessage thread, **replicated, not re-skinned**. Record discipline is a **host contract**. The component never grows a store.
2. **`/admin/coach-lab`** — an administrator-only test harness that mounts the component, talks to xAI through a server proxy, persists per-admin transcripts, and exposes instruction / model / effort / color controls.

Success is the Chris-thread test (spec §8 A): open the lab cold → typing indicator → greeting by name, from a named sender with an avatar, in a bubble, in big regular-weight type. If the honest reaction is “someone texted me — I should reply,” Stage 1 passes. If it reads as a form with decorations, it fails regardless of the checklist.

---

## 1. Authority chain (CL-0)

```
Coach GO (this plan v1.1 + spec rev 2)
    │
    ▼
Lima — same day
    1. Spec BUILD AUTHORITY + filename land
    2. DL entry: Conversation Lab v0.1 + ConversationSurface host contract
       + B-CL1 `POST /greet` + husk-reset
       + **verbatim:** fake “Read” receipt is lab-only chrome and must not remount
         onto the member Journal without a real meaning (advisory 2)
    │
    ▼
Juliet — freeze board, fire CL-1 (visual) and CL-2 (schema) in parallel
```

Until that DL exists, **no lab routes ship** and `SessionInterviewChat` is untouched.

---

## 2. Visual law — the message area is the screenshot

**Normative still:** [`docs/references/coach-lab-imessage-reference.jpg`](./references/coach-lab-imessage-reference.jpg)

Coach direction (2026-08-13), binding on Echo + Charlie:

> The message area has this look and feel. Same weight fonts, same roundness of the talk bubbles, same date-time and status messages, same text entry, **sized for the interface**.

This is G4 made buildable. Side-by-side with the reference, a viewer should not be able to say which is which at a glance for **bubbles, geometry, color, and type**. Two deliberate deviations stay (spec §2.1 / S3):

- Per-bubble timestamps always rendered (Journal v0.6 §1.4, never hover-only).
- Conversation-started header stamp as the first thread element.

Do **not** restyle the thread in Labs emerald / zinc chrome. Human Interface Spec v1.0 canvas-never-pure-white applies to the **admin page around** the pane, not inside it. The messaging pane is a named G4 exception: iMessage white thread on a Labs canvas.

### 2.1 Size for the interface (do not stretch a phone)

The reference file is **1125×2436 @3×** (iPhone logical **375×812**).

| Rule | Value |
|------|--------|
| Thread column | **375–420 CSS px** wide (1:1 with the phone canvas). Never let bubbles span a 1600px admin content well. |
| Message type | **17px**, regular **400**. Not 13px form text. Not 22px hero type filling a desktop pane. |
| Line-height | **1.25** |
| Bubble max-width | **~75%** of the thread column |
| Composer | Same pill + `+` circle as the screenshot, **scaled to that column**, not to the page. |

The lab page may be wide. The **conversation** stays a messaging column. Controls live under / beside it and recede (G2).

### 2.2 Tokens Echo locks in CL-1-0 (from the reference)

Measured / iOS-system matches for this still. Echo confirms against the file; Charlie implements **only** these tokens (plus optional `appearance` overrides).

| Token | Value | Role |
|-------|--------|------|
| `--cs-thread-bg` | `#FFFFFF` | Thread canvas |
| `--cs-outgoing-bg` | `#34C759` | iMessage green (screenshot family) |
| `--cs-outgoing-fg` | `#FFFFFF` | Outgoing text |
| `--cs-incoming-bg` | `#E9E9EB` | Incoming fill |
| `--cs-incoming-fg` | `#000000` | Incoming text |
| `--cs-meta` | `#8E8E93` | Day/time separators, “Read …”, conversation stamp |
| `--cs-composer-fill` | `#F2F2F7` | Pill field fill |
| `--cs-composer-placeholder` | `#C7C7CC` | “Message” / “Text Message” |
| `--cs-plus-ring` | `#C7C7CC` | `+` circle stroke |
| `--cs-radius-bubble` | **18px** | Long-bubble corner. Short bubbles are **pills** (`border-radius: 999px` / height/2). |
| `--cs-tail` | small notch, **lower-right** outgoing / **lower-left** incoming | Not a CSS triangle afterthought — match the screenshot’s tail. |
| `--cs-type` | `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif` | Same stack as HIS §4.3 |
| `--cs-weight-message` | **400** | Regular. **Never** 500/600/semibold on bubble copy. |
| `--cs-weight-name` | **600** | Name pill + avatar initials only |
| `--cs-size-message` | **17px** | |
| `--cs-size-meta` | **12px** | Separators, receipts, stamp |
| `--cs-header-avatar` | **56px** circle | Initials or static mark |
| `--cs-name-pill` | overlapping the avatar bottom, capsule + chevron | |
| `--cs-back` | 36px circular outline, inert chevron | Chrome only |
| `--cs-composer-height` | **36px** pill | |
| `--cs-plus` | **36px** circle | |

**Font weight is a gate.** Semibold bubbles fail CL-1-G even if colors match.

### 2.3 Date-time and status (same idiom as the still)

Render these **exactly** as iMessage chrome, gray `#8E8E93`, centered or trailing as in the file:

1. **Conversation stamp** (spec addition, first element): `Conversation started Aug 13, 2026 · 9:58 PM` — centered, separator style. Comes from optional prop `startedAt` (P8).
2. **Day/time separators** between groups: `Yesterday 5:27 PM` — relative day + time, centered. Cadence: new separator when the calendar day changes **or** a gap ≥ ~1 hour (Echo locks the gap in CL-1-0; do not invent a third rule later).
3. **Read / status** under the latest **outgoing** bubble, trailing: `Read Yesterday` (or `Delivered` / `Read` + relative day). Decorative in the lab — the model did not “read” anything — but the chrome is part of the feel test. Do **not** carry a fake receipt onto a later member remount without a real meaning (opinion recorded; not this charter).
4. **Per-bubble time** (deliberate G4 deviation): every bubble carries a rendered time, 12px, same gray, never hover-only.

### 2.4 Composer (same entry, interface-sized)

Match the still, not a Labs `<Button>` + textarea:

- Circular **`+`** at left (thin ring, plus). Lab: opens voice when enabled (CL-V); until then a quiet “coming soon” no-op **in the lab only**.
- Fully rounded **pill field**. Placeholder **≤ 2 words** (`Message`). 17px input text, regular weight.
- iMessage send: **green filled circle + white up-arrow appears when the field is non-empty**; empty field shows no send (the still’s rest state). Keyboard: **Enter sends**, Shift+Enter newline. Visible focus ring.
- Dictation waveform on the still is **not** required until CL-V. Do not draw a dead mic.

### 2.5 Contact header

iMessage-style, inside the thread column:

- Inert back chevron, left.
- Centered circular avatar: **provided static mark** (lab-page asset path). Never a generated portrait. If the mark is initials, they are host-supplied via `senderIdentity`.
- Name pill under/overlapping the avatar: host string. Lab passes `"Coach · Lab"` (internal). Component ships **no “Coach” literal** (S2).

### 2.6 Motion

- New incoming bubble rises in 150–250ms (received-text feel).
- `prefers-reduced-motion`: opacity only.
- Typing: three-dot bounce in an incoming gray bubble.

### 2.7 Fixed-height session (v0.6 §1.4 verbatim)

Bounded scroll region. Page never grows. Scroll-to-bottom on new messages unless the reader has scrolled up. Reopen lands at latest. No scroll chaining. Composer always reachable without page scroll.

---

## 3. Component contract (build this, nothing more)

`web/components/conversation/ConversationSurface.tsx` — **not** under `journal/`.

```
messages[]     { id, direction: 'incoming' | 'outgoing', body, at }
senderIdentity { name, avatarUrl }
onSend(text)
typing: bool
onPlusTap()
sendKey        'enter' | 'mod-enter'   // lab: enter; Journal later: mod-enter
startedAt?     ISO / Date              // conversation stamp
appearance?    { incomingBg, incomingText, outgoingBg, outgoingText }
voice?         handlers                // unused until CL-V
unavailableCopy?  string               // host; lab: "Coach is unavailable — check the lab config"
```

**Purity law (grep-gated):**
- No `"Coach"` literal.
- No fetch, no store, no journal/retro imports.
- Persistence is the host’s job (H3).

Host maps roles: lab `coach|trader` → `incoming|outgoing`. Journal later maps `agent|member`. No schema fight at remount (S1).

---

## 4. As-built substrate (honest)

| Piece | As-built | This program |
|-------|----------|--------------|
| `/admin` shell + `NAV` | Shipped | Add **Coach Lab** link; do not invent a second shell |
| `SessionInterviewChat` | Journal v0.7 thread | **Do not touch** |
| `server/ai` `complete()` / `XaiProvider` | Chat completions, no `reasoning.effort` | Lab proxy **may** call xAI directly or extend the provider **with an explicit effort argument**. Do not silently change Help / Journal / P2 studio calls |
| `XAI_API_KEY` · `XAI_API_BASE` | Boot-required for primary AI when configured | **`LABS_COACH_LAB` unset → lab routes absent and missing XAI_* must not abort the wider API.** Set → missing XAI_* aborts (S5) |
| Journal v0.7 heat / drafts / extract | Shipped | Untouched. Remount is a later packet |
| Admin journal-prompts | Versioned production prompts | Untouched. Lab instruction is `coach_lab_config`, not that table |

---

## 5. Implementability resolutions (advisor P1–P8 — now plan law)

| ID | Resolution |
|----|------------|
| **P1** | Chat proxy sends **instruction + server-held turns + new user text**. Client history is not the SoR. |
| **P2** | Persist `model` + `effort` **per message**. Conversation row keeps the **opened-with** snapshot. Export JSON includes both. |
| **P3** | Optional `appearance` prop; screenshot tokens are fallbacks. |
| **P4** | Defaults meet 4.5:1. Custom pairs warn, do not block. G3 binds anything promoted later. |
| **P5** | No **member** Journal / Retro / production path reads `coach_lab_*`. Lab-to-lab same-admin read is a later program. |
| **P6** | Routes named in §7. |
| **P7** | Wire effort as `low \| medium \| high \| xhigh`. UI may show “x-high”. |
| **P8** | `startedAt` is an optional component prop so the stamp lives **inside** the thread. |
| **B-CL1** | `POST /greet` is the **only** arrival-greeting mechanism. Idempotent: zero coach turns → generate and persist the greeting (first-name / no-name; **stamped with this call’s model + effort**, same as any coach turn). Otherwise **200 no-op**. `POST /reset` calls this path after opening the new row. Page load must not POST empty `/chat` and must not `/reset` to force a greeting. |

---

## 6. Phase graph

```
CL-0  Lima DL + spec BUILD + filename land + India contract sign
  │
  ├──► CL-1  ConversationSurface (Echo tokens → Charlie)     ◄── visual critical path
  │
  └──► CL-2  Schema + config + enable flag (Alpha · Mike)
           │
           ▼
         CL-3  Proxy + persist + greet + reset + export (server-held SoR)
           │
           ▼
         CL-4  Lab page mounts surface + controls + greeting
           │
           ▼
         CL-G  Charter Delta gate (CL-0…CL-4)
           │
           ⋮  later, same spec
         CL-V  Voice (S7)
```

**Critical path:** `CL-0 → CL-1` (feel test) and `CL-0 → CL-2 → CL-3 → CL-4` (talk + record).
**CL-4 needs both CL-1 and CL-3.**
**CL-1 may proceed with fixture messages** — do not block the visual on the proxy.

---

## 7. Server surface (admin-gated, 403 otherwise)

All under `/api/admin/coach-lab`. Role `administrator` only. Absent `LABS_COACH_LAB=1` → routes **not registered**.

| Method | Path | Job |
|--------|------|-----|
| `GET` | `/config` | Current global config + `instruction_version` |
| `PUT` | `/config` | Instruction / model / effort / colors / voice_enabled. Instruction bump `instruction_version`. Voice on without `XAI_VOICE_*` → refuse loud |
| `GET` | `/conversation` | This admin’s current open conversation + messages |
| `GET` | `/conversations` | This admin’s past conversations (start stamp + first line) |
| `GET` | `/conversations/{id}` | One conversation, read-only (must be `started_by` = caller) |
| `POST` | `/chat` | Persist user text; call xAI with server-held history; persist reply. Body: `{ text }` only. **Not** a greeting path — empty text is 400 |
| `POST` | `/greet` | **B-CL1.** Ensure an open conversation for this admin (create-if-none, same as GET). If that row has **zero coach turns**, generate and persist the arrival greeting (first-name / no-name; persist as a coach turn with **this call’s** `model` + `effort`). If any coach turn already exists → **200 no-op**. Returns the current conversation + messages. Idempotent under double-mount / rapid retry |
| `POST` | `/reset` | **Husk law:** if the current conversation has **zero trader turns**, **discard** it (do not archive). Otherwise close-and-store. Open a new stamped row. Then call the same greet path. Never `/reset` to obtain the first greeting on a fresh load |
| `GET` | `/conversations/{id}/export.md` | Markdown: stamped header, timestamped turns, speaker labels |
| `GET` | `/export.json` | All of this admin’s conversations + messages + start snapshot + per-message model/effort |

**Schema (migration next-free NNN — 128 expected if nothing else lands first):**

```
coach_lab_conversations
  id, started_by identity_id, started_at, ended_at NULL,
  instruction_version, model, effort          -- opened-with snapshot

coach_lab_messages
  id, conversation_id, role ENUM('coach','trader'),
  body_md, at, model, effort                  -- per-turn (P2)

coach_lab_config
  id (=1), instruction_text, instruction_version INT,
  model VARCHAR, effort ENUM('low','medium','high','xhigh'),
  voice_enabled BOOL DEFAULT 0,
  coach_bubble_bg, coach_bubble_text,
  trader_bubble_bg, trader_bubble_text,
  updated_by, updated_at
```

Default instruction = spec §5.1 Yogi greeter (lab-only). Default colors = §2.2 tokens. Seeded on first migrate.

Closed model list from server config (`coach_lab_models`). Spec examples: `grok-4.20`, `grok-4.20-multi-agent` (documented aliases as of 2026-08-13). **Verify against current xAI docs at CL-3 build.** Wrong model string fails loud at call time and surfaces in the lab — never 200-with-nothing.

Env:

```
LABS_COACH_LAB=1                 # enable; unset = no routes, no XAI abort
XAI_API_KEY · XAI_API_BASE       # required (boot-abort) only when enabled
XAI_VOICE_*                      # only if voice_enabled; CL-V
```

---

## 8. Sacred invariants (all seeds)

1. Admin-only. Page and APIs 403 otherwise.
2. `ConversationSurface` is journal-agnostic. No journal/retro imports. No “Coach” literal.
3. Persistence is a host contract. Component never grows a store.
4. Server-held transcript is the SoR (P1).
5. Conversations are per-admin (`started_by`). Config is global.
6. No member Journal / member Retro / member production path reads or writes `coach_lab_*` (H4 / P5).
7. `LABS_COACH_LAB` off → no lab routes; missing `XAI_*` must not abort the wider API.
8. Fail loud: missing enable-time config, unknown model, unknown effort key.
9. Heat gate is Journal law — not applied here.
10. B-Name untouched. Lab label is internal.
11. This GO is not a Journal remount.
12. Visual law is the reference still. Semibold bubbles, Labs-chrome bubbles, or a stretched full-width thread **fail** CL-1-G / CL-G.
13. **B-CL1:** arrival greeting only via `POST /greet`. Idempotent. Greeting turn is a persisted coach message with per-turn model+effort.
14. **Husk-reset:** zero trader turns → discard on reset, not store. Record discipline is for conversations that happened. India confirms at CL-0-2.
15. Evidence over assertion. No waived Delta gates.
16. Declare exact files before touch.

---

## 9. Seed catalog

Every seed: project · agent · depends · intent · files · invariants · completion · gate.

### PHASE CL-0 — GO lock + DL + contract

| Seed | Agent | Intent | Completion | Gate |
|------|-------|--------|------------|------|
| **CL-0-0** | **Lima** | Promote spec to BUILD AUTHORITY. Land filename as `Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md` (or keep `v0_1_1` and fix the header to match). Archive/delete the spaced DRAFT. DL entry: lab v0.1 + host-contract persistence + H4 ban + visual law pointer to the reference still + **B-CL1 `POST /greet`** + husk-reset. **Carry this sentence verbatim:** the fake “Read” receipt is lab-only chrome and must not remount onto the member Journal without a real meaning. | One current spec file; DL number in `Architecture/00-decision-log.md` | pre-impl |
| **CL-0-1** | **Juliet** | Board freeze; seed index; mark Journal remount / voice / B-* as fenced | `ORCHESTRATOR.md` current | pre-impl |
| **CL-0-2** | **India** | Sign: component contract §3 · schema §7 · P1 server-held SoR · P2 per-message model/effort · P5 member-path ban · **route list including `POST /greet` (B-CL1)** · husk-reset (zero trader turns → discard). Written APPROVED. | Written APPROVED | CL-0-G |
| **CL-0-G** | **Delta** | Spec+DL+plan consistency; charter = CL-0…CL-4 only; visual law cited; remount fenced; **B-CL1 `/greet` in the route table** | `CL-0-G` PASS | **CL-0-G** |

**CL-0 exit:** BUILD AUTHORITY · DL · CL-1 and CL-2 unblocked.

---

### PHASE CL-1 — ConversationSurface (visual critical path)

Depends: CL-0. Does **not** depend on CL-2. Charlie uses fixture `messages[]`.

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **CL-1-0** | Echo | — | Token lock from the reference still (§2.2–2.6). Written token table + separator-gap rule + “sized for the interface” column width. Side-by-side notes. HIS exception named (messaging pane may be pure white). | `web/components/conversation/conversationTokens.ts` (or CSS variables file) + short `docs/` or seed note | CL-1-G |
| **CL-1-1** | Charlie | Echo | Build `ConversationSurface` to the token lock. Fixture page or Story **or** a temporary fixture mount is fine. Grep: no `"Coach"`, no fetch/store, no journal/retro imports. | `web/components/conversation/ConversationSurface.tsx` · tokens · (optional) fixture | CL-1-G |
| **CL-1-2** | Charlie | Echo | Composer, header, typing, entrance, fixed-height §2.6–2.7, `sendKey`, `startedAt`, optional `appearance`. Reduced-motion. Focus rings. | same | CL-1-G |
| **CL-1-3** | Echo | Tango | Side-by-side review against the still: weight, radius, tails, separators, “Read …”, pill entry. **Sized for the interface** (375–420px column). Semibold bubbles = FAIL. | review note in gate-reports | **CL-1-G** |

**CL-1-G (Delta):** screenshot of the surface next to the reference still; grep purity; 1-message and 40-message height identical in the fixture; composer reachable; reduced-motion.

---

### PHASE CL-2 — Schema + config + enable flag

Depends: CL-0.

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **CL-2-1** | Alpha | India · Mike | Migration `coach_lab_*` (next-free NNN). Seed Yogi instruction + reference colors. `started_by` FK. Effort enum `xhigh`. | `migrations/NNN_coach_lab.sql` | CL-2-G |
| **CL-2-2** | Alpha | Mike | `LABS_COACH_LAB` gate: unset → no routes registered; set + missing `XAI_*` → boot abort. Do not abort the wider API when unset. | boot / `main.py` / route include | CL-2-G |
| **CL-2-3** | Alpha | Mike | `GET/PUT /config`. Instruction save bumps version + `updated_by` / `updated_at`. Voice on without voice env → refuse. Closed model list. | `server/routes/coach_lab.py` · domain | CL-2-G |
| **CL-2-4** | Kilo | — | Flag off: no routes, API boots without XAI_*. Flag on + missing key: abort. PUT bumps version. Non-admin 403. | `server/tests/test_coach_lab.py` | **CL-2-G** |

---

### PHASE CL-3 — Proxy + persist + export

Depends: CL-2.

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **CL-3-1** | Alpha | India | Current conversation = latest open row **for this admin**. Create on first GET if none. Two admins never share a thread. GET does **not** generate a greeting (empty row is lawful until `/greet`). | domain + GET `/conversation` · `/conversations` | CL-3-G |
| **CL-3-2** | Alpha | Mike | `POST /chat` body `{ text }`. Empty text → 400. Persist trader turn; call xAI with **instruction + server-held history + new text**; persist coach turn with **this call’s** model + effort (P2). Timeout bounded. Model-down → named error, no fake turn, no silent retry. Verify model strings against current xAI docs; fail loud on unknown. Attach `reasoning.effort` = wired `xhigh` etc. Do not change `complete()` callers that do not pass effort. | `server/routes/coach_lab.py` · xAI call path | CL-3-G |
| **CL-3-3** | Alpha | India | **B-CL1 `POST /greet`:** ensure open conversation; if **zero coach turns**, generate + persist arrival greeting (first-name token or no name; **never invent**); stamp that coach turn with this call’s model + effort. Else 200 no-op. Return conversation + messages. Shared helper — `/reset` must call it, not reimplement. | same | CL-3-G |
| **CL-3-4** | Alpha | India | `POST /reset`: **husk law** — zero trader turns → discard (delete), do not archive. Else close-and-store. Open new stamped row. Call the greet helper. | same | CL-3-G |
| **CL-3-5** | Alpha | — | Markdown + JSON export (start snapshot + per-message model/effort, including the greeting turn). Past conversations read-only; never resumed. | export routes | CL-3-G |
| **CL-3-6** | Kilo | India · Mike | Isolation: two admin fixtures, disjoint histories. Client-supplied history ignored. Empty display name → greeting without a name. Model-down named. Export snapshot + per-turn. **B-CL1:** fresh conversation + two rapid `/greet` → exactly one greeting persisted. `/chat` empty → 400. Reset of greeting-only (or empty) conversation → row discarded, not in past list; new row + one greeting. | tests | **CL-3-G** |

---

### PHASE CL-4 — Lab page

Depends: CL-1 + CL-3.

| Seed | Agent | Reviewer | Intent | Files (declare) | Gate |
|------|-------|----------|--------|-----------------|------|
| **CL-4-1** | Charlie | Echo | `/admin/coach-lab` mounts `ConversationSurface`. Thread column 375–420px. Standard admin shell + **Coach Lab** nav item. Header “Coach Lab” + Reset. **On load: `POST /greet` (typing until it returns) then render the conversation.** Do not POST empty `/chat`. Do not `/reset` to force the first greeting. Colors from config via `appearance`. `sendKey='enter'`. Static avatar mark (lab-owned asset). | `web/app/admin/coach-lab/page.tsx` · `web/lib/coachLabApi.ts` · `web/app/admin/layout.tsx` · static mark | CL-4-G |
| **CL-4-2** | Charlie | Echo | Collapsed-by-default **Lab controls** (remembered per admin locally): instruction editor, model, effort helper text, four color inputs + contrast warning + “Reset to reference”, voice toggle disabled-with-reason. Instruction applies on next Reset; model/effort on next message; colors on next render. | lab page / panel component | CL-4-G |
| **CL-4-3** | Charlie | — | Past-conversation list (start stamp + first line), read-only view. Markdown + export-all actions. Model-down inline notice (host string). | same | CL-4-G |
| **CL-4-4** | Tango | — | Grep: no member-facing routes, no journal copy leakage, Yogi instruction stays lab-only. Placeholder ≤ 2 words. | review note | CL-4-G |
| **CL-4-5** | Kilo | Echo · Tango | Non-admin 403 on page + APIs. Reload lands at latest. Page height 1 vs 40. Contrast defaults ≥ 4.5:1. | tests + browser smoke | **CL-4-G** |

---

### PHASE CL-G — Charter close

| Seed | Agent | Intent | Gate |
|------|-------|--------|------|
| **CL-G-1** | Kilo | Full fixture pack green (flag, isolation, SoR, export, no-name, model-down, purity grep, **double `/greet` → one greeting**, husk discard) | CL-G |
| **CL-G-2** | Lima | As-built honesty: spec status, DL pointer, `docs/ADMIN-GUIDE.md` lab page + env | CL-G |
| **CL-G-3** | India | One-sentence APPROVED: Retrospective can mount `ConversationSurface` without modification | CL-G |
| **CL-G-4** | **Coach** | Chris-thread feel test (§8 A) against the reference still | CL-G |
| **CL-G** | **Delta** | Evidence: curl + tests + side-by-side still + grep no journal/retro reads + no remount | **CL-G PASS** |

**Charter exit:** lab talks, transcripts persist/export per-admin, surface matches the still at interface scale. Voice and Journal remount **not** required.

---

## 10. Trailing slice (same spec — do not pull into charter GO)

| Slice | Lands | Depends |
|-------|-------|---------|
| **CL-V** | Voice. Verify current xAI docs at build (Path A native vs Path B STT→chat→TTS). Transcript always renders as bubbles. Journal v0.7 §8 governs any later member graduation | Mike + xAI docs check |

---

## 11. Definition of Done (charter)

1. Spec BUILD + DL landed; one current filename in `Specs/`.
2. `ConversationSurface` matches the reference still (weight, radius, tails, separators, status, pill entry) in a 375–420px column.
3. Component grep-clean: no `"Coach"`, no store/fetch, no journal/retro imports.
4. `/admin/coach-lab` administrator-only; non-admin 403 on page and APIs.
5. `LABS_COACH_LAB` unset → no routes; API boots without `XAI_*`. Set → missing `XAI_*` aborts.
6. Arrival greeting only via `POST /greet` (B-CL1): first name or no name; static mark; typing indicator; greeting turn stamped with model+effort. Double greet → one row.
7. Per-admin isolation. Reset: zero trader turns **discarded**; otherwise close-and-store. Past threads read-only.
8. Server-held SoR. Per-message model/effort. Exports carry both snapshots.
9. Model-down named; composer alive; no fake turn.
10. Voice toggle disabled-with-reason.
11. No member/journal/retro store read or written. No Journal remount.
12. India reuse note. Coach feel-test. **CL-G PASS.**

---

## 12. Bench seating (charter)

| Callsign | Role |
|----------|------|
| **Coach** | GO, Chris-thread feel test, ship/no-ship |
| **Juliet** | Board, seeds, sequencing — never executes packets |
| **Lima** | DL + spec BUILD + filename + ADMIN-GUIDE |
| **India** | Contract / schema / SoR / H4 / **B-CL1 `/greet`** / husk-reset / remount-not-this-GO |
| **Echo** | Token lock from the still; side-by-side; HIS exception |
| **Charlie** | `ConversationSurface` + lab page + controls |
| **Alpha** | Migration, flag, proxy, persist, export |
| **Mike** | Admin gate, enable-flag boot, no key on client, voice-env refuse |
| **Tango** | No member leakage; placeholder; lab-only Yogi text |
| **Hotel** | Not seated unless instruction text grows trading claims (Yogi already forbids advice) |
| **Kilo** | Characterization + isolation + SoR + grep |
| **Delta** | CL-0-G · CL-1-G · CL-2-G · CL-3-G · CL-4-G · CL-G |

Foxtrot only if `LABS_COACH_LAB` must land on MiniTwo for a deploy. Sierra: no public SEO surface.

---

## 13. Risks (named)

| Risk | Mitigation |
|------|------------|
| Charlie “Labs-ifies” the thread (zinc cards, semibold, full-width) | CL-1-0 token lock + CL-1-3 side-by-side + visual fail at CL-G |
| `complete()` grows effort and changes Journal/Help | Lab path passes effort explicitly; existing callers unchanged |
| Client history spoof | P1: POST body is `{ text }` only |
| Two admins share a thread | `started_by` + isolation fixtures |
| Enable flag forgotten → production boot abort on missing XAI | CL-2-2 / CL-2-4 |
| Journal remount sneaks in | Fenced in every seed; India CL-G-3 is reuse note, not a remount |
| Fake “Read” receipt later read as product truth | Lab-only chrome; Lima DL sentence is the citation for the remount packet |
| First-load greeting husk loop | B-CL1 `POST /greet`; page must not `/reset` or POST empty `/chat` to talk first |
| Greeting-only resets pollute history | Husk law: zero trader turns discarded |

---

## 14. Revision

| Rev | Date | Notes |
|-----|------|-------|
| **v1.0** | 2026-08-13 | Charter CL-0…CL-4 from spec rev 2 + advisor P1–P8. Visual law = `msg.jpg` still (copied to `docs/references/`). Voice and Journal remount fenced. |
| **v1.1** | 2026-08-13 | Advisor review of plan v1.0 folded: **B-CL1** `POST /greet` (idempotent; greeting stamped P2); `/reset` calls greet after husk-or-store; CL-4-1 loads via `/greet` not empty chat; Kilo double-greet fixture; India signs route + husk-reset at CL-0-2; Lima DL carries fake-Read remount ban verbatim. Advisories 3–4 (NNN / model aliases) unchanged. |
