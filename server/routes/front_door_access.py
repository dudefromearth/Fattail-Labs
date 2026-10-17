"""StudioTwo access door.

New customers get a Labs identity, a Labs session, and a Labs membership
without WordPress, WooCommerce, or WordPress SSO. Discord role changes go
through the Labs bot.

On StudioTwo every account this door creates is is_demo=1. It refuses to
change an identity that is not a test account. Existing Observers stay on
fattail.ai until they expire. Legacy Navigators are a later migration.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from urllib.parse import urlparse

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse

import db
import identity
from guards import claims_or_none
from labs_discord.rest import DiscordRest, DiscordRestError

router = APIRouter(prefix="/api/front-door/access", tags=["front-door-access"])

SOURCE = "front-door"
PRODUCTS = {
    "observer": {"plan": "observer-trial", "days": 42, "name": "Observer"},
    "navigator-monthly": {"plan": "navigator", "days": 31, "name": "Navigator Monthly"},
    "quarterly": {"plan": "navigator", "days": 92, "name": "Navigator Quarterly"},
    "navigator-annual": {"plan": "navigator", "days": 366, "name": "Navigator Annual"},
    "navigator-lifetime": {"plan": "navigator", "days": None, "name": "Navigator Lifetime"},
}


def _email(value: object) -> str:
    email = str(value or "").strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@") or " " in email:
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return email


def _demo_row(cur, identity_id: int) -> dict:
    cur.execute(
        "SELECT identity_id, email, display_name, is_demo FROM identities WHERE identity_id = %s",
        (identity_id,),
    )
    row = cur.fetchone()
    if row is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    return row


def _require_demo(request: Request) -> dict:
    claims = claims_or_none(request)
    if not claims or not claims.get("identity_id"):
        raise HTTPException(status_code=401, detail="Sign in required")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _demo_row(cur, int(claims["identity_id"]))
    if not row["is_demo"]:
        raise HTTPException(
            status_code=409,
            detail="This browser is signed in to a Labs account that is not a test account. Use a private window.",
        )
    return claims


def _refuse_live_session(request: Request) -> None:
    claims = claims_or_none(request)
    if not claims or not claims.get("identity_id"):
        return
    with db.transaction() as conn:
        with conn.cursor() as cur:
            row = _demo_row(cur, int(claims["identity_id"]))
    if not row["is_demo"]:
        raise HTTPException(
            status_code=409,
            detail="This browser is signed in to a Labs account that is not a test account. Use a private window.",
        )


def _discord_target() -> tuple[str, str, str]:
    token = (
        os.environ.get("LABS_DISCORD_BOT_TOKEN")
        or os.environ.get("LABS_DISCORD_0DTE_BOT_TOKEN")
        or ""
    ).strip()
    guild = (
        os.environ.get("LABS_DISCORD_0DTE_GUILD_ID")
        or os.environ.get("LABS_DISCORD_GUILD_ID")
        or ""
    ).strip()
    role = (os.environ.get("LABS_DISCORD_0DTE_ROLE_ID") or "").strip()
    if not role:
        paid = (os.environ.get("LABS_DISCORD_PAID_ROLE_IDS") or "").strip()
        role = paid.split(",")[0].strip() if paid else ""
    return token, guild, role


def _membership_role_name(memberships: list) -> str:
    """Observer trial enables Observer. A Navigator plan enables Navigator."""
    slugs = {
        item.get("plan") or item.get("slug")
        for item in memberships
        if item.get("status") in ("active", "grace")
    }
    if "navigator" in slugs:
        return "Navigator"
    if "observer-trial" in slugs:
        return "Observer"
    return ""


def _find_role_id(roles: list, name: str) -> str:
    wanted = name.casefold()
    for role in roles:
        if str(role.get("name") or "").casefold() == wanted:
            return str(role.get("id") or "")
    return ""


def _sync_discord_membership(
    discord_user_id: str,
    role_name: str,
    access_token: str | None = None,
) -> dict:
    """Turn the membership role on and the other membership role off.

    The OAuth access token is used once to join the guild and is not stored.
    """
    token, guild, _role = _discord_target()
    if not token or not guild:
        return {
            "ok": False,
            "configured": False,
            "detail": "Discord role change is not configured on this host.",
            "roles": [],
        }
    snow = str(discord_user_id or "").strip()
    if not snow.isdigit() or len(snow) < 17:
        return {
            "ok": False,
            "configured": True,
            "detail": "Discord did not confirm the account.",
            "roles": [],
        }
    rest = DiscordRest(token)
    try:
        roles = rest.list_guild_roles(guild)
        if access_token:
            try:
                rest.add_guild_member(guild, snow, access_token)
            except DiscordRestError:
                pass
        wanted_id = ""
        if role_name:
            wanted_id = _find_role_id(roles, role_name)
            if not wanted_id:
                created = rest.create_guild_role(guild, role_name, hoist=True)
                wanted_id = str(created.get("id") or "")
                roles.append(created)
            if wanted_id:
                rest.add_guild_member_role(guild, snow, wanted_id)
        for other in ("Observer", "Navigator"):
            if other.casefold() == role_name.casefold():
                continue
            other_id = _find_role_id(roles, other)
            if other_id:
                try:
                    rest.remove_guild_member_role(guild, snow, other_id)
                except DiscordRestError as exc:
                    if exc.status != 404:
                        raise
    except DiscordRestError as exc:
        if exc.status == 404:
            detail = "That Discord account is not in the server."
        else:
            detail = "Discord did not turn on the role."
        return {"ok": False, "configured": True, "detail": detail, "roles": []}
    enabled = [role_name] if role_name else []
    detail = f"{role_name} is on." if role_name else "Discord membership roles are off."
    return {"ok": True, "configured": True, "detail": detail, "roles": enabled}


def _enabled_membership_roles(discord_user_id: str) -> list[str]:
    token, guild, _role = _discord_target()
    snow = str(discord_user_id or "").strip()
    if not token or not guild or not snow.isdigit() or len(snow) < 17:
        return []
    rest = DiscordRest(token)
    try:
        member = rest.get_guild_member(guild, snow)
        if not member:
            return []
        have = {str(role_id) for role_id in member.get("roles") or []}
        names = []
        for role in rest.list_guild_roles(guild):
            if str(role.get("id") or "") in have and str(role.get("name") or "") in {"Observer", "Navigator"}:
                names.append(str(role["name"]))
        return names
    except DiscordRestError:
        return []


def _snapshot(cur, identity_id: int) -> dict:
    row = _demo_row(cur, identity_id)
    role = identity.derive_role(cur, identity_id)
    cur.execute(
        """SELECT p.slug, p.name, p.grants_role, m.status, m.source, m.external_ref,
                  m.current_period_end
           FROM memberships m
           JOIN plans p ON p.id = m.plan_id
           WHERE m.identity_id = %s
           ORDER BY m.updated_at DESC""",
        (identity_id,),
    )
    memberships = []
    for item in cur.fetchall():
        end = item["current_period_end"]
        memberships.append(
            {
                "plan": item["slug"],
                "name": item["name"],
                "grants_role": item["grants_role"],
                "status": item["status"],
                "source": item["source"],
                "product": item["external_ref"],
                "current_period_end": end.isoformat() if isinstance(end, datetime) else end,
            }
        )
    profile = identity.get_discord_profile(cur, identity_id)
    cur.execute("SELECT 1 AS ok FROM credentials WHERE identity_id = %s", (identity_id,))
    password_set = cur.fetchone() is not None
    token, guild, role_id = _discord_target()
    return {
        "signed_in": True,
        "email": row["email"],
        "display_name": row["display_name"] or "",
        "name": row["display_name"] or "",
        "password_set": password_set,
        "is_demo": bool(row["is_demo"]),
        "role": role,
        "memberships": memberships,
        "discord_user_id": (profile or {}).get("discord_user_id"),
        "discord_configured": bool(token and guild and role_id),
    }


def _session(payload: dict, status: int, identity_id: int, role: str, request: Request):
    from routes.auth_routes import _session_response

    return _session_response(
        JSONResponse(payload, status_code=status),
        identity_id,
        "native",
        role,
        request=request,
    )


@router.get("/catalog")
def catalog():
    return {
        "products": [
            {"id": key, "name": value["name"], "plan": value["plan"], "days": value["days"]}
            for key, value in PRODUCTS.items()
        ],
        "sso": False,
        "woocommerce": False,
    }


@router.get("/state")
def state(request: Request):
    claims = claims_or_none(request)
    if not claims or not claims.get("identity_id"):
        return {"signed_in": False}
    with db.transaction() as conn:
        with conn.cursor() as cur:
            return _snapshot(cur, int(claims["identity_id"]))


@router.post("/join")
async def join(request: Request):
    from rate_limit import rate_limit_register

    rate_limit_register(request)
    _refuse_live_session(request)
    body = await request.json()
    email = _email(body.get("email"))
    first = str(body.get("first_name") or "").strip()
    last = str(body.get("last_name") or "").strip()
    password = str(body.get("password") or "")
    if not first or not last:
        raise HTTPException(status_code=422, detail="First name and last name are required.")
    password_hash = None
    if password.strip():
        try:
            password_hash = identity.hash_password(password)
        except identity.IdentityError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
    name = f"{first} {last}"
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id, is_demo FROM identities WHERE email = %s", (email,))
            existing = cur.fetchone()
            if existing is not None:
                raise HTTPException(
                    status_code=409,
                    detail="An account already exists for this email.",
                )
            identity_id = identity.get_or_create_identity(cur, email, name)
            cur.execute(
                "UPDATE identities SET is_demo = 1, display_name = %s WHERE identity_id = %s",
                (name, identity_id),
            )
            if password_hash:
                cur.execute(
                    "INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)",
                    (identity_id, password_hash),
                )
            role = identity.derive_role(cur, identity_id)
            snap = _snapshot(cur, identity_id)
    return _session({**snap, "ok": True}, 201, identity_id, role, request)


@router.post("/login")
async def login(request: Request):
    from rate_limit import rate_limit_login

    body = await request.json()
    email = _email(body.get("email"))
    password = body.get("password") or ""
    rate_limit_login(request, email)
    _refuse_live_session(request)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """SELECT i.identity_id, i.is_demo, c.password_hash
                   FROM identities i
                   LEFT JOIN credentials c ON c.identity_id = i.identity_id
                   WHERE i.email = %s""",
                (email,),
            )
            row = cur.fetchone()
            if (
                row is None
                or not row["is_demo"]
                or not row["password_hash"]
                or not identity.verify_password(password, row["password_hash"])
            ):
                raise HTTPException(
                    status_code=401,
                    detail="That email and password do not match a test account.",
                )
            identity_id = int(row["identity_id"])
            role = identity.derive_role(cur, identity_id)
            snap = _snapshot(cur, identity_id)
    return _session({**snap, "ok": True}, 200, identity_id, role, request)


@router.post("/password")
async def set_password(request: Request):
    claims = _require_demo(request)
    body = await request.json()
    try:
        password_hash = identity.hash_password(body.get("password") or "")
    except identity.IdentityError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    identity_id = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT identity_id FROM credentials WHERE identity_id = %s", (identity_id,))
            if cur.fetchone():
                cur.execute(
                    "UPDATE credentials SET password_hash = %s WHERE identity_id = %s",
                    (password_hash, identity_id),
                )
            else:
                cur.execute(
                    "INSERT INTO credentials (identity_id, password_hash) VALUES (%s, %s)",
                    (identity_id, password_hash),
                )
            snap = _snapshot(cur, identity_id)
    return {**snap, "ok": True}


@router.post("/grant")
async def grant(request: Request):
    claims = _require_demo(request)
    body = await request.json()
    product_id = str(body.get("product_id") or "")
    product = PRODUCTS.get(product_id)
    if product is None:
        raise HTTPException(status_code=422, detail="Unknown product.")
    identity_id = int(claims["identity_id"])
    end_sql = "NULL" if product["days"] is None else "DATE_ADD(UTC_TIMESTAMP(), INTERVAL %s DAY)"
    params_end = () if product["days"] is None else (product["days"],)
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM plans WHERE slug = %s", (product["plan"],))
            plan = cur.fetchone()
            if plan is None:
                raise HTTPException(
                    status_code=503,
                    detail=f"The {product['plan']} plan is not in this database.",
                )
            plan_id = int(plan["id"])
            prior_member = _already_member(cur, identity_id)
            cur.execute(
                """SELECT id FROM memberships
                   WHERE identity_id = %s AND plan_id = %s AND source = %s""",
                (identity_id, plan_id, SOURCE),
            )
            existing = cur.fetchone()
            if existing:
                cur.execute(
                    f"""UPDATE memberships
                        SET status = 'active', external_ref = %s, current_period_end = {end_sql}
                        WHERE id = %s""",
                    (product_id, *params_end, int(existing["id"])),
                )
            else:
                cur.execute(
                    f"""INSERT INTO memberships
                        (identity_id, plan_id, status, source, external_ref, current_period_end)
                        VALUES (%s, %s, 'active', %s, %s, {end_sql})""",
                    (identity_id, plan_id, SOURCE, product_id, *params_end),
                )
            role = identity.derive_role(cur, identity_id)
            snap = _snapshot(cur, identity_id)
            discord_id = snap.get("discord_user_id")
    discord = None
    if discord_id:
        discord = _sync_discord_membership(
            str(discord_id),
            _membership_role_name(snap.get("memberships") or []),
        )
    return _session(
        {
            **snap,
            "ok": True,
            "granted": product_id,
            "prior_member": prior_member,
            "discord": discord,
            "woocommerce": False,
        },
        200,
        identity_id,
        role,
        request,
    )


@router.post("/close")
async def close(request: Request):
    claims = _require_demo(request)
    identity_id = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE memberships SET status = 'cancelled'
                   WHERE identity_id = %s AND source = %s""",
                (identity_id, SOURCE),
            )
            role = identity.derive_role(cur, identity_id)
            snap = _snapshot(cur, identity_id)
    return _session({**snap, "ok": True, "closed": True}, 200, identity_id, role, request)


@router.post("/discord")
async def discord_role(request: Request):
    claims = _require_demo(request)
    body = await request.json()
    action = str(body.get("action") or "")
    if action not in {"grant", "revoke"}:
        raise HTTPException(status_code=422, detail="Action must be grant or revoke.")
    raw = str(body.get("discord_user_id") or "").strip()
    if not raw.isdigit() or len(raw) < 17:
        raise HTTPException(status_code=422, detail="Enter the numeric Discord user id.")
    identity_id = int(claims["identity_id"])
    role_name = ""
    with db.transaction() as conn:
        with conn.cursor() as cur:
            try:
                identity.link_discord_from_sso(
                    cur, identity_id, raw, username="", source="front-door"
                )
            except identity.IdentityError as exc:
                raise HTTPException(status_code=409, detail=str(exc)) from exc
            cur.execute(
                """SELECT p.slug AS plan, m.status
                   FROM memberships m
                   JOIN plans p ON p.id = m.plan_id
                   WHERE m.identity_id = %s""",
                (identity_id,),
            )
            role_name = _membership_role_name(cur.fetchall())
    result = _sync_discord_membership(raw, role_name if action == "grant" else "")
    with db.transaction() as conn:
        with conn.cursor() as cur:
            snap = _snapshot(cur, identity_id)
    return {**snap, "discord": result}


def _already_member(cur, identity_id: int) -> bool:
    """Active Observer trial or Navigator before this purchase."""
    cur.execute(
        """SELECT 1 AS ok
           FROM memberships m
           JOIN plans p ON p.id = m.plan_id
           WHERE m.identity_id = %s
             AND m.status IN ('active', 'grace')
             AND p.slug IN ('observer-trial', 'navigator')
           LIMIT 1""",
        (identity_id,),
    )
    return cur.fetchone() is not None


def _avatar_url(user_id: str, avatar_hash: str | None) -> str:
    snow = (user_id or "").strip()
    avatar = (avatar_hash or "").strip()
    if snow and avatar:
        ext = "gif" if avatar.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/avatars/{snow}/{avatar}.{ext}"
    if snow.isdigit():
        index = (int(snow) >> 22) % 6
        return f"https://cdn.discordapp.com/embed/avatars/{index}.png"
    return ""


def _oauth_client() -> tuple[str, str]:
    """Community application first. StudioTwo currently has the 0-DTE application."""
    pairs = (
        ("LABS_DISCORD_CLIENT_ID", "LABS_DISCORD_CLIENT_SECRET"),
        ("LABS_DISCORD_0DTE_CLIENT_ID", "LABS_DISCORD_0DTE_CLIENT_SECRET"),
    )
    for id_key, secret_key in pairs:
        client_id = (os.environ.get(id_key) or "").strip()
        secret = (os.environ.get(secret_key) or "").strip()
        if client_id and secret:
            return client_id, secret
    raise HTTPException(status_code=503, detail="Discord sign-in is not configured on this server.")


def _browser_origin(request: Request) -> str:
    from csrf import allowed_origins, _normalize_origin

    candidates = [
        _normalize_origin(request.headers.get("origin") or ""),
        _normalize_origin(request.headers.get("referer") or ""),
    ]
    from config import get_config

    if get_config().web_origin:
        candidates.append(get_config().web_origin.rstrip("/"))
    allowed = allowed_origins()
    for origin in candidates:
        if origin and origin in allowed:
            return origin
    raise HTTPException(status_code=503, detail="Discord return address is not configured.")


_CALLBACK_PATH = "/api/front-door/access/discord/callback"


def _sign_state(identity_id: int, redirect_uri: str) -> str:
    from config import get_config

    body = json.dumps(
        {"id": identity_id, "exp": int(time.time()) + 600, "uri": redirect_uri},
        separators=(",", ":"),
    )
    sig = hmac.new(
        get_config().session_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    encoded = base64.urlsafe_b64encode(body.encode()).decode().rstrip("=")
    return f"{encoded}.{sig}"


def _read_state(state: str) -> tuple[int, str]:
    from config import get_config
    from csrf import allowed_origins

    encoded, dot, sig = (state or "").partition(".")
    if not encoded or not dot or not sig:
        raise HTTPException(status_code=422, detail="Discord returned an incomplete reply.")
    pad = "=" * (-len(encoded) % 4)
    try:
        body = base64.urlsafe_b64decode(encoded + pad).decode()
    except (ValueError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=422, detail="Discord returned an incomplete reply.") from exc
    expected = hmac.new(
        get_config().session_secret.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected, sig):
        raise HTTPException(status_code=422, detail="Discord returned an incomplete reply.")
    try:
        payload = json.loads(body)
        identity_id = int(payload["id"])
        exp = int(payload["exp"])
        redirect_uri = str(payload["uri"])
    except (KeyError, TypeError, ValueError) as exc:
        raise HTTPException(status_code=422, detail="Discord returned an incomplete reply.") from exc
    if exp < int(time.time()):
        raise HTTPException(status_code=422, detail="Discord sign-in expired. Connect again.")
    parsed = urlparse(redirect_uri)
    origin = f"{parsed.scheme}://{parsed.netloc}"
    if origin not in allowed_origins() or parsed.path != _CALLBACK_PATH:
        raise HTTPException(status_code=422, detail="Discord return address is not allowed.")
    return identity_id, redirect_uri


def _discord_identify(code: str, redirect_uri: str) -> tuple[dict, str]:
    client_id, secret = _oauth_client()
    form = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": secret,
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
    ).encode()
    token_req = urllib.request.Request(
        "https://discord.com/api/oauth2/token",
        data=form,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "FatTailLabs (labs.fattail.ai, 1.0)",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(token_req, timeout=20) as resp:
            token_body = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Discord did not confirm the account.") from exc
    access = str(token_body.get("access_token") or "")
    if not access:
        raise HTTPException(status_code=502, detail="Discord did not confirm the account.")
    me_req = urllib.request.Request(
        "https://discord.com/api/users/@me",
        headers={
            "Authorization": f"Bearer {access}",
            "User-Agent": "FatTailLabs (labs.fattail.ai, 1.0)",
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(me_req, timeout=20) as resp:
            me = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Discord did not confirm the account.") from exc
    if not isinstance(me, dict) or not str(me.get("id") or "").isdigit():
        raise HTTPException(status_code=502, detail="Discord did not confirm the account.")
    return me, access


@router.get("/discord")
def discord_profile(request: Request):
    claims = claims_or_none(request)
    empty = {
        "signed_in": False,
        "linked": False,
        "screen_name": "",
        "avatar_url": "",
        "role_name": "",
        "enabled_roles": [],
    }
    if not claims or not claims.get("identity_id"):
        return empty
    identity_id = int(claims["identity_id"])
    with db.transaction() as conn:
        with conn.cursor() as cur:
            profile = identity.get_discord_profile(cur, identity_id)
            cur.execute(
                """SELECT p.slug AS plan, m.status
                   FROM memberships m
                   JOIN plans p ON p.id = m.plan_id
                   WHERE m.identity_id = %s""",
                (identity_id,),
            )
            role_name = _membership_role_name(cur.fetchall())
    if not profile:
        return {
            "signed_in": True,
            "linked": False,
            "screen_name": "",
            "avatar_url": "",
            "role_name": role_name,
            "enabled_roles": [],
        }
    return {
        "signed_in": True,
        "linked": True,
        "screen_name": profile.get("username") or "",
        "avatar_url": _avatar_url(profile.get("discord_user_id") or "", profile.get("avatar_hash")),
        "role_name": role_name,
        "enabled_roles": _enabled_membership_roles(str(profile.get("discord_user_id") or "")),
    }


@router.get("/discord/start")
def discord_start(request: Request):
    claims = _require_demo(request)
    client_id, _secret = _oauth_client()
    origin = _browser_origin(request)
    redirect_uri = origin + _CALLBACK_PATH
    state = _sign_state(int(claims["identity_id"]), redirect_uri)
    query = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": "identify guilds.join",
            "state": state,
            "prompt": "consent",
        }
    )
    return {"url": f"https://discord.com/oauth2/authorize?{query}"}


def _discord_done(result: str) -> RedirectResponse:
    """Close the floating Discord window. The home page stays where it is."""
    if result not in {"ok", "denied", "failed", "taken"}:
        result = "failed"
    return RedirectResponse(f"/access/discord/done?result={result}&from=window", status_code=302)


@router.get("/discord/callback")
def discord_callback(request: Request):
    error = (request.query_params.get("error") or "").strip()
    if error:
        return _discord_done("denied")
    if not claims_or_none(request):
        return _discord_done("failed")
    try:
        claims = _require_demo(request)
        identity_id, redirect_uri = _read_state(request.query_params.get("state") or "")
    except HTTPException:
        return _discord_done("failed")
    if identity_id != int(claims["identity_id"]):
        return _discord_done("failed")
    code = (request.query_params.get("code") or "").strip()
    if not code:
        return _discord_done("failed")
    try:
        me, access = _discord_identify(code, redirect_uri)
    except HTTPException:
        return _discord_done("failed")
    screen = str(me.get("global_name") or me.get("username") or "").strip()
    try:
        with db.transaction() as conn:
            with conn.cursor() as cur:
                identity.link_discord_from_sso(
                    cur,
                    identity_id,
                    str(me["id"]),
                    username=screen,
                    avatar_hash=str(me.get("avatar") or ""),
                    source="front-door",
                )
                cur.execute(
                    """SELECT p.slug AS plan, m.status
                       FROM memberships m
                       JOIN plans p ON p.id = m.plan_id
                       WHERE m.identity_id = %s""",
                    (identity_id,),
                )
                role_name = _membership_role_name(cur.fetchall())
    except identity.IdentityError:
        return _discord_done("taken")
    _sync_discord_membership(str(me["id"]), role_name, access)
    return _discord_done("ok")
