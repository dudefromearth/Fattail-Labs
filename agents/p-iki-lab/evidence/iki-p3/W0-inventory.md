# IKI-P3 W0 — Heatmap chrome inventory (read-only)

**Date:** 2026-08-22  
**Token:** `agents/go/IKI-P3.md`  
**Status:** **DONE.** Folded into Juliet plan. W1 blocked on Coach stamp of that plan.

Options Lab files were **opened, not edited**.

---

## 1. Layout shell (Heatmap as-built)

| Piece | File | What it does | Import / re-implement |
|-------|------|----------------|------------------------|
| Suite page | `web/app/app/options-lab/heatmap/page.tsx` | `OptionsLabChrome workspace` + `HeatmapChainPanel` | **Do not import.** IKI already mounts `IkiSuiteChrome` + host. |
| Workspace chrome | `web/components/options-lab/OptionsLabChrome.tsx` (`workspace`) | Compact top bar; `h-[calc(100dvh-4.5rem)]`; child fills rest | **Re-implement on IKI chrome** (breadcrumb says Options Lab; symbol strip omitted in workspace — Heatmap owns symbol in the rail). |
| Suite nav | `web/components/options-lab/OptionsLabNav.tsx` | HIG segmented pills | **Do not import.** `IkiSuiteNav` is the same grammar (already IKI). |
| 1/5 + 4/5 host | `web/components/options-lab/HeatmapChainPanel.tsx` (~833) | `flex min-h-0 flex-1 flex-col md:flex-row` · left rail · right view | **Re-implement in IKI runner page.** Panel is welded to OL templates, `useOptionChainBus`, ToS, Width Fit, tile paint. |
| Inspector tokens | `web/components/options-lab/inspectorChrome.tsx` | `InspectorSection`, `inspectorAside` (22.5rem / ~1/5), 44pt rows, token classes only | **Import as-is.** Standalone Echo chrome. No OL chain state. No edit. |
| Left rail | `web/components/options-lab/HeatmapControlsColumn.tsx` | Instrument / Template / Chain / ToS / Readout + stream chip | **Re-implement in IKI.** See §3. |
| Right view frame | `HeatmapChainPanel.tsx` header + `heatmap-view-panel` | Title, Live/Held chip, Spot, gen, Center spot; grid body | **Re-implement frame in IKI.** Body = existing Runner `TileGrid` **unchanged**. |
| Hover / ToS / Analyzer | `HeatmapHoverTip.tsx`, ToS block, Analyzer link | OL-only | **Out of scope.** Not on IKI rail. |

---

## 2. Heatmap §6.1 control set vs as-built rail

| §6.1 control | Heatmap rail today | IKI Runner today (`HeatmapRenderHost`) |
|--------------|--------------------|----------------------------------------|
| Template | `<select>` over `HEATMAP_TEMPLATES` (hides/shows BW / Width Fit) | Ad-hoc dark bar: `sym-fly@0.2` / `spread-tax@0.1` |
| Value mode | Shown only if `tpl.valueModes.length > 1` | Absent (`sym-fly` debit only) |
| Width | Width Fit sliders **or** ROC sensitivity; fly widths in profile line | Absent |
| Symbol | Instrument select (`useOptionsLab`) | URL / provider default only (no rail) |
| Expiry | Contract select | Ad-hoc `<select>` |
| Side filter | Calls / Puts segmented | Ad-hoc `<select>` |
| Wings | **Not in rail** (host uses `DEFAULT_STRIKE_WINGS` internally) | Same constant, no control |
| Spot | Readout + Center spot | Absent (grid only) |
| Stream status | Chip: Live stream · Held · Stream error · Connecting… from **`bus.transport`** | Raw `stale=` / `epoch_quality=` text on the grid |

W1 law (this GO): inapplicable controls **disabled, not hidden**. Heatmap **hides**. That is a second reason not to import `HeatmapControlsColumn`.

---

## 3. Why not import `HeatmapControlsColumn`

Welded to Options Lab:

1. Template list is `HEATMAP_TEMPLATES` (Width Fit, BW fly, …), not Runner registry (`sym-fly@0.2`, `spread-tax@0.1`).
2. ToS panel + Open in Analyzer.
3. Width Fit weight sliders.
4. Hides controls (violates this packet’s stable-rail rule).
5. Stream copy from `bus.transport`, not document `stale` / `epoch_quality`.

Re-implement `IkiRunnerRail` using **imported** `inspectorChrome` tokens + the same section grammar (Instrument · Template · Chain · Readout). Template options come from the Runner registry only.

---

## 4. Stream status (§6.2) — stop/report

Spec copy: Live stream · Held · market closed · Error / connecting.

Heatmap chip uses **`useOptionChainBus` `transport`** (`stream` / `held` / `error`). That hook is `web/lib/market/` — **frozen**.

This GO: drive status from the chain document’s **`stale`** and **`epoch_quality`** (already on the host meta). Do not invent.

Document fields as-built (read-only):

| Field | Values seen |
|-------|-------------|
| `stale` | `boolean` |
| `epoch_quality` | `ok` · `incomplete` · `skewed` (OPF `build_epoch`) |

**`market closed` is not on that document.** Inventing it from an RTH clock would violate this GO and TR10.

**Proposed (needs Coach ack):**

| Chip | Source |
|------|--------|
| Connecting… | no document yet |
| Stream error | host `onError` |
| Held | `stale === true` |
| Live stream | `stale === false` |
| Market closed | **omit** unless Coach names a document field |

`epoch_quality` shown as readout (with gen), not as a fourth invented chip.

---

## 5. HM14 / HIG (reference)

| Rule | Heatmap | IKI Runner now |
|------|---------|----------------|
| Tokens | `var(--color-*)`, `var(--hit-min)` = 2.75rem (44px), `var(--radius-*)`, `var(--elevation-*)` | Ad-hoc `bg-black/40`, `#0a0a0e` on chrome |
| ≥44pt | `min-h-[var(--hit-min)]` / `min-h-11` on rail rows; segmented `min-h-9` inside a 44pt row | Selects have no hit-min |
| Focus | `focus-visible:outline … --color-tint` | None on selector |
| Reduced-motion | `motion-safe:` on strike flash in the **panel grid** | Chrome has no motion; grid flash is template paint (do not change) |

Tile grid `#0a0a0e` is the Heatmap **view body** (same as flies matrix). Leave the sink background. Chrome around it uses tokens.

---

## 6. Socket / data path

`HeatmapRenderHost` already: `getMarketSocket()` · `createShellSession` · `run()`. One WS/tab. **Do not edit** `subscribe.ts`, `run.ts`, `registry.ts`, `templates/heatmap.ts`, `templates/spread-tax.ts`, `host.ts` compute. Chrome only.

Hashes stay the same if default chain identity is unchanged (symbol / expiry / side / wings=25).

---

## 7. Files to touch (W1 — pending ack)

GO evidence allowlist as written: **`web/lib/runner/`** and **`web/app/app/iki/`** only.

| File | Action |
|------|--------|
| `web/app/app/iki/runner/page.tsx` | Workspace compose: rail + view pane; host as view body |
| `web/app/app/iki/runner/IkiRunnerRail.tsx` | **Create.** Re-implemented §6.1 rail |
| `web/lib/runner/sinks/render.ts` | Strip ad-hoc selector; keep session + `TileGrid`; accept rail callbacks / lift controls so the rail owns chrome |
| `web/lib/runner/__tests__/iki-p3-chrome.test.ts` | **Create.** Rail present; selector bar gone; hashes/suites still import `run()` |

**Allowlist gap (needs Coach ack):**

`web/components/iki/IkiSuiteChrome.tsx` — add `workspace` fill (`h-[calc(100dvh-4.5rem)]`, compact top, child fills) matching `OptionsLabChrome` workspace. This is **IKI Lab**, not Options Lab, but it is **outside** the two directories in the GO `git diff` rule.

Options: (A) expand the allowlist to `web/components/iki/IkiSuiteChrome.tsx`, or (B) fake height inside `page.tsx` only (double-counts the top bar).

**Recommend A.**

---

## 8. Will not touch

`web/components/options-lab/**` · `web/lib/market/**` · `server/**` · `web/lib/runner/templates/**` · `web/lib/runner/subscribe.ts` · `web/lib/runner/run.ts` · `web/lib/options-lab/templates/**` · catalog / `ikiSuite.ts` nav naming.

Import-only (no edit): `inspectorChrome.tsx`, `chainLadderApi` expiry/wings constants, `getMarketSocket`.

**A1 — `useOptionsLab`:** runtime import of Options Lab symbol state. Member session is the shared `/app/*` guard (DL-540). Not an IKI identity.

---

## 9. Ack checklist (Coach)

Reply **ack W0** (or amend) on:

1. Re-implement rail in IKI; import `inspectorChrome` only.
2. Stream chip = Connecting / Error / Held / Live from `stale` + error. **No Market closed** unless you name a field.
3. Expand diff allowlist to `web/components/iki/IkiSuiteChrome.tsx` (workspace), or force height only in `page.tsx`.
4. Width / value / wings sit on the rail **disabled** when the active Runner template does not use them (stable rail).
5. ToS / Analyzer / Width Fit sliders **not** on IKI.

No W1 until that ack.
