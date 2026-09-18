import type { Metadata } from "next";
import SaDevCanvas from "@/components/admin/SaDevCanvas";

export const metadata: Metadata = {
  title: "SA dev canvas",
  robots: { index: false, follow: false },
};

export default function AdminSaDevPage() {
  return <SaDevCanvas />;
}
