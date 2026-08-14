# FatTail Labs — Coach Conversation Lab & ConversationSurface Spec v0.1 (SUPERSEDED)

**Status:** **SUPERSEDED** by [`FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md`](./FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md)
(**BUILD AUTHORITY** · **DL-327**). Kept as the DRAFT rev 2 review snapshot.

**Prior status:** DRAFT rev 2 — advisor review 2026-08-13 (Grok) folded: H1–H4 + S1–S7.
Reviewer verdict: GO after these edits. **Not build authority** until Coach GO + Lima
DL entry. **Repo filename (H1):**
`Specs/FatTail-Labs-Coach-Conversation-Lab-Spec-v0_1.md` — ASCII hyphens, no spaces or
em-dashes, per convention.
**Purpose:** Stage 1–2 of the Coach-directed sequence (Defect Artifact §4): build the
**interface** with heavy UI emphasis — the conversation is unmistakably the center —
and get the Coach **talking**, before any real instruction set exists. This is a **test
harness**, not the Journal: no journal reads, no journal writes, no member exposure.
The conversation component, however, is **built for keeps** — it is the planned surface
for the Journal remediation *and* the Retrospective conversation frame (next program).
**Family:** none (no member data stored; admin-only surface). Admin auth is the gate.
**Route:** `/admin/coach-lab` — role `administrator` only, page and APIs both.

**Parents / law this inherits:**

| Doc | For |
|---|---|
| Defect Artifact 2026-08-13 §2 | G1 first-contact · G2 composer primacy · G3 inviting/HIG-measurable · **G4 messaging-grade (iMessage reference)** — acceptance criteria here |
| Journal Session v0.6 §1.4 | Fixed-height scrollable session law (inherited verbatim into the component) |
| Practice-Coach Design Architecture v0.3 §3.2 | Lean-on-model; effort matched to moment; fail-loud vendor config |
| Human Interface Spec v1.0 | Apple HIG (web-adapted); system-ui/-apple-system stack, Inter fallback; open icon set |
| Advisor plan review + xAI docs check 2026-08-13 | Multi-agent effort semantics (verified): effort governs agent collaboration ceiling — low/medium ≈ 4, high/x-high ≈ 16, allocation dynamic beneath the cap |

**Explicit fencing:** no B-Name resolution implied (lab label is internal); no heat
gate (that is Journal law protecting members holding risk — the lab has no member and
no book); no journal/retro store touches; no member-facing strings ship from here.
Sacred Invariant 8 is moot inside an admin-only lab but binds anything later promoted.

---

## 1. What gets built

Two things, cleanly separated:

1. **`ConversationSurface`** — a reusable, journal-agnostic messaging component
   (§2–§3). This is the deliverable that outlives the lab: the Journal remediation and
   the Retrospective conversation frame both mount it later. Zero coupling to journal
   or retro stores; everything contextual arrives via props/callbacks. **Its record
   discipline is permanent law from day one: every conversation it carries is
   date-time stamped, persisted, and exportable — built to be tracked, analyzed, and
   introspected.** **Persistence is a host contract (H3):** the component only renders
   `messages[]` and calls `onSend`; the mounting page (lab now; Journal/Retro later)
   owns every table write. The component never grows a store. The lab exercises the
   discipline against the lab's own tables; the Journal and Retro exercise it against
   the member record under full Journal law.
2. **The Coach Lab page** (§4–§7) — `/admin/coach-lab` mounting the component, wired
   through a server proxy to the xAI API, with an on-page admin control panel:
   instruction editor, model selector, effort selector, voice toggle.

---

## 2. ConversationSurface — visual law (G4, made buildable)

The reference is the iMessage thread. If an observer would not describe the surface as
"a texting thread with my coach," it fails. The **conversation is the center of the
interface** — nothing on the page may outweigh it (G2).

### 2.1 Thread — exact replication of the reference

**The look and feel is the Coach-supplied iMessage screenshot, replicated — not
adapted, not re-skinned in Labs chrome.** Side-by-side with the reference, a viewer
should not be able to say which is which at a glance — **the side-by-side test covers
bubbles, geometry, color, and type (S3); per-bubble timestamps are a deliberate
deviation from iMessage**, inherited Journal law (v0.6 §1.4, never hover-only), and do
not fail G4.

- **Contact header** at top, iMessage-style: circular avatar with the Coach's mark,
  name pill beneath it ("Coach · Lab" internally; B-Name still governs anything
  member-facing), centered, with the back chevron at left as inert chrome.
- **Bubbles with tails**, reference geometry: outgoing right-aligned with the tail at
  lower-right; incoming left-aligned, tail lower-left. Max width ~75% of thread.
  **Default colors are the screenshot's**: outgoing **iMessage-green** (#34C759
  family) with white text; incoming **light gray** (#E9E9EB family) with near-black
  text; white thread background. These are *defaults* — admin-adjustable per §5.5.
- **Type is the reference's scale**: large, unapologetic message text (17–19px+,
  matching the screenshot's phone-scale legibility), system stack. Day/time separators
  centered in muted small caps ("Yesterday 5:27 PM"), read-receipt-style metadata
  ("Read Yesterday") under the latest outgoing bubble — rendered, per the timestamps
  law.
- **Every conversation is date-time stamped — three levels, all rendered:**
  1. **Conversation header**: the first element of every conversation, including each
     one begun by Reset — "Conversation started Aug 13, 2026 · 9:58 PM" — centered,
     separator-style.
  2. **Day/time separators** in-thread as time passes, the reference's centered idiom.
  3. **Per-message timestamps** — every bubble carries its time, rendered and legible,
     never hover-only (v0.6 law carried into the component for keeps: the Journal and
     Retro inherit this stamping when they mount it).
- **Typing indicator**: three-dot bounce in an incoming gray bubble.
- **Entrance**: new Coach message rises in exactly like a received text (150–250ms);
  `prefers-reduced-motion` swaps to opacity-only.
- **Fixed-height session (v0.6 §1.4 verbatim):** bounded scroll region; the page never
  grows; scroll-to-bottom on new messages unless the reader has scrolled up; reopening
  lands at latest; no scroll chaining.

### 2.2 Composer

- **Pinned below the thread**, same container, always reachable without page scroll.
- One rounded input, **placeholder of at most two words** ("Message") — never an essay
  prompt, never surface-explaining copy.
- **Send**: filled accent circle with up-arrow (iMessage idiom), keyboard Enter sends,
  Shift+Enter newlines. Visible focus ring.
- **`+` affordance** left of the input — present as the future paste/voice/star home.
  In the lab it opens the voice input when voice is enabled (§7); otherwise a quiet
  "coming soon" no-op is acceptable *in the lab only*.
- Input text 17px minimum. The composer is visually primary against all page chrome.

### 2.3 Page chrome (lab)

Minimal on purpose: a small header ("Coach Lab" + Reset conversation), the thread, the
composer, and the collapsed admin panel (§5). No product nav beyond the standard admin
shell. Nothing competes with the thread (G2 is testable here before it must hold on
the busier Journal page).

### 2.4 Component contract (for reuse)

Props/callbacks only — no fetches, no stores, no persistence inside the component
(H3):
`messages[]` (id, direction: incoming|outgoing, body, at) · `senderIdentity` (name,
avatarUrl — **the component ships with no "Coach" literal anywhere (S2)**; every name,
avatar, and unavailable-copy string arrives from the host) · `onSend(text)` ·
`typing: bool` · `onPlusTap()` · `sendKey` (host prop — lab: Enter; Journal today:
Cmd+Enter; never a silent change on remount, S4) · optional `voice` handlers (§7).
The host maps its own roles onto `incoming|outgoing` (S1) — the lab maps
`coach|trader`, the Journal will map `agent|member` — so no schema fight at remount.
No knowledge of journals, retros, dates, closure, or stores. That ignorance is the
feature: the Retrospective mounts this next with different wiring and zero changes.

---

## 3. Behavior

- **Arrival greeting.** On page load, the lab immediately requests the first Coach
  turn (no member message required): the model is invoked with the instruction (§5)
  plus a context line carrying the admin's **first name** (from the authenticated
  identity — display name's first token; no new stores). **If the display name yields
  no usable first token, greet without a name — never invent one (S6).** The avatar is
  a **provided static mark** (asset path owned by the lab page), never a generated
  portrait of anyone. Typing indicator shows until it lands. The Coach greets *by
  name*, per the standing directive: engagement is up-front, on arrival — not at
  scheduled moments.
- **Multi-turn, persisted.** Full conversation history (instruction + all turns) is
  sent each request. **Every conversation is stored server-side** — stamped start,
  every message with role and time — in the lab's own tables (§6). **Conversations are
  per-admin (H2):** each carries `started_by`; the current conversation is the latest
  open row *for that admin*; two administrators never share a thread or a history.
  Config (instruction/model/colors) stays global. This supersedes the earlier
  memory-only posture: the transcript is a first-class artifact now.
- **Reset conversation** closes and stores the current conversation, then starts a new
  stamped one and re-triggers the arrival greeting — the fast loop for instruction
  iteration, with nothing lost.
- **Past conversations**: a collapsible list (start stamp + first line), read-only
  view on tap. Past transcripts are records — never editable, never resumed; talking
  continues only in the current conversation.
- **Export**: per-conversation **Markdown** download (stamped header, timestamped
  turns, speaker labels) and an **export-all JSON** (conversations + messages +
  config snapshot per conversation: instruction_version, model, effort). The script
  is always in your hands.
- **Model-down honesty.** If the proxy errors or times out: the typing indicator
  resolves to a plain inline notice ("Coach is unavailable — check the lab config"),
  the composer keeps working, no fake turns, no silent retry loop. Fail states are
  named, never styled away.

---

## 4. Server proxy

- `POST /api/admin/coach-lab/chat` — administrator-gated (403 otherwise). Body:
  message history. Server attaches the instruction, model, and effort from the lab
  config (§6) and calls the xAI API. **The API key never reaches the client.**
- Env (fail-loud, boot-abort if missing when the lab is enabled): `XAI_API_KEY`,
  `XAI_API_BASE`. No hardcoded hosts, models, or keys (Invariant 2).
- Streaming to the client if straightforward (nicer typing feel); non-streaming is
  acceptable for v0.1 — the typing indicator covers the wait either way.
- Timeout bounded and surfaced per §3 model-down honesty.

---

## 5. Admin control panel — on the page

A collapsible "Lab controls" section beneath the composer (collapsed by default so the
conversation stays the center; expanded state is remembered per admin locally).

### 5.1 Instruction editor (admins only — the whole page is, but writes double-check)

- Textarea with the **current instruction**; monospace optional; ~1–4k chars.
- **Save** writes to server config (§6) and bumps `instruction_version` (int) with
  `updated_by` / `updated_at` shown beside the editor ("v7 · Ernie · 9:58 PM").
- Takes effect on the **next Reset / new conversation** (mid-conversation instruction
  swaps make iteration confusing; Reset is one tap away).
- **Default instruction seeded on first migrate** — the Yogi greeter test text:

  > You are a friendly greeter testing a chat interface. Welcome the user by name like
  > an old friend walking into your shop. Engage in light banter about trading and
  > markets — the day, the mood, nothing serious. Keep messages short, like texting.
  > You have the personality of Yogi Berra: folksy, warm, cheerfully confusing, and
  > you like to end thoughts with his style of little quips. No analysis, no advice —
  > you're just here to say hello and chat.

  *(Lab-only text. Nothing here is member-facing; the real instruction set is a later,
  deliberate act — Stage 3.)*

### 5.2 Model selector

- Closed list from server config (`coach_lab_models`), not free text — e.g.
  `grok-4.20` and `grok-4.20-multi-agent` (exact strings verified by Grok against
  current xAI docs at build; a wrong model string must fail loud at call time and
  surface in the lab, not 200-with-nothing).

### 5.3 Effort selector

- `low · medium · high · x-high`, applied as `reasoning.effort` on each call.
- Helper text beside it (admin-facing, one line): *on the multi-agent model, effort
  sets the agent-collaboration ceiling — low/medium ≈ 4 agents, high/x-high ≈ 16,
  allocated dynamically.* On single-agent models it is reasoning depth. This is the
  knob Coach asked for: feel the difference live, per turn class, before the effort
  map (`coach_effort_map`, Journal v0.7 §4.5) is tuned for production.
- Selection takes effect on the **next message** (no reset needed) — comparing efforts
  mid-conversation is exactly the experiment the lab is for.

### 5.4 Voice toggle

- Off by default. When on, §7 activates. If voice config is absent, the toggle renders
  disabled with the reason ("voice not configured") — never a dead control.

### 5.5 Bubble appearance

- Four color controls, native color inputs: **Coach bubble background · Coach text ·
  Trader bubble background · Trader text.** Defaults are the reference's (incoming
  #E9E9EB-family / near-black; outgoing iMessage-green / white).
- Saved to lab config (§6); apply from the **next render** — no reset required, so
  color iteration is instant.
- If a chosen pair computes below **4.5:1 contrast**, the panel shows a plain inline
  warning ("low contrast — hard to read") but does not block: it's a lab. Any pair
  promoted beyond the lab later must meet G3.
- One **"Reset to reference"** link restores the four defaults.

---

## 6. Lab config (single admin row, migration next-free NNN)

```
coach_lab_conversations
  id, started_by identity_id,                 -- per-admin ownership (H2)
  started_at, ended_at NULL,
  instruction_version, model, effort          -- config snapshot at start
coach_lab_messages
  id, conversation_id, role (coach|trader), body_md, at
  -- role enum is lab vocabulary (S1); the component receives incoming|outgoing

coach_lab_config
  id (=1), instruction_text, instruction_version INT,
  model VARCHAR, effort ENUM(low|medium|high|xhigh),
  voice_enabled BOOL DEFAULT 0,
  coach_bubble_bg VARCHAR, coach_bubble_text VARCHAR,
  trader_bubble_bg VARCHAR, trader_bubble_text VARCHAR,   -- defaults = reference (§5.5)
  updated_by, updated_at

env:
  LABS_COACH_LAB=1                            -- enable flag (S5); lab off = no lab
                                              --   routes, and XAI_* absence must NOT
                                              --   abort the wider API boot
  XAI_API_KEY · XAI_API_BASE                  -- required (boot-abort) only when the
                                              --   lab is enabled
  XAI_VOICE_* (only if voice_enabled — §7; absent + voice on = boot/save refuses loudly)
```

Admin-only PUT `/api/admin/coach-lab/config`. No versioned prompt-history table in
v0.1 — `instruction_version` + git-of-the-mind is enough for a lab; the *real*
versioned prompt system remains Journal v0.6 §8.3 law for production, untouched.

---

## 7. Voice option (Grok voice) — later slice (S7)

**v0.1 GO ships §2–§6 without this section** (same pattern as Journal J7-5); the
toggle stays disabled-with-reason until voice config exists. When built:

**Evidence posture:** xAI's public materials list **voice among API capabilities**
(text, vision, voice, image, video). The exact endpoint/protocol (realtime WebSocket
vs. STT/TTS endpoints) **must be verified by Grok against the current xAI docs at
build time** — do not build from memory. Two lawful shapes, in preference order:

- **Path A — native xAI voice/realtime API** (if currently offered): server-brokered
  session (key stays server-side), mic in via the `+` affordance, Coach audio out,
  **with the transcript rendered as normal bubbles either way** — the thread stays the
  visible record; voice is a modality, not a second surface.
- **Path B — composition fallback**: xAI (or configured) STT → the same chat proxy →
  TTS on the reply. Same UI contract: tap `+` → hold-to-talk or tap-to-record →
  transcript appears as the outgoing bubble → Coach reply arrives as bubble + audio.
- Config fail-loud (§6). Voice unavailability degrades to text with a named notice —
  never silent, never blocking text.
- Browser mic permission handled with a plain explanation; denial degrades to text.
- Lab-only for now. When voice later graduates toward the member Journal, **Journal
  v0.7 §8 law governs** (Family B audio, member-correctable transcript,
  transcript-only analysis, never tone) — none of that is waived by the lab, it simply
  doesn't apply until members are involved.

---

## 8. Acceptance — the feel test, made checkable

**A. The Chris-thread test (Coach runs it personally).** Open the lab cold. Within
seconds a typing indicator, then a greeting **by name, from a named sender with an
avatar**, in a bubble, in big legible type. If the honest reaction is "someone texted
me — I should reply," Stage 1 passes. If it reads as a form with decorations, it fails
regardless of any checklist below.

**B. Mechanical checks (Kilo/Delta-grade):**
- Page height identical at 1 message and 40; composer reachable without page scroll in
  both; scroll-held-when-reading; land-at-latest on reload; no scroll chaining.
- All text ≥ 4.5:1 contrast; message type ≥17px; placeholder ≤ 2 words; visible focus
  states on composer, send, and every control; reduced-motion honored.
- Arrival greeting fires on load with typing indicator; uses the admin's first name.
- **Conversation header stamp** renders as the first element on load **and** after
  every Reset; every bubble carries a rendered timestamp; day/time separators appear
  at the reference's cadence.
- **Bubble colors** apply on next render without reset; low-contrast pairs draw the
  inline warning; "Reset to reference" restores all four defaults.
- Effort change applies on next message; model change on next message; instruction
  save bumps version and applies on Reset; non-admin gets 403 on page, chat, and
  config APIs.
- Model-down path: named notice, composer alive, no fake turn.
- Voice on without config: toggle disabled with reason. Voice on with config:
  transcript bubbles render for both sides; text path unaffected when voice errors.
- **Transcripts persist and export**: Reset closes-and-stores; past conversations list
  by start stamp and open read-only; Markdown export carries the stamped header,
  timestamped turns, and speaker labels; export-all JSON carries the per-conversation
  config snapshot (instruction_version, model, effort).
- **Per-admin isolation (H2):** two admin fixtures never see each other's current
  thread or history; every conversation row carries `started_by`.
- **No-name fallback (S6):** empty display name → greeting renders without a name,
  none invented.
- **Component purity (S2/H3):** grep `ConversationSurface` for "Coach" literals and
  store/fetch imports — none may exist; all strings arrive via props.
- **Enable flag (S5):** `LABS_COACH_LAB` unset → no lab routes and the wider API boots
  fine with XAI_* absent; set → missing XAI_* aborts loudly.
- **No member/journal/retro store is read or written** by any lab code path (fixture +
  grep) — the lab writes **only its own `coach_lab_*` tables**, and no production
  code path reads them (H4).

**C. Component reuse check (India):** `ConversationSurface` imports nothing from
journal/retro modules; the lab page owns all wiring. One-sentence APPROVED note that
the Retrospective can mount it without modification.

---

## 9. What comes next (context for the builder, not scope)

- **Retrospective conversation frame** mounts this same component next — the ceremony
  as a walked conversation (design v0.3 §9), pending B3. **Coach directive, binding on
  that program: it is the *same Coach*, and the lab transcripts are visible to it** —
  the retro-side lab loads prior `coach_lab_conversations` **of the same admin**
  (read-only) into the model's context, so the Coach that greeted you in the
  journal-shaped room remembers the conversation when it meets you in the retro-shaped
  room. This rehearses the trajectory-digest principle in the lab before the product:
  in production law the same continuity is the retro gather reading the journal
  thread. **Hard ban (H4): member Journal and member Retro must never ingest
  `coach_lab_*` rows as a member's context — lab transcripts are admin lab chats, not
  member memory.** Lab-to-lab continuity is same-admin only. The stored, stamped
  transcripts (§3) are the mechanism; nothing new is invented for it.
- **Journal remediation** (Defect Artifact Stage 1) re-skins the member Journal onto
  this component under full Journal law (heat gate, drafts, extract-and-confirm,
  member Family B) — none of which the lab implements or waives. **Remount = swap the
  thread/composer only (S4):** drafts, extract cards, campaign stamp, playbook links,
  heat, and presence stay page chrome; the send-key is a host prop. **This lab GO is
  not license to replace the Journal's chat in this program** — the remount is its own
  gated packet.
- **Stage 3** replaces the lab instruction with the crafted character page and builds
  the production instruction interface (versioned, session-stamped) — last, per
  Coach's sequence.

---

*Advisor artifact — Grok builds on Coach GO; Lima logs the GO. The lab page is
scaffolding; the ConversationSurface and its record discipline are not. Every
conversation this component ever carries exists to be **tracked, analyzed, and
introspected** — the system tracks, the machine analyzes, the trader introspects.*
