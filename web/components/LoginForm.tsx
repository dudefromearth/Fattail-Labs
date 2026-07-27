"use client";

import { useEffect, useState } from "react";

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

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sso, setSso] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : { sso: {} }))
      .then((d) => {
        if (!cancelled) setSso(d.sso ?? {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
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
      window.location.href = "/course";
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-4">
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
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-emerald-500 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {Object.keys(sso).length > 0 && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            CONTINUE WITH
            <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="space-y-2">
            {Object.entries(sso).map(([name, url]) => (
              <a
                key={name}
                href={url}
                className="group flex items-center gap-3 rounded-full border border-[var(--color-separator)] bg-[var(--color-surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--color-label)] shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-fill)] hover:shadow-lg"
              >
                {PROVIDER_LOGOS[name] && (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-900/5">
                    <img src={PROVIDER_LOGOS[name]} alt="" className="h-5 w-5 object-contain" />
                  </span>
                )}
                <span className="flex-1 text-center">{PROVIDER_LABELS[name] ?? name}</span>
                {PROVIDER_LOGOS[name] && <span className="w-7 shrink-0" aria-hidden="true" />}
              </a>
            ))}
          </div>
        </>
      )}

      <p className="mt-8 text-center text-sm text-zinc-500">
        Not a member yet?{" "}
        <a href="/signup" className="font-medium text-emerald-600 hover:underline">
          Join FatTail Labs
        </a>
      </p>
    </div>
  );
}
