# SO-AR Spec v0.8 — Amendment A1

**Date:** 2026-08-27
**Amends:** `Specs/FatTail-Labs-StudioOne-Archive-Read-API-Spec-v0_8.md`
**Type:** Amendment. Does **not** supersede v0.8 and does **not** reissue it. v0.8 plus this file is the law Delta reads.
**Reason:** v0.8 states as fact something the disk and the tap source disprove, and the bench plan at v1.7 locks a cascade terminating in a hole v0.8 does not define. Both are defects in v0.8, both are the advisor's, and both are **BLOCKING** for W0-BA — the first because it is false law in the primary document, the second because W2 would build a path with no defined endpoint.

**Two changes. Nothing else in v0.8 moves. §0 and §0-A are untouched.**

---

## A1-1 — Strike the local-date proof (§1, "Reconstructing `t`")

**What v0.8 says.** That choosing the candidate whose America/New_York local date equals the folder date is "silently wrong for every prior-evening snapshot," wrong by exactly twenty-four hours, with a worked example placing a `001730Z` file a full day late.

**Why it is wrong.** The proof rests on v0.1's description of the tap window as "GTH the prior evening through NY midnight of D+1" — folder D holding the evening *before* D. The tap source disproves it. `ensure_day()` rolls the folder when `today_ny()` changes, so folder D contains exactly those writes where `today_ny() == D`. **Every snapshot in folder D therefore carries New York local date D by construction.** The two UTC candidates are twenty-three or twenty-four hours apart, so exactly one can carry NY date D, and it is the correct one.

**The window rule and the local-date rule agree on every day except the fall-back Sunday**, where the window spans twenty-five hours of UTC and both candidates can fall inside it — the case A1-2 governs.

**Strike** the paragraph beginning *"Why not the obvious rule"* and its worked example, in full.

**Replace** with:

> **Why the window and not the local-date test.** The natural alternative — pick the candidate whose America/New_York local date equals D — is **equally correct on every ordinary day**, because `ensure_day()` files by `today_ny()` and so every snapshot in folder D carries NY date D by construction. The window is preferred for two reasons, neither of which is that the other rule is wrong: it is explicit rather than inferred, and it derives from the same call the tap uses to choose the folder, so the reader and the writer cannot drift apart. **The two rules diverge on exactly one night a year** — the fall-back Sunday, whose window spans twenty-five hours of UTC and can therefore admit both candidates. Neither rule resolves that case; it is governed below.

**Provenance.** The struck claim is the advisor's, not Coach's. It never appeared in §0 or §0-A and its removal touches no Coach text.

**Confirmed against store data, 2026-08-27.** `snap-000000997Z.json` in `day=2026-08-25/chain/SPX/`: candidates Aug 25 00:00:00.997Z (outside `[Aug 25 04:00Z, Aug 26 04:00Z)`) and Aug 26 00:00:00.997Z (inside, = 20:00 ET Aug 25). The envelope reads `captured_at = 2026-08-25T20:00:00.997973-04:00`. Exact agreement, on a wrapping file, in the store the API reads. **The window rule is measured, not only reasoned.**

---

## A1-2 — Add the hole `AMBIGUOUS INSTANT` (§5, and the §9 status table)

**Why it is needed.** On the fall-back Sunday, a clock inside `[04:00Z, 05:00Z)` yields **two** in-window candidates. v0.8 defines `OUT OF WINDOW` for a clock with **no** candidate inside. Using it here would record the opposite of what happened, and Hotel's gate reads a named hole as truth about the data.

**Add to the §5 named-holes table:**

| Name | When |
|---|---|
| **AMBIGUOUS INSTANT** | Two in-window candidates and nothing separated them (fall-back Sunday, `[04:00Z, 05:00Z)`). Named, skipped, **never** recorded as `OUT OF WINDOW` — that hole means no candidate was inside, which is the opposite fact |

**Add to the §9 HTTP status table:**

| Hole | Status |
|---|---|
| `AMBIGUOUS INSTANT` | **200** with the row named and skipped, as `UNREADABLE` |

**Add to §1, after the reconstruction rule:**

> **Two candidates in window.** The window spans twenty-five hours of UTC on the US fall-back Sunday, so a clock in `[04:00Z, 05:00Z)` can yield two candidates. That hour is either Saturday night with nothing trading, or Sunday night in live global-session hours. Resolve in this order, and **only for such files**:
>
> 1. **Open that JSON.** Take the in-window candidate **nearest** `captured_at`, else `generation.as_of`. Nearest, not equal: `as_of` is the bus generation and runs seconds ahead of the write, and `captured_at` matches the filename only to milliseconds. Candidates are twenty-three to twenty-four hours apart, so seconds cannot flip nearness. **Reject the envelope if the timestamp is more than five minutes from the candidate it selects** [advisor-set] and continue.
> 2. **Neighbour-monotonic.** Take the candidate that keeps the sequence non-decreasing against already-resolved instants either side. This is ordering against instants derived from data — **not** the name-order rollback, which is the wrap this spec rejects.
> 3. **`st_mtime`, and only if the mtime itself falls inside the folder's window.** Mtime does not go missing on a copy; it goes *wrong* — `cp` without `-p` sets every file to the copy time, present and uniform and meaningless. A preserved write mtime sits seconds from `captured_at` and is inside the window by construction; a copy-time mtime lands months outside and is rejected on sight. This is why mtime ranks below neighbours: it fails confidently, and they fail honestly.
> 4. Else **AMBIGUOUS INSTANT**.
>
> **This is an explicit, named exception to "the index never opens JSON" (§4.2).** It is bounded to files with two in-window candidates — one hour, one Sunday a year — and must be a named branch in the reader, never a quiet `json.loads` on the hot path. The acceptance test for no-envelope-opens carries the same exception.

---

## What this amendment does not do

- Does not touch **§0** or **§0-A**. Coach Content Law holds; the struck text is advisor prose from §1.
- Does not change the window rule itself, the ordering law, the ladder, the hash, or any advisor-set value.
- Does not renumber a law, a hole, or a section.
- Does not resolve §9b. Ordering by reconstructed `t` remains the plan's locked position (88 of 127 books wrap on the store) and remains **your tick**, not this amendment's.
- Does not carry the plan's other repairs — the §8 line still calling reconstruction retired, the §1 Seek paragraph with its `sorted()` and `i % 64`, the §4.2 and §4.3 "expiration (required)" query lines, and the §7 `no-store` cell. **Those are editorial leftovers with later law already governing them**, and they belong on Lima's W8 repair list rather than in a blocking amendment. They are listed here so the count is known, not so they are fixed here.

---

## Provenance

Both defects are the advisor's. A1-1 was written into v0.2 through v0.8 on a premise never checked against the tap source; Grok found it at plan v1.3 and did not code around it. A1-2 is a hole the plan needed and the spec never defined.

**Folded into a reissued spec at Coach's word.** Until then, v0.8 and this amendment are read together.
