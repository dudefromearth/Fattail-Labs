import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import PriceCards from "@/components/front-door/PriceCards";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Choose a membership",
  robots: { index: false, follow: false },
  description: "Website price cards. Checkout is the next page.",
};

export default async function ChoosePage() {
  const bag = await loadFrontDoor();
  if (!bag.admitted) {
    return (
      <FrontDoor
        entry="order"
        offers={bag.offers}
        admitted={false}
        needsVisitor={false}
      />
    );
  }
  return <PriceCards products={bag.offers.products} />;
}
