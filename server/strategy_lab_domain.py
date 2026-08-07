"""Strategy Lab domain — member-owned strategies (identity_id isolation).

Phases: development → curation → deployment · bin
Each phase has ordered phase_state values (see PHASE_STATES).
"""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

MAX_PER_PHASE = 100

PHASES = ("development", "curation", "deployment", "bin")

PHASE_LABELS = {
    "development": "Design",
    "curation": "Curate",
    "deployment": "Deploy",
    "bin": "Archive",
}

PHASE_ALIASES = {
    "development": "development",
    "develop": "development",
    "design": "development",
    "curation": "curation",
    "curate": "curation",
    "deployment": "deployment",
    "deploy": "deployment",
    "campaign": "deployment",
    "bin": "bin",
    "killed": "bin",
    "archive": "bin",
}

DEVELOPMENT_STATES: list[tuple[str, str]] = [
    ("hypothesis", "Hypothesis"),
    ("model", "Model"),
    ("is_test", "Back test"),  # IS validation of pack settings
    ("oos_test", "Forward walk"),  # walk-forward / holdout before Curation
    ("deployed", "Deployed"),  # settings validated — eligible for Curation
]

CURATION_STATES: list[tuple[str, str]] = [
    ("categorized", "Categorized"),
    ("grouped", "Grouped"),
    ("position_sized", "Position sized"),
    ("monitored", "Monitored"),
]

DEPLOYMENT_STATES: list[tuple[str, str]] = [
    ("strategy", "Strategy"),
    ("capital_allocation", "Capital allocation"),
    ("scheduled", "Scheduled"),
    ("started", "Started"),
    ("paused", "Paused"),
    ("stopped", "Stopped"),
    ("ended", "Ended"),
    ("pruned", "Pruned"),
    ("retrospective", "Retrospective"),
]

BIN_STATES: list[tuple[str, str]] = [
    ("retired", "Retired"),
    ("trashed", "Trashed"),
]

PHASE_STATES: dict[str, list[tuple[str, str]]] = {
    "development": DEVELOPMENT_STATES,
    "curation": CURATION_STATES,
    "deployment": DEPLOYMENT_STATES,
    "bin": BIN_STATES,
}

DEFAULT_PHASE_STATE = {
    "development": "hypothesis",
    "curation": "categorized",
    "deployment": "strategy",
    "bin": "retired",
}

_FORWARD = {
    "development": "curation",
    "curation": "deployment",
    "deployment": None,
    "bin": None,
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def normalize_phase(raw: str | None) -> str:
    key = (raw or "development").strip().lower()
    return PHASE_ALIASES.get(key, "development")


def state_keys(phase: str) -> list[str]:
    return [k for k, _ in PHASE_STATES.get(normalize_phase(phase), [])]


def state_label(phase: str, state_key: str) -> str:
    phase = normalize_phase(phase)
    for k, lab in PHASE_STATES.get(phase, []):
        if k == state_key:
            return lab
    return (state_key or "").replace("_", " ").title()


def state_order(phase: str) -> dict[str, int]:
    return {k: i for i, (k, _) in enumerate(PHASE_STATES.get(normalize_phase(phase), []))}


def default_state(phase: str) -> str:
    return DEFAULT_PHASE_STATE.get(normalize_phase(phase), "hypothesis")


def normalize_phase_state(phase: str, raw: str | None) -> str:
    phase = normalize_phase(phase)
    keys = state_keys(phase)
    candidate = (raw or "").strip().lower()
    if candidate in keys:
        return candidate
    return default_state(phase)


def next_state(phase: str, current: str) -> str | None:
    keys = state_keys(phase)
    if current not in keys:
        return keys[0] if keys else None
    i = keys.index(current)
    if i + 1 < len(keys):
        return keys[i + 1]
    return None


def ready_for_curation(phase_state: str) -> bool:
    return phase_state == "deployed"


def _public_id() -> str:
    return secrets.token_hex(4)


def _json_load(val: Any) -> Any:
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return val
    if isinstance(val, (bytes, bytearray)):
        val = val.decode("utf-8")
    if isinstance(val, str):
        try:
            return json.loads(val)
        except json.JSONDecodeError:
            return None
    return None


def _json_dump(val: Any) -> str | None:
    if val is None:
        return None
    return json.dumps(val, ensure_ascii=False)


def meta_payload() -> dict[str, Any]:
    return {
        "phases": [
            {
                "key": p,
                "label": PHASE_LABELS[p],
                "states": [{"key": k, "label": lab} for k, lab in PHASE_STATES[p]],
            }
            for p in PHASES
        ],
        "max_per_phase": MAX_PER_PHASE,
    }


def row_to_dict(r: dict) -> dict[str, Any]:
    log = _json_load(r.get("lifecycle_log")) or []
    attrs = _json_load(r.get("attributes_json")) or {}
    spec = _json_load(r.get("spec_json"))
    phase = normalize_phase(r.get("phase"))
    phase_state = normalize_phase_state(phase, r.get("phase_state"))
    house = None
    if isinstance(attrs, dict):
        raw_h = attrs.get("house_design@1")
        if isinstance(raw_h, dict) and raw_h.get("key"):
            house = {
                "key": raw_h.get("key"),
                "version": raw_h.get("version"),
                "name": raw_h.get("name"),
                "mode": raw_h.get("mode"),
                "source": raw_h.get("source"),
                "dte_label": raw_h.get("dte_label"),
                "family_label": raw_h.get("family_label"),
                "course_refs": raw_h.get("course_refs") or [],
                "applied_at": raw_h.get("applied_at"),
            }
    return {
        "id": r["public_id"],
        "db_id": int(r["id"]),
        "product_key": r["product_key"],
        "name": r["name"],
        "description": r.get("description") or "",
        "version": r["version"],
        "version_major": int(r["version_major"]),
        "version_minor": int(r["version_minor"]),
        "version_patch": int(r["version_patch"]),
        "phase": phase,
        "phase_state": phase_state,
        "phase_state_label": state_label(phase, phase_state),
        "disposition": r.get("disposition") or "active",
        "attributes": attrs if isinstance(attrs, dict) else {},
        "house_design": house,
        "spec": spec if isinstance(spec, dict) else None,
        "lifecycle_log": log if isinstance(log, list) else [],
        "bin_reason": r.get("bin_reason"),
        "created_at": r["created_at"].isoformat() + "Z"
        if hasattr(r["created_at"], "isoformat")
        else str(r.get("created_at") or ""),
        "updated_at": r["updated_at"].isoformat() + "Z"
        if hasattr(r["updated_at"], "isoformat")
        else str(r.get("updated_at") or ""),
    }


def count_in_phase(cur, identity_id: int, phase: str) -> int:
    phase = normalize_phase(phase)
    cur.execute(
        """SELECT COUNT(*) AS n FROM strategy_lab_strategies
           WHERE identity_id = %s AND phase = %s""",
        (identity_id, phase),
    )
    return int(cur.fetchone()["n"])


def list_strategies(cur, identity_id: int) -> list[dict[str, Any]]:
    cur.execute(
        """SELECT * FROM strategy_lab_strategies
           WHERE identity_id = %s
           ORDER BY updated_at DESC, id DESC""",
        (identity_id,),
    )
    return [row_to_dict(r) for r in cur.fetchall()]


def get_by_public_id(cur, identity_id: int, public_id: str) -> dict | None:
    cur.execute(
        """SELECT * FROM strategy_lab_strategies
           WHERE identity_id = %s AND public_id = %s""",
        (identity_id, public_id),
    )
    r = cur.fetchone()
    return r


def ensure_seed(cur, identity_id: int) -> dict[str, Any]:
    """If member has zero strategies, provision house starter Curate bots.

    Preferred path: first mint (SSO/register) already provisioned via identity.
    This is a safety net for identities created before mint-provision existed.
    """
    cur.execute(
        "SELECT COUNT(*) AS n FROM strategy_lab_strategies WHERE identity_id = %s",
        (identity_id,),
    )
    if int(cur.fetchone()["n"]) > 0:
        rows = list_strategies(cur, identity_id)
        return rows[0]
    try:
        from strategy_lab_designs import provision_starter_curate_bots

        created = provision_starter_curate_bots(cur, identity_id)
        if created:
            rows = list_strategies(cur, identity_id)
            return rows[0]
    except Exception:
        import logging

        logging.getLogger(__name__).exception(
            "ensure_seed starter provision failed identity_id=%s", identity_id
        )
    # Last resort: blank Design bot so the lab is never empty
    return create_strategy(
        cur,
        identity_id,
        name="Untitled strategy",
        description="",
        blank=True,
    )


def create_strategy(
    cur,
    identity_id: int,
    *,
    name: str = "Untitled strategy",
    description: str = "",
    phase: str = "development",
    phase_state: str | None = None,
    blank: bool = True,
    spec: dict | None = None,
    attributes: dict | None = None,
    lifecycle_detail: dict[str, Any] | None = None,
) -> dict[str, Any]:
    phase = normalize_phase(phase)
    if count_in_phase(cur, identity_id, phase) >= MAX_PER_PHASE:
        raise ValueError(f"Phase {phase!r} is full (max {MAX_PER_PHASE}).")
    ps = normalize_phase_state(phase, phase_state)
    disposition = ps if phase == "bin" else "active"
    pid = _public_id()
    created_evt: dict[str, Any] = {
        "at": _now_iso(),
        "event": "created",
        "phase": phase,
        "phase_state": ps,
        "version": "1.0.0",
    }
    if lifecycle_detail:
        for k, v in lifecycle_detail.items():
            if k not in ("at", "event") and v is not None:
                created_evt[k] = v
    log = [created_evt]
    name = (name or "Untitled strategy").strip()[:255] or "Untitled strategy"
    description = (description or "")[:512]
    cur.execute(
        """INSERT INTO strategy_lab_strategies
           (identity_id, public_id, product_key, name, description,
            version, version_major, version_minor, version_patch,
            phase, phase_state, disposition,
            attributes_json, spec_json, lifecycle_log)
           VALUES (%s,%s,%s,%s,%s, '1.0.0',1,0,0, %s,%s,%s, %s,%s,%s)""",
        (
            identity_id,
            pid,
            pid,
            name,
            description,
            phase,
            ps,
            disposition,
            _json_dump(attributes if attributes is not None else {}),
            _json_dump(spec),
            _json_dump(log),
        ),
    )
    row = get_by_public_id(cur, identity_id, pid)
    assert row is not None
    return row_to_dict(row)


def _append_log(row: dict, event: str, **extra: Any) -> list:
    log = _json_load(row.get("lifecycle_log")) or []
    if not isinstance(log, list):
        log = []
    log.append({"at": _now_iso(), "event": event, **extra})
    return log[-50:]


def set_phase_state(cur, identity_id: int, public_id: str, phase_state: str) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    phase = normalize_phase(row["phase"])
    new_ps = normalize_phase_state(phase, phase_state)
    old_ps = normalize_phase_state(phase, row.get("phase_state"))
    if old_ps == new_ps:
        return row_to_dict(row)
    disposition = new_ps if phase == "bin" else "active"
    log = _append_log(
        row,
        "phase_state",
        phase=phase,
        from_state=old_ps,
        to_state=new_ps,
        from_label=state_label(phase, old_ps),
        to_label=state_label(phase, new_ps),
        version=row.get("version"),
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET phase_state = %s, disposition = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (new_ps, disposition, _json_dump(log), identity_id, public_id),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


def advance_phase_state(cur, identity_id: int, public_id: str) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    phase = normalize_phase(row["phase"])
    cur_ps = normalize_phase_state(phase, row.get("phase_state"))
    nxt = next_state(phase, cur_ps)
    if nxt is None:
        raise ValueError("Already at the last state in this phase.")
    return set_phase_state(cur, identity_id, public_id, nxt)


def move_phase(
    cur,
    identity_id: int,
    public_id: str,
    to_phase: str,
    *,
    reason: str | None = None,
    phase_state: str | None = None,
) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    to_phase = normalize_phase(to_phase)
    from_phase = normalize_phase(row["phase"])
    from_ps = normalize_phase_state(from_phase, row.get("phase_state"))

    if to_phase == "bin":
        entry = phase_state if phase_state in ("retired", "trashed") else "retired"
    else:
        entry = phase_state or default_state(to_phase)
    entry = normalize_phase_state(to_phase, entry)

    if from_phase == to_phase and from_ps == entry:
        return row_to_dict(row)

    # Design → Curate only after back test + forward walk evidence
    if from_phase == "development" and to_phase == "curation":
        gaps = validation_gaps(row_to_dict(row))
        if gaps:
            raise ValueError(
                "Cannot enter Curate until Design validation completes: "
                + "; ".join(gaps)
            )
        if not ready_for_curation(from_ps) and entry == default_state("curation"):
            # Allow if already Deployed; otherwise require Deployed after walk
            if from_ps != "deployed":
                raise ValueError(
                    "Design must be Deployed (after Back test + Forward walk) "
                    "before Curate."
                )

    # capacity (exclude self when staying would not apply)
    if from_phase != to_phase:
        n = count_in_phase(cur, identity_id, to_phase)
        if n >= MAX_PER_PHASE:
            raise ValueError(f"Phase {to_phase!r} is full (max {MAX_PER_PHASE}).")

    disposition = entry if to_phase == "bin" else "active"
    bin_reason = (reason or "").strip()[:512] if to_phase == "bin" else None
    log = _append_log(
        row,
        "phase_move",
        from_phase=from_phase,
        to_phase=to_phase,
        from_state=from_ps,
        to_state=entry,
        reason=bin_reason,
        version=row.get("version"),
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET phase = %s, phase_state = %s, disposition = %s,
               bin_reason = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            to_phase,
            entry,
            disposition,
            bin_reason,
            _json_dump(log),
            identity_id,
            public_id,
        ),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


def promote(cur, identity_id: int, public_id: str) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    phase = normalize_phase(row["phase"])
    nxt = _FORWARD.get(phase)
    if nxt is None:
        raise ValueError("Cannot promote further from this phase.")
    ps = normalize_phase_state(phase, row.get("phase_state"))
    if phase == "development" and not ready_for_curation(ps):
        raise ValueError(
            "Design must reach Deployed before Curate "
            f"(current: {state_label(phase, ps)}). "
            "Run Back test and Forward walk first."
        )
    if phase == "development":
        missing = validation_gaps(row_to_dict(row))
        if missing:
            raise ValueError(
                "Curate requires Design validation: " + "; ".join(missing)
            )
    return move_phase(cur, identity_id, public_id, nxt)


def rename(
    cur,
    identity_id: int,
    public_id: str,
    new_name: str,
    *,
    bump_version: bool = False,
    bump_part: str = "minor",
) -> dict[str, Any]:
    name = (new_name or "").strip()[:255]
    if not name:
        raise ValueError("Strategy name cannot be empty.")
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    old_name = row["name"]
    log = _append_log(
        row,
        "rename",
        from_name=old_name,
        to_name=name,
        version=row.get("version"),
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET name = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (name, _json_dump(log), identity_id, public_id),
    )
    if bump_version:
        return bump_version_fn(
            cur,
            identity_id,
            public_id,
            part=bump_part,
            reason=f"rename: {old_name!r} → {name!r}",
        )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


def bump_version_fn(
    cur,
    identity_id: int,
    public_id: str,
    *,
    part: str = "minor",
    reason: str | None = None,
) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    old = str(row.get("version") or "1.0.0")
    maj = int(row["version_major"])
    minor = int(row["version_minor"])
    patch = int(row["version_patch"])
    if part == "major":
        maj, minor, patch = maj + 1, 0, 0
    elif part == "patch":
        patch += 1
    else:
        minor, patch = minor + 1, 0
    ver = f"{maj}.{minor}.{patch}"
    log = _append_log(
        row,
        "version_bump",
        version=ver,
        from_version=old,
        part=part,
        reason=reason,
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET version = %s, version_major = %s, version_minor = %s,
               version_patch = %s, lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (ver, maj, minor, patch, _json_dump(log), identity_id, public_id),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


def patch_description(
    cur, identity_id: int, public_id: str, description: str
) -> dict[str, Any]:
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    description = (description or "")[:512]
    cur.execute(
        """UPDATE strategy_lab_strategies SET description = %s
           WHERE identity_id = %s AND public_id = %s""",
        (description, identity_id, public_id),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


# ── Portability (Spec Strategy-Lab-Portability-Spec-v1.0) ──────────────────

FORMAT_ID = "fattail.labs.strategy_lab"
MODEL_VERSION = "1.0"
FOUNDATION_VERSION = 1
LAB_SCHEMA_VERSION = 1
MAX_IMPORT_BYTES = 25 * 1024 * 1024
MAX_LOG_EVENTS = 50

_ID_RE_OK = __import__("re").compile(r"^[a-zA-Z0-9_-]{4,32}$")


def _phase_label_short(phase: str) -> str:
    return {
        "development": "Design",
        "curation": "Curate",
        "deployment": "Deploy",
        "bin": "Archive",
    }.get(phase, phase)


def strategy_to_portable(s: dict[str, Any]) -> dict[str, Any]:
    """API/row dict → pack card (no db_id / identity_id)."""
    attrs = s.get("attributes") if isinstance(s.get("attributes"), dict) else {}
    attrs = dict(attrs)
    evidence = attrs.pop("__evidence@1", None)
    if not isinstance(evidence, list):
        evidence = []
    pid = str(s.get("id") or s.get("public_id") or "")
    return {
        "id": pid,
        "export_key": pid,
        "product_key": str(s.get("product_key") or pid),
        "name": str(s.get("name") or "Untitled strategy"),
        "description": str(s.get("description") or ""),
        "version": str(s.get("version") or "1.0.0"),
        "version_major": int(s.get("version_major") or 1),
        "version_minor": int(s.get("version_minor") or 0),
        "version_patch": int(s.get("version_patch") or 0),
        "phase": normalize_phase(s.get("phase")),
        "phase_state": normalize_phase_state(
            normalize_phase(s.get("phase")), s.get("phase_state")
        ),
        "disposition": str(s.get("disposition") or "active"),
        "bin_reason": s.get("bin_reason"),
        "attributes": attrs,
        "evidence": evidence,
        "spec": s.get("spec") if isinstance(s.get("spec"), dict) else None,
        "lifecycle_log": list(s.get("lifecycle_log") or [])
        if isinstance(s.get("lifecycle_log"), list)
        else [],
        "created_at": str(s.get("created_at") or ""),
        "updated_at": str(s.get("updated_at") or ""),
    }


def count_by_phase(strategies: list[dict[str, Any]]) -> dict[str, int]:
    counts = {p: 0 for p in PHASES}
    for s in strategies:
        p = normalize_phase(s.get("phase"))
        if p in counts:
            counts[p] += 1
    counts["total"] = sum(counts[p] for p in PHASES)
    return counts


def build_export_pack(
    cur,
    identity_id: int,
    *,
    email: str | None = None,
    include_email: bool = False,
    env: str = "dev",
    phases: set[str] | None = None,
    include_bin: bool = True,
    label: str | None = None,
) -> dict[str, Any]:
    rows = list_strategies(cur, identity_id)
    portable: list[dict[str, Any]] = []
    for s in rows:
        p = normalize_phase(s.get("phase"))
        if phases is not None and p not in phases:
            continue
        if not include_bin and p == "bin":
            continue
        portable.append(strategy_to_portable(s))
    counts = count_by_phase(portable)
    identity: dict[str, Any] = {"export_subject": "self"}
    # SLP-6: email omitted by default; only when explicitly requested
    if include_email and email:
        identity["email"] = email
    return {
        "format": FORMAT_ID,
        "model_version": MODEL_VERSION,
        "foundation_version": FOUNDATION_VERSION,
        "exported_at": _now_iso(),
        "source": {
            "system": "fattail-labs",
            "env": env,
            "app": "strategy-lab",
        },
        "identity": identity,
        "lab": {
            "schema_version": LAB_SCHEMA_VERSION,
            "label": label,
            "counts": {
                "development": counts["development"],
                "curation": counts["curation"],
                "deployment": counts["deployment"],
                "bin": counts["bin"],
                "total": counts["total"],
            },
        },
        "strategies": portable,
        "campaigns": [],
        "reports": [],
        "lab_settings": {},
    }


def detect_pack(document: Any) -> dict[str, Any]:
    if not isinstance(document, dict):
        return {"ok": False, "error": "invalid_format", "detail": "JSON object required"}
    if document.get("format") != FORMAT_ID:
        return {
            "ok": False,
            "error": "invalid_format",
            "detail": f"Expected format {FORMAT_ID!r}",
        }
    mv = str(document.get("model_version") or "")
    if not mv.startswith("1."):
        return {
            "ok": False,
            "error": "unsupported_model",
            "detail": f"Unsupported model_version {mv!r}",
        }
    try:
        fv = int(document.get("foundation_version") or 0)
    except (TypeError, ValueError):
        fv = 0
    if fv > FOUNDATION_VERSION:
        return {
            "ok": False,
            "error": "unsupported_foundation",
            "detail": f"foundation_version {fv} > server {FOUNDATION_VERSION}",
        }
    strategies = document.get("strategies")
    if not isinstance(strategies, list):
        return {
            "ok": False,
            "error": "invalid_format",
            "detail": "strategies must be an array",
        }
    return {
        "ok": True,
        "format": FORMAT_ID,
        "model_version": mv or MODEL_VERSION,
        "foundation_version": fv or FOUNDATION_VERSION,
        "strategies_in_pack": len(strategies),
    }


def _export_key_of(card: dict[str, Any]) -> str:
    ek = str(card.get("export_key") or card.get("id") or "").strip()
    return ek[:64]


def _find_existing_by_export_key(cur, identity_id: int, export_key: str) -> dict | None:
    if not export_key:
        return None
    cur.execute(
        """SELECT * FROM strategy_lab_strategies
           WHERE identity_id = %s AND (public_id = %s OR product_key = %s)
           LIMIT 1""",
        (identity_id, export_key, export_key),
    )
    return cur.fetchone()


def _parse_version_parts(card: dict[str, Any]) -> tuple[str, int, int, int]:
    try:
        maj = int(card.get("version_major"))
        minor = int(card.get("version_minor"))
        patch = int(card.get("version_patch"))
        return f"{maj}.{minor}.{patch}", maj, minor, patch
    except (TypeError, ValueError):
        pass
    ver = str(card.get("version") or "1.0.0").strip()
    parts = ver.split(".")
    try:
        maj = int(parts[0]) if len(parts) > 0 else 1
        minor = int(parts[1]) if len(parts) > 1 else 0
        patch = int(parts[2]) if len(parts) > 2 else 0
    except ValueError:
        maj, minor, patch = 1, 0, 0
    return f"{maj}.{minor}.{patch}", maj, minor, patch


def _normalize_card(card: Any) -> tuple[dict[str, Any] | None, list[dict[str, str]]]:
    """Return (normalized_card or None, issues)."""
    issues: list[dict[str, str]] = []
    if not isinstance(card, dict):
        issues.append(
            {
                "level": "error",
                "code": "invalid_strategy",
                "detail": "strategy is not an object",
            }
        )
        return None, issues

    raw_phase = card.get("phase")
    phase = normalize_phase(str(raw_phase) if raw_phase is not None else "development")
    if str(raw_phase or "").strip().lower() not in (
        phase,
        *{k for k, v in PHASE_ALIASES.items() if v == phase},
    ) and str(raw_phase or "").strip().lower() not in PHASES:
        # unknown phase string still normalized via alias default
        if str(raw_phase or "").strip().lower() not in PHASE_ALIASES:
            if str(raw_phase or "").strip().lower() not in PHASES:
                issues.append(
                    {
                        "level": "warning",
                        "code": "phase_aliased",
                        "detail": f"phase {raw_phase!r} → {phase}",
                        "strategy_export_key": _export_key_of(card),
                    }
                )

    raw_state = str(card.get("phase_state") or "").strip().lower()
    keys = state_keys(phase)
    if raw_state and raw_state not in keys:
        issues.append(
            {
                "level": "warning",
                "code": "state_normalized",
                "detail": f"phase_state {raw_state!r} illegal for {phase}; using default",
                "strategy_export_key": _export_key_of(card),
            }
        )
    phase_state = normalize_phase_state(phase, raw_state or None)

    name = str(card.get("name") or "").strip()[:255] or "Untitled strategy"
    description = str(card.get("description") or "")[:512]
    ver, maj, minor, patch = _parse_version_parts(card)
    export_key = _export_key_of(card) or secrets.token_hex(4)
    product_key = str(card.get("product_key") or export_key)[:16] or export_key[:16]

    desired_id = str(card.get("id") or export_key).strip()
    if not _ID_RE_OK.match(desired_id):
        issues.append(
            {
                "level": "warning",
                "code": "id_remapped",
                "detail": f"id {desired_id!r} invalid; will mint",
                "strategy_export_key": export_key,
            }
        )
        desired_id = ""

    attrs = card.get("attributes") if isinstance(card.get("attributes"), dict) else {}
    attrs = dict(attrs)
    evidence = card.get("evidence") if isinstance(card.get("evidence"), list) else []
    if evidence:
        issues.append(
            {
                "level": "warning",
                "code": "evidence_embedded",
                "detail": "evidence stored under attributes.__evidence@1",
                "strategy_export_key": export_key,
            }
        )
        attrs["__evidence@1"] = evidence

    log = card.get("lifecycle_log") if isinstance(card.get("lifecycle_log"), list) else []
    if len(log) > MAX_LOG_EVENTS:
        issues.append(
            {
                "level": "warning",
                "code": "log_truncated",
                "detail": f"lifecycle_log clipped to {MAX_LOG_EVENTS}",
                "strategy_export_key": export_key,
            }
        )
        log = log[-MAX_LOG_EVENTS:]

    disposition = phase_state if phase == "bin" else "active"
    bin_reason = card.get("bin_reason")
    if phase == "bin" and not bin_reason:
        bin_reason = "Imported"
    if bin_reason is not None:
        bin_reason = str(bin_reason)[:512]

    spec = card.get("spec") if isinstance(card.get("spec"), dict) else None

    return {
        "desired_id": desired_id,
        "export_key": export_key,
        "product_key": product_key[:16],
        "name": name,
        "description": description,
        "version": ver,
        "version_major": maj,
        "version_minor": minor,
        "version_patch": patch,
        "phase": phase,
        "phase_state": phase_state,
        "disposition": disposition,
        "bin_reason": bin_reason,
        "attributes": attrs,
        "spec": spec,
        "lifecycle_log": log,
        "created_at": card.get("created_at"),
        "updated_at": card.get("updated_at"),
    }, issues


def preview_import(
    cur,
    identity_id: int,
    document: dict[str, Any],
    *,
    policy: str = "additive",
) -> dict[str, Any]:
    det = detect_pack(document)
    if not det.get("ok"):
        return {
            "ok": False,
            "error": det.get("error"),
            "detail": det.get("detail"),
            "format": FORMAT_ID,
            "policy": policy,
            "summary": {
                "strategies_in_pack": 0,
                "create": 0,
                "skip": 0,
                "errors": 1,
                "warnings": 0,
            },
            "by_phase": {},
            "issues": [
                {
                    "level": "error",
                    "code": str(det.get("error") or "invalid_format"),
                    "detail": str(det.get("detail") or ""),
                }
            ],
        }

    policy = (policy or "additive").strip().lower()
    if policy in ("merge", "skip_existing"):
        policy = "additive"
    if policy not in ("additive", "replace_lab"):
        return {
            "ok": False,
            "error": "invalid_policy",
            "detail": "policy must be additive or replace_lab",
            "format": FORMAT_ID,
            "policy": policy,
            "summary": {
                "strategies_in_pack": 0,
                "create": 0,
                "skip": 0,
                "errors": 1,
                "warnings": 0,
            },
            "by_phase": {},
            "issues": [
                {
                    "level": "error",
                    "code": "invalid_policy",
                    "detail": "policy must be additive or replace_lab",
                }
            ],
        }

    existing_counts = {p: 0 for p in PHASES}
    if policy != "replace_lab":
        for p in PHASES:
            existing_counts[p] = count_in_phase(cur, identity_id, p)

    create = 0
    skip = 0
    errors = 0
    warnings = 0
    issues: list[dict[str, str]] = []
    by_phase = {
        p: {"create": 0, "skip": 0, "after_total": existing_counts[p]}
        for p in PHASES
    }
    seen_keys: set[str] = set()

    for card in document.get("strategies") or []:
        norm, card_issues = _normalize_card(card)
        for iss in card_issues:
            issues.append(iss)
            if iss.get("level") == "error":
                errors += 1
            else:
                warnings += 1
        if norm is None:
            continue
        ek = norm["export_key"]
        if ek in seen_keys:
            issues.append(
                {
                    "level": "warning",
                    "code": "duplicate_export_key",
                    "detail": f"duplicate export_key {ek} in pack; later skipped",
                    "strategy_export_key": ek,
                }
            )
            warnings += 1
            skip += 1
            continue
        seen_keys.add(ek)

        phase = norm["phase"]
        exists = None
        if policy != "replace_lab":
            exists = _find_existing_by_export_key(cur, identity_id, ek)

        if exists is not None:
            skip += 1
            by_phase[phase]["skip"] += 1
        else:
            create += 1
            by_phase[phase]["create"] += 1
            by_phase[phase]["after_total"] += 1

    capacity_errors = 0
    for p in PHASES:
        if by_phase[p]["after_total"] > MAX_PER_PHASE:
            capacity_errors += 1
            errors += 1
            issues.append(
                {
                    "level": "error",
                    "code": "phase_capacity",
                    "detail": (
                        f"phase {p!r} would have {by_phase[p]['after_total']} "
                        f"(max {MAX_PER_PHASE})"
                    ),
                }
            )

    return {
        "ok": errors == 0,
        "format": FORMAT_ID,
        "model_version": str(document.get("model_version") or MODEL_VERSION),
        "policy": policy,
        "summary": {
            "strategies_in_pack": len(document.get("strategies") or []),
            "create": create,
            "skip": skip,
            "errors": errors,
            "warnings": warnings,
        },
        "by_phase": by_phase,
        "issues": issues,
        "capacity_ok": capacity_errors == 0,
    }


def purge_lab(cur, identity_id: int) -> int:
    cur.execute(
        "DELETE FROM strategy_lab_strategies WHERE identity_id = %s",
        (identity_id,),
    )
    return int(cur.rowcount or 0)


def _insert_portable_card(
    cur,
    identity_id: int,
    norm: dict[str, Any],
    *,
    policy: str,
) -> str:
    """Insert one normalized card; return public_id used."""
    phase = norm["phase"]
    if count_in_phase(cur, identity_id, phase) >= MAX_PER_PHASE:
        raise ValueError(f"Phase {phase!r} is full (max {MAX_PER_PHASE}).")

    desired = norm.get("desired_id") or ""
    public_id = desired if desired and _ID_RE_OK.match(desired) else _public_id()
    # Collision: mint new (keep product_key as export lineage)
    if get_by_public_id(cur, identity_id, public_id) is not None:
        public_id = _public_id()

    product_key = (norm.get("product_key") or norm["export_key"] or public_id)[:16]
    # Prefer export_key as product_key for merge stability when short enough
    ek = norm["export_key"]
    if ek and _ID_RE_OK.match(ek) and len(ek) <= 16:
        # Only if not colliding with another product_key for this identity
        cur.execute(
            """SELECT id FROM strategy_lab_strategies
               WHERE identity_id = %s AND product_key = %s LIMIT 1""",
            (identity_id, ek[:16]),
        )
        if cur.fetchone() is None:
            product_key = ek[:16]

    log = list(norm.get("lifecycle_log") or [])
    if not isinstance(log, list):
        log = []
    log.append(
        {
            "at": _now_iso(),
            "event": "imported",
            "source_format": FORMAT_ID,
            "model_version": MODEL_VERSION,
            "policy": policy,
            "export_key": ek,
        }
    )
    log = log[-MAX_LOG_EVENTS:]

    cur.execute(
        """INSERT INTO strategy_lab_strategies
           (identity_id, public_id, product_key, name, description,
            version, version_major, version_minor, version_patch,
            phase, phase_state, disposition,
            attributes_json, spec_json, lifecycle_log, bin_reason)
           VALUES (%s,%s,%s,%s,%s, %s,%s,%s,%s, %s,%s,%s, %s,%s,%s,%s)""",
        (
            identity_id,
            public_id,
            product_key,
            norm["name"],
            norm["description"],
            norm["version"],
            norm["version_major"],
            norm["version_minor"],
            norm["version_patch"],
            phase,
            norm["phase_state"],
            norm["disposition"],
            _json_dump(norm.get("attributes") or {}),
            _json_dump(norm.get("spec")),
            _json_dump(log),
            norm.get("bin_reason"),
        ),
    )
    return public_id


def commit_import(
    cur,
    identity_id: int,
    document: dict[str, Any],
    *,
    policy: str = "additive",
    confirm: str | None = None,
) -> dict[str, Any]:
    policy = (policy or "additive").strip().lower()
    if policy in ("merge", "skip_existing"):
        policy = "additive"
    if policy == "replace_lab":
        if (confirm or "").strip() != "REPLACE_LAB":
            raise PermissionError("replace_lab requires confirm=REPLACE_LAB")

    preview = preview_import(cur, identity_id, document, policy=policy)
    if not preview.get("ok"):
        err = preview.get("error") or "phase_capacity"
        # Prefer first hard error code
        for iss in preview.get("issues") or []:
            if iss.get("level") == "error":
                err = iss.get("code") or err
                break
        raise ValueError(err if isinstance(err, str) else "import_failed")

    purged = 0
    recovery_id: str | None = None
    if policy == "replace_lab":
        # SLP-15: snapshot before purge; fail loud if snapshot fails
        try:
            prior = build_export_pack(
                cur,
                identity_id,
                include_email=False,
                label="auto-recovery before replace_lab",
            )
            recovery_id = save_recovery_snapshot(cur, identity_id, prior)
        except Exception as exc:
            raise RuntimeError(f"recovery_snapshot_failed: {exc}") from exc
        purged = purge_lab(cur, identity_id)

    created: list[str] = []
    skipped = 0
    export_key_map: dict[str, str] = {}
    seen: set[str] = set()

    for card in document.get("strategies") or []:
        norm, _issues = _normalize_card(card)
        if norm is None:
            continue
        ek = norm["export_key"]
        if ek in seen:
            skipped += 1
            continue
        seen.add(ek)

        if policy != "replace_lab":
            exists = _find_existing_by_export_key(cur, identity_id, ek)
            if exists is not None:
                skipped += 1
                continue

        pid = _insert_portable_card(cur, identity_id, norm, policy=policy)
        created.append(pid)
        if pid != ek:
            export_key_map[ek] = pid

    return {
        "ok": True,
        "policy": policy,
        "created": len(created),
        "skipped": skipped,
        "purged": purged,
        "public_ids_created": created,
        "export_key_map": export_key_map,
        "recovery_id": recovery_id,
    }


def build_exercise_pack(*, email: str = "exercise@labs.test") -> dict[str, Any]:
    """Full state-coverage fixture: one card per legal phase_state (20 cards)."""
    strategies: list[dict[str, Any]] = []
    n = 0
    for phase in PHASES:
        for sk, label in PHASE_STATES[phase]:
            n += 1
            pid = f"ex{phase[:3]}{sk[:6]}{n:02d}"[:16]
            # ensure valid id shape
            pid = "".join(c if c.isalnum() or c in "_-" else "" for c in pid)[:16]
            if len(pid) < 4:
                pid = f"ex{n:04d}"
            disposition = sk if phase == "bin" else "active"
            strategies.append(
                {
                    "id": pid,
                    "export_key": pid,
                    "product_key": pid,
                    "name": f"{_phase_label_short(phase)} · {label}",
                    "description": (
                        f"Exercise pack skeleton — {PHASE_LABELS[phase]} / {label}."
                    ),
                    "version": "1.0.0",
                    "version_major": 1,
                    "version_minor": 0,
                    "version_patch": 0,
                    "phase": phase,
                    "phase_state": sk,
                    "disposition": disposition,
                    "bin_reason": "Exercise pack" if phase == "bin" else None,
                    "attributes": {},
                    "evidence": [],
                    "spec": None,
                    "lifecycle_log": [
                        {
                            "at": _now_iso(),
                            "event": "created",
                            "phase": phase,
                            "phase_state": sk,
                            "version": "1.0.0",
                            "reason": "exercise pack",
                        }
                    ],
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                }
            )
    counts = count_by_phase(strategies)
    return {
        "format": FORMAT_ID,
        "model_version": MODEL_VERSION,
        "foundation_version": FOUNDATION_VERSION,
        "exported_at": _now_iso(),
        "source": {
            "system": "fattail-labs",
            "env": "dev",
            "app": "strategy-lab",
        },
        "identity": {"export_subject": "self", "email": email},
        "lab": {
            "schema_version": LAB_SCHEMA_VERSION,
            "label": "F1 exercise pack — full phase_state coverage",
            "counts": {
                "development": counts["development"],
                "curation": counts["curation"],
                "deployment": counts["deployment"],
                "bin": counts["bin"],
                "total": counts["total"],
            },
        },
        "strategies": strategies,
        "campaigns": [],
        "reports": [],
        "lab_settings": {},
    }


# ── Strategy pack config on cards (Pack Spec §3.3) ─────────────────────────

def set_pack_config(
    cur,
    identity_id: int,
    public_id: str,
    *,
    pack_id: str,
    pack_version: str,
    config: dict[str, Any],
    bump_version: bool = True,
) -> dict[str, Any]:
    """Validate via pack, persist attributes, optional minor version bump."""
    from strategy_packs.registry import get_pack_or_raise

    mod = get_pack_or_raise(pack_id)
    result = mod.validate(config)
    if not result.get("valid"):
        raise ValueError(
            "invalid_pack_config: " + "; ".join(result.get("errors") or ["invalid"])
        )

    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")

    attrs = _json_load(row.get("attributes_json")) or {}
    if not isinstance(attrs, dict):
        attrs = {}
    cfg = dict(config)
    cfg["pack_id"] = pack_id
    cfg["pack_version"] = pack_version
    attrs["strategy_pack@1"] = {"pack_id": pack_id, "pack_version": pack_version}
    bag_key = f"{pack_id}_config@1"
    attrs[bag_key] = cfg
    # alias for butterfly
    if pack_id == "butterfly":
        attrs["butterfly_config@1"] = cfg

    log = _append_log(
        row,
        "pack_config_save",
        pack_id=pack_id,
        pack_version=pack_version,
        config_name=str(cfg.get("name") or ""),
    )
    name = str(cfg.get("name") or row.get("name") or "Untitled strategy")[:255]
    description = str(cfg.get("description") or row.get("description") or "")[:512]

    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, lifecycle_log = %s, name = %s, description = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            _json_dump(log),
            name,
            description,
            identity_id,
            public_id,
        ),
    )
    if bump_version:
        return bump_version_fn(
            cur,
            identity_id,
            public_id,
            part="minor",
            reason=f"pack_config_save:{pack_id}",
        )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return row_to_dict(out)


def get_pack_config(strategy: dict[str, Any]) -> dict[str, Any] | None:
    attrs = strategy.get("attributes") or {}
    if not isinstance(attrs, dict):
        return None
    pack_meta = attrs.get("strategy_pack@1") or {}
    pack_id = str(pack_meta.get("pack_id") or "butterfly")
    bag = attrs.get(f"{pack_id}_config@1") or attrs.get("butterfly_config@1")
    return bag if isinstance(bag, dict) else None


# ── replace_lab recovery (Portability SLP-15) ──────────────────────────────

RECOVERY_RETENTION_DAYS = 14
RECOVERY_MAX_PER_IDENTITY = 5


def ensure_recovery_table(cur) -> None:
    """Idempotent DDL for recovery blobs (also in migration 079)."""
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS strategy_lab_recoveries (
          id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          identity_id   BIGINT UNSIGNED NOT NULL,
          recovery_id   VARCHAR(32) NOT NULL,
          pack_json     JSON NOT NULL,
          created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at    TIMESTAMP NOT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY uq_slr_recovery (recovery_id),
          KEY ix_slr_owner_created (identity_id, created_at),
          CONSTRAINT fk_slr_identity FOREIGN KEY (identity_id)
            REFERENCES identities (identity_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    )


def save_recovery_snapshot(
    cur,
    identity_id: int,
    pack: dict[str, Any],
) -> str:
    ensure_recovery_table(cur)
    rid = secrets.token_hex(8)
    cur.execute(
        """INSERT INTO strategy_lab_recoveries
           (identity_id, recovery_id, pack_json, expires_at)
           VALUES (%s, %s, %s, DATE_ADD(UTC_TIMESTAMP(), INTERVAL %s DAY))""",
        (
            identity_id,
            rid,
            _json_dump(pack),
            RECOVERY_RETENTION_DAYS,
        ),
    )
    # FIFO cap
    cur.execute(
        """SELECT recovery_id FROM strategy_lab_recoveries
           WHERE identity_id = %s
           ORDER BY created_at DESC, id DESC""",
        (identity_id,),
    )
    rows = cur.fetchall() or []
    if len(rows) > RECOVERY_MAX_PER_IDENTITY:
        drop = [r["recovery_id"] for r in rows[RECOVERY_MAX_PER_IDENTITY:]]
        for d in drop:
            cur.execute(
                "DELETE FROM strategy_lab_recoveries WHERE identity_id = %s AND recovery_id = %s",
                (identity_id, d),
            )
    return rid


def list_recoveries(cur, identity_id: int) -> list[dict[str, Any]]:
    ensure_recovery_table(cur)
    cur.execute(
        """SELECT recovery_id, created_at, expires_at, pack_json
           FROM strategy_lab_recoveries
           WHERE identity_id = %s AND expires_at > UTC_TIMESTAMP()
           ORDER BY created_at DESC, id DESC
           LIMIT %s""",
        (identity_id, RECOVERY_MAX_PER_IDENTITY),
    )
    out = []
    for r in cur.fetchall() or []:
        pack = _json_load(r.get("pack_json")) or {}
        counts = (pack.get("lab") or {}).get("counts") if isinstance(pack, dict) else {}
        out.append(
            {
                "recovery_id": r["recovery_id"],
                "created_at": r["created_at"].isoformat() + "Z"
                if hasattr(r["created_at"], "isoformat")
                else str(r.get("created_at") or ""),
                "expires_at": r["expires_at"].isoformat() + "Z"
                if hasattr(r["expires_at"], "isoformat")
                else str(r.get("expires_at") or ""),
                "counts": counts,
                "label": (pack.get("lab") or {}).get("label")
                if isinstance(pack, dict)
                else None,
            }
        )
    return out


def load_recovery_pack(cur, identity_id: int, recovery_id: str) -> dict[str, Any] | None:
    ensure_recovery_table(cur)
    cur.execute(
        """SELECT pack_json FROM strategy_lab_recoveries
           WHERE identity_id = %s AND recovery_id = %s
             AND expires_at > UTC_TIMESTAMP()
           LIMIT 1""",
        (identity_id, recovery_id),
    )
    row = cur.fetchone()
    if not row:
        return None
    pack = _json_load(row.get("pack_json"))
    return pack if isinstance(pack, dict) else None


# ── Development validation: back test + forward walk ───────────────────────

def _validation_bag(attrs: dict[str, Any]) -> dict[str, Any]:
    bag = attrs.get("validation@1")
    return dict(bag) if isinstance(bag, dict) else {}


def validation_gaps(strategy: dict[str, Any]) -> list[str]:
    """What is still required before Development → Curation."""
    attrs = strategy.get("attributes") if isinstance(strategy.get("attributes"), dict) else {}
    bag = _validation_bag(attrs)
    gaps: list[str] = []
    bt = bag.get("backtest")
    if not isinstance(bt, dict) or bt.get("status") not in ("pass", "completed"):
        gaps.append("Back test not completed")
    fw = bag.get("forward_walk")
    if not isinstance(fw, dict) or fw.get("status") not in ("pass", "completed"):
        gaps.append("Forward walk not completed")
    return gaps


def _stub_backtest_metrics(config: dict[str, Any] | None) -> dict[str, Any]:
    """Deterministic placeholder metrics until Massive/process plugins land."""
    # Seed from capital so results look config-sensitive, not random theater
    try:
        cap = float((config or {}).get("max_capital_at_risk") or 500)
    except (TypeError, ValueError):
        cap = 500.0
    family = str((config or {}).get("butterfly_family") or "batman")
    trades = 24 if family == "batman" else 18
    return {
        "mode": "stub_is",
        "label": "In-sample back test (stub)",
        "trades": trades,
        "win_rate": None,  # not primary; omitted from rank doctrine
        "max_drawdown_dollars": round(cap * 0.22, 2),
        "avg_drawdown_dollars": round(cap * 0.08, 2),
        "net_pnl_dollars": round(cap * 0.15, 2),
        "return_over_avg_dd": round(0.15 / 0.08, 3) if cap else None,
        "sortino_proxy": 1.1,
        "sharpe_proxy": 0.85,
        "primary_metric": str((config or {}).get("primary_metric") or "sortino"),
        "note": (
            "Stub engine — not live fills. Proves pack settings pipeline; "
            "Massive/historical chain will replace this."
        ),
    }


def _stub_forward_walk_metrics(config: dict[str, Any] | None) -> dict[str, Any]:
    try:
        cap = float((config or {}).get("max_capital_at_risk") or 500)
    except (TypeError, ValueError):
        cap = 500.0
    folds = [
        {
            "fold": 1,
            "train": "IS window A",
            "test": "Holdout 1",
            "trades": 6,
            "max_drawdown_dollars": round(cap * 0.12, 2),
            "net_pnl_dollars": round(cap * 0.04, 2),
        },
        {
            "fold": 2,
            "train": "IS window B",
            "test": "Holdout 2",
            "trades": 5,
            "max_drawdown_dollars": round(cap * 0.15, 2),
            "net_pnl_dollars": round(cap * 0.02, 2),
        },
        {
            "fold": 3,
            "train": "IS window C",
            "test": "Holdout 3",
            "trades": 7,
            "max_drawdown_dollars": round(cap * 0.10, 2),
            "net_pnl_dollars": round(cap * 0.05, 2),
        },
    ]
    return {
        "mode": "stub_forward_walk",
        "label": "Forward walk / walk-forward (stub)",
        "folds": folds,
        "trades": sum(int(f["trades"]) for f in folds),
        "max_drawdown_dollars": round(cap * 0.18, 2),
        "avg_drawdown_dollars": round(cap * 0.09, 2),
        "net_pnl_dollars": round(cap * 0.11, 2),
        "return_over_avg_dd": round(0.11 / 0.09, 3),
        "sortino_proxy": 0.95,
        "stability_note": "Folds pass if no fold exceeds capital-at-risk cap",
        "note": (
            "Stub walk-forward — validates settings on rolling holdouts before "
            "Curation (paper/live). Not live market execution."
        ),
    }


def run_backtest(
    cur,
    identity_id: int,
    public_id: str,
) -> dict[str, Any]:
    """IS back test of current pack settings; stamps validation@1.backtest; state → is_test."""
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    phase = normalize_phase(row["phase"])
    if phase != "development":
        raise ValueError("Back test only runs in Development phase")

    strategy = row_to_dict(row)
    config = get_pack_config(strategy)
    metrics = _stub_backtest_metrics(config)
    provenance = {
        "source": "stub",
        "label": "Development back-test stub (not live market)",
        "asof": _now_iso(),
    }
    # Soft fail if max DD exceeds capital at risk
    status = "pass"
    try:
        cap = float((config or {}).get("max_capital_at_risk") or 1e12)
        if metrics["max_drawdown_dollars"] > cap * 1.01:
            status = "fail"
    except (TypeError, ValueError):
        pass

    entry = {
        "at": _now_iso(),
        "status": status,
        "kind": "is_backtest",
        "schema_version": 1,
        "metrics": metrics,
        "data_provenance": provenance,
        "pack_id": (config or {}).get("pack_id") or "butterfly",
    }
    attrs = strategy.get("attributes") if isinstance(strategy.get("attributes"), dict) else {}
    attrs = dict(attrs)
    bag = _validation_bag(attrs)
    bag["backtest"] = entry
    attrs["validation@1"] = bag

    log = _append_log(
        row,
        "backtest",
        status=status,
        phase_state="is_test",
        max_dd=metrics.get("max_drawdown_dollars"),
    )
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, phase_state = %s, disposition = %s,
               lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            "is_test",
            "active",
            _json_dump(log),
            identity_id,
            public_id,
        ),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return {
        "strategy": row_to_dict(out),
        "result": entry,
    }


def run_forward_walk(
    cur,
    identity_id: int,
    public_id: str,
) -> dict[str, Any]:
    """Walk-forward validation; stamps validation@1.forward_walk; state → oos_test.

    Requires a prior back test. Does not move to Curation — that stays Promote after Deployed.
    """
    row = get_by_public_id(cur, identity_id, public_id)
    if row is None:
        raise LookupError("Strategy not found")
    phase = normalize_phase(row["phase"])
    if phase != "development":
        raise ValueError("Forward walk only runs in Development phase")

    strategy = row_to_dict(row)
    bag = _validation_bag(
        strategy.get("attributes") if isinstance(strategy.get("attributes"), dict) else {}
    )
    bt = bag.get("backtest")
    if not isinstance(bt, dict) or bt.get("status") not in ("pass", "completed"):
        raise ValueError("Run Back test successfully before Forward walk")

    config = get_pack_config(strategy)
    metrics = _stub_forward_walk_metrics(config)
    provenance = {
        "source": "stub",
        "label": "Development forward-walk stub (not live market)",
        "asof": _now_iso(),
    }
    status = "pass"
    try:
        cap = float((config or {}).get("max_capital_at_risk") or 1e12)
        if metrics["max_drawdown_dollars"] > cap * 1.01:
            status = "fail"
    except (TypeError, ValueError):
        pass

    entry = {
        "at": _now_iso(),
        "status": status,
        "kind": "forward_walk",
        "schema_version": 1,
        "metrics": metrics,
        "data_provenance": provenance,
        "pack_id": (config or {}).get("pack_id") or "butterfly",
    }
    attrs = strategy.get("attributes") if isinstance(strategy.get("attributes"), dict) else {}
    attrs = dict(attrs)
    bag = _validation_bag(attrs)
    bag["forward_walk"] = entry
    attrs["validation@1"] = bag

    log = _append_log(
        row,
        "forward_walk",
        status=status,
        phase_state="oos_test",
        folds=len(metrics.get("folds") or []),
    )
    # After successful walk, advance to Deployed so Promote is available
    next_state = "deployed" if status in ("pass", "completed") else "oos_test"
    cur.execute(
        """UPDATE strategy_lab_strategies
           SET attributes_json = %s, phase_state = %s, disposition = %s,
               lifecycle_log = %s
           WHERE identity_id = %s AND public_id = %s""",
        (
            _json_dump(attrs),
            next_state,
            "active",
            _json_dump(log),
            identity_id,
            public_id,
        ),
    )
    out = get_by_public_id(cur, identity_id, public_id)
    assert out is not None
    return {
        "strategy": row_to_dict(out),
        "result": entry,
        "ready_for_curation": next_state == "deployed" and status in ("pass", "completed"),
    }
