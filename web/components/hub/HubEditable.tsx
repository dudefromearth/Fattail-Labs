"use client";

// Hub in-place editors (same affordance language as course Editable).

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { uploadMedia } from "@/lib/client";
import { useHubEdit } from "./HubEditContext";

const AFFORDANCE =
  "cursor-pointer rounded outline-dashed outline-1 outline-offset-4 outline-emerald-400/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30";

export function HubEditableText({
  field,
  value,
  as: Tag = "span",
  className = "",
  multiline = false,
}: {
  field: string;
  value: string;
  as?: React.ElementType;
  className?: string;
  multiline?: boolean;
}) {
  const edit = useHubEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const display = edit?.value(field, value) ?? value;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!edit?.editMode) {
    return <Tag className={className}>{display}</Tag>;
  }

  if (!editing) {
    return (
      <Tag
        className={`${className} ${AFFORDANCE}`}
        title="Click to edit"
        onClick={() => {
          setDraft(display);
          setEditing(true);
        }}
      >
        {display || <span className="italic text-zinc-400">Click to add…</span>}
      </Tag>
    );
  }

  const commit = () => {
    edit.setField(field, draft);
    setEditing(false);
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        rows={Math.max(3, draft.split("\n").length + 1)}
        className={`w-full resize-y border-0 bg-transparent p-0 outline-none ring-2 ring-emerald-500 rounded ${className}`}
      />
    );
  }

  return (
    <input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className={`w-full border-0 bg-transparent p-0 outline-none ring-2 ring-emerald-500 rounded ${className}`}
    />
  );
}

export function HubEditableMarkdown({
  field,
  value,
  className = "",
  onChange,
}: {
  field?: string;
  value: string;
  className?: string;
  /** When set, commits here instead of hub page field map (for FAQ answers). */
  onChange?: (md: string) => void;
}) {
  const edit = useHubEdit();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(value);
  const [uploading, setUploading] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const display =
    field && edit ? edit.value(field, value) : value;

  useEffect(() => {
    if (editing && !preview) areaRef.current?.focus();
  }, [editing, preview]);

  useEffect(() => {
    if (!editing) setDraft(display);
  }, [display, editing]);

  async function embedImages(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setUploadErr(null);
    const ta = areaRef.current;
    for (const file of images) {
      const alt = file.name.replace(/\.[^.]+$/, "");
      const placeholder = `![Uploading ${file.name}…]()`;
      if (ta) {
        const start = ta.selectionStart ?? draft.length;
        const end = ta.selectionEnd ?? start;
        setDraft(
          (d) => d.slice(0, start) + `${placeholder}\n` + d.slice(end),
        );
      } else {
        setDraft((d) => d + `\n${placeholder}\n`);
      }
      setUploading((n) => n + 1);
      const url = await uploadMedia(file);
      setUploading((n) => n - 1);
      if (url) {
        setDraft((d) => d.replace(placeholder, `![${alt}](${url})`));
      } else {
        setDraft((d) =>
          d.replace(`${placeholder}\n`, "").replace(placeholder, ""),
        );
        setUploadErr("Image upload failed");
      }
    }
  }

  if (!edit?.editMode) {
    if (!display) return null;
    return (
      <div className={className}>
        <Markdown>{display}</Markdown>
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        className={`${className} ${AFFORDANCE}`}
        title="Click to edit"
        onClick={() => {
          setDraft(display);
          setPreview(false);
          setEditing(true);
        }}
      >
        {display ? (
          <Markdown>{display}</Markdown>
        ) : (
          <p className="text-sm italic text-zinc-400">Click to add markdown…</p>
        )}
      </div>
    );
  }

  const commit = () => {
    if (uploading > 0) return;
    if (onChange) onChange(draft);
    else if (field) edit.setField(field, draft);
    setEditing(false);
  };

  return (
    <div className={`${className} rounded-xl ring-2 ring-emerald-500`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">
        <button
          type="button"
          onClick={() => setPreview(false)}
          className={`rounded-full px-2.5 py-0.5 ${!preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Markdown
        </button>
        <button
          type="button"
          onClick={() => setPreview(true)}
          className={`rounded-full px-2.5 py-0.5 ${preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Preview
        </button>
        <label className="cursor-pointer rounded-full border border-zinc-300 px-2.5 py-0.5 font-medium text-zinc-600 hover:border-zinc-500 dark:border-zinc-700 dark:text-zinc-300">
          🖼 Insert image…
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) embedImages([...e.target.files]);
              e.target.value = "";
            }}
          />
        </label>
        {uploading > 0 && (
          <span className="text-zinc-500">Uploading…</span>
        )}
        {uploadErr && <span className="text-red-600">{uploadErr}</span>}
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-zinc-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={commit}
            disabled={uploading > 0}
            className="font-medium text-emerald-600 disabled:opacity-50"
          >
            Done
          </button>
        </span>
      </div>
      {preview ? (
        <div className="p-3">
          <Markdown>{draft}</Markdown>
        </div>
      ) : (
        <textarea
          ref={areaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={(e) => {
            const files = [...e.clipboardData.files];
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              embedImages(files);
            }
          }}
          onDrop={(e) => {
            const files = [...e.dataTransfer.files];
            if (files.some((f) => f.type.startsWith("image/"))) {
              e.preventDefault();
              embedImages(files);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          rows={Math.max(6, draft.split("\n").length + 2)}
          className="w-full resize-y bg-transparent p-3 font-mono text-sm outline-none"
        />
      )}
    </div>
  );
}
