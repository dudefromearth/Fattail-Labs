# Echo visual law — Journal + Retro interface floor

**Seat:** Echo  
**Refs:** `Specs/references/journal-retro-v0.7.1/ref1.png` · `ref2.jpg`  
**Parents:** HI Spec v1.0 · Retro §6.3 · Session v0.6 §1  
**Charlie implements this packet only. Do not invent chrome.**

---

## Tokens (add to `web/styles/tokens.css`)

| Token | Role | Intent vs ref |
|-------|------|----------------|
| `--journal-bubble-out` | Member bubble fill | Bold, saturated (ref2 green). Use `#30d158` (HIG system green). |
| `--journal-bubble-out-label` | Type on out bubble | `#ffffff` |
| `--journal-bubble-in` | Agent / incoming fill | Soft gray `#e9e9eb` (ref2 incoming). |
| `--journal-bubble-in-label` | Type on in bubble | `--color-label` |
| `--journal-composer-radius` | Composer shell | `1.5rem` (24px) — large rounded rect, not a skinny field. |
| `--journal-bubble-radius` | Bubble corners | `1.15rem` |
| `--journal-send` | Send control | `--color-tint` fill, `--color-on-tint` glyph, `2.25rem` square, `0.65rem` radius. |

Do not use raw hex in components after tokens exist.

---

## Composer (ref1)

- One white surface, 1px separator, large radius, soft shadow (`0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.06)`).
- Type: `--text-body` / 17px, `--color-label`, line-height 1.45. Placeholder `--color-label-tertiary`.
- **Grows with input** (min ~3.25rem, max ~10rem). Not a fixed 3-row box that looks flat.
- Focus: 2px tint ring, offset 2. Composer feels alive.
- Bottom row **inside** the shell: `+` (44pt hit) left; send square right.
- `+` fires `journal-open-attach` (SessionMediaHeader listens). Do not fake a file UX.
- **Voice:** do not ship a dead mic. **Hard — named:** no voice path in Journal today. Omit until Coach GO for voice.
- Enter sends; Shift+Enter newline; ⌘/Ctrl+Enter also sends.
- No “Fable 5 / High” model chrome (not our product). Intelligence is behavior, not a clone of Claude’s picker.

## Thread (ref2)

- Incoming left, outgoing **right**.
- Outgoing: `--journal-bubble-out`, white type, **semibold 17px**. Incoming: gray fill, dark type, same size.
- Radius `--journal-bubble-radius`. Tail optional; do not shrink type to fit.
- Timestamp **visible** under the cluster (Session §1.4) — caption, `--color-label-tertiary`.
- Arrival: 160ms ease-out translateY(6px)→0 + opacity. Honor `prefers-reduced-motion`.
- Thread is a bounded scroll region; composer pinned; page does not grow.

**Not the floor (iMessage app chrome we do not clone):** phone status bar, contact avatar “Chris”, “Read Yesterday”, back chevron. Floor is **bubble craft and type**.

## Intelligence (in use)

- Composer always ready; first send creates the session (already law).
- Controls sit **in** the composer (`+`, send), not in a distant toolbar.
- After send, focus stays in the composer; thread sticks to latest unless member scrolled up.
- Empty thread: no instructional paragraph (“Write below to begin”). Silence is ready.

## Retro chrome

Same tokens. Compile block is a **surface**, not a form wall. One-thing field uses composer radius + body type. Do not re-ask the four questions as inputs.

## Hard (Coach)

1. **Voice** — omitted; not built. Say if you want it.  
2. **Pixel-identical iMessage green on every theme** — we tokenize system green; dark mode uses the same token.  
3. **Read receipts** — not a Journal product fact; not faked.

---

Charlie: implement Journal first (IF3), then Retro (IF4), using only this packet.
