"""IKI Factory attachment storage (IF-6). Admin-only uploads, disk-backed.

Config-driven, fail loud on write. Not the journal's Family B media root —
this is an admin production surface, not member content.
"""

from __future__ import annotations

import os
import uuid
from pathlib import Path

ALLOWED_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}
DEFAULT_MAX_BYTES = 20 * 1024 * 1024
MAX_PER_CARD = 50


class MediaError(Exception):
    def __init__(self, code: int, detail: str):
        self.code = code
        self.detail = detail
        super().__init__(detail)


def media_root() -> Path:
    raw = (os.environ.get("LABS_IKI_FACTORY_MEDIA_DIR") or "").strip()
    if raw:
        return Path(raw)
    # Dev default — configure LABS_IKI_FACTORY_MEDIA_DIR explicitly in staging/prod.
    return Path(__file__).resolve().parent / "var" / "iki_factory_media"


def max_bytes() -> int:
    try:
        return int(os.environ.get("LABS_IKI_FACTORY_MEDIA_MAX_BYTES") or DEFAULT_MAX_BYTES)
    except ValueError:
        return DEFAULT_MAX_BYTES


def save_upload(card_id: int, filename: str, content_type: str, data: bytes) -> dict:
    ext = ALLOWED_TYPES.get(content_type)
    if not ext:
        raise MediaError(415, f"unsupported content_type: {content_type}")
    if len(data) > max_bytes():
        raise MediaError(413, f"file exceeds {max_bytes()} bytes")
    root = media_root() / str(card_id)
    root.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4().hex}{ext}"
    path = root / stored_name
    path.write_bytes(data)
    return {
        "storage_path": str(path),
        "served_url": f"/api/admin/iki-factory/cards/{card_id}/attachments/file/{stored_name}",
        "stored_name": stored_name,
    }


def read_upload(card_id: int, stored_name: str) -> bytes:
    path = media_root() / str(card_id) / stored_name
    if not path.is_file():
        raise MediaError(404, "file not found")
    return path.read_bytes()
