"use client";

// In-place editors (spec v1.1 §1): the element IS the editor. Display markup is
// identical to the static output; affordances attach only in edit mode.

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { useEdit } from "./EditContext";

const AFFORDANCE =
  "cursor-pointer rounded outline-dashed outline-1 outline-offset-4 outline-emerald-400/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30";

export function EditableText({
  field,
  value,
  as: Tag = "span",
  className = "",
  inputClassName = "",
}: {
  field: string;
  value: string;
  as?: React.ElementType;
  className?: string;
  inputClassName?: string;
}) {
  const edit = useEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

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
        {display}
      </Tag>
    );
  }

  const commit = () => {
    edit.setField(field, draft);
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
      className={`w-full border-0 bg-transparent p-0 outline-none ring-2 ring-emerald-500 rounded ${className} ${inputClassName}`}
    />
  );
}

export function EditableMarkdown({
  field,
  value,
  className = "",
}: {
  field: string;
  value: string;
  className?: string;
}) {
  const edit = useEdit();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(value);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const display = edit?.value(field, value) ?? value;

  useEffect(() => {
    if (editing && !preview) areaRef.current?.focus();
  }, [editing, preview]);

  if (!edit?.editMode) {
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
        <Markdown>{display}</Markdown>
      </div>
    );
  }

  const commit = () => {
    edit.setField(field, draft);
    setEditing(false);
  };

  return (
    <div className={`${className} rounded-xl ring-2 ring-emerald-500`}>
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">
        <button
          onClick={() => setPreview(false)}
          className={`rounded-full px-2.5 py-0.5 ${!preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Markdown
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`rounded-full px-2.5 py-0.5 ${preview ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Preview
        </button>
        <span className="ml-auto flex gap-2">
          <button onClick={() => setEditing(false)} className="text-zinc-500">
            Cancel
          </button>
          <button onClick={commit} className="font-medium text-emerald-600">
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
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          rows={Math.max(8, draft.split("\n").length + 2)}
          className="w-full resize-y bg-transparent p-3 font-mono text-sm outline-none"
        />
      )}
    </div>
  );
}

export function EditableSelect({
  field,
  value,
  options,
  className = "",
}: {
  field: string;
  value: string;
  options: string[];
  className?: string;
}) {
  const edit = useEdit();
  const display = edit?.value(field, value) ?? value;

  if (!edit?.editMode) {
    return <span className={className}>{display}</span>;
  }
  return (
    <select
      value={display}
      onChange={(e) => edit.setField(field, e.target.value)}
      className={`cursor-pointer rounded border-0 bg-transparent outline-dashed outline-1 outline-offset-2 outline-emerald-400/70 ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o} className="text-zinc-900">
          {o}
        </option>
      ))}
    </select>
  );
}
