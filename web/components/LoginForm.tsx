"use client";

import { useEffect, useState } from "react";
import { clearMeCache } from "@/lib/useIsAdmin";
import { clearLabDeskPlace } from "@/lib/strategyLabPlace";

const PROVIDER_LABELS: Record<string, string> = {
  "wordpress:fattail": "Continue with FatTail.ai",
  "wordpress:0-dte": "Continue with 0-DTE.com",
};

const PROVIDER_LOGOS: Record<string, string> = {
  "wordpress:fattail":
    "https://fattail.ai/wp-content/uploads/2026/05/cropped-fattail-logo-900x900-1-192x192.png",
  "wordpress:0-dte":
    "https://i0.wp.com/0-dte.com/wp-content/uploads/2021/04/cropped-0dte-zen-logo.png?fit=192%2C192&quality=80&ssl=1",
};

type ExistingMe = {
  identity_id: number;
  email?: string;
  display_name?: string;
  role?: string;
  access_role?: string;
};

/** Clear Labs session via API (nuclear cookie expire). */
async function clearLabsSession(): Promise<void> {
  clearMeCache();
  clearLabDeskPlace();
  try {
    await fetch("/api/auth/logout?json=1", {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
  } catch {
    // still navigate; cookie clear is best-effort
  }
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sso, setSso] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<ExistingMe | null | undefined>(
    undefined,
  );
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : { sso: {} }))
      .then((d) => {
        if (!cancelled) setSso(d.sso ?? {});
      })
      .catch(() => {});
    // Detect stuck session: login form visible while ft_session still valid
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!cancelled) setExisting(me);
      })
      .catch(() => {
        if (!cancelled) setExisting(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function forceSignOut() {
    setSwitching(true);
    setError(null);
    await clearLabsSession();
    setExisting(null);
    setSwitching(false);
    // Hard reload so header chrome drops the old identity
    window.location.href = "/login?switched=1";
  }

  async function startSso(url: string, e: React.MouseEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Clear Labs first; server SSO URLs also wrap wp-login.php?reauth=1 so
    // FatTail.ai / 0-DTE cannot silently reuse another WordPress user cookie
    // (root cause of "always Alpha MSC on FatTail SSO" after Labs logout).
    await clearLabsSession();
    window.location.href = url;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Clear any prior Labs session so native login cannot stack cookies
      await clearLabsSession();
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError(
          res.status === 401
            ? "Invalid email or password."
            : `Sign-in failed (${res.status}).`,
        );
        setBusy(false);
        return;
      }
      clearMeCache();
      window.location.href = "/home";
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

  const existingLabel =
    existing?.display_name ||
    existing?.email ||
    (existing ? `identity #${existing.identity_id}` : "");

  // FatTail.ai first — every member signs in via membership-site SSO.
  const ssoEntries = Object.entries(sso);
  const fattailSso = ssoEntries.filter(([name]) => name === "wordpress:fattail");
  const otherSso = ssoEntries.filter(([name]) => name !== "wordpress:fattail");

  return (
    <div className="mt-8">
      {existing && (
        <div
          className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
          data-testid="login-existing-session"
        >
          <p className="font-medium">Still signed in on Labs</p>
          <p className="mt-1 text-amber-900/90 dark:text-amber-100/90">
            This browser still has a Labs session as{" "}
            <strong>{existingLabel}</strong>
            {existing.role ? ` (${existing.access_role || existing.role})` : ""}.
            Clear it before switching FatTail.ai accounts.
          </p>
          <button
            type="button"
            disabled={switching}
            onClick={() => void forceSignOut()}
            className="mt-3 rounded-full bg-amber-800 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-900 disabled:opacity-50"
          >
            {switching ? "Clearing…" : "Force clear Labs session"}
          </button>
          <p className="mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">
            FatTail.ai and 0-DTE.com each keep their own WordPress login. SSO
            forces a credential prompt (reauth) so you can pick the right site
            account.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Primary: membership site SSO (FatTail.ai) */}
      {(fattailSso.length > 0 || otherSso.length > 0) && (
        <div className="space-y-2" data-testid="login-sso-primary">
          <p className="mb-3 text-center text-xs text-zinc-500">
            Use your FatTail.ai membership email and password on the next
            screen.
          </p>
          {[...fattailSso, ...otherSso].map(([name, url]) => (
            <a
              key={name}
              href={url}
              onClick={(e) => void startSso(url, e)}
              data-testid={
                name === "wordpress:fattail"
                  ? "login-sso-fattail"
                  : `login-sso-${name.replace(/[^a-z0-9]+/gi, "-")}`
              }
              className={[
                "group flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg",
                name === "wordpress:fattail"
                  ? "border-emerald-600/30 bg-emerald-500 text-white hover:bg-emerald-600"
                  : "border-[var(--color-separator)] bg-[var(--color-surface-secondary)] text-[var(--color-label)] hover:bg-[var(--color-fill)]",
              ].join(" ")}
            >
              {PROVIDER_LOGOS[name] && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-900/5">
                  <img
                    src={PROVIDER_LOGOS[name]}
                    alt=""
                    className="h-5 w-5 object-contain"
                  />
                </span>
              )}
              <span className="flex-1 text-center">
                {PROVIDER_LABELS[name] ?? name}
              </span>
              {PROVIDER_LOGOS[name] && (
                <span className="w-7 shrink-0" aria-hidden="true" />
              )}
            </a>
          ))}
        </div>
      )}

      {/* Secondary: Labs-local password (ops / rare) */}
      <details className="mt-8" data-testid="login-labs-password-details">
        <summary className="cursor-pointer text-center text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          Labs password sign-in (not used by members)
        </summary>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <label className="block text-sm">
            <span className="font-medium">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <label className="block text-sm">
            <span className="flex items-center justify-between font-medium">
              Password
              <a
                href="/forgot-password"
                className="text-xs font-normal text-emerald-600 hover:underline"
              >
                Forgot password?
              </a>
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full border border-zinc-300 bg-white py-2.5 font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            {busy ? "Signing in…" : "Sign in with Labs password"}
          </button>
        </form>
      </details>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Not a member yet?{" "}
        <a
          href="/signup"
          className="font-medium text-emerald-600 hover:underline"
        >
          Join FatTail Labs
        </a>
      </p>
    </div>
  );
}
