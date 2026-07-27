"use client";

// Hub in-place editors — commit one field on blur/Done (course Editable pattern).

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
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const display = edit?.value(field, value) ?? value;
  const fieldError = edit?.fieldErrors[field] ?? null;

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  if (!edit?.editMode) {
    return <Tag className={className}>{display}</Tag>;
  }

  if (!editing) {
    return (
      <Tag
        className={`${className} ${AFFORDANCE} ${fieldError ? "outline-red-500" : ""}`}
        title={fieldError || "Click to edit — saves when you leave the field"}
        onClick={() => {
          setDraft(display);
          setEditing(true);
          edit.clearFieldError(field);
        }}
      >
        {display || <span className="italic text-zinc-400">Click to add…</span>}
      </Tag>
    );
  }

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    const ok = await edit.commitField(field, draft);
    setSaving(false);
    if (ok) setEditing(false);
  };

  if (multiline) {
    return (
      <textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          edit.clearFieldError(field);
        }}
        onBlur={() => {
          void commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setDraft(display);
            setEditing(false);
          }
        }}
        rows={Math.max(3, draft.split("\n").length + 1)}
        className={`w-full resize-y border-0 bg-transparent p-0 outline-none ring-2 ring-emerald-500 rounded ${className}`}
      />
    );
  }

  return (
    <span className="relative inline-block min-w-[4rem] max-w-full">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          edit.clearFieldError(field);
        }}
        onBlur={() => {
          void commit();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
          if (e.key === "Escape") {
            setDraft(display);
            setEditing(false);
          }
        }}
        className={`w-full border-0 bg-transparent p-0 outline-none ring-2 ring-emerald-500 rounded ${className}`}
      />
      {fieldError && (
        <span className="mt-1 block text-xs text-red-600" role="alert">
          {fieldError}
        </span>
      )}
    </span>
  );
}

export function HubEditableMarkdown({
  field,
  value,
  className = "",
  onChange,
  onCommit,
}: {
  field?: string;
  value: string;
  className?: string;
  /** When set, commits here instead of hub page field map (for FAQ answers). */
  onChange?: (md: string) => void;
  /** Optional async flush after local onChange (FAQ list save). */
  onCommit?: () => void | Promise<void>;
}) {
  const edit = useHubEdit();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(value);
  const [uploading, setUploading] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const display =
    field && edit ? edit.value(field, value) : value;
  const fieldError =
    field && edit ? (edit.fieldErrors[field] ?? null) : null;

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
        className={`${className} ${AFFORDANCE} min-h-[2.5rem]`}
        title={fieldError || "Click to edit — saves when you click Done"}
        onClick={() => {
          setDraft(display);
          setPreview(false);
          setEditing(true);
          if (field) edit.clearFieldError(field);
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

  const commit = async () => {
    if (uploading > 0 || saving) return;
    setSaving(true);
    if (onChange) {
      onChange(draft);
      if (onCommit) await onCommit();
      setSaving(false);
      setEditing(false);
      return;
    }
    if (field) {
      const ok = await edit.commitField(field, draft);
      setSaving(false);
      if (ok) setEditing(false);
      return;
    }
    setSaving(false);
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
        <label className="chip cursor-pointer text-xs font-medium">
          🖼 Insert image…
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (files?.length) void embedImages(Array.from(files));
              e.target.value = "";
            }}
          />
        </label>
        {uploading > 0 && (
          <span className="text-zinc-500">Uploading {uploading}…</span>
        )}
        {uploadErr && <span className="text-red-600">{uploadErr}</span>}
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(display);
              setEditing(false);
            }}
            className="text-zinc-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void commit();
            }}
            className="font-medium text-emerald-600"
          >
            {saving ? "Saving…" : "Done"}
          </button>
        </span>
      </div>
      {fieldError && (
        <p className="px-3 pt-2 text-xs font-medium text-red-600" role="alert">
          {fieldError}
        </p>
      )}
      {preview ? (
        <div className="p-3">
          <Markdown>{draft}</Markdown>
        </div>
      ) : (
        <textarea
          ref={areaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(display);
              setEditing(false);
            }
          }}
          rows={Math.max(8, draft.split("\n").length + 2)}
          className="w-full resize-y bg-transparent p-3 font-mono text-sm outline-none"
        />
      )}
    </div>
  );
}
