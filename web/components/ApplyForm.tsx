"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  APPLY_HUE,
  APPLY_KEYS,
  APPLY_STEPS,
  nextApplyStep,
  nextLabel,
  prevApplyStep,
  stepById,
  stepValueValid,
  type ApplyKey,
  type ApplyStep,
  type ApplyStepId,
} from "@/lib/applyFields";

type Layer = "present" | "in" | "out" | "settled";

const EMPTY: Record<ApplyKey, string> = {
  HELL: "",
  HEAVEN: "",
  MONEY_TIMING: "",
  COACHING_SKU: "",
  ELEVEN_AM_ET: "",
  TRIED: "",
  PARTNER_SUPPORT: "",
};

const SWAP_MS = 400;

function valuesOf(
  email: string,
  answers: Record<ApplyKey, string>,
): Record<string, string> {
  return { email, ...answers };
}

function StepAsk({ step }: { step: ApplyStep }) {
  if (step.control === "yesno" || step.control === "continue") {
    return <h1 className="apply-question">{step.ask}</h1>;
  }
  return (
    <h1 className="apply-question">
      <label htmlFor={`apply-${step.id}`}>{step.ask}</label>
    </h1>
  );
}

function StepHint({ step }: { step: ApplyStep }) {
  return <p className="apply-hint">{step.hint}</p>;
}

function StepBody({
  step,
  value,
  error,
  onChange,
  onAccept,
}: {
  step: ApplyStep;
  value: string;
  error: string | null;
  onChange: (next: string) => void;
  onAccept: (override?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (step.control === "continue") return;
    const node =
      step.control === "yesno" ? firstChoiceRef.current : inputRef.current;
    if (!node) return;
    const t = window.setTimeout(() => {
      node.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [step.id, step.control]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    if (e.shiftKey && step.control === "textarea") return;
    e.preventDefault();
    if (stepValueValid(step, value)) onAccept();
  }

  const described = [
    step.hint ? `apply-${step.id}-hint` : "",
    error ? `apply-${step.id}-error` : "",
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  if (step.control === "continue") {
    return <div className="apply-field-spacer" aria-hidden />;
  }

  if (step.control === "yesno") {
    return (
      <div
        className="apply-yesno"
        role="group"
        aria-label={step.ask}
        aria-describedby={described}
        onKeyDown={onKeyDown}
      >
        {(["yes", "no"] as const).map((choice, i) => (
          <button
            key={choice}
            ref={i === 0 ? firstChoiceRef : undefined}
            type="button"
            className="apply-choice"
            aria-pressed={value === choice}
            onClick={() => onAccept(choice)}
          >
            {choice === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    );
  }

  if (step.control === "textarea") {
    return (
      <textarea
        ref={(el) => {
          inputRef.current = el;
        }}
        id={`apply-${step.id}`}
        name={step.id}
        className="apply-textarea"
        aria-invalid={Boolean(error)}
        aria-describedby={described}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    );
  }

  return (
    <input
      ref={(el) => {
        inputRef.current = el;
      }}
      id={`apply-${step.id}`}
      name={step.id}
      type={step.control === "email" ? "email" : "text"}
      autoComplete={step.control === "email" ? "email" : "off"}
      inputMode={step.control === "email" ? "email" : "text"}
      className="apply-input"
      aria-invalid={Boolean(error)}
      aria-describedby={described}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
    />
  );
}

function SlotTriple({
  stageKey,
  leaving,
  liveLayer,
  question,
  hint,
  field,
  leavingQuestion,
  leavingHint,
  leavingField,
}: {
  stageKey: string;
  leaving: boolean;
  liveLayer: Layer;
  question: React.ReactNode;
  hint: React.ReactNode;
  field: React.ReactNode;
  leavingQuestion: React.ReactNode;
  leavingHint: React.ReactNode;
  leavingField: React.ReactNode;
}) {
  return (
    <>
      <div className="apply-slot apply-slot--question">
        {leaving ? (
          <div className="apply-slot-layer apply-slot-layer--out" aria-hidden>
            {leavingQuestion}
          </div>
        ) : null}
        <div
          key={`q-${stageKey}`}
          className={`apply-slot-layer apply-slot-layer--${liveLayer}`}
        >
          {question}
        </div>
      </div>
      <div className="apply-slot apply-slot--hint">
        {leaving ? (
          <div className="apply-slot-layer apply-slot-layer--out" aria-hidden>
            {leavingHint}
          </div>
        ) : null}
        <div
          key={`h-${stageKey}`}
          className={`apply-slot-layer apply-slot-layer--${liveLayer}`}
        >
          {hint}
        </div>
      </div>
      <div className="apply-slot apply-slot--field">
        {leaving ? (
          <div className="apply-slot-layer apply-slot-layer--out" aria-hidden>
            {leavingField}
          </div>
        ) : null}
        <div
          key={`f-${stageKey}`}
          className={`apply-slot-layer apply-slot-layer--${liveLayer}`}
        >
          {field}
        </div>
      </div>
    </>
  );
}

export default function ApplyForm() {
  const [stepId, setStepId] = useState<ApplyStepId>("intro");
  const [leavingId, setLeavingId] = useState<ApplyStepId | null>(null);
  const [liveLayer, setLiveLayer] = useState<Layer>("present");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<ApplyKey, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const swapTimer = useRef<number | null>(null);

  const step = stepById(stepId);
  const index = APPLY_STEPS.findIndex((s) => s.id === stepId);
  const draft = valuesOf(email, answers);
  const isLast = nextApplyStep(stepId, draft) === "submit";

  useEffect(() => {
    return () => {
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
    };
  }, []);

  function valueOf(id: ApplyStepId): string {
    if (id === "intro") return "";
    return id === "email" ? email : answers[id];
  }

  function withValue(
    id: ApplyStepId,
    next: string,
  ): { email: string; answers: Record<ApplyKey, string> } {
    if (id === "intro") return { email, answers };
    if (id === "email") return { email: next, answers };
    return { email, answers: { ...answers, [id]: next } };
  }

  function setValue(id: ApplyStepId, next: string) {
    if (id === "intro") return;
    if (id === "email") setEmail(next);
    else setAnswers((prev) => ({ ...prev, [id]: next }));
    setError(null);
  }

  function goTo(next: ApplyStepId) {
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    setLeavingId(stepId);
    setStepId(next);
    setLiveLayer("in");
    setError(null);
    setFormError(null);
    swapTimer.current = window.setTimeout(() => {
      setLeavingId(null);
      setLiveLayer("settled");
    }, SWAP_MS);
  }

  async function writeApply(
    nextEmail: string,
    nextAnswers: Record<ApplyKey, string>,
  ) {
    setBusy(true);
    setFormError(null);
    try {
      const body: Record<string, string> = { email: nextEmail.trim() };
      for (const key of APPLY_KEYS) body[key] = nextAnswers[key].trim();
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
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
      setLeavingId(stepId);
      setDone(true);
      setLiveLayer("in");
      swapTimer.current = window.setTimeout(() => {
        setLeavingId(null);
        setLiveLayer("settled");
      }, SWAP_MS);
    } catch {
      setFormError("The application did not write. Network error — try again.");
      setBusy(false);
    }
  }

  function accept(override?: string) {
    if (busy || done) return;
    const nextValue = override !== undefined ? override : valueOf(stepId);
    if (override !== undefined) setValue(stepId, override);
    if (!stepValueValid(step, nextValue)) {
      setError(
        step.control === "email"
          ? "A valid email is required."
          : "This answer is required.",
      );
      return;
    }
    const snapped = withValue(stepId, nextValue);
    const next = nextApplyStep(stepId, valuesOf(snapped.email, snapped.answers));
    if (next === "submit") {
      void writeApply(snapped.email, snapped.answers);
      return;
    }
    goTo(next);
  }

  function back() {
    if (busy || done) return;
    const prev = prevApplyStep(stepId);
    if (!prev) return;
    goTo(prev);
  }

  const liveQuestion = done ? (
    <h1 className="apply-received">Application received.</h1>
  ) : (
    <StepAsk step={step} />
  );

  const liveHint = done ? (
    <p className="apply-hint">The desk can book from here.</p>
  ) : (
    <p className="apply-hint" id={`apply-${step.id}-hint`}>
      {step.hint}
    </p>
  );

  const liveField = done ? (
    <p className="apply-received-detail">
      The seven answers and the desk tag are on the contact.
    </p>
  ) : (
    <StepBody
      step={step}
      value={valueOf(stepId)}
      error={error}
      onChange={(v) => setValue(stepId, v)}
      onAccept={accept}
    />
  );

  const leavingStep = leavingId ? stepById(leavingId) : null;
  const leavingQuestion = leavingStep ? <StepAsk step={leavingStep} /> : null;
  const leavingHint = leavingStep ? <StepHint step={leavingStep} /> : null;
  const leavingField = leavingStep ? (
    leavingStep.control === "continue" ? (
      <div className="apply-field-spacer" />
    ) : leavingStep.control === "yesno" ? (
      <div className="apply-yesno">
        <span className="apply-choice" aria-hidden>
          Yes
        </span>
        <span className="apply-choice" aria-hidden>
          No
        </span>
      </div>
    ) : leavingStep.control === "textarea" ? (
      <div className="apply-textarea">{valueOf(leavingStep.id)}</div>
    ) : (
      <div className="apply-input">{valueOf(leavingStep.id)}</div>
    )
  ) : null;

  return (
    <div className="apply-root">
      <header className="apply-chrome">
        <div className="apply-mark">
          <Image
            src="/brand/fattail-labs-logo.jpg"
            alt=""
            width={28}
            height={28}
            priority
            className="apply-mark-img"
          />
          <span className="apply-mark-word">fattail</span>
        </div>
        <p className="apply-progress" aria-live="polite">
          {done ? "Done" : `${index + 1} of ${APPLY_STEPS.length}`}
        </p>
      </header>

      <div className="apply-stage">
        <SlotTriple
          stageKey={done ? "received" : stepId}
          leaving={leavingId !== null}
          liveLayer={liveLayer}
          question={liveQuestion}
          hint={liveHint}
          field={liveField}
          leavingQuestion={leavingQuestion}
          leavingHint={leavingHint}
          leavingField={leavingField}
        />
        <p
          id={`apply-${step.id}-error`}
          className="apply-error"
          role={error || formError ? "alert" : undefined}
        >
          {formError || error || ""}
        </p>
      </div>

      {!done ? (
        <footer className="apply-footer">
          <button
            type="button"
            className="apply-next"
            style={{ backgroundColor: APPLY_HUE }}
            disabled={busy}
            onClick={() => accept()}
          >
            {busy ? "Writing…" : nextLabel(step, isLast)}
          </button>
          {index > 0 ? (
            <button type="button" className="apply-back" onClick={back}>
              Back
            </button>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
