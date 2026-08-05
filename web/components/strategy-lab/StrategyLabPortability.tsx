"use client";

/**
 * Download / Load whole Strategy Lab packs (Portability Spec v1.0).
 */

import { useRef, useState } from "react";
import {
  commitLabImport,
  downloadLabPack,
  previewLabImport,
  type StrategyLabImportPreview,
  type StrategyLabPack,
} from "@/lib/strategyLabApi";

type Props = {
  onImported?: () => void;
  className?: string;
};

export default function StrategyLabPortability({
  onImported,
  className = "",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pack, setPack] = useState<StrategyLabPack | null>(null);
  const [preview, setPreview] = useState<StrategyLabImportPreview | null>(null);
  const [policy, setPolicy] = useState<"additive" | "replace_lab">("additive");
  const [showPanel, setShowPanel] = useState(false);

  async function onDownload() {
    setErr(null);
    setMsg(null);
    setBusy(true);
    const res = await downloadLabPack();
    setBusy(false);
    if (!res.ok) setErr(res.error);
    else setMsg("Lab downloaded as JSON.");
  }

  async function onFile(file: File | null) {
    setErr(null);
    setMsg(null);
    setPreview(null);
    setPack(null);
    if (!file) return;
    setBusy(true);
    try {
      const text = await file.text();
      const doc = JSON.parse(text) as StrategyLabPack;
      if (doc.format !== "fattail.labs.strategy_lab") {
        setErr("Not a Strategy Lab pack (wrong format).");
        setBusy(false);
        return;
      }
      setPack(doc);
      setShowPanel(true);
      const { preview: p, error } = await previewLabImport(doc, policy);
      if (error) setErr(error);
      if (p) setPreview(p);
    } catch {
      setErr("Could not parse JSON file.");
    }
    setBusy(false);
  }

  async function runPreview(nextPolicy: "additive" | "replace_lab") {
    if (!pack) return;
    setPolicy(nextPolicy);
    setBusy(true);
    setErr(null);
    const { preview: p, error } = await previewLabImport(pack, nextPolicy);
    setBusy(false);
    if (error) setErr(error);
    if (p) setPreview(p);
  }

  async function onCommit() {
    if (!pack) return;
    if (policy === "replace_lab") {
      const ok = window.confirm(
        "Replace lab will DELETE all strategies on your account, then load this pack. Continue?",
      );
      if (!ok) return;
    }
    setBusy(true);
    setErr(null);
    setMsg(null);
    const { result, error } = await commitLabImport(
      pack,
      policy,
      policy === "replace_lab" ? "REPLACE_LAB" : undefined,
    );
    setBusy(false);
    if (error) {
      setErr(error);
      return;
    }
    const recovery =
      result && "recovery_id" in result && result.recovery_id
        ? ` Recovery id: ${String(result.recovery_id)} (undo via API if needed).`
        : "";
    setMsg(
      `Import complete — created ${result?.created ?? 0}, skipped ${result?.skipped ?? 0}` +
        (result?.purged ? `, purged ${result.purged}` : "") +
        "." +
        recovery,
    );
    setPreview(null);
    setPack(null);
    if (fileRef.current) fileRef.current.value = "";
    onImported?.();
  }

  return (
    <div className={className} data-testid="strategy-lab-portability">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDownload()}
          className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
        >
          Download lab
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setShowPanel(true);
            fileRef.current?.click();
          }}
          className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--color-fill)] disabled:opacity-50"
        >
          Load lab…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {(msg || err) && (
        <p
          className={
            "mt-2 text-sm " +
            (err ? "text-red-600" : "text-emerald-700")
          }
        >
          {err || msg}
        </p>
      )}

      {showPanel && pack && (
        <div className="mt-3 rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-3 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-label)]">
                Load preview
              </p>
              <p className="text-xs text-[var(--color-label-secondary)]">
                {pack.lab?.label || "Strategy Lab pack"} ·{" "}
                {pack.lab?.counts?.total ?? pack.strategies?.length ?? 0}{" "}
                strategies · model {pack.model_version}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[var(--color-label-secondary)] underline"
              onClick={() => {
                setShowPanel(false);
                setPack(null);
                setPreview(null);
              }}
            >
              Dismiss
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="sl-import-policy"
                checked={policy === "additive"}
                onChange={() => void runPreview("additive")}
              />
              Additive (safe — skip existing)
            </label>
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name="sl-import-policy"
                checked={policy === "replace_lab"}
                onChange={() => void runPreview("replace_lab")}
              />
              Replace lab (wipe first)
            </label>
          </div>

          {preview && (
            <div className="mt-3 space-y-1 text-xs text-[var(--color-label-secondary)]">
              <p>
                Create <strong className="text-[var(--color-label)]">{preview.summary.create}</strong>
                {" · "}
                Skip <strong className="text-[var(--color-label)]">{preview.summary.skip}</strong>
                {" · "}
                Warnings {preview.summary.warnings}
                {" · "}
                Errors{" "}
                <strong
                  className={
                    preview.summary.errors
                      ? "text-red-600"
                      : "text-[var(--color-label)]"
                  }
                >
                  {preview.summary.errors}
                </strong>
              </p>
              {preview.by_phase && (
                <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
                  {Object.entries(preview.by_phase).map(([phase, row]) => (
                    <li key={phase} className="rounded bg-[var(--color-fill)] px-2 py-1">
                      <span className="font-semibold capitalize text-[var(--color-label)]">
                        {phase}
                      </span>
                      : +{row.create} → {row.after_total}
                    </li>
                  ))}
                </ul>
              )}
              {(preview.issues || [])
                .filter((i) => i.level === "error")
                .slice(0, 5)
                .map((i, idx) => (
                  <p key={idx} className="text-red-600">
                    {i.code}: {i.detail}
                  </p>
                ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !preview?.ok}
              onClick={() => void onCommit()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {policy === "replace_lab" ? "Replace & load" : "Load pack"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
