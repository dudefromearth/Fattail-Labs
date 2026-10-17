import type { Metadata } from "next";
import { headers } from "next/headers";
import FrontDoor from "@/components/front-door/FrontDoor";
import { entryForReferrer } from "@/lib/frontDoor/offers";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Front door",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door" },
};

export default async function FrontDoorRouterPage() {
  const bag = await loadFrontDoor();
  const headerList = await headers();
  const entry = entryForReferrer(headerList.get("referer"));
  return (
    <FrontDoor
      entry={entry}
      offers={bag.offers}
      admitted={bag.admitted}
      needsVisitor={bag.needsVisitor}
    />
  );
}
