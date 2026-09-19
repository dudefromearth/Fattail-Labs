# India — A23 drift check (W4)

**Date:** 2026-09-19  
**Spec:** `Specs/AZ-VP-9-A23.md` BUILD AUTHORITY  
**As-built:** `web/components/sa/SaPriceChart.tsx` · `web/lib/saVpSeries.ts` · `web/lib/saVpBand.ts`

| Spec requirement | As-built | Drift |
|------------------|----------|-------|
| `attachPrimitive` on candles | Yes, create effect | none |
| `updateAllViews()` | Yes | none |
| `/range` → bins → `requestUpdate()` | Yes `applyBins` | none |
| Pane-only y | `panePriceWindow` + `paneSize().height` | none |
| zOrder `"top"` | Yes | none |
| Overlay flag W1–W3 then gone | Demolished W3; grep empty | none |
| Clear bins before refetch | `clearHistogram` | none |
| Inflight cannot drop refetch | pending re-check | none |
| Hit-test | primitive `hitTest` + `hostToPane` | none (implementer choice recorded) |
| Deleted plumbing exceeds added | **Not met** vs HEAD net +lines | **YES — recorded DL-765** |
| Widget-only | no server/VP API edits in A23 packets | none |
| Guest-layer no autoscale | no `autoscaleInfo` | none |

**Verdict:** MATCH with one recorded acceptance-metric deviation (line counts). Not a law break. **GO** for W4-G close.
