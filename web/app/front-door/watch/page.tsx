import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watch",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door/watch" },
  description: "A short video for the six-week Observer program, then the order form.",
};

export default async function WatchPage() {
  const bag = await loadFrontDoor();
  return (
    <FrontDoor
      entry="watch"
      offers={bag.offers}
      admitted={bag.admitted}
      needsVisitor={bag.needsVisitor}
    />
  );
}
