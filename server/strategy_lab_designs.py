"""Design library: FatTail house strategies (admin-versioned) + member copies.

House strategies:
  - Immutable for members (cannot remove from managed list)
  - Only administrators may modify/version the house catalog (code + future admin API)
  - Members may apply, configure bots, or copy-and-rebuild

Binding on bot attributes.house_design@1 carries key+version into Curate/Deploy.
"""

from __future__ import annotations

import secrets
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

import strategy_lab_domain as sld
from strategy_packs.packs.butterfly import house_designs as hd

HOUSE_ATTR_KEY = "house_design@1"
MAX_MEMBER_DESIGNS = 50


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _public_id() -> str:
    return secrets.token_hex(4)


def _json_dump(obj: Any) -> str:
    import json

    return json.dumps(obj, separators=(",", ":"), default=str)


def _json_load(val: Any) -> Any:
    import json

    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, (bytes, bytearray)):
        val = val.decode("utf-8")
    if isinstance(val, str):
        return json.loads(val)
    return val


def list_library(*, pack_id: str = "butterfly") -> dict[str, Any]:
    """House catalog for Design phase (pack-scoped)."""
    if pack_id != "butterfly":
        return {
            "pack_id": pack_id,
            "house": [],
            "catalog_version": hd.HOUSE_CATALOG_VERSION,
            "maintainer": "admin",
            "note": "No house designs for this pack yet",
        }
    return {
        "pack_id": pack_id,
        "catalog_version": hd.HOUSE_CATALOG_VERSION,
        "maintainer": "admin",
        "member_may_edit_house": False,
        "member_may_remove_house": False,
        "house": hd.list_house_designs(),
        "note": (
            "House strategies are FatTail-designed and taught in courses. "
            "Only administrators may modify or version them. "
            "Members apply, configure bots, or copy-and-rebuild."
        ),
    }


def get_house(key: str, version: str | None = None) -> dict[str, Any] | None:
    return hd.get_house_design(key, version)


def extract_house_binding(attrs: dict | None) -> dict[str, Any] | None:
    if not isinstance(attrs, dict):
        return None
    b = attrs.get(HOUSE_ATTR_KEY)
    return b if isinstance(b, dict) and b.get("key") else None


def bind_house_on_attrs(
    attrs: dict[str, Any],
    *,
    house: dict[str, Any],
    mode: str,
) -> dict[str, Any]:
    """mode: apply | copy_rebuild"""
    out = dict(attrs)
    out[HOUSE_ATTR_KEY] = {
        "key": house["key"],
        "version": house["version"],
        "name": house["name"],
        "pack_id": house.get("pack_id") or "butterfly",
        "mode": mode,
        "source": "house",
        "immutable_source": True,
        "applied_at": _now_iso(),
        "dte_label": house.get("dte_label"),
        "family_label": house.get("family_label"),
        "course_refs": house.get("course_refs") or [],
    }
    return out


def create_member_bot(
    cur,
    identity_id: int,
    *,
    origin: str = "blank",
    house_key: str | None = None,
    house_version: str | None = None,
    name: str | None = None,
    description: str | None = None,
) -> dict[str, Any]:
    """Mint a Design-bin bot: blank newborn or house-prefilled (ready for Risk & Capital).

    origin:
      - blank — completely undefined; Design phase_state = hypothesis
      - house — FatTail house design applied; identity+structure prefilled;
                phase_state = model; designer next step = Risk & Capital
      - template — reserved (raises until templates ship)
    """
    origin = (origin or "blank").strip().lower()
    if origin == "template":
        raise ValueError(
            "Templates are not available yet — choose blank or a FatTail house strategy."
        )
    if origin not in ("blank", "house"):
        raise ValueError("origin must be blank or house")

    if origin == "blank":
        birth = {
            "kind": "blank",
            "at": _now_iso(),
            "label": "Newborn — nothing designed yet",
        }
        progress = {
            "completed_sections": [],
            "next_section": "identity",
            "ready_for_risk": False,
        }
        bot_name = (name or "New bot").strip()[:255] or "New bot"
        bot_desc = (
            (description if description is not None else "")
            or "Newborn — completely undefined. Start at Strategy Identity & Direction."
        )[:512]
        bot = sld.create_strategy(
            cur,
            identity_id,
            name=bot_name,
            description=bot_desc,
            phase="development",
            phase_state="hypothesis",
            blank=True,
            attributes={
                "birth@1": birth,
                "design_progress@1": progress,
            },
            lifecycle_detail={
                "origin": "blank",
                "message": "Newborn bot created in Design — completely undefined",
                "detail": (
                    "Minted blank. No pack config, no house binding. "
                    "First work: Strategy Identity & Direction."
                ),
            },
        )
        return bot

    # ── house-prefilled ──────────────────────────────────────────────────
    hk = (house_key or "").strip()
    if not hk:
        raise ValueError("house_key is required when origin is house")
    house = get_house(hk, house_version)
    if house is None:
        raise LookupError(
            f"House design not found: {hk!r}"
            + (f"@{house_version}" if house_version else "")
        )

    birth = {
        "kind": "house",
        "at": _now_iso(),
        "label": f"House start — {house['name']}",
        "house_key": house["key"],
        "house_version": house["version"],
        "house_name": house["name"],
    }
    progress = {
        "completed_sections": ["identity", "structure"],
        "next_section": "risk",
        "ready_for_risk": True,
        "note": (
            "Identity & Structure prefilled from house design. "
            "Continue at Risk & Capital."
        ),
    }
    bot_name = (name or house["name"]).strip()[:255] or house["name"]
    bot_desc = (
        (description if description is not None else "")
        or str(house.get("summary") or house.get("name") or "")
    )[:512]

    bot = sld.create_strategy(
        cur,
        identity_id,
        name=bot_name,
        description=bot_desc,
        phase="development",
        # First two Design form states (Identity + Structure) complete via house;
        # phase_state model = hypothesis+model done; ready for Risk & Capital work.
        phase_state="model",
        blank=False,
        attributes={
            "birth@1": birth,
            "design_progress@1": progress,
        },
        lifecycle_detail={
            "origin": "house",
            "house_key": house["key"],
            "house_version": house["version"],
            "house_name": house["name"],
            "message": (
                f"Bot created from house “{house['name']}” "
                f"v{house['version']} — ready for Risk & Capital"
            ),
            "detail": (
                "Identity & Structure prefilled from FatTail house design. "
                "Next design step: Risk & Capital. Lifecycle state: Model."
            ),
        },
    )

    bot = apply_house_to_bot(
        cur,
        identity_id,
        bot["id"],
        house_key=house["key"],
        house_version=house["version"],
        mode="apply",
        bump_version=False,
    )
    # apply_house does not change phase_state; reaffirm model + progress stamp
    row = sld.get_by_public_id(cur, identity_id, bot["id"])
    assert row is not None
    attrs = _json_load(row.get("attributes_json")) or {}
    if not isinstance(attrs, dict):
        attrs = {}
    attrs["birth@1"] = birth
    attrs["design_progress@1"] = progress
    log = sld._append_log(  # noqa: SLF001
        row,
        "ready_for_risk",
        message=(
            f"House “{house['name']}” applied. "
            "Identity + Structure complete — open Risk & Capital next."
        ),
        next_section="risk",
        house_key=house["key"],
        house_version=house["version"],
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, lifecycle_log = %s, phase_state = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            _json_dump(log),
            "model",
            identity_id,
            bot["id"],
        ),
    )
    out = sld.get_by_public_id(cur, identity_id, bot["id"])
    assert out is not None
    d = sld.row_to_dict(out)
    d["house_design"] = extract_house_binding(d.get("attributes"))
    return d


def apply_house_to_bot(
    cur,
    identity_id: int,
    strategy_public_id: str,
    *,
    house_key: str,
    house_version: str | None = None,
    mode: str = "apply",
    config_overrides: dict[str, Any] | None = None,
    bump_version: bool = True,
) -> dict[str, Any]:
    """Apply house design config to a bot and stamp house_design@1 binding.

    mode=apply: bot remains linked to this house key+version for Curate/Deploy tracking.
    mode=copy_rebuild: config is a starting point; binding records fork provenance
    (mode copy_rebuild) so members can diverge without claiming house edit rights.
    """
    if mode not in ("apply", "copy_rebuild"):
        raise ValueError("mode must be apply or copy_rebuild")
    house = get_house(house_key, house_version)
    if house is None:
        raise LookupError(
            f"House design not found: {house_key!r}"
            + (f"@{house_version}" if house_version else "")
        )

    cfg = deepcopy(house["config"])
    if config_overrides:
        # Shallow merge top-level; deep-merge entry/exit if provided
        for k, v in config_overrides.items():
            if k in ("entry_conditions", "exit_rules") and isinstance(v, dict):
                base = dict(cfg.get(k) or {})
                base.update(v)
                cfg[k] = base
            else:
                cfg[k] = v
    # Preserve house identity inside config for audit
    cfg["house_design_key"] = house["key"]
    cfg["house_design_version"] = house["version"]
    if mode == "copy_rebuild":
        cfg["name"] = str(cfg.get("name") or house["name"]) + " (rebuild)"
        cfg["description"] = (
            f"Copy-rebuild of house {house['key']}@{house['version']}. "
            + str(cfg.get("description") or house.get("summary") or "")
        )[:512]

    # set_pack_config validates + writes pack bags; then we re-stamp house binding
    sld.set_pack_config(
        cur,
        identity_id,
        strategy_public_id,
        pack_id=str(house.get("pack_id") or "butterfly"),
        pack_version=str(house.get("pack_version") or "1.0.0"),
        config=cfg,
        bump_version=bump_version,
    )
    row = sld.get_by_public_id(cur, identity_id, strategy_public_id)
    if row is None:
        raise LookupError("Strategy not found after apply")
    attrs = _json_load(row.get("attributes_json")) or {}
    if not isinstance(attrs, dict):
        attrs = {}
    attrs = bind_house_on_attrs(attrs, house=house, mode=mode)
    log = sld._append_log(  # noqa: SLF001 — same package lifecycle log
        row,
        "house_design_apply",
        house_key=house["key"],
        house_version=house["version"],
        mode=mode,
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            _json_dump(log),
            identity_id,
            strategy_public_id,
        ),
    )
    out = sld.get_by_public_id(cur, identity_id, strategy_public_id)
    assert out is not None
    d = sld.row_to_dict(out)
    d["house_design"] = extract_house_binding(d.get("attributes"))
    return d


# ── Member personal copies (rebuild library) ────────────────────────────────


def list_member_designs(cur, identity_id: int) -> list[dict[str, Any]]:
    cur.execute(
        """SELECT public_id, pack_id, name, description, house_key, house_version,
                  config_json, created_at, updated_at
           FROM strategy_lab_member_designs
           WHERE identity_id = %s
           ORDER BY updated_at DESC""",
        (identity_id,),
    )
    rows = []
    for r in cur.fetchall():
        rows.append(
            {
                "id": r["public_id"],
                "source": "member",
                "pack_id": r["pack_id"],
                "name": r["name"],
                "description": r.get("description") or "",
                "house_key": r.get("house_key"),
                "house_version": r.get("house_version"),
                "config": _json_load(r.get("config_json")) or {},
                "immutable": False,
                "member_may_remove": True,
                "member_may_edit": True,
                "created_at": r["created_at"].isoformat() + "Z"
                if hasattr(r["created_at"], "isoformat")
                else str(r.get("created_at") or ""),
                "updated_at": r["updated_at"].isoformat() + "Z"
                if hasattr(r["updated_at"], "isoformat")
                else str(r.get("updated_at") or ""),
            }
        )
    return rows


def save_member_design(
    cur,
    identity_id: int,
    *,
    name: str,
    config: dict[str, Any],
    description: str = "",
    pack_id: str = "butterfly",
    house_key: str | None = None,
    house_version: str | None = None,
) -> dict[str, Any]:
    name = (name or "").strip()[:255]
    if not name:
        raise ValueError("name is required")
    if not isinstance(config, dict):
        raise ValueError("config must be an object")
    cur.execute(
        "SELECT COUNT(*) AS n FROM strategy_lab_member_designs WHERE identity_id = %s",
        (identity_id,),
    )
    if int(cur.fetchone()["n"]) >= MAX_MEMBER_DESIGNS:
        raise ValueError(f"Max {MAX_MEMBER_DESIGNS} personal designs")
    pid = _public_id()
    cur.execute(
        """INSERT INTO strategy_lab_member_designs
           (public_id, identity_id, pack_id, name, description,
            house_key, house_version, config_json)
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (
            pid,
            identity_id,
            pack_id,
            name,
            (description or "")[:512],
            house_key,
            house_version,
            _json_dump(config),
        ),
    )
    return {
        "id": pid,
        "source": "member",
        "name": name,
        "house_key": house_key,
        "house_version": house_version,
    }


def delete_member_design(cur, identity_id: int, public_id: str) -> None:
    cur.execute(
        """DELETE FROM strategy_lab_member_designs
           WHERE identity_id = %s AND public_id = %s""",
        (identity_id, public_id),
    )
    if cur.rowcount == 0:
        raise LookupError("Member design not found")


def apply_member_design_to_bot(
    cur,
    identity_id: int,
    strategy_public_id: str,
    design_public_id: str,
    *,
    bump_version: bool = True,
) -> dict[str, Any]:
    cur.execute(
        """SELECT * FROM strategy_lab_member_designs
           WHERE identity_id = %s AND public_id = %s""",
        (identity_id, design_public_id),
    )
    row = cur.fetchone()
    if not row:
        raise LookupError("Member design not found")
    cfg = _json_load(row["config_json"]) or {}
    if not isinstance(cfg, dict):
        raise ValueError("invalid member design config")
    sld.set_pack_config(
        cur,
        identity_id,
        strategy_public_id,
        pack_id=str(row.get("pack_id") or "butterfly"),
        pack_version=str(cfg.get("pack_version") or "1.0.0"),
        config=cfg,
        bump_version=bump_version,
    )
    # Stamp provenance: member design, optional house fork
    srow = sld.get_by_public_id(cur, identity_id, strategy_public_id)
    assert srow is not None
    attrs = _json_load(srow.get("attributes_json")) or {}
    if not isinstance(attrs, dict):
        attrs = {}
    attrs[HOUSE_ATTR_KEY] = {
        "key": row.get("house_key"),
        "version": row.get("house_version"),
        "name": row["name"],
        "pack_id": row.get("pack_id") or "butterfly",
        "mode": "member_design",
        "source": "member",
        "member_design_id": design_public_id,
        "immutable_source": bool(row.get("house_key")),
        "applied_at": _now_iso(),
    }
    log = sld._append_log(  # noqa: SLF001
        srow,
        "member_design_apply",
        member_design_id=design_public_id,
        house_key=row.get("house_key"),
        house_version=row.get("house_version"),
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            _json_dump(log),
            identity_id,
            strategy_public_id,
        ),
    )
    out = sld.get_by_public_id(cur, identity_id, strategy_public_id)
    assert out is not None
    d = sld.row_to_dict(out)
    d["house_design"] = extract_house_binding(d.get("attributes"))
    return d


def reject_member_house_mutation() -> None:
    """Members cannot version or delete house strategies."""
    raise PermissionError(
        "House strategies are FatTail-managed. Only administrators may "
        "modify or version the house catalog. You may apply, configure a bot, "
        "or copy-and-rebuild into a personal design."
    )


# ── First-time member mint: Curate-ready starter bots ───────────────────────

# House keys provisioned on first identity creation (SSO join / register).
# In Curate, armed sim instances — ready to tick and later promote to Deploy.
STARTER_HOUSE_KEYS: tuple[str, ...] = (
    "0dte_otm_classic_butterfly",
    "0dte_high_vol_batman",
    "1_2dte_timewarp_batman",
)


def provision_starter_curate_bots(
    cur,
    identity_id: int,
    *,
    house_keys: tuple[str, ...] | list[str] | None = None,
) -> list[dict[str, Any]]:
    """Provision a few house bots in Curate with armed sim instances.

    Idempotent: no-op if the member already has any strategy_lab_strategies rows.
    Called when an identity is first minted (SSO / register / create_user).
    Never raises into identity mint — callers may wrap; this function raises on
    hard failures so tests can catch them.
    """
    from strategy_runtime import curate_domain as cd

    cur.execute(
        "SELECT COUNT(*) AS n FROM strategy_lab_strategies WHERE identity_id = %s",
        (int(identity_id),),
    )
    if int(cur.fetchone()["n"]) > 0:
        return []

    keys = tuple(house_keys) if house_keys is not None else STARTER_HOUSE_KEYS
    created: list[dict[str, Any]] = []

    for key in keys:
        house = get_house(key)
        if house is None:
            raise LookupError(f"Starter house design missing: {key!r}")
        cfg = house["config"]
        bot = sld.create_strategy(
            cur,
            int(identity_id),
            name=str(house["name"])[:255],
            description=str(house.get("summary") or "")[:512],
            phase="curation",
            phase_state="monitored",
            blank=True,
            attributes={
                "starter_provision": True,
                "provisioned_on_mint": True,
            },
        )
        apply_house_to_bot(
            cur,
            int(identity_id),
            bot["id"],
            house_key=key,
            house_version=str(house["version"]),
            mode="apply",
            bump_version=False,
        )
        srow = sld.get_by_public_id(cur, int(identity_id), bot["id"])
        assert srow is not None
        # SPX/XSP tradeable in universe; house configs default SPX
        symbol = str(cfg.get("underlying") or cfg.get("symbol") or "SPX").upper()
        risk = float(cfg.get("max_capital_at_risk") or 500.0)
        risk = max(100.0, min(risk, 2000.0))
        alloc = max(10_000.0, risk * 10.0)
        inst = cd.create_instance(
            cur,
            identity_id=int(identity_id),
            strategy_row=srow,
            envelope={
                "allocation_usd": alloc,
                "scan_symbol": symbol,
                "scan_risk_per_open_usd": risk,
                "max_positions_concurrent": 3,
                "max_positions_per_day": 8,
                "max_positions_per_symbol": 1,
                "take_profit_frac_of_max_profit": 0.45,
                "stop_multiple_of_premium_risked": 2.0,
            },
        )
        full = cd.get_instance(cur, int(identity_id), inst["id"])
        assert full is not None
        cd.set_status(
            cur,
            full,
            status="armed",
            message="Mint provision: house bot armed for Curate sim",
        )
        created.append(
            {
                "strategy_id": bot["id"],
                "bot_name": house["name"],
                "house_key": key,
                "house_version": house["version"],
                "instance_id": inst["id"],
                "scan_symbol": symbol,
                "phase": "curation",
                "instance_status": "armed",
            }
        )
    return created


def try_provision_starter_curate_bots(cur, identity_id: int) -> list[dict[str, Any]]:
    """Best-effort mint hook — never blocks identity creation."""
    import logging

    log = logging.getLogger("strategy_lab_designs")
    try:
        return provision_starter_curate_bots(cur, identity_id)
    except Exception:
        log.exception(
            "starter Curate bot provision failed for identity_id=%s",
            identity_id,
        )
        return []
