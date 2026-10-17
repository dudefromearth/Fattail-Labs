"use client";

import type { ReactNode } from "react";
import type { FrontDoorProduct } from "@/lib/frontDoor/offers";

type Group = { label: string; items: string[] };

const NAV = [
  { id: "observer", label: "Trial" },
  { id: "navigator-monthly", label: "Monthly" },
  { id: "quarterly", label: "Quarterly" },
  { id: "navigator-annual", label: "Annual" },
  { id: "navigator-lifetime", label: "Lifetime" },
] as const;

const SAVE: Record<string, string> = {
  quarterly: "Save 25%",
  "navigator-annual": "Save 33%",
  "navigator-lifetime": "Save 40%",
};

const OBSERVER_GROUPS: Group[] = [
  {
    label: "Everything Navigator gets",
    items: [
      "Daily live stream group coaching",
      "Sunday retrospective",
      "Discord and the app",
      "Every course, quiz and resource",
    ],
  },
  {
    label: "And when it ends",
    items: ["Finish the six weeks and the course library and Options Lab are yours for a year"],
  },
];

const NAVIGATOR_GROUPS: Group[] = [
  {
    label: "Coaching",
    items: ["Daily live stream group coaching", "Sunday retrospective"],
  },
  {
    label: "Everything else",
    items: ["Every course, quiz and resource", "Discord and the app"],
  },
];

const LIFETIME_GROUPS: Group[] = [
  {
    label: "Everything in Navigator",
    items: [
      "Daily live stream group coaching",
      "Sunday retrospective",
      "Every course, quiz and resource",
      "Discord and the app",
    ],
  },
  { label: "And then", items: ["No renewal. No price rises. Ever."] },
];

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}

function PriceBlock({ product }: { product: FrontDoorProduct }) {
  const sale = product.price_cents;
  const regular = product.regular_price_cents;
  const struck = regular != null && sale != null && regular !== sale ? money(regular) : null;
  const badge = SAVE[product.id];
  if (product.id === "observer" && sale != null) {
    const weekly = money(sale).replace(".00", "");
    const total = money(sale * 6).replace(".00", "");
    return (
      <div className="fd-pick-price">
        <p className="fd-pick-amount">{money(sale)}</p>
        <p className="fd-pick-note">
          {weekly}/week for 6 weeks · {total} total · no renewal
        </p>
      </div>
    );
  }
  const period =
    product.id === "navigator-lifetime"
      ? "one payment · no renewal, ever"
      : product.id === "quarterly"
        ? "/ 3 months"
        : product.id === "navigator-annual"
          ? "/ year"
          : "/ month";
  return (
    <div className="fd-pick-price">
      <p className="fd-pick-amount">
        {struck && <span className="fd-pick-was">{struck}</span>}
        {sale != null ? money(sale) : ""}
        {product.id !== "navigator-lifetime" && <span className="fd-pick-period"> {period}</span>}
      </p>
      {product.id === "navigator-lifetime" && (
        <p className="fd-pick-note">
          {period}
          {badge && <span className="fd-pick-save">{badge}</span>}
        </p>
      )}
      {product.id !== "navigator-lifetime" && badge && <p className="fd-pick-note"><span className="fd-pick-save">{badge}</span></p>}
    </div>
  );
}

function FeatureList({ groups }: { groups: Group[] }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.label} className="fd-pick-group">
          <p className="fd-pick-kicker">{group.label}</p>
          <ul>
            {group.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export default function ProductPicker({
  catalog,
  selectedId,
  onSelect,
  onContinue,
  observerExtra,
}: {
  catalog: FrontDoorProduct[];
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: (id: string) => void;
  observerExtra?: ReactNode;
}) {
  const byId = new Map(catalog.map((product) => [product.id, product]));
  const observer = byId.get("observer");
  const shownId = selectedId === "observer" ? "navigator-monthly" : selectedId;
  const navigator = byId.get(shownId);
  if (!observer || !navigator) return null;
  const observerOn = selectedId === "observer";
  const lifetime = navigator.id === "navigator-lifetime";
  return (
    <div className="fd-picker" data-testid="fd-product-panel">
      <div className="fd-picker-nav" role="radiogroup" aria-label="Product">
        {NAV.map((item) => {
          const on = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={on}
              data-testid={`fd-product-${item.id}`}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="fd-picker-cards">
        <article
          className="fd-pick-card"
          data-active={observerOn ? "true" : "false"}
          data-testid="fd-card-observer"
          onClick={() => onSelect("observer")}
        >
          <h2>Observer Trial</h2>
          <p className="fd-pick-lead">The six-week training course. Everything, nothing held back.</p>
          <PriceBlock product={observer} />
          <p className="fd-pick-refund">You can cancel anytime. No refunds.</p>
          <FeatureList groups={OBSERVER_GROUPS} />
          {observerExtra}
          <button
            type="button"
            className="fd-pick-cta"
            onClick={(event) => {
              event.stopPropagation();
              onContinue("observer");
            }}
          >
            Start the 6-Week Trial
          </button>
        </article>
        <article
          className="fd-pick-card"
          data-active={observerOn ? "false" : "true"}
          data-testid="fd-card-navigator"
          data-shown={navigator.id}
          onClick={() => onSelect(navigator.id)}
        >
          <h2>{lifetime ? "Lifetime" : "Navigator"}</h2>
          <p className="fd-pick-lead">
            {lifetime
              ? "Everything in Navigator. Paid once, kept forever."
              : "The complete membership. Every session, every trading day."}
          </p>
          <PriceBlock product={navigator} />
          <FeatureList groups={lifetime ? LIFETIME_GROUPS : NAVIGATOR_GROUPS} />
          <button
            type="button"
            className="fd-pick-cta"
            onClick={(event) => {
              event.stopPropagation();
              onContinue(navigator.id);
            }}
          >
            {lifetime ? "Buy Lifetime" : "Join Navigator"}
          </button>
        </article>
      </div>
      <aside className="fd-pick-alumni">
        <p className="fd-pick-kicker">The alumni promise</p>
        <p>
          Stay a full month — or complete the 6-week Observer membership — and the entire course
          library and Options Lab are yours for a year, even if you leave.
        </p>
      </aside>
    </div>
  );
}
