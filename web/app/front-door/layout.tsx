import type { Metadata } from "next";
import "./front-door.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front door",
  robots: { index: false, follow: false },
  description: "Observer and Navigator. Six weeks, then a separate choice.",
};

export default function FrontDoorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
