import type { Metadata } from "next";
import ToughnessHub from "@/components/hard/ToughnessHub";

export const metadata: Metadata = {
  title: "Toughness · FatTail Labs",
  description:
    "FatTail Hard and True 75 Hard — voluntary capacity training for persistence under load. Process only.",
};

export default function ToughnessPage() {
  return <ToughnessHub />;
}
