"""SSO login URLs force WordPress reauth for account switching."""

from providers import force_wp_reauth_login_url, login_urls


def test_force_wp_reauth_wraps_fotw_sso():
    entry = (
        "https://fattail.ai/fotw-sso?redirect="
        "http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fsso%2Fwordpress%3Afattail"
    )
    out = force_wp_reauth_login_url(entry)
    assert out.startswith("https://fattail.ai/wp-login.php?reauth=1&redirect_to=")
    assert "fotw-sso" in out
    assert "fattail.ai" in out


def test_force_wp_reauth_0dte():
    entry = "https://0-dte.com/fotw-sso?redirect=https%3A%2F%2Flabs.fattail.ai%2Fapi%2Fauth%2Fsso%2Fwordpress%3A0-dte"
    out = force_wp_reauth_login_url(entry)
    assert out.startswith("https://0-dte.com/wp-login.php?reauth=1&redirect_to=")


def test_force_wp_reauth_passthrough_non_fotw():
    assert force_wp_reauth_login_url("https://example.com/login") == (
        "https://example.com/login"
    )


def test_login_urls_apply_reauth_by_default(monkeypatch):
    monkeypatch.setenv(
        "LABS_SSO_LOGIN_URL_FATTAIL",
        "https://fattail.ai/fotw-sso?redirect=http%3A%2F%2Flocalhost%3A3000%2Fcb",
    )
    monkeypatch.setenv(
        "LABS_SSO_LOGIN_URL_0DTE",
        "https://0-dte.com/fotw-sso?redirect=http%3A%2F%2Flocalhost%3A3000%2Fcb",
    )
    monkeypatch.delenv("LABS_SSO_FORCE_REAUTH", raising=False)
    urls = login_urls()
    assert "wordpress:fattail" in urls
    assert "wp-login.php?reauth=1" in urls["wordpress:fattail"]
    assert "wp-login.php?reauth=1" in urls["wordpress:0-dte"]


def test_login_urls_can_disable_reauth(monkeypatch):
    entry = "https://fattail.ai/fotw-sso?redirect=http%3A%2F%2Fx"
    monkeypatch.setenv("LABS_SSO_LOGIN_URL_FATTAIL", entry)
    monkeypatch.setenv("LABS_SSO_FORCE_REAUTH", "0")
    monkeypatch.delenv("LABS_SSO_LOGIN_URL_0DTE", raising=False)
    urls = login_urls()
    assert urls["wordpress:fattail"] == entry
