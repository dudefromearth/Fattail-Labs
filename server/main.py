"""FatTail Labs API — app factory.

Run (dev only):  .venv/bin/uvicorn main:app --port $LABS_PORT
Production: launchd on MiniTwo runs uvicorn against the built config. See docs/deploy.md.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

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
    from routes.billing import router as billing_router
    from routes.community import router as community_router
    from routes.courses import categories_router, router as courses_router
    from routes.lessons import router as lessons_router
    from routes.live import router as live_router
    from routes.member import router as member_router
    from routes.pathway import router as pathway_router
    from routes.quizzes import router as quizzes_router
    from routes.resources import router as resources_router

    app.include_router(auth_router)
    app.include_router(auth_dev_router)
    app.include_router(integrations_router)
    app.include_router(admin_router)
    app.include_router(courses_router)
    app.include_router(categories_router)
    app.include_router(lessons_router)
    app.include_router(member_router)
    app.include_router(community_router)
    app.include_router(quizzes_router)
    app.include_router(resources_router)
    app.include_router(live_router)
    app.include_router(pathway_router)
    app.include_router(billing_router)

    uploads = Path(__file__).resolve().parent / "uploads"
    uploads.mkdir(exist_ok=True)
    app.mount("/api/media", StaticFiles(directory=uploads), name="media")

    return app


app = create_app()
