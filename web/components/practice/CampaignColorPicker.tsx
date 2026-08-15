"use client";

import { campaignBadgeStyle, normalizeCampaignHex } from "@/lib/campaignBadge";

export default function CampaignColorPicker({
  value,
  onChange,
  taken = [],
  disabled,
  label = "Badge color",
}: {
  value: string;
  onChange: (hex: string) => void;
  taken?: string[];
  disabled?: boolean;
  label?: string;
}) {
  const hex = normalizeCampaignHex(value) || "#1D4ED8";
  const takenSet = new Set(
    taken.map((c) => normalizeCampaignHex(c)).filter(Boolean) as string[],
  );
  const clash = takenSet.has(hex);
  const preview = campaignBadgeStyle(hex);

  return (
    <label
      className="block text-xs font-medium text-[var(--color-label-secondary)]"
      data-testid="campaign-color-picker"
    >
      {label}
      <span className="mt-1 flex flex-wrap items-center gap-2">
        <input
          type="color"
          value={hex}
          disabled={disabled}
          aria-label={label}
          className="h-9 w-12 cursor-pointer rounded border border-[var(--color-separator)] bg-[var(--color-canvas)] p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="campaign-color-input"
          onChange={(e) => {
            const next = normalizeCampaignHex(e.target.value);
            if (next) onChange(next);
          }}
        />
        <input
          type="text"
          spellCheck={false}
          value={hex}
          disabled={disabled}
          maxLength={7}
          className="w-[6.5rem] rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] px-2 py-1.5 font-mono text-sm uppercase text-[var(--color-label)] disabled:opacity-50"
          data-testid="campaign-color-hex"
          onChange={(e) => {
            const next = normalizeCampaignHex(e.target.value);
            if (next) onChange(next);
          }}
        />
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={preview}
          data-testid="campaign-color-preview"
        >
          Campaign
        </span>
      </span>
      {clash ? (
        <span
          className="mt-1 block text-[11px] font-normal text-[var(--color-destructive)]"
          data-testid="campaign-color-taken"
        >
          That color is already used by another campaign. Pick a unique one.
        </span>
      ) : (
        <span className="mt-1 block text-[11px] font-normal text-[var(--color-label-tertiary)]">
          Unique per campaign. Ink is white or near-black for maximum contrast.
        </span>
      )}
    </label>
  );
}
