"""FatTail Labs API — app factory.

Run (dev only):  .venv/bin/uvicorn main:app --port $LABS_PORT
Production: launchd on MiniTwo runs uvicorn against the built config. See docs/deploy.md.
"""

from fastapi import FastAPI

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

    from routes.admin import router as admin_router
    from routes.auth_dev import router as auth_dev_router
    from routes.auth_routes import integrations as integrations_router
    from routes.auth_routes import router as auth_router
    from routes.courses import router as courses_router
    from routes.lessons import router as lessons_router

    app.include_router(auth_router)
    app.include_router(auth_dev_router)
    app.include_router(integrations_router)
    app.include_router(admin_router)
    app.include_router(courses_router)
    app.include_router(lessons_router)

    # Routers still to land:
    #   routes/member.py    — enroll, progress, dashboard (P1c continues)

    return app


app = create_app()
