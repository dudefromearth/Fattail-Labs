"use client";

import { useState } from "react";
import { APPLY_FIELDS, APPLY_HUE, APPLY_KEYS, type ApplyKey } from "@/lib/applyFields";

type FieldErrors = Partial<Record<"email" | ApplyKey, string>>;

const EMPTY: Record<ApplyKey, string> = {
  HELL: "",
  HEAVEN: "",
  MONEY_TIMING: "",
  COACHING_SKU: "",
  ELEVEN_AM_ET: "",
  TRIED: "",
  PARTNER_SUPPORT: "",
};

const fieldClass =
  "mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-4 py-3 text-[length:var(--text-body)] " +
  "text-[var(--color-label)] outline-none min-h-[var(--hit-min)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

export default function ApplyForm() {
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<ApplyKey, string>>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = "Email is required.";
    for (const field of APPLY_FIELDS) {
      if (!answers[field.key].trim()) {
        next[field.key] = "This answer is required.";
      }
    }
    return next;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      const body: Record<string, string> = { email: email.trim() };
      for (const key of APPLY_KEYS) body[key] = answers[key].trim();
      const res = await fetch("/api/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.ok !== true) {
        const detail =
          typeof payload?.detail === "string"
            ? payload.detail
            : `The application did not write (${res.status}).`;
        setFormError(detail);
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setFormError("The application did not write. Network error — try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6"
      >
        <p className="text-[length:var(--text-headline)] font-medium text-[var(--color-label)]">
          Application received.
        </p>
        <p className="mt-2 text-[length:var(--text-body)] text-[var(--color-label-secondary)]">
          The seven answers and the desk tag are on the contact. The desk can
          book from here.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md flex-col gap-5" noValidate>
      <div className="flex flex-col">
        <label
          htmlFor="apply-email"
          className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]"
        >
          Email
        </label>
        <input
          id="apply-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "apply-email-error" : undefined}
          className={fieldClass}
          style={{ outlineColor: APPLY_HUE }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email ? (
          <p
            id="apply-email-error"
            className="mt-1 text-[length:var(--text-footnote)] text-[var(--color-destructive)]"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      {APPLY_FIELDS.map((field) => {
        const err = errors[field.key];
        const inputId = `apply-${field.key}`;
        return (
          <div key={field.key} className="flex flex-col">
            <label
              htmlFor={inputId}
              className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]"
            >
              {field.label}
            </label>
            <textarea
              id={inputId}
              name={field.key}
              required
              rows={3}
              aria-invalid={Boolean(err)}
              aria-describedby={err ? `${inputId}-error` : undefined}
              className={`${fieldClass} min-h-[5.5rem] resize-y`}
              style={{ outlineColor: APPLY_HUE }}
              value={answers[field.key]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [field.key]: e.target.value }))
              }
            />
            {err ? (
              <p
                id={`${inputId}-error`}
                className="mt-1 text-[length:var(--text-footnote)] text-[var(--color-destructive)]"
              >
                {err}
              </p>
            ) : null}
          </div>
        );
      })}

      {formError ? (
        <p
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-destructive-soft)] px-4 py-3 text-[length:var(--text-body)] text-[var(--color-destructive)]"
        >
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center rounded-[var(--radius-full)] px-4 text-[length:var(--text-headline)] font-medium text-white disabled:opacity-45"
        style={{ backgroundColor: APPLY_HUE, minHeight: "44px" }}
      >
        {busy ? "Writing…" : "Submit"}
      </button>
    </form>
  );
}
