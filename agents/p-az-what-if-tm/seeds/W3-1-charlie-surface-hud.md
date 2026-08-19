# Seed W3-1 — Charlie Surface What-if HUD

**Project:** p-az-what-if-tm  
**Agent:** Charlie  
**Phase:** W3  
**Depends:** W1-1 PASS (may ∥ W2)  
**Spec:** AZ-TM-3 · OD-2 A · Surface v0.1.8 §4.6 (What-if ≠ Time machine)  
**Gate it feeds:** W4 · W5

## Intent

`TimeHud` is the **What-if** frozen-smile walk. Same remaining domain and same `volOffsetPts` as Analyzer. Not snap-rebind Time machine. Not camera playhead.

## Files in scope

- `web/components/options-lab/surface/TimeHud.tsx` — What-if block only  
- `web/components/options-lab/surface/SurfaceApp.tsx` — HUD wire for elapsed / `volOffsetPts` / W1 τ helper only  

**Do not touch:** `persist.ts`, `surface_inspect`, playhead SAMPLE, planes HUD, named views, egg, autofit. Surface first-ship W3-1…W3-4 is **closed**; this is a follow-on HUD amend (PL-B1).

Session share: `ft_options_lab_whatif_v1` `{ elapsedHours, volOffsetPts, enabled }`. **Not** `surface_inspect`. If `enabled`, Keep-Warm return must keep the B4 banner (PL-A2). Analyzer W2 reads/writes the same key.

Mesh What-if τ = W1 `tauYearsWhatIf` (1-minute floor). Never `blackScholes.fractionalT` 1-hour min (AT-TM-14).

## Out of scope

Time-machine replay. Surface autofit. Egg tape. First-ship persist / playhead / planes.

## Copy

Block title **What-if**. Vol **Implied vol**. Time ends Now · Last trade. No member “pts”; no “Time machine” on this HUD.

## Done when

HUD uses W1 helpers. `volOffsetPts` matches Analyzer after one change (AT-TM-11). Mesh τ still OPF 16:00.

## Invariants

Surface spec: must not call the what-if τ walk a time machine.
