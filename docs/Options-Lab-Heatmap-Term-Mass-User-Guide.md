# Options Lab Heatmap — Term Mass

Term Mass is a Heatmap template. It maps chain GEX (estimate) across listed expirations.

**What you see**

- Rows are strikes (high at the top). Columns are the expirations on the Heatmap strip, near-dated at the left.
- Each cell is net chain GEX for that strike and expiration, in compact dollars.
- The right-hand profile sums the visible columns at each strike. Gold marks the largest absolute mass in this window.
- The NET footer is the column sum of valid cells.

**Honesty**

Chain GEX (estimate) at this snapshot, not a direction. Not true dealer GEX. Not a forecast. Gold is not a trade cue.

**Empty**

If the pack is missing, the grid stays empty and says so. The app will not copy one expiration across fake columns.

Help: `server/help_reference/options-lab-heatmap-term-mass.md`
