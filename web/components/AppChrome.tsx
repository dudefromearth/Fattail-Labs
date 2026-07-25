"use client";

// Root chrome: member SiteHeader on learner routes; suppressed under /admin/*
// ConfirmProvider wraps all routes (HIG AlertDialog replaces window.confirm).
// AppearanceRoot is a sibling (not a content wrapper) so useSearchParams
// Suspense cannot detach course tabs / other client handlers.

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { ConfirmProvider } from "@/components/ui";
import AppearanceRoot from "@/components/appearance/AppearanceRoot";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminApp = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <ConfirmProvider>
      <AppearanceRoot />
      {isAdminApp ? (
        children
      ) : (
        <>
          <SiteHeader />
          {children}
        </>
      )}
    </ConfirmProvider>
  );
}
