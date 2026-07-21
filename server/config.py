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

        # Entitlement mapping: WooCommerce plan slug -> role, per issuer.
        # Format: "issuer:slug=role,issuer:slug=role"
        # e.g. "fattail:labs-membership=activator,0-dte:coaching=navigator"
        self.entitlement_map = self._parse_entitlements(_require("LABS_ENTITLEMENTS"))

    @staticmethod
    def _parse_entitlements(raw: str) -> dict[tuple[str, str], str]:
        valid_roles = frozenset({"observer", "activator", "navigator", "administrator"})
        mapping: dict[tuple[str, str], str] = {}
        for entry in raw.split(","):
            entry = entry.strip()
            if not entry:
                continue
            try:
                issuer_slug, role = entry.split("=")
                issuer, slug = issuer_slug.split(":")
            except ValueError as exc:
                raise ConfigError(f"Bad LABS_ENTITLEMENTS entry: {entry!r}") from exc
            role = role.strip()
            if role not in valid_roles:
                raise ConfigError(f"Bad role {role!r} in LABS_ENTITLEMENTS entry: {entry!r}")
            mapping[(issuer.strip(), slug.strip())] = role
        if not mapping:
            raise ConfigError("LABS_ENTITLEMENTS parsed to an empty mapping")
        return mapping


_config: Config | None = None


def get_config() -> Config:
    global _config
    if _config is None:
        _config = Config()
    return _config
