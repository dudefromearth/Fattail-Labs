"""FatTail Labs API — app factory.

Run (dev only):  .venv/bin/uvicorn main:app --port $LABS_PORT
Production: launchd on MiniTwo runs uvicorn against the built config. See docs/deploy.md.
"""

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

import db
from config import get_config
from git_sha import resolve_git_sha


def create_app() -> FastAPI:
    cfg = get_config()  # fail loud at boot if config is incomplete
    resolve_git_sha()  # fail loud at boot if checkout SHA cannot be resolved
    import wiki_store
    from csrf import CsrfOriginMiddleware

    wiki_store.wiki_root()  # fail loud: LABS_WIKI_ROOT must be a lab-wiki checkout (WIK-D4)
    app = FastAPI(title="FatTail Labs API", docs_url=None, redoc_url=None)
    # M6: Origin/Referer check for cookie-authenticated mutations
    app.add_middleware(CsrfOriginMiddleware)

    @app.get("/api/health")
    def health() -> dict:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1 AS ok")
                cur.fetchone()
        return {"status": "ok", "env": cfg.env, "git_sha": resolve_git_sha()}

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
    from routes.community_app import router as community_app_router
    from routes.community_admin import router as community_admin_router
    from routes.courses import categories_router, router as courses_router
    from routes.lessons import router as lessons_router
    from routes.live import router as live_router
    from routes.member import router as member_router
    from routes.privacy import router as privacy_router
    from routes.export import router as export_router
    from routes.trade_log import router as trade_log_router
    from routes.capital import router as capital_router
    from routes.retrospectives import router as retrospectives_router
    from routes.member_notifications import router as member_notifications_router
    from routes.journal_sessions import router as journal_sessions_router
    from routes.tags import router as tags_router
    from routes.tags_admin import router as tags_admin_router
    from routes.market_universe_admin import (
        admin_router as market_universe_admin_router,
        member_router as market_universe_member_router,
    )
    from routes.practice_spine import router as practice_spine_router
    from routes.journal_prompt_admin import router as journal_prompt_admin_router
    from routes.retro_prompt_admin import router as retro_prompt_admin_router
    from routes.habit_plans import router as habit_plans_router
    from routes.strategy_lab import router as strategy_lab_router
    from routes.strategy_lab_curate import router as strategy_lab_curate_router
    from routes.chain_ladder import router as chain_ladder_router
    from routes.market_stream import router as market_stream_router
    from routes.market_ohlc import router as market_ohlc_router
    from routes.market_session import router as market_session_router
    from routes.volume_profile import (
        admin_router as volume_profile_admin_router,
        member_router as volume_profile_member_router,
    )
    from routes.pricing import router as pricing_router
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
    from routes.flow_admin import router as flow_admin_router
    from routes.access_admin import router as access_admin_router
    from routes.integrations_tradier import router as tradier_integration_router
    from routes.landing import router as landing_router
    from routes.stats_admin import router as stats_admin_router

    app.include_router(auth_router)
    app.include_router(access_admin_router)
    app.include_router(apps_router)
    app.include_router(wiki_router)
    app.include_router(feature_gates_public_router)
    app.include_router(feature_gates_admin_router)
    app.include_router(pageview_router)
    app.include_router(users_admin_router)
    app.include_router(flow_admin_router)
    app.include_router(appearance_router)
    app.include_router(auth_dev_router)
    app.include_router(integrations_router)
    app.include_router(tradier_integration_router)
    app.include_router(landing_router)
    app.include_router(stats_admin_router)
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
    app.include_router(capital_router)
    app.include_router(retrospectives_router)
    app.include_router(member_notifications_router)
    app.include_router(journal_sessions_router)
    app.include_router(tags_router)
    app.include_router(tags_admin_router)
    app.include_router(market_universe_admin_router)
    app.include_router(market_universe_member_router)
    app.include_router(practice_spine_router)
    app.include_router(journal_prompt_admin_router)
    app.include_router(retro_prompt_admin_router)
    app.include_router(habit_plans_router)
    app.include_router(strategy_lab_router)
    app.include_router(strategy_lab_curate_router)
    app.include_router(chain_ladder_router)
    app.include_router(market_stream_router)
    app.include_router(market_ohlc_router)
    app.include_router(market_session_router)
    app.include_router(volume_profile_member_router)
    app.include_router(volume_profile_admin_router)
    app.include_router(pricing_router)
    app.include_router(hard_router)
    app.include_router(community_router)
    app.include_router(community_app_router)
    app.include_router(community_admin_router)
    app.include_router(quizzes_router)
    app.include_router(resources_router)
    app.include_router(resources_admin_router)
    app.include_router(live_router)
    app.include_router(pathway_router)
    app.include_router(billing_router)
    app.include_router(hub_public_router)
    app.include_router(hub_admin_router)

    # Help desk is a self-contained bolt-on: register it in isolation so any
    # import/registration failure logs and is skipped — it can NEVER prevent the
    # rest of Labs from booting. (Help just won't be available.)
    try:
        from routes.help import router as help_router
        from routes.help_admin import router as help_admin_router

        app.include_router(help_router)
        app.include_router(help_admin_router)
    except Exception:  # noqa: BLE001 — help must never block app boot
        import logging

        logging.getLogger("labs.help").exception(
            "help system failed to register; continuing without it"
        )

    uploads = Path(__file__).resolve().parent / "uploads"
    uploads.mkdir(exist_ok=True)
    app.mount("/api/media", StaticFiles(directory=uploads), name="media")

    return app


app = create_app()
