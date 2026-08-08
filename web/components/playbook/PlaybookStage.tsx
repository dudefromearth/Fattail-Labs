"use client";

/**
 * 16:9 scrapbook stage — read / edit markdown (Spec v1.1a).
 * Desktop: aspect-video frame. Phone read: natural scroll (no fake 16:9).
 */

import Markdown from "@/components/Markdown";

export default function PlaybookStage({
  title,
  bodyMd,
  editing,
  draft,
  onDraftChange,
  present,
}: {
  title?: string | null;
  bodyMd: string;
  editing?: boolean;
  draft?: string;
  onDraftChange?: (v: string) => void;
  /** Present mode: no chrome around content */
  present?: boolean;
}) {
  const content = editing ? (draft ?? bodyMd) : bodyMd;

  return (
    <div
      className={
        present
          ? "flex h-full w-full flex-col bg-[var(--color-canvas)] text-[var(--color-label)]"
          : "w-full"
      }
      data-testid="playbook-stage"
    >
      <div
        className={
          present
            ? "flex min-h-0 flex-1 flex-col overflow-auto px-8 py-6 md:px-16 md:py-10"
            : // Desktop: 16:9 card; mobile: open height
              "relative w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-[var(--elevation-1)] " +
              "md:aspect-video md:overflow-auto"
        }
      >
        <div
          className={
            present
              ? "mx-auto w-full max-w-4xl"
              : "h-full min-h-[12rem] p-4 sm:p-6 md:absolute md:inset-0 md:overflow-auto"
          }
        >
          {title && (
            <h2
              className={
                present
                  ? "mb-4 text-2xl font-semibold tracking-tight md:text-3xl"
                  : "mb-3 text-lg font-semibold text-[var(--color-label)]"
              }
            >
              {title}
            </h2>
          )}
          {editing ? (
            <textarea
              className="h-[min(50vh,22rem)] w-full resize-y rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-3 py-2 font-mono text-sm text-[var(--color-label)] md:h-[calc(100%-2.5rem)]"
              value={content}
              onChange={(e) => onDraftChange?.(e.target.value)}
              placeholder="Markdown for this page…"
              data-testid="playbook-page-editor"
              aria-label="Page markdown"
            />
          ) : content.trim() ? (
            <div className={present ? "text-base md:text-lg" : "text-sm"}>
              <Markdown>{content}</Markdown>
            </div>
          ) : (
            <p className="text-sm text-[var(--color-label-tertiary)]">
              Empty page — switch to Edit to write.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
