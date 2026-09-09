# Lima · DL-686 draft (not filed)

**Date:** 2026-09-09  
**Do not paste into `Architecture/00-decision-log.md` until Coach stamps the addendum.**  
Language: **ratified for build**. Never “shipped.”

Addendum: `Specs/FatTail-Labs-Sessions-Addendum-Intraday-Segments-DRAFT.md`  
Parent Spec remains BUILD AUTHORITY until the version bump is stamped.  
Parent sha1 at GO `81984ba9f2394d52aa359cefcdb108451fdec9e3`; after OD-S7 note `fab85adacefc4898ab377930154d5b8bfef8cd7c`.

Next free DL after **DL-685** is Lima’s to confirm **at paste time**. Draft uses **DL-686**.

---

## Draft DL entry (paste after stamp)

```markdown
## 2026-09-09 — DL-686 Sessions addendum §12 FatTail Intraday Segments ratified for build

**Decision (Coach).** Spec addendum
`Specs/FatTail-Labs-Sessions-Addendum-Intraday-Segments-DRAFT.md`
folded into the parent as **§12** / Spec **v0.2** (or v1.1 if so ticked).
Parent `Specs/FatTail-Labs-Sessions (Global Session Clock).md`.
Board `agents/p-sessions/`. Token `agents/go/GSC-W0.md` unchanged except this
addendum and OD-S8.

Three ET wall-clock segments over US cash: Morning 09:30–12:30, Afternoon
12:30–14:30, Closing 14:30–16:00. Boundaries do not scale. Early close
**truncates** (Closing absent); full close / weekend: segments empty.
`sessionView` is SoR for `segments` and `currentSegment` (L11 extended).
New pure module `web/lib/sessions/segments.ts`. Components do not compute
12:30 or truncation.

This is a **FatTail teaching frame, not market structure.** §11 gains a
framework disclosure. No opportunity / ranking copy (AT-GSC-56).

**Execution:** GSC2.5 (pure) before GSC4 ribbon. `timeAxis.ts` /
`exchanges.ts` stay closed. GSC4 still needs OD-S4 independently.

**OD-S8** _copy tick: (a) keep `Sessions` / (b) rename._ Default if silent: (a).

§12.7 defaults if silent: boundaries 09:30 / 12:30 / 14:30 / 16:00; labels
Morning · Afternoon · Closing; truncate not compress.

**Does not:** reopen GSC2-G. Start GSC4 without OD-S4. Live quotes. Persist.
Rename unless OD-S8 (b). MiniTwo / DudeTwo this stamp.
```

---

## GSC-W0 paste (Coach, same stamp)

Under Open decisions, after OD-S7:

```markdown
| **OD-S8** | (a) default | Keep nav label **`Sessions`** (L6). Collision with Live / Journal Sessions noted, not renamed. |
```

Or (b) with Coach’s string.

L11 line: add “plus `segments` / `currentSegment` (addendum §12).”

---

## Lima · GSC2.5 done (this packet)

Draft only. Parent Spec not appended. Decision log not appended. No product code.
