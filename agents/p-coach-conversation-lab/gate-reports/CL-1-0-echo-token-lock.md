# CL-1-0 — Echo token lock + interaction law

**Verdict:** **APPROVED lock for Charlie**

**Date:** 2026-08-13  
**Agent:** Echo  
**Seed:** CL-1-0  
**Still (normative):** [`docs/references/coach-lab-imessage-reference.jpg`](../../../docs/references/coach-lab-imessage-reference.jpg)  
**Numbers in code:** [`web/components/conversation/conversationTokens.ts`](../../../web/components/conversation/conversationTokens.ts)  
**Parents:** HIS v1.0 §2–§4 · Spec v0.1 §2 · Plan v1.1 §2 · Coach post-revert direction (this packet)

Charlie implements `ConversationSurface` from this packet. **Do not invent.** If a control, number, or page rule is not here, return to Echo. Do not ship a Labs-skinned thread and call it close.

A prior solo ship put a Labs zinc card under the wrapping 16-link admin nav. Avatar gone. Nav competing. Looked nothing like the still. That code is reverted. This lock exists so that shape cannot be rebuilt.

---

## 0. Authority

| Layer | What binds |
|-------|------------|
| **Still** | Bubbles, geometry, color, type, header overlap, composer, separators, Read receipt |
| **This packet** | Tokens, column, page law, FAIL list, interaction |
| **Spec §2 / plan §2** | Component contract, stamp, per-bubble times (deliberate G4 deviation), typing, motion, fixed-height |
| **Coach 2026-08-13 (this seed)** | Conversation **is** the page (G2). Wrapping admin nav must not compete. Back chevron is a **real** control to `/admin`. Avatar + name pill overlap the thread like the still. |

**Coach overrides, recorded (overrule-not-waive):**

1. Spec §2.1 “inert” back chevron → **live control**. Host wires it to `/admin`. Component does not hardcode the path.
2. Spec §2.3 / plan CL-4-1 “standard admin shell” on the lab route → **superseded for `/admin/coach-lab`**. The 16-link wrap, brand strip, and operator footer must not appear on this page. Egress is the iMessage back control.

These overrides apply to the lab host. `ConversationSurface` stays journal-agnostic (props/callbacks only).

---

## 1. Named HIS exception — HIS-X-CS-1

**HIS v1.0 §4.2** says the page canvas is never pure white (`#f5f5f7` wash; white is for cards).

**Exception name:** `HIS-X-CS-1` — Conversation messaging pane.

**Rule:** The **messaging pane** (iMessage header overlay + thread + composer — the `ConversationSurface` root) **may be pure iMessage white `#FFFFFF`**. That is the still. It is required.

**Scope (tight):**

| Inside the pane | Outside the pane |
|-----------------|------------------|
| `--cs-thread-bg: #FFFFFF` | Surrounding wash stays HIS `color.canvas` (`#f5f5f7`) if any page is visible around the 375–420 column |
| iMessage greens / grays from this lock | Labs emerald tint, zinc utilities, `surface-card`, admin header tokens — **not used in the pane** |
| Always the still’s **light** iMessage, even if the site is dark | Dark theme may wash the *page around* the column. Do not invert the thread |

This exception is **not** a license to:

- paint the whole admin well white and stretch bubbles across it
- restyle Labs kit buttons as “close enough”
- drop a zinc/emerald card *on* the white pane

G4 is the still. HIS-X-CS-1 is the only lawful reason the pane is `#FFFFFF`.

---

## 2. The conversation is the page (G2)

### 2.1 Column — sized for the interface

The reference is **1125×2436 @3×** (iPhone logical **375×812**).

| Rule | Value |
|------|--------|
| Thread column | **375–420 CSS px**. Preferred **390**. |
| Never | Let bubbles or the composer span a 1600px admin well |
| Viewport &lt; 375 | Column is 100% of the viewport. No horizontal scroll |
| Host | Centers the column on the canvas. Receding lab controls live **under or beside** the column, never as a wrapping nav |

Root of `ConversationSurface`:

```
width: min(100%, 420px);
max-width: 420px;
height: 100%;          /* host gives a bounded height — see §7.4 */
background: #FFFFFF;
display: flex;
flex-direction: column;
position: relative;
```

### 2.2 Lab page chrome (CL-4 law, locked now so CL-1 fixtures match)

On `/admin/coach-lab`:

1. **Do not render** `web/app/admin/layout.tsx`’s wrapping `<header>` (brand + 16 links + bell + View site) or the operator `<footer>`.
2. Keep `noindex` metadata. A chrome-less branch of the admin layout is the lawful implementation (`pathname === "/admin/coach-lab"` → `{children}` only).
3. A “Coach Lab” item on **other** admin pages (overview / NAV when you are *not* in the lab) is still allowed. It must **not** remain visible *on* the conversation page.
4. **Do not** wrap the surface in a Labs `surface-card`, zinc card, emerald tile, or 1600px padded well.
5. Quiet receding controls (Reset, Lab controls) sit **below or beside** the column. They are not a second header above the avatar.
6. There is no “Coach Lab” title bar that replaces the iMessage contact cluster.

CL-1 fixture page: same composition. White (or canvas-around-column) · no admin NAV · 375–420 column · overlapping header visible.

### 2.3 Back chevron — real control

| | |
|--|--|
| Visual | 36px circle, 1.5px `#C7C7CC` ring, SF-style chevron.left `#8E8E93`, left **16px**, top **10px** |
| Hit | **44×44** (pad the visual). HIS §4.4 |
| Behavior | `<button type="button">` (or host `<Link>` passed through). Calls `onBack()`. **Not** a `<div>`. **Not** inert. |
| Lab host | `onBack` → `/admin` |
| Component | **No** `"/admin"` literal. **No** `"Coach"` literal |
| Label | `backLabel` prop, default `"Back"`. Lab passes `"Back to admin"` |

---

## 3. Contact header — overlapping, like the still

This is the piece the reverted ship dropped. **Missing overlap = FAIL.**

The still’s header is **not** a Labs toolbar and **not** a white plate that pushes the thread down. It is a **transparent overlay** that sits **on** the thread: circular initials mark, name pill clipped onto the avatar, first bubbles running underneath.

### 3.1 Overlay cluster (absolute, `z-index: 2`, `background: transparent`)

**Never** give this overlay an opaque white/zinc bar, blur plate, or bottom border. A plate kills the overlap and fails CL-1-G.

```
headerOverlay    position:absolute; top:0; left:0; right:0; height: 96px;
                 pointer-events: none; background: transparent;

  back           pointer-events: auto; left: 16px; top: 10px;

  avatar         56×56 circle; left: 50%; top: 8px; transform: translateX(-50%);
                 overflow: hidden;

  namePill       height 24px; left: 50%; top: 52px;  /* 56 + 8 − 12 overlap */
                 transform: translateX(-50%);
                 pointer-events: none;             /* decorative in v0.1 */

  stamp          if startedAt: top: 80px; centered; 12px / 400 / --cs-meta
```

- **Avatar:** host `avatarUrl` (static mark — never a generated portrait) or initials from `senderIdentity.initials` or `csInitials(name)`. Initials: weight **600**, 20px, `--cs-avatar-fg` on `--cs-avatar-fill` (`#7B8FB5`). Image: `object-fit: cover`.
- **Name pill:** capsule (`border-radius: 999px`), `--cs-name-pill-bg` 92% white, 13px / **600** / black, trailing 8px chevron.right in `--cs-name-pill-chevron`. Hairline `--cs-name-pill-border` + soft shadow `0 1px 4px rgba(0,0,0,0.12)`. Horizontal padding 12 / 10. Text is the host `name` string (lab: `"Coach · Lab"`). Component ships **no** name of its own.
- The pill **sits on the avatar** (12px overlap). It is not a heading under a gap.

### 3.2 Thread runs under the overlay

```
thread    flex: 1; overflow-y: auto; overscroll-behavior: contain;
          padding: 20px 16px 12px;     /* 20px top — first bubble starts under the avatar */
```

First content starts at **20px**. Avatar occupies y ≈ 8–64. Name pill y ≈ 52–76. **The first bubble (and stamp, if you also put a stamp in-flow) is underneath the mark**, the way the still’s first green bubble runs behind “CF” / “Chris”.

Conversation stamp (`startedAt`): render it in the overlay at `top: 80px`, centered, 12px / 400 / `--cs-meta`, format `csFormatConversationStamp`. Optional `text-shadow: 0 0 6px #fff` so gray type stays readable when a bubble slides behind it. **Do not** add 72–88px of thread padding to “make room” — that recreates a header band and kills the overlap.

---

## 4. Token table (Charlie uses only these)

Source: `csStyleVars()` / `CS` in `conversationTokens.ts`. Appearance may override **only** the four bubble colors.

| Token | Value | Role |
|-------|--------|------|
| `--cs-thread-bg` | `#FFFFFF` | Pane canvas (HIS-X-CS-1) |
| `--cs-outgoing-bg` | `#34C759` | iMessage green |
| `--cs-outgoing-fg` | `#FFFFFF` | Outgoing type |
| `--cs-incoming-bg` | `#E9E9EB` | Incoming fill |
| `--cs-incoming-fg` | `#000000` | Incoming type |
| `--cs-meta` | `#8E8E93` | Separators, receipts, stamp, per-bubble times |
| `--cs-composer-fill` | `#F2F2F7` | Pill field |
| `--cs-composer-placeholder` | `#C7C7CC` | `Message` |
| `--cs-plus-ring` / `--cs-back-ring` | `#C7C7CC` | 1.5px rings |
| `--cs-plus-glyph` / `--cs-back-glyph` | `#8E8E93` | Plus / chevron |
| `--cs-avatar-fill` | `#7B8FB5` | Initials circle (still’s cool mark) |
| `--cs-avatar-fg` | `#FFFFFF` | Initials |
| `--cs-name-pill-bg` | `rgba(255,255,255,0.92)` | Capsule on the avatar |
| `--cs-name-pill-fg` | `#000000` | Name |
| `--cs-send-bg` | `#34C759` | Send circle (empty field: hidden) |
| `--cs-focus-ring` | `rgba(0,122,255,0.35)` | 3px ring — **not** Labs emerald |
| `--cs-type` | HIS §4.3 system / SF stack | |
| `--cs-weight-message` | **400** | Bubble copy. **Never 500/600** |
| `--cs-weight-name` | **600** | Name pill + initials only |
| `--cs-weight-meta` | **400** | Separators, Read, stamp, times |
| `--cs-size-message` | **17px** | |
| `--cs-size-meta` | **12px** | |
| `--cs-line-height-message` | **1.25** | |
| `--cs-radius-bubble` | **18px** | All bubbles |
| `--cs-header-avatar` | **56px** | |
| `--cs-composer-height` | **36px** | Visual. Hit 44 |
| `--cs-plus` / `--cs-back` | **36px** | Visual. Hit 44 |

**Font weight is a gate.** Semibold / `font-medium` / `font-semibold` on bubble copy fails CL-1-G even if colors match.

Do not use Tailwind `zinc-*`, `emerald-*`, `font-medium`, `font-semibold`, or HIS `--color-tint` inside the pane.

---

## 5. Bubbles

### 5.1 Geometry

| | Incoming | Outgoing |
|--|----------|----------|
| Align | Left | Right |
| Fill / type | `--cs-incoming-*` | `--cs-outgoing-*` |
| Tail | Lower-**left** | Lower-**right** |
| Max width | **75%** of the thread column | same |
| Radius | **18px** all corners | same |
| Padding | **7px 14px** | same |
| Type | 17px / **400** / 1.25 / `--cs-type` | same |
| Text align | Left, inside the bubble | Left, inside the bubble (bubble is right-aligned) |

Short one-line bubbles read as **pills** because `7 + 17×1.25 + 7 ≈ 35px` ≈ 2 × 18. Do not invent a second radius. If a one-line bubble is taller than 40px, the padding is wrong — fix padding, do not switch to Labs `radius.md`.

Gap: **6px** same-direction run. **12px** after a direction change or after a separator.

Every bubble has a tail (the still shows a notch on each). Do not implement “only the last in a group.”

### 5.2 Tails — not a CSS triangle

Use the locked SVG paths in `conversationTokens.ts`:

- `CS_TAIL_OUT_PATH` / `CS_TAIL_IN_PATH`
- viewBox `0 0 11 13`, size 11×13
- `fill` = that bubble’s background
- Position: outgoing `right: -5px; bottom: 0`; incoming `left: -5px; bottom: 0`
- Bubble `overflow: visible`

A CSS `border` triangle, a rotated square, or a 6px “caret” **fails**. The still’s tail is a small organic notch.

### 5.3 Per-bubble time (deliberate G4 deviation)

Every bubble carries a **rendered** time. Never hover-only.

- 12px / 400 / `--cs-meta`
- Format: `csFormatClock` → `5:27 PM`
- 4px below the bubble
- Incoming: left-aligned to the bubble. Outgoing: right-aligned to the bubble

This is Journal v0.6 §1.4 carried into the component. It does not fail the side-by-side (S3: bubbles / geometry / color / type). Keep it quiet so the still’s silhouette still reads.

---

## 6. Date-time separators and Read receipt

Same idiom as the still. Gray `#8E8E93`, **not** small-caps (the still is regular title case). Use the helpers in `conversationTokens.ts` — do not invent a third rule.

### 6.1 Conversation stamp

First visual conversation element (overlay, §3.1).  
`Conversation started Aug 13, 2026 · 9:58 PM` via `csFormatConversationStamp(startedAt)`.  
Omit the line when `startedAt` is absent.

### 6.2 Day/time separators

Centered in the thread, 12px / 400 / `--cs-meta`, vertical margin 12px.

Format: **`Yesterday 5:27 PM`** (`csFormatDayTimeSeparator`).

| When | Text |
|------|------|
| Same local day as now | `Today 5:27 PM` |
| Previous local day | `Yesterday 5:27 PM` |
| 2–6 days ago | `Saturday 5:27 PM` |
| Older | `Aug 13, 2026 5:27 PM` |

**Cadence (locked):** insert a separator between message N−1 and N when:

1. the local **calendar day** changes, **or**
2. `at[N] − at[N−1] ≥ 60 minutes` (`CS_SEPARATOR_GAP_MS`)

No separator before the first message. Locale is **`en-US`** (still idiom, stable).

### 6.3 Read receipt

Under the **latest outgoing** bubble (below that bubble’s per-bubble time), trailing / right-aligned, 12px / 400 / `--cs-meta`.

Format: **`Read Yesterday`** via `csFormatReadReceipt`.

Optional prop `receipt?: { kind: "read" | "delivered"; at: Date }`. Render only when provided.  
Lab / CL-1 fixture **must** pass a receipt so the still’s status line exists.

`delivered` → `Delivered` (no day). Default lab kind is `read`.

**Lab-only chrome.** DL-327: this fake receipt must not remount onto the member Journal without a real meaning. The component only renders what the host passes.

---

## 7. Interaction law

### 7.1 Composer (same entry, column-sized)

Pinned to the **bottom of the surface**, same white pane, always reachable without page scroll.

```
[  +  ]  [  Message                        ]  (empty — no send)
[  +  ]  [  typed text                 (↑) ]  (non-empty — green send)
```

| Part | Law |
|------|-----|
| `+` | 36px circle, 1.5px `--cs-plus-ring`, plus glyph `--cs-plus-glyph`. Left of the field, 8px gap. Calls `onPlusTap()`. Lab: quiet coming-soon until CL-V. **No** dead mic. **No** dictation waveform. |
| Field | Fully rounded pill, height **36px** visual, fill `--cs-composer-fill`, no Labs border (optional hairline `--cs-hairline`). Placeholder **`Message`** (≤ 2 words — not “Text Message”, not an essay prompt). Input 17px / **400**. |
| Send | Appears **only** when the field is non-empty: 32px circle `--cs-send-bg`, white up-arrow. Empty field: **no** send control (the still’s rest state). |
| Keys | `sendKey="enter"` (lab): Enter sends, Shift+Enter newline. `sendKey="mod-enter"` reserved for Journal remount — do not hardcode. |
| Focus | Visible 3px `--cs-focus-ring` on field / plus / send / back. Not Labs emerald. |
| Width | Composer row is the **column**, with 16px side padding. Never stretch to the page. |

Do **not** use kit `Button` / `IconButton` for plus or send. Those are Labs chrome. SVG chevrons/plus from `web/components/ui/icons.tsx` may be reused as **glyphs only**, restyled to these tokens.

Hit targets 44×44 on plus, send, and the field’s vertical hit (padding around the 36px pill).

### 7.2 Typing

When `typing === true`: one incoming gray bubble (same 18px / incoming fill) containing three 6px dots (`--cs-meta`), bounce `translateY(-3px)`, 420ms ease-in-out infinite, stagger 120ms. Not a Labs spinner.

### 7.3 Entrance

New **incoming** bubble: `translateY(8px) → 0` + opacity 0→1 in **180ms** (`--motion-ease` or `cubic-bezier(0.25, 0.1, 0.25, 1)`).  
`prefers-reduced-motion: reduce`: opacity only (duration 0 if the global reduce tokens are 0).

### 7.4 Fixed-height session (v0.6 §1.4)

- Host gives the surface a **bounded height** (typically `100dvh` on the chrome-less lab page).
- Thread scrolls inside. **Page never grows** with message count. 1 message and 40 messages = the same surface height.
- `overscroll-behavior: contain` — no scroll chaining to the document.
- New messages: scroll to bottom unless the reader is more than **40px** above the bottom.
- Reopen / remount: land at latest.
- Composer always in view without document scroll.

### 7.5 Focus order

Back → Plus → Field → Send (when present). Thread messages are not a tab stop. Escape does not trap.

### 7.6 Empty / unavailable

- Empty `messages[]`: overlay header + optional stamp + empty thread + composer. No fake bubbles.
- Host `unavailableCopy`: centered 12px meta line in the thread. Not a fake incoming turn.

### 7.7 Appearance

Optional `appearance: { incomingBg, incomingText, outgoingBg, outgoingText }`. Only those four. Everything else stays locked. Defaults meet 4.5:1. Lab contrast warning is a **host** panel concern (CL-4), not the surface.

---

## 8. Component contract Charlie must not invent past

`web/components/conversation/ConversationSurface.tsx` — **not** under `journal/`.

```
messages[]        { id, direction: 'incoming' | 'outgoing', body, at }
senderIdentity    { name, avatarUrl?, initials? }
onSend(text)
onBack()          // real control; lab host → /admin
backLabel?        // default "Back"
typing: bool
onPlusTap()
sendKey           'enter' | 'mod-enter'
startedAt?        Date | ISO
receipt?          { kind: 'read' | 'delivered', at: Date }
appearance?       { incomingBg, incomingText, outgoingBg, outgoingText }
unavailableCopy?  string
```

**Purity (grep-gated):**

- No `"Coach"` literal
- No `"/admin"` literal
- No fetch, no store, no `journal/` or `retrospective/` imports
- Persistence is the host’s job

Host maps roles. Lab: `coach → incoming`, `trader → outgoing`.

---

## 9. Explicit FAIL (CL-1-G / Echo review)

Any one of these fails the surface, even if the checklist is otherwise green:

| ID | Fail |
|----|------|
| **F1** | **Labs-chrome thread** — zinc/emerald/teal bubbles, `surface-card`, `--color-tint` as bubble fill, zinc-50 thread, kit `Button` send |
| **F2** | **Full-width bubbles** — column &gt; 420px, or bubbles/composer spanning the admin well |
| **F3** | **Missing overlapping header** — no avatar; avatar in a separate Labs bar; opaque header plate; name as a heading instead of a **pill on the avatar**; first bubbles not running under the mark |
| **F4** | Bubble copy weight **≠ 400** (medium / semibold / `font-medium` / 500+) |
| **F5** | Wrapping admin NAV (the 16-link strip) competing with the thread |
| **F6** | Back chevron inert, missing, or not a real control |
| **F7** | Missing still separators (`Yesterday 5:27 PM` idiom) or missing Read receipt on the fixture |
| **F8** | CSS triangle tails |
| **F9** | Generated portrait; `"Coach"` baked into the component |
| **F10** | Composer or thread stretched to the page; page grows with messages |

Side-by-side with the still, a viewer should not be able to say which is which at a glance for **bubbles, geometry, color, and type**. If the honest reaction is “a form with decorations” or “an admin card,” it fails.

---

## 10. Side-by-side notes (read off the still)

Measured against `docs/references/coach-lab-imessage-reference.jpg` (logical 375-wide phone):

1. **White field, edge to edge.** No zinc frame. No emerald accent bar. Status-bar iOS chrome is **not** replicated.
2. **Back** is a thin gray ring, high-left — not a Labs text link.
3. **Avatar** is a cool blue-gray circle, initials white and **semibold**, dead-center. It sits **on** the first green bubble.
4. **Name pill** is a light capsule with a trailing chevron, clipped onto the **bottom of the avatar**, not parked in a gap below it.
5. **Long outgoing** is iMessage green, ~18px corners, white regular type that wraps like a phone text — large, not 13px form copy, not 22px hero.
6. **Second outgoing** is a separate bubble with its own lower-right tail, tight gap.
7. **Incoming** is `#E9E9EB`, near-black regular type, lower-left tail.
8. **`Yesterday 5:27 PM`** is centered, small, gray, regular weight — the still’s exact cadence.
9. **`Cool. Thanks!`** is a short **pill**, same green, same tail family.
10. **`Read Yesterday`** sits under that pill, trailing, same gray family.
11. **Composer** is a `+` ring + gray pill. Empty rest state: no send, no mic (we omit the still’s dictation glyph until CL-V).

Do not “adapt” these to Labs density. Replicate them in a 375–420 column.

---

## 11. What Charlie builds next (not this packet)

| Seed | Files | Note |
|------|--------|------|
| **CL-1-1 / CL-1-2** | `ConversationSurface.tsx` + fixture mount | Fixture messages. No `/admin/coach-lab` page yet if CL-4 is not open. Fixture **must** show the overlapping header, a `Yesterday 5:27 PM` separator, a short outgoing pill, and `Read Yesterday`. |
| **CL-4** | Lab route + layout branch | Apply §2.2. Back → `/admin`. Do not resurrect the wrapping nav on this route. |

This packet does **not** add `ConversationSurface.tsx` or a lab page.

---

## 12. Bench delta

The next invocation (Charlie CL-1-1, Echo CL-1-3) can now implement and review against **numbers and FAIL IDs**, not a mood. Specifically: HIS-X-CS-1 is named; the wrapping-nav rejection is encoded as G2 page law + F5; the overlapping avatar/name-pill geometry is specified in CSS-px so the reverted “avatar gone” ship cannot be honestly rebuilt; separator gap is 60 minutes; back is a real `onBack` (lab → `/admin`) without baking the path into the reusable surface.
