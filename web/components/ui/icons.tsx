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

/**
 * Lock glyph tone for surfaces where `currentColor` is wrong.
 * - `inherit` — uses currentColor (preferred in themed chrome)
 * - `light` — white / near-white (dark bars, green blotter, inverse tiles)
 * - `dark` — near-black (light cards, white surfaces)
 *
 * Geometry matches the Thinkorswim package/interest unlock silhouette
 * (solid body, open left shackle) — superior to platform emoji.
 */
export type IconLockTone = "inherit" | "light" | "dark";

export type IconLockProps = IconProps & { tone?: IconLockTone };

function lockPaint(tone: IconLockTone | undefined): string {
  if (tone === "light") return "#FFFFFF";
  if (tone === "dark") return "#1D1D1F";
  return "currentColor";
}

/**
 * Locked padlock — solid body, closed shackle (ToS counterpart of unlock).
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
      {...rest}
    >
      {/* Body — solid rounded rect (ToS has no keyhole cutout) */}
      <rect x="5" y="11" width="14" height="10.25" rx="2.25" />
      {/* Closed shackle — both posts into body shoulders */}
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
 * Unlocked padlock — solid body, open-left shackle.
 * Geometry from Thinkorswim Interest / package unlock (sim.png).
 * Use `tone="light"` on dark chrome; `tone="dark"` on light cards.
 */
export function IconUnlock(p: IconLockProps) {
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
      data-lock-state="unlocked"
      {...rest}
    >
      <rect x="5" y="11" width="14" height="10.25" rx="2.25" />
      {/*
        Open shackle: free left post ends above the body; right post seats
        into the left-center of the body top (ToS offset, not centered arch).
      */}
      <path
        d="M6.35 9.55V7.85A3.85 3.85 0 0 1 14.1 8.05V11.2"
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
