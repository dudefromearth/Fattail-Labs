import type { ReactNode } from "react";
import PracticeScopeRoot from "@/components/practice/PracticeScopeRoot";

/**
 * Practice suite lives under /app/* — lift PracticeContext here so chrome
 * account / campaign / date survive Trade Log ↔ Reports ↔ Journal nav
 * without re-fetch flash (Hardening B2).
 */
export default function AppSectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PracticeScopeRoot>{children}</PracticeScopeRoot>;
}
