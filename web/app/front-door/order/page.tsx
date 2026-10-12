import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door/order" },
  description: "One-screen order form. Email and name. Payment continues on WooCommerce checkout.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const bag = await loadFrontDoor();
  const params = await searchParams;
  return (
    <FrontDoor
      entry="order"
      offers={bag.offers}
      admitted={bag.admitted}
      needsVisitor={bag.needsVisitor}
      initialProduct={params.product}
    />
  );
}
