"""Native apply write — Cole's seven ActiveCampaign handoff fields + tag 18.

This is NOT waitlist sync_lead(). Apply submit fails loud if ActiveCampaign
is unconfigured, if any of the seven fieldValues miss / are empty after
write, or if tag 18 Application Filled is missing on the contact.

Live field ids 3–9 stay (do not invent ids). Tag 18 stays (desk routing).
Spec: FatTail-Native-Apply-Form-Spec-v0.1.md · APPLY-2–5 · APPLY-10
"""

from __future__ import annotations

import logging

from activecampaign import ACError, _ac_config, _add_contact_tag, _request, _sync_contact

log = logging.getLogger("labs.apply_ac")

# Coach order 2026-08-19 walk. Live ids 3–9 stay. Do not rename keys.
APPLY_FIELDS: tuple[tuple[str, str], ...] = (
    ("HELL", "3"),
    ("HEAVEN", "4"),
    ("MONEY_TIMING", "5"),
    ("COACHING_SKU", "6"),
    ("ELEVEN_AM_ET", "7"),
    ("TRIED", "8"),
    ("PARTNER_SUPPORT", "9"),
)
APPLY_KEYS: tuple[str, ...] = tuple(k for k, _ in APPLY_FIELDS)
APPLY_FIELD_IDS: dict[str, str] = {k: fid for k, fid in APPLY_FIELDS}
APPLY_TAG_ID = "18"


def _require_ac_config() -> dict:
    """Apply never skips. Unconfigured or half-configured is a miss."""
    cfg = _ac_config()
    if cfg is None:
        raise ACError(
            "ActiveCampaign is not configured; apply cannot write "
            "(set LABS_AC_API_URL and LABS_AC_API_TOKEN)"
        )
    return cfg


def _normalize_answers(answers: dict | None) -> dict[str, str]:
    src = answers if isinstance(answers, dict) else {}
    out: dict[str, str] = {}
    missing: list[str] = []
    for key in APPLY_KEYS:
        raw = src.get(key)
        value = "" if raw is None else str(raw).strip()
        if not value:
            missing.append(key)
        else:
            out[key] = value
    if missing:
        raise ACError("empty apply field(s): " + ", ".join(missing))
    extra = [k for k in src if k not in APPLY_KEYS and str(k).strip()]
    if extra:
        # Sales fields are forbidden. Ignore unknown keys rather than write them.
        log.info("apply ignoring non-Cole keys: %s", extra)
    return out


def _upsert_field_values(cfg: dict, contact_id: str, values: dict[str, str]) -> None:
    existing = _request(cfg, "GET", f"/contacts/{contact_id}/fieldValues")
    by_field: dict[str, str] = {}
    for fv in existing.get("fieldValues") or []:
        fid = str(fv.get("field") or "").strip()
        vid = fv.get("id")
        if fid and vid:
            by_field[fid] = str(vid)
    for key, value in values.items():
        fid = APPLY_FIELD_IDS[key]
        vid = by_field.get(fid)
        payload = {"fieldValue": {"contact": contact_id, "field": fid, "value": value}}
        if vid:
            _request(cfg, "PUT", f"/fieldValues/{vid}", json=payload)
        else:
            _request(cfg, "POST", "/fieldValues", json=payload)


def _read_field_values(cfg: dict, contact_id: str) -> dict[str, str]:
    data = _request(cfg, "GET", f"/contacts/{contact_id}/fieldValues")
    out: dict[str, str] = {}
    for fv in data.get("fieldValues") or []:
        fid = str(fv.get("field") or "").strip()
        if not fid:
            continue
        raw = fv.get("value")
        out[fid] = "" if raw is None else str(raw).strip()
    return out


def _contact_has_tag(cfg: dict, contact_id: str, tag_id: str) -> bool:
    data = _request(cfg, "GET", f"/contacts/{contact_id}/contactTags")
    want = str(tag_id)
    for ct in data.get("contactTags") or []:
        if str(ct.get("tag") or "").strip() == want:
            return True
    return False


def _verify_seven(written: dict[str, str]) -> list[str]:
    """Law is non-empty on all seven (APPLY-5). Do not invent a value match."""
    misses: list[str] = []
    for key, fid in APPLY_FIELDS:
        got = (written.get(fid) or "").strip()
        if not got:
            misses.append(f"{key}(id {fid}) empty")
    return misses


def write_application(email: str, answers: dict | None) -> dict:
    """Upsert the contact, write ids 3–9, attach tag 18, read back.

    Raises ACError on any miss. Never returns a silent success. Never calls
    sync_lead().
    """
    email = (email or "").strip().lower()
    if not email:
        raise ACError("empty email")
    values = _normalize_answers(answers)
    cfg = _require_ac_config()

    contact_id = _sync_contact(cfg, email)
    _upsert_field_values(cfg, contact_id, values)
    _add_contact_tag(cfg, contact_id, APPLY_TAG_ID)

    written = _read_field_values(cfg, contact_id)
    field_misses = _verify_seven(written)
    if field_misses:
        raise ACError("apply fieldValues miss after write: " + "; ".join(field_misses))
    if not _contact_has_tag(cfg, contact_id, APPLY_TAG_ID):
        raise ACError("apply tag 18 Application Filled miss after write")

    return {
        "ok": True,
        "contact_id": contact_id,
        "tag_id": APPLY_TAG_ID,
        "fields": {k: APPLY_FIELD_IDS[k] for k in APPLY_KEYS},
    }
