# Recording and closing a trade

Member-facing guide to the full lifecycle of a trade in the Trade Log
(`/app/trade-log`): opening (recording) a trade, closing it, and what
**Open**, **Complete**, **Orphan close**, and **partial_residual** mean.
Teaching and bookkeeping only — the Trade Log records what you did and how
it turned out; it does not tell you what to trade, grade a trade, or promise
a result.

## Recording a trade (opening)
To log a trade by hand, open the Trade Log (Practice → Trade Log) and tap
**New trade**. You can also **Import** a file or **paste a thinkorswim ticket** —
New trade peeks your clipboard and can pre-fill from a copied ToS order.

In the trade sheet you set the trade yourself. For an options strategy it is
**structure-first**: choose the **strategy** (BUTTERFLY, VERTICAL, SINGLE, a
straddle/iron family, and so on), the **underlier** and **expiration**, the
**center strike** and **width**, put/call and **units**, then the economics —
**order, net, and debit/credit** — and the **exec time** (required). The legs
(each strike/side/quantity) are built for you automatically; expand **Legs
(advanced)** only for a custom structure. Stock, futures, and crypto are simpler:
just **symbol · quantity · fill** (not option legs). Add process notes if you
like, then **Save** (⌘/Ctrl+Enter).

That saves an **opening** fill. It now appears in the blotter as an **Open**
trade, with **Close** and **Trash** actions on the row (and in the sheet's
Actions section).

## Closing a trade
Find the open trade in the blotter (filter **Status → Open** with Autofilter if
you have many). Then close it one of two ways:

- **Enter closing order** — for options, the sheet pre-fills the **reverse legs**
  marked *to close* and flips debit/credit for you. You set the **closing net**
  and the **exec time**, then save. For **stock, futures, or crypto**, close is
  still **symbol · quantity · fill** — the sheet does not treat a stock close as
  a single option.
- **Paste a thinkorswim close / Import** — paste the closing ticket you copied
  in ToS, or import a file. If it matches an open, it opens the closing form for
  that trade.

Before you save, the sheet shows **"Will pair with open #…"** so you can see
exactly which open you are closing. A **full** close of that open (same unit
size) becomes **Complete**.

A **smaller** close — for example **1 of a 5-unit** open — does **not** complete
the position. The remaining units stay on the book. The status is
**partial_residual** (that is the word on the badge and in Autofilter). It is
not Complete, and it is not a second Open.

Two useful rules:
- **Trashing a close reopens leftover size** — remove the closing fill and the
  open’s remaining units are unmatched again so you can redo the close.
- You **close before you delete**: a paired or **partial_residual** open cannot
  be deleted while a real close still exists. Delete the close first, then the
  open. If you try to delete that open first, the app **refuses with 409** and
  names the blocking close (`Delete the TO CLOSE fill (#…) first.`). Unmatched
  opens still delete. Delete asks in a **kit dialog** (Cancel or Delete) —
  closing the sheet is not deleting.

## Close checks (why a save can be refused)
When you save a close, the Trade Log checks it really belongs to that open.
The sheet shows the checks first. The **server also enforces them**: without the
matching override, the save is **refused with 422** and a named gate — not a
warning you can click past.

| Check | Default | Override on the sheet |
|-------|---------|------------------------|
| Structure pairs the intended open | Required | Allow orphan / unexpected pair |
| Same account as the open | Required | Allow different account |
| Close units equal the **original** open units | Required | Allow unit size ≠ open |
| No structure drift versus the open | Required | Allow structure drift |

**Allow unit size ≠ open** is how you record a partial close (1 of 5, or a later
leftover that is not the original size). Tick it on purpose. A full 5-of-5 close
does not need that box.

The checks keep the book honest. Tick the box only if the mismatch is
intentional. Imported history is a separate path and is not this 422 gate.

## What is an "orphan close"?
An **orphan close** is a **closing fill that has no matching open** in the same
account book. The Trade Log pairs each close to an open automatically by
**structure** — strategy, underlier, expiration, strikes — **within one account**
(FIFO, oldest open first). If a close can't find an open to pair with, it is
flagged **Orphan close**. Saving that close without the orphan override is
**422**.

It usually means one of these:
- the **opening trade was never recorded** (you logged or imported only the
  close);
- the open is on a **different account** (matching is per account);
- the **structure doesn't match** the open (different strikes, width, expiry,
  or unit size).

An orphan close is a deliberate **honesty signal**, not a hidden error — your
book is telling you a close is floating without its open. It shows as an **Orphan
close** badge on the row, and you can list them all with **Autofilter → Status →
Orphan close**.

## Fixing an orphan close
- **Record the missing open.** Add the opening trade (same account, same
  structure). It then pairs automatically and the trade becomes **Complete**
  (or **partial_residual** if units remain).
- **Or allow it on purpose.** If you really only have the close and that's
  intended, tick **"Allow orphan / unexpected pair"** on the close sheet when you
  save (that is the 422 override).
- **Or trash the close** if it was entered by mistake (kit dialog: Cancel or
  Delete).

## Trade status at a glance
- **Open** — an opening fill with no close yet.
- **partial_residual** — an opening fill that still has remaining units after a
  smaller close (for example 1 of 5). The leftover stays on the book.
- **Complete** — an open fully paired with its close (no remaining units).
- **Orphan close** — a close with no paired open (see above).

These are **matching states** (whether an open still needs its close, and how
much is left), not a grade or score of the trade.
