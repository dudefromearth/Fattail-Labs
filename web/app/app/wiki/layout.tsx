// Wiki layout — IKI suite nav (Wiki · Factory · Runner) + ⌘K (WI8).
// Compile inbox stays off. Do not restyle Factory or Runner from this file.
// WikiAgentPanel: in-place-admin only (WA-4 · WU-1 ruling B). Keep/evolve;
// do not add a second orb. Not AppChrome.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import WikiAgentPanel from "@/components/wiki/WikiAgentPanel";
import WikiSwitcher from "@/components/wiki/WikiSwitcher";

export const metadata: Metadata = {
  title: "Wiki",
  description:
    "The compiled map of FatTail Labs teaching — search first, then follow the links.",
};

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <IkiSuiteChrome active="wiki">
      {children}
      <WikiSwitcher />
      <WikiAgentPanel />
    </IkiSuiteChrome>
  );
}
