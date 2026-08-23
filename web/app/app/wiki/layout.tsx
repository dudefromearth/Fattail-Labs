// Wiki layout — IKI suite nav (Wiki · Factory · Runner) + ⌘K (WI8).
// Compile inbox stays off. Do not restyle Factory or Runner from this file.

import type { ReactNode } from "react";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import WikiSwitcher from "@/components/wiki/WikiSwitcher";

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <IkiSuiteChrome active="wiki">
      {children}
      <WikiSwitcher />
    </IkiSuiteChrome>
  );
}
