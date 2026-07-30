"use client";

/**
 * J2 structured form — Spec v0.2 §5 · JS2-2.
 * Confirmation gate UI; no agent. Process-first; no shame/P&L chrome (Tango).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import {
  fetchTagSchema,
  patchJournalSession,
  sealJournalSession,
  partialJournalSession,
  TAG_LABELS,
  type ChecklistStatus,
  type JournalSession,
  type SchemaField,
  type TagSchema,
} from "@/lib/journalSessionApi";

type Props = {
  session: JournalSession;
  busy?: boolean;
  onBusy?: (v: boolean) => void;
  onError?: (msg: string | null) => void;
  onUpdated: (session: JournalSession) => void;
};

function strVal(v: unknown): string {
  if (v == null) return "";
  return String(v);
}

export default function StructuredSessionForm({
  session,
  busy = false,
  onBusy,
  onError,
  onUpdated,
}: Props) {
  const mutable =
    session.status === "open" || session.status === "partial";
  const [schema, setSchema] = useState<TagSchema | null>(null);
  const [schemaErr, setSchemaErr] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sealMode, setSealMode] = useState<"complete" | "partial_ok">("complete");

  const checklist: ChecklistStatus | undefined = session.checklist;

  // Load schema when tag changes
  useEffect(() => {
    let cancelled = false;
    setSchemaErr(null);
    (async () => {
      try {
        const s = await fetchTagSchema(session.tag || "reflection");
        if (!cancelled) setSchema(s);
      } catch (e) {
        if (!cancelled) {
          setSchemaErr(
            e instanceof Error ? e.message : "Could not load form schema",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session.tag]);

  // Sync values from session structured when session id/structured changes
  useEffect(() => {
    const st = session.structured || {};
    const next: Record<string, string> = {};
    for (const [k, v] of Object.entries(st)) {
      next[k] = strVal(v);
    }
    setValues(next);
    setDirty(false);
    setConfirmOpen(false);
  }, [session.id, session.structured, session.status]);

  const fields: SchemaField[] = schema?.fields || [];

  const localChecklist = useMemo(() => {
    if (!fields.length) return checklist;
    const missing: string[] = [];
    const fieldRows = fields.map((f) => {
      const present = Boolean(values[f.key]?.trim());
      const satisfied = !f.required_for_complete || present;
      if (f.required_for_complete && !present) missing.push(f.key);
      return {
        key: f.key,
        label: f.label,
        present,
        required_for_complete: f.required_for_complete,
        satisfied,
      };
    });
    return {
      tag: session.tag || "reflection",
      complete: missing.length === 0,
      missing_required: missing,
      fields: fieldRows,
    } satisfies ChecklistStatus;
  }, [fields, values, session.tag, checklist]);

  const setField = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
    setSaveState("idle");
  }, []);

  async function saveStructured(): Promise<JournalSession | null> {
    if (!mutable) return session;
    onBusy?.(true);
    onError?.(null);
    setSaveState("saving");
    try {
      const structured: Record<string, string> = {};
      for (const f of fields) {
        const v = (values[f.key] || "").trim();
        if (v) structured[f.key] = v;
      }
      // Include any keys still in values not in schema (shouldn't happen)
      const updated = await patchJournalSession(session.id, { structured });
      onUpdated(updated);
      setDirty(false);
      setSaveState("saved");
      return updated;
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save form");
      setSaveState("idle");
      return null;
    } finally {
      onBusy?.(false);
    }
  }

  async function onSavePartial() {
    const saved = dirty ? await saveStructured() : session;
    if (!saved && dirty) return;
    onBusy?.(true);
    onError?.(null);
    try {
      const updated = await partialJournalSession(session.id);
      onUpdated(updated);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not save partial");
    } finally {
      onBusy?.(false);
    }
  }

  function openConfirmSeal() {
    setSealMode(
      localChecklist?.complete ? "complete" : "partial_ok",
    );
    setConfirmOpen(true);
  }

  async function confirmSeal() {
    onBusy?.(true);
    onError?.(null);
    try {
      if (dirty) {
        const saved = await saveStructured();
        if (!saved) return;
      }
      const require_complete = sealMode === "complete";
      if (require_complete && localChecklist && !localChecklist.complete) {
        onError?.(
          "Checklist still incomplete. Fill required fields, or seal as partial record.",
        );
        setSealMode("partial_ok");
        return;
      }
      const updated = await sealJournalSession(session.id, {
        require_complete,
      });
      onUpdated(updated);
      setConfirmOpen(false);
    } catch (e) {
      onError?.(e instanceof Error ? e.message : "Could not seal entry");
    } finally {
      onBusy?.(false);
    }
  }

  if (schemaErr) {
    return (
      <p className="text-sm text-red-600" role="alert">
        {schemaErr}
      </p>
    );
  }

  if (!schema) {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">
        Loading form…
      </p>
    );
  }

  if (!schema.known || fields.length === 0) {
    return (
      <p className="text-sm text-[var(--color-label-tertiary)]">
        No structured form for this entry type.
      </p>
    );
  }

  return (
    <div className="space-y-4" data-testid="journal-structured-form">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[var(--color-label)]">
            Structured record · {TAG_LABELS[session.tag || "reflection"] || session.tag}
          </h4>
          <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
            Confirm fields in your words. Leave blank if unknown — absent is
            valid. No agent required.
          </p>
        </div>
        {mutable && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="!min-h-8 !px-2.5 !text-xs"
              disabled={busy || (!dirty && saveState === "saved")}
              onClick={() => void saveStructured()}
              data-testid="journal-form-save"
            >
              {saveState === "saving"
                ? "Saving…"
                : saveState === "saved" && !dirty
                  ? "Saved"
                  : "Save fields"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!min-h-8 !px-2.5 !text-xs"
              disabled={busy}
              onClick={() => void onSavePartial()}
            >
              Save partial
            </Button>
            <Button
              type="button"
              variant="primary"
              className="!min-h-8 !px-2.5 !text-xs"
              disabled={busy}
              onClick={openConfirmSeal}
              data-testid="journal-form-seal-open"
            >
              Seal entry…
            </Button>
          </div>
        )}
      </div>

      {/* Checklist summary — process only, no grade/shame (Tango) */}
      {localChecklist && (
        <div
          className="rounded-[var(--radius-md)] bg-[var(--color-fill)]/50 px-3 py-2 text-xs text-[var(--color-label-secondary)]"
          data-testid="journal-form-checklist"
        >
          {localChecklist.complete ? (
            <span>Checklist ready for a complete seal.</span>
          ) : (
            <span>
              Not yet captured:{" "}
              {localChecklist.missing_required
                .map((k) => fields.find((f) => f.key === k)?.label || k)
                .join(", ") || "—"}
              . You can still save partial or seal with what you have.
            </span>
          )}
        </div>
      )}

      {schema.hotel_note && (
        <p className="text-xs text-[var(--color-label-tertiary)]">
          {schema.hotel_note}
        </p>
      )}

      <div className="space-y-3">
        {fields.map((f) => {
          const required = f.required_for_complete;
          return (
            <label key={f.key} className="block">
              <span className="mb-1 flex items-baseline gap-1.5 text-sm font-medium text-[var(--color-label)]">
                {f.label}
                {required && (
                  <span className="text-[10px] font-normal uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    for complete seal
                  </span>
                )}
                {f.prefillable && (
                  <span className="text-[10px] font-normal text-[var(--color-label-tertiary)]">
                    · may prefill
                  </span>
                )}
              </span>
              <textarea
                value={values[f.key] || ""}
                onChange={(e) => setField(f.key, e.target.value)}
                disabled={!mutable || busy}
                rows={f.key === "invalidation" || f.key === "note" ? 3 : 2}
                placeholder={f.hint}
                className="w-full resize-y rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-label)] placeholder:text-[var(--color-label-tertiary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)] disabled:opacity-60"
                data-testid={`journal-field-${f.key}`}
                aria-required={required}
              />
            </label>
          );
        })}
      </div>

      {!mutable && (
        <p className="text-sm text-[var(--color-label-secondary)]">
          This entry is closed — fields are read-only. Start another entry for a
          new sitting.
        </p>
      )}

      {/* Confirmation gate before seal (Appendix B spirit) */}
      {confirmOpen && mutable && (
        <div
          className="rounded-[var(--radius-lg)] border border-[var(--color-tint)]/40 bg-[var(--color-surface-secondary)] p-4"
          role="dialog"
          aria-labelledby="seal-confirm-title"
          data-testid="journal-seal-confirm"
        >
          <h5
            id="seal-confirm-title"
            className="text-sm font-semibold text-[var(--color-label)]"
          >
            Seal this entry?
          </h5>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            A journal entry is one sitting. You won&apos;t be able to add to it
            after this. What you&apos;ve confirmed is kept.
          </p>
          {localChecklist && !localChecklist.complete && (
            <p className="mt-2 text-sm text-[var(--color-label-secondary)]">
              Not yet captured:{" "}
              <strong className="font-medium text-[var(--color-label)]">
                {localChecklist.missing_required
                  .map((k) => fields.find((f) => f.key === k)?.label || k)
                  .join(", ")}
              </strong>
              . Sealing without them is fine — they stay absent, not invented.
            </p>
          )}

          <div className="mt-3 space-y-2">
            {localChecklist?.complete ? (
              <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-label)]">
                <input
                  type="radio"
                  name="seal-mode"
                  checked={sealMode === "complete"}
                  onChange={() => setSealMode("complete")}
                  className="mt-1"
                />
                <span>
                  <strong className="font-medium">Complete seal</strong> —
                  checklist satisfied; record is falsifiable as filled.
                </span>
              </label>
            ) : (
              <p className="text-xs text-[var(--color-label-tertiary)]">
                Complete seal needs required fields first. You can still seal
                with absences below.
              </p>
            )}
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-label)]">
              <input
                type="radio"
                name="seal-mode"
                checked={sealMode === "partial_ok"}
                onChange={() => setSealMode("partial_ok")}
                className="mt-1"
              />
              <span>
                <strong className="font-medium">Seal with absences</strong> —
                keep what you confirmed; leave the rest blank (no grade, no
                penalty).
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              className="!min-h-9 !text-sm"
              disabled={busy}
              onClick={() => void confirmSeal()}
              data-testid="journal-seal-confirm-go"
            >
              Seal entry
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="!min-h-9 !text-sm"
              disabled={busy}
              onClick={() => setConfirmOpen(false)}
            >
              Stay here
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
