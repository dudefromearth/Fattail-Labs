"""Mount point. routes.front_door.include_front_door(app) from the app factory.

Invalid offers abort boot. A missing handoff secret does not abort the rest
of Labs; the handoff route returns 503 until FRONT_DOOR_HANDOFF_SECRET is set.
"""

from __future__ import annotations

from front_door.api import FrontDoorApp, build_router, handoff_secret, resolve_allow_facts
from front_door.offers import load_offers
from front_door.store import MysqlStore


def include_front_door(app) -> None:
    offers = load_offers()
    door = FrontDoorApp(
        offers=offers,
        store=MysqlStore(),
        secret=handoff_secret(),
        allow_facts=resolve_allow_facts(),
    )
    app.state.front_door = door
    app.include_router(build_router(door))
