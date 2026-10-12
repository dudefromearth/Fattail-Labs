import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmation",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door/confirm" },
};

export default async function ConfirmPage() {
  const bag = await loadFrontDoor();
  return (
    <FrontDoor
      entry="confirm"
      offers={bag.offers}
      admitted={true}
      needsVisitor={false}
    />
  );
}
