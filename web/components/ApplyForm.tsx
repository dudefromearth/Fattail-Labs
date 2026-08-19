"use client";

import { useState } from "react";

type FieldKey =
  | "email"
  | "hell"
  | "heaven"
  | "money_timing"
  | "coaching_sku"
  | "eleven_am_et"
  | "tried"
  | "partner_support";

type Values = Record<FieldKey, string>;

const EMPTY: Values = {
  email: "",
  hell: "",
  heaven: "",
  money_timing: "",
  coaching_sku: "",
  eleven_am_et: "",
  tried: "",
  partner_support: "",
};

const FIELD =
  "mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4 text-[length:var(--text-body)] text-[var(--color-label)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-label)]";

const INPUT = `${FIELD} min-h-[44px]`;
const AREA = `${FIELD} min-h-[88px] py-3`;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-[length:var(--text-footnote)] text-[var(--color-destructive)]" role="alert">
      {message}
    </p>
  );
}

export default function ApplyForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [pageError, setPageError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  function set(key: FieldKey, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setPageError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const detail = await res.json().catch(() => null);
      if (res.status === 400 && detail?.detail?.fields) {
        setFieldErrors(detail.detail.fields);
        setPageError(detail.detail.message || "Every field is required.");
        setBusy(false);
        return;
      }
      if (!res.ok) {
        const msg =
          detail?.detail?.message ||
          "We could not record your application. Nothing was marked complete. Try again.";
        setPageError(typeof msg === "string" ? msg : "We could not record your application.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setPageError(
        "We could not record your application. Nothing was marked complete. Try again.",
      );
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] p-6">
        <h2 className="text-[length:var(--text-title-3)] font-semibold text-[var(--color-label)]">
          Application received
        </h2>
        <p className="mt-2 text-[length:var(--text-body)] text-[var(--color-label-secondary)]">
          Your answers are on file. We will be in touch about booking. This page
          does not mean a seat is reserved.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 flex flex-col gap-6" noValidate>
      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          className={INPUT}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <FieldError message={fieldErrors.email} />
      </label>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          What is hard right now?
        </span>
        <textarea
          required
          rows={4}
          className={AREA}
          value={values.hell}
          onChange={(e) => set("hell", e.target.value)}
        />
        <FieldError message={fieldErrors.hell} />
      </label>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          What would better look like?
        </span>
        <textarea
          required
          rows={4}
          className={AREA}
          value={values.heaven}
          onChange={(e) => set("heaven", e.target.value)}
        />
        <FieldError message={fieldErrors.heaven} />
      </label>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          Money and timing
        </span>
        <p className="mt-1 text-[length:var(--text-footnote)] text-[var(--color-label-secondary)]">
          Can you start, and when?
        </p>
        <textarea
          required
          rows={3}
          className={AREA}
          value={values.money_timing}
          onChange={(e) => set("money_timing", e.target.value)}
        />
        <FieldError message={fieldErrors.money_timing} />
      </label>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          Which coaching are you applying for?
        </span>
        <input
          type="text"
          required
          className={INPUT}
          value={values.coaching_sku}
          onChange={(e) => set("coaching_sku", e.target.value)}
        />
        <FieldError message={fieldErrors.coaching_sku} />
      </label>

      <fieldset>
        <legend className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          Can you make 11:00 AM Eastern?
        </legend>
        <div className="mt-2 flex flex-col gap-2">
          {(["Yes", "No"] as const).map((opt) => (
            <label
              key={opt}
              className="flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-4"
            >
              <input
                type="radio"
                name="eleven_am_et"
                value={opt}
                checked={values.eleven_am_et === opt}
                onChange={() => set("eleven_am_et", opt)}
                className="h-5 w-5"
              />
              <span className="text-[length:var(--text-body)] text-[var(--color-label)]">
                {opt}
              </span>
            </label>
          ))}
        </div>
        <FieldError message={fieldErrors.eleven_am_et} />
      </fieldset>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          What have you already tried?
        </span>
        <textarea
          required
          rows={4}
          className={AREA}
          value={values.tried}
          onChange={(e) => set("tried", e.target.value)}
        />
        <FieldError message={fieldErrors.tried} />
      </label>

      <label className="block">
        <span className="text-[length:var(--text-subheadline)] font-medium text-[var(--color-label)]">
          Who supports this with you?
        </span>
        <textarea
          required
          rows={3}
          className={AREA}
          value={values.partner_support}
          onChange={(e) => set("partner_support", e.target.value)}
        />
        <FieldError message={fieldErrors.partner_support} />
      </label>

      {pageError && (
        <p
          className="rounded-[var(--radius-md)] border border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] px-4 py-3 text-[length:var(--text-body)] text-[var(--color-destructive)]"
          role="alert"
        >
          {pageError}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="min-h-[44px] w-full rounded-[var(--radius-full)] px-4 text-[length:var(--text-headline)] font-medium text-white disabled:opacity-45"
        style={{ backgroundColor: "#00B478" }}
      >
        {busy ? "Sending…" : "Submit application"}
      </button>
    </form>
  );
}
