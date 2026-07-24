import type { Metadata } from "next";
import CastPanel from "@/components/admin/CastPanel";

export const metadata: Metadata = {
  title: "Studio cast — Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function AdminCastPage() {
  return <CastPanel />;
}
