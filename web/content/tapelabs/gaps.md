# Gaps

Gaps shows where the open sat against yesterday's close, and what price did after that. The page counts those outcomes. A fade or a follow is your decision. The page does not place either one.

**Tape Labs** at the top returns you to the dashboard. **Open this day in the backtest** opens Backtest for the symbol on the page.

## Words the page uses

| Word | Meaning |
| --- | --- |
| Gap | Today's open minus yesterday's close. |
| Zone | Where that open sits on yesterday's candle: above the high, in the upper wick, in the body, in the lower wick, or below the low. |
| Large | The gap is at least 40% of the five-day range.[^gaps-range] The slider lower on the page can try a different percent. The deck's own 40% tally stays on 40%. |
| Filled | A later print reached yesterday's close. |
| Extended | Price went on past yesterday's close by half of that five-day range. |
| Held | The gap was still open. Price had not come back to yesterday's close. |

## One session

| Control | What it does |
| --- | --- |
| Symbol | The name to count. |
| Day | One session. |
| Week | The sessions in the week you pick. |
| When | The calendar. Choose the day or the week. |
| Play | Moves through the session. |
| Restart | Returns to the open. |
| Replay position | The slider. It starts at 09:31 Eastern. Move it to walk the day. |
| The clock | The time the slider is on. It starts at 09:31. |

The picture is that gap day. At 09:31 you are on the open print. The path draws as you move the slider forward or press **Play**.

Under the picture, a grid compares **Held**, **Filled**, and **Extended** for this day and for similar earlier sessions. In a week, the days in that week are listed under the picture.

## Size, then regime

Tables that split the record by how large the gap was, and by the kind of day. Read the note above each table. The note says which split you are looking at.

## How big the gap is

Three filters narrow the earlier sessions you are comparing with.

| Filter | Choices |
| --- | --- |
| Direction | **This day's direction**, **Any direction**, **Up**, or **Down**. |
| Zone | **This day's zone**, **Any zone**, or one zone. |
| VWAP | **Either side of VWAP**, **This day's side**, **Above VWAP**, or **Below VWAP**.[^gaps-vwap] |

## When it was still open

Three boxes each for **Percent**, **Range %**, and **Sigma**. They mark where small ends, where medium ends, and where large ends. Changing these boxes does not move the deck's 40% tally.

The picture shows the share of earlier gaps that were still open as the session went on.

Sigma here is the size of the gap compared with the symbol's own recent noise. It describes the gap. It does not predict the close.

## Where the open sat

Yesterday's candle, split into the five zones. The note under it says which zone this open landed in.

## The six pictures

Short animations of gap shapes, with **Play** and **Restart**. These are examples of the shapes. They are not today's session. Today's session is the picture at the top.

## Our sessions

The status line says how many sessions are stored for the symbol, and the first and last of those dates. Today stays on the calendar for the whole day.

**Accumulated, deck rules** counts the whole stored record for the symbol. It is not a list of days. Large is still 40% of the five-day range. A percent is shown when a row has at least five sessions.

## What if the size changes

| Slider | What it changes |
| --- | --- |
| Large if the gap is at least …% of the 5-day range | The percent that counts as large in the table under the sliders. It starts at 40. |
| Only gaps of at least …% | The smallest gap included in that table. It starts at 0.05%. |

The table under the sliders recounts with those two settings. The deck tally above it stays on its own 40% rule.

## When the picture is empty

A collected day draws that day's prints, including days collected after the older stored file ends. Today is included while it is still being collected. A day that was never collected has no prints to draw. Use the calendar for a day the capture holds, then move **Replay position** or press **Play**.

[^gaps-range]: The five-day range is the average of how far price traveled from high to low over the previous five sessions, including gaps between sessions. The page calls this the 5-day average true range.
[^gaps-vwap]: VWAP is the average price so far in the session, weighted by how much traded at each price.
