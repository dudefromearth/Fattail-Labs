# C0-4 — Echo UI / design

**Agent:** Echo  
**Date:** 2026-08-06  
**Depends on:** C0-0 PASS · Spec v1.0.2 §5–§7 · Tango C0-2 copy · HI Spec v1.0  
**Verdict:** **APPROVED** — design direction for Charlie (no freestyle chrome)

**Constitution:** `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md`  
**Tokens ground truth:** `web/app/globals.css` · `web/styles/tokens.css` · `.surface-card` / `.bg-canvas`

---

## 1. Seed checklist

| # | Item | Verdict |
|---|------|---------|
| 1 | Channel list + stream + composer density | **PASS** — layout packet §2 |
| 2 | Discord name / avatar; unlinked author | **PASS** — §3 |
| 3 | FatTail shelf vs member shares hierarchy | **PASS** — §4 |
| 4 | Connect Discord empty/CTA | **PASS** — §5 (Tango copy) |
| 5 | Hold vs deleted states | **PASS** — §6 |
| 6 | In-app `CommunityChannelPanel` embed | **PASS** — §7 |

No HIG invariant breaks in Spec intent. **RETURN** only if implement invents Discord-clone neon chrome, emoji-as-icon, or canvas-without-surface cards.

---

## 2. Page composition — `/app/community`

### 2.1 Shell

| Region | Spec |
|--------|------|
| Page canvas | `color.canvas` / `.bg-canvas` (member shell, same as other `/app/*`) |
| App header | Title **Community** + one-line Spec blurb (secondary label color); no second mega-nav |
| Primary work surface | One `surface-card` (or split cards) — pure white on soft canvas |
| Density | Member dialect: **comfortable** default; stream rows can go **compact** on `sm+` if ≥44px hit targets retained |

**Do not:** Fake Discord dark theme, server rail, Nitro chrome, or a full third navigation system. This is a **Labs second window**, not a Discord reskin.

### 2.2 Desktop layout (≥ `md`)

```text
┌─────────────────────────────────────────────────────────────┐
│ Community · blurb                                           │
├──────────┬────────────────────────────┬─────────────────────┤
│ Channels │ Message stream             │ Shelves (sticky)    │
│ ~220px   │ flex 1 · min-w-0           │ ~300–320px          │
│ surface  │ surface                    │ surface             │
│          │ ┌ header: #title · status ┐│ FatTail Bots        │
│ list     │ │ scroll stream           ││ ─────               │
│          │ │ composer sticky bottom  ││ Member shares       │
└──────────┴────────────────────────────┴─────────────────────┘
```

| Column | Rules |
|--------|--------|
| **Channels** | Vertical `List` / list rows; selected = tint wash or left accent bar (token tint), not heavy fill; archived hidden or dim section |
| **Stream** | Deference: content first; chrome header thin; composer **sticky bottom** of column (not floating FAB) |
| **Shelves** | Secondary column; collapsible to bottom drawer on small screens |

### 2.3 Mobile / narrow (`< md`)

```text
[ Channel picker: Segmented or Menu “General ▾” ]
[ Stream full width + composer ]
[ Shelves: tab or bottom sheet “Bots” ]
```

- Channel switch: **Menu** or select-style control (HIG), not a permanent three-column crush.  
- Shelves: **Segmented** “Chat | FatTail | Shares” **or** sheet from “Bots” button — Charlie picks one pattern; do not stack three full columns.

### 2.4 Channel list row

| Element | Treatment |
|---------|-----------|
| Title | Primary label; seed titles: General, Practice, Strategy Lab, Toughness |
| app_key badge | Optional quiet secondary text (“Practice”) — no emoji |
| Selected | `color.tint` at low opacity background **or** 3px leading bar |
| Hit target | ≥ 44px row height |
| Order | Spec `sort_order`; General first among seeds |

### 2.5 Message stream + composer

| Element | Treatment |
|---------|-----------|
| Row | Avatar (32–40px circle) · name stack · body · meta (time) |
| Spacing | 8–12px vertical between messages; group same-author within ~2 min (optional P1 polish) |
| Composer | Multi-line `textarea` min 2 lines; primary **Send** button; disabled when unlinked or not entitled |
| Disabled composer | Visually disabled + **inline banner** above (Connect CTA) — do not hide composer without explanation |
| Loading / fail | Fail loud inline error (token destructive text); no optimistic permanent bubble on API fail (Spec §6.7) |
| Scroll | Newest at bottom (Discord convention for second window); “Jump to latest” if scrolled up |

**Icons:** Lucide / existing kit only — no emoji chrome (HI Spec §5).

---

## 3. Identity chrome (Discord name / avatar)

| State | Avatar | Name | Trailing |
|-------|--------|------|----------|
| Linked Labs member | Discord avatar if URL; else monogram from name | **Discord name** (fattail.ai) | Optional quiet **via Labs** chip on *own Labs-origin* messages |
| Discord author not in Labs | Same avatar rules | Discord name only | **No** Labs profile link / chip |
| Own message Labs-origin | Same | Name + **via Labs** badge | — |

| Token note | |
|------------|--|
| Name | `color.label` primary; weight medium |
| via Labs | Secondary label / capsule: `surface.secondary` fill, 11–12px, not brand shout |
| Time | Tertiary / separator color; relative or short absolute |

**Do not:** Purple Discord brand splash as Labs chrome; small Discord mark only if needed for “same room” affordance in empty state — prefer text per Tango.

---

## 4. Shelves hierarchy (FatTail vs member)

Visual weight: **FatTail Bots first** (house catalog), **Member shares second**.

| Shelf | Card |
|-------|------|
| **FatTail** | `surface-card` nested or list rows; title + version `key@v`; process summary 2 lines max; course_refs as quiet text links; actions: secondary **Apply** / **Copy & rebuild** |
| **Member** | Slightly quieter: no “featured” glow unless Coach later adds curated tier; provenance line (Tango) under title |
| Empty member | Centered empty state inside shelf panel — Tango copy |
| Forbidden | P&L sparkline, green “winner” badges, ROI chips, leaderboard density |

**Action grammar:** Primary on card = **Apply to Design**; secondary = **Copy & rebuild**. Never a filled destructive or “Deploy live” primary.

---

## 5. Connect Discord CTA (composer / empty)

Align **Tango C0-2 §3.1** strings exactly.

| Layout | |
|--------|--|
| Pattern | Inline **banner** above composer (`surface.secondary` or soft tint wash) — not a full-page modal wall when stream is readable |
| Primary button | Brand tint **Connect on fattail.ai** (opens external; `rel` external affordance / icon if kit has external-link) |
| Secondary | Text button **Keep reading** |
| Unlinked + reading | Stream fully usable; only post path blocked |

**Do not:** Full-screen interstitial blocking lurk; dark-pattern modal on every page load.

---

## 6. Hold vs deleted (visual states)

| Message state | Stream treatment |
|---------------|------------------|
| `visible` | Normal |
| `deleted` (Discord-side) | Omit from default stream **or** single-line placeholder “Message removed in Discord” in tertiary style — no body |
| `held` (Labs admin) | **Members:** omit (same as not shown). **Admin:** show row with muted body + badge **Held in Labs** (not “Deleted”) |
| Admin action | Menu item **Hold in Labs** → AlertDialog with Tango confirm copy |

**Do not:** Red “DELETED” stamp that implies guild takedown for Hold.

---

## 7. In-app embed — `CommunityChannelPanel({ appKey })`

| Element | Spec |
|---------|------|
| Chrome | Compact **surface-card** inside host app (Practice / Strategy Lab / Toughness) |
| Header | Channel title · quiet “same as Discord” · link **Open in Community** (text link / secondary button) → `/app/community?channel={slug}` |
| Body | Stream + composer (same components as full board; shared React module) |
| Height | Fixed max-height (~360–480px) with internal scroll; do not steal entire Strategy Lab viewport |
| Journey / Wiki | Component must **no-op or not mount** for those app keys (Spec §5.4) |

**Host integration:** Prefer a labeled section “Community · Strategy Lab” under suite chrome — not a floating Discord widget aesthetic.

---

## 8. Control inventory (Charlie may use — no freestyle)

| Primitive | Use |
|-----------|-----|
| `surface-card` | Stream column, shelves, embed |
| List / list rows | Channels, message list |
| Button primary / secondary / text | Send, Connect, Keep reading, Apply |
| AlertDialog | Hold confirm; destructive only if true delete-from-Labs-admin future |
| Menu | Channel picker mobile; message admin actions |
| SegmentedControl | Mobile Chat \| Bots tabs if chosen |
| Empty state pattern | Centered title + body + optional CTA (existing app empties) |

---

## 9. Accessibility

- Focus order: channel list → stream → composer → shelves.  
- Composer focus ring token-visible.  
- Avatar + name not color-only for identity.  
- `prefers-reduced-motion`: no entrance spam on new messages.  
- External connect link announced as opens new context if `target=_blank`.

---

## 10. Explicit non-goals (block at UI review)

1. Discord blurple skin / server list clone.  
2. Emoji as structural chrome.  
3. Border-only cards on canvas without `surface`.  
4. Mystery icon-only Send without label on mobile if space allows icon+text.  
5. Profit-colored metrics on share cards.  
6. Journey/Wiki community embeds.

---

## 11. Bench delta

1. **Three-column → one-column progressive disclosure** is the mobile law.  
2. **Second window, not Discord skin** — Labs HIG surfaces win.  
3. **Hold badge language** is a visual+label pairing with Tango.  
4. Shared **stream + composer** module for full page and `CommunityChannelPanel`.

---

## 12. Verdict

**APPROVED.** Charlie implements against this packet + Tango copy + Spec. Echo reviews C1a shell screenshots / PR before C1a-G if layout diverges.
