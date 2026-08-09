"use client";

/**
 * Stable Practice scope for the /app/* tree — one hydrate per session nav,
 * not one per suite page remount (Hardening B2).
 */

import type { ReactNode } from "react";
import { PracticeContextProvider } from "@/lib/practiceContext";

export default function PracticeScopeRoot({
  children,
}: {
  children: ReactNode;
}) {
  return <PracticeContextProvider>{children}</PracticeContextProvider>;
}
