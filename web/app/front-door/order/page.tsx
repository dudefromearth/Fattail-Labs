import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door/order" },
  description: "Choose Observer or a Navigator plan, sign in or create an account, then choose a payment method.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; origin?: string }>;
}) {
  const bag = await loadFrontDoor();
  const params = await searchParams;
  return (
    <FrontDoor
      key={`${params.origin || "website"}:${params.product || ""}`}
      entry="order"
      offers={bag.offers}
      admitted={bag.admitted}
      needsVisitor={bag.needsVisitor}
      initialProduct={params.product}
      initialOrigin={params.origin}
    />
  );
}
