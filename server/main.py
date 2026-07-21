"""FatTail Labs API — app factory.

Run (dev only):  .venv/bin/uvicorn main:app --port $LABS_PORT
Production: launchd on MiniTwo runs uvicorn against the built config. See docs/deploy.md.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

import auth
import db
from config import get_config


def create_app() -> FastAPI:
    cfg = get_config()  # fail loud at boot if config is incomplete
    app = FastAPI(title="FatTail Labs API", docs_url=None, redoc_url=None)

    @app.get("/api/health")
    def health() -> dict:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                cur.fetchone()
        return {"status": "ok", "env": cfg.env}

    @app.get("/api/auth/me")
    def me(request: Request) -> JSONResponse:
        token = request.cookies.get(cfg.session_cookie)
        if not token:
            raise HTTPException(status_code=401, detail="No session")
        try:
            claims = auth.verify_session(token)
        except auth.AuthError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc
        return JSONResponse(
            {
                "identity_id": claims["identity_id"],
                "role": claims["role"],
                "sso_issuer": claims["sso_issuer"],
            }
        )

    from routes.admin import router as admin_router
    from routes.auth_dev import router as auth_dev_router
    from routes.courses import router as courses_router
    from routes.lessons import router as lessons_router

    app.include_router(auth_dev_router)
    app.include_router(admin_router)
    app.include_router(courses_router)
    app.include_router(lessons_router)

    # Routers still to land:
    #   routes/sso.py       — SSO callback, session issue, logout
    #   routes/member.py    — enroll, progress, dashboard (P1c)
    #   routes/admin.py     — authoring CRUD (P1d)

    return app


app = create_app()
