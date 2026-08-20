"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "plain"
  | "destructive"
  | "tint"
  | "bordered";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-tint)] text-[var(--color-on-tint)] hover:bg-[var(--color-tint-emphasis)]",
  secondary:
    "bg-[var(--color-fill)] text-[var(--color-label)] hover:opacity-90",
  plain:
    "bg-transparent text-[var(--color-tint)] hover:bg-[var(--color-tint-soft)]",
  destructive:
    "bg-[var(--color-destructive)] text-white hover:opacity-90",
  tint: "bg-[var(--color-tint-soft)] text-[var(--color-tint)] hover:opacity-90",
  /** Inverse / dark chrome — Apple bordered: transparent fill, label stroke. */
  bordered:
    "border border-[var(--color-on-inverse)] bg-transparent text-[var(--color-on-inverse)] " +
    "hover:bg-[color-mix(in_srgb,var(--color-on-inverse)_12%,transparent)] " +
    "active:bg-[color-mix(in_srgb,var(--color-on-inverse)_20%,transparent)]",
};

const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }
>(function Button(
  {
    variant = "primary",
    className = "",
    type = "button",
    disabled,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-full)] px-4 text-sm font-medium transition-colors",
        "min-h-[var(--hit-min)] disabled:opacity-45 disabled:pointer-events-none",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
        VARIANT[variant],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
});

export default Button;
