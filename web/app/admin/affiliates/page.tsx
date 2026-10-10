import type { Metadata } from "next";
import AffiliatesPanel from "@/components/admin/AffiliatesPanel";

export const metadata: Metadata = {
  title: "Affiliates — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminAffiliatesPage() {
  return <AffiliatesPanel />;
}
