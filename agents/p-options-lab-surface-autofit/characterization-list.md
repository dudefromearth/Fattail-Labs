# Characterization — Surface Autofit (first wave)

**Source:** Autofit Spec v0.1.1 §7 · plan §5  
**W2-G:** this set only. AF-n tests are later.

| Id | Assert | As-built hook |
|----|--------|----------------|
| AT-AF-1 | Long fly: wings + expiry BEs inside window with pad | `surfaceAutofit.test.ts` |
| AT-AF-2 | Spot inside at Autofit time | same |
| AT-AF-3 | Equal pad (0.01 floor) | same |
| AT-AF-4 | Empty legs / bad spot throw | same |
| AT-AF-5 | `surface-autofit` exists; Fit does not change `sMin`/`sMax` | `CameraHud` + SurfaceApp freeze |
| AT-AF-6 | Two shown structures: union of listed Ks in the box | `unionListedStrikes` + test |
| AT-AF-7 | `autofitShouldRun`: book-change + button true; what-if, live-spot, playhead, camera-fit false | `autofitShouldRun` |

W3 must not add tests that contradict AF-L8.
