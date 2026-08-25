# SC-0-G — Factory four stale→replacement diffs

**Gate:** Source Contract SC-0 (Factory/Gemba floor, four diffs)  
**Coach:** run SC-0 now; stop at SC-0-G; **GO IF-2 unstamped**.  
**DL:** **DL-565** (this packet) · wiki-side SC-0 **DL-562 / DL-564**  
**Verdict: PASS**

Delta did not modify the work under review after this evidence capture.

Diffs only. Documents not regenerated. No product schema. No emitters. No GO IF-2.

## The four diffs

### 1. Factory Spec OD-F10 / §6 / §9

**Stale:** Deploy pushes a complete registration envelope; incomplete package stops the belt.

**Replacement (quoted):**

§6 step 4:

```
4. **Exposes a publication signal** (the Deploy / Live transition). No envelope,
   no delivery hook, no wiki page bytes. The Factory does not know the Wiki
   agent exists.
```

§3.4 Build → Live required inputs: Built-ready **and** product type/tier/free-vs-paid only. No complete-package row.

§9: publication signal; Wiki composes Wiki-side; **no** Factory delivery hook; **no** `kind=registration` push.

OD-F10: **SUPERSEDED**. Original Accept kept as labeled history (Coach Content Law). Replacement: publication signal only.

### 2. Factory plan IF-4 seeds

**Stale:** Build a delivery hook.

**Replacement (quoted):** IF-4 packet and seed row:

```
No delivery hook. IF-4 is smaller.
IF-4-* | … | **GO IF-4** + B5. **No delivery hook.** Publication signal only. IF-4 smaller.
```

B4 **DEAD**. No Wiki-side field-list completeness checker. IF-4 seed files are **not** written (GO IF-4 unstamped); the plan packet **is** the seed text.

### 3. Gemba invariant 9 (priority)

**Stale:** “Deploy pushes registration” / Help Package as a Factory stop.

**Replacement (quoted `agents/bench/gemba.md` invariant 9):**

```
9. **Publication signal at Deploy** — Deploy exposes the Factory’s publication
signal (Live). Gemba never writes wiki pages and never constructs a Wiki-side
contract. Wiki polls the signal, hashes, and composes or L12-declines. A thin
template is Wiki’s decline, not a Factory belt-stop. *(Source Contract v0.1.4
· DL-560 · SC-0.)*
```

Evidence: `rg "Help Package|pushes registration|registration contract" agents/bench/gemba.md` → **none**.

### 4. IKI Factory board card

**Stale:** Help Package chrome on the Kanban card.

**Replacement:** `web/components/admin/IkiFactoryBoard.tsx` waiting copy is floor state only (skills / raw `waiting_reason`). No Help Package branch.

Evidence: `rg "Help Package|help package" web/components/admin/IkiFactoryBoard.tsx` → **none**.

## Evidence commands

```text
rg -n "complete Help Package|incomplete package stops" "Specs/FatTail Labs — IKI Factory Spec v0.1.5"
  → history / SUPERSEDED labels only (changelog + OD-F10 original Accept)

rg -n "Help Package|pushes registration" agents/bench/gemba.md
  → (none)

rg -n "Help Package" web/components/admin/IkiFactoryBoard.tsx
  → (none)
```

## Does not

**GO IF-2.** GO SC-1. Publication-signal runtime. MiniTwo. Regenerating any of the four documents.

**Signed:** Delta  
**Date:** 2026-08-24
