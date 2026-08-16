# FatTail Labs — Tradier Integration: Where We're Up To

**Last updated:** 2026-08-16
**Status:** Scaffolding built + validated against Tradier sandbox. **Paused** — parked
here until we pick it back up. Nothing is live; feature is fail-closed (inert until
configured). Not deployed to MiniTwo/prod.
**Spec:** [FatTail-Labs-Tradier-Integration-Spec-v0.1.md](./FatTail-Labs-Tradier-Integration-Spec-v0.1.md)

The goal: a member clicks **Sync with Tradier**, logs in on Tradier's own site,
authorises **read-only** access, and their trade history flows into the Labs Trade Log
as a normal, previewable, recoverable import batch. No password ever touched by us.

---

## 1. What we have from Tradier (the access is sorted)

We were accepted as a Tradier partner (email to `ernie@0-dte.com`, 9 Mar 2026). We
already have everything needed to build and test:

- **Partner developer portal:** <https://developer.tradier.com> — sign in with
  **`ernie@0-dte.com`** (the invited partner account — *not* a new individual signup;
  only the invited account is linked to the partnership + test account). This is where
  we create the OAuth application and read its **Client ID / Client Secret** ourselves
  (self-serve — no need to ask Tradier).
- **Sandbox paper account + token** (for building/testing against real API shapes, no
  real money). Lives in that 9 Mar email. Base URL: **`https://sandbox.tradier.com`**.
  Note: the token's real account is **`VA17830428`** (the profile call auto-discovers
  it; the `VA43441201` quoted in the email is stale — our code reads the account from
  `/v1/user/profile`, so this doesn't matter).
- **Production test account** (broker UI): <https://web.tradier.com> — user `brokerdev`.

**Validated 2026-08-16:** the sandbox token authenticates, `/v1/user/profile`,
`/v1/accounts/{id}/history` and `/v1/accounts/{id}/gainloss` all respond and parse, and
the transformer handles the (currently empty) account cleanly. The sandbox account has
**no trades yet**, so the trade-data *mapping* hasn't been exercised on real fills — see
Open items.

### What we still (eventually) need from them — not blocking

1. **Enable refresh tokens** for our app (email `techsupport@tradier.com`). The only
   thing not self-serve. Without it, members re-authorise every 24 h; with it, "sync
   anytime" is seamless. **Launch-day nice-to-have, not a blocker.**
2. **Go-live approval** to let *real* Tradier customers connect *real* accounts (move
   the app from sandbox/test to production-approved). Confirm when we're ready to ship.

To fully validate mapping now, we can either ask Tradier to drop sample trades into the
sandbox account, or place a couple of paper trades ourselves via the sandbox order API.

---

## 2. What's built (local, on `main`, NOT deployed)

All fail-closed: nothing activates until `TRADIER_CLIENT_ID`, `TRADIER_CLIENT_SECRET`,
`TRADIER_REDIRECT_URI`, and `LABS_TOKEN_ENC_KEY` are set in the API env. Verified:
`is_enabled()` is `False` with none set → endpoints 404, status reports
`available:false` (UI button stays hidden).

| Piece | File | State |
|---|---|---|
| Token storage table | `migrations/124_member_broker_connections.sql` | ✅ written, **not yet run** on any DB |
| Config + master switch | `server/integrations/tradier/config.py` | ✅ `is_enabled()` fail-closed |
| Token encryption (Fernet) | `server/integrations/tradier/token_crypto.py` | ✅ round-trip verified |
| Tradier API client | `server/integrations/tradier/client.py` | ✅ OAuth + profile/history/gainloss, paginated; hit sandbox OK |
| Transformer (Tradier → canonical) | `server/integrations/tradier/transform.py` | ✅ OCC parse, direction, dedup hash, gainloss P&L |
| Shared batch commit | `server/routes/trade_log/commit.py` | ✅ lands sync as a normal import batch (file-import path untouched) |
| Gated routes | `server/routes/integrations_tradier.py` | ✅ connect / callback / sync / status / disconnect |
| Router registration | `server/main.py` | ✅ registered |
| Unit tests | `server/tests/test_tradier_transform.py` | ✅ **9 passing** |
| Dependency | `server/requirements.txt` | ✅ `cryptography>=42` added + installed locally |

**Endpoints (all identity-scoped, gated):**
`GET /api/me/integrations/tradier` (status) · `GET …/connect` (302 to Tradier) ·
`GET /api/integrations/tradier/callback` · `POST …/sync` · `DELETE …` (disconnect).

**Design notes carried from the spec:**
- Read-only (`scope=read`) — we never request trade/execution access.
- Tokens **encrypted at rest**; CSRF `state` on the callback; redirect URI pre-registered.
- History omits broker order numbers → dedup on a **content hash**
  (`external_order_id = tradier:sha256(account,date,symbol,qty,price,amount)`), so
  re-syncs are idempotent.
- Realized **P&L** is stamped from Tradier's `gainloss` (fixes the "P&L = 0" gap that
  bare CSV imports have).
- A sync lands through the **same import-batch path** → previewable, deletable,
  30-day recoverable in the Import Manager, for free.

---

## 3. Open items / known caveats

- **Mapping unproven on real fills.** OCC parsing + dedup are exact and unit-tested, but
  the *history↔gainloss reconciliation* (open/close inference, P&L stamping) and any
  multi-leg spread grouping need validating against a real Tradier account with trades.
  Tradier history has no order ids and no minute-level time, so v0.1 imports one
  single-leg trade per fill and lets the existing FIFO structure-matching pair them.
- **Migration 124 not run** anywhere yet (runs on next `migrate.py`).
- **`import_commit` duplication:** the file-upload route keeps its own inline commit
  loop; `commit.py` is a faithful copy so the working path stays untouched. Unifying
  them onto the shared helper is a safe later cleanup.
- **Coach sign-off** on the spec still pending (external OAuth + brokerage data).

---

## 4. Next steps (when we resume)

1. Log into `developer.tradier.com` as `ernie@0-dte.com`, create the app (callback
   `https://labs.fattail.ai/api/integrations/tradier/callback`, scope `read`), copy the
   Client ID + Secret.
2. Generate `LABS_TOKEN_ENC_KEY` (`Fernet.generate_key()`), put all four vars in the
   MiniTwo API launchd env (never git).
3. Generate sandbox fills (ask Tradier or place paper trades) → validate the transformer
   end-to-end; adjust open/close + P&L mapping against real data.
4. Wire the **Sync with Tradier** button into the Trade Log Import drawer (gated on the
   status endpoint's `available` flag).
5. Email `techsupport@tradier.com` for refresh-token enablement; then go-live approval.
6. Run migration 124, deploy to MiniTwo, verify a full connect → sync → batch flow.
