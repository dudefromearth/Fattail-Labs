import type { Metadata } from "next";
import PartnersPanel from "@/components/admin/PartnersPanel";

export const metadata: Metadata = {
  title: "Partners — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminPartnersPage() {
  return <PartnersPanel />;
}
