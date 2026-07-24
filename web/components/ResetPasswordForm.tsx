"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordForm() {
  const params = useSearchParams();
  const token = (params.get("token") || "").trim();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    if (!token) {
      setError("Missing reset token. Open the link from your email.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof body.detail === "string"
            ? body.detail
            : `Reset failed (${res.status}).`,
        );
        setBusy(false);
        return;
      }
      setDone(true);
      setBusy(false);
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

  if (!token) {
    return (
      <div className="mt-8 space-y-4" data-testid="reset-password-no-token">
        <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          This page needs a valid reset link from your email.
        </p>
        <p className="text-center text-sm">
          <a href="/forgot-password" className="font-medium text-emerald-600 hover:underline">
            Request a new link
          </a>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-8 space-y-4" data-testid="reset-password-done">
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Password updated. You can sign in with your new password.
        </p>
        <a
          href="/login"
          className="block w-full rounded-full bg-emerald-500 py-2.5 text-center font-medium text-white hover:bg-emerald-600"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <form onSubmit={submit} className="space-y-4" data-testid="reset-password-form">
        <label className="block text-sm">
          <span className="font-medium">New password</span>
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">Confirm password</span>
          <input
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className={field}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
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
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
