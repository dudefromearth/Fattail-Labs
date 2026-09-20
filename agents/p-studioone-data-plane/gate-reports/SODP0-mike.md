# SODP0-mike — hop / SSO / computing-class

**Agent:** Mike  
**Date:** 2026-09-19 (re-review)  
**Machine:** StudioTwo, read-only besides this file  
**Seed:** `agents/p-studioone-data-plane/seeds/SODP0-mike.md`  
**Review object:** spec **v0.1.3** §6 hop + SODP-3 + §7 UI-host SSO  
**Token:** `agents/go/SODP0-W0.md` (intake; **not BUILD**)  
**DL:** **DL-780** (Juliet landed the RETURNED binds)

**Prior:** this report was **RETURNED** on v0.1 (incomplete §6 token / Cookie / secret / SSO host). That verdict is superseded below.

**Open REQs:** REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN. Not AP-1. No "done."

---

## Verdict: **APPROVED**

SODP-3 is still law. The three-host table is still present (now with Site URL / SSO callback / Hop pin columns). All four RETURNED binds are in the spec, not only in this report.

| Bind (RETURNED → land) | Spec v0.1.3 | Mike |
|------------------------|-------------|------|
| 1. `issue_session(identity_id=0, issuer="internal", role="administrator")` | §6 Hop paragraph | **landed** |
| 2. Outbound request `Cookie:` only; never `Set-Cookie` computing JWT on the member response; never copy inbound member cookie | §6 Hop paragraph | **landed** |
| 3. Same `LABS_SESSION_SECRET`; sidecar `LABS_ENV=dev`; `:4010` / `:4011` / history `:4012`; no second token class | §6 Sidecar | **landed** |
| 4. SSO per UI host; localhost mismatch = 401 identity miss; MiniTwo/MacBook named packets; no MiniTwo session secret on the sidecar in this program | §7 table + **SSO per UI host** | **landed** |

Coach Content Law: SODP-3, the member-route table, and the three-host list were not dropped.

---

## Evidence (spec text)

**SODP-3** (spec §2, unchanged as law):

> The browser never talks to StudioOne. Member cookie stays on the UI host. Hop uses computing-class headers only.

**§6 Hop (SODP-3):**

> Labs `:4000` on the UI host: `require_session` on the inbound member `ft_session`. Then mint a **new** computing JWT: `auth.issue_session(identity_id=0, issuer="internal", role="administrator")`. Send it to StudioOne as an HTTP **request** header `Cookie: {LABS session cookie name}={token}`. Never copy the inbound member cookie. Never `Set-Cookie` the computing JWT on the member response. Never put computing-class, LAN IPs, or StudioOne URLs in the browser or in Next rewrites.

**§6 Sidecar:**

> StudioOne `:4010` / `:4011` / history `:4012` verify that JWT with the **same** `LABS_SESSION_SECRET` the UI-host hop used. Sidecar `LABS_ENV=dev` in this program (as-built VP/symbology). Unauthenticated 401; member-class JWT 403 `computing_consumers_only`; computing JWT 200. Fail loud if `LABS_SA_DEV_VP_API_BASE` / `LABS_SYMBOLOGY_API_BASE` / history base unset. History/OHLC/contracts/stream reuse this hop — no second secret, no second token class.

**§6 negatives (SODP3 evidence, not this packet):** member cookie forwarded → 403; no cookie → 401; computing JWT → 200; member hop response has no computing `Set-Cookie`.

**§7 three hosts** (StudioTwo / MacBook / MiniTwo) with SSO callback and hop pin. MacBook hostname **not invented**. MiniTwo: `LABS_COOKIE_DOMAIN=.fattail.ai`, `LABS_ENV=production` on **product** Labs; **SODP4 named**; does **not** inherit StudioTwo's callback or put MiniTwo's session secret on the sidecar in this program.

**SSO per UI host:**

> Browser origin, `NEXT_PUBLIC_SITE_URL`, and `LABS_SSO_LOGIN_URL_*` `redirect=` are the **same** host. Mismatch (including `localhost` while the member is on `studiotwo` or a named MacBook host) is a 401 identity miss — page may load; `/api/auth/me` does not. Next never rewrites `/api/*` to StudioOne. Computing-class never in the browser.

**DL-780** records the same four sentences. Matches the spec.

---

## Still held (not a return)

**SODP-LABS** remains out (§0, SODP-4, §8). Flag: moving product Labs (SSO issuers, MySQL `labs`, member JWT verify) onto StudioOne is CP-1 load **and** secret blast-radius on the capture box. Mike + Foxtrot if Coach stamps that cut. Not this program.

Opinion (not a block): a later named packet may give computing-class its own `aud` / secret so a sniffed LAN hop JWT is not also a StudioTwo `dev-login` administrator session. VP hop already has that residual. SODP3 must not make it worse.

`web/.env.example` still shows `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. SODP6 must not copy it.

---

## Isolation

No LIM / QFRIC / XS / PPL / Help Watch / IKI. No member-cookie forward. No MiniTwo deploy. No StudioOne git pull. No `_aggs_price_fill` repair. D6 / D7 / D8 open. ES/MES model ACTIVE blocked on VPS Q1.

---

Not BUILD. Not MiniTwo. Not MacBook. REQ-001 OPEN · REQ-002 OPEN · REQ-003 OPEN.
