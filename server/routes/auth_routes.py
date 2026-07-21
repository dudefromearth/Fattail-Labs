"""Authentication routes: native login, SSO callback, providers list, me, logout.
Spec: FatTail-Labs-Identity-Access-Spec-v1.0 §4."""

import hashlib
import hmac

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

import auth
import db
import identity
import providers
from config import get_config

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _session_response(resp, identity_id: int, provider: str, role: str):
    cfg = get_config()
    token = auth.issue_session(identity_id=identity_id, issuer=provider, role=role)
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=cfg.session_ttl_seconds,
        httponly=True,
        samesite="lax",
        **({"domain": cfg.cookie_domain} if cfg.cookie_domain else {}),
    )
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
        row["identity_id"], "native", role,
    )


@router.get("/sso/{provider_name:path}")
def sso_callback(provider_name: str, token: str):
    reg = providers.registry()
    if provider_name not in reg:
        raise HTTPException(status_code=404, detail="Unknown provider")
    try:
        pid = reg[provider_name].verify(token)
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
            if pid.is_admin:
                cur.execute(
                    "UPDATE identities SET role_override = 'administrator' "
                    "WHERE identity_id = %s AND role_override IS NULL",
                    (identity_id,),
                )
            identity.sync_provider_memberships(
                cur, identity_id, pid.provider, pid.entitlement_keys
            )
            role = identity.derive_role(cur, identity_id)

    return _session_response(
        RedirectResponse(url="/courses", status_code=302),
        identity_id, pid.provider, role,
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

    display_name, email = "", ""
    if claims["identity_id"] != 0:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT email, display_name FROM identities WHERE identity_id = %s",
                    (claims["identity_id"],),
                )
                row = cur.fetchone()
                if row:
                    email, display_name = row["email"], row["display_name"]
    return {
        "identity_id": claims["identity_id"],
        "role": claims["role"],
        "provider": claims.get("sso_issuer", ""),
        "email": email,
        "display_name": display_name,
    }


@router.get("/logout")
def logout():
    cfg = get_config()
    resp = RedirectResponse(url="/courses", status_code=302)
    resp.delete_cookie(cfg.session_cookie)
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
