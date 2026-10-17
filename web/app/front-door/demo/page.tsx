import type { Metadata } from "next";
import DemoLauncher from "@/components/front-door/DemoLauncher";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front door demo",
  robots: { index: false, follow: false },
  description: "Preview launcher for the front door. Not the checkout.",
};

export default function DemoPage() {
  return <DemoLauncher />;
}
