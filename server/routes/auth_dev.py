"""Dev-only admin login. Exists ONLY when LABS_ENV=dev — staging/production
sessions come exclusively from WordPress SSO. Mirrors MSC's internal-identity
concept: identity_id 0, issuer 'internal'."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

import auth
from config import get_config

router = APIRouter(prefix="/api/auth", tags=["auth"])


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
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=cfg.session_ttl_seconds,
        **_session_cookie_kwargs(),
    )
    return resp


# logout lives in routes/auth_routes.py
