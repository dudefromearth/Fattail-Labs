"use client";

/**
 * Export / import Practice data — full pack or individual JSON.
 * Used in Practice suite chrome and Profile → Your data.
 */

import Link from "next/link";
import { useRef, useState } from "react";
import {
  commitPracticeImport,
  downloadPracticeExport,
  exportOptionsForSuite,
  fileToBase64,
  PRACTICE_EXPORT_OPTIONS,
  previewPracticeImport,
  type ImportPreview,
  type PracticeExportOption,
} from "@/lib/practicePortability";

type Props = {
  /** When set, prioritize this suite’s surfaces + full pack. */
  suiteId?: string;
  /** Compact strip for suite chrome vs full profile section. */
  variant?: "chrome" | "profile";
  className?: string;
};

export default function PracticePortabilityPanel({
  suiteId,
  variant = "chrome",
  className = "",
}: Props) {
  const options: PracticeExportOption[] = suiteId
    ? exportOptionsForSuite(suiteId)
    : PRACTICE_EXPORT_OPTIONS;

  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [payload, setPayload] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(variant === "profile");

  async function onExport(opt: PracticeExportOption) {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await downloadPracticeExport(opt.path, opt.filename);
      setMsg(`Download started: ${opt.filename}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Download failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onPickFile(file: File) {
    setImporting(true);
    setErr(null);
    setMsg(null);
    setPreview(null);
    setPayload(null);
    try {
      const b64 = await fileToBase64(file);
      const p = await previewPracticeImport(b64);
      setPayload(b64);
      setPreview(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setImporting(false);
    }
  }

  async function onCommit() {
    if (!payload) return;
    setImporting(true);
    setErr(null);
    try {
      await commitPracticeImport(payload);
      setMsg("Import complete (additive — existing rows kept).");
      setPreview(null);
      setPayload(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  const shell =
    variant === "profile"
      ? "surface-card border border-[var(--color-separator)] p-6"
      : "mt-3 rounded-[var(--radius-md)] border border-[var(--color-separator)] bg-[var(--color-fill)]/40 px-3 py-2";

  return (
    <section
      className={`${shell} ${className}`}
      data-testid="practice-portability"
      aria-label="Practice data export and import"
    >
      {variant === "chrome" ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--color-label-secondary)]">
            <span className="font-medium text-[var(--color-label)]">
              Export / import
            </span>
            {" — "}
            this app’s JSON or your full Practice pack.{" "}
            <Link href="/me" className="text-[var(--color-tint)] hover:underline">
              Profile → Your data
            </Link>
          </p>
          <button
            type="button"
            className="text-xs font-medium text-[var(--color-tint)] hover:underline"
            data-testid="practice-portability-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            {open ? "Hide" : "Show"}
          </button>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">Your data</h2>
          <p className="mt-1 text-sm text-[var(--color-label-secondary)]">
            Download a <strong>complete Practice pack</strong> (ZIP or JSON) or
            any <strong>individual surface</strong> as JSON. Load accepts a pack
            or a single-surface file. Import is{" "}
            <strong>additive only</strong> — existing entries are never
            overwritten. Journey grades are recalculated from activity (not
            restored as scores). Course progress stays with membership and is
            not in the Practice file.
          </p>
        </>
      )}

      {(open || variant === "profile") && (
        <div className={variant === "chrome" ? "mt-2 space-y-2" : "mt-4 space-y-3"}>
          <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
              const isFullZip =
                opt.path.includes("format=zip") ||
                opt.filename === "fattail-member-export.zip";
              return (
              <button
                key={`${opt.path}-${opt.filename}`}
                type="button"
                disabled={busy}
                data-testid={
                  isFullZip && variant === "profile"
                    ? "download-my-data"
                    : `export-${opt.filename.replace(/\./g, "-")}`
                }
                className={
                  variant === "profile"
                    ? isFullZip
                      ? "rounded-full bg-[var(--color-tint)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                      : "rounded-full border border-[var(--color-separator)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--color-fill)] disabled:opacity-60"
                    : "rounded-full border border-[var(--color-separator)] bg-white px-2.5 py-1 text-xs font-medium hover:bg-[var(--color-fill)] disabled:opacity-60 dark:bg-zinc-950"
                }
                title={opt.note}
                onClick={() => void onExport(opt)}
              >
                {busy ? "…" : isFullZip && variant === "profile" ? "Download my data (ZIP)" : `↓ ${opt.label}`}
              </button>
              );
            })}
          </div>

          {variant === "profile" && (
            <ul className="list-inside list-disc text-xs text-[var(--color-label-secondary)]">
              {PRACTICE_EXPORT_OPTIONS.filter((o) => o.note && o.id !== "pack").map(
                (o) => (
                  <li key={o.filename}>
                    <span className="font-medium">{o.label}:</span> {o.note}
                  </li>
                ),
              )}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".json,.zip,application/json,application/zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = "";
                if (f) void onPickFile(f);
              }}
            />
            <button
              type="button"
              disabled={importing}
              data-testid={
                variant === "profile" ? "load-practice-data" : "practice-import-pick"
              }
              className={
                variant === "profile"
                  ? "rounded-full border border-[var(--color-separator)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-fill)] disabled:opacity-60"
                  : "rounded-full border border-[var(--color-separator)] bg-white px-2.5 py-1 text-xs font-medium hover:bg-[var(--color-fill)] disabled:opacity-60 dark:bg-zinc-950"
              }
              onClick={() => fileRef.current?.click()}
            >
              {importing
                ? "Reading…"
                : variant === "profile"
                  ? "Load Practice data"
                  : "Load file…"}
            </button>
            {payload && preview && (
              <button
                type="button"
                disabled={importing}
                data-testid={
                  variant === "profile" ? "import-confirm" : "practice-import-commit"
                }
                className="rounded-full bg-[var(--color-tint)] px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                onClick={() => void onCommit()}
              >
                Confirm import
              </button>
            )}
          </div>

          {preview && (
            <div
              className="rounded border border-[var(--color-separator)] bg-white/80 p-2 text-xs dark:bg-zinc-950/80"
              data-testid={
                variant === "profile" ? "import-preview" : "practice-import-preview"
              }
            >
              <p className="font-medium">Import preview (additive)</p>
              <ul className="mt-1 space-y-0.5 text-[var(--color-label-secondary)]">
                {Object.entries(preview.surfaces || {}).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-[var(--color-label)]">
                      {k}
                    </span>
                    :{" "}
                    {v.note ||
                      Object.entries(v.counts || {})
                        .map(([ck, n]) => `${ck}=${n}`)
                        .join(", ") ||
                      "ok"}
                  </li>
                ))}
              </ul>
              {(preview.errors || []).length > 0 && (
                <p className="mt-1 text-red-600">
                  {(preview.errors || []).join("; ")}
                </p>
              )}
            </div>
          )}

          {(msg || err) && (
            <p
              className={`text-xs ${err ? "text-red-600" : "text-[var(--color-tint)]"}`}
              role="status"
            >
              {err || msg}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
