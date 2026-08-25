// Wiki corpus under IKI Lab. Suite tab is About, not Wiki.
// ⌘K (WI8). WikiAgentPanel lives in AppChrome.

import type { Metadata } from "next";
import type { ReactNode } from "react";
import IkiSuiteChrome from "@/components/iki/IkiSuiteChrome";
import WikiSwitcher from "@/components/wiki/WikiSwitcher";

export const metadata: Metadata = {
  title: "Wiki",
  description:
    "The compiled map of FatTail Labs teaching — search first, then follow the links.",
};

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <IkiSuiteChrome active="about">
      {children}
      <WikiSwitcher />
    </IkiSuiteChrome>
  );
}
