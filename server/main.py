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
    import wiki_store

    wiki_store.wiki_root()  # fail loud: LABS_WIKI_ROOT must be a lab-wiki checkout (WIK-D4)
    app = FastAPI(title="FatTail Labs API", docs_url=None, redoc_url=None)

    @app.get("/api/health")
    def health() -> dict:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                cur.fetchone()
        return {"status": "ok", "env": cfg.env}

    from routes.admin import router as admin_router
    from routes.canonical_courses import router as canonical_courses_router
    from routes.ai_admin import router as ai_admin_router
    from routes.agents_admin import router as agents_admin_router
    from routes.board_admin import router as board_admin_router
    from routes.cast_admin import router as cast_admin_router
    from routes.notifications_admin import router as notifications_admin_router
    from routes.auth_dev import router as auth_dev_router
    from routes.auth_routes import integrations as integrations_router
    from routes.auth_routes import router as auth_router
    from routes.billing import router as billing_router
    from routes.community import router as community_router
    from routes.courses import categories_router, router as courses_router
    from routes.lessons import router as lessons_router
    from routes.live import router as live_router
    from routes.member import router as member_router
    from routes.privacy import router as privacy_router
    from routes.export import router as export_router
    from routes.trade_log import router as trade_log_router
    from routes.retrospectives import router as retrospectives_router
    from routes.member_notifications import router as member_notifications_router
    from routes.journal_sessions import router as journal_sessions_router
    from routes.tags import router as tags_router
    from routes.tags_admin import router as tags_admin_router
    from routes.journal_prompt_admin import router as journal_prompt_admin_router
    from routes.retro_prompt_admin import router as retro_prompt_admin_router
    from routes.habit_plans import router as habit_plans_router
    from routes.hard import router as hard_router
    from routes.pathway import router as pathway_router
    from routes.quizzes import router as quizzes_router
    from routes.resources import router as resources_router
    from routes.resources_admin import router as resources_admin_router
    from routes.hub import admin as hub_admin_router
    from routes.hub import public as hub_public_router
    from routes.appearance import router as appearance_router
    from routes.apps import router as apps_router
    from routes.wiki import router as wiki_router
    from routes.feature_gates import admin as feature_gates_admin_router
    from routes.feature_gates import public as feature_gates_public_router
    from routes.pageview import router as pageview_router
    from routes.users_admin import router as users_admin_router

    app.include_router(auth_router)
    app.include_router(apps_router)
    app.include_router(wiki_router)
    app.include_router(feature_gates_public_router)
    app.include_router(feature_gates_admin_router)
    app.include_router(pageview_router)
    app.include_router(users_admin_router)
    app.include_router(appearance_router)
    app.include_router(auth_dev_router)
    app.include_router(integrations_router)
    app.include_router(admin_router)
    app.include_router(canonical_courses_router)
    app.include_router(ai_admin_router)
    app.include_router(agents_admin_router)
    app.include_router(board_admin_router)
    app.include_router(cast_admin_router)
    app.include_router(notifications_admin_router)
    app.include_router(courses_router)
    app.include_router(categories_router)
    app.include_router(lessons_router)
    app.include_router(member_router)
    app.include_router(privacy_router)
    app.include_router(export_router)
    app.include_router(trade_log_router)
    app.include_router(retrospectives_router)
    app.include_router(member_notifications_router)
    app.include_router(journal_sessions_router)
    app.include_router(tags_router)
    app.include_router(tags_admin_router)
    app.include_router(journal_prompt_admin_router)
    app.include_router(retro_prompt_admin_router)
    app.include_router(habit_plans_router)
    app.include_router(hard_router)
    app.include_router(community_router)
    app.include_router(quizzes_router)
    app.include_router(resources_router)
    app.include_router(resources_admin_router)
    app.include_router(live_router)
    app.include_router(pathway_router)
    app.include_router(billing_router)
    app.include_router(hub_public_router)
    app.include_router(hub_admin_router)

    uploads = Path(__file__).resolve().parent / "uploads"
    uploads.mkdir(exist_ok=True)
    app.mount("/api/media", StaticFiles(directory=uploads), name="media")

    return app


app = create_app()
