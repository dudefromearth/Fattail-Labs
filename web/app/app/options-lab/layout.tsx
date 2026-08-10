"use client";

import type { ReactNode } from "react";
import { OptionsLabProvider } from "@/lib/optionsLabContext";

/**
 * Options Lab suite shell — shared symbol + provider for all sub-apps.
 */
export default function OptionsLabLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <OptionsLabProvider>{children}</OptionsLabProvider>;
}
