"use client";

import { useState } from "react";
import { orderRequestPath, originLabel, type CheckoutOrigin } from "@/lib/frontDoor/offers";

const PRODUCTS = [
  { id: "observer", label: "Trial" },
  { id: "navigator-monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "navigator-annual", label: "Annual" },
  { id: "navigator-lifetime", label: "Lifetime" },
] as const;

export default function EntryLinks() {
  const [source, setSource] = useState<CheckoutOrigin>("website");
  return (
    <div className="fd" data-testid="fd-root" data-entry="demo" data-admitted="1">
      <div className="fd-wrap">
        <header className="fd-head">
          <p className="fd-kicker">FatTail</p>
          <img className="fd-logo" src="/brand/fattail-labs-logo.jpg" alt="FatTail Labs" width={96} height={96} />
        </header>
        <h1>Front door</h1>
        <p className="fd-detail">
          The front door is its own page. A phone, an email, or a QR code opens that page directly.
          The price cards are only the website chooser.
        </p>
        <section className="fd-origin" data-testid="fd-origin" aria-label="Originating request">
          <h2>Where the request starts</h2>
          <div className="fd-origin-sources" role="radiogroup" aria-label="Request source">
            {(["website", "email", "qr"] as const).map((item) => (
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
          {source === "website" ? (
            <p>
              <a data-testid="fd-open-cards" href="/access/choose">
                Open the price cards
              </a>
            </p>
          ) : (
            <div className="fd-origin-products">
              {PRODUCTS.map((item) => (
                <a key={item.id} href={orderRequestPath(source, item.id)} data-testid={`fd-request-${item.label.toLowerCase()}`}>
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
