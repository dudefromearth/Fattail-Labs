"""Dev-only admin login. Exists ONLY when LABS_ENV=dev — staging/production
sessions come exclusively from WordPress SSO. Mirrors MSC's internal-identity
concept: identity_id 0, issuer 'internal'."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

import auth
import db
import identity as identity_mod
from config import get_config

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Stable probe member for browser e2e (Practice smoke) — Family B real identity.
_PRACTICE_E2E_EMAIL = "zztest-e2e-practice@labs.test"
_PRACTICE_E2E_NAME = "ZZ E2E Practice"


@router.get("/dev-login")
def dev_login() -> RedirectResponse:
    cfg = get_config()
    if cfg.env != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    token = auth.issue_session(identity_id=0, issuer="internal", role="administrator")
    # Member landing after login (login-landing mock).
    resp = RedirectResponse(url="/home", status_code=302)
    # Match auth_routes._session_cookie_kwargs (path/domain/secure)
    from routes.auth_routes import _clear_session_cookie, _session_cookie_kwargs

    _clear_session_cookie(resp)
    from datetime import datetime, timedelta, timezone

    ttl = int(cfg.session_ttl_seconds)
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=ttl,
        expires=datetime.now(timezone.utc) + timedelta(seconds=ttl),
        **_session_cookie_kwargs(),
    )
    return resp


@router.get("/dev-login-practice")
def dev_login_practice() -> RedirectResponse:
    """Dev-only: mint activator session for a real probe identity (Practice e2e).

    Admin ``dev-login`` uses identity_id=0 and cannot export Family B packs.
    This path is for browser smoke of trade-log / playbook / export only.
    """
    cfg = get_config()
    if cfg.env != "dev":
        raise HTTPException(status_code=404, detail="Not found")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            iid = identity_mod.get_or_create_identity(
                cur, _PRACTICE_E2E_EMAIL, _PRACTICE_E2E_NAME
            )
    token = auth.issue_session(
        identity_id=int(iid), issuer="internal", role="activator"
    )
    resp = RedirectResponse(url="/app/trade-log", status_code=302)
    from routes.auth_routes import _clear_session_cookie, _session_cookie_kwargs

    _clear_session_cookie(resp)
    from datetime import datetime, timedelta, timezone

    ttl = int(cfg.session_ttl_seconds)
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=ttl,
        expires=datetime.now(timezone.utc) + timedelta(seconds=ttl),
        **_session_cookie_kwargs(),
    )
    return resp


# logout lives in routes/auth_routes.py
