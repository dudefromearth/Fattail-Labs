import type { Metadata } from "next";
import { PayPalReturn } from "./return-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PayPal",
  robots: { index: false, follow: false },
};

function clip(value: string | undefined, max: number): string {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export default async function PayPalPopup({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; price?: string }>;
}) {
  const params = await searchParams;
  const product = clip(params.product, 80) || "Your order";
  const price = clip(params.price, 120);

  return (
    <main className="fd fd-paypal-page" data-testid="fd-paypal-popup">
      <div className="fd-paypal-sheet">
        <p className="fd-paypal-mark">PayPal</p>
        <h1>{product}</h1>
        {price && <p className="fd-price">{price}</p>}
        <p className="fd-detail">Confirm this payment here, then return to the order.</p>
        <PayPalReturn />
      </div>
    </main>
  );
}
