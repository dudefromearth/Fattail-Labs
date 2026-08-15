"use client";

import { campaignBadgeStyle } from "@/lib/campaignBadge";

export default function CampaignBadge({
  title,
  color,
  titleAttr,
  onClick,
  testId,
  className = "",
}: {
  title: string;
  color?: string | null;
  titleAttr?: string;
  onClick?: () => void;
  testId?: string;
  className?: string;
}) {
  const style = campaignBadgeStyle(color);
  const cls =
    "inline-block truncate rounded-full px-1.5 py-0.5 text-[10px] font-medium " +
    (style
      ? ""
      : "border border-white/25 bg-white/10 text-white/95 ") +
    className;
  if (onClick) {
    return (
      <button
        type="button"
        data-testid={testId}
        className={`${cls} hover:brightness-110`}
        style={style}
        title={titleAttr || title}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {title}
      </button>
    );
  }
  return (
    <span
      data-testid={testId}
      className={cls}
      style={style}
      title={titleAttr || title}
    >
      {title}
    </span>
  );
}
