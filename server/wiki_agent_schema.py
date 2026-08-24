"""Wiki Agent contract envelope v1 + Source Contract v0.1.4 (SC-1).

Seam (India SC-1-0 · GO SC-1): one portal. `source_kind` present → Source
Contract schema. `kind=session` without `source_kind` unchanged. No second
portal. No second store of page bytes.
"""

from __future__ import annotations

from urllib.parse import urlparse

KINDS = frozenset({"source_change", "registration", "session"})
SOURCE_CHANGES = frozenset({"created", "updated", "retired"})
FAMILY_B_PREFIXES = (
    "/app/practice",
    "/app/trade-log",
    "/app/journal",
    "/app/capital",
    "/app/playbook",
)


class ContractSchemaError(ValueError):
    def __init__(self, reason: str):
        super().__init__(reason)
        self.reason = reason


def _path_only_url(raw: str) -> str:
    s = str(raw or "").strip()
    if not s:
        raise ContractSchemaError("canonical_url required")
    if "://" in s:
        path = urlparse(s).path or ""
        query = urlparse(s).query
        if query:
            raise ContractSchemaError("family_b_ref")
    else:
        if "?" in s or "#" in s:
            raise ContractSchemaError("family_b_ref")
        path = s
    if not path.startswith("/"):
        raise ContractSchemaError("canonical_url must be a path")
    lower = path.lower()
    if any(lower == p or lower.startswith(p + "/") for p in FAMILY_B_PREFIXES):
        raise ContractSchemaError("family_b_ref")
    return path


def _ref(item: object) -> dict:
    if not isinstance(item, dict):
        raise ContractSchemaError("refs[] entries must be objects")
    kind = str(item.get("kind") or "").strip()
    rid = str(item.get("id") or "").strip()
    url = _path_only_url(str(item.get("canonical_url") or ""))
    if not kind or not rid:
        raise ContractSchemaError("refs[] need kind, id, canonical_url")
    extra = set(item.keys()) - {"kind", "id", "canonical_url"}
    if extra:
        raise ContractSchemaError("unknown ref field")
    return {"kind": kind, "id": rid, "canonical_url": url}


def _entity(raw: object) -> dict:
    return _ref(raw)


def parse_envelope(body: object) -> dict:
    if not isinstance(body, dict):
        raise ContractSchemaError("schema_invalid")
    extra = set(body.keys()) - {
        "contract_version",
        "kind",
        "source",
        "principal",
        "refs",
        "payload",
        "contract_id",
        "delivered_at",
    }
    if extra:
        raise ContractSchemaError("unknown_field")
    version = str(body.get("contract_version") or "").strip()
    if version != "1":
        raise ContractSchemaError("unknown_contract_version")
    kind = str(body.get("kind") or "").strip()
    if kind not in KINDS:
        raise ContractSchemaError("schema_invalid")
    source = str(body.get("source") or "").strip()
    if not source:
        raise ContractSchemaError("schema_invalid")
    refs_raw = body.get("refs", [])
    if refs_raw is None:
        refs_raw = []
    if not isinstance(refs_raw, list):
        raise ContractSchemaError("schema_invalid")
    refs = [_ref(r) for r in refs_raw]
    payload = body.get("payload")
    if not isinstance(payload, dict):
        raise ContractSchemaError("schema_invalid")
    if kind == "source_change":
        payload = _source_change_payload(payload)
        if source == "admin-session":
            raise ContractSchemaError("schema_invalid")
    elif kind == "registration":
        payload = _registration_payload(payload)
        if source == "admin-session":
            raise ContractSchemaError("schema_invalid")
    else:
        payload = _session_payload(payload)
        if source != "admin-session":
            raise ContractSchemaError("schema_invalid")
    return {
        "contract_version": "1",
        "kind": kind,
        "source": source,
        "refs": refs,
        "payload": payload,
    }


def _source_change_payload(p: dict) -> dict:
    extra = set(p.keys()) - {"change", "entity", "summary", "content_pointer"}
    if extra:
        raise ContractSchemaError("unknown_field")
    change = str(p.get("change") or "").strip()
    if change not in SOURCE_CHANGES:
        raise ContractSchemaError("schema_invalid")
    summary = str(p.get("summary") or "").strip()
    pointer = str(p.get("content_pointer") or "").strip()
    if not summary or not pointer:
        raise ContractSchemaError("schema_invalid")
    return {
        "change": change,
        "entity": _entity(p.get("entity")),
        "summary": summary,
        "content_pointer": pointer,
    }


def _registration_payload(p: dict) -> dict:
    ident = str(p.get("template_id") or "").strip()
    version = str(p.get("template_version") or "").strip()
    if not ident or not version:
        raise ContractSchemaError("schema_invalid")
    return dict(p)


def _session_payload(p: dict) -> dict:
    ctx = p.get("context")
    if not isinstance(ctx, dict):
        raise ContractSchemaError("schema_invalid")
    surface = str(ctx.get("surface") or "").strip()
    route = str(ctx.get("route") or "").strip()
    if not surface or not route:
        raise ContractSchemaError("schema_invalid")
    if "?" in route or "#" in route:
        raise ContractSchemaError("family_b_ref")
    entity = ctx.get("entity")
    if entity in (None, "", {}):
        entity_out = None
    else:
        entity_out = _entity(entity)
    # Open: transcript optional/empty. Accretion is WA-4.
    transcript = p.get("transcript", [])
    if transcript in (None, ""):
        transcript = []
    if not isinstance(transcript, list):
        raise ContractSchemaError("schema_invalid")
    return {
        "context": {
            "surface": surface,
            "route": route,
            "entity": entity_out,
        },
        "transcript": transcript,
    }


# --- Source Contract v0.1.4 (SC-1) -----------------------------------------

SOURCE_KINDS = frozenset(
    {
        "help_guide",
        "course",
        "iki_factory_template",
        "transcript",
        "youtube",
        "blog",
        "admin_push",
    }
)
BODY_FORMATS = frozenset({"markdown", "transcript", "html", "structured"})
CHANGE_TYPES = frozenset({"created", "updated", "unpublished"})
ACQUIRED_BY = frozenset({"poll", "push", "subscribe", "skill"})
SOURCE_REQUIRED = (
    "source_kind",
    "source_id",
    "title",
    "body",
    "body_format",
    "intent",
    "origin_ref",
    "origin_owner",
    "change_type",
    "submitted_at",
    "content_hash",
)
SOURCE_OPTIONAL = frozenset(
    {
        "version",
        "subject_terms",
        "linkage_hints",
        "changed_summary",
        "supersedes",
        "access",
        "publish_gate",
        "acquired_by",
        "contract_version",
    }
)
SOURCE_ALLOWED = frozenset(SOURCE_REQUIRED) | SOURCE_OPTIONAL


class SourceEnvelopeIncomplete(ValueError):
    """Required Source Contract fields absent — failed-partial, not invention."""

    def __init__(self, missing: list[str]):
        self.missing = list(missing)
        self.reason = "incomplete_required_set:" + ",".join(self.missing)
        super().__init__(self.reason)


def has_source_kind(body: object) -> bool:
    return isinstance(body, dict) and "source_kind" in body


def parse_source_envelope(body: object) -> dict:
    """Parse a Source Contract envelope. Does not invent missing substance."""
    if not isinstance(body, dict):
        raise ContractSchemaError("schema_invalid")
    extra = set(body.keys()) - SOURCE_ALLOWED
    if extra:
        raise ContractSchemaError("unknown_field")

    kind_raw = str(body.get("source_kind") or "").strip()
    if kind_raw and kind_raw not in SOURCE_KINDS:
        raise ContractSchemaError("unknown_source_kind")

    acquired_raw = body.get("acquired_by")
    if acquired_raw not in (None, ""):
        acquired = str(acquired_raw).strip()
        if acquired not in ACQUIRED_BY:
            raise ContractSchemaError("unknown_acquired_by")

    fmt_raw = str(body.get("body_format") or "").strip()
    if fmt_raw and fmt_raw not in BODY_FORMATS:
        raise ContractSchemaError("unknown_body_format")

    change_raw = str(body.get("change_type") or "").strip()
    if change_raw and change_raw not in CHANGE_TYPES:
        raise ContractSchemaError("unknown_change_type")

    missing: list[str] = []
    values: dict = {}
    for key in SOURCE_REQUIRED:
        raw = body.get(key)
        if isinstance(raw, str):
            val = raw.strip()
        elif raw is None:
            val = ""
        else:
            val = raw
        if val in ("", None):
            missing.append(key)
        else:
            values[key] = val if not isinstance(val, str) else str(val).strip()

    if missing:
        raise SourceEnvelopeIncomplete(missing)

    for key in SOURCE_OPTIONAL:
        if key == "contract_version":
            continue
        if key not in body or body.get(key) in (None, ""):
            continue
        values[key] = body[key]

    values["contract_version"] = "0.1.4"
    return values
