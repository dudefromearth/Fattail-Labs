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

const SAMPLES = [
  { state: "belonging", label: "Belonging" },
  { state: "observer", label: "Observer, in the six weeks" },
  { state: "finished_observer", label: "Finished Observer" },
  { state: "lapsed_annual", label: "Lapsed annual" },
  { state: "navigator_annual", label: "Navigator annual" },
  { state: "navigator_lifetime", label: "Lifetime" },
  { state: "past_due", label: "Past due annual" },
  { state: "cancelled_before_completion", label: "Cancelled before completion" },
  { state: "covered_other", label: "Monthly, already covered" },
] as const;

export default function DemoLauncher() {
  const [source, setSource] = useState<CheckoutOrigin>("website");
  const [error, setError] = useState("");

  async function loadSample(state: string) {
    setError("");
    const response = await fetch("/api/front-door/demo-person", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ state }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(typeof data.detail === "string" ? data.detail : "The sample could not be loaded.");
      return;
    }
    const email = typeof data.email === "string" ? data.email : "";
    const name = typeof data.name === "string" ? data.name : email;
    const session = typeof data.session === "string" ? data.session : "";
    sessionStorage.setItem("fd_belong_session", session);
    sessionStorage.removeItem("fd_order_key");
    sessionStorage.setItem(
      "fd_form",
      JSON.stringify({
        email,
        signedIn: { kind: "login", name, email },
        accountOpen: true,
        passwordSaved: true,
      }),
    );
    document.cookie = `fd_preview_member=${encodeURIComponent(email)}; Path=/; SameSite=Lax`;
    document.cookie = "fd_preview_admin=1; Path=/; SameSite=Lax";
    window.location.assign(typeof data.path === "string" ? data.path : "/front-door/order");
  }

  return (
    <div className="fd" data-testid="fd-root" data-entry="demo" data-admitted="1">
      <div className="fd-wrap">
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
        <h1>Front door demo</h1>
        <p className="fd-detail">
          The front door is its own page. A phone, an email, or a QR code opens that page directly.
          The price cards are only the website chooser.
        </p>
        <section className="fd-origin" data-testid="fd-origin" aria-label="Originating request">
          <p className="fd-origin-kicker">Demo</p>
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
              <a data-testid="fd-open-cards" href="/front-door/choose">
                Open the price cards
              </a>
            </p>
          ) : (
            <div className="fd-origin-products">
              {PRODUCTS.map((item) => (
                <a
                  key={item.id}
                  href={orderRequestPath(source, item.id)}
                  data-testid={`fd-request-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          )}
        </section>
        <section className="fd-card fd-origin" data-testid="fd-samples">
          <h2>Sample people</h2>
          <p className="fd-detail">
            Each button signs in a preview person and opens the front door. They live in this demo
            only.
          </p>
          <div className="fd-origin-products">
            {SAMPLES.map((item) => (
              <button
                key={item.state}
                type="button"
                data-testid={`fd-sample-${item.state}`}
                onClick={() => void loadSample(item.state)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>
        {error && (
          <p className="fd-error" role="alert">
            {error}
          </p>
        )}
        <p className="fd-detail">
          <button
            type="button"
            className="fd-quiet"
            data-testid="fd-open-admin"
            onClick={() => {
              document.cookie = "fd_preview_admin=1; Path=/; SameSite=Lax";
              window.location.assign("/admin/users");
            }}
          >
            Open Admin Users
          </button>
        </p>
      </div>
    </div>
  );
}
