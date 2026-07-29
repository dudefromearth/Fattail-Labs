import type { Metadata } from "next";
import MemberHome from "@/components/member-home/MemberHome";

export const metadata: Metadata = {
  title: "Home",
  robots: { index: false, follow: false },
};

export default function MemberHomePage() {
  return (
    <main>
      <MemberHome />
    </main>
  );
}
