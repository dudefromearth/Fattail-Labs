"use client";

import { useState } from "react";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.status === 409) {
        setError("An account with this email already exists — sign in instead.");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        setError(detail?.detail ?? `Signup failed (${res.status}).`);
        setBusy(false);
        return;
      }
      window.location.href = "/pathway";
    } catch {
      setError("Network error — try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="font-medium">Full name</span>
        <input
          required
          autoComplete="name"
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
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
        <span className="font-medium">Password</span>
        <input
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          className={field}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="mt-1 block text-xs text-zinc-400">
          At least 10 characters.
        </span>
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
        {busy ? "Creating your account…" : "Create Free Account"}
      </button>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <a href="/login" className="font-medium text-emerald-600 hover:underline">
          Sign in
        </a>
      </p>
    </form>
  );
}
