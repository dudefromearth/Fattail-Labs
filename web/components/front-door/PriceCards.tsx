"use client";

import { useState } from "react";
import ProductPicker from "@/components/front-door/ProductPicker";
import {
  checkoutProducts,
  orderRequestPath,
  type FrontDoorProduct,
} from "@/lib/frontDoor/offers";

export default function PriceCards({ products }: { products: FrontDoorProduct[] }) {
  const catalog = checkoutProducts(products);
  const [selectedId, setSelectedId] = useState("observer");
  return (
    <div className="fd" data-testid="fd-root" data-entry="choose" data-admitted="1">
      <div className="fd-wrap fd-wrap-wide">
        <header className="fd-head">
          <p className="fd-kicker">FatTail</p>
          <img
            className="fd-logo"
            src="/brand/fattail-labs-logo.jpg"
            alt="FatTail Labs"
            width={96}
            height={96}
          />
        </header>
        <h1>Choose a membership</h1>
        <p className="fd-detail">
          This is the website chooser. The front door opens on the next page with the product you pick.
        </p>
        <ProductPicker
          catalog={catalog}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onContinue={(id) => {
            window.location.assign(orderRequestPath("website", id));
          }}
        />
        <p className="fd-detail">
          <a className="fd-quiet" href="/front-door/demo">
            Demo launcher
          </a>
        </p>
      </div>
    </div>
  );
}
