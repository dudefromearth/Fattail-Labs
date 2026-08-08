"""Config — env-driven, fail loud. No silent defaults for anything structural."""

import os


class ConfigError(RuntimeError):
    pass


def _require(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise ConfigError(f"Missing required environment variable: {name}")
    return value


def _require_int(name: str) -> int:
    raw = _require(name)
    try:
        return int(raw)
    except ValueError as exc:
        raise ConfigError(f"{name} must be an integer, got {raw!r}") from exc


def _require_secret(name: str) -> str:
    value = _require(name)
    if len(value) < 32:
        raise ConfigError(f"{name} must be at least 32 characters (HS256 key strength)")
    return value


class Config:
    """Loaded once at startup. Any missing value aborts boot."""

    def __init__(self) -> None:
        self.env = _require("LABS_ENV")  # dev | staging | production
        if self.env not in ("dev", "staging", "production"):
            raise ConfigError(f"LABS_ENV must be dev|staging|production, got {self.env!r}")

        self.port = _require_int("LABS_PORT")

        # MySQL
        self.db_host = _require("LABS_DB_HOST")
        self.db_port = _require_int("LABS_DB_PORT")
        self.db_user = _require("LABS_DB_USER")
        self.db_password = _require("LABS_DB_PASSWORD")
        self.db_name = _require("LABS_DB_NAME")

        # Dual-issuer SSO secrets (HS256, one secret per issuer; RFC 7518 minimum length)
        self.sso_secrets = {
            "fattail": _require_secret("LABS_SSO_SECRET_FATTAIL"),
            "0-dte": _require_secret("LABS_SSO_SECRET_0DTE"),
        }

        # Session JWT
        self.session_secret = _require_secret("LABS_SESSION_SECRET")
        self.session_cookie = "ft_session"
        self.session_ttl_seconds = _require_int("LABS_SESSION_TTL_SECONDS")
        # Cookie domain: ".fattail.ai" in staging/production; empty (host-only) in dev.
        self.cookie_domain = os.environ.get("LABS_COOKIE_DOMAIN", "").strip()
        if self.env != "dev" and not self.cookie_domain:
            raise ConfigError("LABS_COOKIE_DOMAIN is required outside dev")

        # Labs admin allowlist (H3) — emails that may receive role_override=administrator
        # via WordPress SSO is_admin. Outside dev this list is required (fail loud).
        # Empty in production is invalid; in dev empty means no SSO auto-admin.
        raw_admins = os.environ.get("LABS_ADMIN_EMAILS", "").strip()
        self.admin_emails: frozenset[str] = frozenset(
            e.strip().lower() for e in raw_admins.split(",") if e.strip()
        )
        if self.env != "dev" and not self.admin_emails:
            raise ConfigError(
                "LABS_ADMIN_EMAILS is required outside dev "
                "(comma-separated emails allowed as Labs administrators via SSO)"
            )

        # Entitlement mapping lives in the database (plans + provider_plan_map),
        # per FatTail-Labs-Identity-Access-Spec-v1.0 §2 — no env mapping.

        # Native billing (Stripe) — ALL optional; absence disables the provider
        # (Native Billing spec §2). Web origin is validated when billing is used.
        self.stripe_secret_key = os.environ.get("STRIPE_SECRET_KEY", "").strip() or None
        self.stripe_webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "").strip() or None
        self.web_origin = os.environ.get("LABS_WEB_ORIGIN", "").strip() or None

        # Playbook scrapbook archive + version retention (Spec v1.1a · OD fail-loud)
        self.playbook_archive_mime_allowlist = _require(
            "LABS_PLAYBOOK_ARCHIVE_MIME_ALLOWLIST"
        )
        self.playbook_archive_max_files = _require_int("LABS_PLAYBOOK_ARCHIVE_MAX_FILES")
        self.playbook_archive_max_bytes_per_file = _require_int(
            "LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_FILE"
        )
        self.playbook_archive_max_bytes_per_book = _require_int(
            "LABS_PLAYBOOK_ARCHIVE_MAX_BYTES_PER_BOOK"
        )
        self.playbook_export_max_zip_bytes = _require_int(
            "LABS_PLAYBOOK_EXPORT_MAX_ZIP_BYTES"
        )
        self.playbook_version_retention_count = _require_int(
            "LABS_PLAYBOOK_VERSION_RETENTION_COUNT"
        )
        if self.playbook_version_retention_count < 1:
            raise ConfigError(
                "LABS_PLAYBOOK_VERSION_RETENTION_COUNT must be >= 1 (permanence floor)"
            )
        # Media dir optional path; empty → server/var/playbook_media
        self.playbook_media_dir = os.environ.get("LABS_PLAYBOOK_MEDIA_DIR", "").strip()


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config()
    return _config


def reset_config_for_tests() -> None:
    """Drop cached Config so env changes apply (tests only)."""
    global _config
    _config = None
