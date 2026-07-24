"use client";

import { useState } from "react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof body.detail === "string"
            ? body.detail
            : res.status === 503
              ? "Password reset email is not configured on this server."
              : `Request failed (${res.status}).`,
        );
        setBusy(false);
        return;
      }
      setDone(
        body.detail ||
          "If an account with that email has a password on Labs, we sent reset instructions.",
      );
      setBusy(false);
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

  if (done) {
    return (
      <div className="mt-8 space-y-4" data-testid="forgot-password-done">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {done}
        </p>
        <p className="text-center text-sm text-zinc-500">
          <a href="/login" className="font-medium text-emerald-600 hover:underline">
            Back to sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-4" data-testid="forgot-password-form">
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
          {busy ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-8 text-center text-sm text-zinc-500">
        <a href="/login" className="font-medium text-emerald-600 hover:underline">
          Back to sign in
        </a>
      </p>
    </div>
  );
}
