"use client";

// Root chrome: member SiteHeader on learner routes; suppressed under /admin/*
// so the dedicated admin shell owns operator navigation (Admin Dual Surface v1.0).

import { usePathname } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isAdminApp = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminApp) {
    return <>{children}</>;
  }

  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
