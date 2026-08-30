# Analyzer Auto-fit / PiP missing for a member

**Date:** 2026-08-22  
**Surface:** `/app/options-lab/analyzer`  
**DL:** **DL-541**  
**Not:** an access privilege · not 0-dte.com SSO · not Brave-only

A member reported the Analyzer **PiP** button missing. Later Analyzer chrome still showed. He authenticates through **0-dte.com**, not fattail.ai. He tried other browsers with the same miss. He also does **not** see **Auto-fit**.

This note is the diagnosis so the next session does not re-attribute it to login issuer.

---

## What PiP is

Analyzer **PiP** is a small Surface **ISO** tent of the **same shown book** as the 2D chart (DL-519–522). Toggle sits in the viewport header, to the right of **Auto-fit**. Off by default. Prefs in this browser: `ft_analyzer_surface_pip_v1`.

There is **no** Access Control key, feature gate, plan slug, or `wordpress:0-dte` check on PiP or Auto-fit. The only Analyzer header control that is role-gated is **Strikes/in** (administrator).

---

## What 0-dte.com auth actually does

0-DTE coaching members sign in with **Continue with 0-DTE.com**. WordPress on 0-dte.com mints a JWT. Labs maps Woo slugs (`coaching` → Navigator, observer slugs → Observer trial) and sets the same `ft_session` as FatTail SSO.

After that callback they are on **`labs.fattail.ai`**, same JS bundle as a FatTail member. Issuer is visible in admin as **0-DTE SSO**. That names the login door. It does not hide Auto-fit or PiP.

The 0-dte-specific failure mode is an **unmapped Woo slug** → Labs `role: observer` with no paid plan. That still would not remove two header buttons while leaving Time Machine.

---

## Why Auto-fit and PiP vanished together

Both live in the **same centered overlay** on the viewport header:

```
[ Symbol · Spot · VIX ]     [ Auto-fit · PiP ] overlay z-1     [ Time Machine ] z-2
                            position:absolute; inset:0; centered
```

Time Machine (date + play/pause/stop + speeds) is **in-flow on the right** at a **higher z-index**. On a wide window the overlay still peeks through the gap. On a **narrow Analyzer column** (laptop, zoom, Positions list taking width) Time Machine **paints on top of the whole center pair**.

That matches the report:

| Observation | Why |
|-------------|-----|
| PiP missing | Under Time Machine |
| Auto-fit missing too | Same overlay as PiP |
| Later features still show | Time Machine / suite nav / book are not in that overlay |
| Every browser, “just him” | His **viewport width**, not his account |
| 0-dte.com login | Red herring until proven on a wide 0-DTE window and a narrow FatTail window |

Production screenshot (`labs.fattail.ai`, wide window): Auto-fit and PiP **are** in the header, faint, between VIX and Time Machine. Auto-fit is `disabled` until `hasCurves` (can stay grey off-market even with a tent). PiP is **not** disabled; the bordered-white-on-black style reads as grey next to Auto-fit. Brave video-PiP filters are a side rumor; same miss on Safari/Chrome/Firefox rules them out.

The miss follows **Analyzer column width**, not issuer. FatTail people checked on a studio/wide screen will see the buttons. A member on a laptop with the Positions column open will not.

---

## How to confirm (five minutes)

1. URL is `labs.fattail.ai/app/options-lab/analyzer` — not 0-dte.com, not an old FOTW/MSC app.
2. Full screen, zoom **100%**, drag the Positions splitter **left**.
3. If Auto-fit / PiP appear between VIX and Time Machine, it was overlap.
4. Optional disproof of “all 0-DTE users”: a 0-DTE member on a wide monitor should see them; a FatTail member on a 13" laptop should not.

Admin `/users` showing **0-DTE SSO** only confirms how he signed in.

---

## Fix (as-built in this repo)

**DL-541:** Viewport header is three **in-flow** columns:

1. Symbol / Spot / VIX  
2. Auto-fit / PiP (and admin Strikes/in)  
3. Time Machine  

No `position:absolute` overlay. Time Machine cannot cover Auto-fit or PiP.

**Does not ship to the member until MiniTwo is on this build.** Local/StudioTwo only until Coach deploys.

---

## Related

- PiP product: DL-519–522 (`web/components/options-lab/AnalyzerSurfacePip.tsx`)  
- Header: `web/components/options-lab/OpfRiskAnalyzer.tsx` (`data-testid="analyzer-viewport-toolbar"`)  
- Characterization: `web/lib/options-lab/analyzerPip.test.ts`  
- SSO map: `docs/WooCommerce-SSO-Integration-Guide.md`  
