# WF0-2 — Golden formulas

**Project:** Options Lab Heatmap Width Fit  
**Agent:** Hotel  
**Depends:** —  
**Feeds:** WF0-G · WF1-0

## In scope

Write `agents/p-options-lab-heatmap-width-fit/hotel-pin.md`:

- §4 component formulas (debit / payoff / gamma / curvature / theta / responsiveness / local stability / cp asymmetry)  
- Quality gates (Spec §6) including **negative long debit never high-fit**  
- Neighborhood: same-width ±1 / ±2; MAD or first-difference variance — pick one, name it  
- **OD-W6 (a):** stability is a **penalty outside** the member weight vector, with a config floor — not a weighted component and not member-zeroable. Sign the rec.  
- Default-preset rec: equal \(1/7\) on **criteria** components if OD-W6 (a), **or** modest convexity tilt (gamma + curvature). Coach picks at WF0-0.  
- Debit \(D\) = existing `symFlyDebit` only. No second pricer. No invented IV smile.  
- **L8:** `computeCell` emits raw components only — no pre-stability weighted sum (B2).

## Out of scope

Code. SRS. Platform ranking. Profit language.

## WF0-2 done

`hotel-pin.md` exists. Every component has a named formula. Quality gates listed. Preset rec labeled Hotel’s.
