# FatTail Labs — Options Lab Position Control Spec v1.2

**Type:** Product Spec — position editing across card, dialog and canvas; control vocabulary; price
and lock law; chain binding; lifecycle boundary
**Short name:** Position Control · **PC**
**Surface:** Options Lab **Analyzer** (`/app/options-lab/analyzer`)
**Date:** 2026-09-11
**Baseline commit:** `34b84a7`
**Evidence basis:** `Analyzer-Position-Handling-Audit-v1.0` @ `d20b4f9`

**Supersedes v1.1** (`Specs/FatTail-Labs-Options-Lab-Position-Control-Spec-v1_1.md`), which
superseded v1.0. Both remain on disk: v1.0 is the version Bench Plan v1.1 was first written against,
v1.1 is what the card work landed in.

### What v1.2 changes

**One section: the classifier (§4.4).** No other law, test, or section differs from v1.1, and no
classification outcome changes.

The classifier's side-pattern predicates were prose — "body opposite the wings," "outers opposite the
inners." v1.2 replaces them with the **exact signed patterns**, long form and short form, for every
row. *(Coach, 2026-09-11: "Butterflies have a specific pattern, both long/short or +1/−2/+1 and
−1/+2/−1 respectively. Any different, and if it doesn't match a supported pattern then it is a CUSTOM
spread.")*

A prose predicate is something an implementer interprets; an enumerated pattern is something they
match. The rule is unchanged — an all-long 1-2-1 classified as CUSTOM under v1.1 and still does —
but there is no longer a sentence to read two ways.

Also stated explicitly in v1.2: the pattern is read **in strike order on the normalized ratio**, so a
3-lot `+3/−6/+3` normalizes to `+1/−2/+1`; and **BWB shares the butterfly's signed pattern**,
separated from it by unequal wings alone.

### What v1.1 added

Coach specified the position card against a ThinkorSwim reference on 2026-09-11. Section structure
and numbering are unchanged; every addition is new law or a new acceptance criterion.

| Area | Change |
|---|---|
| **Card columns** | Exactly ten: `SPREAD · SIDE · QTY · SYMBOL · EXP · STRIKE · TYPE · PRICE · VOL · DELTA`. No Yield, no Vol Adj, no BP Effect (PC-VOCAB-7) |
| **Package DELTA** | On row 1 only — the one Greek on the card. Per-leg Greeks stay out of scope |
| **No per-leg price on the card** | Package price on row 1; DEBIT / CREDIT label on row 2. Per-leg marks live in the dialog (PC-VOCAB-6) |
| **Seven editable card fields** | Spread · Side · QTY · Expiration · Strike · Type · Price, each conditional on strategy. The dialog's only remaining exclusive is add / remove leg (PC-VOCAB-8) |
| **Spread editable on the card** | PC-STRAT-8 now governs both surfaces (PC-VOCAB-9) |
| **Per-leg editing is load-bearing** | Calendar, Diagonal and CUSTOM must be editable per leg on the card (PC-VOCAB-10) |
| **Lock affordance** | Padlock pair in the ToS form; the shackle carries the state, not the colour (PC-HIG-5/6) |
| **Steppers replace chevrons** | Stacked +/− buttons that **grow on hover past the row bounds** — this is now the stamped mechanism satisfying the hit-target floor (PC-HIG-7/8) |
| **QTY quick-pick** | 1 · 2 · 5 · 10 · 20, set through the POS gesture so ratio and lock survive (PC-HIG-9) |
| **Density conflict** | Resolved, not delegated. Echo's remaining scope is dimensions and transition (§5.2) |
| **BP Effect** | Deferred with a named home — the simulated-broker release (§10) |
| **Acceptance** | AT-PC-61 … AT-PC-70 added. Seventy criteria |

---

**Every product decision in this document is stamped. No law resolves by silence and no engineering
default is permitted.** One item is deliberately delegated rather than decided here, and it names its
owner: the **tick band table** (PC-CHAIN-7 — written at build time from published contract
specifications, never invented).

Where a law changes existing ratified law, §7 names it.

**MACHINE — all work against this Spec runs on COACH'S MACBOOK (dev).** No staging, no production.
Promotion targets are named by Coach after he has seen it run.

**No implementation before Coach's GO.**

---

## 1. Mission

Give the member **absolute control over a position** — build it, shape it, price it, and know at all
times that what three surfaces show is one truth.

Three tests. Every law below serves one of them; any change that breaks one is a blocking defect.

**Litmus 1 — pricing is correct everywhere.**
> When looking at a position in the builder or the position card, if it is unlocked, the correct
> pricing is being displayed and the rendered position in the viewport is correct.

**Litmus 2 — nothing moves on its own.**
> Nothing about a position changes except because the member changed it. Opening a panel, landing a
> quote, switching a symbol, and re-rendering a control are all read-only acts.

**Litmus 3 — the member owns the shape.**
> The position is whatever the member has shaped. The name describes it; the name never governs it.

---

## 2. The model

```text
ONE AnalyzerPosition per id  =  the only mutable record
        │                        its structure IS its legs
        │
        ├── Position card    — the workspace. Multi-symbol, organised, editable
        ├── Position dialog  — the editor. Same vocabulary, full control set
        └── Canvas           — the view. Single symbol, read-only
```

| Role | Object | Rule |
|---|---|---|
| Record | `AnalyzerPosition` | The only mutable thing. Surfaces are views |
| Structure of record | **The legs** | Parametric controls are chrome over legs (PC-STRAT-9) |
| Workspace | Card list | Multi-symbol, grouped, ordered, collapsible |
| Editor | Dialog | Full control set; the card carries a subset |
| View | Canvas | Single symbol. Never a writer of structure |
| Market truth | OPF-held chain | DL-309. No invented strike or expiration |
| Record of trades | **Trade Log** | Fills; state derived by FIFO. Reached only by explicit promotion |

**Naming.** The Trade Log **is** the Registry — one object, one destination, not two stores. The
surface says **Log** on the button and **Trade Log** in copy. "Registry" is Coach's term of art and
does not ship: `RegistryEntry` in `strategy-lab-proto/msc-risk-graph-ui/` already means a registry of
positions in MSC-transplant lineage, which the standalone-repo invariant exists to quarantine.

---

## 3. Scope

**In.** Position card · position dialog · their shared control vocabulary · price and lock law ·
chain binding of every control · expiration window and defaults · strategy-conditional chrome ·
structure classification and CUSTOM · quantity and POS semantics · ToS script output · symbol
organisation · autofit triggering · missing-contract recovery · the Trade Log promotion boundary ·
Time Machine exclusion · reversibility · session persistence.

**Out.** Broker OMS and order objects · historic-chain replay of closed trades · Surface 3D ·
multi-card aggregate curves · per-leg Greeks · MSC anything.

---

## 4. Laws

### 4.1 One record, three views — `PC-REC`

| ID | Law |
|----|-----|
| **PC-REC-1** | One `AnalyzerPosition` per id is the only mutable record. Card, dialog and canvas render views of it. |
| **PC-REC-2** | **Edit** binds the live record. It does not check out a copy. Edits are live as made. |
| **PC-REC-3** | No surface rebuilds a record from a definition. Editing patches in place. `visible`, `rehearsal`, clocks, Trade Log linkage, bind and marks survive every edit. |
| **PC-REC-4** | A landing quote writes **marks only**, merged onto the current row, and is dropped if the structure moved while it was in flight. A quote merge never writes basis, lock, structure or name — including when the lock flipped mid-flight. |
| **PC-REC-5** | The canvas never writes structure. Drag produces a preview overlay; only commit writes. |
| **PC-REC-6** | One signal announces "a position's structure changed." Every observer — quotes, autofit, canvas, dialog — subscribes to it. No observer keeps its own list of event names. |
| **PC-REC-7** | **Create** binds an off-book **draft**. Submit inserts the record; Cancel destroys the draft. No record, no structure signal and no quote interest exist until Submit. |
| **PC-REC-8** | Create and Edit are **one panel in two bind modes**. Chrome, vocabulary and row grammar are shared; title, primary verb and exit semantics differ. |
| **PC-REC-9** | **Verbs by mode.** Create: **Cancel** (destroys the draft) · **Submit** (inserts the record). Edit: **Close** and Esc, nothing else. **Edit has no Submit** — nothing is pending, so a commit verb would be a lie. |

**Signal contents (normative).**

- **In:** symbol · per-leg expiry · strike · right · **normalized ratio**
- **Out:** raw contract counts · POS · marks · IV · basis · lock state · `visible` · clocks · list order · group collapse · focus
- **Shape:** `{ id, structureKey, reason: "structure" | "repair" }`

Raw counts are excluded because scaling 3/6/3 → 4/8/4 changes every count while changing nothing
about the instruments or the shape, and PC-LOCK-8 requires that scale to preserve the lock.

### 4.2 Reversibility — `PC-UNDO`

| ID | Law |
|----|-----|
| **PC-UNDO-1** | Every book write is reversible. The host keeps a bounded history of book states, default 50. |
| **PC-UNDO-2** | The member's verbs are **Undo** and **Cancel/Close**. There is no Save and no Discard — on a live-bound surface nothing is pending. |
| **PC-UNDO-3** | **Undo** reverts the last member action. **Cancel** (Create) destroys the draft; **Close** (Edit) dismisses and reverts nothing. Undo is the sole reverser. |
| **PC-UNDO-4** | **On the stack:** card writes · dialog patches · overlay commit · lock and unlock · Keep and Unlock on CHECK PRICE · POS scale · delete · accepted repair · strategy rebuild. |
| **PC-UNDO-5** | **Not on the stack:** quote merges · overlay preview · hydrate · name re-derivation · POS re-derivation · **promotion to the Trade Log**. |
| **PC-UNDO-6** | **Log is a one-way door.** The Trade Log is a separate durable store whose positions derive from fills by FIFO. An Analyzer-session undo may not void a Trade Log row. Reversal there is a Trade Log act. |
| **PC-UNDO-7** | Undo of a delete restores the row. Undo across a Create-Submit removes the record and **reopens Create bound to that draft**. History is session-only, never persisted. |

### 4.3 Shared vocabulary — `PC-VOCAB`

| ID | Law |
|----|-----|
| **PC-VOCAB-1** | Card and dialog share one control vocabulary and one leg-row grammar, from one component. |
| **PC-VOCAB-2** | The subset rule is **per category**, not global. Structure: card ⊂ dialog. Lifecycle (Show, Delete, Edit, Log): card only. |
| **PC-VOCAB-8** | **Seven fields are editable on the card**, each conditional on the strategy per §4.4: **Spread · Side · QTY · Expiration · Strike · Type · Price.** *(Coach, 2026-09-11.)* The dialog's only remaining exclusive is **add and remove leg** — the structure subset in PC-VOCAB-2 narrows to that one capability. |
| **PC-VOCAB-9** | **Spread is editable on the card**, so PC-STRAT-8 governs both surfaces: changing it on either one rebuilds the legs from that structure's seed and moves the basis to CHECK PRICE. It is never a label swap on either surface. |
| **PC-VOCAB-10** | **Per-leg editing is load-bearing, not decorative.** Calendar, Diagonal and CUSTOM carry legs that genuinely differ — in expiration, in strike, or in both — and their leg rows must be individually editable on the card. *(Coach, 2026-09-11.)* A card design that only edits row 1 cannot express those structures. |
| **PC-VOCAB-3** | The card is a **writer**. |
| **PC-VOCAB-4** | No control exists in two implementations. A capability on both surfaces is one function called from two places. |
| **PC-VOCAB-5** | **Package fields and leg fields never share a column.** Row 1 carries **BASIS**, the lock, and package **DELTA**. Leg rows carry **VOL**. Row 2's price cell carries the **DEBIT / CREDIT label**, not a number. |
| **PC-VOCAB-6** | **The card shows no per-leg price.** *(Coach, 2026-09-11, against the ToS reference card.)* The package price on row 1 is the only price on the card. The **dialog** shows per-leg marks while the member is shaping the position. PC-LEG-1's rule is unchanged and still governs: any per-leg value that *is* displayed is live. |
| **PC-VOCAB-7** | **Card columns are exactly:** `SPREAD · SIDE · QTY · SYMBOL · EXP · STRIKE · TYPE · PRICE · VOL · DELTA`. **Yield, Vol Adj and BP Effect are not shown** — Coach excluded the first two, and BP Effect is deferred to the simulated-broker release (§10). |

**Card row grammar** (ToS reference, 2026-09-11):

```
SPREAD     SIDE  QTY  SYMBOL  EXP         STRIKE  TYPE   PRICE    VOL      DELTA
Butterfly  BUY    +3   XSP    11 SEP 26    763    CALL   0.67 🔒  25.08%   3.6215
           SELL   −6   XSP    11 SEP 26    767    CALL   DEBIT    22.25%      —
           BUY    +3   XSP    11 SEP 26    771    CALL            20.39%      —
```

**DELTA is package-level, on row 1 only.** Leg rows render "—" in that column. This is the one Greek
on the card; per-leg Greeks remain out of scope (§10).

### 4.4 Structure is legs — `PC-STRAT`

| ID | Law |
|----|-----|
| **PC-STRAT-9** | **The legs are the record.** Strike, contract quantity, expiration and right are per-leg values, directly editable on the card. Parametric controls (center, wing width, inner gap) are **chrome over the legs** and must round-trip: legs → chrome → legs yields identical legs. |
| **PC-STRAT-1** | The strategy determines **which convenience controls appear** for the sitting (§4.4 catalogue). It does not determine whether the underlying legs may be touched. |
| **PC-STRAT-2** | Within the controls that exist, **every edit is legal and the name re-derives**. |
| **PC-STRAT-3** | Re-derivation is **quiet, not hidden**. No prompt, no confirmation, no interruption — and the displayed name updates on the same tick. Pull one wing of a butterfly and it reads **BWB** immediately. |
| **PC-STRAT-4** | **CUSTOM** is the terminal case: a shape matching no catalogued pattern. It is **arrived at, never selected**. |
| **PC-STRAT-5** | Reaching CUSTOM **unlocks the inert convenience cells**. It does not rebuild the panel's control set mid-gesture. |
| **PC-STRAT-6** | Re-derivation is **symmetric**. Edit a CUSTOM back into 1-2-1 on equal wings and it is a Butterfly again. |
| **PC-STRAT-7** | The name is **computed from the legs, never stored**. It cannot drift out of sync with the position. |
| **PC-STRAT-8** | Choosing a strategy from the picker **rebuilds the legs** from that structure's seed and moves the basis to CHECK PRICE. It is not a label swap. |
| **PC-STRAT-13** | **Create opens on Butterfly** — the house atom. Seeded per PC-EXP-6 and the listed grid, unlocked, with no seeded basis. |
| **PC-STRAT-10** | **Control-set stability.** The control set is fixed for the sitting by the picker selection, or on Edit by the classified name at open. A name that re-derives mid-gesture never rebuilds chrome under the member's cursor. |
| **PC-STRAT-11** | **`+ Add Leg`** is present on every strategy. Adding a leg is a legal structural edit; the name re-derives, usually to CUSTOM. This is a documented path *to* CUSTOM, which is why CUSTOM needs no picker entry. |
| **PC-STRAT-12** | **Perception.** The STRATEGY cell is exempt from the non-bold density rule to the extent needed for the name change to be noticed. Quiet is not invisible. |

**Catalogue — which convenience controls appear.** Per-leg strike, quantity, date and right are
editable throughout (PC-STRAT-9); this table governs the *extra* controls only.

| Strategy | Convenience controls | Dates | Call / Put chrome | Ratio at seed |
|---|---|---|---|---|
| Single | strike | one | member's choice | 1 |
| Vertical | center + width | one | one right, both legs | 1-1 |
| Butterfly | center + wing width | one | one right | 1-2-1 |
| BWB | center + each wing | one | one right | 1-2-1 |
| Condor | center + inner gap + wing width | one | one right | 1-1-1-1 |
| Straddle | strike | one | both rights, fixed | 1-1 |
| Strangle | center + width | one | both rights, fixed | 1-1 |
| Iron Fly | center + wing width | one | both rights, fixed | 1-1-1-1 |
| Iron Condor | center + inner gap + wing width | one | both rights, fixed | 1-1-1-1 |
| Calendar | strike | **two** | one right | 1-1 |
| Diagonal | two strikes | **two** | one right | 1-1 |
| **CUSTOM** | none — legs only | per leg | per leg | any |

**Classifier.** Inputs: leg count · distinct expirations · rights · normalized ratio · **side pattern** ·
wing equality · shared strikes. Output is one catalogue token. **No aliases, no thirteenth name.**

**The signed pattern is the test.** Each row lists the exact signed quantities that qualify, long
form and short form. A structure matches a row only if its signed pattern is **one of the two listed
for that row**, in strike order. Anything else is **CUSTOM**. *(Coach, 2026-09-11: "Butterflies have
a specific pattern, both long/short or +1/−2/+1 and −1/+2/−1 respectively. Any different, and if it
doesn't match a supported pattern then it is a CUSTOM spread.")*

| Legs | Dates | Rights | Signed pattern (long form · short form) | Additional | → |
|---|---|---|---|---|---|
| 1 | 1 | one | `+1` · `−1` | — | **Single** |
| 2 | 1 | one | `+1/−1` · `−1/+1` | different strikes | **Vertical** |
| 2 | 1 | both | `+1/+1` · `−1/−1` | same strike | **Straddle** |
| 2 | 1 | both | `+1/+1` · `−1/−1` | different strikes | **Strangle** |
| 2 | 2 | one | `+1/−1` · `−1/+1` | same strike | **Calendar** |
| 2 | 2 | one | `+1/−1` · `−1/+1` | different strikes | **Diagonal** |
| 3 | 1 | one | `+1/−2/+1` · `−1/+2/−1` | wings equal | **Butterfly** |
| 3 | 1 | one | `+1/−2/+1` · `−1/+2/−1` | wings unequal | **BWB** |
| 4 | 1 | one | `+1/−1/−1/+1` · `−1/+1/+1/−1` | — | **Condor** |
| 4 | 1 | both | `+1/−1/−1/+1` · `−1/+1/+1/−1` | body strikes shared | **Iron Fly** |
| 4 | 1 | both | `+1/−1/−1/+1` · `−1/+1/+1/−1` | body strikes separated | **Iron Condor** |
| *anything else* | | | | | **CUSTOM** |

**Read the pattern in strike order, on the normalized ratio.** Signs are per leg; magnitudes are the
normalized ratio (PC-QTY-2), so a 3-lot butterfly reading `+3/−6/+3` normalizes to `+1/−2/+1` and
classifies as a Butterfly. A structure whose legs are reordered in the record but identical in strike
order is the same structure.

**Enumerating both forms is what makes the test unambiguous.** `+1/+2/+1` — all three legs long — is
not a butterfly in either form, so it is CUSTOM. `+1/−1/+1/−1` on four legs matches no row, so it is
CUSTOM. Naming either of them for the shape they resemble would break Litmus 3 by describing the
position wrongly.

**BWB shares the butterfly's signed pattern** and is separated from it by strike geometry alone —
unequal wings. That is the only axis on which those two rows differ.

**Wing equality** is measured as **strike distance in points** — equivalently, in listed-grid steps.
Not percent, and not premium.

*This table is trading taxonomy. Hotel confirms it before build.*

### 4.5 Quantity and POS — `PC-QTY`

| ID | Law |
|----|-----|
| **PC-QTY-1** | Leg rows display **actual contracts held**, not the ratio. A 3-lot butterfly reads `+3 / −6 / +3`. |
| **PC-QTY-2** | **POS is derived**, not stored: the greatest common divisor of the leg contract counts. The normalized ratio is what remains. |
| **PC-QTY-3** | Leg contract counts are the truth. POS and the structure name are both computed from them and cannot drift out of sync. |
| **PC-QTY-4** | An edit that does not divide evenly is legal. POS collapses to its true GCD; nothing becomes fractional and nothing is refused. |
| **PC-QTY-5** | Per-leg contract quantity is editable on **both** surfaces. |
| **PC-QTY-6** | **POS is a control, not only a readout.** The POS stepper writes `ratio × POS` across **every** leg in one action. The lock stands, the ratio is unchanged, the name is unchanged. |

| Legs | POS (GCD) | Ratio | Name | Lock |
|---|---|---|---|---|
| 3 / 6 / 3 | 3 | 1-2-1 | Butterfly | stands |
| 4 / 8 / 4 | 4 | 1-2-1 | Butterfly | **stands** |
| 2 / 4 / 4 | 2 | 1-2-2 | CUSTOM | CHECK PRICE |
| 3 / 7 / 3 | 1 | 3-7-3 | CUSTOM | CHECK PRICE |

PC-QTY-6 is mandatory, not convenient: with no stored POS to increment, the only route from a 3-lot
to a 4-lot fly would be three coordinated per-leg edits, and one mistyped digit would silently
rename the position CUSTOM.

### 4.6 Price and lock — `PC-LOCK`

| ID | Law |
|----|-----|
| **PC-LOCK-1** | The package price is **live unless locked**. |
| **PC-LOCK-2** | Locking is a deliberate gesture on **BASIS**. **Structure controls never lock** — not a strike stepper, not a POS stepper, not a date picker. |
| **PC-LOCK-3** | The member may **inspect the live price without locking it**. Blur with no value change and no lock gesture writes nothing. |
| **PC-LOCK-4** | Unlock returns to live **immediately**, repriced from current chain data. |
| **PC-LOCK-5** | `CardLockState` is the only lock model. `net_debit_override` is a **derived** ToS serialisation, never an independent source. |
| **PC-LOCK-6** | `lock.mode === "locked"` on arrival from Create **⟺** the member performed the lock gesture. Nothing implicit locks. |
| **PC-LOCK-7** | **The ToS script mirrors BASIS, always.** `@LMT <price>` in every case — never absent. See §4.7. |
| **PC-LOCK-8** | **A locked basis survives if and only if the normalized ratio and every instrument are unchanged.** A POS scale preserves it. Any change to a strike, expiration, right, side or the ratio moves it to **CHECK PRICE**. |
| **PC-LOCK-9** | PC-LOCK-6 governs **Create only**. Under PC-REC-2 there is no arrival moment on Edit. |
| **PC-LOCK-10** | The package basis is the member's and is lockable. **Per-leg values are the market's and are never lockable.** There are no per-leg locks. |
| **PC-LOCK-11** | Every Analyzer write forces OPF `freeze_iv = false` and `freeze_marks = false`. `leg_iv_snapshot` / `leg_mark_snapshot` may exist for audit; they are **never** the display source. |
| **PC-LOCK-12** | One sign convention, one formatter, both surfaces. **DEBIT** when `D > 0`, **CREDIT** when `D < 0`. A signed value never renders under a DEBIT label. |
| **PC-LOCK-13** | **Units.** BASIS, `D*` and `D_nat` are always the **one-package** number, computed over the **normalized ratio**, never over raw contract counts. Displayed leg QTY is `ratio × POS`. Curve dollars are `D × 100 × POS`. The BASIS cell is labelled per package and **the formatter never multiplies D by POS inside it**. A position total may render **display-only**; it is not a second lockable number. |
| **PC-LOCK-14** | **Package Buy/Sell rewrites every leg's side** and is the only package-level side control. It is a structural change: it moves the basis to CHECK PRICE. Per-leg side remains individually editable (PC-STRAT-9); editing one leg's side re-derives the name like any other structural edit. |

### 4.7 The ToS script — `PC-TOS`

| ID | Law |
|----|-----|
| **PC-TOS-1** | The script carries `@LMT <price>` in **every** case. It is never emitted without a limit. |
| **PC-TOS-2** | The price is the position's **current price** — the live natural mid when unlocked or while CHECK PRICE is pending, the member's number when locked or after Keep. One current price, one script price. |
| **PC-TOS-3** | `lock.lockSource` (`natural_mid` \| `user_limit` \| `tos_limit`) is retained and survives promotion. It records whether the number is **pinned** or **tracking**. |
| **PC-TOS-4** | The hand-off is total. Once the script leaves FatTail it is the member's — the tool does not guard the order, reason about what the broker will do with it, or shape the script around what the member might do next. |
| **PC-TOS-5** | **The script and the Trade Log row are two serialisations of one number, not the same artifact.** The script always carries `@LMT` because it is what leaves the building. The Trade Log's `order_type` derives from `lockSource`: a member limit records a limit; a natural mid records that no limit was set. The Trade Log is the record of what actually happened and does not assert an intent the member did not have. |

| BASIS state | What BASIS displays | Script price |
|---|---|---|
| Unlocked (live) | the live natural mid | the live natural mid |
| Locked by the member | the member's number | the member's number |
| CHECK PRICE, after **Keep** | the kept number | the kept number |
| CHECK PRICE, **before Keep** | the kept number, **marked** | **the live natural mid** |

**The one row where the script and the cell differ is the pending CHECK PRICE row, and that is
deliberate.** While the chip is up, the marked numeral is explicitly *not* this structure's price
(PC-STALE-1) and the canvas is already drawing the live mid (PC-STALE-6); a script copied from that
state must carry the price the position actually has. **CHECK PRICE chrome must therefore make the
numeral visibly not-current** — marked, never styled as a live BASIS — or a member will copy the
script believing it carries the kept number. Keep resolves the divergence in one gesture.

Otherwise the script is a faithful picture of the position on screen: while BASIS is live the
script's number tracks the mid, and the number that leaves FatTail is the one displayed at the moment
it is copied.

### 4.8 CHECK PRICE — `PC-STALE`

| ID | Law |
|----|-----|
| **PC-STALE-1** | When a locked basis no longer describes the position (PC-LOCK-8), the number is **kept and marked** — never evaporated, never presented as the current price. |
| **PC-STALE-2** | The named state is **CHECK PRICE**, parallel to **CHECK LEGS**: *the structure needs your attention* / *the basis needs your attention*. |
| **PC-STALE-3** | Two exits: **Keep** (hold it as the working limit for the new structure) or **Unlock** (return to live). Neither happens without the member's action. |
| **PC-STALE-4** | CHECK PRICE is **not** EXPIRED and is never ghosted. Expiry is a fact about time with its own state and residual treatment; CHECK PRICE is a fact about structure. |
| **PC-STALE-5** | It is a property of the lock, not a card display state: `CardLockState` carries it alongside `locked`. The chip and both exits render **on the BASIS cell**, card and dialog. The number stays visible. |
| **PC-STALE-6** | **The canvas draws the live mid until Keep.** `withCardDebit` must not draw the kept number as this structure's price while CHECK PRICE is up. |
| **PC-STALE-7** | Further structural edits remain legal while the chip is up. No modal, no forced resolution. |
| **PC-STALE-8** | Placement is distinct from CHECK LEGS: **CHECK LEGS on the leg row, CHECK PRICE on BASIS.** |
| **PC-STALE-9** | CHECK PRICE does **not** block Log. The promotion snapshot records the basis and its CHECK PRICE state. |

### 4.9 Per-leg values are always live — `PC-LEG`

| ID | Law |
|----|-----|
| **PC-LEG-1** | Per-leg **MARK and IV** are read live from the chain wherever displayed, on either surface. The package lock never freezes them. |
| **PC-LEG-2** | A per-leg value is never rendered from a stored field as though it were live. |
| **PC-LEG-3** | Legs within one position are never mixed live and frozen. |

### 4.10 Every control is bound to the chain — `PC-CHAIN`

| ID | Law |
|----|-----|
| **PC-CHAIN-1** | Steppers and pick lists offer **only what the chain holds**. DL-309. |
| **PC-CHAIN-2** | The constraint lives at the **control**, not at the write. A control that accepts an invalid value and silently corrects it is a violation, not a mitigation. |
| **PC-CHAIN-3** | A strike stepper steps **that right's ladder**. Call and put ladders differ; the edge is a no-op on the ladder in play, never a clamp to an invented value. |
| **PC-CHAIN-4** | **Absence is expressed by absence.** What the chain cannot supply is not offered. |
| **PC-CHAIN-5** | The constraint propagates upward: with one listed expiration, multi-date **strategies** are not offered either. |
| **PC-CHAIN-6** | Empty ladder and single-entry ladder are **different truths**. Empty = not loaded, transient, "loading." One entry = loaded and genuinely singular, never "wait." |
| **PC-CHAIN-7** | The BASIS control is bound by **tick size**, served from one source, per product and premium band. **No tick source exists today.** The band table is authored at build time from the product's published contract specifications, is config-driven, and **fails loud on an unknown product** — it never falls back to a default. An invented constant (`0.05` or any other) is a violation, not a placeholder. |
| **PC-CHAIN-8** | The **stepper is the primary gesture**. The pick list is type-to-filter with ATM and wing landmarks. A full ladder rendered as a raw list is correct and unusable. |

### 4.11 Expirations — `PC-EXP`

| ID | Law |
|----|-----|
| **PC-EXP-1** | Expirations are **editable per leg on both surfaces**. |
| **PC-EXP-2** | Listed expirations only. No free date input. |
| **PC-EXP-3** | The window is **`OPF_ACTIVE_DTE_HORIZON`, currently 10** — **curriculum-sized, not a technical limit**. Its owner is the course catalogue and it moves when a course teaches a longer-dated structure. |
| **PC-EXP-4** | The horizon is served from **one place**, one importer, one catalogue key. |
| **PC-EXP-5** | DTE is computed from the **Time Machine clock when active**, never `Date.now()`. |
| **PC-EXP-6** | Defaults are two indices into one filtered list, no expiry conditional: <br>`listed = chain expirations, DTE 0–HORIZON, not expired, ascending` <br>`front = listed[0]` · `back = listed[1]` (multi-date only) |
| **PC-EXP-7** | Defaults are **seed-time only** and never re-fire. A dialog open at 4:14 does not jump at 4:15 because the window slid. |
| **PC-EXP-8** | A **residual** contract — past its session, before the midnight-ET expiry boundary — remains editable and remains a legal member of a structure. It is not EXPIRED and is not missing. |

### 4.12 Lifecycle — `PC-LIFE`

| ID | Law |
|----|-----|
| **PC-LIFE-1** | An Analyzer position is **pre-lifecycle**. It has no status. It enters the Trade Log's state cycle only by explicit promotion as an open position. |
| **PC-LIFE-2** | The Trade Log derives Open / Complete from **fills by FIFO**. It stores no position state, and neither does the Analyzer. |
| **PC-LIFE-3** | `closedAt` / `closedPnl` are a **cache** of Trade Log state, never authoritative. They render only while `tradeLogTradeId` is set and the cache is fresh; otherwise "—". The Analyzer never computes PnL for a promoted position. |
| **PC-LIFE-4** | Order states (`PENDING`, `WORKING`, `REJECTED`, `CANCELLED`) belong to a future **Order** object. Position states (`OPEN`, `CLOSED`) belong to the Trade Log. The current `ReservedOmsStatus` union conflates all three. **This Spec does not split the type** — it forbids the writes: no order state is ever written onto an `AnalyzerPosition`. |
| **PC-LIFE-5** | **Submit** commits into the Analyzer. **Log** promotes to the Trade Log. Two acts, two controls. |
| **PC-LIFE-6** | The position is the **Hypothesis** object of the Practice protocol. Because the Trade Log stores fills and derives positions by instrument key — and a butterfly is not a native Trade Log object — structural fidelity across promotion is carried by the snapshot in PC-LIFE-7, not by the fill rows. |
| **PC-LIFE-7** | **Promotion writes a structure snapshot**: catalogue name · normalized ratio · POS · `lockSource` · basis at promotion and its CHECK PRICE state · residual-leg state · the `AnalyzerPosition` id. The returned `trade_id` is written back to the record. Both directions, same moment. **The basis captured is the position's current price at the instant of the Log gesture** — the same number a script copy would have carried at that instant (PC-TOS-2), so promotion and copy never diverge by a tick. |
| **PC-LIFE-8** | **Entry time is captured at Log**, under the PC-EXP-5 clock rule. It is not an editable field on the card. |
| **PC-LIFE-9** | **Residual legs do not block Log.** A structure with a leg past its session but before midnight ET promotes normally, and the snapshot records that the leg was residual. |
| **PC-LIFE-10** | The promotion mapper is **rewritten, not extended**: it must stop treating stored `contracts` as a multiplier over ratio quantities, stop emitting stored `entry_price` as a live fill, and stop hardcoding `order_type: "LMT"`. `order_type` derives from `lockSource` per PC-TOS-5 — a member limit records a limit; a natural mid records that no limit was set. |

### 4.13 Time Machine — `PC-TM`

| ID | Law |
|----|-----|
| **PC-TM-1** | **Nothing may be promoted to the Trade Log while Time Machine is active**, regardless of the position. Gate on `tmActive`. |
| **PC-TM-2** | A rehearsal-born position never promotes, even after exiting. Gate on `!pos.rehearsal`. Both gates, AND-ed. |
| **PC-TM-3** | Time Machine recreates **conditions**. Positions built there are not trades — not real, not simulated. A `venue: sim` account is not their home. |

### 4.14 Persistence — `PC-PERSIST`

| ID | Law |
|----|-----|
| **PC-PERSIST-1** | The un-logged book **survives a browser restart** on the device that holds it. It is local-durable, single device, single browser — not session-only. *(Corrected 2026-09-11: the as-built already dual-writes `sessionStorage` and `localStorage` and reads `localStorage` first. An earlier draft of this law said session-scoped; implementing that would have silently destroyed positions the member was holding.)* |
| **PC-PERSIST-2** | It is **not** a system of record — the Trade Log is. Local-durable means it survives a restart on one machine; it does not survive a cleared browser, a different browser, or another device, and no surface may imply that it does. |
| **PC-PERSIST-3** | Undo history is session-only and never persisted. |
| **PC-PERSIST-4** | `rehearsal` and `visible` survive persistence, as they survive every write. |
| **PC-PERSIST-5** | A server-side multi-device book is out of scope. |

### 4.15 Symbol organisation — `PC-SYM`

| ID | Law |
|----|-----|
| **PC-SYM-1** | The **list is multi-symbol**; the **canvas is single-symbol**. |
| **PC-SYM-2** | Positions are grouped under collapsible symbol headers, reorderable by the member. |
| **PC-SYM-3** | **Selecting a symbol group header sets the suite symbol** — driving the canvas, chain hydration, and the attached Volume Profile / GEX / Probability viewports. |
| **PC-SYM-4** | **Expanding ≠ selecting.** Collapsing does not deselect; expanding does not switch the canvas. The chevron expands and collapses only. |
| **PC-SYM-5** | The selected group is shown by **selection highlight**, not a checkbox — selection is exclusive and a checkbox would misrepresent it beside the per-position Show checkboxes. |
| **PC-SYM-6** | Symbol group order is **list chrome**, not book state. It does not live on `AnalyzerPosition`. |
| **PC-SYM-7** | Show state per position survives symbol switching. `visible` plus the active symbol is sufficient. |
| **PC-SYM-10** | Selecting a symbol header **clears focus** if the focused card belongs to another group. Focus never points into a group the canvas is not showing. |
| **PC-SYM-8** | **Every shown position is quoted**, on-symbol or off, so switching symbols is instant. Hidden positions register no interest. A shown position that is not quoted renders last-value with an explicit not-live marker. |
| **PC-SYM-9** | **Overflow is named, never silent.** When the shown count exceeds the OPF interest cap, refused positions render **BUDGET LIMIT** with their definition intact — never a dropped quote with no explanation, and never a stale mid styled as live. Priority is the selected symbol first, then by recency. |

### 4.16 Autofit — `PC-FIT`

| ID | Law |
|----|-----|
| **PC-FIT-1** | Autofit is driven by the **structure-changed signal** (PC-REC-6), not by an enumerated list of event names. |
| **PC-FIT-2** | Autofit follows the **committed book**, never the drag overlay. |
| **PC-FIT-3** | **Fit only when the position no longer fits the window.** A deliberate zoom survives an edit. Fit on Create-Submit and on first show; afterwards only when geometry escapes the viewport. An explicit Fit control remains. |

### 4.17 Missing contracts — `PC-FOUND`

| ID | Law |
|----|-----|
| **PC-FOUND-1** | Creating never offers what the chain lacks. **Displaying an existing position whose contract is gone shows it, named** — never hidden, never silently snapped, never substituted. |
| **PC-FOUND-2** | Loaded-but-absent renders as **NOT TRADED**. No new doctrine token is minted. The recovery affordance, not the label, carries the difference. |
| **PC-FOUND-3** | The state is **per leg**. Healthy legs render normally beside it. |
| **PC-FOUND-4** | Recovery is **propose, never apply**. The repair is shown; one action accepts it; nothing happens without that action. |
| **PC-FOUND-5** | A control rendering a value absent from its own options must render an **explicit invalid state**, never a bound value. (A `<select>` whose value is not among its options silently selects the first — mutating the position on render.) |
| **PC-FOUND-6** | The common case is the whole expiration rolling off, not one dead leg. A **structure-level roll** is the prominent affordance; per-leg repair sits underneath. |
| **PC-FOUND-7** | A repair is an ordinary structural change: it moves the basis to CHECK PRICE, re-quotes, and lands on the undo stack. No parallel healing path. |

### 4.18 Interaction floor — `PC-HIG`

| ID | Law |
|----|-----|
| **PC-HIG-1** | **Interactive hit rectangles never overlap.** A compact visual row uses a focus-revealed control overlay, not invisible padding colliding with the neighbouring cell. |
| **PC-HIG-2** | **Inert cells look inert.** A convenience cell the strategy does not expose has no hover chrome and is not a tab stop. |
| **PC-HIG-3** | **Delete is a confirmed destructive action** per the HIS pattern: name the position, name the consequence, Cancel available. Delete acts on **one position**. Nothing wipes a symbol group. |
| **PC-HIG-4** | Keyboard reaches every control the mouse reaches. |
| **PC-HIG-5** | **The lock affordance is a padlock pair in the ToS form.** *(Coach, 2026-09-11, against the ToS reference.)* **Unlocked:** open padlock — outlined, thin stroke, shackle raised and rotated clear of the body, tinted to the row. **Locked:** closed padlock — solid fill, neutral light tone, shackle closed onto the body. It sits immediately right of the price cell on row 1. |
| **PC-HIG-6** | **The shackle carries the state, not the colour.** Open-versus-closed must be readable with colour discarded. A pair that differs only by tint fails this law. |
| **PC-HIG-7** | **Steppers are a stacked pair of buttons**, not a spinner or a chevron: increment above, decrement below, rounded, tight to the right edge of their cell, low contrast until hover or focus. *(Coach, 2026-09-11, against the ToS reference: "these are superior to the chevron.")* This pattern replaces every chevron-style nudge on the card. |
| **PC-HIG-8** | **The stepper grows on hover and focus, overlapping the row's visual bounds.** *(Coach, 2026-09-11.)* **This is the mechanism by which PC-HIG-1 is satisfied** — the row stays at ToS density while the reach target expands only under the cursor. The grown state meets the active `--hit-min`; the resting state does not need to. |
| **PC-HIG-9** | **Quantity carries a quick-pick.** A caret beside the QTY stepper opens a short list of common lot sizes — **1 · 2 · 5 · 10 · 20** unless Coach sets otherwise — so a member reaches a size in one gesture instead of twenty. Typing and stepping remain available; the quick-pick is a third path, never the only one. |
| **PC-HIG-10** | **Every editable cell offers a jump, and the jump suits the field.** QTY jumps by quick-pick (PC-HIG-9). Strike jumps by the type-to-filter picker with ATM and wing landmarks (PC-CHAIN-8). Price steps by tick and has no quick-pick — there is no such thing as a common price. |

---

## 5. Layout

### 5.1 Dialog

| Region | Contents |
|---|---|
| Row 1 | SYMBOL · STRATEGY *(derived name)* |
| Row 2 | payoff glyph · Buy / Sell · **BASIS** *(per package)* · **POS** *(stepper)* · lock |
| LEGS | `QTY · STRIKE · TYPE · EXPIRATION · MARK`, one row per leg, `+ Add Leg` |
| TOS SCRIPT | script line · click to copy |
| Buttons | Create: **Cancel · Submit** — Edit: **Close** |

- **Everything visible at once, no scrolling, for the house structures.** Height is responsive to leg
  count. Row 1, Row 2 and the button row are pinned; the LEGS region may scroll beyond four legs.
- **Removed:** the `Preview:` block (it restates the ToS script in a second language) · **Analyze** ·
  the entry-time field · the presets / defaults manager (relocates to Analyzer workspace chrome) ·
  the spot override and OPF retry (relocate to recovery chrome, where the data problem appears).

### 5.2 Card

| Element | Rule |
|---|---|
| Symbol header | collapse chevron · symbol · reorder ▲▼ · selection highlight · sets the suite symbol |
| Show / Hide | checkbox, per position |
| Delete | **✕** on the position, confirmed |
| Remaining buttons | **Edit** and **Log** only, stacked under the ✕ |
| Columns | `SPREAD · SIDE · QTY · SYMBOL · EXP · STRIKE · TYPE · PRICE · VOL · DELTA` (PC-VOCAB-7) |
| Editable in place | **Spread · Side · QTY · Expiration · Strike · Type · Price**, each conditional on the strategy (PC-VOCAB-8) |
| Price cell | package price on row 1 with the stepper and the padlock; **DEBIT / CREDIT** label on row 2; no per-leg price anywhere (PC-VOCAB-6) |
| Lock | padlock pair in the ToS form — open outlined shackle when live, closed solid when locked (PC-HIG-5/6) |
| Steppers | stacked +/− buttons that **grow on hover past the row bounds**; no chevrons (PC-HIG-7/8) |
| QTY quick-pick | caret beside the stepper — 1 · 2 · 5 · 10 · 20 (PC-HIG-9) |
| Everything else | inline in cells — the strike cell *is* the picker, the qty cell *is* the stepper |

**Density.** Non-bold throughout — weight is currently the default on ~24 elements and therefore
carries no emphasis. Contrast comes from fill and muted-versus-bright text. **Fill groups, gap does
not.** Controls live inside cells, not beside them in bordered boxes. The STRATEGY cell is the one
exemption (PC-STRAT-12).

**Hit targets.** `tokens.css` declares two floors: `--hit-min: 2.75rem` (44px) and, in the compact
profile, `2.25rem` (36px). Card rows use `min-h-8` (32px) — a 4px shortfall in compact. PC-HIG-1
governs regardless of profile.

**The conflict is resolved, not delegated.** *(Coach, 2026-09-11, against the ToS reference.)* The
row keeps its compact height and the **stepper grows on hover and focus past the row's bounds**
(PC-HIG-8) to meet the floor. That is the mechanism, and it is the same one ToS uses.

Echo's remaining scope is narrower: the resting and grown dimensions, the growth transition, and
whether any *non-interactive* Analyzer chrome takes the compact profile. **PC-HIG-1 still binds** —
grown steppers on adjacent rows must not overlap each other, which constrains how far they may grow
and is the one thing this pattern can still get wrong.

---

## 6. Build-order constraints

These are dependency facts derived from the laws, not a phasing proposal. Any plan that violates one
produces a visibly broken intermediate state.

1. **Undo (§4.2) lands before the card becomes a live writer.** This Spec removes Cancel-as-revert;
   until Undo exists, every edit is one-way.
2. **One-package units (PC-LOCK-13) ship in the same packet as actual-contracts display (PC-QTY-1).**
   Ship the display first and a locked $1.20 visibly becomes $3.60 on a 3-lot.
3. **Legs-as-record (PC-STRAT-9) precedes the classifier (PC-STRAT-7).** While two writers exist there
   is no single truth to classify.
4. **The structure signal (PC-REC-6) precedes rewiring quotes and autofit.** Both subscribe to it;
   rewiring an observer to a signal that does not yet exist reproduces the two-event-list defect.

**Named build prerequisites.** Each is absent today and gates whatever consumes it: the **tick
source** (PC-CHAIN-7) · the **single-sourced DTE horizon** (PC-EXP-4) · the **classifier** (§4.4) ·
the **promotion mapper rewrite** (PC-LIFE-10).

---

## 7. What this replaces

| Superseded | Was | Now |
|---|---|---|
| **AZ-CARD-1** (Analyzer v0.2) | Card is a read-only limited view | Card is a writer with a subset of the dialog's controls |
| **AZ-BOOK-SYM-1** (Analyzer v0.2) | All symbols listed, off-symbol cards badged, focus syncs suite symbol | Collapsible symbol groups; header selection sets the suite symbol; badges retired |
| **OD-PB6** (DL-298) | ANALYSIS status only | No status on the position; Trade Log lifecycle after promotion |
| **OD-PB1 + NX4** (DL-298) | Session book, single device — as a premise about what the position *is* | The position is a Practice-family object (Hypothesis). **Storage is unchanged** — still session-scoped, single-device browser storage (§4.14). What changed is the object's role and its promotion contract, not its durability |
| **PC-LOCK-7 in v0.1** | A natural lock produces **no** `@LMT` in the ToS script; only a user limit does | The script carries `@LMT` in every case (PC-TOS-1). *Coach reversal, 2026-09-10* |
| **PB22** (PB v0.3) | No back expiration listed → fail loud, member picks manually | Not offered at all |
| **PB-VIEW-1 vs AZ-CARD-1** | Contradictory | PB-VIEW-1 stands; AZ-CARD-1 falls |

**Cross-stamps required in the same pass.** These parent specs must be amended so this one does not
expand them by silence:

| Parent | Item |
|---|---|
| Options Lab Surface Autofit Spec v0.1 | **AF-L5** trigger list — currently "book change and the Autofit button only" |
| TM One-Source Spec | DTE reads the TM clock (PC-EXP-5) |
| Position Builder Spec v0.3 | **PB17b** interest ownership gains a symbol axis (PC-SYM-8) |
| Trade Log Spec v1.1 | Structure snapshot column on the trade row (PC-LIFE-7) |

No doctrine amendment is required: loaded-but-absent stays under NOT TRADED.

---

## 8. Acceptance

| ID | Assertion | Class |
|---|---|---|
| **AT-PC-01** | Card ▲ with the dialog open → dialog legs match on the same tick | component |
| **AT-PC-02** | An Edit patch preserves `visible`, `rehearsal`, clocks, `tradeLogTradeId`, bind | unit |
| **AT-PC-03** | A quote landing after a structural change is dropped, not applied | unit |
| **AT-PC-04** | Opening Edit writes **zero** fields — no snap, no reprice, no write | component |
| **AT-PC-05** | A lock gesture on an open Edit → card lock + canvas on the same tick | component |
| **AT-PC-06** | A BASIS never touched on Create → position arrives **unlocked**, no seeded basis | unit |
| **AT-PC-07** | `lockSource` survives promotion | unit |
| **AT-PC-08** | Per-leg MARK and IV read live under a locked package | component |
| **AT-PC-09** | Strike control offers only listed strikes **for that right**; unlisted cannot be entered | component |
| **AT-PC-10** | One listed expiration → multi-date strategies absent from the picker | component |
| **AT-PC-11** | Empty ladder → "loading," never "unavailable" | component |
| **AT-PC-12** | DTE computed from the TM clock while `tmActive` | unit |
| **AT-PC-13** | `tmActive` → Log disabled on every position | component |
| **AT-PC-14** | Rehearsal-born position never promotes, after TM ends | unit |
| **AT-PC-15** | Selecting a symbol header sets the suite symbol; expanding one does not | component |
| **AT-PC-16** | Autofit does not fire when the edited position still fits the window | unit |
| **AT-PC-17** | A missing-contract leg renders an invalid state, does not bind to the missing value, and **writes nothing on render** | component + fixture |
| **AT-PC-18** | A structure roll is proposed and applies only on the member's action | component |
| **AT-PC-19** | Interactive cells meet the active `--hit-min` and **no two hit rectangles overlap**, at both density profiles | a11y |
| **AT-PC-20** | No profit-claim or ranking language anywhere in the surface | static |
| **AT-PC-21** | Create → Cancel destroys the draft; book length unchanged | unit |
| **AT-PC-22** | Opening Create writes nothing until Submit; no structure signal, no quote interest | component |
| **AT-PC-23** | Edit → Close / Esc reverts nothing and mutates nothing | component |
| **AT-PC-24** | Inspecting the price, then blurring with no edit, does not lock and writes nothing | component |
| **AT-PC-25** | A structure stepper — strike, date or POS — does not lock the basis | component |
| **AT-PC-26** | A POS scale leaves the lock standing; a ratio, strike, right, side or date change moves it to CHECK PRICE | unit |
| **AT-PC-27** | Typed BASIS on Create → `user_limit` on Submit | unit |
| **AT-PC-28** | Every Analyzer write sets `freeze_iv = false` and `freeze_marks = false` | unit |
| **AT-PC-29** | A credit package never renders as a signed value under a DEBIT label | unit |
| **AT-PC-30** | The structure signal does not change on marks, list reorder, group collapse, or a POS scale | unit |
| **AT-PC-31** | A quote merge never writes basis, lock, structure or name | unit |
| **AT-PC-32** | Strategy picker change rebuilds legs and moves basis to CHECK PRICE | unit |
| **AT-PC-33** | Delete requires confirmation and removes exactly one position | component |
| **AT-PC-34** | Every shown position is quoted; hidden positions register no interest | component |
| **AT-PC-35** | Leg rows display actual contracts; POS equals the GCD; 3/7/3 yields POS 1 and CUSTOM | unit |
| **AT-PC-36** | Name re-derives on every shape change, both directions (fly ⇄ BWB ⇄ CUSTOM) | unit |
| **AT-PC-37** | Undo reverses a card write, a dialog patch, a lock, a delete and a strategy rebuild; a quote tick is never an undo step | unit |
| **AT-PC-38** | A residual contract remains editable, and a structure containing one still promotes | unit |
| **AT-PC-39** | BASIS equals the same one-package number for `+1/−2/+1` and `+3/−6/+3`; the cell never multiplies by POS | unit |
| **AT-PC-40** | The POS stepper writes `ratio × POS` to every leg in one action; name unchanged, lock standing | unit |
| **AT-PC-41** | Classifier: 1-2-1 equal wings → Butterfly; 1-2-1 unequal → BWB; 1-2-2 → CUSTOM | unit |
| **AT-PC-42** | The control set does not rebuild when the name re-derives mid-gesture | component |
| **AT-PC-43** | Parametric chrome round-trips: legs → chrome → legs yields identical legs | unit |
| **AT-PC-44** | CHECK PRICE chip and both exits render on BASIS; the canvas draws the live mid until Keep | component |
| **AT-PC-45** | Undo does not un-Log; promotion is absent from the history stack | unit |
| **AT-PC-46** | The promotion mapper emits `order_type` from `lockSource` — a natural-mid basis does not record a limit — and emits no fill from a stored `entry_price` | unit |
| **AT-PC-47** | `rehearsal` and `visible` survive a persistence round-trip | unit |
| **AT-PC-48** | Inverting Buy/Sell moves the basis to CHECK PRICE | unit |
| **AT-PC-49** | The STRATEGY cell change is perceptible when the classifier fires | component |
| **AT-PC-50** | Undo across Create-Submit removes the record and reopens Create bound to that draft | component |
| **AT-PC-51** | The ToS script always carries `@LMT`, and its price equals the position's **current price** in each of the four states — including the pending CHECK PRICE row, where the script carries the **live mid**, not the marked numeral | unit |
| **AT-PC-52** | A shown position refused by the interest cap renders **BUDGET LIMIT** with its definition intact — never a dropped quote and never a stale mid styled as live | component |
| **AT-PC-53** | An all-same-side 1-2-1 classifies as **CUSTOM**, not Butterfly; an all-long four-leg 1-1-1-1 on both rights classifies as **CUSTOM**, not Iron Fly | unit |
| **AT-PC-54** | Logging an unlocked position captures the same current price a script copy would have carried at that instant | unit |
| **AT-PC-55** | Package Buy/Sell rewrites every leg's side and moves the basis to CHECK PRICE | unit |
| **AT-PC-56** | Create opens on Butterfly, unlocked, with no seeded basis | component |
| **AT-PC-57** | No order state is ever written onto an `AnalyzerPosition` | unit |
| **AT-PC-58** | Selecting a symbol header clears focus when the focused card is in another group | component |
| **AT-PC-59** | The tick source fails loud on an unknown product; no default value is returned | unit |
| **AT-PC-60** | The un-logged book survives a simulated browser restart — positions, `rehearsal` and `visible` intact — and no packet reduces it to session-only | unit |
| **AT-PC-61** | The card renders exactly the ten columns of PC-VOCAB-7 — no Yield, no Vol Adj, no BP Effect, and no per-leg price cell | component |
| **AT-PC-62** | DELTA renders on row 1 only; leg rows render "—" in that column | component |
| **AT-PC-63** | All seven card fields are editable where the strategy exposes them, and inert where it does not: Spread, Side, QTY, Expiration, Strike, Type, Price | component |
| **AT-PC-64** | Changing **Spread on the card** rebuilds the legs from the new seed and moves the basis to CHECK PRICE — identical behaviour to the dialog picker | unit |
| **AT-PC-65** | A Calendar, a Diagonal and a CUSTOM each expose per-leg expiration and strike editing on the card, and a per-leg edit on any of them re-derives the name | component |
| **AT-PC-66** | The lock affordance is distinguishable with colour discarded — open versus closed shackle carries the state | a11y |
| **AT-PC-67** | The stepper's **grown** state meets the active `--hit-min` at both density profiles; the resting state is not required to | a11y |
| **AT-PC-68** | Grown steppers on vertically adjacent rows do not overlap each other | a11y |
| **AT-PC-69** | QTY offers three paths to a value — type, step, and quick-pick — and the quick-pick sets the package lot size through the POS gesture (PC-QTY-6), leaving the ratio and the lock untouched | component |
| **AT-PC-70** | No chevron-style nudge control remains on the card | grep + component |

---

## 9. As-built gap map

At `d20b4f9`, re-confirmed against `34b84a7`.

| Area | This Spec | As-built |
|---|---|---|
| Edit preserves session fields | PC-REC-3 | **Critical defect** — `rehearsal` dropped; a Time Machine position becomes durable and Trade-Log-eligible |
| Edit preserves `visible` | PC-REC-3 | Broken — hidden cards reappear |
| Quote merge | PC-REC-4 | Broken — whole-row replace; `stillCurrent()` checks resolve identity, not structure |
| Bound Edit | PC-REC-2 | Absent — `didSeed` checkout |
| Create draft off-book | PC-REC-7 | Absent |
| Edit chrome has no Submit | PC-REC-9 | Broken — one Submit serves both modes |
| Opening Edit is read-only | Litmus 2 | Broken — seed snaps and re-prices legs |
| Undo | PC-UNDO-1 | **Absent everywhere** |
| Legs are the record | PC-STRAT-9 | **Two writers** — `listedStructure` generates parametrically; `updateLeg` / `shiftCardStrikes` edit legs. No round-trip guarantee |
| Derived structure name | PC-STRAT-7 | Absent — `template` is stored and authoritative |
| Classifier | §4.4 | **Absent** |
| CUSTOM | PC-STRAT-4 | **Absent** — eleven templates, no CUSTOM |
| Leg rows show actual contracts | PC-QTY-1 | **Inverted** — row 1 shows POS, leg rows show the ratio |
| POS derived from GCD | PC-QTY-2 | Absent — `contracts` is a stored multiplier |
| POS scale gesture | PC-QTY-6 | Absent |
| Per-leg quantity on the card | PC-QTY-5 | Absent — `analyzer-pos-qty` is display-only |
| One lock model | PC-LOCK-5 | Broken — dialog writes `net_debit_override` at 8 sites |
| One price engine | Litmus 1 | Broken — dialog hero is `packageEconomics` chain mids, opposite sign convention |
| One-package units | PC-LOCK-13 | Unspecified — nothing states the invariant |
| CHECK PRICE | §4.8 | Absent — `CardLockState` is `unlocked \| locked` |
| ToS script always carries a limit | PC-TOS-1 | The script generator is not specified against BASIS |
| Script and Trade Log row are distinct serialisations | PC-TOS-5 | Conflated — the mapper hardcodes `LMT` irrespective of `lockSource` |
| Classifier side predicates | §4.4 | N/A — no classifier exists |
| Interest overflow named | PC-SYM-9 | `BUDGET LIMIT` exists as a card state; the shown-count overflow path is unspecified |
| `freeze_iv` / `freeze_marks` forced false | PC-LOCK-11 | Unspecified — OPF defaults false, nothing forces them |
| Per-leg live | PC-LEG-1 | Broken — card reads stored `entry_price` / `volatility`; mixed live and frozen within one position |
| Strike controls chain-bound | PC-CHAIN-1 | Partly — bound at the write (snap), not at the control |
| Tick source for BASIS | PC-CHAIN-7 | **Absent entirely** — no tick constant in `options-lab` |
| Free date input | PC-EXP-2 | Present at `PositionBuilder.tsx:~1914` |
| DTE horizon single-sourced | PC-EXP-4 | Declared twice; already drifted (`max_dte=14`) |
| Promotion snapshot | PC-LIFE-7 | Absent |
| Promotion mapper | PC-LIFE-10 | Broken — always `order_type: "LMT"`, `fill_price` from stored `entry_price` |
| Persistence stated | §4.14 | Behaviour is **correct already** — `analyzerBook.ts` dual-writes `sessionStorage` and `localStorage` and reads `localStorage` first, so the book survives a restart. The defect is narrower: the save path drops `rehearsal` (PC-PERSIST-4). **Do not "fix" this to session-only** |
| Symbol grouping | PC-SYM-2 | Absent — per-card `off-symbol` badge instead |
| Autofit trigger | PC-FIT-1 | Broken — fires on book-appear and strike-drop only |
| Card density | §5.2 | `min-h-8` (32px) against a 36px compact floor / 44px standard |
| Hit-rect overlap | PC-HIG-1 | Unaudited |
| Delete confirmation | PC-HIG-3 | Absent |
| Focus | PC-SYM-3 | Dead wiring with a live symbol-retarget side effect behind it |

---

## 10. Non-goals

Broker OMS · order placement · per-leg Greeks · **per-leg price on the card** (PC-VOCAB-6) ·
**Yield** · **Vol Adj** · multi-card aggregate curves · Surface 3D changes · MSC imports ·
server-side multi-device book · historic-chain replay of closed trades · a second position store ·
a global state store · a selectable "Custom" mode · undo of a Trade Log promotion.

**Package DELTA is in scope** (PC-VOCAB-5, PC-VOCAB-7) and is the only Greek on the card.

**Deferred with a named home, not refused:**

| Item | Returns with |
|---|---|
| **BP Effect** on the card | The simulated-broker release. *(Coach, 2026-09-11: "In a future version when we have our simulated trading with sim broker we will add it.")* Defining it now needs either a per-broker margin engine or a max-loss stand-in that would understate undefined risk |
| Cloning a closed Trade Log trade into recreated conditions | A future Time Machine, once historical chain data accumulates |

---

*Position Control v1.2. Contract. No implementation before Coach's GO.*
