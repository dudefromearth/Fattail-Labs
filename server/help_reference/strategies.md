# Certified strategies (concepts)

These explain the certified strategies the FatTail method teaches — general education
grounded in the courses and the built-in strategy library. They are NOT personalised
advice about any member's own position, and never a prediction of profit. For the full
method, and for anything specific to a member's own trade, point them to the named
lesson and to live coaching.

## Risk-to-reward (R:R), how it's defined here
In this method R:R is a **structural** property of the fly you build — max payoff over
debit, i.e. **(width - debit) / debit**. It follows directly from how cheap the debit is
versus the wing width: a debit of ~10% of width is about **1:9**, ~5% is about **1:19**,
~2% is about **1:49**. So a strategy's "recommended R:R" is the band implied by the
debit-to-width it's designed to. It is a design band, not a promise.

## Asymmetric OTM Butterfly (Classic, 0-DTE)
The cornerstone: a single out-of-the-money call butterfly entered same day (0 DTE). Built
to a debit of about **4-10% of its width**, i.e. a structural R:R of roughly **1:9 to
1:24** (the classic "9-18 sweet spot"). Width is set from morning implied volatility / the
VIX regime. Typical max capital at risk ~$500. Exit: premium-decay trail plus take-profit
per the Profit Management Framework. Lessons: Classic OTM Butterfly, OTM Fly Direction and
Width, Risk & Profit Management.

## Time Warp Batman (1-2 DTE)
A multi-day "Time Warp" package built as a **Batman** - a call fly and a put fly together
for two-sided convexity - held over 1-2 days rather than closed same session. Built to a
**thinner debit of about 2-6% of width**, i.e. a **deeper structural R:R of roughly 1:16
to 1:49** (the deep-OTM "tail" band), reflecting its wider, further-out, multi-session
posture. Entered before the close, managed by trailing premium decay across sessions, with
a time stop by the DTE / campaign end. Typical max capital at risk ~$1,500. Lessons: Time
Warp (multi-day), Batman, Risk & Profit Management.

## Batman (dual fly)
"Batman" is the **dual-fly** shape itself - a call fly plus a put fly, so the position has
convexity on both sides. Used in the Time Warp package above and in higher-volatility
("Chaos") conditions. See the Batman lesson for when the method reaches for it.

## If a member asks a strategy's recommended R:R
Answer with the structural R:R band from its debit-to-width: the **classic 0-DTE fly**
runs about **1:9-1:24**; the **Time Warp Batman** runs deeper at about **1:16-1:49**.
These are design bands, not promises; the exact targets and management are taught in the
lessons and coaching. Do not prescribe a target for a member's own specific position.

## Taking profit on a butterfly (debit vs credit)
The long butterflies taught here (buy 1 / sell 2 / buy 1) are a **debit** - you pay a
net debit to open. To set a take-profit you **add** your desired profit to the debit -
the mirror of a credit spread, where you subtract your profit from the credit received:
- **Take-profit close price = entry debit + desired profit** (per unit). You sell the
  fly back to close, so that close is a credit.
- Example: paid 1.85 to open, want 2.00 of profit -> set the close at 3.85
  (about $200 per contract, x100 multiplier).
So a **debit fly adds** to reach the target; a **credit spread subtracts**. An OTM fly
just means a smaller debit and a larger potential payout - the take-profit math is
identical. Teach the method; do not prescribe a specific target for a member's own
position.
