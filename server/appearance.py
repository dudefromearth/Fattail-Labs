"""Site appearance document — Human Interface Spec v1.0 §10.

Typed, allowlisted config. Unknown keys rejected. Public reads published only.
"""

from __future__ import annotations

import json
from typing import Any

from fastapi import HTTPException

import db

SCHEMA_VERSION = 1

ALLOWED_TINTS = frozenset({"emerald", "blue", "indigo", "orange"})
ALLOWED_SCHEMES = frozenset({"system", "light", "dark"})
ALLOWED_DENSITY = frozenset({"comfortable", "compact"})
ALLOWED_CORNERS = frozenset({"rounded", "smooth"})
ALLOWED_FONT = frozenset({"system"})  # v1.0 system only
ALLOWED_MEMBER_HREFS = frozenset({
    "/",
    "/course",  # public catalog (canonical)
    "/courses",  # legacy path still allowlisted for old chrome links
    "/labs",  # member practice tools hub (Trade Log, Journal, Playbook, …)
    "/app",
    "/live",
    "/resources",
    "/pathway",  # funnel surface — not primary chrome; keep for deep links
    "/dashboard",  # redirects to Journey; keep allowlisted for old chrome
    "/home",  # member login-landing
    "/me",  # Profile
    "/app/journey",
    "/membership",
    "/guide",
    "/about",
    "/login",
    "/signup",
})
ALLOWED_COURSE_TABS = frozenset({
    "About",
    "Modules",
    "Resources",
    "Discussion",
    "Students",
})
ALLOWED_HUB_REGIONS = frozenset({
    "hero_intro",
    "flagship_course",
    "value_props",
    "faq",
    "custom_banner",
})
ALLOWED_ADMIN_NAV = frozenset({
    "board",
    "media",
    "cast",
    "ai",
    "agents",
    "appearance",
})
ALLOWED_ADMIN_HOME = frozenset({
    "/admin",
    "/admin/board",
    "/admin/media",
    "/admin/cast",
    "/admin/ai",
    "/admin/agents",
    "/admin/appearance",
})
VISIBILITY = frozenset({"always", "member", "logged_out"})
HEADER_CTA_MODES = frozenset({"hidden", "membership", "custom_allowlisted"})


def default_document() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "brand": {
            "display_name": "FatTail Labs",
            "logo_light": None,
            "logo_dark": None,
            "tint": "emerald",
        },
        "appearance": {
            "color_scheme": "system",
            "density": "comfortable",
            "corner_style": "rounded",
            "font": "system",
        },
        "member_chrome": {
            "nav": [
                {
                    "id": "courses",
                    "label": "Courses",
                    "href": "/courses",
                    "visibility": "always",
                },
                {
                    "id": "labs",
                    "label": "Labs",
                    "href": "/labs",
                    "visibility": "always",
                },
                {
                    "id": "resources",
                    "label": "Resources",
                    "href": "/resources",
                    "visibility": "always",
                },
                {
                    "id": "live",
                    "label": "Live",
                    "href": "/live",
                    "visibility": "always",
                },
            ],
            "header_cta": {"mode": "membership", "label": "Join"},
        },
        "hub": {
            "regions": [
                {
                    "id": "hero_intro",
                    "enabled": True,
                    "title": "",
                    "subtitle_md": "",
                },
                {
                    "id": "flagship_course",
                    "enabled": True,
                    "course_slug": "",
                },
                {"id": "value_props", "enabled": True},
                {"id": "faq", "enabled": True},
                {"id": "custom_banner", "enabled": False, "message": "", "href": ""},
            ]
        },
        "course_chrome": {
            "tabs": ["About", "Modules", "Resources", "Discussion", "Students"],
            "default_tab": "About",
            "lesson_nav": "expanded",
        },
        "announcement": {
            "enabled": False,
            "severity": "info",
            "message": "",
            "href": "",
            "dismissible": True,
        },
        "operator": {
            "admin_nav_order": [
                "board",
                "media",
                "cast",
                "ai",
                "agents",
                "appearance",
            ],
            "admin_home": "/admin/board",
            "density": "comfortable",
        },
    }


def _require(cond: bool, msg: str) -> None:
    if not cond:
        raise HTTPException(status_code=422, detail=msg)


def validate_document(doc: Any) -> dict[str, Any]:
    _require(isinstance(doc, dict), "appearance must be an object")
    # Reject unknown top-level keys
    allowed_top = {
        "schema_version",
        "brand",
        "appearance",
        "member_chrome",
        "hub",
        "course_chrome",
        "announcement",
        "operator",
    }
    unknown = set(doc.keys()) - allowed_top
    _require(not unknown, f"unknown keys: {sorted(unknown)}")

    out = default_document()
    sv = doc.get("schema_version", SCHEMA_VERSION)
    _require(sv == SCHEMA_VERSION, f"schema_version must be {SCHEMA_VERSION}")
    out["schema_version"] = SCHEMA_VERSION

    brand = doc.get("brand") or {}
    _require(isinstance(brand, dict), "brand must be object")
    if "display_name" in brand:
        name = str(brand["display_name"]).strip()
        _require(1 <= len(name) <= 64, "brand.display_name length 1–64")
        out["brand"]["display_name"] = name
    if "tint" in brand:
        _require(brand["tint"] in ALLOWED_TINTS, f"brand.tint must be one of {sorted(ALLOWED_TINTS)}")
        out["brand"]["tint"] = brand["tint"]
    for k in ("logo_light", "logo_dark"):
        if k in brand:
            v = brand[k]
            _require(v is None or isinstance(v, str), f"brand.{k} must be string or null")
            out["brand"][k] = v

    app = doc.get("appearance") or {}
    _require(isinstance(app, dict), "appearance must be object")
    if "color_scheme" in app:
        _require(app["color_scheme"] in ALLOWED_SCHEMES, "invalid color_scheme")
        out["appearance"]["color_scheme"] = app["color_scheme"]
    if "density" in app:
        _require(app["density"] in ALLOWED_DENSITY, "invalid density")
        out["appearance"]["density"] = app["density"]
    if "corner_style" in app:
        _require(app["corner_style"] in ALLOWED_CORNERS, "invalid corner_style")
        out["appearance"]["corner_style"] = app["corner_style"]
    if "font" in app:
        _require(app["font"] in ALLOWED_FONT, "font must be system in v1.0")
        out["appearance"]["font"] = app["font"]

    chrome = doc.get("member_chrome") or {}
    _require(isinstance(chrome, dict), "member_chrome must be object")
    if "nav" in chrome:
        nav = chrome["nav"]
        _require(isinstance(nav, list) and len(nav) <= 12, "member_chrome.nav invalid")
        cleaned = []
        for i, item in enumerate(nav):
            _require(isinstance(item, dict), f"nav[{i}] must be object")
            href = str(item.get("href") or "")
            _require(href in ALLOWED_MEMBER_HREFS, f"nav[{i}].href not allowlisted")
            vis = item.get("visibility", "always")
            _require(vis in VISIBILITY, f"nav[{i}].visibility invalid")
            label = str(item.get("label") or "").strip()
            _require(1 <= len(label) <= 32, f"nav[{i}].label length")
            nid = str(item.get("id") or label.lower())[:32]
            cleaned.append(
                {"id": nid, "label": label, "href": href, "visibility": vis}
            )
        out["member_chrome"]["nav"] = cleaned
    if "header_cta" in chrome:
        cta = chrome["header_cta"]
        _require(isinstance(cta, dict), "header_cta must be object")
        mode = cta.get("mode", "membership")
        _require(mode in HEADER_CTA_MODES, "header_cta.mode invalid")
        label = cta.get("label")
        if label is not None:
            label = str(label).strip()[:32]
        out["member_chrome"]["header_cta"] = {"mode": mode, "label": label or "Join"}

    hub = doc.get("hub") or {}
    if hub:
        _require(isinstance(hub, dict), "hub must be object")
        if "regions" in hub:
            regions = hub["regions"]
            _require(isinstance(regions, list), "hub.regions must be list")
            cleaned_r = []
            seen = set()
            for i, reg in enumerate(regions):
                _require(isinstance(reg, dict), f"hub.regions[{i}] object")
                rid = reg.get("id")
                _require(rid in ALLOWED_HUB_REGIONS, f"unknown hub region {rid!r}")
                _require(rid not in seen, f"duplicate hub region {rid}")
                seen.add(rid)
                row = {"id": rid, "enabled": bool(reg.get("enabled", True))}
                for k in ("title", "subtitle_md", "course_slug", "message", "href"):
                    if k in reg and reg[k] is not None:
                        row[k] = str(reg[k])[:2000]
                cleaned_r.append(row)
            out["hub"]["regions"] = cleaned_r

    course = doc.get("course_chrome") or {}
    if course:
        _require(isinstance(course, dict), "course_chrome must be object")
        if "tabs" in course:
            tabs = course["tabs"]
            _require(isinstance(tabs, list) and tabs, "course_chrome.tabs required")
            for t in tabs:
                _require(t in ALLOWED_COURSE_TABS, f"invalid tab {t!r}")
            out["course_chrome"]["tabs"] = list(tabs)
        if "default_tab" in course:
            dt = course["default_tab"]
            _require(dt in out["course_chrome"]["tabs"], "default_tab not in tabs")
            out["course_chrome"]["default_tab"] = dt
        if "lesson_nav" in course:
            _require(
                course["lesson_nav"] in ("expanded", "collapsed_default", "hidden_on_small"),
                "invalid lesson_nav",
            )
            out["course_chrome"]["lesson_nav"] = course["lesson_nav"]

    ann = doc.get("announcement") or {}
    if ann:
        _require(isinstance(ann, dict), "announcement must be object")
        out["announcement"]["enabled"] = bool(ann.get("enabled", False))
        if "severity" in ann:
            _require(
                ann["severity"] in ("info", "warning", "success"),
                "invalid announcement.severity",
            )
            out["announcement"]["severity"] = ann["severity"]
        if "message" in ann:
            out["announcement"]["message"] = str(ann["message"])[:500]
        if "href" in ann and ann["href"]:
            href = str(ann["href"])
            _require(
                href.startswith("/") and not href.startswith("//"),
                "announcement.href must be site-relative allowlisted path",
            )
            # path only — first segment check
            path = href.split("?", 1)[0]
            _require(
                path in ALLOWED_MEMBER_HREFS or path.startswith("/courses"),
                "announcement.href not allowlisted",
            )
            out["announcement"]["href"] = href
        if "dismissible" in ann:
            out["announcement"]["dismissible"] = bool(ann["dismissible"])

    op = doc.get("operator") or {}
    if op:
        _require(isinstance(op, dict), "operator must be object")
        if "admin_nav_order" in op:
            order = op["admin_nav_order"]
            _require(isinstance(order, list), "admin_nav_order list")
            for x in order:
                _require(x in ALLOWED_ADMIN_NAV, f"unknown admin nav {x!r}")
            out["operator"]["admin_nav_order"] = list(order)
        if "admin_home" in op:
            _require(op["admin_home"] in ALLOWED_ADMIN_HOME, "admin_home not allowlisted")
            out["operator"]["admin_home"] = op["admin_home"]
        if "density" in op:
            _require(op["density"] in ALLOWED_DENSITY, "invalid operator.density")
            out["operator"]["density"] = op["density"]

    return out


def _ensure_row(cur) -> None:
    cur.execute("SELECT id FROM site_appearance WHERE id = 1")
    if cur.fetchone():
        return
    doc = json.dumps(default_document())
    cur.execute(
        """INSERT INTO site_appearance
           (id, schema_version, draft_json, published_json, published_at)
           VALUES (1, %s, %s, %s, UTC_TIMESTAMP(6))""",
        (SCHEMA_VERSION, doc, doc),
    )


def get_published() -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_row(cur)
            cur.execute(
                "SELECT published_json, schema_version FROM site_appearance WHERE id = 1"
            )
            row = cur.fetchone()
    raw = row["published_json"]
    if isinstance(raw, str):
        raw = json.loads(raw)
    try:
        return validate_document(raw)
    except HTTPException:
        return default_document()


def get_admin_bundle() -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_row(cur)
            cur.execute(
                """SELECT schema_version, draft_json, published_json,
                          draft_updated_at, published_at, published_by, publish_note
                   FROM site_appearance WHERE id = 1"""
            )
            row = cur.fetchone()

    def parse(j):
        if isinstance(j, str):
            j = json.loads(j)
        return validate_document(j)

    return {
        "schema_version": row["schema_version"],
        "draft": parse(row["draft_json"]),
        "published": parse(row["published_json"]),
        "draft_updated_at": row["draft_updated_at"].isoformat()
        if row["draft_updated_at"]
        else None,
        "published_at": row["published_at"].isoformat() if row["published_at"] else None,
        "published_by": row["published_by"],
        "publish_note": row["publish_note"],
        "allowlists": {
            "tints": sorted(ALLOWED_TINTS),
            "member_hrefs": sorted(ALLOWED_MEMBER_HREFS),
            "course_tabs": sorted(ALLOWED_COURSE_TABS),
            "hub_regions": sorted(ALLOWED_HUB_REGIONS),
            "admin_nav": sorted(ALLOWED_ADMIN_NAV),
        },
    }


def save_draft(doc: dict, identity_id: int | None = None) -> dict[str, Any]:
    clean = validate_document(doc)
    payload = json.dumps(clean)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_row(cur)
            cur.execute(
                """UPDATE site_appearance
                   SET draft_json = %s, schema_version = %s,
                       draft_updated_at = UTC_TIMESTAMP(6)
                   WHERE id = 1""",
                (payload, SCHEMA_VERSION),
            )
    return clean


def publish(identity_id: int, note: str | None = None) -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_row(cur)
            cur.execute("SELECT draft_json FROM site_appearance WHERE id = 1")
            row = cur.fetchone()
            draft = row["draft_json"]
            if isinstance(draft, str):
                draft = json.loads(draft)
            clean = validate_document(draft)
            cur.execute(
                """UPDATE site_appearance
                   SET published_json = %s,
                       published_at = UTC_TIMESTAMP(6),
                       published_by = %s,
                       publish_note = %s,
                       draft_json = %s
                   WHERE id = 1""",
                (
                    json.dumps(clean),
                    identity_id,
                    (note or "")[:512] or None,
                    json.dumps(clean),
                ),
            )
    return clean


def discard_draft() -> dict[str, Any]:
    with db.transaction() as conn:
        with conn.cursor() as cur:
            _ensure_row(cur)
            cur.execute("SELECT published_json FROM site_appearance WHERE id = 1")
            row = cur.fetchone()
            pub = row["published_json"]
            if isinstance(pub, str):
                pub = json.loads(pub)
            clean = validate_document(pub)
            cur.execute(
                """UPDATE site_appearance
                   SET draft_json = %s, draft_updated_at = UTC_TIMESTAMP(6)
                   WHERE id = 1""",
                (json.dumps(clean),),
            )
    return clean


def schema_public() -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "allowlists": {
            "tints": sorted(ALLOWED_TINTS),
            "member_hrefs": sorted(ALLOWED_MEMBER_HREFS),
            "course_tabs": sorted(ALLOWED_COURSE_TABS),
            "hub_regions": sorted(ALLOWED_HUB_REGIONS),
            "admin_nav": sorted(ALLOWED_ADMIN_NAV),
            "color_schemes": sorted(ALLOWED_SCHEMES),
            "densities": sorted(ALLOWED_DENSITY),
        },
        "defaults": default_document(),
    }
