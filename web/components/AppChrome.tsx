"use client";

// Root chrome: member SiteHeader on learner routes; suppressed under /admin/*
// ConfirmProvider wraps all routes (HIG AlertDialog replaces window.confirm).
// AppearanceRoot is a sibling (not a content wrapper) so useSearchParams
// Suspense cannot detach course tabs / other client handlers.

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { ConfirmProvider } from "@/components/ui";
import AppearanceRoot from "@/components/appearance/AppearanceRoot";
import MemberSettingsRoot from "@/components/settings/MemberSettingsRoot";
import PageViewTracker from "@/components/PageViewTracker";
import IdleSessionGuard from "@/components/IdleSessionGuard";
import HelpLauncher from "@/components/HelpLauncher";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminApp = pathname === "/admin" || pathname.startsWith("/admin/");
  // Countdown landing owns the full viewport — keep global nav off it.
  const isLaunchHome = pathname === "/";

  return (
    <ConfirmProvider>
      <AppearanceRoot />
      <MemberSettingsRoot />
      <IdleSessionGuard />
      {!isAdminApp && <PageViewTracker />}
      {!isAdminApp && (
        <ErrorBoundary>
          <HelpLauncher />
        </ErrorBoundary>
      )}
      {isAdminApp || isLaunchHome ? (
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
