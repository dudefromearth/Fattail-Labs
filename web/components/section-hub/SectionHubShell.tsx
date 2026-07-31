"use client";

/**
 * Section hub chrome for Labs / Resources / Live.
 * Same in-place edit language as the course hub: Edit → dashed affordance →
 * click description to replace rendered markdown with a textarea.
 */

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import type { SitePage } from "@/lib/sitePage";
import { SectionHubEditProvider, useSectionHubEdit } from "./SectionHubEditContext";

const AFFORDANCE =
  "cursor-pointer rounded outline-dashed outline-1 outline-offset-4 outline-emerald-400/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30";

function EditBar() {
  const edit = useSectionHubEdit();
  if (!edit?.isAdmin) return null;

  if (!edit.editMode) {
    return (
      <button
        type="button"
        onClick={() => edit.setEditMode(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Edit
      </button>
    );
  }

  const n = Object.keys(edit.dirty).length;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing hub</span>
        <span className="text-xs text-zinc-500">
          Click the title or description below the heading to edit
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-500">
            {n} pending {n === 1 ? "change" : "changes"}
          </span>
          <button
            type="button"
            className="chip"
            onClick={edit.discard}
            disabled={edit.saving}
          >
            Discard
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => edit.setEditMode(false)}
            disabled={edit.saving}
          >
            Exit
          </button>
          <button
            type="button"
            onClick={() => void edit.save()}
            disabled={edit.saving}
            className="rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {edit.saving ? "Saving…" : "Save"}
          </button>
        </span>
      </div>
    </div>
  );
}

function EditableTitle({ pageTitle }: { pageTitle: string }) {
  const edit = useSectionHubEdit();
  const display = edit?.value("title", pageTitle) ?? pageTitle;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(display);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  if (!edit?.editMode) {
    return <>{display}</>;
  }

  if (!editing) {
    return (
      <span
        className={AFFORDANCE}
        title="Click to edit title"
        onClick={() => {
          setDraft(display);
          setEditing(true);
        }}
      >
        {display || (
          <span className="italic text-zinc-400">Click to add title…</span>
        )}
      </span>
    );
  }

  const commit = () => {
    edit.setField("title", draft);
    setEditing(false);
  };

  return (
    <input
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="w-full rounded border-0 bg-transparent p-0 text-3xl font-semibold tracking-tight outline-none ring-2 ring-emerald-500"
    />
  );
}

/** Description: display markdown; in edit mode, click to replace with textarea. */
function EditableDescription({ pageDescription }: { pageDescription: string }) {
  const edit = useSectionHubEdit();
  const display =
    edit?.value("description_md", pageDescription) ?? pageDescription;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(display);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) areaRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  // Display mode (member or admin not editing hub)
  if (!edit?.editMode) {
    if (!display.trim()) return null;
    return (
      <div className="prose prose-zinc dark:prose-invert max-w-none text-[var(--color-label-secondary)]">
        <Markdown>{display}</Markdown>
      </div>
    );
  }

  // Hub edit mode: show dashed box; click opens textarea that replaces the text
  if (!editing) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={`${AFFORDANCE} min-h-[6rem] p-2`}
        title="Click to edit description (markdown)"
        onClick={() => {
          setDraft(display);
          setEditing(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setDraft(display);
            setEditing(true);
          }
        }}
      >
        {display.trim() ? (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-[var(--color-label-secondary)]">
            <Markdown>{display}</Markdown>
          </div>
        ) : (
          <p className="italic text-zinc-400">
            Click to add hub description (markdown)…
          </p>
        )}
        <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-emerald-600">
          Click to edit description
        </p>
      </div>
    );
  }

  const commit = () => {
    edit.setField("description_md", draft);
    setEditing(false);
  };

  return (
    <div className="space-y-2">
      <textarea
        ref={areaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(display);
            setEditing(false);
          }
        }}
        rows={Math.max(8, draft.split("\n").length + 2)}
        placeholder="Markdown description for members and SEO…"
        className="w-full resize-y rounded-lg border-0 bg-transparent p-2 font-mono text-sm leading-relaxed text-[var(--color-label)] outline-none ring-2 ring-emerald-500"
      />
      <p className="text-xs text-zinc-500">
        Markdown supported. Blur or click outside to apply; then use{" "}
        <strong>Save</strong> on the bar below.
      </p>
    </div>
  );
}

function Header({ page }: { page: SitePage }) {
  return (
    <header className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        <EditableTitle pageTitle={page.title} />
      </h1>
      <div className="mt-3 text-base leading-relaxed text-[var(--color-label-secondary)]">
        <EditableDescription pageDescription={page.description_md ?? ""} />
      </div>
    </header>
  );
}

export default function SectionHubShell({
  page,
  children,
  /** Spec Tag Manager §9a / Practice §0 — sub-app pills sit above the title. */
  beforeHeader,
}: {
  page: SitePage;
  children: React.ReactNode;
  beforeHeader?: React.ReactNode;
}) {
  return (
    <SectionHubEditProvider slug={page.slug} initial={page}>
      <EditBar />
      {beforeHeader ? <div className="mb-4">{beforeHeader}</div> : null}
      <Header page={page} />
      <div className="mt-8 pb-20">{children}</div>
    </SectionHubEditProvider>
  );
}
