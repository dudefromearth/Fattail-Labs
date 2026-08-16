# FatTail Labs — Tradier Brokerage Integration Spec v0.1

**Status:** Proposed (2026-08-13). Spec-first; **Coach sign-off required** (external OAuth,
member credentials-adjacent, brokerage data, new secrets). Gated on the Tradier partner
app (see §3).
**Owner surface:** Member Trade Log (`/app/trade-log`) — the Import drawer + a Connections
state.
**Builds on:** the Trade Log import pipeline (import batches DL-307/308, `trade_log_io`
canonical model, FIFO structure matching) — a Tradier sync is a new **source** that feeds
the exact same commit path.
**Primary sources (Tradier's own docs):**
- OAuth flow + scopes + token exchange: <https://docs.tradier.com/docs/authentication>
- Access-token creation: <https://developer.tradier.com/documentation/oauth/access-token>
- Get Account History: <https://docs.tradier.com/reference/brokerage-api-accounts-get-account-history>
- Accounts / positions / gain-loss / history overview: <https://docs.tradier.com/docs/account-details>
- Getting started / personal token: <https://support.tradier.com/kb/guide/en/getting-started-with-tradier-api-JYIaTkOdD1>

---

## 1. Goal

Let a member click **Sync with Tradier**, log into Tradier on Tradier's own site, authorize
**read-only** access, and have their trade history pulled into the Labs Trade Log — no
password ever handled by us, dedup-safe on re-sync, landing as a normal, previewable,
recoverable **import batch**. Phase 1 is Tradier only; the connect/token/transform pattern
is the template for later brokers (tastytrade, IBKR, Schwab).

## 2. Non-goals (v0.1)

No order placement or any `trade` scope (read-only). No live streaming. No multi-brokerage
aggregator (this is the *direct* path — the SnapTrade alternative is a separate decision).
No automatic background sync in v0.1 (member-initiated; scheduled sync is a later phase).

## 3. Prerequisites — the Tradier partner app (critical path, not code)

Per Tradier: *"Once you are accepted as a Tradier partner, you will be invited to our
partner developer portal, where you can register and maintain an application."*
([auth docs](https://docs.tradier.com/docs/authentication)). So the `client_id` /
`client_secret` are **not self-serve** — they come from the partner portal after
acceptance. Ernie is already mid-partnership (landing page live on Tradier), so the
remaining steps are:

1. **Complete partner acceptance** (contact `sales@tradier.com` if it's stalled).
2. In the **partner developer portal**, **register the application** and provide:
   - **App name:** FatTail Labs
   - **Redirect URI:** `https://labs.fattail.ai/api/integrations/tradier/callback` (exact,
     pre-registered — Tradier only redirects to registered URIs).
   - **Scope:** `read` only (account info, positions, market data — *not* `trade`).
3. **Copy the `client_id` + `client_secret`** the portal issues → these go into the API
   launchd env (§8), never into git.
4. **Request refresh-token enablement** for the app (email `techsupport@tradier.com`).
   Access tokens live **24 h**; refresh tokens are **non-expiring but partner-gated**
   ([access-token docs](https://developer.tradier.com/documentation/oauth/access-token)).
   Without refresh tokens, members must re-authorize whenever the 24 h token lapses — with
   them, "sync anytime" is seamless.

**Interim/testing:** a **Personal Access Token** (any Tradier user: web.tradier.com → name →
API Access → copy token) lets us build and validate the *transformer + import pipeline*
against a real account **before** the OAuth app lands — decoupling the long-pole partner
step from the engineering. ([getting started](https://support.tradier.com/kb/guide/en/getting-started-with-tradier-api-JYIaTkOdD1)). Note: OAuth itself is production
(`api.tradier.com`) — there is no separate OAuth sandbox base URL documented; sandbox is for
personal-token developers.

## 4. OAuth flow (exact, per Tradier docs)

Read-only, authorization-code flow:

1. **Connect:** member clicks *Sync with Tradier* → we 302 to
   `GET https://api.tradier.com/v1/oauth/authorize?client_id=…&scope=read&state=<csrf>` (the
   redirect URI is the pre-registered one). Member logs into Tradier and approves.
2. **Callback:** Tradier redirects to our registered
   `…/api/integrations/tradier/callback?code=…&state=…`. We verify `state` (CSRF), reject if
   mismatched. Authorization codes expire in **10 min**.
3. **Token exchange:** `POST https://api.tradier.com/v1/oauth/accesstoken` with
   `Content-Type: application/x-www-form-urlencoded`, HTTP **Basic auth** = base64(`client_id:client_secret`),
   body `grant_type=authorization_code&code=<code>`. Response yields `access_token`
   (24 h), optional `refresh_token` (if enabled), `scope`, `expires_in`.
4. **Store** the tokens (encrypted, §6) against the member + record the connection.

## 5. Data pull + mapping (per Tradier account endpoints)

After connect, a **sync** pulls:

- `GET /v1/user/profile` → the member's Tradier **account_id(s)**. v0.1: if one account,
  auto-select; if several, the member picks which to sync.
- `GET /v1/accounts/{id}/history?type=trade` **and** `type=option` (paginated `page`/`limit`)
  → the **fills** (date, symbol / OCC option symbol, quantity, price, amount, commission,
  description). ([history reference](https://docs.tradier.com/reference/brokerage-api-accounts-get-account-history))
- `GET /v1/accounts/{id}/gainloss` (paginated) → **realized P&L per closed position**
  (open_date, close_date, cost, proceeds, gain_loss, symbol, quantity).

**Transform → canonical trades** (reusing `trade_log_io`'s model):
- Parse **OCC option symbols** → `underlier` / `expiration` / `strike` / `right`; group legs
  executed together into a **structure** (spread/butterfly), which then flows into the
  existing FIFO open↔close **structure matching**.
- **Realized P&L:** stamp `pnl_amount` from `gainloss` (this is exactly what CSV imports lack
  — it fixes the "P&L = 0 / balance shows starting capital" gap seen in member reports).

**Two documented limitations we design around** ([history reference](https://docs.tradier.com/reference/brokerage-api-accounts-get-account-history)):
- History **omits order numbers** → we can't dedup on a broker order id. Use a **content
  hash** `external_order_id = sha256(account, date, symbol, quantity, price, amount)` (same
  approach as the CSV `_trade_hash`) so re-syncs are idempotent. `external_adapter='tradier'`.
- History **omits minute-level time** and doesn't flag open vs close directly → infer
  open/close from `pos_effect` where present, else from `gainloss` pairing; keep the coarse
  timestamp Tradier gives.

**Land it through the existing pipeline:** the transformed trades go through the **same
`import_commit` path** → a new **import batch** (`source='tradier'`, `source_filename`=null,
label e.g. "Tradier sync · Aug 13"), dedup on `(account, external_adapter, external_order_id)`,
stamped `import_id`. So a sync is a first-class batch in the **Import Manager** — previewable,
deletable, 30-day recoverable — for free.

## 6. Data model + token storage (migration N)

New table `member_broker_connections`:

| Column | Notes |
|---|---|
| `id`, `identity_id` (FK CASCADE) | one row per member per broker |
| `provider` | `tradier` |
| `tradier_account_id` | selected account to sync |
| `access_token_enc`, `refresh_token_enc` | **encrypted at rest** (Fernet/AES with a key from env, never plaintext) |
| `token_expires_at`, `scope` | |
| `status` | `connected` \| `revoked` \| `error` |
| `connected_at`, `last_synced_at`, `last_sync_count` | |

Tokens are **encrypted** with a `LABS_TOKEN_ENC_KEY` (launchd env). Syncs reuse the existing
`member_trade_log_imports` batches for the imported trades — no new trade storage.

## 7. UI

- **Import drawer:** a **"Sync with Tradier"** button beside the file import ("Import a file
  — or — Sync with Tradier"). First click (not connected) → OAuth connect. Connected → runs a
  sync into the selected Trade Log account, shows "Imported N trades (M duplicates skipped)"
  and refreshes the blotter.
- **Connection state:** shows "Connected to Tradier · last synced …" with **Disconnect**
  (revokes + clears tokens). HIG dialogs/tokens throughout (per the Reports/Import Manager
  work).
- Consent copy is explicit: read-only, we never place trades, disconnect anytime.

## 8. Config / secrets (launchd env on MiniTwo — never git)

`TRADIER_CLIENT_ID`, `TRADIER_CLIENT_SECRET`, `TRADIER_REDIRECT_URI`
(`https://labs.fattail.ai/api/integrations/tradier/callback`), `TRADIER_API_BASE`
(`https://api.tradier.com`), `LABS_TOKEN_ENC_KEY`. Same pattern as the existing `XAI_API_KEY`
in the API plist. `is_enabled()` fails closed (feature hidden) when unconfigured.

## 9. Endpoints (Labs API)

| Method / path | Purpose |
|---|---|
| `GET /api/me/integrations/tradier/connect` | Build state, 302 to Tradier authorize |
| `GET /api/integrations/tradier/callback` | Verify state, exchange code, store tokens, redirect back to Trade Log |
| `POST /api/me/integrations/tradier/sync` | Pull history+gainloss, transform, run import_commit; returns `{created, skipped, import_id}` |
| `GET /api/me/integrations/tradier` | Connection status for the UI |
| `DELETE /api/me/integrations/tradier` | Disconnect + revoke + clear tokens |

All identity-scoped. Sync is idempotent (content-hash dedup) — safe to re-run.

## 10. Security / invariants

- **Read-only** (`scope=read`); we never request `trade`. We cannot move a member's money.
- We **never see the Tradier password** — auth happens on Tradier's site.
- Tokens **encrypted at rest**, per member, revocable; `state` CSRF on the callback;
  redirect URI pre-registered (Tradier rejects others).
- Sync writes only through the existing identity-scoped `import_commit`; a member's sync can
  only touch their own accounts.
- No member credential is ever typed into Labs (consistent with the platform's
  credential-handling stance).

## 11. Build phases

0. **(Business — Ernie)** finish partner acceptance, register the app (redirect URI + `read`
   scope), obtain `client_id`/`client_secret`, request refresh tokens.
1. **Transformer + pipeline** (can start now, via a personal token in a dev harness):
   Tradier history+gainloss → canonical trades → `import_commit`; dedup; tests.
2. **OAuth connect/callback + encrypted token storage + sync endpoint** (needs the app creds).
3. **UI** (button in Import drawer, connection state, disconnect), sandbox/staging verify.
4. **Refresh-token auto-renew + production**; then scheduled/incremental sync as a follow-up.

## 12. Verification

- Transformer unit tests: OCC parsing, structure grouping, open/close inference, content-hash
  dedup, `pnl_amount` from gainloss.
- OAuth: state-mismatch rejected; code exchange; token stored encrypted; disconnect revokes.
- End-to-end (personal token first, then OAuth): sync creates one batch, re-sync skips all,
  blotter + reports reconcile, batch is deletable/recoverable in the Import Manager.

## 13. Open decisions

- **Refresh tokens** approved? (Determines re-auth cadence — request early.)
- **Multi-account** members: pick-one vs sync-all in v0.1 (proposed: pick one).
- **Realized P&L authority:** trust Tradier `gainloss` vs recompute from fills (proposed:
  trust gainloss, it's the broker's official figure).
- **Scheduled sync** (nightly) vs member-initiated only in v0.1 (proposed: member-initiated).
- Direct-Tradier vs **SnapTrade aggregator** (~$1.50/connected-member; covers several brokers
  behind one integration) — confirm we're committing to direct.
