"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ApplyFormEditor from "@/components/edit/ApplyFormEditor";
import { useApplySlotsEdit } from "@/components/edit/ApplySlotsEditContext";
import {
  contentCheck,
  DEFAULT_SCORE,
  displayAnswer,
  emailFromAnswers,
  emptyAnswers,
  endingsLive,
  hostLabel,
  liveSteps,
  nextApplyStep,
  nextLabel,
  optionLabels,
  prevApplyStep,
  resolveEnding,
  reviewRows,
  submitPayload,
  unansweredOnPath,
  walkPath,
  type ApplyOutcome,
  type ApplyQuestion,
  type ApplyQType,
  type ApplyScore,
} from "@/lib/applyFields";

type Layer = "present" | "in" | "out" | "settled";
type Screen = string;

const SWAP_MS = 400;

function isAcceptKey(e: React.KeyboardEvent, qtype: ApplyQType | "review") {
  if (e.key === "Tab" && !e.shiftKey) return true;
  if (e.key === "Enter" && !(e.shiftKey && qtype === "free_text")) return true;
  return false;
}

function ActionPair({
  showBack,
  okLabel,
  okRef,
  okBusy,
  okDisabled,
  onBack,
  onOk,
  okControl,
  inert,
}: {
  showBack: boolean;
  okLabel: string;
  okRef?: React.Ref<HTMLButtonElement>;
  okBusy?: boolean;
  okDisabled?: boolean;
  onBack?: () => void;
  onOk?: () => void;
  okControl: ApplyQType | "review";
  inert?: boolean;
}) {
  const ok = (
    <button
      ref={okRef}
      type="button"
      className="apply-pair"
      disabled={okDisabled}
      onClick={inert ? undefined : onOk}
      onKeyDown={
        inert
          ? undefined
          : (e) => {
              if (!isAcceptKey(e, okControl)) return;
              e.preventDefault();
              onOk?.();
            }
      }
    >
      {okBusy ? "Writing…" : okLabel}
    </button>
  );
  const back = showBack ? (
    <button
      type="button"
      className="apply-pair"
      onClick={inert ? undefined : onBack}
    >
      Back
    </button>
  ) : null;
  if (inert) {
    return (
      <div className="apply-actions" aria-hidden>
        {back ? <span className="apply-pair">Back</span> : null}
        <span className="apply-pair">{okLabel}</span>
      </div>
    );
  }
  return (
    <div className="apply-actions">
      {back}
      {ok}
    </div>
  );
}

function StepAsk({ step }: { step: ApplyQuestion }) {
  const labeled =
    step.qtype === "free_text" ||
    step.qtype === "calendar" ||
    step.qtype === "binary" ||
    step.qtype === "radio";
  return (
    <h1 className="apply-question">
      {labeled ? (
        <label htmlFor={`apply-${step.slug}`}>{step.ask}</label>
      ) : (
        step.ask
      )}
    </h1>
  );
}

function StepHint({ step }: { step: ApplyQuestion }) {
  return <p className="apply-hint">{step.hint}</p>;
}

function ChoiceList({
  step,
  value,
  described,
  onChange,
  onKeyDown,
  firstRef,
}: {
  step: ApplyQuestion;
  value: string;
  described?: string;
  onChange: (next: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  firstRef: React.Ref<HTMLButtonElement>;
}) {
  return (
    <div
      className={step.qtype === "binary" ? "apply-yesno" : "apply-times"}
      role="listbox"
      aria-label={step.ask}
      aria-describedby={described}
      onKeyDown={onKeyDown}
    >
      {optionLabels(step).map((choice, i) => (
        <button
          key={choice}
          ref={i === 0 ? firstRef : undefined}
          type="button"
          role="option"
          className={step.qtype === "binary" ? "apply-choice" : "apply-time"}
          aria-selected={value === choice}
          onClick={() => onChange(choice)}
        >
          {choice}
        </button>
      ))}
    </div>
  );
}

function StepBody({
  step,
  value,
  error,
  slots,
  slotsError,
  onChange,
  onAccept,
}: {
  step: ApplyQuestion;
  value: string;
  error: string | null;
  slots: { starts_et: string }[];
  slotsError: string | null;
  onChange: (next: string) => void;
  onAccept: (override?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const firstChoiceRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (step.qtype === "continue") return;
    const node =
      step.qtype === "binary" ||
      step.qtype === "radio" ||
      step.qtype === "calendar"
        ? firstChoiceRef.current
        : inputRef.current;
    if (!node) return;
    const t = window.setTimeout(() => {
      node.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [step.slug, step.qtype]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (!isAcceptKey(e, step.qtype)) return;
    e.preventDefault();
    onAccept();
  }

  const described = [
    step.hint ? `apply-${step.slug}-hint` : "",
    error ? `apply-${step.slug}-error` : "",
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  if (step.qtype === "continue") {
    return <div className="apply-field-spacer" aria-hidden />;
  }

  if (step.qtype === "binary" || step.qtype === "radio") {
    const labels = optionLabels(step);
    const miss =
      step.qtype === "binary" && labels.length !== 2
        ? "This question is missing its two choices."
        : step.qtype === "radio" && labels.length < 2
          ? "This question needs two or more choices."
          : null;
    if (miss) {
      return (
        <p className="apply-error" role="alert">
          {miss}
        </p>
      );
    }
    return (
      <ChoiceList
        step={step}
        value={value}
        described={described}
        onChange={onChange}
        onKeyDown={onKeyDown}
        firstRef={firstChoiceRef}
      />
    );
  }

  if (step.qtype === "calendar") {
    if (slotsError) {
      return (
        <p className="apply-error" role="alert">
          {slotsError}
        </p>
      );
    }
    if (slots.length === 0) {
      return (
        <p className="apply-error" role="alert">
          No live conversation times are configured.
        </p>
      );
    }
    return (
      <div
        className="apply-times"
        role="listbox"
        aria-label={step.ask}
        aria-describedby={described}
        onKeyDown={onKeyDown}
      >
        {slots.map((slot, i) => (
          <button
            key={slot.starts_et}
            ref={i === 0 ? firstChoiceRef : undefined}
            type="button"
            role="option"
            className="apply-time"
            aria-selected={value === slot.starts_et}
            onClick={() => onChange(slot.starts_et)}
          >
            {displayAnswer(step, slot.starts_et)}
          </button>
        ))}
      </div>
    );
  }

  if (step.is_email) {
    return (
      <input
        ref={(el) => {
          inputRef.current = el;
        }}
        id={`apply-${step.slug}`}
        name={step.slug}
        type="email"
        autoComplete="email"
        inputMode="email"
        className="apply-input"
        aria-invalid={Boolean(error)}
        aria-describedby={described}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
    );
  }

  return (
    <textarea
      ref={(el) => {
        inputRef.current = el;
      }}
      id={`apply-${step.slug}`}
      name={step.slug}
      className="apply-textarea"
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
  answers,
  interactive,
  editingId,
  editDraft,
  editError,
  slots,
  slotsError,
  onStartEdit,
  onDraftChange,
  onAcceptEdit,
  onCancelEdit,
}: {
  rows: ApplyQuestion[];
  answers: Record<string, string>;
  interactive: boolean;
  editingId?: string | null;
  editDraft?: string;
  editError?: string | null;
  slots: { starts_et: string }[];
  slotsError: string | null;
  onStartEdit?: (id: string) => void;
  onDraftChange?: (next: string) => void;
  onAcceptEdit?: (override?: string) => void;
  onCancelEdit?: () => void;
}) {
  return (
    <ul className="apply-review-list">
      {rows.map((step) => {
        const raw = answers[step.slug] || "";
        const answer = displayAnswer(step, raw);
        const editing = interactive && editingId === step.slug;
        if (editing) {
          return (
            <li
              key={step.slug}
              className="apply-review-line apply-review-line--edit"
            >
              <span className="apply-review-q">{step.ask}</span>
              <div className="apply-review-edit">
                <div className="apply-review-edit-field">
                  <StepBody
                    step={step}
                    value={editDraft ?? ""}
                    error={editError ?? null}
                    slots={slots}
                    slotsError={slotsError}
                    onChange={(v) => onDraftChange?.(v)}
                    onAccept={(override) => onAcceptEdit?.(override)}
                  />
                </div>
                <ActionPair
                  showBack
                  okLabel="OK"
                  okControl={step.qtype}
                  onBack={onCancelEdit}
                  onOk={() => onAcceptEdit?.()}
                />
              </div>
              {editError ? (
                <p
                  id={`apply-${step.slug}-error`}
                  className="apply-error"
                  role="alert"
                >
                  {editError}
                </p>
              ) : null}
            </li>
          );
        }
        if (!interactive) {
          return (
            <li key={step.slug} className="apply-review-line">
              <span className="apply-review-q">{step.ask}</span>
              <span className="apply-review-a">{answer}</span>
            </li>
          );
        }
        return (
          <li key={step.slug}>
            <button
              type="button"
              className="apply-review-line"
              onClick={() => onStartEdit?.(step.slug)}
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
  actions,
  leavingQuestion,
  leavingHint,
  leavingField,
  leavingActions,
}: {
  stageKey: string;
  leaving: boolean;
  liveLayer: Layer;
  fieldReview: boolean;
  question: React.ReactNode;
  hint: React.ReactNode;
  field: React.ReactNode;
  actions: React.ReactNode;
  leavingQuestion: React.ReactNode;
  leavingHint: React.ReactNode;
  leavingField: React.ReactNode;
  leavingActions: React.ReactNode;
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
            {leavingActions}
          </div>
        ) : null}
        <div
          key={`f-${stageKey}`}
          className={`apply-slot-layer apply-slot-layer--${liveLayer}`}
        >
          <div className="apply-field-main">{field}</div>
          {actions}
        </div>
      </div>
    </>
  );
}

function EndingPanel({
  ending,
  score,
  slots,
  slotsError,
  when,
  onPick,
}: {
  ending: ApplyOutcome;
  score: ApplyScore;
  slots: { starts_et: string; host?: string }[];
  slotsError: string | null;
  when: string;
  onPick: (next: string) => void;
}) {
  if (ending === "trial") {
    return (
      <div className="apply-ending apply-ending--trial">
        <p className="apply-ending-kicker">No meeting this time</p>
        <h2 className="apply-ending-title">Start Observer.</h2>
        <p className="apply-ending-copy">
          {score.trial_price} for {score.trial_term}. One honest door — not a
          booked conversation.
        </p>
      </div>
    );
  }
  const listed = slots.filter((s) => s.host === ending);
  const name = hostLabel(score, ending);
  return (
    <div className="apply-ending">
      <p className="apply-ending-kicker">Meeting</p>
      <h2 className="apply-ending-title">Meet with {name}.</h2>
      <p className="apply-ending-copy">
        Pick one listed time. A calendar invite goes to the email you entered.
      </p>
      {slotsError ? (
        <p className="apply-error" role="alert">
          {slotsError}
        </p>
      ) : listed.length === 0 ? (
        <p className="apply-error" role="alert">
          No live conversation times are configured.
        </p>
      ) : (
        <div className="apply-times" role="listbox" aria-label={`${name} times`}>
          {listed.map((slot) => (
            <button
              key={slot.starts_et}
              type="button"
              role="option"
              className="apply-time"
              aria-selected={when === slot.starts_et}
              onClick={() => onPick(slot.starts_et)}
            >
              {displayAnswer(
                {
                  id: 0,
                  slug: "ending",
                  ask: "",
                  hint: "",
                  qtype: "calendar",
                  options: [],
                  is_email: false,
                  on_path: false,
                  sort_order: 0,
                },
                slot.starts_et,
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplyMark() {
  return (
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
  );
}

export default function ApplyForm() {
  const admin = useApplySlotsEdit();
  const questions = admin?.questions ?? [];
  const formMiss = admin?.formError ?? null;
  const slots = admin?.liveSlots ?? [];
  const slotsError = admin?.liveError ?? null;
  const score: ApplyScore = admin?.score ?? DEFAULT_SCORE;
  const scored = score.endings_live || endingsLive(questions);

  const [screen, setScreen] = useState<Screen>("");
  const [leavingId, setLeavingId] = useState<Screen | null>(null);
  const [liveLayer, setLiveLayer] = useState<Layer>("present");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [asked, setAsked] = useState<string[]>([]);
  const [fromReview, setFromReview] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteMiss, setInviteMiss] = useState<string | null>(null);
  const [endingWhen, setEndingWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const swapTimer = useRef<number | null>(null);
  const acceptRef = useRef<HTMLButtonElement | null>(null);
  const booted = useRef(false);
  const walk = walkPath(questions, answers, scored);
  const ending = scored
    ? resolveEnding(questions, answers, score.tie_ending)
    : null;

  useEffect(() => {
    if (!questions.length || booted.current) return;
    booted.current = true;
    setAnswers(emptyAnswers(questions));
    const first = walkPath(questions, {}, scored)[0];
    setScreen(first?.slug || questions[0].slug);
  }, [questions, scored]);

  const isReview = screen === "review";
  const step =
    !isReview && screen
      ? walk.find((q) => q.slug === screen) ??
        questions.find((q) => q.slug === screen) ??
        null
      : null;
  const pathLive = liveSteps(walk);
  const rows = reviewRows(walk, asked);

  useEffect(() => {
    return () => {
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
    };
  }, []);

  useEffect(() => {
    if (done || isReview || !step || step.qtype === "continue") return;
    setAsked((prev) => (prev.includes(step.slug) ? prev : [...prev, step.slug]));
  }, [done, isReview, step]);

  useEffect(() => {
    if (done || editingId) return;
    if (!isReview && step?.qtype !== "continue") return;
    const t = window.setTimeout(() => {
      acceptRef.current?.focus({ preventScroll: true });
    }, 40);
    return () => window.clearTimeout(t);
  }, [done, isReview, editingId, step?.qtype, screen]);

  function valueOf(slug: string): string {
    return answers[slug] || "";
  }

  function setValue(slug: string, next: string) {
    setAnswers((prev) => ({ ...prev, [slug]: next }));
    setError(null);
  }

  function goTo(next: Screen) {
    if (swapTimer.current) window.clearTimeout(swapTimer.current);
    setEditingId(null);
    setEditDraft("");
    setEditError(null);
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

  async function sendConversationInvite(
    nextEmail: string,
    when: string,
    host?: ApplyOutcome | null,
  ): Promise<void> {
    if (host === "trial") return;
    setBusy(true);
    try {
      const res = await fetch("/api/apply/invite", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: nextEmail.trim(),
          when,
          ...(host === "coach" || host === "lakesia" ? { host } : {}),
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok || payload?.ok !== true || payload?.sent !== true) {
        const detail =
          typeof payload?.detail === "string"
            ? payload.detail
            : `The calendar invite did not send (${res.status}).`;
        setInviteMiss(detail);
        return;
      }
      setInviteMiss(null);
    } catch {
      setInviteMiss("The calendar invite did not send. Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function writeApply(
    nextAnswers: Record<string, string>,
    extra: { when?: string; ending?: ApplyOutcome | null } = {},
  ): Promise<boolean> {
    setBusy(true);
    setFormError(null);
    try {
      const body = submitPayload(questions, nextAnswers, extra);
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
        return false;
      }
      if (extra.ending === "trial") {
        setBusy(false);
        return true;
      }
      if (swapTimer.current) window.clearTimeout(swapTimer.current);
      setLeavingId(screen);
      setDone(true);
      setLiveLayer("in");
      swapTimer.current = window.setTimeout(() => {
        setLeavingId(null);
        setLiveLayer("settled");
      }, SWAP_MS);
      return true;
    } catch {
      setFormError("The application did not write. Network error — try again.");
      setBusy(false);
      return false;
    }
  }

  function checkStep(q: ApplyQuestion, nextValue: string): string | null {
    const result = contentCheck(q, nextValue, slots);
    if (result.ok) {
      if (q.qtype === "calendar" && slotsError) return slotsError;
      return null;
    }
    return result.miss;
  }

  function hostSlots(host: ApplyOutcome | null) {
    if (host === "coach" || host === "lakesia") {
      return slots.filter((s) => s.host === host);
    }
    return slots;
  }

  function acceptReview() {
    if (busy || done || editingId) return;
    const missing = unansweredOnPath(walk, answers, slots);
    if (missing.length) {
      setFromReview(true);
      goTo(missing[0]);
      return;
    }
    if (ending === "trial") {
      void writeApply(answers, { ending: "trial" }).then((ok) => {
        if (ok && typeof window !== "undefined") {
          window.location.assign(score.trial_url);
        }
      });
      return;
    }
    if (ending === "coach" || ending === "lakesia") {
      const listed = hostSlots(ending);
      const when = endingWhen;
      const miss = contentCheck(
        {
          id: 0,
          slug: "ending",
          ask: "",
          hint: "",
          qtype: "calendar",
          options: [],
          is_email: false,
          on_path: false,
          sort_order: 0,
        },
        when,
        listed,
      );
      if (!miss.ok) {
        setError(miss.miss);
        return;
      }
      void sendConversationInvite(
        emailFromAnswers(questions, answers),
        when,
        ending,
      ).then(() => {
        void writeApply(answers, { when, ending });
      });
      return;
    }
    void writeApply(answers);
  }

  function startEdit(id: string) {
    if (busy || done) return;
    setEditingId(id);
    setEditDraft(valueOf(id));
    setEditError(null);
    setError(null);
    setFormError(null);
  }

  function finishInPlace() {
    setEditingId(null);
    setEditDraft("");
    setEditError(null);
    const missing = unansweredOnPath(walk, answers, slots);
    if (missing.length) {
      setFromReview(true);
      goTo(missing[0]);
    }
  }

  function finishAccept(stepSlug: string, nextAnswers: Record<string, string>) {
    if (fromReview) {
      const missing = unansweredOnPath(walkPath(questions, nextAnswers, scored), nextAnswers, slots);
      if (missing.length) {
        goTo(missing[0]);
        return;
      }
      setFromReview(false);
      goTo("review");
      return;
    }
    goTo(nextApplyStep(walkPath(questions, nextAnswers, scored), stepSlug));
  }

  function acceptInPlace(override?: string) {
    if (busy || done || !editingId) return;
    const editStep = questions.find((q) => q.slug === editingId);
    if (!editStep) return;
    const nextValue = override !== undefined ? override : editDraft;
    if (override !== undefined) setEditDraft(override);
    const miss = checkStep(editStep, nextValue);
    if (miss) {
      setEditError(miss);
      return;
    }
    const nextAnswers = { ...answers, [editingId]: nextValue };
    setAnswers(nextAnswers);
    if (editStep.qtype === "calendar") {
      void sendConversationInvite(
        emailFromAnswers(questions, nextAnswers),
        nextValue,
      ).then(() => {
        finishInPlace();
      });
      return;
    }
    finishInPlace();
  }

  function accept(override?: string) {
    if (busy || done) return;
    if (isReview) {
      acceptReview();
      return;
    }
    if (!step) return;
    const nextValue = override !== undefined ? override : valueOf(step.slug);
    if (override !== undefined) setValue(step.slug, override);
    const miss = checkStep(step, nextValue);
    if (miss) {
      setError(miss);
      return;
    }
    const nextAnswers = { ...answers, [step.slug]: nextValue };
    setAnswers(nextAnswers);
    if (step.qtype === "calendar") {
      void sendConversationInvite(
        emailFromAnswers(questions, nextAnswers),
        nextValue,
      ).then(() => {
        finishAccept(step.slug, nextAnswers);
      });
      return;
    }
    finishAccept(step.slug, nextAnswers);
  }

  function back() {
    if (busy || done) return;
    if (isReview && editingId) {
      setEditingId(null);
      setEditDraft("");
      setEditError(null);
      return;
    }
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
    const prev = prevApplyStep(walk, step.slug);
    if (!prev) return;
    goTo(prev);
  }

  if (admin?.isAdmin && admin.editMode) {
    return (
      <div className="apply-root" data-apply-screen="form-edit">
        <header className="apply-chrome">
          <ApplyMark />
          <p className="apply-progress" aria-live="polite">
            Edit
          </p>
        </header>
        <div className="apply-stage apply-stage--edit">
          <ApplyFormEditor />
        </div>
      </div>
    );
  }

  if (formMiss || (!questions.length && admin && !admin.questionsLoading)) {
    return (
      <div className="apply-root" data-apply-screen="miss">
        <header className="apply-chrome">
          <ApplyMark />
        </header>
        <div className="apply-stage">
          <h1 className="apply-question">Apply is not ready.</h1>
          <p className="apply-error" role="alert">
            {formMiss || "Apply questions are not configured."}
          </p>
        </div>
      </div>
    );
  }

  if (!step && !isReview && !done) {
    return (
      <div className="apply-root" data-apply-screen="load">
        <header className="apply-chrome">
          <ApplyMark />
        </header>
      </div>
    );
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
      {ending === "trial"
        ? `Observer is ${score.trial_price} for ${score.trial_term}. Tap a line to change an answer.`
        : ending
          ? "Tap a line to change an answer, then pick a time."
          : "Tap a line to change an answer."}
    </p>
  ) : (
    <p className="apply-hint" id={`apply-${step!.slug}-hint`}>
      {step!.hint}
    </p>
  );

  const liveField = done ? (
    <p className="apply-received-detail">
      The answers and the desk tag are on the contact.
    </p>
  ) : isReview ? (
    <>
    <ReviewList
      rows={rows}
      answers={answers}
      interactive
      editingId={editingId}
      editDraft={editDraft}
      editError={editError}
      slots={slots}
      slotsError={slotsError}
      onStartEdit={startEdit}
      onDraftChange={(v) => {
        setEditDraft(v);
        setEditError(null);
      }}
      onAcceptEdit={acceptInPlace}
      onCancelEdit={() => {
        setEditingId(null);
        setEditDraft("");
        setEditError(null);
      }}
    />
    {ending ? (
      <EndingPanel
        ending={ending}
        score={score}
        slots={slots}
        slotsError={slotsError}
        when={endingWhen}
        onPick={(next) => {
          setEndingWhen(next);
          setError(null);
        }}
      />
    ) : null}
    </>
  ) : (
    <StepBody
      step={step!}
      value={valueOf(step!.slug)}
      error={error}
      slots={slots}
      slotsError={slotsError}
      onChange={(v) => setValue(step!.slug, v)}
      onAccept={accept}
    />
  );

  const leavingIsReview = leavingId === "review";
  const leavingStep =
    leavingId && leavingId !== "review"
      ? questions.find((q) => q.slug === leavingId) ?? null
      : null;
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
    <ReviewList
      rows={rows}
      answers={answers}
      interactive={false}
      slots={slots}
      slotsError={slotsError}
    />
  ) : leavingStep ? (
    leavingStep.qtype === "continue" ? (
      <div className="apply-field-spacer" />
    ) : leavingStep.qtype === "binary" || leavingStep.qtype === "radio" ? (
      <div className={leavingStep.qtype === "binary" ? "apply-yesno" : "apply-times"}>
        {(optionLabels(leavingStep).length ? optionLabels(leavingStep) : ["—"]).map((c) => (
          <span
            key={c}
            className={leavingStep.qtype === "binary" ? "apply-choice" : "apply-time"}
            aria-hidden
          >
            {c}
          </span>
        ))}
      </div>
    ) : leavingStep.qtype === "calendar" ? (
      <div className="apply-times">
        <span className="apply-time" aria-hidden>
          {displayAnswer(leavingStep, valueOf(leavingStep.slug))}
        </span>
      </div>
    ) : leavingStep.is_email ? (
      <div className="apply-input">{valueOf(leavingStep.slug)}</div>
    ) : (
      <div className="apply-textarea">{valueOf(leavingStep.slug)}</div>
    )
  ) : null;

  const progress = done
    ? "Done"
    : isReview
      ? "Review"
      : (() => {
          const pos = pathLive.indexOf(screen);
          return pos >= 0
            ? `${pos + 1} of ${pathLive.length}`
            : `${pathLive.length} of ${pathLive.length}`;
        })();

  const firstSlug = walk[0]?.slug;
  const showFieldBack =
    !done && !isReview && step !== null && step.slug !== firstSlug;
  const showReviewBack = !done && isReview && !editingId;
  const growField =
    isReview ||
    leavingIsReview ||
    step?.qtype === "calendar" ||
    step?.qtype === "radio" ||
    Boolean(ending) ||
    leavingStep?.qtype === "calendar" ||
    leavingStep?.qtype === "radio";

  return (
    <div className="apply-root" data-apply-screen={done ? "received" : screen}>
      <header className="apply-chrome">
        <ApplyMark />
        <p className="apply-progress" aria-live="polite">
          {progress}
        </p>
      </header>

      <div className="apply-stage">
        <SlotTriple
          stageKey={done ? "received" : screen}
          leaving={leavingId !== null}
          liveLayer={liveLayer}
          fieldReview={Boolean(growField)}
          question={liveQuestion}
          hint={liveHint}
          field={liveField}
          actions={
            done || (isReview && editingId) ? null : (
              <ActionPair
                showBack={isReview ? showReviewBack : showFieldBack}
                okLabel={
                  isReview
                    ? ending === "trial"
                      ? `Observer · ${score.trial_price} · ${score.trial_term}`
                      : "Accept"
                    : nextLabel(step!)
                }
                okRef={acceptRef}
                okBusy={busy}
                okDisabled={busy}
                okControl={isReview ? "review" : step!.qtype}
                onBack={back}
                onOk={() => accept()}
              />
            )
          }
          leavingQuestion={leavingQuestion}
          leavingHint={leavingHint}
          leavingField={leavingField}
          leavingActions={
            leavingIsReview ? (
              <ActionPair
                showBack
                okLabel="Accept"
                okControl="review"
                inert
              />
            ) : leavingStep ? (
              <ActionPair
                showBack={leavingStep.slug !== firstSlug}
                okLabel={nextLabel(leavingStep)}
                okControl={leavingStep.qtype}
                inert
              />
            ) : null
          }
        />
        <p
          id={isReview ? "apply-review-error" : `apply-${step?.slug ?? "screen"}-error`}
          className="apply-error"
          role={error || formError ? "alert" : undefined}
        >
          {formError || error || inviteMiss || ""}
        </p>
      </div>
    </div>
  );
}
