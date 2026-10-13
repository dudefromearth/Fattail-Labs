# Health

Health is the front desk for the collected tape. It shows whether the capture is answering, what the watched symbols are doing, and which days are saved.

The link at the top of the tool says **Tape Labs**. Use it to come back to this dashboard.

The clock on the right is Eastern Time. The session line and the market line beside it describe the session and the market. They do not change the pictures below.

## Market narrative

A written note for the day you pick. The note describes the session. It is not a signal.

| Control | What it does |
| --- | --- |
| Day | Opens the calendar. Choose the day you want to read. |
| Get current update | Loads the newest note for that day. |
| Read aloud | Speaks the note in this browser. |
| Stop reading | Stops the voice. It appears while reading is on. |
| Save to file | Downloads the note. |

## Opening move

This block says where today's SPX path sits against the 9:31 print. It uses the chain snapshot already saved.[^health-snap] It describes the morning. It is not a forecast.

Two links sit under that sentence: **Open the opening-move report** and **Other ways to look at the same days**. Those reports are not on this dashboard. The links remain on the Health page. **Tape Labs** at the top brings you back here.

## Symbols under watch

A tile for each symbol the capture watches: SPX, XSP, VIX1D, VIX, SPY, QQQ, IWM, GLD, TLT, SLV, USO, XLF, UNG, AAPL, AMZN, NVDA, TSLA, GOOGL, META, and MSFT.

| On the tile | What it is |
| --- | --- |
| The symbol | The name. Select the tile to open it in Symbol view. |
| The status word | Whether a same-day chain is coming in. A symbol is skipped for the day when it has no option expiring that day. |
| The price | The latest spot from the chain snapshot. |
| The age | How long ago that snapshot was taken. |
| The gap | How far that spot is from the prior session's official close, in percent. |

When a 20-day and a 200-day average appear, they show how those two averages sit against each other. They are not a signal for you to follow.

## Today's movers

Names that moved in the wider market, past a price floor and a volume floor. This list is for discovery. Most of these names have no same-day options chain to open.

## Data system

Three cards: **Collector**, **WebSocket capture**, and **API**.

| Word on the card | Meaning |
| --- | --- |
| LIVE | That part is answering. |
| A word that starts with ERROR | That part is not answering. |
| Any other word | That part is up, and the card has a warning worth reading. |

Before the open, a missing chain for today is a quiet morning. The snapshot is not there yet.

## Replay

Opens a short stretch of ticks. Keep the window short. A futures window of a few minutes is enough. A live-market window can take a few seconds to load.

| Field | What you enter |
| --- | --- |
| Source | **History ticks** reads stored history. **Captured WebSocket** reads what the capture saved. |
| Market | Stock, option, or futures. Shown for history ticks. |
| Ticker | The symbol, such as SPY. Shown for history ticks. |
| Root | The product root. Shown for captured WebSocket. |
| Contract | The option contract id, when you are replaying one contract. Shown for captured WebSocket. |
| Date (ET) | The session date, Eastern Time. |
| Start and End | The clock times for the window. |
| Open replay | Opens that window. |

Two example buttons fill the form for you: **BTCT, the video's example** and **ES, same window**.

The replay page opens from here. It is not its own card on the dashboard. **Tape Labs** at the top returns you to the dashboard.

## Browse a captured day

The search box filters the saved days. Type a year and month, such as `2026-09`, or a day number. Select a day to read what was saved.

[^health-snap]: A snapshot is a saved copy of the option chain, the list of call and put contracts, taken every few seconds.
