"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setError("");
    if (!token) {
      setError("Open the link in the password email.");
      return;
    }
    if (password.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Enter the same password in both fields.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/front-door/set-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = typeof data.detail === "string" ? data.detail : "The password was not saved.";
        setError(detail);
        return;
      }
      setPassword("");
      setConfirm("");
      setSaved(true);
    } catch {
      setError("The password was not saved.");
    } finally {
      setBusy(false);
    }
  }

  if (saved) {
    return (
      <section>
        <h1>Your password is set</h1>
        <p className="fd-detail" data-testid="fd-password-saved">
          Use it the next time you sign in.
        </p>
        <a className="fd-cta" href="/front-door/order">
          Return to the order
        </a>
      </section>
    );
  }

  return (
    <section>
      <h1>Set your password</h1>
      <p className="fd-detail">Choose a password of at least 10 characters.</p>
      {error && (
        <p className="fd-error" data-testid="fd-error" role="alert">
          {error}
        </p>
      )}
      <div className="fd-float">
        <input
          id="fd-new-password"
          data-testid="fd-new-password"
          type="password"
          autoComplete="new-password"
          placeholder=" "
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
        />
        <label htmlFor="fd-new-password">New password</label>
      </div>
      <div className="fd-float">
        <input
          id="fd-new-password-confirm"
          data-testid="fd-new-password-confirm"
          type="password"
          autoComplete="new-password"
          placeholder=" "
          value={confirm}
          onChange={(event) => {
            setConfirm(event.target.value);
            setError("");
          }}
        />
        <label htmlFor="fd-new-password-confirm">Confirm password</label>
      </div>
      <button type="button" className="fd-cta" data-testid="fd-password-save" disabled={busy} onClick={save}>
        Save password
      </button>
    </section>
  );
}
