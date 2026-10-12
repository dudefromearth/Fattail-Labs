"""HTTP surface for the front door. Mounted by routes.front_door."""

from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, FastAPI, Request
from fastapi.responses import JSONResponse

from front_door.analytics import dropoff_summary, normalize_event
from front_door.analytics import AnalyticsError
from front_door.evidence import EvidenceError, assemble, normalize_moment
from front_door.handoff import HandoffError, build_handoff
from front_door.member_state import (
    MemberStateError,
    classify,
    payment_attention,
    sign_in_view,
    unchecked_view,
    view_for,
)
from front_door.offers import OfferConfigError, load_offers, public_offers
from front_door.routing import entry_for_referrer
from front_door.store import StoreError
from front_door.traffic import admission
from front_door.woo_lookup import LiveWooLookup, WooUnavailable

_USAGE_UNAVAILABLE = {
    "ok": False,
    "reason": "Weekly usage sources were not read for this package. The panel is stale.",
}


def resolve_allow_facts(env: dict | None = None) -> bool:
    source = env if env is not None else os.environ
    flag = source.get("FRONT_DOOR_ALLOW_FACTS", "").strip()
    if not flag:
        return False
    if flag != "1":
        raise OfferConfigError("FRONT_DOOR_ALLOW_FACTS must be 1 or unset")
    if source.get("LABS_ENV", "").strip() != "dev":
        raise OfferConfigError("FRONT_DOOR_ALLOW_FACTS is only valid when LABS_ENV=dev")
    return True


def handoff_secret(env: dict | None = None) -> str:
    source = env if env is not None else os.environ
    return source.get("FRONT_DOOR_HANDOFF_SECRET", "").strip()


class FrontDoorApp:
    def __init__(
        self,
        *,
        offers: dict,
        store: Any,
        secret: str,
        allow_facts: bool,
        woo: Any | None = None,
    ) -> None:
        self.offers = offers
        self.store = store
        self.secret = secret
        self.allow_facts = allow_facts
        self.woo = woo if woo is not None else LiveWooLookup()

    def reload(self, path=None, env=None) -> None:
        self.offers = load_offers(path, env)

    def resolve_view(self, body: dict) -> dict:
        if not isinstance(body, dict):
            raise MemberStateError("body must be an object")
        if "state" in body:
            raise MemberStateError("client state is not accepted")
        facts = body.get("facts")
        if facts is not None:
            if not self.allow_facts:
                raise MemberStateError("facts are not accepted")
            if not isinstance(facts, dict):
                raise MemberStateError("facts must be an object")
            state = classify(facts)
            return view_for(state, self.offers, attention=payment_attention(facts))
        email = body.get("email")
        if email is not None and not isinstance(email, str):
            raise MemberStateError("email must be a string")
        email = (email or "").strip().lower()
        if not email or "@" not in email:
            return unchecked_view()
        try:
            facts = self.woo.lookup(email, self.offers)
        except WooUnavailable as exc:
            return sign_in_view(
                "We couldn't confirm membership for that email. Sign in to check "
                "before a buy button is shown. "
                f"({exc})"
            )
        state = classify(facts)
        return view_for(state, self.offers, attention=payment_attention(facts))


def build_router(door: FrontDoorApp) -> APIRouter:
    router = APIRouter(prefix="/api/front-door", tags=["front-door"])

    @router.get("/offers")
    def offers() -> dict:
        return public_offers(door.offers)

    @router.get("/health")
    def health() -> dict:
        secret = door.secret
        return {
            "offers": "ok",
            "handoff_secret": "configured" if len(secret) >= 16 else "missing",
            "traffic_percent": door.offers["traffic_percent"],
            "kill_switch": door.offers["kill_switch"],
            "feature_flag": door.offers["feature_flag"],
        }

    @router.post("/member-state")
    def member_state(body: dict) -> JSONResponse:
        try:
            return JSONResponse(door.resolve_view(body or {}))
        except MemberStateError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=422)

    @router.post("/route")
    def route_entry(body: dict) -> dict:
        referrer = None if not isinstance(body, dict) else body.get("referrer")
        if referrer is not None and not isinstance(referrer, str):
            return JSONResponse({"detail": "referrer must be a string or null"}, status_code=422)  # type: ignore[return-value]
        entry = entry_for_referrer(referrer)
        return {"entry": entry, "href": f"/front-door/{entry}" if entry != "order" else "/front-door/order"}

    @router.post("/admission")
    def admit(body: dict) -> JSONResponse:
        key = body.get("visitor_key") if isinstance(body, dict) else None
        if key is not None and not isinstance(key, str):
            return JSONResponse({"detail": "visitor_key must be a string"}, status_code=422)
        return JSONResponse(admission(door.offers, key))

    @router.post("/handoff")
    def handoff(body: dict, request: Request) -> JSONResponse:
        try:
            if not isinstance(body, dict):
                raise HandoffError("body must be an object")
            if "state" in body or "price_cents" in body or "woo_product_id" in body:
                raise HandoffError("price and membership state are not accepted from the client")
            view = door.resolve_view(body)
            if not view["can_buy"]:
                raise HandoffError(view["headline"])
            built = build_handoff(
                offers=door.offers,
                product_id=str(body.get("product_id") or ""),
                state=view["state"],
                secret=door.secret,
            )
        except (HandoffError, MemberStateError) as exc:
            code = 503 if "FRONT_DOOR_HANDOFF_SECRET" in str(exc) else 422
            return JSONResponse({"detail": str(exc)}, status_code=code)
        return JSONResponse(
            {
                "url": built["url"],
                "product_id": built["product_id"],
                "issued_at": built["issued_at"],
                "signature": built["signature"],
                "state": built["state"],
            }
        )

    @router.post("/evidence")
    def evidence(body: dict, request: Request) -> JSONResponse:
        try:
            if not isinstance(body, dict):
                raise EvidenceError("body must be an object")
            host = request.client.host if request.client else None
            row = normalize_moment(
                moment=str(body.get("moment") or ""),
                order_key=str(body.get("order_key") or ""),
                payload=body.get("payload") or {},
                client_host=host,
                terms_version=door.offers["terms_version"],
                privacy_version=door.offers["privacy_notice_version"],
            )
            door.store.add_evidence(row)
        except EvidenceError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=422)
        except StoreError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=503)
        return JSONResponse({"stored": True, "retain_until": row["retain_until"]})

    @router.get("/evidence/{order_key}")
    def evidence_package(order_key: str) -> JSONResponse:
        try:
            events = door.store.evidence_for(order_key)
            package = assemble(order_key, events, _USAGE_UNAVAILABLE)
        except EvidenceError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=422)
        except StoreError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=503)
        return JSONResponse(package)

    @router.post("/analytics")
    def analytics(body: dict) -> JSONResponse:
        try:
            row = normalize_event(body)
            door.store.add_analytics(row)
        except AnalyticsError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=422)
        except StoreError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=503)
        return JSONResponse({"stored": True})

    @router.get("/analytics/summary")
    def analytics_summary() -> JSONResponse:
        try:
            rows = door.store.analytics_rows()
        except StoreError as exc:
            return JSONResponse({"detail": str(exc)}, status_code=503)
        return JSONResponse(dropoff_summary(rows))

    return router


def create_app(
    *,
    offers: dict | None = None,
    store: Any | None = None,
    secret: str = "test-secret-not-for-prod",
    allow_facts: bool = False,
    woo: Any | None = None,
    offers_path=None,
    env=None,
) -> FastAPI:
    from front_door.store import MemoryStore

    loaded = offers if offers is not None else load_offers(offers_path, env)
    door = FrontDoorApp(
        offers=loaded,
        store=store if store is not None else MemoryStore(),
        secret=secret,
        allow_facts=allow_facts,
        woo=woo,
    )
    app = FastAPI()
    app.state.front_door = door
    app.include_router(build_router(door))
    return app
