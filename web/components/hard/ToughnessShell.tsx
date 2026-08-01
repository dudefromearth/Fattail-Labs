"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ToughnessSuiteNav, {
  type ToughnessSuiteId,
} from "@/components/hard/ToughnessSuiteNav";

export default function ToughnessShell({
  children,
  crumb,
  active = "hub",
}: {
  children: ReactNode;
  crumb?: string;
  /** Suite pill active state — hub has none selected. */
  active?: ToughnessSuiteId;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <nav className="text-sm text-[var(--color-label-secondary)]">
        <Link href="/app" className="hover:underline">
          Apps
        </Link>
        <span className="mx-2">›</span>
        {crumb ? (
          <>
            <Link href="/app/toughness" className="hover:underline">
              Toughness
            </Link>
            <span className="mx-2">›</span>
            <span className="text-[var(--color-label)]">{crumb}</span>
          </>
        ) : (
          <span className="text-[var(--color-label)]">Toughness</span>
        )}
      </nav>

      <div className="mt-4 flex justify-center">
        <ToughnessSuiteNav active={active} />
      </div>

      {children}
    </main>
  );
}
