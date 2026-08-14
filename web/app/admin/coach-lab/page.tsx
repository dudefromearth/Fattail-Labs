import type { Metadata } from "next";
import CoachLabPage from "@/components/admin/CoachLabPage";

export const metadata: Metadata = {
  title: "Coach Lab — FatTail Labs",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminCoachLabRoute() {
  return <CoachLabPage />;
}
