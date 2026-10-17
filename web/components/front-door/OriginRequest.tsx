"use client";

import { useState } from "react";
import {
  CHECKOUT_ORIGINS,
  checkoutLabel,
  checkoutProductAlias,
  orderRequestPath,
  originLabel,
  salePriceLine,
  type CheckoutOrigin,
  type FrontDoorProduct,
} from "@/lib/frontDoor/offers";

const PRODUCTS = [
  { id: "observer", label: "Trial" },
  { id: "navigator-monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "navigator-annual", label: "Annual" },
  { id: "navigator-lifetime", label: "Lifetime" },
] as const;

/** Demo control. Each product link is the request that source would open. */
export default function OriginRequest({
  origin,
  product,
}: {
  origin: CheckoutOrigin;
  product: FrontDoorProduct;
}) {
  const [source, setSource] = useState<CheckoutOrigin>(origin);
  const arrived = orderRequestPath(origin, product.id);
  return (
    <section className="fd-origin" data-testid="fd-origin" aria-label="Originating request">
      <p className="fd-origin-kicker">Demo</p>
      <h2>Originating request</h2>
      <p data-testid="fd-origin-request">
        {originLabel(origin)} requested {checkoutProductAlias(product.id)}. Checkout is{" "}
        {checkoutLabel(product)} at {salePriceLine(product)}.
      </p>
      <p className="fd-origin-url" data-testid="fd-origin-url">
        {arrived}
      </p>
      <div className="fd-origin-sources" role="radiogroup" aria-label="Request source">
        {CHECKOUT_ORIGINS.map((item) => (
          <button
            key={item}
            type="button"
            role="radio"
            aria-checked={source === item}
            data-testid={`fd-origin-${item}`}
            onClick={() => setSource(item)}
          >
            {originLabel(item)}
          </button>
        ))}
      </div>
      <div className="fd-origin-products">
        {PRODUCTS.map((item) => {
          const href = orderRequestPath(source, item.id);
          const current = source === origin && item.id === product.id;
          return (
            <a
              key={item.id}
              href={href}
              data-testid={`fd-request-${item.label.toLowerCase()}`}
              aria-current={current ? "page" : undefined}
            >
              {item.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}
