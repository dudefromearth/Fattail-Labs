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
    resp = RedirectResponse(url="/courses", status_code=302)
    resp.set_cookie(
        key=cfg.session_cookie,
        value=token,
        max_age=cfg.session_ttl_seconds,
        httponly=True,
        samesite="lax",
        **({"domain": cfg.cookie_domain} if cfg.cookie_domain else {}),
    )
    return resp


# logout lives in routes/auth_routes.py
