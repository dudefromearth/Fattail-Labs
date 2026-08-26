"use client";

/**
 * AutoFilter panel — fixed to the viewport so table overflow cannot clip it.
 */

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export default function FilterMenuPortal({
  open,
  anchorRef,
  menuRef,
  width,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  menuRef: RefObject<HTMLDivElement | null>;
  width: number;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const inner = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const anchor = anchorRef.current;
      const menu = inner.current;
      if (!anchor) return;
      const r = anchor.getBoundingClientRect();
      const mw = menu?.offsetWidth || width;
      const mh = menu?.offsetHeight || 280;
      const pad = 8;
      let left = r.left;
      if (left + mw > window.innerWidth - pad) left = r.right - mw;
      if (left < pad) left = pad;
      let top = r.bottom + 4;
      if (top + mh > window.innerHeight - pad) {
        top = Math.max(pad, r.top - mh - 4);
      }
      setPos({ top, left });
    }
    place();
    const id = requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, width]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div
      ref={(el) => {
        inner.current = el;
        if (typeof menuRef === "object" && menuRef) {
          (menuRef as { current: HTMLDivElement | null }).current = el;
        }
      }}
      className="fixed z-[80]"
      style={{ top: pos.top, left: pos.left, width }}
    >
      {children}
    </div>,
    document.body,
  );
}
