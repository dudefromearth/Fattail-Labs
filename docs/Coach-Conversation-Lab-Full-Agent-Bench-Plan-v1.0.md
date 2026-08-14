# Coach Conversation Lab & ConversationSurface — Full Agent Bench Plan v1.0 (rev **v1.2**)

**Date:** 2026-08-14
**Owner (orchestration):** Juliet
**Authority:** Coach (GO / ship)
**Board:** [`agents/p-coach-conversation-lab/`](../agents/p-coach-conversation-lab/)
**Plan revision:** **v1.2** — extra testing + **real** Echo / Tango / Kilo / Delta gates after the 2026-08-13 solo-ship reset. **Unit tests at every slice and every gate.** v1.1 B-CL1 law unchanged.
**Reset:** Implementation CL-1…CL-G was **reverted**. Product has no lab route. This revision is paper. **Do not implement until Coach opens the bench.**
**Spec:** [`Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md`](../Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md) — **BUILD AUTHORITY** · **DL-327**.
**Advisor reviews:**
- Spec rev 1: [`docs/Advisor-Review-Coach-Conversation-Lab-Spec-v0.1-2026-08-13.md`](./Advisor-Review-Coach-Conversation-Lab-Spec-v0.1-2026-08-13.md)
- Spec rev 2: [`docs/Advisor-Review-Coach-Conversation-Lab-Spec-v0.1.1-2026-08-13.md`](./Advisor-Review-Coach-Conversation-Lab-Spec-v0.1.1-2026-08-13.md) — H1–H4 + S1–S7 folded; P1–P8 resolved in this plan
- Plan v1.0: [`docs/Advisor-Review-CL-Bench-Plan-v1_0-2026-08-13.md`](./Advisor-Review-CL-Bench-Plan-v1_0-2026-08-13.md) — **B-CL1 blocking**; advisories 1–5 folded here
**Visual law (Coach, binding):** [`docs/references/coach-lab-imessage-reference.jpg`](./references/coach-lab-imessage-reference.jpg) — source `/Users/ernie/Pictures/msg.jpg`
**Design frame:** [`Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md`](../Architecture/FatTail-Labs-Practice-Coach-Design-Architecture-v0_3.md)
**Parents:** Defect Artifact 2026-08-13 §2 (G1–G4) · Journal Session v0.6 §1.4 · Human Interface Spec v1.0 (tokens/HIG; messaging pane is a named G4 exception)
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · overrule-not-waive · evidence over assertion

Specialists execute **only** via seeds, **as distinct agents**. Coordination through **Coach** or **Juliet**.
Juliet **never** writes `ConversationSurface`, the lab page, or lab routes.
Delta gates: **PASS / FAIL / BLOCKED** — never waived. A skipped Echo or Kilo seat is **BLOCKED**, not a note.

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

## 0a. Bench law — after the 2026-08-13 reset

A single agent wrote a bench plan, then implemented every packet and called it landed. The ship was a Labs zinc card under a wrapping admin nav. Coach rejected it (avatar gone, nav broken, not the still). Code was reverted. **Kilo backout PASS.** Echo wrote CL-1-0 lock. Charlie/Alpha were cancelled. Coach: reset first; do not re-implement until opened.

This revision exists so that shape cannot ship again.

| Law | Meaning |
|-----|---------|
| **Distinct seats** | Echo, Charlie, Alpha, Tango, Kilo, Delta are **separate invocations** from seeds. One chat that “is” all of them is a doctrine violation. |
| **Juliet does not code** | Orchestrator writes seeds and the board. Never `ConversationSurface`, never lab routes. |
| **Echo before Charlie** | CL-1-0 written **APPROVED** lock citing the still is a hard gate. No surface code without it. Current lock: `agents/p-coach-conversation-lab/gate-reports/CL-1-0-echo-token-lock.md`. |
| **Echo after Charlie** | CL-1-3 and CL-4-E are **side-by-side + interaction** reviews with screenshots. Semibold, Labs chrome, full-width, missing overlapping header, wrapping admin nav = **FAIL**. |
| **Tango on copy** | Placeholder, unavailable string, Yogi text, no member leakage — written note, not a shrug. |
| **Kilo with the feature** | **Unit tests land in the same slice as the code they prove.** No Alpha/Charlie seed is complete without a Kilo unit-test seed in that slice. Interaction tests (keyboard, scroll, greet, send, reset, isolation) are first-class, not “browser later.” |
| **Every gate is a test gate** | Delta **FAIL**s a phase if that phase’s unit suite is missing, skipped, or red. “We’ll test at CL-G” is banned. |
| **Delta needs pictures** | CL-1-G / CL-4-G / CL-G **FAIL** without: Echo APPROVED note, still-vs-surface screenshot, **that phase’s Kilo unit pack green**, curl/API evidence. “It should look right” is banned. |
| **“Landed” is forbidden** | until CL-G PASS including **Coach** feel-test (CL-G-4). Board must not say landed on an Echo-unsigned surface. |

**Echo overrides (overrule-not-waive — already in CL-1-0):**

1. Spec §2.1 “inert” back chevron → **live** `onBack` / `backHref` to `/admin`. Component does not hardcode the path.
2. Plan v1.1 CL-4-1 “standard admin shell” on the lab route → **superseded**. The wrapping admin nav, brand strip, and operator footer **must not render** on `/admin/coach-lab`. The conversation is the page (G2). Egress is the iMessage back control.

---

## 1. Authority chain (CL-0)

```
Coach GO (this plan **v1.2** + spec v0.1 BUILD · reset complete)
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

Until Coach opens **implementation** against this v1.2 plan, **no lab routes ship**
and `SessionInterviewChat` is untouched. CL-0 paper (DL-327) already exists; the
next act is Coach confirmation of **this** revision, then Juliet fires **Echo
and Kilo seats as separate agents** — not a solo implementer.

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

- **Live** back chevron, left (`onBack` / `backHref` — host wires `/admin`). Not inert (Echo/Coach override).
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
senderIdentity { name, avatarUrl?, initials? }
onSend(text)
onBack? / backHref?                    // live egress; host wires /admin
typing: bool
onPlusTap()
onHeaderTap?                           // lab: open receding controls
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
| `/admin` shell + `NAV` | Shipped | **Do not** add a wrapping “Coach Lab” nav item on the lab route. Lab page **hides** brand strip / 16-link wrap / footer (Echo override). Other `/admin/*` pages unchanged. Egress = back chevron → `/admin` |
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
CL-0  paper already landed (DL-327) — no re-code
  │
  ├──► CL-1-0 Echo lock (written APPROVED) ──► CL-1-1/1-2 Charlie (fixture)
  │                                              │
  │                                              ▼
  │                                            CL-1-3 Echo side-by-side + screenshots
  │                                              │
  │                                              ▼
  │                                            CL-1-K Kilo interaction tests (fixture)
  │                                              │
  │                                              ▼
  │                                            CL-1-G Delta (Echo note + pics + Kilo)
  │
  └──► CL-2 Alpha/Mike ──► CL-2-K Kilo ──► CL-2-G
           │
           ▼
         CL-3 Alpha ──► CL-3-K Kilo ──► CL-3-G
           │
           ▼
         CL-4 Charlie mounts surface ──► CL-4-E Echo interaction
                                      ──► CL-4-T Tango copy
                                      ──► CL-4-K Kilo browser pack
                                      ──► CL-4-G Delta
           │
           ▼
         CL-G  Kilo full pack + Lima + India + Coach feel-test + Delta
           │
           ⋮  later
         CL-V  Voice (S7)
```

**Critical path:** Echo lock → Charlie fixture → Echo pictures → Kilo interaction → Delta, **in that order**. Backend CL-2/3 may overlap **after** Coach opens implementation, but **must not** be called landed before their Kilo gates.
**CL-4 needs CL-1-G PASS and CL-3-G PASS.**
**CL-1 uses fixture messages** — do not block the still on xAI.
**Juliet fires each seed as a separate agent.** One implementer wearing every hat = stop.

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
17. **Unit tests at every slice and every gate.** A slice with no new/updated unit tests is incomplete. A gate with a red or missing suite is FAIL.

---

## 8a. Test law — unit tests at every slice and every gate

Kilo owns the suite. Alpha/Charlie do not self-certify.

| Rule | Binding |
|------|---------|
| **Same slice** | Every implementing seed (Charlie or Alpha) has a **Kilo unit-test seed in that same phase**. Tests merge with the code, not later. |
| **Every gate** | CL-0-G · CL-1-G · CL-2-G · CL-3-G · CL-4-G · CL-G each require a **named unit suite green** (command + output in the gate report). Missing suite = FAIL. |
| **No “test at the end”** | CL-G re-runs the **union** of prior suites plus charter extras. It does not invent coverage that earlier gates skipped. |
| **Deterministic** | No live xAI in unit tests (`complete_lab` mocked). No timing luck. No shared identity_id 0 for FK rows. |
| **Deny paths first** | 401/403, empty `/chat`, flag-off 404, unknown model, double `/greet`, husk reset — first-class, not afterthoughts. |
| **Frontend units** | Token helpers (contrast, initials, separator gap), send-key mapping, role→direction map, purity grep as a test. Then Playwright/RTL interaction on the **fixture** (Enter send, Shift+Enter newline, send hidden when empty, scroll-hold, 1 vs 40 height). |
| **Backend units** | `require_lab_boot`, first-name helper, greet idempotency, chat SoR, husk-reset, isolation, export snapshot — `server/tests/test_coach_lab.py` grown **per slice**. |
| **Regression** | The 2026-08-13 fail (wrapping admin nav on the lab route; Labs-chrome thread) becomes a **characterization** once the host exists: grep/layout test that `/admin/coach-lab` does not render `data-testid="admin-nav"`. |

---

## 9. Seed catalog

Every seed: project · agent · depends · intent · files · invariants · completion · gate.
**Every implementing slice includes a Kilo unit-test seed. Every `*-G` gate lists the suite it must see green.**

### PHASE CL-0 — GO lock + DL + contract

Paper already landed (DL-327). On re-open, Juliet confirms v1.2 board; no re-code.

| Seed | Agent | Intent | Unit tests this slice | Gate |
|------|-------|--------|----------------------|------|
| **CL-0-0** | Lima | Already done (spec BUILD + DL-327). On re-open: point ADMIN-GUIDE / board at plan **v1.2**. Do not rewrite the DL. | — | pre-impl |
| **CL-0-1** | Juliet | Board freeze to v1.2; seeds; remount/voice/B-* fenced; **implementation STOPPED until Coach opens** | — | pre-impl |
| **CL-0-2** | India | Already APPROVED (CL-0-2-india.md). Re-affirm on re-open if contract drifted (Echo back/`onBack`, no wrapping nav). | — | CL-0-G |
| **CL-0-K** | **Kilo** | **Reset characterization (unit/grep):** listed lab runtime files **absent**; `layout.tsx` / `main.py` have no coach-lab; import probe `ModuleNotFoundError` for `coach_lab_*`. Keeps the revert honest until impl starts. After Coach opens impl, this suite is **replaced** by the CL-2+ packs — do not leave “files must be absent” as a forever FAIL. | `server/tests/test_coach_lab_absent.py` **or** documented grep in `CL-BACKOUT-kilo.md` (already PASS 2026-08-14) | CL-0-G |
| **CL-0-G** | **Delta** | Spec+DL+plan **v1.2** consistency; B-CL1 in route table; remount fenced; **CL-0-K green** | `CL-0-G` PASS | **CL-0-G** |

**CL-0 exit (paper):** BUILD · DL · plan v1.2 confirmed. **CL-1/CL-2 stay STOPPED until Coach opens implementation.**

---

### PHASE CL-1 — ConversationSurface (visual critical path)

Depends: Coach opens impl + CL-1-0 Echo lock (already written). Does **not** depend on CL-2. Charlie uses fixture `messages[]`.

| Seed | Agent | Reviewer | Intent | Unit tests this slice | Gate |
|------|-------|----------|--------|----------------------|------|
| **CL-1-0** | Echo | — | Token lock (exists). Re-read still if tokens drift. HIS-X-CS-1 named. | Token **unit** tests: `contrastRatio` defaults ≥ 4.5:1; separator-gap constant; column min/max 375–420 | CL-1-G |
| **CL-1-0-K** | **Kilo** | Echo | Unit tests for `conversationTokens.ts` (contrast, hex parse, appearance fallbacks). Must be green **before** Charlie is called done on tokens. | `web` unit file next to tokens (vitest/jest as repo uses) | CL-1-G |
| **CL-1-1** | Charlie | Echo | Build `ConversationSurface` to the lock. Fixture mount. Grep: no `"Coach"`, no fetch/store, no journal/retro. | — (tests in CL-1-K) | CL-1-G |
| **CL-1-2** | Charlie | Echo | Composer, overlapping header, typing, entrance, fixed-height, `sendKey`, `startedAt`, `appearance`, `onBack`. Reduced-motion. Focus rings. | — | CL-1-G |
| **CL-1-3** | Echo | Tango | **Side-by-side screenshots** vs the still: weight, radius, tails, separators, Read, pill, overlapping avatar. Semibold / Labs chrome / full-width / missing header = FAIL. | Evidence: still + fixture PNG in `gate-reports/` | CL-1-G |
| **CL-1-K** | **Kilo** | Echo | **Unit + fixture interaction:** purity grep as a test; role→direction helper; Enter sends / Shift+Enter newline; send control hidden when empty; 1-message vs 40-message **same page height**; scroll-hold when reader scrolled up; `prefers-reduced-motion` path invoked. No live network. | `web` tests + fixture | **CL-1-G** |
| **CL-1-G** | **Delta** | — | Echo APPROVED + screenshots + **CL-1-0-K and CL-1-K green** | FAIL if either suite missing/red | **CL-1-G** |

---

### PHASE CL-2 — Schema + config + enable flag

Depends: Coach opens impl. Independent of CL-1 visually.

| Seed | Agent | Reviewer | Intent | Unit tests this slice | Gate |
|------|-------|----------|--------|----------------------|------|
| **CL-2-1** | Alpha | India · Mike | Migration `coach_lab_*` (next-free NNN). Seed Yogi + reference colors. `started_by` FK. Effort `xhigh`. | — | CL-2-G |
| **CL-2-2** | Alpha | Mike | `LABS_COACH_LAB` gate. Unset → no routes; set + missing XAI_* → boot abort. | — | CL-2-G |
| **CL-2-3** | Alpha | Mike | GET/PUT `/config`. Version bump. Voice without env → refuse. Closed model list. | — | CL-2-G |
| **CL-2-K** | **Kilo** | Mike | **Units this slice:** flag off → 404 / not registered; flag on + missing key → `ConfigError`; PUT bumps `instruction_version`; unknown model 400; non-admin 403; voice_enabled without env refused. | `server/tests/test_coach_lab.py` (create; grow later) | **CL-2-G** |
| **CL-2-G** | **Delta** | — | Migration present + **CL-2-K green** (command + output) | FAIL if no unit file | **CL-2-G** |

---

### PHASE CL-3 — Proxy + persist + export

Depends: CL-2-G.

| Seed | Agent | Reviewer | Intent | Unit tests this slice | Gate |
|------|-------|----------|--------|----------------------|------|
| **CL-3-1** | Alpha | India | Current = latest open **for this admin**. GET does not greet. | — | CL-3-G |
| **CL-3-2** | Alpha | Mike | `POST /chat` `{ text }` only. Empty 400. Server-held SoR. Mock xAI. Fail loud unknown model. Do not change other `complete()` callers. | — | CL-3-G |
| **CL-3-3** | Alpha | India | `POST /greet` idempotent. Shared helper with reset. | — | CL-3-G |
| **CL-3-4** | Alpha | India | Reset husk law. | — | CL-3-G |
| **CL-3-5** | Alpha | — | Markdown + JSON export (start snapshot + per-message model/effort). | — | CL-3-G |
| **CL-3-K** | **Kilo** | India · Mike | **Units this slice (add to same test module):** two-admin isolation; client history ignored; no-name greet; model-down named; export per-turn; **two rapid `/greet` → one row**; empty `/chat` 400; greeting-only reset discarded. `complete_lab` mocked. | `server/tests/test_coach_lab.py` | **CL-3-G** |
| **CL-3-G** | **Delta** | — | **CL-2-K ∪ CL-3-K green** | FAIL if CL-3 cases missing | **CL-3-G** |

---

### PHASE CL-4 — Lab page

Depends: **CL-1-G PASS** + **CL-3-G PASS**.

| Seed | Agent | Reviewer | Intent | Unit tests this slice | Gate |
|------|-------|----------|--------|----------------------|------|
| **CL-4-1** | Charlie | Echo | Mount surface. Column 375–420. **No wrapping admin nav / brand / footer** on this route (Echo override). **On load: `POST /greet`** (typing until return). Not empty `/chat`. Not `/reset` to greet. `sendKey='enter'`. Initials or static mark. Back → `/admin`. | — | CL-4-G |
| **CL-4-2** | Charlie | Echo | Receding lab controls (name-pill sheet or collapsed under column): instruction, model, effort, colors + contrast warning + reset-to-reference, voice disabled-with-reason. | — | CL-4-G |
| **CL-4-3** | Charlie | — | Past list read-only; exports; model-down host string. | — | CL-4-G |
| **CL-4-E** | **Echo** | — | **Interaction + still:** greeting bubble, avatar overlapping thread, back works, composer, **admin-nav absent** on the lab URL. Screenshots required. | gate-report + PNGs | CL-4-G |
| **CL-4-T** | Tango | — | No member leakage; placeholder ≤ 2 words; Yogi lab-only. | review note | CL-4-G |
| **CL-4-K** | **Kilo** | Echo · Tango | **Units + browser:** non-admin 403 page+API; lab route does **not** render `admin-nav`; reload lands at latest; height 1 vs 40; default contrast ≥ 4.5:1; greet-on-load (mocked); send → trader then coach (mocked). | `server/tests/` + `web` e2e/unit | **CL-4-G** |
| **CL-4-G** | **Delta** | — | Echo CL-4-E APPROVED + Tango note + **CL-4-K green** + prior CL-1-K / CL-2-K / CL-3-K still green | FAIL if any prior suite went red | **CL-4-G** |

---

### PHASE CL-G — Charter close

| Seed | Agent | Intent | Unit tests this slice | Gate |
|------|-------|--------|----------------------|------|
| **CL-G-1** | Kilo | **Re-run the union:** CL-1-0-K · CL-1-K · CL-2-K · CL-3-K · CL-4-K **all green in one command list**. Plus charter extras if any new edge appeared. | One report with every command + exit 0 | CL-G |
| **CL-G-2** | Lima | As-built honesty: spec, DL, ADMIN-GUIDE | — | CL-G |
| **CL-G-3** | India | Retrospective can mount `ConversationSurface` without modification | — | CL-G |
| **CL-G-4** | **Coach** | Chris-thread feel test vs the still | — | CL-G |
| **CL-G** | **Delta** | Union suite green + Echo pictures + Coach feel-test + no remount grep | **CL-G PASS** | **CL-G** |

**Charter exit:** lab talks, transcripts persist/export per-admin, surface matches the still, **every phase unit suite still green**. Voice and Journal remount **not** required.

---

## 10. Trailing slice (same spec — do not pull into charter GO)

| Slice | Lands | Depends |
|-------|-------|---------|
| **CL-V** | Voice. Verify current xAI docs at build (Path A native vs Path B STT→chat→TTS). Transcript always renders as bubbles. Journal v0.7 §8 governs any later member graduation. **CL-V-K unit tests required** (toggle disabled without config; transcript still a bubble; text path unaffected) before any voice gate | Mike + xAI docs check + Kilo |

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
13. **Every phase unit suite green in one CL-G-1 report** (CL-1-0-K · CL-1-K · CL-2-K · CL-3-K · CL-4-K). A missing file is a FAIL.

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
| **Kilo** | **Unit tests at every slice:** tokens, fixture interaction, boot/config, greet/chat/reset/export, lab-host nav-absent + 403. Re-runs the union at CL-G |
| **Delta** | CL-0-G · CL-1-G · CL-2-G · CL-3-G · CL-4-G · CL-G — each **FAIL** without that phase’s unit suite green |

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
| Solo implementer skips tests and Echo | Bench law §0a + unit tests §8a; Delta BLOCKED if seats skipped |
| “We’ll test at the end” | Every `*-G` requires that slice’s Kilo units; CL-G only re-runs the union |

---

## 14. Revision

| Rev | Date | Notes |
|-----|------|-------|
| **v1.0** | 2026-08-13 | Charter CL-0…CL-4 from spec rev 2 + advisor P1–P8. Visual law = `msg.jpg` still (copied to `docs/references/`). Voice and Journal remount fenced. |
| **v1.1** | 2026-08-13 | Advisor review of plan v1.0 folded: **B-CL1** `POST /greet` (idempotent; greeting stamped P2); `/reset` calls greet after husk-or-store; CL-4-1 loads via `/greet` not empty chat; Kilo double-greet fixture; India signs route + husk-reset at CL-0-2; Lima DL carries fake-Read remount ban verbatim. Advisories 3–4 (NNN / model aliases) unchanged. |
| **v1.2** | 2026-08-14 | After solo-ship reset: distinct seats; Juliet does not code; Echo lock + side-by-side + CL-4-E interaction; no wrapping admin nav; live back control. **§8a unit tests at every slice and every gate** (CL-0-K · CL-1-0-K · CL-1-K · CL-2-K · CL-3-K · CL-4-K; each `*-G` requires that suite green; CL-G re-runs the union). Implementation remains **STOPPED** until Coach confirms this plan and opens the bench. |
