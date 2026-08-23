// Wiki layout — mounts the ⌘K quick switcher over every wiki route (WI8).

import type { ReactNode } from "react";
import WikiSwitcher from "@/components/wiki/WikiSwitcher";

export default function WikiLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <WikiSwitcher />
    </>
  );
}
