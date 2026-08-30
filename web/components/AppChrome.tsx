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
import PresenceTracker from "@/components/PresenceTracker";
import IdleSessionGuard from "@/components/IdleSessionGuard";
import IkiProductShell from "@/components/iki/IkiProductShell";
import HelpLauncher from "@/components/HelpLauncher";
import WikiAgentPanel from "@/components/wiki/WikiAgentPanel";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminApp = pathname === "/admin" || pathname.startsWith("/admin/");
  // Countdown landing owns the full viewport — keep global nav off it.
  const isLaunchHome = pathname === "/";
  // Native apply is a fattail sales surface (lock.md) — no Labs nav / 0-DTE.
  const isApply = pathname === "/apply";
  const hideMemberChrome = isAdminApp || isLaunchHome || isApply;

  return (
    <ConfirmProvider>
      <AppearanceRoot />
      <MemberSettingsRoot />
      <IdleSessionGuard />
      <IkiProductShell />
      {!isAdminApp && !isApply && <PageViewTracker />}
      <PresenceTracker /> {/* presence tracks anyone signed in, admin area included */}
      {/* Plane-wide Wiki agent (admin) left of Help (members). DL-573.
          Separate boundaries: a Help throw must not swallow the Wiki orb. */}
      <div
        className="fixed bottom-5 right-5 z-[80] flex items-end gap-3"
        data-testid="labs-corner-dock"
      >
        <ErrorBoundary>
          <WikiAgentPanel />
        </ErrorBoundary>
        {!isAdminApp && !isApply && (
          <ErrorBoundary>
            <HelpLauncher />
          </ErrorBoundary>
        )}
      </div>
      {hideMemberChrome ? (
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
