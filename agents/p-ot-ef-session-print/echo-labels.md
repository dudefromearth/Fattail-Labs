# Echo labels — session / print / two clocks

**Agent:** Echo  
**Seed:** `seeds/W1-1-echo-labels.md`  
**Date:** 2026-08-16  
**Status:** Words only. No chrome. No `web/` or `server/` edits.  
**Reviewers next:** Tango (W1-2) · Hotel (W1-3) — objections sit **beside** these words, labeled as the reviewer’s.  
**W3-2:** If that seed fires before **W1-G**, it is **BLOCKED on W1**. It may not invent chrome or a second word list.

**Law read (this packet):**

- OT-EF v1.1 §2.2 Law B (named state) · Law C (two clocks) · §8.3 Echo seed list  
- Session/Print Spec v0.1 §6 (member experience)  
- Human Interface Spec v1.0 §2 (clarity, deference, no profit theater)  
- DL-394 (Show is an independent checkbox)

**Coach Content Law:** Session/Print §6 and OT-EF §8.3 already named the six-word list — **Live · Pre/post · Off market · last print · Held residual · EXPIRED**. Those stay. This file assigns them to surfaces and fills the seed table. Envelope field names (`market`, `print_quality`, `last_print`, …) are **not** renamed. Law C is **not** changed.

---

## Six badges (plane)

| # | State | Badge / plane |
|---|--------|----------------|
| 1 | `open` + `live` | **Live** |
| 2 | `extended` + last print | **Pre/post** |
| 3 | `closed` + last print | **Off market** |
| 4 | Held / residual (after τ, before midnight ET) | **Held residual** |
| 5 | EXPIRED (after midnight ET) | **Expired** |
| 6 | `print_quality=none` | **No print** |

**Last print** is not a seventh badge. It is the **package-quality phrase** under a number when OPF has a held print (`extended` or `closed`). Session plane and print quality are two axes; they share one vocabulary.

**Named incomplete** (Session/Print §6 badge cell) is the doctrine *class* — use a named incomplete state, never a blank. The member word for that class is **No print**. The package cell stays in the existing Law B register (**UPDATING** / **CHECK LEGS**).

---

## Required table

| State | Badge / plane (≤2 words) | Package / curve reads as | Must not say |
|-------|--------------------------|---------------------------|--------------|
| `open` + `live` | **Live** | The numeric live mark. Curve is the live book. Member reads: *this is the market now.* | Last print; held; delayed; estimated; theoretical; “approx”; Pre/post; Off market |
| `extended` + last print | **Pre/post** | The numeric **last print** plus a short held disclaimer. Curve is that held print, not an RTH NBBO book. Member reads: *pre/post print — not the RTH book.* | Live; open; NBBO; “after-hours live”; “you can lift this”; unavailable; closed; outage; error |
| `closed` + last print | **Off market** | The numeric **last print**, labeled held. Curve is the last known print. Member reads: *last known print — the market is closed.* | Live; Pre/post; unavailable; OPF unavailable; error; offline; broken; “no data”; “market down”; a blank cell |
| Held / residual (after τ, before midnight ET) | **Held residual** | Frozen last print / residual **plus** the named state. Numeric is allowed (Coach 2026-08-16). Curve is residual, never live. Member reads: *settled; still on the card until midnight ET; not live.* Package-cell token if the number is replaced or paired: **HELD RESIDUAL**. | Live; open; “still trading”; “through the close”; “expires at the bell”; “expires at 4”; last print presented as current tape; a blank cell |
| EXPIRED (after midnight ET) | **Expired** | Named state **EXPIRED** plus the **defined debit** on the viewport ghost. Never a blank price. Member reads: *this expiration day has ended (after midnight Eastern Time). The ghost is the defined debit, not a live mark.* | Live; last print as a current mark; a blank cell; **$0** as “worthless”; “you made / you lost”; profit theater |
| `print_quality=none` | **No print** | No number. Package / curve use today’s Law B names: **UPDATING** while resolve is in flight; **CHECK LEGS** if the structure cannot bind. Member reads: *no generation yet — the app is not broken.* | Unavailable; OPF unavailable; error; broken; offline; retry; a guessed mid; **last print** (there isn’t one); a blank cell |

---

## Show (checkbox verb)

**Show** is the verb for the independent checkbox on a position card (DL-394 · Analyzer AZ-LAYOUT-4 / AZ-FOCUS-2).

| Say | Do not say |
|-----|------------|
| **Show** | Focus |
| **Hide** (unchecked) | Select for graph |
| | Include / plot / activate / enable |

Checking Show on card B **must not** un-show card A. Highlight (focus) is a separate, quieter act and is **not** this control. One vocabulary: the box is Show; the book is every shown card.

---

## HIG (words, not chrome)

Member dialect: calm, elevation-honest, content first.

- **No pastel panic.** Closed, held, expired, and no-print are expected options states — not alerts, not red banners, not “connection lost.”
- **No profit theater.** No P&amp;L celebration, no “you’re winning,” no lift-now urgency on a last print or a ghost.
- **Last print is not an outage.** Off market + a number is truth. Do not flash **OPF unavailable**.
- **Held residual is never Live.** After τ and before midnight ET the plane may still show a number; that number is residual.
- **EXPIRED is never a blank price.** Ghost + defined debit, or the named state **EXPIRED** — never an empty cell that looks like a bug.
- Sentence case on **plane badges** (Live, Pre/post, Off market, Held residual, Expired, No print). Law B **package replacements** stay the existing ALL-CAPS register (EXPIRED · HELD RESIDUAL · UPDATING · CHECK LEGS · NOT TRADED · …). Do not invent a third casing.

No components, no tokens, no color grammar in this seed. W3-2 implements Session/Print §6 **with these words** and the existing kit — it does not mint a new badge recipe.

---

## Control grammar — one vocabulary, three placements

Session/print and two-clock honesty use **one word list**. Placement changes density, not dialect.

| Placement | Job | Words it may show |
|-----------|-----|-------------------|
| **Plane badge** | Session / clock class of the feed (Analyzer chrome and Builder plane — same string) | **Live** · **Pre/post** · **Off market** · **Held residual** · **Expired** · **No print** |
| **Package chip** | Price cell on the card / package quote | A **number** only when OPF can stand behind it, labeled **live** or **last print** or **held residual** or **defined debit**; otherwise a Law B ALL-CAPS name from the table above |
| **Curve** | Risk graph / Surface | Same claim as the package chip. Live book, held last print, held residual, EXPIRED ghost + defined debit, or scales+grid with the named state. Never a second vocabulary (“focus series”, “stale quote”, “offline curve”) |

**Builder plane** = Analyzer plane badge. Edit-with-last-print is Off market or Pre/post, never “OPF unavailable.”

**Two axes, not six moods:**

1. **Market / clock** → plane badge (Live / Pre/post / Off market / Held residual / Expired / No print).  
2. **Print quality** → how the number is named (**live** vs **last print**) or that there is **no print**.

Do not collapse them (do not badge “Last print” as if it were a session). Do not split them (do not say “Closed” on the plane and “Held” on the chip and “Stale” on the curve).

---

## Invariants (this seed)

- Last print is not an outage.  
- Held / residual is never live.  
- EXPIRED is never a blank price.  
- Show is the checkbox verb — not focus, not select-for-graph.  
- Envelope fields and Law C are untouched.

---

## Hand-off

Tango (W1-2) and Hotel (W1-3) review **this file**. Do not delete Echo’s proposals; label notes beside the row.

Done when every row has badge text, package reading, and forbidden phrasing — this document.
