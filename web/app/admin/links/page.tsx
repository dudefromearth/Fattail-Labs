import type { Metadata } from "next";
import LinksPanel from "@/components/admin/LinksPanel";

export const metadata: Metadata = {
  title: "Links / QR — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminLinksPage() {
  return <LinksPanel />;
}
