/** SF Symbols–style SVG icons — Human Interface Spec v1.0. No emoji chrome. */

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, className, ...rest }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

export function IconTrash(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconGrip(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="9" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="17" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPlus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconXMark(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconCheck(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

export function IconChevronLeft(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconChevronRight(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

/** macOS pop-up button disclosure — chevron up + down. */
export function IconChevronUpDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 9l5-4 5 4" />
      <path d="M7 15l5 4 5-4" />
    </svg>
  );
}

/**
 * Lock glyph tone for surfaces where `currentColor` is wrong.
 * - `inherit` — uses currentColor (preferred in themed chrome)
 * - `light` — white / near-white (dark bars, green blotter, inverse tiles)
 * - `dark` — near-black (light cards, white surfaces)
 *
 * Geometry matches Thinkorswim package lock: closed bolt over the body;
 * unlocked bolt swung fully to the side. No keyhole. No emoji.
 */
export type IconLockTone = "inherit" | "light" | "dark";

export type IconLockProps = IconProps & { tone?: IconLockTone };

function lockPaint(tone: IconLockTone | undefined): string {
  if (tone === "light") return "#FFFFFF";
  if (tone === "dark") return "#1D1D1F";
  return "currentColor";
}

/**
 * Locked padlock — solid body, shackle (bolt) closed over the body.
 * Filled silhouette; no keyhole. Use `tone` for light/dark surfaces.
 */
export function IconLock(p: IconLockProps) {
  const { tone = "inherit", size = 20, className, ...rest } = p;
  const paint = lockPaint(tone);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={paint}
      className={className}
      aria-hidden
      data-lock-tone={tone}
      data-lock-state="locked"
      data-lock-shackle="over"
      {...rest}
    >
      <rect x="5" y="11" width="14" height="10.25" rx="2.25" />
      {/* Closed shackle — both posts into the body, bolt over the body */}
      <path
        d="M8.25 11.2V8.15a3.9 3.9 0 0 1 7.8 0v3.05"
        fill="none"
        stroke={paint}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Unlocked padlock — ToS: shackle swung fully beside the body.
 * Wider than locked on purpose so the bolt is not cramped over the box.
 */
export function IconUnlock(p: IconLockProps) {
  const { tone = "inherit", size = 20, className, ...rest } = p;
  const paint = lockPaint(tone);
  const height = size;
  const width = Math.round((Number(size) * 32) / 24);
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 24"
      fill={paint}
      overflow="visible"
      className={className}
      aria-hidden
      data-lock-tone={tone}
      data-lock-state="unlocked"
      data-lock-shackle="side"
      {...rest}
    >
      {/* Same body as lock, shifted right so the U has a full bay on the left */}
      <rect x="16" y="11" width="14" height="10.25" rx="2.25" />
      {/*
        Full U to the left of the body: right post in the left shoulder,
        arch left, free post hanging beside the box.
      */}
      <path
        d="M17.2 11.2V5.1A4.4 4.4 0 0 0 8.4 5.1V16.8"
        fill="none"
        stroke={paint}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Convenience: pick locked / unlocked glyph from a boolean. */
export function IconLockState({
  locked,
  ...rest
}: IconLockProps & { locked: boolean }) {
  return locked ? <IconLock {...rest} /> : <IconUnlock {...rest} />;
}

export function IconPlay(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M8 5v14l11-7L8 5z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPause(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconStop(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 6h12v12H6z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGear(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconExclamation(p: IconProps) {
  return (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </svg>
  );
}

export function IconChevronDown(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconChevronUp(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

/** Expand / full-size (corners outward). */
export function IconExpand(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M15 3h6v6" />
      <path d="M9 21H3v-6" />
      <path d="M21 3l-7 7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

/** Collapse / exit expand (corners inward). */
export function IconCollapse(p: IconProps) {
  return (
    <svg {...base(p)}>
      <path d="M4 14h6v6" />
      <path d="M20 10h-6V4" />
      <path d="M14 10l7-7" />
      <path d="M3 21l7-7" />
    </svg>
  );
}

/**
 * Robot / bot — square head + antenna + eyes (not platform emoji).
 * Used on Strategy Lab bin cards so “bot” reads clearly on every OS.
 */
export function IconBot(p: IconProps) {
  return (
    <svg {...base(p)}>
      {/* antenna */}
      <path d="M12 3v3" />
      <circle cx="12" cy="2.5" r="1" fill="currentColor" stroke="none" />
      {/* head */}
      <rect x="5" y="6" width="14" height="11" rx="2.5" />
      {/* eyes */}
      <circle cx="9.25" cy="11" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.75" cy="11" r="1.15" fill="currentColor" stroke="none" />
      {/* mouth slot */}
      <path d="M9 14.5h6" />
      {/* base / legs */}
      <path d="M8 17v3M16 17v3" />
      {/* arms */}
      <path d="M5 10H3.5v5H5M19 10h1.5v5H19" />
    </svg>
  );
}
