"use client";

/**
 * Spec v0.6 §8.3 / J3 — admin list / view / create / activate journal prompt versions.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";

type VersionSummary = {
  id: string;
  label: string;
  is_active: boolean;
  body_preview: string;
  body_len: number;
  created_at: string | null;
};

type VersionFull = {
  id: string;
  label: string;
  body_md: string;
  is_active: boolean;
};

async function parse<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const b = await r.json().catch(() => ({}));
    const d = (b as { detail?: string }).detail;
    throw new Error(typeof d === "string" ? d : `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export default function JournalPromptsAdminPanel() {
  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [selected, setSelected] = useState<VersionFull | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newId, setNewId] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newBody, setNewBody] = useState("");
  const [activateOnCreate, setActivateOnCreate] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const d = await parse<{ versions: VersionSummary[] }>(
        await fetch("/api/admin/journal-prompts", { credentials: "same-origin" }),
      );
      setVersions(d.versions || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openVersion(id: string) {
    setBusy(true);
    setErr(null);
    try {
      const d = await parse<{ version: VersionFull }>(
        await fetch(`/api/admin/journal-prompts/${encodeURIComponent(id)}`, {
          credentials: "same-origin",
        }),
      );
      setSelected(d.version);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    } finally {
      setBusy(false);
    }
  }

  async function activate(id: string) {
    setBusy(true);
    setErr(null);
    try {
      await parse(
        await fetch(
          `/api/admin/journal-prompts/${encodeURIComponent(id)}/activate`,
          { method: "POST", credentials: "same-origin" },
        ),
      );
      await load();
      if (selected?.id === id) {
        setSelected({ ...selected, is_active: true });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Activate failed");
    } finally {
      setBusy(false);
    }
  }

  async function createVersion() {
    setBusy(true);
    setErr(null);
    try {
      await parse(
        await fetch("/api/admin/journal-prompts", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newId.trim(),
            label: newLabel.trim(),
            body_md: newBody,
            activate: activateOnCreate,
          }),
        }),
      );
      setShowCreate(false);
      setNewId("");
      setNewLabel("");
      setNewBody("");
      setActivateOnCreate(false);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="admin-journal-prompts">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Journal prompts
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Versioned agent system prompts. New journal sessions stamp the
            active version; historical sessions keep their stamp.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={busy}
          onClick={() => setShowCreate((v) => !v)}
          data-testid="admin-journal-prompt-new"
        >
          {showCreate ? "Cancel" : "New version"}
        </Button>
      </div>

      {err && (
        <p className="text-sm text-red-600" role="alert">
          {err}
        </p>
      )}

      {showCreate && (
        <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <label className="block text-sm">
            Id
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="JOURNAL_SESSION_SYSTEM_PROMPT_V2"
              data-testid="admin-journal-prompt-id"
            />
          </label>
          <label className="block text-sm">
            Label
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-950"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              data-testid="admin-journal-prompt-label"
            />
          </label>
          <label className="block text-sm">
            Body
            <textarea
              className="mt-1 w-full rounded border border-zinc-300 px-2 py-1.5 font-mono text-xs dark:border-zinc-600 dark:bg-zinc-950"
              rows={12}
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              data-testid="admin-journal-prompt-body"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={activateOnCreate}
              onChange={(e) => setActivateOnCreate(e.target.checked)}
            />
            Activate immediately
          </label>
          <Button
            type="button"
            variant="primary"
            disabled={busy}
            onClick={() => void createVersion()}
            data-testid="admin-journal-prompt-create"
          >
            Save version
          </Button>
        </div>
      )}

      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
        {versions.map((v) => (
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
          >
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={() => void openVersion(v.id)}
              data-testid={`admin-journal-prompt-row-${v.id}`}
            >
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {v.label}
              </span>
              {v.is_active && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100">
                  Active
                </span>
              )}
              <span className="mt-0.5 block font-mono text-xs text-zinc-500">
                {v.id}
              </span>
            </button>
            {!v.is_active && (
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void activate(v.id)}
                data-testid={`admin-journal-prompt-activate-${v.id}`}
              >
                Activate
              </Button>
            )}
          </li>
        ))}
        {versions.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-zinc-500">
            No versions yet.
          </li>
        )}
      </ul>

      {selected && (
        <div
          className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
          data-testid="admin-journal-prompt-detail"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
              {selected.label}
            </h2>
            <button
              type="button"
              className="text-xs text-zinc-500 underline"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <p className="mb-2 font-mono text-xs text-zinc-500">{selected.id}</p>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded bg-zinc-50 p-3 text-xs dark:bg-zinc-950">
            {selected.body_md}
          </pre>
        </div>
      )}
    </div>
  );
}
