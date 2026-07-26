"use client";

import Markdown from "@/components/Markdown";
import type { SitePage } from "@/lib/sitePage";
import { SectionHubEditProvider, useSectionHubEdit } from "./SectionHubEditContext";

function EditBar() {
  const edit = useSectionHubEdit();
  if (!edit?.isAdmin) return null;
  if (!edit.editMode) {
    return (
      <button
        type="button"
        onClick={() => edit.setEditMode(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
      >
        Edit hub
      </button>
    );
  }
  const n = Object.keys(edit.dirty).length;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3">
        <span className="text-sm font-semibold">Editing hub</span>
        <span className="text-xs text-zinc-500">{n} pending</span>
        <span className="ml-auto flex gap-2">
          <button type="button" className="chip" onClick={edit.discard} disabled={edit.saving}>
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
            className="rounded-full bg-emerald-500 px-5 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {edit.saving ? "Saving…" : "Save"}
          </button>
        </span>
      </div>
    </div>
  );
}

function Header({ page }: { page: SitePage }) {
  const edit = useSectionHubEdit();
  const title = edit?.value("title", page.title) ?? page.title;
  const description =
    edit?.value("description_md", page.description_md ?? "") ??
    page.description_md ??
    "";

  return (
    <header className="max-w-3xl">
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-label)]">
        {edit?.editMode ? (
          <input
            value={title}
            onChange={(e) => edit.setField("title", e.target.value)}
            className="w-full rounded-lg border border-emerald-400/50 bg-transparent px-2 py-1"
          />
        ) : (
          title
        )}
      </h1>
      <div className="mt-3 text-base leading-relaxed text-[var(--color-label-secondary)]">
        {edit?.editMode ? (
          <textarea
            value={description}
            onChange={(e) => edit.setField("description_md", e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-emerald-400/50 bg-transparent px-3 py-2 font-mono text-sm"
            placeholder="Markdown description for SEO and members…"
          />
        ) : description.trim() ? (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-[var(--color-label-secondary)]">
            <Markdown>{description}</Markdown>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default function SectionHubShell({
  page,
  children,
}: {
  page: SitePage;
  children: React.ReactNode;
}) {
  return (
    <SectionHubEditProvider slug={page.slug} initial={page}>
      <EditBar />
      <Header page={page} />
      <div className="mt-8">{children}</div>
    </SectionHubEditProvider>
  );
}
