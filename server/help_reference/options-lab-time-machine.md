# Options Lab Time Machine

Member-facing guide to **Time Machine** on Analyzer, Heatmap, and Surface. This
is a study tool — it does not tell you what to trade and never promises a
profit. Open it from Options Lab (`/app/options-lab/analyzer` and the same
strip on Heatmap and Surface).

## Time Machine
One surface, one scrubber, **one source** — StudioOne for every date, including
today. The **date** picks the day. Today is already selected; picking it does
not turn replay on by itself. **Raising the scrubber** (Play, or choosing a
covered date) downloads that day **as it stands**. The range does **not** grow
while you scrub. A newer range is **Reset, then raise**. Login time is not a
bound: a late tab still gets what the archive holds.

Play, Pause, Stop, and the speeds live in the dark strip above the canvas.
**Reset** leaves replay and returns you to live.

Analyzer, Heatmap, and Surface share the same scrubber. The held generation
**is the chain** on all three. VIX comes from the marks tape, nearest-in-time;
a gap is a named hole, never a live VIX. Positions already on the book stay
visible — dark until the playhead reaches their entry, then they light.
A dark position does not show its legs. It shows that something is there
and not yet taken. Legs appear when it lights.

## How a day loads
The day is the listed chain captured that session — not a second source of
spot. A coarse pass lands first so you can see the whole session; it then
sharpens to **full**. The **fidelity** indicator (percent, or “coarse” /
“full”) says how sharp the download is yet. The inspector line names the
**first print the archive has**, not an approximation of the cash open. On the calendar, a
**dot** marks a day the archive holds (today too, when it has snaps); dim
dates are **NO PATH**. There is no 1-minute fallback. There is no refresh
control.

## Replay
The panel says **REPLAY** on its face while a playhead is up. The mini line in
the upper-right is that same day’s generations, not a second chart source.
Scrubbing walks the chain at that time.

## What you cannot persist while scrubbing
Cards and alerts you build under a playhead are **rehearsal**. They wear a
counter-clockwise badge. They tick on the replay clock, not wall time. They
never enter Trade Log — that control is hidden, and sending is refused if
asked — and they never notify. Live algos already on the book do not tick
while a playhead is up: they would be reading the replayed market, not the
live one. **Reset** ends rehearsal and says so — practice, not a working
order. Preferences (symbol, template) stay; rehearsal objects do not.

## Width Fit
On Heatmap Width Fit, **Live** is the current generation, **Average** is a
window mean, and **Replay** is the generation under the playhead. Those three
are not the same view.

## What Time Machine is not
Not a second product. Not a broker. Not an order. Not a profit forecast. Not
a 1-minute underlier walk.
