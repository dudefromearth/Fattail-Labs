# Hotel — generation tape (SB0-2)

**Status:** Draft for Hotel to stamp.

- **Interval (L23 is Coach’s).** Distinct `content_hash` vs capture tick is **not** Hotel’s to close. Scrubber seeks nearest stored generation. **No** interpolated strike, mid, greek, or IV.  
- **Median range (SB-13).** As-built footer median = median of `scored` after per-width `minMax01` + penalty. **scored ∈ [0, 1]**. Ranking `round(mean × 100)` is a display of a unit-interval fit score. Hotel: stamp or name an exception.  
- **Min stability (SB-14).** Confidence uses **min** per-gen stability in the window — conservative; one unstable gen may pull the label down. Hotel stamps this as the checked choice.  
- **Average heatmap** = mean `colorT` → `widthFitFill` (no re-rank). **Average ranking** = mean of per-width median. Observation of listed fit, not pin/magnet/dealer/forecast.  
- No GEX wall language on Width Fit Average.

Forbidden in Average/Replay copy: pin, magnet, dealer must, will bounce, signal, forecast.

**Hotel stamp**

- [x] Median ∈ [0, 1] (as-built scored after minMax01 + penalty)  
- [x] Min-over-window stability accepted  
- [x] Confidence cuts: High if n≥min_valid_n on #1 and #2, score gap ≥0.08, min stab ≥0.55; Moderate if n ok and gap ≥0.03; else Low.  

