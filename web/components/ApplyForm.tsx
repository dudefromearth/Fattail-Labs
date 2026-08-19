"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  APPLY_HUE,
  displayAnswer,
  emptyAnswers,
  liveSteps,
  nextApplyStep,
  nextLabel,
  prevApplyStep,
  pruneAsked,
  recomputePath,
  reviewRows,
  stepById,
  stepValueValid,
  submitPayload,
  unansweredOnPath,
  type ApplyKey,
  type ApplyScreenId,
  type ApplyStep,
  type ApplyStepId,
} from "@/lib/applyFields";

type Layer = "present" | "in" | "out" | "settled";

const SWAP_MS = 400;

function valuesOf(
  email: string,
  answers: Record<ApplyKey, string>,
): Record<string, string> {
  return { email, ...answers };
}

function isQuestionScreen(screen: ApplyScreenId): screen is ApplyStepId {
  return screen !== "review";
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

function isAcceptKey(e: React.KeyboardEvent, control: ApplyStep["control"] | "review") {
  if (e.key === "Tab" && !e.shiftKey) return true;
  if (e.key === "Enter" && !(e.shiftKey && control === "textarea")) return true;
  return false;
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
    if (!isAcceptKey(e, step.control)) return;
    e.preventDefault();
    onAccept();
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

function ReviewList({
  rows,
  email,
  answers,
  interactive,
  onEdit,
}: {
  rows: ApplyStep[];
  email: string;
  answers: Record<ApplyKey, string>;
  interactive: boolean;
  onEdit?: (id: ApplyStepId) => void;
}) {
  return (
    <ul className="apply-review-list">
      {rows.map((step) => {
        const raw = step.id === "email" ? email : answers[step.id as ApplyKey];
        const answer = displayAnswer(step, raw || "");
        if (!interactive) {
          return (
            <li key={step.id} className="apply-review-line">
              <span className="apply-review-q">{step.ask}</span>
              <span className="apply-review-a">{answer}</span>
            </li>
          );
        }
        return (
          <li key={step.id}>
            <button
              type="button"
              className="apply-review-line"
              onClick={() => onEdit?.(step.id)}
            >
              <span className="apply-review-q">{step.ask}</span>
              <span className="apply-review-a">{answer || "—"}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SlotTriple({
  stageKey,
  leaving,
  liveLayer,
  fieldReview,
  question,
  hint,
  field,
  accept,
  leavingQuestion,
  leavingHint,
  leavingField,
  leavingAccept,
}: {
  stageKey: string;
  leaving: boolean;
  liveLayer: Layer;
  fieldReview: boolean;
  question: React.ReactNode;
  hint: React.ReactNode;
  field: React.ReactNode;
  accept: React.ReactNode;
  leavingQuestion: React.ReactNode;
  leavingHint: React.ReactNode;
  leavingField: React.ReactNode;
  leavingAccept: React.ReactNode;
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
      <div
        className={`apply-slot apply-slot--field${fieldReview ? " apply-slot--field-review" : ""}`}
      >
        {leaving ? (
          <div className="apply-slot-layer apply-slot-layer--out" aria-hidden>
            <div className="apply-field-main">{leavingField}</div>
            {leavingAccept}
          </div>
        ) : null}
        <div
          key={`f-${stageKey}`}
          className={`apply-slot-layer apply-slot-layer--${liveLayer}`}
        >
          <div className="apply-field-main">{field}</div>
          {accept}
        </div>
      </div>
    </>
  );
}

export default function ApplyForm() {
  const [screen, setScreen] = useState<ApplyScreenId>("intro");
  const [leavingId, setLeavingId] = useState<ApplyScreenId | null>(null);
  const [liveLayer, setLiveLayer] = useState<Layer>("present");
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<Record<ApplyKey, string>>(emptyAnswers);
  const [asked, setAsked] = useState<ApplyStepId[]>([]);
  const [fromReview, setFromReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const swapTimer = useRef<number | null>(null);
  const acceptRef = useRef<HTMLButtonElement | null>(null);

  const isReview = screen === "review";
  const step = isQuestionScreen(screen) ? stepById(screen) : null;
  const draft = valuesOf(email, answers);
  const pathLive = liveSteps(draft);
  const rows = reviewRows(asked, draft);

  useEffect(() => {
    return () => {
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
    };
  }, []);

  useEffect(() => {
    if (done || isReview || !step || step.id === "intro") return;
    setAsked((prev) => (prev.includes(step.id) ? prev : [...prev, step.id]));
  }, [done, isReview, step]);

  useEffect(() => {
    if (done) return;
    if (!isReview && step?.control !== "continue") return;
    const t = window.setTimeout(() => {
      acceptRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [done, isReview, step?.control, screen]);

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

  function goTo(next: ApplyScreenId) {
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    setLeavingId(screen);
    setScreen(next);
    setLiveLayer("in");
    setError(null);
    setFormError(null);
    swapTimer.current = window.setTimeout(() => {
      setLeavingId(null);
      setLiveLayer("settled");
    }, SWAP_MS);
  }

  function applyRecompute(
    nextEmail: string,
    nextAnswers: Record<ApplyKey, string>,
  ) {
    const snapped = recomputePath(nextEmail, nextAnswers);
    setEmail(snapped.email);
    setAnswers(snapped.answers);
    setAsked((prev) => pruneAsked(prev, snapped.path));
    return snapped;
  }

  async function writeApply(
    nextEmail: string,
    nextAnswers: Record<ApplyKey, string>,
  ) {
    setBusy(true);
    setFormError(null);
    try {
      const body = submitPayload(nextEmail, nextAnswers);
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
      setLeavingId(screen);
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

  function acceptReview() {
    if (busy || done) return;
    const snapped = applyRecompute(email, answers);
    const missing = unansweredOnPath(snapped.email, snapped.answers);
    if (missing.length) {
      setFromReview(true);
      goTo(missing[0]);
      return;
    }
    void writeApply(snapped.email, snapped.answers);
  }

  function accept(override?: string) {
    if (busy || done) return;
    if (isReview) {
      acceptReview();
      return;
    }
    if (!step) return;
    const nextValue = override !== undefined ? override : valueOf(step.id);
    if (override !== undefined) setValue(step.id, override);
    if (!stepValueValid(step, nextValue)) {
      setError(
        step.control === "email"
          ? "A valid email is required."
          : "This answer is required.",
      );
      return;
    }
    const proposed = withValue(step.id, nextValue);
    const snapped = applyRecompute(proposed.email, proposed.answers);
    const accepted = valuesOf(snapped.email, snapped.answers);

    if (fromReview) {
      const missing = unansweredOnPath(snapped.email, snapped.answers);
      if (missing.length) {
        goTo(missing[0]);
        return;
      }
      setFromReview(false);
      goTo("review");
      return;
    }

    const next = nextApplyStep(step.id, accepted);
    goTo(next);
  }

  function editFromReview(id: ApplyStepId) {
    if (busy || done) return;
    setFromReview(true);
    goTo(id);
  }

  function back() {
    if (busy || done) return;
    if (isReview) {
      const last = [...asked].reverse().find((id) => pathLive.includes(id));
      if (!last) return;
      setFromReview(true);
      goTo(last);
      return;
    }
    if (fromReview) {
      setFromReview(false);
      goTo("review");
      return;
    }
    if (!step) return;
    const prev = prevApplyStep(step.id, draft);
    if (!prev) return;
    goTo(prev);
  }

  const liveQuestion = done ? (
    <h1 className="apply-received">Application received.</h1>
  ) : isReview ? (
    <h1 className="apply-question">Review</h1>
  ) : (
    <StepAsk step={step!} />
  );

  const liveHint = done ? (
    <p className="apply-hint">The desk can book from here.</p>
  ) : isReview ? (
    <p className="apply-hint" id="apply-review-hint">
      Tap a line to change an answer.
    </p>
  ) : (
    <p className="apply-hint" id={`apply-${step!.id}-hint`}>
      {step!.hint}
    </p>
  );

  const liveField = done ? (
    <p className="apply-received-detail">
      The answers and the desk tag are on the contact.
    </p>
  ) : isReview ? (
    <ReviewList
      rows={rows}
      email={email}
      answers={answers}
      interactive
      onEdit={editFromReview}
    />
  ) : (
    <StepBody
      step={step!}
      value={valueOf(step!.id)}
      error={error}
      onChange={(v) => setValue(step!.id, v)}
      onAccept={accept}
    />
  );

  const leavingIsReview = leavingId === "review";
  const leavingStep =
    leavingId && leavingId !== "review" ? stepById(leavingId) : null;
  const leavingQuestion = leavingIsReview ? (
    <h1 className="apply-question">Review</h1>
  ) : leavingStep ? (
    <StepAsk step={leavingStep} />
  ) : null;
  const leavingHint = leavingIsReview ? (
    <p className="apply-hint">Tap a line to change an answer.</p>
  ) : leavingStep ? (
    <StepHint step={leavingStep} />
  ) : null;
  const leavingField = leavingIsReview ? (
    <ReviewList rows={rows} email={email} answers={answers} interactive={false} />
  ) : leavingStep ? (
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

  const progress = done
    ? "Done"
    : isReview
      ? "Review"
      : (() => {
          const pos = pathLive.indexOf(screen as ApplyStepId);
          return pos >= 0
            ? `${pos + 1} of ${pathLive.length}`
            : `${pathLive.length} of ${pathLive.length}`;
        })();

  const showBack = !done && (isReview || (step && step.id !== "intro"));

  return (
    <div className="apply-root" data-apply-screen={done ? "received" : screen}>
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
          {progress}
        </p>
      </header>

      <div className="apply-stage">
        <SlotTriple
          stageKey={done ? "received" : screen}
          leaving={leavingId !== null}
          liveLayer={liveLayer}
          fieldReview={isReview || leavingIsReview}
          question={liveQuestion}
          hint={liveHint}
          field={liveField}
          accept={
            done ? null : (
              <button
                ref={acceptRef}
                type="button"
                className="apply-next"
                style={{ backgroundColor: APPLY_HUE }}
                disabled={busy}
                onClick={() => accept()}
                onKeyDown={(e) => {
                  if (!isAcceptKey(e, isReview ? "review" : step!.control)) return;
                  e.preventDefault();
                  accept();
                }}
              >
                {busy ? "Writing…" : isReview ? "Accept" : nextLabel(step!)}
              </button>
            )
          }
          leavingQuestion={leavingQuestion}
          leavingHint={leavingHint}
          leavingField={leavingField}
          leavingAccept={
            leavingIsReview ? (
              <span className="apply-next" aria-hidden>
                Accept
              </span>
            ) : leavingStep ? (
              <span className="apply-next" aria-hidden>
                {nextLabel(leavingStep)}
              </span>
            ) : null
          }
        />
        <p
          id={isReview ? "apply-review-error" : `apply-${step?.id ?? "screen"}-error`}
          className="apply-error"
          role={error || formError ? "alert" : undefined}
        >
          {formError || error || ""}
        </p>
        {showBack ? (
          <button type="button" className="apply-back" onClick={back}>
            Back
          </button>
        ) : null}
      </div>
    </div>
  );
}
