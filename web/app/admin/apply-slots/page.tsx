import type { Metadata } from "next";
import ApplySlotsAdminClient from "./ApplySlotsAdminClient";

export const metadata: Metadata = {
  title: "Apply form",
  robots: { index: false, follow: false },
};

export default function ApplySlotsAdminPage() {
  return <ApplySlotsAdminClient />;
}
