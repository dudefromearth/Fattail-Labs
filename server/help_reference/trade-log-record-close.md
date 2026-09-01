# Recording and closing a trade

Member-facing guide to the full lifecycle of a trade in the Trade Log
(`/app/trade-log`): opening (recording) a trade, closing it, and what the
**Orphan close** status means. Teaching and bookkeeping only — the Trade Log
records what you did and how it turned out; it does not tell you what to trade,
grade a trade, or promise a result.

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
just **symbol · quantity · fill**. Add process notes if you like, then **Save**
(⌘/Ctrl+Enter).

That saves an **opening** fill. It now appears in the blotter as an **Open**
trade, with **Close** and **Trash** actions on the row (and in the sheet's
Actions section).

## Closing a trade
Find the open trade in the blotter (filter **Status → Open** with Autofilter if
you have many). Then close it one of two ways:

- **Enter closing order** — the sheet pre-fills the **reverse legs** marked
  *to close* and flips debit/credit for you. You just set the **closing net**
  and the **exec time**, then save.
- **Paste a thinkorswim close / Import** — paste the closing ticket you copied
  in ToS, or import a file. If it matches an open, it opens the closing form for
  that trade.

Before you save, the sheet shows **"Will pair with open #…"** so you can see
exactly which open you are closing. Once saved, the trade's status becomes
**Complete**.

Two useful rules:
- **Trashing a close reopens the trade** — the paired open goes back to Open
  (unmatched) so you can redo the close.
- You **close before you delete**: a paired open can't be deleted while its
  close still exists. Delete the close first, then the open.

## Close checks (why it sometimes warns you)
When you save a close, the Trade Log checks it really belongs to that open and
**fails loud** if something is off — same **structure**, same **account**, same
**unit quantity**, and no **structure drift** versus the open. Each check has an
override checkbox on the sheet (**allow orphan / unexpected pair**, **allow
different account**, **allow unit size ≠ open**, **allow structure drift**). The
warnings are there so your book stays honest, not to block you — tick the box if
the mismatch is intentional.

## What is an "orphan close"?
An **orphan close** is a **closing fill that has no matching open** in the same
account book. The Trade Log pairs each close to an open automatically by
**structure** — strategy, underlier, expiration, strikes — **within one account**
(FIFO, oldest open first). If a close can't find an open to pair with, it is
flagged **Orphan close**.

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
  structure). It then pairs automatically and the trade becomes **Complete**.
- **Or allow it on purpose.** If you really only have the close and that's
  intended, tick **"Allow orphan / unexpected pair"** on the close sheet when you
  save.
- **Or trash the close** if it was entered by mistake.

## Trade status at a glance
- **Open** — an opening fill with no close yet.
- **Complete** — an open paired with its close.
- **Orphan close** — a close with no paired open (see above).

These are **matching states** (whether an open still needs its close), not a
grade or score of the trade.
