import type { Metadata } from "next";
import FrontDoor from "@/components/front-door/FrontDoor";
import { HOOK, WEEKS } from "@/lib/frontDoor/copy";
import { formatPrice } from "@/lib/frontDoor/offers";
import { loadFrontDoor } from "@/lib/frontDoor/loadOffers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Observer",
  robots: { index: false, follow: false },
  alternates: { canonical: "/front-door/start" },
  description: HOOK,
};

export default async function SalesPage() {
  const bag = await loadFrontDoor();
  const observer = bag.offers.products.find((product) => product.id === "observer");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does Observer cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: observer ? observer.disclosure : "The price is on the order form.",
        },
      },
      {
        "@type": "Question",
        name: "Does Observer become Navigator on its own?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Navigator Annual and Navigator Lifetime are separate purchases.",
        },
      },
      ...WEEKS.map((row) => ({
        "@type": "Question",
        name: row.week,
        acceptedAnswer: { "@type": "Answer", text: row.line },
      })),
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="fd-sr" style={{ display: "none" }}>
        {observer ? formatPrice(observer) : ""}
      </p>
      <FrontDoor
        entry="start"
        offers={bag.offers}
        admitted={bag.admitted}
        needsVisitor={bag.needsVisitor}
      />
    </>
  );
}
