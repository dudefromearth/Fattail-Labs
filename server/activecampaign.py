"""ActiveCampaign lead sync — push free waitlist signups to AC as contacts
tagged "Labs Lead".

Optional integration, modelled on notify.py (SMTP):
  - Absent config (LABS_AC_API_URL / LABS_AC_API_TOKEN unset) => disabled;
    sync_lead() returns {"status": "skipped"} and the waitlist still works.
  - Half-configured, or LABS_AC_REQUIRED=1 with no config => fail loud (ACError),
    surfaced as {"status": "failed"} — never raised to the request.
  - sync_lead() NEVER raises: the waitlist write must not fail on AC problems.

Scope (v1): FREE leads only. Purchasers are handled WooCommerce-side by the
WordPress membership-auto-upgrade plugin; Labs does not tag customers here.

Account: shared FatTail / 0-DTE ActiveCampaign (e.g. https://0dte.api-us1.com).
Spec: FatTail-Labs-ActiveCampaign-Lead-Sync-Spec-v1.0.md
"""

from __future__ import annotations

import logging
import os

import httpx

log = logging.getLogger("labs.activecampaign")

DEFAULT_LEAD_TAG = "Labs Lead"
DEFAULT_TIMEOUT_SECONDS = 15


class ACError(Exception):
    pass


def _ac_config() -> dict | None:
    """AC settings, or None when the integration is disabled.

    URL and token must be present together; one without the other is a
    misconfiguration and fails loud. LABS_AC_REQUIRED=1 turns "not configured"
    into a hard error when a sync is attempted.
    """
    url = os.environ.get("LABS_AC_API_URL", "").strip().rstrip("/")
    token = os.environ.get("LABS_AC_API_TOKEN", "").strip()
    required = os.environ.get("LABS_AC_REQUIRED", "").strip() == "1"

    if not url and not token:
        if required:
            raise ACError(
                "LABS_AC_REQUIRED=1 but LABS_AC_API_URL / LABS_AC_API_TOKEN are unset"
            )
        return None
    if not url or not token:
        raise ACError(
            "ActiveCampaign is half-configured: set BOTH LABS_AC_API_URL and "
            "LABS_AC_API_TOKEN, or neither"
        )
    if not url.startswith(("http://", "https://")):
        raise ACError(f"LABS_AC_API_URL must be an http(s) URL, got {url!r}")

    tag = os.environ.get("LABS_AC_LEAD_TAG", "").strip() or DEFAULT_LEAD_TAG
    timeout_raw = os.environ.get("LABS_AC_TIMEOUT", "").strip()
    try:
        timeout = int(timeout_raw) if timeout_raw else DEFAULT_TIMEOUT_SECONDS
    except ValueError as exc:
        raise ACError(
            f"LABS_AC_TIMEOUT must be an integer, got {timeout_raw!r}"
        ) from exc

    return {
        "base": f"{url}/api/3",
        "token": token,
        "lead_tag": tag,
        "timeout": timeout,
    }


def _safe_body(resp: httpx.Response) -> str:
    try:
        return resp.text[:500]
    except Exception:  # noqa: BLE001
        return "<unreadable>"


def _request(
    cfg: dict,
    method: str,
    path: str,
    *,
    json: dict | None = None,
    params: dict | None = None,
    benign_statuses: tuple[int, ...] = (),
) -> dict:
    """Call the AC v3 API. Raises ACError on transport / HTTP / non-JSON errors.

    benign_statuses are treated as success and return {} (e.g. 422 duplicate
    when a contact already carries the tag).
    """
    url = f"{cfg['base']}{path}"
    headers = {"Api-Token": cfg["token"], "Accept": "application/json"}
    try:
        with httpx.Client(timeout=cfg["timeout"]) as client:
            resp = client.request(
                method, url, headers=headers, json=json, params=params
            )
    except httpx.HTTPError as exc:
        raise ACError(f"AC transport error on {method} {path}: {exc}") from exc

    if resp.status_code in benign_statuses:
        return {}
    if resp.status_code >= 400:
        raise ACError(
            f"AC HTTP {resp.status_code} on {method} {path}: {_safe_body(resp)}"
        )
    try:
        return resp.json()
    except ValueError as exc:
        raise ACError(f"AC returned non-JSON on {method} {path}") from exc


def _sync_contact(cfg: dict, email: str) -> str:
    """Create or update a contact by email; return its AC id (idempotent)."""
    data = _request(cfg, "POST", "/contact/sync", json={"contact": {"email": email}})
    contact = data.get("contact") or {}
    cid = contact.get("id")
    if not cid:
        raise ACError("AC contact/sync response missing contact id")
    return str(cid)


def _get_or_create_tag(cfg: dict, name: str) -> str:
    """Find a contact tag by exact (case-insensitive) name, else create it."""
    data = _request(cfg, "GET", "/tags", params={"search": name})
    for t in data.get("tags") or []:
        if str(t.get("tag", "")).strip().lower() == name.strip().lower():
            return str(t["id"])
    created = _request(
        cfg,
        "POST",
        "/tags",
        json={
            "tag": {
                "tag": name,
                "tagType": "contact",
                "description": "FatTail Labs waitlist lead",
            }
        },
    )
    tag = created.get("tag") or {}
    tid = tag.get("id")
    if not tid:
        raise ACError("AC tag create response missing tag id")
    return str(tid)


def _add_contact_tag(cfg: dict, contact_id: str, tag_id: str) -> None:
    """Attach a tag to a contact. Already-tagged (422) is treated as success."""
    _request(
        cfg,
        "POST",
        "/contactTags",
        json={"contactTag": {"contact": contact_id, "tag": tag_id}},
        benign_statuses=(422,),
    )


def sync_lead(
    email: str, *, source: str | None = None, surface_key: str | None = None
) -> dict:
    """Push a free waitlist email to ActiveCampaign as a contact carrying the
    lead tag. Best-effort: returns a status dict, NEVER raises.

    Returns {"status": "synced"|"skipped"|"failed", ...}:
      - synced:  contact upserted and tagged
      - skipped: AC integration disabled (no config)
      - failed:  config or API error (already logged)
    """
    email = (email or "").strip().lower()
    if not email:
        return {"status": "failed", "error": "empty email"}

    try:
        cfg = _ac_config()
    except ACError as exc:
        log.warning("AC config error: %s", exc)
        return {"status": "failed", "error": str(exc)[:512]}
    if cfg is None:
        return {"status": "skipped"}

    try:
        contact_id = _sync_contact(cfg, email)
        tag_id = _get_or_create_tag(cfg, cfg["lead_tag"])
        _add_contact_tag(cfg, contact_id, tag_id)
    except ACError as exc:
        log.warning(
            "AC lead sync failed for %s (source=%s surface=%s): %s",
            email, source, surface_key, exc,
        )
        return {"status": "failed", "error": str(exc)[:512]}
    except Exception as exc:  # noqa: BLE001 — never propagate to the waitlist write
        log.warning("AC lead sync unexpected error for %s: %s", email, exc)
        return {"status": "failed", "error": str(exc)[:512]}

    return {"status": "synced", "contact_id": contact_id, "tag_id": tag_id}
