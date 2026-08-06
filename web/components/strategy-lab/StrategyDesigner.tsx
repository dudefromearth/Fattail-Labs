"use client";

/**
 * Schema-driven Butterfly designer (Implementation Plan PR-4/5).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  fetchPack,
  fieldVisible,
  fieldsForConfig,
  rankPackConfig,
  savePackConfig,
  validatePackConfig,
  type PackDetail,
  type RankedStructure,
  type StrategyConfig,
} from "@/lib/strategyPacks";
import CurateSymbolPicker from "@/components/strategy-lab/CurateSymbolPicker";

type Props = {
  strategyId: string;
  strategyName: string;
  initialConfig?: StrategyConfig | null;
  onSaved?: () => void;
};

export default function StrategyDesigner({
  strategyId,
  strategyName,
  initialConfig,
  onSaved,
}: Props) {
  const [pack, setPack] = useState<PackDetail | null>(null);
  const [config, setConfig] = useState<StrategyConfig>({});
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ranked, setRanked] = useState<RankedStructure[]>([]);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const d = await fetchPack("butterfly");
      if (!d) return;
      setPack(d);
      const base =
        initialConfig && Object.keys(initialConfig).length
          ? { ...initialConfig }
          : { ...(d.defaults[0] || {}) };
      if (!base.name) base.name = strategyName;
      setConfig(base);
    })();
  }, [initialConfig, strategyName]);

  const sections = pack?.ui.sections || [];
  const section = sections[step];

  const visibleFields = useMemo(() => {
    if (!pack) return [];
    return fieldsForConfig(pack, config).filter((f) => fieldVisible(f, config));
  }, [pack, config]);

  const fieldToSection: Record<string, string> = useMemo(
    () => ({
      name: "identity",
      direction: "identity",
      butterfly_family: "identity",
      underlying: "identity",
      dte_type: "structure",
      dte_min: "structure",
      dte_max: "structure",
      symmetric_regime: "structure",
      width_style: "structure",
      width_points_min: "structure",
      width_points_max: "structure",
      match_side_widths: "structure",
      call_width_points: "structure",
      put_width_points: "structure",
      bwb_style: "structure",
      broken_wing_side: "structure",
      max_capital_at_risk: "risk",
      max_capital_unit: "risk",
      primary_metric: "risk",
      debit_to_width_min: "edge",
      debit_to_width_max: "edge",
      target_debit_to_payoff_min: "edge",
      target_debit_to_payoff_max: "edge",
      min_convexity_quality: "edge",
      timing: "timing",
      directional_bias: "timing",
      frequency_per_week: "timing",
      vix_1d_mode: "timing",
      entry_conditions: "timing",
      exit_rules: "exits",
    }),
    [],
  );

  // Map fields to sections heuristically
  const sectionFields = useMemo(() => {
    if (!section) return visibleFields;
    const id = section.id;
    if (id === "review") return [];
    const matched = visibleFields.filter(
      (f) => (fieldToSection[f.name] || "identity") === id,
    );
    return matched.length ? matched : visibleFields;
  }, [section, visibleFields, fieldToSection]);

  /** Live choice list for the sticky summary panel (always-on while building). */
  const choiceRows = useMemo(() => {
    const rows: { name: string; label: string; value: string; sectionId: string }[] =
      [];
    for (const f of visibleFields) {
      if (f.name === "entry_conditions" || f.name === "exit_rules") {
        const v = config[f.name];
        if (v == null) continue;
        if (f.name === "exit_rules" && typeof v === "object" && v !== null) {
          const trail = (v as { dynamic_premium_decay_trailing?: { enabled?: boolean } })
            .dynamic_premium_decay_trailing;
          rows.push({
            name: f.name,
            label: f.label,
            value: trail?.enabled
              ? "Premium decay trailing on"
              : "Exit rules set",
            sectionId: fieldToSection[f.name] || "exits",
          });
        } else {
          rows.push({
            name: f.name,
            label: f.label,
            value: "configured",
            sectionId: fieldToSection[f.name] || "timing",
          });
        }
        continue;
      }
      const raw = config[f.name];
      if (raw === undefined || raw === null || raw === "") continue;
      let value: string;
      if (typeof raw === "boolean") {
        value = raw ? "Yes" : "No";
      } else if (f.name === "match_side_widths") {
        value = raw === false || raw === "false" ? "No — per-side widths" : "Yes — matched";
      } else if (f.name === "butterfly_family") {
        const map: Record<string, string> = {
          batman: "Batman (call + put fly)",
          single: "Single fly",
          broken_wing: "Broken wing",
          symmetric: "Batman (call + put fly)",
        };
        value = map[String(raw)] || String(raw);
      } else {
        value = String(raw);
      }
      rows.push({
        name: f.name,
        label: f.label,
        value,
        sectionId: fieldToSection[f.name] || "identity",
      });
    }
    return rows;
  }, [visibleFields, config, fieldToSection]);

  function goToFieldSection(sectionId: string) {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx >= 0) setStep(idx);
  }

  const setField = useCallback((name: string, value: unknown) => {
    setConfig((c) => ({ ...c, [name]: value }));
  }, []);

  async function onValidate() {
    setBusy(true);
    setMsg(null);
    const v = await validatePackConfig("butterfly", config);
    setErrors(v.errors);
    setWarnings(v.warnings);
    setBusy(false);
    if (v.valid) setMsg("Config valid.");
  }

  async function onRank() {
    setBusy(true);
    setMsg(null);
    setErrors([]);
    const v = await validatePackConfig("butterfly", config);
    setErrors(v.errors);
    setWarnings(v.warnings);
    if (!v.valid) {
      setBusy(false);
      return;
    }
    const res = await rankPackConfig("butterfly", config);
    setBusy(false);
    if (res.error) {
      setErrors([res.error]);
      return;
    }
    setRanked(res.ranked || []);
    setSummary(res.summary || null);
  }

  async function onSave() {
    setBusy(true);
    setMsg(null);
    const v = await validatePackConfig("butterfly", config);
    if (!v.valid) {
      setErrors(v.errors);
      setBusy(false);
      return;
    }
    const res = await savePackConfig(strategyId, "butterfly", config, true);
    setBusy(false);
    if (res.error) {
      setErrors([res.error]);
      return;
    }
    setMsg("Saved pack config (version bumped).");
    onSaved?.();
  }

  function applyTemplate(t: StrategyConfig) {
    setConfig({ ...t, name: t.name || strategyName });
    setRanked([]);
    setSummary(null);
    setMsg(`Loaded template: ${String(t.name || "")}`);
  }

  if (!pack) {
    return (
      <p className="text-sm text-[var(--color-label-secondary)]">
        Loading Butterfly pack…
      </p>
    );
  }

  const top = ranked[0];
  const substituted = !!summary?.primary_metric_substituted;
  const provenance = (summary?.data_provenance || top?.data_provenance) as
    | { source?: string; label?: string }
    | undefined;

  return (
    <div className="mt-4 space-y-4" data-testid="strategy-designer">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[var(--color-label)]">
          Butterfly designer
        </h3>
        <select
          className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1 text-xs"
          defaultValue=""
          onChange={(e) => {
            const t = pack.defaults.find((d) => d.name === e.target.value);
            if (t) applyTemplate(t);
          }}
        >
          <option value="">Load template…</option>
          {pack.defaults.map((d) => (
            <option key={String(d.name)} value={String(d.name)}>
              {String(d.name)}
            </option>
          ))}
        </select>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-1">
        {sections.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className={
              "rounded-full px-2.5 py-1 text-xs font-medium " +
              (i === step
                ? "bg-blue-600 text-white"
                : "bg-[var(--color-fill)] text-[var(--color-label-secondary)]")
            }
          >
            {i + 1}. {s.title}
          </button>
        ))}
      </div>

      {/* Form + sticky choices panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:items-start">
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-sm font-semibold">{section?.title}</p>
          {section?.id === "review" ? (
            <div className="space-y-2 text-sm text-[var(--color-label-secondary)]">
              <p>
                Review the <strong>Choices</strong> panel — then validate, rank, and
                save. Save stamps butterfly_config@1 and advances version.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {sectionFields.map((f) => (
                <label
                  key={f.name}
                  className={
                    "block text-xs " +
                    (f.type === "json" ? "sm:col-span-2 min-w-0" : "")
                  }
                >
                  <span className="font-medium text-[var(--color-label)]">
                    {f.label}
                    {f.required ? " *" : ""}
                  </span>
                  {f.description && (
                    <span className="mt-0.5 block text-[var(--color-label-secondary)]">
                      {f.description}
                    </span>
                  )}
                  {f.name === "exit_rules" && (
                    <pre
                      className="mt-2 max-w-full overflow-x-auto rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] p-3 font-mono text-[0.7rem] leading-relaxed text-[var(--color-label-secondary)]"
                      style={{ whiteSpace: "pre" }}
                    >{`// Exit rules — how the position leaves (not entry)
// Required: dynamic trailing on premium decay

on each mark / bar while position open:
  premium      = current mark of structure
  peak_premium = max(peak_premium, premium)   // or peak favorable P&L
  decay_rate   = how fast premium is collapsing
                 (mode "rate": Δpremium / Δtime)

  if dynamic_premium_decay_trailing.enabled:
    // Trail stop rides the decay of premium (FatTail process exit)
    if decay_rate breaches trail threshold
       or premium falls too far from peak under trail rules:
         EXIT market / rules-based close

  if take_profit.enabled and P&L hits target:
    EXIT take-profit

  if time_stop.enabled and clock / DTE hits stop:
    EXIT time-stop

  // discretionary_notes: human process notes only (not auto)`}</pre>
                  )}
                  {f.name === "underlying" ? (
                    <div className="mt-1 sm:col-span-2">
                      <CurateSymbolPicker
                        id={`design-underlying-${strategyId}`}
                        value={String(config.underlying ?? config.symbol ?? "SPY")}
                        onChange={(sym) => {
                          setField("underlying", sym);
                          // Keep scan-oriented alias for packs that read symbol
                          setField("symbol", sym);
                        }}
                        tradeableOnly={false}
                      />
                      <p className="mt-1 text-[10px] text-[var(--color-label-secondary)]">
                        Assigned for Design back test / forward walk. Re-select
                        when you run the bot in{" "}
                        <Link
                          href="/app/strategy-lab?phase=curation"
                          className="text-blue-600 hover:underline"
                        >
                          Curate
                        </Link>
                        . Catalog:{" "}
                        <Link
                          href="/app/strategy-lab/symbols"
                          className="text-blue-600 hover:underline"
                        >
                          Design → Symbols
                        </Link>
                        .
                      </p>
                    </div>
                  ) : f.type === "boolean" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                      value={
                        config[f.name] === false || config[f.name] === "false"
                          ? "false"
                          : "true"
                      }
                      onChange={(e) =>
                        setField(f.name, e.target.value === "true")
                      }
                    >
                      <option value="true">Yes (match both sides)</option>
                      <option value="false">No (set call & put widths)</option>
                    </select>
                  ) : f.type === "enum" ? (
                    <select
                      className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                      value={String(config[f.name] ?? f.default ?? "")}
                      onChange={(e) => setField(f.name, e.target.value)}
                    >
                      <option value="">—</option>
                      {(f.options || []).map((o) => (
                        <option key={String(o)} value={String(o)}>
                          {String(o)}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "number" ? (
                    <input
                      type="number"
                      className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                      value={
                        config[f.name] === undefined || config[f.name] === null
                          ? ""
                          : String(config[f.name])
                      }
                      min={f.min}
                      max={f.max}
                      step="any"
                      onChange={(e) =>
                        setField(
                          f.name,
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                        )
                      }
                    />
                  ) : f.type === "json" ? (
                    <div className="mt-1 min-w-0 max-w-full overflow-x-auto rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)]">
                      <textarea
                        className="block min-h-[12rem] w-full min-w-[36rem] resize-y border-0 bg-transparent px-3 py-2 font-mono text-xs leading-relaxed text-[var(--color-label)] outline-none"
                        style={{ whiteSpace: "pre", overflowWrap: "normal" }}
                        rows={f.name === "exit_rules" ? 14 : 10}
                        spellCheck={false}
                        wrap="off"
                        value={
                          typeof config[f.name] === "string"
                            ? String(config[f.name])
                            : JSON.stringify(config[f.name] ?? {}, null, 2)
                        }
                        onChange={(e) => {
                          try {
                            setField(f.name, JSON.parse(e.target.value));
                          } catch {
                            setField(f.name, e.target.value);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-sm"
                      value={String(config[f.name] ?? "")}
                      onChange={(e) => setField(f.name, e.target.value)}
                    />
                  )}
                </label>
              ))}
              {sectionFields.length === 0 && (
                <p className="text-xs text-[var(--color-label-secondary)]">
                  No fields for this step with current options.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={step === 0}
              className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm disabled:opacity-40"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </button>
            <button
              type="button"
              disabled={step >= sections.length - 1}
              className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm disabled:opacity-40"
              onClick={() =>
                setStep((s) => Math.min(sections.length - 1, s + 1))
              }
            >
              Next
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-[var(--color-separator)] px-3 py-1.5 text-sm font-semibold"
              onClick={() => void onValidate()}
            >
              Validate
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white"
              onClick={() => void onRank()}
            >
              Rank structures
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-semibold text-emerald-700"
              onClick={() => void onSave()}
            >
              Save to strategy
            </button>
          </div>
        </div>

        {/* Choices panel — always visible while building */}
        <aside
          className="rounded-xl border border-blue-200 bg-blue-50/80 p-3 shadow-sm dark:border-blue-900 dark:bg-blue-950/40 lg:sticky lg:top-4"
          data-testid="strategy-choices-panel"
          aria-label="Choices made so far"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-[var(--color-label)]">
              Choices so far
            </h4>
            <span className="text-[0.65rem] tabular-nums text-[var(--color-label-secondary)]">
              {choiceRows.length} set
            </span>
          </div>
          <p className="mb-2 text-[0.7rem] leading-snug text-[var(--color-label-secondary)]">
            Stays visible as you step. Click a row to jump back to that section.
          </p>
          {choiceRows.length === 0 ? (
            <p className="text-xs text-[var(--color-label-secondary)]">
              No choices yet — fill the form or load a template.
            </p>
          ) : (
            <ul className="max-h-[min(420px,55vh)] space-y-1 overflow-y-auto">
              {choiceRows.map((row) => (
                <li key={row.name}>
                  <button
                    type="button"
                    onClick={() => goToFieldSection(row.sectionId)}
                    className="flex w-full flex-col rounded-md border border-transparent bg-[var(--color-surface)] px-2 py-1.5 text-left transition hover:border-blue-400"
                  >
                    <span className="text-[0.65rem] font-medium uppercase tracking-wide text-[var(--color-label-secondary)]">
                      {row.label}
                    </span>
                    <span className="truncate text-xs font-semibold text-[var(--color-label)]">
                      {row.value}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {String(config.butterfly_family) === "batman" ||
          String(config.butterfly_family) === "symmetric" ? (
            <p className="mt-2 border-t border-blue-200/80 pt-2 text-[0.7rem] text-[var(--color-label-secondary)] dark:border-blue-800">
              Batman = call fly + put fly
              {config.match_side_widths === false
                ? ` · call w${String(config.call_width_points ?? "—")} / put w${String(config.put_width_points ?? "—")}`
                : " · matched widths"}
            </p>
          ) : null}
        </aside>
      </div>

      {/* Honesty banners */}
      {(substituted || provenance?.source === "stub" || top?.metrics.convexityProvisional) && (
        <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          {substituted && (
            <p>
              <strong>Ranking proxy:</strong> primary metric{" "}
              <code>{String(config.primary_metric)}</code> is not computable yet
              (no backtest distribution). Sorted by{" "}
              <code>{String(summary?.ranked_by || top?.ranked_by)}</code>.
            </p>
          )}
          {provenance?.source === "stub" && (
            <p>
              <strong>Data proxy:</strong>{" "}
              {provenance.label || "Stub chain — not live market data."}
            </p>
          )}
          {top?.metrics.convexityProvisional && (
            <p>
              <strong>Provisional convexity:</strong> scores use a Phase-1 heuristic
              until calibration.
            </p>
          )}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-red-600">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      {warnings.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-amber-700">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
      {msg && <p className="text-sm text-emerald-700">{msg}</p>}

      {/* Rank results + simple payoff bars */}
      {ranked.length > 0 && (
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] p-4">
          <h4 className="text-sm font-semibold">
            Ranked structures ({ranked.length}) · by{" "}
            <code className="text-xs">{String(summary?.ranked_by)}</code>
          </h4>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {ranked.slice(0, 12).map((row) => {
              const comps = row.structure.components as
                | {
                    call_fly?: { lo: number; body: number; hi: number; width_points: number };
                    put_fly?: { lo: number; body: number; hi: number; width_points: number };
                  }
                | undefined;
              const legs = (row.structure.legs || []) as Array<{
                strike: number;
                side: string;
                qty: number;
              }>;
              const label =
                row.structure.structure_kind === "batman" && comps
                  ? `Batman C ${comps.call_fly?.lo}/${comps.call_fly?.body}/${comps.call_fly?.hi} (w${comps.call_fly?.width_points}) · P ${comps.put_fly?.lo}/${comps.put_fly?.body}/${comps.put_fly?.hi} (w${comps.put_fly?.width_points})`
                  : legs.map((l) => l.strike).join("/");
              return (
                <div
                  key={row.rank}
                  className="rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2 py-1.5 text-xs"
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-semibold">
                      #{row.rank} · {label}
                    </span>
                    <span className="tabular-nums">
                      debit ${row.metrics.debitOrCredit.toFixed(0)} · max loss $
                      {row.metrics.maxLoss.toFixed(0)} · R/W{" "}
                      {row.metrics.debitToWidthRatio?.toFixed(3) ?? "—"} · convex{" "}
                      {row.metrics.convexityScore.toFixed(0)}
                    </span>
                  </div>
                  {/* Mini payoff sketch: max profit vs max loss bars */}
                  <div className="mt-1 flex h-2 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-700">
                    <div
                      className="bg-emerald-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (row.metrics.maxProfit /
                            Math.max(
                              row.metrics.maxProfit + row.metrics.maxLoss,
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                      title={`Max profit $${row.metrics.maxProfit.toFixed(0)}`}
                    />
                    <div
                      className="bg-red-400"
                      style={{
                        width: `${Math.min(
                          100,
                          (row.metrics.maxLoss /
                            Math.max(
                              row.metrics.maxProfit + row.metrics.maxLoss,
                              1,
                            )) *
                            100,
                        )}%`,
                      }}
                      title={`Max loss $${row.metrics.maxLoss.toFixed(0)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
