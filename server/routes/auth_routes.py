"""Authentication routes: native login, SSO callback, providers list, me, logout.
Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4."""

import hashlib
import hmac

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

import activity
import auth
import db
import identity
import providers
from config import get_config

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Default post-SSO landing (member home). Override with safe relative `next`.
_DEFAULT_SSO_LANDING = "/home"
_MAX_NEXT_LEN = 512


def safe_next_path(next_raw: str | None, default: str = _DEFAULT_SSO_LANDING) -> str:
    """Allow only same-origin relative paths after SSO (open-redirect safe).

    Accepts site-relative destinations so WP My Account buttons can deep-link
    anywhere on Labs, e.g. next=/course or next=/app/journey.

    Rejects: empty, scheme/host absolute URLs, protocol-relative //…, backslashes,
    control characters. Invalid values fall back to *default*.
    """
    if next_raw is None:
        return default
    n = str(next_raw).strip()
    if not n or len(n) > _MAX_NEXT_LEN:
        return default
    # Must be a single-site path: starts with one slash, not //.
    if not n.startswith("/") or n.startswith("//"):
        return default
    if "://" in n or "\\" in n:
        return default
    if any(ord(c) < 32 for c in n):
        return default
    return n


def _cookie_secure() -> bool:
    """HTTPS-only cookies outside dev (must match on set and delete)."""
    return get_config().env != "dev"


def _session_cookie_kwargs() -> dict:
    """Attributes used when minting a new session cookie."""
    cfg = get_config()
    kwargs: dict = {
        "path": "/",
        "httponly": True,
        "samesite": "lax",
        "secure": _cookie_secure(),
    }
    if cfg.cookie_domain:
        kwargs["domain"] = cfg.cookie_domain
    return kwargs


def _clear_session_cookie(resp) -> None:
    """Expire every plausible ft_session variant.

    Browsers only clear a cookie when Domain/Path/Secure/SameSite match how it
    was set. We may have issued host-only *or* Domain=.fattail.ai cookies, with
    or without Secure, across deploys — so delete all combinations. Otherwise
    Sign out shows the login form while /api/auth/me still authenticates the
    old account (and a later SSO can appear to "do nothing").
    """
    cfg = get_config()
    name = cfg.session_cookie
    domains: list[str | None] = [None]
    if cfg.cookie_domain:
        d = cfg.cookie_domain.strip()
        domains.append(d)
        if d.startswith("."):
            domains.append(d[1:])
        else:
            domains.append(f".{d}")
    # de-dupe preserve order
    seen: list[str | None] = []
    for d in domains:
        if d not in seen:
            seen.append(d)

    for domain in seen:
        for secure in (False, True):
            for samesite in ("lax", "strict", "none"):
                kw: dict = {
                    "path": "/",
                    "httponly": True,
                    "samesite": samesite,
                    "secure": secure,
                }
                if domain:
                    kw["domain"] = domain
                # samesite=none requires secure in browsers; still emit clear
                try:
                    resp.delete_cookie(name, **kw)
                except Exception:
                    pass
        # Minimal delete (Starlette defaults)
        try:
            if domain:
                resp.delete_cookie(name, path="/", domain=domain)
            else:
                resp.delete_cookie(name, path="/")
        except Exception:
            pass


def _session_response(resp, identity_id: int, provider: str, role: str, request=None):
    """Mint session JWT cookie — always clears prior variants first (no stacked cookies)."""
    cfg = get_config()
    _clear_session_cookie(resp)
    token = auth.issue_session(identity_id=identity_id, issuer=provider, role=role)
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=cfg.session_ttl_seconds,
        **_session_cookie_kwargs(),
    )
    # Record the login for the admin Users analytics (best-effort, never raises).
    activity.record_login(identity_id, provider, role, request=request)
    return resp


@router.post("/login")
async def native_login(request: Request):
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=422, detail="email and password required")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT i.identity_id, i.display_name, c.password_hash
                   FROM identities i JOIN credentials c ON c.identity_id = i.identity_id
                   WHERE i.email = %s""",
                (email,),
            )
            row = cur.fetchone()
            # Constant-shape failure: same error whether the account or password is wrong.
            if row is None or not identity.verify_password(password, row["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            role = identity.derive_role(cur, row["identity_id"])

    return _session_response(
        JSONResponse({"identity_id": row["identity_id"], "role": role}),
        row["identity_id"], "native", role, request=request,
    )


@router.post("/forgot-password")
async def forgot_password(request: Request):
    """Request a password-reset email (enumeration-safe). Spec: Password-Reset v1.0."""
    import password_reset as pr

    body = await request.json()
    email = body.get("email") or ""
    # Client IP for audit only (never trusted for auth)
    ip = request.client.host if request.client else None
    try:
        result = pr.request_reset(email, request_ip=ip)
    except pr.PasswordResetError as exc:
        msg = str(exc)
        if "not configured" in msg.lower() or "LABS_WEB_ORIGIN" in msg:
            raise HTTPException(status_code=503, detail=msg) from exc
        if "Valid email" in msg:
            raise HTTPException(status_code=422, detail=msg) from exc
        raise HTTPException(status_code=503, detail=msg) from exc
    return {"ok": True, "detail": result["detail"]}


@router.post("/reset-password")
async def reset_password(request: Request):
    """Consume reset token and set a new password. Spec: Password-Reset v1.0."""
    import password_reset as pr

    body = await request.json()
    token = body.get("token") or ""
    password = body.get("password") or ""
    try:
        result = pr.reset_with_token(token, password)
    except pr.PasswordResetError as exc:
        msg = str(exc)
        code = 422 if "10 characters" in msg or "Password must" in msg else 400
        raise HTTPException(status_code=code, detail=msg) from exc
    return result


@router.post("/register")
async def register(request: Request):
    """Self-serve free account (observer tier). Enrollment & Access spec §2."""
    body = await request.json()
    name = (body.get("name") or "").strip()
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Valid email required")
    try:
        password_hash = identity.hash_password(password)
    except identity.IdentityError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id FROM identities WHERE email = %s", (email,))
            if cur.fetchone() is not None:
                # Never attach a password to an existing identity here (takeover guard).
                raise HTTPException(
                    status_code=409, detail="Account already exists — sign in instead"
                )
            identity_id = identity.get_or_create_identity(cur, email, name)
            cur.execute(
                "INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)",
                (identity_id, password_hash),
            )
            role = identity.derive_role(cur, identity_id)

    return _session_response(
        JSONResponse({"identity_id": identity_id, "role": role}, status_code=201),
        identity_id, "native", role, request=request,
    )


@router.get("/sso/{provider_name:path}")
def sso_callback(
    provider_name: str,
    request: Request,
    token: str | None = None,
    sso: str | None = None,
    next: str | None = None,
):
    """WordPress SSO callback (fotw-sso / MarketSwarm-Canonical compatible).

    Accepts token via `token` or `sso` query param (MSC uses `sso`).
    Optional `next` = site-relative path after session mint (default `/home`).
    Provider path: wordpress:fattail | wordpress:0-dte

    WP My Account deep-link pattern (redirect value is the Labs callback, including
    next, then URL-encoded as fotw-sso's redirect= query):
      https://fattail.ai/fotw-sso?redirect=<urlencoded
        https://labs.fattail.ai/api/auth/sso/wordpress:fattail?next=/course>
    fotw-sso appends &sso=<JWT> (callback already has ?next=).
    """
    reg = providers.registry()
    if provider_name not in reg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    raw = (token or sso or "").strip()
    if not raw:
        raise HTTPException(status_code=400, detail="Missing SSO token")
    try:
        pid = reg[provider_name].verify(raw)
    except providers.ProviderError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    with db.transaction() as conn:
        with conn.cursor() as cur:
            identity_id = identity.resolve_by_link(cur, pid.provider, pid.external_id)
            if identity_id is None:
                identity_id = identity.get_or_create_identity(
                    cur, pid.email, pid.display_name
                )
                identity.ensure_link(cur, identity_id, pid.provider, pid.external_id)
            # H3: never promote from WP admin role alone — allowlist only
            from admin_allowlist import may_sso_grant_administrator

            if may_sso_grant_administrator(
                email=pid.email, wp_claims_admin=bool(pid.is_admin)
            ):
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' "
                    "WHERE identity_id = %s AND role_override IS NULL",
                    (identity_id,),
                )
            identity.sync_provider_memberships(
                cur, identity_id, pid.provider, pid.entitlement_keys
            )
            role = identity.derive_role(cur, identity_id)

    # H2: never log SSO JWT / raw query. Email domain only for ops diagnosis.
    import logging

    email = (pid.email or "").strip()
    email_log = email.split("@")[-1] if "@" in email else "(none)"
    logging.getLogger("labs.auth.sso").info(
        "sso ok provider=%s external_id=%s email_domain=%s identity_id=%s role=%s",
        pid.provider,
        pid.external_id,
        email_log,
        identity_id,
        role,
    )

    landing = safe_next_path(next)
    return _session_response(
        RedirectResponse(url=landing, status_code=302),
        identity_id, pid.provider, role, request=request,
    )


@router.get("/providers")
def list_providers():
    return {"sso": providers.login_urls()}


@router.get("/me")
def me(request: Request):
    cfg = get_config()
    token = request.cookies.get(cfg.session_cookie)
    if not token:
        raise HTTPException(status_code=401, detail="No session")
    try:
        claims = auth.verify_session(token)
    except auth.AuthError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    display_name, email, avatar_url = "", "", None
    session_idle_minutes = 30
    # access_role: live membership elevation (Observer trial ≡ navigator, DL-128)
    access_role = str(claims.get("role") or "observer")
    memberships: list[dict] = []
    if claims["identity_id"] != 0:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """SELECT email, display_name, avatar_url, session_idle_minutes
                       FROM identities WHERE identity_id = %s""",
                    (claims["identity_id"],),
                )
                row = cur.fetchone()
                if row:
                    email, display_name = row["email"], row["display_name"]
                    avatar_url = row.get("avatar_url")
                    try:
                        idle = int(row.get("session_idle_minutes") or 30)
                    except (TypeError, ValueError):
                        idle = 30
                    if 15 <= idle <= 60:
                        session_idle_minutes = idle
                access_role = identity.feature_role(
                    cur, int(claims["identity_id"]), str(claims.get("role") or "observer")
                )
                cur.execute(
                    """SELECT p.slug, p.name, p.grants_role, m.status, m.source
                       FROM memberships m
                       JOIN plans p ON p.id = m.plan_id
                       WHERE m.identity_id = %s
                         AND m.status IN ('active', 'grace')
                         AND (m.current_period_end IS NULL
                              OR m.current_period_end > NOW())
                       ORDER BY p.slug""",
                    (int(claims["identity_id"]),),
                )
                memberships = [
                    {
                        "slug": r["slug"],
                        "name": r["name"],
                        "grants_role": r["grants_role"],
                        "status": r["status"],
                        "source": r["source"],
                    }
                    for r in cur.fetchall()
                ]
    return {
        "identity_id": claims["identity_id"],
        "role": claims["role"],
        "access_role": access_role,
        "memberships": memberships,
        "provider": claims.get("sso_issuer", ""),
        "email": email,
        "display_name": display_name,
        "avatar_url": avatar_url,
        "session_idle_minutes": session_idle_minutes,
    }


@router.get("/logout")
@router.post("/logout")
def logout(request: Request):
    """Clear Labs session cookie(s). GET redirects to /login; ?json=1 or POST → JSON."""
    want_json = (
        request.method == "POST"
        or (request.query_params.get("json") or "").strip() in ("1", "true", "yes")
        or "application/json" in (request.headers.get("accept") or "")
    )
    if want_json:
        resp = JSONResponse({"ok": True, "signed_out": True})
        _clear_session_cookie(resp)
        return resp
    # Land on login so operators can switch test accounts without a stuck session.
    resp = RedirectResponse(url="/login", status_code=302)
    _clear_session_cookie(resp)
    return resp


# --- membership webhooks (spec §4.3) -----------------------------------------

integrations = APIRouter(prefix="/api/integrations", tags=["integrations"])


@integrations.post("/{provider_name:path}/membership")
async def membership_webhook(provider_name: str, request: Request):
    reg = providers.registry()
    if provider_name not in reg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    raw = await request.body()
    signature = request.headers.get("X-Labs-Signature", "")
    expected = hmac.new(
        reg[provider_name].secret.encode(), raw, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(signature, expected):
        raise HTTPException(status_code=401, detail="Bad signature")

    body = await request.json()
    for field in ("external_id", "email", "plan_key", "status"):
        if not body.get(field):
            raise HTTPException(status_code=422, detail=f"Missing field: {field}")

    with db.transaction() as conn:
        with conn.cursor() as cur:
            identity_id = identity.resolve_by_link(
                cur, provider_name, body["external_id"]
            )
            if identity_id is None:
                identity_id = identity.get_or_create_identity(cur, body["email"])
                identity.ensure_link(
                    cur, identity_id, provider_name, body["external_id"]
                )
            plan_id = identity.plan_id_for_provider_key(
                cur, provider_name, body["plan_key"]
            )
            if plan_id is None:
                raise HTTPException(
                    status_code=422,
                    detail=f"No plan mapping for {provider_name}:{body['plan_key']}",
                )
            try:
                identity.upsert_membership(
                    cur, identity_id, plan_id, body["status"],
                    provider_name, body.get("external_ref"),
                )
            except identity.IdentityError as exc:
                raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"ok": True}
