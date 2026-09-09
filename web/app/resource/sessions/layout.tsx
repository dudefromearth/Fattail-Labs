import type { Metadata } from "next";
import type { ReactNode } from "react";

/** L6 — title slot `Sessions`; root template yields `Sessions — FatTail Labs`. Zero fetch. */
export const metadata: Metadata = {
  title: "Sessions",
};

export default function SessionsLayout({ children }: { children: ReactNode }) {
  return children;
}
