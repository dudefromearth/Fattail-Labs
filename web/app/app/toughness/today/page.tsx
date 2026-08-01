import type { Metadata } from "next";
import DailyLog from "@/components/hard/DailyLog";

export const metadata: Metadata = {
  title: "Hard · Today · FatTail Labs",
};

export default function ToughnessTodayPage() {
  return <DailyLog />;
}
