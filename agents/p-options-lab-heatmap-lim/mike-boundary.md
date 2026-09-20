# LIM0-6 — Trust boundary (Mike)

**Project:** Options Lab Heatmap LIM  
**Agent:** Mike  
**Seed:** `seeds/LIM0-6-mike-boundary.md`  
**Feeds:** LIM0-G  
**Spec:** [`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.2.md`](../../Specs/FatTail%20Labs%20%E2%80%94%20Heatmap%20LIM%20Template%20%E2%80%94%20Specification%20v0.4.2.md) §2 · §9 · §13 · §14 · Appendix A  
**Plan:** [`docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Options-Lab-Heatmap-LIM-Full-Agent-Bench-Plan-v1.1.md) NX2 · JR1 · L8 · invariant 4 · C2 (LIM0-5 / LIM1-0)  
**GO token:** [`agents/go/OLLIM-W0.md`](../go/OLLIM-W0.md) — **not stamped by this note**

**Verdict:** LIM as specified is a **client-only template**. It adds **no new trust boundary**. Fail-loud is required; the throw belongs at **LIM activation**, not heatmap module load (**C2**).

---

## 1. Surface

LIM is one Heatmap template (`id: "lim"`, `layout: "quadrant"`). It computes lean / near-spot mix over the **OPF-held dual-side chain already on the tab**, via existing `buildGexProfile(ctx, "gex_net")` (`Γ·OI·S²`). Inputs are `gamma`, `open_interest`, `spot`. Spec header: *client-side only*. Spec §13: it does not gate orders, convert GEX to dollars, read volume / tape / positions / trade log, or replace frozen `gex`.

That is a display transform of data the member session already fetched. It is not an identity, entitlement, media, or market-ingest surface.

---

## 2. NX2 — no server plane

Plan **NX2** (out): *Server module, endpoint, Redis, `server/config.py`, allowlist file.* Spec §2 and §14 **Out** say the same.

**Confirm:**

| Item | LIM0-6 |
|------|--------|
| New FastAPI route | **No** |
| New Redis key / topic | **No** |
| New Massive call from Next or the browser | **No** |
| Touch `server/config.py` | **No** — LIM keys never enter `Config` (that class holds SSO secrets and DB password) |
| DL-539 §8 five-module allowlist file | **No** (procedural E12/JR8 is a GO-token checkbox, not an allowlist artifact) |
| New cookie / issuer / JWT / webhook | **No** |
| New entitlement or plan map | **No** |

Files in Spec §14 are `web/lib/options-lab/templates/lim*.ts`, types/registry, a `gex.ts` glow hook, a quadrant component, and a `HeatmapChainPanel` **branch**. Nothing under `server/`.

JR1: config lives in `web/lib/options-lab/templates/limConfig.ts`. Keys **exactly** Appendix A (`LABS_LIM_*`). Map values are JSON. **No** `server/config.py`.

---

## 3. Auth — no new check, no new bypass

Options Lab remains behind the existing member session (`ft_session`). Switching the Heatmap picker to LIM does not change role, plan, or what chain generations the tab may hold.

- Role checks stay **server-side on existing requests** (Mike invariant 3). The client is still not trusted.
- LIM does not introduce a privileged store, signed URL, or webhook.
- A member who can open Heatmap can open LIM; a member who cannot open Heatmap still cannot. Template id is not an access-control key.

No new auth work is in this program. Do not invent a LIM-only entitlement.

---

## 4. Massive — no new call from the browser

Market invariant: only feed processes / single-flight miss paths call Massive. Heatmap already binds `useOptionChainBus` in `HeatmapChainPanel`. Plan invariant 4 / first smoke #10: **mode switch = zero Massive**.

LIM compute is pure `(ctx) → LimResult` over that generation. Template or expiration change **must not** subscribe or fetch beyond the existing chain bus (plan §6.6). LIM5-1 records that with the same zero-fetch evidence Width Fit used.

A browser Massive client, a second socket, or a per-template `ensure_fresh` would be a **new** trust and quota boundary. NX2 + L8 forbid it.

---

## 5. Appendix A values are not secrets

Canonical keys (Spec §9 · Appendix A). These are tunables — scales, percents, weights, floors, trail timing, chrome flags:

| Environment key | In-code | v1 starting point (not a finding) |
|-----------------|---------|-----------------------------------|
| `LABS_LIM_CENTRE_SCALE_PTS` | `LIM_CENTRE_SCALE_PTS` | JSON map, e.g. `{"I:SPX": 50}` |
| `LABS_LIM_BAND_CLOSE_PCT` / `_BAND_MEDIUM_PCT` | … | 1.0 / 2.0 |
| `LABS_LIM_W_NET` / `_W_CONC` / `_W_MAG` | … | 0.50 / 0.30 / 0.20 (must sum 1.0) |
| `LABS_LIM_CONC_FLOOR` / `_CONC_SPAN` | … | 0 / 100 |
| `LABS_LIM_MAG_FLOOR` / `_MAG_SPAN` | … | 0 / 100 |
| `LABS_LIM_XPROX_FLOOR_PCT` / `_CEIL_PCT` | … | 0.5 / 1.5 |
| `LABS_LIM_TRAIL_INTERVAL_S` | … | 30 |
| `LABS_LIM_TRAIL_WINDOW_MIN` | … | 45 |
| `LABS_LIM_DRIFT_MIN_RATE` | … | 1.0 |
| `LABS_LIM_SHOW_TRANSITION` | … | `false` |
| `LABS_LIM_SHOW_ANNOTATIONS` | … | `false` |

**Retired / never valid:** `LIM_CONF_*` (AT-LIM28).

None of these are credentials, SSO HS256 material, Massive tokens, Redis URLs, or session secrets. Mike invariant 2 (secrets ≥ 32 chars, never committed, never logged) **does not apply to this set**. They may appear in the client bundle.

**`NEXT_PUBLIC_` seam (JR1 / LIM0-5):** if the Next bundler only inlines `NEXT_PUBLIC_*` into the browser, Charlie records a prefix as an **implementation seam** in the DL. Logical names stay Appendix A. A prefix is not a second constant set and is not a new secret class. Inlining these tunables is acceptable **because they are not secrets**. Putting a real secret on `NEXT_PUBLIC_` would be a hard fail — that must not happen here by copying `server/config.py` patterns into `limConfig.ts`.

---

## 6. Fail-loud must not leak the environment

Missing or invalid Appendix A keys **throw**. No silent default. No silent scale fallback (LIM34 · AT-LIM19 is `valid: false` for an **absent symbol in a present map**, which is product state, not a missing key).

**Leak rule (LIM1 implementer constraint):**

1. The error **names the missing or invalid Appendix A key** (logical `LABS_LIM_*` name). That is the member- and operator-facing named hole.
2. The error **must not** dump `process.env`, `Object.keys(process.env)`, `JSON.stringify(process.env)`, webpack's env object, or `server.Config`.
3. Sibling keys, other `NEXT_PUBLIC_*` values, and any secret that happens to be in the Node process stay out of the message and out of logs.
4. Model the existing API pattern: `ConfigError(f"Missing required environment variable: {name}")` — the **name**, not the rest of the environment. Invalid numerics may include the offending **value** (it is a public tunable) and must still not include sibling keys.
5. Panel catch (C2) renders LIM unavailable **with that named key**. Stack traces in production must not serialize env.

Fail-loud is how we refuse a lying blend. It is not a license to print the process environment into the heatmap.

---

## 7. C2 — throw at LIM activation, not heatmap module load

JR1 says parse at module load. `HeatmapChainPanel` already static-imports the template **registry** (every template) at panel load. If `limConfig.ts` throws at import, and the panel or `registry.ts` statically imports it, **Width Fit, frozen GEX, Advanced Fly, ladder, and vertical all fail to mount** because one LIM key is absent.

That blast radius is wrong:

- It is an availability failure of **existing** Heatmap work for a LIM-only misconfig (DL-539: do not take down existing work).
- Spec “aborts boot” / AT-LIM17 means **LIM does not silently run with a default**. It does not mean the Next process or the whole heatmap panel is the unit of boot.
- Catching at the template edge is still fail-loud: no silent default, missing key **named**, LIM `valid` path does not invent a blend.

**C2 (LIM0-5 / LIM1-0), endorsed:**

- `limConfig.ts` **must not** throw at `HeatmapChainPanel` (or `registry.ts`) module load.
- Parse on **first LIM activation** (lazy: first call into `computeLim` / `loadLimConfig` when template id is `lim`).
- Panel catches at the **template boundary**; render LIM unavailable with the missing/invalid key named.
- Other templates unaffected. No silent default.

That is the **safer blast radius**. It does not add a trust boundary: a named LIM-unavailable state is a display failure, not an auth bypass and not a second SoR.

AT-LIM17 isolation (LIM0-7 / LIM5-0): *other templates still render with a LIM key absent.* Mike requires that assertion. A whole-panel import throw would FAIL it.

---

## 8. No new trust boundary

| Attack class | LIM |
|--------------|-----|
| Issuer confusion / token replay / webhook forgery | N/A — no new issuer, cookie, or webhook |
| Client as role oracle | Unchanged — existing server checks on existing routes |
| Secret in the client bundle | Appendix A tunables only; `NEXT_PUBLIC_` seam is visibility of non-secrets |
| Fail-loud as env oracle | Forbidden — §6 |
| Extra Massive / second socket | Forbidden — §4 · NX2 |
| Config in `server/config.py` next to SSO secrets | Forbidden — NX2 · JR1 |
| Template switch as privilege | Not a privilege |
| Import-time throw as DoS of other templates | C2 forbids |

LIM does not move the membership, session, media, or market-ingest perimeter. Compute stays on the client over chain the tab already holds.

---

## 9. LIM1 must honor (not this packet)

This note is characterization, not code. When LIM1 lands `limConfig.ts`:

1. Client-only. No `server/` files. No new endpoints.
2. Appendix A keys only. No `LIM_CONF_*`.
3. Throw names the key; never dump env.
4. C2: first LIM activation, not heatmap module load.
5. Zero extra Massive on template switch.

---

## LIM0-6 done

Client-only template. No new auth. No new Massive from the browser. No new endpoints. No `server/config.py`. Appendix A values are not secrets. Fail-loud names the missing key and does not leak env dumps. **C2** (throw only at LIM activation) is the safer blast radius. **No new trust boundary.**

GO token remains unstamped.
