"use client";

import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Markdown from "@/components/Markdown";
import MarkdownEditor from "@/components/ui/MarkdownEditor";

type Mode = "read" | "markdown";

const BTN =
  "inline-flex min-h-11 items-center rounded-lg border border-[var(--color-separator)] " +
  "bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-label)] " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
  "focus-visible:outline-[var(--color-tint)]";

function downloadBlob(filename: string, text: string) {
  const body = text.endsWith("\n") ? text : `${text}\n`;
  const url = URL.createObjectURL(new Blob([body], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function insertAround(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
): { next: string; caret: number } {
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  return { next, caret: start + before.length + selected.length + after.length };
}

export default function TapeGuide({
  id,
  title,
  href,
  markdown,
  downloadHref,
  downloadName,
}: {
  id: string;
  title: string;
  href: string;
  markdown: string;
  downloadHref: string;
  downloadName: string;
}) {
  const [text, setText] = useState(markdown);
  const [mode, setMode] = useState<Mode>("read");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const readTabRef = useRef<HTMLButtonElement>(null);
  const editTabRef = useRef<HTMLButtonElement>(null);
  const dirty = text !== markdown;
  const titleId = `guide-${id}-title`;
  const panelId = `guide-${id}-panel`;
  const helpId = `guide-${id}-editor-help`;

  function focusMode(next: Mode) {
    setMode(next);
    requestAnimationFrame(() => {
      (next === "read" ? readTabRef : editTabRef).current?.focus();
    });
  }

  function onTabKey(event: KeyboardEvent) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    focusMode(mode === "read" ? "markdown" : "read");
  }

  function applyInsert(before: string, after = "") {
    const el = editorRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const { next, caret } = insertAround(text, start, end, before, after);
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(caret, caret);
    });
  }

  function onDownload(event: MouseEvent<HTMLAnchorElement>) {
    if (text === markdown) return;
    event.preventDefault();
    downloadBlob(downloadName, text);
  }

  return (
    <article id={`guide-${id}`} aria-labelledby={titleId} className="scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label={`${title} guide`} className="flex gap-2" onKeyDown={onTabKey}>
          <button
            ref={readTabRef}
            type="button"
            role="tab"
            id={`guide-${id}-tab-read`}
            aria-selected={mode === "read"}
            aria-controls={panelId}
            tabIndex={mode === "read" ? 0 : -1}
            className={mode === "read" ? `${BTN} border-[var(--color-tint)] font-semibold` : BTN}
            onClick={() => setMode("read")}
          >
            Reading
          </button>
          <button
            ref={editTabRef}
            type="button"
            role="tab"
            id={`guide-${id}-tab-markdown`}
            aria-selected={mode === "markdown"}
            aria-controls={panelId}
            tabIndex={mode === "markdown" ? 0 : -1}
            className={mode === "markdown" ? `${BTN} border-[var(--color-tint)] font-semibold` : BTN}
            onClick={() => setMode("markdown")}
          >
            Markdown editor
          </button>
        </div>
        <a href={href} className={BTN}>
          Open {title}
        </a>
        <a href={downloadHref} download={downloadName} className={BTN} onClick={onDownload}>
          Download Markdown
        </a>
        {dirty ? (
          <button type="button" className={BTN} onClick={() => setText(markdown)}>
            Restore the published guide
          </button>
        ) : null}
      </div>

      <div
        role="tabpanel"
        id={panelId}
        aria-labelledby={mode === "read" ? `guide-${id}-tab-read` : `guide-${id}-tab-markdown`}
        className="mt-4"
      >
        {mode === "read" ? (
          <Markdown headingOffset={2} titleId={titleId}>
            {text}
          </Markdown>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p id={helpId} className="text-sm leading-6 text-[var(--color-label-secondary)]">
                Tables, footnotes, strikethrough, task lists, and automatic links all format in the preview.
                Typing here changes this browser only. Download saves the published guide, or this version
                after you edit.
              </p>
              <div className="mt-3 flex flex-wrap gap-2" role="toolbar" aria-label="Formatting">
                <button
                  type="button"
                  className={BTN}
                  onClick={() =>
                    applyInsert("| Column | What it means |\n| --- | --- |\n|  |  |\n")
                  }
                >
                  Insert table
                </button>
                <button type="button" className={BTN} onClick={() => applyInsert("~~", "~~")}>
                  Strikethrough
                </button>
                <button type="button" className={BTN} onClick={() => applyInsert("- [ ] ")}>
                  Task item
                </button>
                <button
                  type="button"
                  className={BTN}
                  onClick={() => applyInsert("[^note]", "\n\n[^note]: ")}
                >
                  Footnote
                </button>
              </div>
              <label htmlFor={`guide-${id}-editor`} className="mt-3 block text-sm font-medium">
                Markdown source for {title}
              </label>
              <MarkdownEditor
                ref={editorRef}
                id={`guide-${id}-editor`}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={18}
                aria-describedby={helpId}
                className="mt-1 min-h-80"
              />
            </div>
            <div>
              <p className="text-base font-semibold">Formatted preview</p>
              <Markdown headingOffset={2} titleId={titleId}>
                {text}
              </Markdown>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
