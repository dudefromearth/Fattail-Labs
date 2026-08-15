"use client";

/**
 * Standard ToS script window — same chrome as Options Lab heatmap/builder.
 * Click activates the script (Trade Log: open the trade form).
 */

export default function TosScriptWindow({
  script,
  onActivate,
  hint = "Tap to open in the trade form",
  testId = "tos-script-window",
}: {
  script: string;
  onActivate?: () => void;
  hint?: string;
  testId?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5" data-testid={testId}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-label-secondary)]">
          ToS script
        </span>
        {hint ? (
          <span className="text-[10px] text-[var(--color-label-tertiary)]">
            {hint}
          </span>
        ) : null}
      </div>
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          className="block max-h-40 min-h-[4.5rem] w-full overflow-auto whitespace-pre-wrap break-all rounded-lg border border-emerald-500/25 bg-[#0a0f0a] px-2.5 py-2 text-left font-mono text-[16.5px] leading-snug text-emerald-400 shadow-inner"
          data-testid="tos-script-field"
          title="Open this order in the trade form"
        >
          {script}
        </button>
      ) : (
        <pre
          className="max-h-40 min-h-[4.5rem] overflow-auto whitespace-pre-wrap break-all rounded-lg border border-emerald-500/25 bg-[#0a0f0a] px-2.5 py-2 font-mono text-[16.5px] leading-snug text-emerald-400 shadow-inner"
          data-testid="tos-script-field"
        >
          {script}
        </pre>
      )}
    </div>
  );
}
