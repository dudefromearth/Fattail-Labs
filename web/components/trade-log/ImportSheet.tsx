"use client";

import { useEffect, useMemo, useState } from "react";
import type { Account } from "@/lib/tradeLog";
import {
  createCampaign,
  fetchCampaigns,
  type PracticeCampaign,
} from "@/lib/practiceSpineApi";

type PreviewTrade = {
  exec_at?: string;
  strategy?: string;
  net_price?: number | null;
  net_side?: string | null;
  legs?: { side?: string; quantity?: number; underlier?: string; strike?: number }[];
};

/** Campaign target for import: account default, existing id, or create-new. */
type CampMode = "default" | "pick" | "new";

export default function ImportSheet({
  open,
  accounts,
  defaultAccountId,
  onClose,
  onImported,
}: {
  open: boolean;
  accounts: Account[];
  defaultAccountId: number | null;
  onClose: () => void;
  onImported: () => void;
}) {
  const [accountId, setAccountId] = useState<number | "">("");
  const [adapter, setAdapter] = useState("auto");
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [detections, setDetections] = useState<{ id: string; confidence: number }[]>(
    [],
  );
  const [preview, setPreview] = useState<{
    trade_count: number;
    trades: PreviewTrade[];
    warnings: string[];
    errors: string[];
    adapter?: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<PracticeCampaign[]>([]);
  const [campMode, setCampMode] = useState<CampMode>("default");
  const [pickedCampId, setPickedCampId] = useState<number | "">("");
  const [newCampTitle, setNewCampTitle] = useState("");

  useEffect(() => {
    if (!open) return;
    setAccountId(defaultAccountId ?? accounts.find((a) => a.status === "active")?.id ?? "");
    setText("");
    setFileName(null);
    setPreview(null);
    setDetections([]);
    setError(null);
    setResult(null);
    setAdapter("auto");
    setCampMode("default");
    setPickedCampId("");
    setNewCampTitle("");
    void fetchCampaigns()
      .then((d) => setCampaigns(d.campaigns || []))
      .catch(() => setCampaigns([]));
  }, [open, defaultAccountId, accounts]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const active = accounts.filter((a) => a.status === "active");
  const scopeAccount = accountId === "" ? null : Number(accountId);

  const defaultCamp = useMemo(() => {
    if (scopeAccount == null) return null;
    return (
      campaigns.find(
        (c) =>
          c.is_default &&
          c.account_id === scopeAccount &&
          c.status === "active",
      ) || null
    );
  }, [campaigns, scopeAccount]);

  const pickableCamps = useMemo(() => {
    if (scopeAccount == null) return campaigns.filter((c) => c.status === "active");
    return campaigns.filter(
      (c) =>
        c.status === "active" &&
        (c.account_id == null || c.account_id === scopeAccount),
    );
  }, [campaigns, scopeAccount]);

  if (!open) return null;

  async function onFile(file: File | null) {
    if (!file) return;
    setFileName(file.name);
    const t = await file.text();
    setText(t);
    setPreview(null);
    setResult(null);
    // Send head + tail so large .tradlog.json still shows the format marker
    // (full body is used on Preview/Import).
    const detectText =
      t.length <= 50000
        ? t
        : `${t.slice(0, 25000)}\n/*…*/\n${t.slice(-5000)}`;
    const r = await fetch("/api/me/trade-log/import/detect", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: detectText,
        filename: file.name,
      }),
    });
    if (r.ok) {
      const d = await r.json();
      setDetections(d.detections || []);
      // Prefer filename hint for canonical exports
      const name = file.name.toLowerCase();
      if (name.endsWith(".tradlog.json") || name.includes("fattail")) {
        setAdapter("native");
      } else if (d.detections?.[0]?.id) {
        setAdapter(d.detections[0].id);
      }
    }
  }

  async function runPreview() {
    setBusy(true);
    setError(null);
    setResult(null);
    const r = await fetch("/api/me/trade-log/import/preview", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, adapter }),
    });
    setBusy(false);
    if (!r.ok) {
      setError(await r.text());
      return;
    }
    setPreview(await r.json());
  }

  async function runCommit() {
    if (accountId === "") {
      setError("Choose a target account (broker or sim).");
      return;
    }
    if (campMode === "pick" && pickedCampId === "") {
      setError("Choose a campaign, or switch to Account default.");
      return;
    }
    if (campMode === "new" && !newCampTitle.trim()) {
      setError("Name the new campaign, or switch to Account default.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let practice_campaign_id: number | null = null;
      let use_default_campaign = false;

      if (campMode === "default") {
        use_default_campaign = true;
      } else if (campMode === "pick") {
        use_default_campaign = false;
        practice_campaign_id = Number(pickedCampId);
      } else if (campMode === "new") {
        const created = await createCampaign({
          title: newCampTitle.trim(),
          activate: true,
          account_id: Number(accountId),
        });
        use_default_campaign = false;
        practice_campaign_id = created.id;
        setCampaigns((prev) => [created, ...prev]);
      }

      const body: Record<string, unknown> = {
        text,
        adapter: adapter === "auto" ? "auto" : adapter,
        account_id: Number(accountId),
        use_default_campaign,
      };
      if (practice_campaign_id != null) {
        body.practice_campaign_id = practice_campaign_id;
      }

      const r = await fetch("/api/me/trade-log/import/commit", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        setError(await r.text());
        return;
      }
      const d = await r.json();
      const campNote =
        d.practice_campaign_id != null
          ? ` · campaign #${d.practice_campaign_id}`
          : " · no campaign stamp";
      setResult(
        `Imported ${d.created} trade(s)` +
          (d.skipped ? `, skipped ${d.skipped} duplicate(s)` : "") +
          ` via ${d.adapter}${campNote}.`,
      );
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const defaultLabel = defaultCamp
    ? defaultCamp.title
    : scopeAccount != null
      ? `${active.find((a) => a.id === scopeAccount)?.label || "Account"} default (created on import)`
      : "Account default (created on import)";

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Import trade log"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--color-separator)] bg-[var(--color-surface)] shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-separator)] px-4 py-3">
          <h2 className="text-base font-semibold text-[var(--color-label)]">
            Import trade log
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-sm text-[var(--color-label-secondary)]"
          >
            ✕
          </button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
          <p className="text-[var(--color-label-secondary)]">
            Import{" "}
            <strong className="text-[var(--color-label)]">
              FatTail canonical JSON
            </strong>{" "}
            or a{" "}
            <strong className="text-[var(--color-label)]">
              thinkorswim Account Statement
            </strong>{" "}
            CSV (we use the <em>Account Trade History</em> block). Fills stamp
            into the account&apos;s <strong>default campaign</strong> — or choose
            another campaign / create one. Preview before commit; duplicates
            skipped.
          </p>

          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Target account
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value ? Number(e.target.value) : "");
                setCampMode("default");
                setPickedCampId("");
              }}
            >
              {active.length === 0 && (
                <option value="">Provisioning default…</option>
              )}
              {active.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                  {a.label === "Default" || a.label === "Primary"
                    ? " (default)"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="space-y-2 rounded-lg border border-[var(--color-separator)] p-3">
            <legend className="px-1 text-xs font-medium text-[var(--color-label-secondary)]">
              Campaign for imported trades
            </legend>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-label)]">
              <input
                type="radio"
                name="import-camp"
                className="mt-1"
                checked={campMode === "default"}
                onChange={() => setCampMode("default")}
                data-testid="import-camp-default"
              />
              <span>
                <span className="font-medium">Account default</span>
                <span className="mt-0.5 block text-xs text-[var(--color-label-tertiary)]">
                  {defaultLabel} — no-fuss path for brokerage history
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-label)]">
              <input
                type="radio"
                name="import-camp"
                className="mt-1"
                checked={campMode === "pick"}
                onChange={() => setCampMode("pick")}
                data-testid="import-camp-pick"
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium">Existing campaign</span>
                {campMode === "pick" && (
                  <select
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-xs"
                    value={pickedCampId === "" ? "" : String(pickedCampId)}
                    onChange={(e) =>
                      setPickedCampId(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    data-testid="import-camp-pick-select"
                  >
                    <option value="">Choose…</option>
                    {pickableCamps.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                        {c.is_default ? " · default" : ""}
                        {c.account_id == null ? " · any account" : ""}
                      </option>
                    ))}
                  </select>
                )}
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[var(--color-label)]">
              <input
                type="radio"
                name="import-camp"
                className="mt-1"
                checked={campMode === "new"}
                onChange={() => setCampMode("new")}
                data-testid="import-camp-new"
              />
              <span className="min-w-0 flex-1">
                <span className="font-medium">New campaign</span>
                <span className="mt-0.5 block text-xs text-[var(--color-label-tertiary)]">
                  Create and direct this import into it
                </span>
                {campMode === "new" && (
                  <input
                    type="text"
                    value={newCampTitle}
                    onChange={(e) => setNewCampTitle(e.target.value)}
                    placeholder="Campaign name"
                    className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-xs"
                    data-testid="import-camp-new-title"
                  />
                )}
              </span>
            </label>
          </fieldset>

          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Format
            <select
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 text-sm"
              value={adapter}
              onChange={(e) => setAdapter(e.target.value)}
            >
              <option value="auto">Auto-detect</option>
              <option value="thinkorswim">thinkorswim / ToS CSV</option>
              <option value="native">FatTail canonical JSON</option>
              <option value="csv_generic">Generic legs CSV</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            File
            <input
              type="file"
              accept=".csv,.json,.tradlog.json,text/csv,application/json"
              className="mt-1 block w-full text-xs"
              onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            />
            {fileName && (
              <span className="mt-1 block text-[var(--color-label-tertiary)]">
                {fileName}
              </span>
            )}
          </label>

          <label className="block text-xs font-medium text-[var(--color-label-secondary)]">
            Or paste
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 font-mono text-xs"
              rows={8}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
              placeholder="Paste CSV or .tradlog.json…"
            />
          </label>

          {detections.length > 0 && (
            <p className="text-xs text-[var(--color-label-tertiary)]">
              Detected:{" "}
              {detections
                .map((d) => `${d.id} (${Math.round(d.confidence * 100)}%)`)
                .join(", ")}
            </p>
          )}

          {preview && (
            <div className="rounded-lg border border-[var(--color-separator)] p-3">
              <p className="font-medium text-[var(--color-label)]">
                Preview · {preview.trade_count} trade
                {preview.trade_count === 1 ? "" : "s"}
                {preview.adapter ? ` · ${preview.adapter}` : ""}
              </p>
              {preview.errors?.length > 0 && (
                <p className="mt-1 text-xs text-red-600">
                  {preview.errors.join("; ")}
                </p>
              )}
              {preview.warnings?.length > 0 && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {preview.warnings.slice(0, 3).join("; ")}
                </p>
              )}
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-[var(--color-label-secondary)]">
                {preview.trades.map((t, i) => (
                  <li key={i}>
                    {(t.exec_at || "").slice(0, 16)} · {t.strategy} ·{" "}
                    {t.legs?.length || 0} leg
                    {(t.legs?.length || 0) === 1 ? "" : "s"}
                    {t.net_price != null
                      ? ` · ${t.net_price} ${t.net_side || ""}`
                      : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 whitespace-pre-wrap">{error}</p>
          )}
          {result && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {result}
            </p>
          )}
        </div>
        <footer className="flex flex-wrap gap-2 border-t border-[var(--color-separator)] px-4 py-3">
          <button
            type="button"
            disabled={busy || !text.trim()}
            onClick={() => void runPreview()}
            className="rounded-full border border-[var(--color-separator)] px-4 py-2 text-sm disabled:opacity-50"
          >
            Preview
          </button>
          <button
            type="button"
            disabled={busy || !text.trim() || accountId === ""}
            onClick={() => void runCommit()}
            className="rounded-full bg-[var(--color-tint)] px-4 py-2 text-sm font-medium text-[var(--color-on-tint)] disabled:opacity-50"
          >
            {busy ? "Working…" : "Import"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-full px-4 py-2 text-sm text-[var(--color-label-secondary)]"
          >
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}
