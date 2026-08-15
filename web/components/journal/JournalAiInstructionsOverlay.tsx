"use client";

/**
 * Admin AI Instructions overlay — sits on the Journal message box.
 * Edit button (lower-left) is the Labs convention; Close dismisses.
 * Markdown window matches Playbook / Toughness (MarkdownEditor).
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import MarkdownEditor from "@/components/ui/MarkdownEditor";
import { useIsAdmin } from "@/lib/useIsAdmin";

const REASONING = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

type Version = {
  id: string;
  label: string;
  body_md: string;
  reasoning_level: string;
};

export default function JournalAiInstructionsChrome({
  overlayTarget,
}: {
  /** Message-box node the overlay covers. */
  overlayTarget: React.ReactNode;
}) {
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-0" data-testid="journal-message-stage">
      {overlayTarget}
      {isAdmin && open ? (
        <JournalAiInstructionsOverlay onClose={() => setOpen(false)} />
      ) : null}
      {isAdmin ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="AI Instructions"
          data-testid="journal-admin-edit"
          className="fixed bottom-6 left-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Edit
        </button>
      ) : null}
    </div>
  );
}

function JournalAiInstructionsOverlay({ onClose }: { onClose: () => void }) {
  const [version, setVersion] = useState<Version | null>(null);
  const [body, setBody] = useState("");
  const [reasoning, setReasoning] = useState("medium");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    const r = await fetch("/api/admin/journal-prompts/active", {
      credentials: "same-origin",
    });
    if (!r.ok) {
      setErr(`Could not load instructions (${r.status})`);
      return;
    }
    const d = (await r.json()) as { version: Version };
    setVersion(d.version);
    setBody(d.version.body_md || "");
    setReasoning(d.version.reasoning_level || "medium");
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    if (!version || busy) return;
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const r = await fetch(
        `/api/admin/journal-prompts/${encodeURIComponent(version.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body_md: body,
            reasoning_level: reasoning,
          }),
        },
      );
      if (!r.ok) {
        const t = await r.json().catch(() => ({}));
        const detail = (t as { detail?: string }).detail;
        throw new Error(
          typeof detail === "string" ? detail : `Save failed (${r.status})`,
        );
      }
      const d = (await r.json()) as { version: Version };
      setVersion(d.version);
      setBody(d.version.body_md);
      setReasoning(d.version.reasoning_level);
      setSaved(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-2)]"
      data-testid="journal-ai-instructions"
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-ai-instructions-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--color-separator)] px-4 py-2.5">
        <h2
          id="journal-ai-instructions-title"
          className="text-sm font-semibold text-[var(--color-label)]"
        >
          AI Instructions
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
          aria-label="Close"
          data-testid="journal-ai-instructions-close"
        >
          ×
        </button>
      </div>

      <div className="min-h-0 flex-1 p-3">
        {err ? (
          <p className="mb-2 text-sm text-[var(--color-destructive)]" role="alert">
            {err}
          </p>
        ) : null}
        <MarkdownEditor
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            setSaved(false);
          }}
          className="h-full min-h-[12rem]"
          placeholder="Markdown instructions for the Journal model…"
          aria-label="AI instructions markdown"
          data-testid="journal-ai-instructions-body"
          disabled={busy || !version}
        />
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--color-separator)] px-4 py-2.5">
        <label className="flex items-center gap-2 text-sm text-[var(--color-label)]">
          <span className="text-[var(--color-label-secondary)]">Reasoning</span>
          <select
            value={reasoning}
            onChange={(e) => {
              setReasoning(e.target.value);
              setSaved(false);
            }}
            disabled={busy}
            data-testid="journal-ai-reasoning"
            aria-label="Reasoning level"
            className="rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tint)]"
          >
            {REASONING.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3">
          {saved ? (
            <span className="text-xs text-[var(--color-success)]">Saved</span>
          ) : null}
          <Button
            type="button"
            variant="primary"
            disabled={busy || !version}
            onClick={() => void save()}
            data-testid="journal-ai-instructions-save"
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
