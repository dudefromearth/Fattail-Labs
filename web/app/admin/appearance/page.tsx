import type { Metadata } from "next";
import AppearanceAdmin from "@/components/appearance/AppearanceAdmin";

export const metadata: Metadata = {
  title: "Appearance",
  robots: { index: false, follow: false },
};

export default function AdminAppearancePage() {
  return <AppearanceAdmin />;
}
