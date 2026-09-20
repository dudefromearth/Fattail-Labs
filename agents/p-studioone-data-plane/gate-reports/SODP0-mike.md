# SODP0-mike — hop / SSO / computing-class

**Agent:** Mike  
**Date:** 2026-09-19  
**Machine:** StudioTwo, read-only (no `server/` `web/` product edits)  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-mike.md`  
**Review object:** spec v0.1 §6 hop + SODP-3 + §7 UI-host SSO  
**Token:** `agents/go/SODP0-W0.md` (intake; **not BUILD**)

**Open REQs:** REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN. Not AP-1. No "done."

---

## Verdict: **RETURNED**

SODP-3 and the hop *direction* are sound and match the live VP/symbology hops. The §6 paragraph is **not stamp-ready**: Alpha cannot implement history hop from that text without inventing auth. §7 lists site URLs but does not bind SSO callback host. Coach Content Law: do not drop SODP-3, the route table, or the three-host list — **add** the binds below, then Mike re-reviews.

| Seed item | Spec as written | Mike |
|-----------|-----------------|------|
| 1. Member cookie never forwarded; computing-class admin JWT (`identity_id=0`, `LABS_ENV=dev` on sidecar) | SODP-3 + §6 mint `identity_id=0, role=administrator`; **omits** `issuer="internal"` and sidecar `LABS_ENV=dev` | **gap** |
| 2. Same secrets as the working VP hop | Silent. DL-773 already: sidecar verifies with the same `LABS_SESSION_SECRET` | **gap** |
| 3. Each UI host: `NEXT_PUBLIC_SITE_URL` + SSO redirect host; localhost callback = 401 identity miss | §7 URLs only | **gap** |
| 4. SODP-LABS out until Coach stamps; flag load on capture box | SODP-4 / §0 / §8 correctly out | **held** + flag |

---

## 1. What is already law (do not erase)

**SODP-3** (spec §2): browser never talks to StudioOne; member cookie stays on the UI host; hop uses computing-class headers only.

**§6 route table:** member hits Labs `:4000`; upstream is StudioOne `:4010` / `:4011`. Fail loud if `LABS_SA_DEV_VP_API_BASE` / `LABS_SYMBOLOGY_API_BASE` unset.

**SODP-4:** product Labs (identity, courses, MySQL `labs`, SSO issuers) stays MiniTwo until Coach stamps **SODP-LABS**. Correct. Mike does not open that cut.

As-built (evidence, not a repair):

- Hop mint: `server/routes/vp_display.py` `_computing_headers` and `server/routes/symbology.py` `_computing_headers` — `auth.issue_session(identity_id=0, issuer="internal", role="administrator")`, then **request** header `Cookie: {session_cookie}={token}`. Comment: "Never forward the member cookie."
- Sidecar gate: `server/market_data/vp_api/app.py` `_computing` and `server/symbology_app.py` `_computing` — `require_session` then `role_at_least(..., "administrator")`. No cookie → **401** `unauthenticated`. Member JWT → **403** `computing_consumers_only`. Live: `server/tests/test_symbology_studioone_live.py` `test_unauthenticated_401` / `test_member_403_computing_class`.
- Browser path: `web/next.config.ts` rewrites `/api/:path*` to `NEXT_PUBLIC_LABS_API_URL` only. No StudioOne host in Next.
- Secrets: **DL-773** — "Computing-class, same JWT secret as Labs." StudioTwo `.env` pins `LABS_SA_DEV_VP_API_BASE=http://192.168.1.111:4010` and `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011`. History hop must reuse this pair + this secret. No second auth scheme.
- `identity_id=0` is the internal/dev session (`server/routes/auth_dev.py`; Arch 05 §2.4). `guards._live_authorization_role` **401s iid=0 unless `LABS_ENV=dev`**. Sidecar `_computing` currently checks JWT **role** only, which is why the seed binds **`LABS_ENV=dev` on the sidecar** — keep that as-built; do not "fix" the sidecar to `production` so iid=0 looks legal.
- StudioTwo SSO (working): `web/.env.local` `NEXT_PUBLIC_SITE_URL=http://studiotwo:3000`; Labs `.env` `LABS_SSO_LOGIN_URL_*` redirect = `http://studiotwo:3000/api/auth/sso/wordpress:…`. Host-only `ft_session` in dev (`LABS_COOKIE_DOMAIN` empty). AGENTS.md: localhost callback → page loads, `/api/auth/me` **401**, no identity.

OHLC / contracts today are **in-process** on StudioTwo Labs (`vp_display.get_source_ohlc` does not call `_computing_headers()`). That is as-built honesty (spec §3), not a Mike fail. SODP3 must hop them with the **same** `_computing_headers` helper, not a new token class.

---

## 2. Why §6 is not stamp-ready

Current hop sentence:

> Hop: `require_session` locally → `auth.issue_session(identity_id=0, role=administrator)` Cookie to StudioOne. Never forward `ft_session`.

### R1 — Token is incomplete

`auth.issue_session(identity_id, issuer, role)` requires **`issuer`**. As-built hop is `issuer="internal"`. Spec omits it. Alpha would invent `sso_issuer` or copy from the member JWT (that is forwarding identity). Bind `issuer="internal"`.

### R2 — "Cookie to StudioOne" can overwrite the member

Two different cookies, same **name** `ft_session`:

| Cookie | Where | Value |
|--------|-------|--------|
| Member session | browser ↔ UI-host Labs | real `identity_id`, member role |
| Computing JWT | Labs → StudioOne **request header only** | `identity_id=0`, `role=administrator` |

If Alpha `Set-Cookie`s the computing JWT on the member response, the browser becomes identity 0 / administrator and the member session is gone. Spec must say: **outbound `Cookie:` request header to StudioOne; never `Set-Cookie` on the member response; never copy the inbound cookie value.**

### R3 — Shared secret is the whole trust

Hop JWT is HS256 with `LABS_SESSION_SECRET`. StudioOne verifies with **its** `get_config().session_secret`. VP hop works because they match. Spec does not say that. History hop on `:4010` (or sibling `:4012`) **must use the same secret as today's VP hop**. Do not mint a second session secret for OHLC.

### R4 — Sidecar stays `LABS_ENV=dev` in this program

Seed item 1. Spec silent. Flipping the sidecar to `LABS_ENV=production` to "look like MiniTwo" either (a) 401s iid=0 on any live-role guard, or (b) copies production session/SSO/DB secrets onto the capture box — that is **SODP-LABS**, which is out.

---

## 3. Why §7 SSO is not stamp-ready (MiniTwo / MacBook)

Seed: each UI host has its own `NEXT_PUBLIC_SITE_URL` + SSO redirect host. localhost callback is a 401 identity miss.

§7 table today:

| Host | Spec |
|------|------|
| StudioTwo | `http://studiotwo:3000` — correct as far as it goes |
| MacBook | "named host when Coach wires it; same hop pin" — pin is StudioOne; **SSO host is not the pin** |
| MiniTwo | `https://labs.fattail.ai` → Tailscale `http://100.74.220.38:4010` — hop pin only |

Missing law (the 2026-09-02 miss):

1. Browser origin, `NEXT_PUBLIC_SITE_URL`, and `LABS_SSO_LOGIN_URL_*` `redirect=` query **are the same host**.
2. Dev cookie is **host-only**. A callback on `localhost` while the member is on `studiotwo` (or a named MacBook host) sets `ft_session` on the wrong name → `/api/auth/me` 401, chrome loads, **no identity**.
3. Production MiniTwo: `https://labs.fattail.ai`, `LABS_COOKIE_DOMAIN=.fattail.ai`, `LABS_ENV=production`. That hop is **SODP4 named**, not "same as StudioTwo."
4. MacBook is **SODP6 named**. Do not invent a hostname. When Coach names it, that name is the SSO callback — not `studiotwo`, not `localhost`, not `labs.fattail.ai`.
5. Next never rewrites `/api/*` to `:4010` / `:4011`. Computing-class never in the browser (design §6).

`web/.env.example` still shows `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. That example is the trap. SODP6 must not copy it.

**MiniTwo vs sidecar secret (SODP4, not this stamp):** StudioTwo hop signs with the **dev** `LABS_SESSION_SECRET`. MiniTwo production signs with the **prod** secret. One sidecar cannot verify both unless someone copies the prod secret onto StudioOne (secret sprawl on the capture box) or splits computing-class onto a distinct secret. Spec §7 must not imply MiniTwo "just hops" with the StudioTwo sidecar env. Plan already HOLDs SODP4 until Coach names production — say that in §7.

---

## 4. Required spec text (Juliet · v0.1.x before Coach stamp)

Replace the §6 hop sentence with:

> **Hop (SODP-3).** Labs `:4000` on the UI host: `require_session` on the inbound member `ft_session`. Then mint a **new** computing JWT: `auth.issue_session(identity_id=0, issuer="internal", role="administrator")`. Send it to StudioOne as an HTTP **request** header `Cookie: {LABS session cookie name}={token}`. Never copy the inbound member cookie. Never `Set-Cookie` the computing JWT on the member response. Never put computing-class, LAN IPs, or StudioOne URLs in the browser or in Next rewrites.
>
> **Sidecar.** StudioOne `:4010` / `:4011` (and history if it is a sibling port) verify that JWT with the **same** `LABS_SESSION_SECRET` the UI-host hop used. Sidecar `LABS_ENV=dev` in this program (as-built VP/symbology). Unauthenticated 401; member-class JWT 403 `computing_consumers_only`; computing JWT 200. Fail loud if `LABS_SA_DEV_VP_API_BASE` / `LABS_SYMBOLOGY_API_BASE` unset. History/OHLC/contracts/stream reuse this hop — no second secret, no second token class.
>
> **Negative cases (SODP3 evidence, not this packet):** member cookie forwarded → 403; no cookie → 401; computing JWT → 200; member hop response has no computing `Set-Cookie`.

Add under §7:

> **SSO per UI host.** For each host, `NEXT_PUBLIC_SITE_URL` and `LABS_SSO_LOGIN_URL_*` `redirect=` encode **that** origin's `/api/auth/sso/wordpress:…`. Mismatch (including `localhost` while the member is on `studiotwo` or a named MacBook host) is a 401 identity miss — page may load; `/api/auth/me` does not. Dev: host-only cookie. MiniTwo production: `https://labs.fattail.ai` + `LABS_COOKIE_DOMAIN=.fattail.ai`. MacBook and MiniTwo hops are named packets (SODP6 / SODP4); they do not inherit StudioTwo's callback host or StudioTwo's session secret onto the sidecar.

Do not drop Coach's three-host table. Fill the SSO column with the binds above.

---

## 5. SODP-LABS — out; load flag (seed item 4)

**Held.** Do not move MySQL `labs`, SSO issuer secrets, member JWT verification, courses, or the product FastAPI onto StudioOne in this program.

**Flag (capture-box load, not a kill of SODP-4):** a later SODP-LABS GO would put member identity + SSO crypto + MySQL next to `chain_feed` / Massive / Redis on D1. That is CP-1 pessimism (CPU, connections, disk) **and** a secret blast-radius increase (session secret, SSO secrets, DB password on the capture box). Mike + Foxtrot + CP-1 dress if Coach ever stamps it. Until then MiniTwo remains the sole **product** Labs host.

Opinion (not a block): computing-class should eventually be a distinct `aud` / secret so a sniffed LAN hop JWT is not also a Labs `dev-login` administrator session on StudioTwo `:4000`. VP hop already has that residual (plaintext HTTP LAN, hop JWT = iid=0 admin, TTL = `LABS_SESSION_TTL_SECONDS`). SODP3 must not make it worse; a tighter token is a later named packet, not a silent SODP0 redesign.

---

## 6. Isolation

No LIM / QFRIC / XS / PPL / Help Watch / IKI files. No member-cookie forward. No MiniTwo deploy. No StudioOne git pull. No `_aggs_price_fill` repair. D6 / D7 / D8 open. ES/MES model ACTIVE blocked on VPS Q1.

Plan isolation FAIL "forwards member cookies to StudioOne" — spec does **not** do that. Keep it that way in the §6 rewrite.

---

## 7. Re-review

Juliet lands the §6 / §7 binds (spec v0.1.x DRAFT). Mike **APPROVED** only when those sentences are in the spec, not in this report. Then Coach stamp / SODP2-W0.

Not BUILD. Not MiniTwo. Not MacBook. REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.
