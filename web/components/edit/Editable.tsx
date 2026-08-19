"use client";

// In-place editors (spec v1.1 §1): the element IS the editor. Display markup is
// identical to the static output; affordances attach only in edit mode.
// Field commits autosave on blur / Enter / Done (EditContext.commitField).
// Name conflicts keep the field open with a red halo until the user renames.
// Admins can Option/Alt+click any editable field while viewing to enter edit
// mode and open that field immediately.

import { useEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { displayDatetime } from "@/lib/applyFields";
import { useApplySlotsEdit } from "./ApplySlotsEditContext";
import { useEdit } from "./EditContext";
import type { FieldEditApi } from "./fieldEdit";

export type { FieldEditApi };

export function useFieldEdit(): FieldEditApi | null {
  const slots = useApplySlotsEdit();
  const course = useEdit();
  if (slots) return slots;
  if (!course) return null;
  return course;
}

const AFFORDANCE =
  "cursor-pointer rounded outline-dashed outline-1 outline-offset-4 outline-emerald-400/70 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30";

const AFFORDANCE_ERROR =
  "cursor-pointer rounded outline outline-2 outline-offset-2 outline-red-500 ring-2 ring-red-500/40 hover:bg-red-50/40 dark:hover:bg-red-950/20";

/** Option (macOS) / Alt (Windows) + click → enter edit and open this field. */
function isOptionClick(e: React.MouseEvent): boolean {
  return e.altKey;
}

export function EditableText({
  field,
  value,
  as: Tag = "span",
  className = "",
  inputClassName = "",
  placeholder = "Click to edit…",
}: {
  field: string;
  value: string;
  as?: React.ElementType;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}) {
  const edit = useFieldEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const display = edit?.value(field, value) ?? value;
  const fieldError = edit?.fieldErrors[field] ?? null;

  useEffect(() => {
    if (editing || fieldError) inputRef.current?.focus();
  }, [editing, fieldError]);

  // Stay open when a name conflict (or other field error) lands.
  useEffect(() => {
    if (fieldError) {
      setEditing(true);
      setDraft(edit?.value(field, value) ?? value);
    }
  }, [fieldError, field, value, edit]);

  // Option+click entry: open this field once edit mode is on.
  useEffect(() => {
    if (!edit?.editMode) return;
    if (edit.pendingOpenField !== field) return;
    setDraft(edit.value(field, value));
    setEditing(true);
    edit.clearFieldError(field);
  }, [edit, edit?.editMode, edit?.pendingOpenField, field, value]);

  if (!edit?.editMode) {
    if (edit?.isAdmin) {
      return (
        <Tag
          className={`${className} cursor-default`}
          title="⌥-click (Option/Alt) to edit"
          onClick={(e: React.MouseEvent) => {
            if (!isOptionClick(e)) return;
            e.preventDefault();
            e.stopPropagation();
            edit.enterEditAtField(field);
          }}
        >
          {display}
        </Tag>
      );
    }
    return <Tag className={className}>{display}</Tag>;
  }

  if (!editing) {
    return (
      <Tag
        className={`${className} ${fieldError ? AFFORDANCE_ERROR : AFFORDANCE} min-w-[4rem] inline-block`}
        title={
          fieldError ||
          "Click to edit — saves when you leave the field"
        }
        onClick={() => {
          setDraft(display);
          setEditing(true);
          edit.clearFieldError(field);
        }}
      >
        {display.trim() ? (
          display
        ) : (
          <span className="italic text-zinc-400">{placeholder}</span>
        )}
      </Tag>
    );
  }

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    edit.clearFieldError(field);
    const ok = await edit.commitField(field, draft);
    setSaving(false);
    if (ok) setEditing(false);
    // On failure (e.g. name conflict) stay in edit mode with red halo.
  };

  return (
    <span className="relative inline-block min-w-[4rem] max-w-full">
      <input
        ref={inputRef}
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
            edit.clearFieldError(field);
            setEditing(false);
          }
        }}
        aria-invalid={!!fieldError}
        aria-describedby={fieldError ? `${field}-err` : undefined}
        className={`w-full border-0 bg-transparent p-0 outline-none rounded ${className} ${inputClassName} ${
          fieldError
            ? "ring-2 ring-red-500 outline outline-2 outline-offset-2 outline-red-500"
            : "ring-2 ring-emerald-500"
        }`}
      />
      {fieldError && (
        <span
          id={`${field}-err`}
          role="alert"
          className="mt-1 block max-w-md text-xs font-medium text-red-600 dark:text-red-400"
        >
          {fieldError}
        </span>
      )}
    </span>
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
  const edit = useFieldEdit();
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [draft, setDraft] = useState(value);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const display = edit?.value(field, value) ?? value;
  const fieldError = edit?.fieldErrors[field] ?? null;

  useEffect(() => {
    if (editing && !preview) areaRef.current?.focus();
  }, [editing, preview]);

  // Option+click entry: open this field once edit mode is on.
  useEffect(() => {
    if (!edit?.editMode) return;
    if (edit.pendingOpenField !== field) return;
    setDraft(edit.value(field, value));
    setPreview(false);
    setEditing(true);
    edit.clearFieldError(field);
  }, [edit, edit?.editMode, edit?.pendingOpenField, field, value]);

  if (!edit?.editMode) {
    if (edit?.isAdmin) {
      return (
        <div
          className={`${className} cursor-default`}
          title="⌥-click (Option/Alt) to edit"
          onClick={(e) => {
            if (!isOptionClick(e)) return;
            e.preventDefault();
            e.stopPropagation();
            edit.enterEditAtField(field);
          }}
        >
          <Markdown>{display}</Markdown>
        </div>
      );
    }
    return (
      <div className={className}>
        <Markdown>{display}</Markdown>
      </div>
    );
  }

  if (!editing) {
    return (
      <div
        className={`${className} ${fieldError ? AFFORDANCE_ERROR : AFFORDANCE} min-h-[2.5rem]`}
        title={fieldError || "Click to edit — saves when you click Done or leave the field"}
        onClick={() => {
          setDraft(display);
          setPreview(false);
          setEditing(true);
          edit.clearFieldError(field);
        }}
      >
        {display.trim() ? (
          <Markdown>{display}</Markdown>
        ) : (
          <p className="italic text-zinc-400">Click to write…</p>
        )}
      </div>
    );
  }

  const commit = async () => {
    edit.clearFieldError(field);
    const ok = await edit.commitField(field, draft);
    if (ok) setEditing(false);
  };

  return (
    <div
      className={`${className} rounded-xl ${
        fieldError ? "ring-2 ring-red-500" : "ring-2 ring-emerald-500"
      }`}
    >
      <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-1.5 text-xs dark:border-zinc-800">
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
        <span className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(display);
              edit.clearFieldError(field);
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
            Done
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
          onChange={(e) => {
            setDraft(e.target.value);
            edit.clearFieldError(field);
          }}
          onBlur={(e) => {
            const next = e.relatedTarget as Node | null;
            if (next && e.currentTarget.parentElement?.contains(next)) return;
            void commit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(display);
              edit.clearFieldError(field);
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
  const edit = useFieldEdit();
  const display = edit?.value(field, value) ?? value;
  const fieldError = edit?.fieldErrors[field] ?? null;
  const selectRef = useRef<HTMLSelectElement>(null);

  // Option+click entry: focus the select once edit mode is on.
  useEffect(() => {
    if (!edit?.editMode) return;
    if (edit.pendingOpenField !== field) return;
    // Next paint so the select is mounted.
    requestAnimationFrame(() => selectRef.current?.focus());
  }, [edit, edit?.editMode, edit?.pendingOpenField, field]);

  if (!edit?.editMode) {
    if (edit?.isAdmin) {
      return (
        <span
          className={`${className} cursor-default`}
          title="⌥-click (Option/Alt) to edit"
          onClick={(e) => {
            if (!isOptionClick(e)) return;
            e.preventDefault();
            e.stopPropagation();
            edit.enterEditAtField(field);
          }}
        >
          {display}
        </span>
      );
    }
    return <span className={className}>{display}</span>;
  }
  return (
    <span className="inline-flex flex-col">
      <select
        ref={selectRef}
        value={display}
        onChange={(e) => {
          edit.clearFieldError(field);
          void edit.commitField(field, e.target.value);
        }}
        aria-invalid={!!fieldError}
        className={`cursor-pointer rounded border-0 bg-transparent ${
          fieldError
            ? "outline outline-2 outline-offset-2 outline-red-500"
            : "outline-dashed outline-1 outline-offset-2 outline-emerald-400/70"
        } ${className}`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="text-zinc-900">
            {o}
          </option>
        ))}
      </select>
      {fieldError && (
        <span className="mt-0.5 text-xs text-red-600" role="alert">
          {fieldError}
        </span>
      )}
    </span>
  );
}

/** Day/time editor — same click / dashed / blur-commit language as EditableText. */
export function EditableDatetime({
  field,
  value,
  className = "",
  placeholder = "Click to set time…",
}: {
  field: string;
  value: string;
  className?: string;
  placeholder?: string;
}) {
  const edit = useFieldEdit();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const display = edit?.value(field, value) ?? value;
  const fieldError = edit?.fieldErrors[field] ?? null;
  const label = display.trim() ? displayDatetime(display) : "";

  useEffect(() => {
    if (editing || fieldError) inputRef.current?.focus();
  }, [editing, fieldError]);

  useEffect(() => {
    if (fieldError) {
      setEditing(true);
      setDraft(edit?.value(field, value) ?? value);
    }
  }, [fieldError, field, value, edit]);

  useEffect(() => {
    if (!edit?.editMode) return;
    if (edit.pendingOpenField !== field) return;
    setDraft(edit.value(field, value));
    setEditing(true);
    edit.clearFieldError(field);
  }, [edit, edit?.editMode, edit?.pendingOpenField, field, value]);

  if (!edit?.editMode) {
    if (edit?.isAdmin) {
      return (
        <span
          className={`${className} cursor-default`}
          title="⌥-click (Option/Alt) to edit"
          onClick={(e: React.MouseEvent) => {
            if (!isOptionClick(e)) return;
            e.preventDefault();
            e.stopPropagation();
            edit.enterEditAtField(field);
          }}
        >
          {label || placeholder}
        </span>
      );
    }
    return <span className={className}>{label || placeholder}</span>;
  }

  if (!editing) {
    return (
      <span
        className={`${className} ${fieldError ? AFFORDANCE_ERROR : AFFORDANCE} min-w-[8rem] inline-block`}
        title={fieldError || "Click to edit — saves when you leave the field"}
        onClick={() => {
          setDraft(display);
          setEditing(true);
          edit.clearFieldError(field);
        }}
      >
        {label ? (
          label
        ) : (
          <span className="italic text-zinc-400">{placeholder}</span>
        )}
      </span>
    );
  }

  const commit = async () => {
    if (saving) return;
    setSaving(true);
    edit.clearFieldError(field);
    const ok = await edit.commitField(field, draft);
    setSaving(false);
    if (ok) setEditing(false);
  };

  return (
    <span className="relative inline-block min-w-[8rem] max-w-full">
      <input
        ref={inputRef}
        type="datetime-local"
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
            edit.clearFieldError(field);
            setEditing(false);
          }
        }}
        aria-invalid={!!fieldError}
        aria-describedby={fieldError ? `${field}-err` : undefined}
        className={`w-full border-0 bg-transparent p-0 outline-none rounded ${className} ${
          fieldError
            ? "ring-2 ring-red-500 outline outline-2 outline-offset-2 outline-red-500"
            : "ring-2 ring-emerald-500"
        }`}
      />
      {fieldError && (
        <span
          id={`${field}-err`}
          role="alert"
          className="mt-1 block max-w-md text-xs font-medium text-red-600 dark:text-red-400"
        >
          {fieldError}
        </span>
      )}
    </span>
  );
}
