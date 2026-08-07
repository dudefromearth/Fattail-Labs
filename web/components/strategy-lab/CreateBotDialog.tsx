"use client";

/**
 * Create Bot — blank newborn or FatTail house strategy (prefilled Identity + Structure).
 * Templates reserved for a later release.
 */

import { useCallback, useEffect, useState } from "react";
import {
  createStrategy,
  type StrategyLabStrategy,
} from "@/lib/strategyLabApi";
import {
  fetchDesignLibrary,
  type HouseDesign,
} from "@/lib/strategyLabDesignsApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (strategy: StrategyLabStrategy, notice: string) => void;
  pushNotice?: (
    level: "info" | "success" | "warning" | "error",
    msg: string,
  ) => void;
};

export default function CreateBotDialog({
  open,
  onClose,
  onCreated,
  pushNotice,
}: Props) {
  const [house, setHouse] = useState<HouseDesign[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");

  const load = useCallback(async () => {
    const lib = await fetchDesignLibrary("butterfly");
    if (!lib) {
      setLoadErr("Could not load FatTail house strategies.");
      return;
    }
    setHouse(lib.house || []);
    setLoadErr(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setBusy(null);
    setCustomName("");
    void load();
  }, [open, load]);

  if (!open) return null;

  async function mintBlank() {
    setBusy("blank");
    setErr(null);
    try {
      const res = await createStrategy({
        origin: "blank",
        name: customName.trim() || "New bot",
      });
      if (res.error || !res.strategy) {
        const m = res.error || "Could not create bot";
        setErr(m);
        pushNotice?.("error", m);
        return;
      }
      const notice =
        `Newborn bot “${res.strategy.name}” minted in Design — completely undefined. ` +
        `Start at Strategy Identity & Direction. Logged in lifecycle.`;
      onCreated(res.strategy, notice);
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Create failed";
      setErr(m);
      pushNotice?.("error", m);
    } finally {
      setBusy(null);
    }
  }

  async function mintHouse(d: HouseDesign) {
    setBusy(d.key);
    setErr(null);
    try {
      const res = await createStrategy({
        origin: "house",
        house_key: d.key,
        house_version: d.version,
        name: customName.trim() || d.name,
      });
      if (res.error || !res.strategy) {
        const m = res.error || "Could not create bot from house strategy";
        setErr(m);
        pushNotice?.("error", m);
        return;
      }
      const notice =
        `Bot “${res.strategy.name}” created from house “${d.name}” v${d.version}. ` +
        `Identity & Structure prefilled — ready for Risk & Capital (Model state). Logged.`;
      onCreated(res.strategy, notice);
      onClose();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Create from house failed";
      setErr(m);
      pushNotice?.("error", m);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-bot-title"
      data-testid="create-bot-dialog"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2
              id="create-bot-title"
              className="text-base font-semibold text-[var(--color-label)]"
            >
              Create bot
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-label-secondary)]">
              Bots live in the Design → Curate → Deploy bins. Choose a blank
              newborn or a FatTail house strategy with Identity & Structure
              already done.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
            onClick={() => !busy && onClose()}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <label className="mb-3 block text-xs font-medium text-[var(--color-label-secondary)]">
          Name (optional)
          <input
            className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2.5 py-1.5 text-sm text-[var(--color-label)]"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Defaults from choice below"
            disabled={!!busy}
          />
        </label>

        {(err || loadErr) && (
          <p className="mb-2 rounded-lg border border-red-300 bg-red-50 px-2 py-1.5 text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {err || loadErr}
          </p>
        )}

        {/* Blank newborn */}
        <section className="mb-4 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-3 dark:border-blue-800 dark:bg-blue-950/20">
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            Blank strategy
          </h3>
          <p className="mt-0.5 text-[0.7rem] text-[var(--color-label-secondary)]">
            A new baby — nothing designed yet. Appears in Design as{" "}
            <strong>Newborn</strong> at Hypothesis. You define every step from
            Identity onward.
          </p>
          <button
            type="button"
            disabled={!!busy}
            className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            onClick={() => void mintBlank()}
            data-testid="create-bot-blank"
          >
            {busy === "blank" ? "Creating…" : "Create blank newborn"}
          </button>
        </section>

        {/* House strategies */}
        <section className="mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-label)]">
            FatTail house strategy
          </h3>
          <p className="mt-0.5 mb-2 text-[0.7rem] text-[var(--color-label-secondary)]">
            Prefilled Identity & Structure. Lands in Design at{" "}
            <strong>Model</strong>, ready for step 3 —{" "}
            <strong>Risk & Capital</strong>.
          </p>
          {house.length === 0 && !loadErr ? (
            <p className="text-xs text-[var(--color-label-secondary)]">
              Loading house catalog…
            </p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {house.map((d) => (
                <li
                  key={d.key}
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] p-2.5"
                >
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-[var(--color-label)]">
                      {d.name}
                    </span>
                    <span className="text-[0.65rem] font-medium text-[var(--color-label-secondary)]">
                      v{d.version} · {d.dte_label} · {d.family_label}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-[var(--color-label-secondary)]">
                    {d.summary}
                  </p>
                  <button
                    type="button"
                    disabled={!!busy}
                    className="mt-1.5 rounded-md border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-100"
                    onClick={() => void mintHouse(d)}
                    data-testid={`create-bot-house-${d.key}`}
                  >
                    {busy === d.key ? "Creating…" : "Create from this house"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Future templates */}
        <section className="rounded-xl border border-dashed border-[var(--color-separator)] bg-[var(--color-fill)]/50 p-3 opacity-80">
          <h3 className="text-sm font-semibold text-[var(--color-label-secondary)]">
            Templates
          </h3>
          <p className="mt-0.5 text-[0.7rem] text-[var(--color-label-secondary)]">
            Member and community templates will appear here at creation time.
            Not available yet.
          </p>
          <button
            type="button"
            disabled
            className="mt-2 cursor-not-allowed rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-xs font-semibold text-[var(--color-label-secondary)] opacity-60"
          >
            Coming later
          </button>
        </section>
      </div>
    </div>
  );
}
