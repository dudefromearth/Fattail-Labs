// IKI Lab › Wiki layout — suite nav + ⌘K switcher over every wiki route (WI8).

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
