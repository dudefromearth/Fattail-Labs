# Seed W2-G — Delta

**Depends:** W2-1  
Ternary. Fail-closed: `engageTodayFromCache` as the today walk; **`seedTodayFromSession` leftover** (export, call site, or mount-time fill of the hold after W1); `captureToday` required for the range; tail-append; `day_changed` after the hold is complete; two holds; Width Fit Average broken; refresh control; 1-min; Record.

`seedTodayFromSession` is the quieter of the two today-walks. W1 makes it live. If it still exists as a separate path, **FAIL** — do not treat an as-built note as disposal.
