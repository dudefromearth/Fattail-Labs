# WF0-4 — Observation-only copy

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Tango  
**Depends:** —  
**Feeds:** WF0-G · WF3-2 · AT-WF8

## In scope

Write `agents/p-options-lab-heatmap-width-fit/tango-copy.md`:

- Spec §8.3 mapping table copied as **required UI strings**  
- Forbidden scan list: Optimizer, BOS, Butterfly Opportunity Score, Preferred Width, Recommendation, Opportunity, Strong Preference, No Clear Preference  
- Required states: Strong Fit / Moderate Fit / No Clear Fit / No reliable fit yet / Unstable Surface  
- Legend paragraph (Spec §8.4) — must appear  
- Inspector phrase templates (comparative, structure-descriptive; high-cell / moderate-width note)  
- Capacity-over-dependency: no “the platform likes this width”  
- **A3:** rule on **best / top / strongest**. Default until ruled: do not ship “best” in the matrix overview. Put the chosen word (or the ban) on the AT-WF8 scan list.

## Out of scope

Code. Changing Spec Coach text. Profit claims.

## WF0-4 done

`tango-copy.md` exists. AT-WF8 string lists are pasteable into `widthFit.vocab.test.ts`.
