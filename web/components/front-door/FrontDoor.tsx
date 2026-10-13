"use client";

import { useEffect, useRef, useState } from "react";
import {
  bucketFromSignals,
  formatPrice,
  type FrontDoorOffers,
  type FrontDoorProduct,
  type SpeedBucket,
} from "@/lib/frontDoor/offers";
import { HOOK, VSL_TRANSCRIPT, WEEKS } from "@/lib/frontDoor/copy";
import { clearFormDraft, readFormDraft, writeFormDraft } from "@/lib/frontDoor/formDraft";
import { randomId, sha256Hex } from "@/lib/frontDoor/webCrypto";

export type DoorEntry = "order" | "start" | "watch" | "confirm";

type View = {
  state: string;
  view: string;
  headline: string;
  detail: string;
  can_buy: boolean;
  products: { id: string }[];
  nudge: { title: string; body: string; action: string } | null;
  card_update_url: string | null;
};

type Props = {
  entry: DoorEntry;
  offers: FrontDoorOffers;
  admitted: boolean;
  needsVisitor: boolean;
  initialProduct?: string;
};

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof data.detail === "string" ? data.detail : `Request failed (${response.status})`;
    throw new Error(detail);
  }
  return data;
}

function coarseFingerprint(): string {
  const nav = typeof navigator === "undefined" ? ({} as Navigator) : navigator;
  const screenBits =
    typeof screen === "undefined" ? "" : `${screen.width}x${screen.height}`;
  const raw = [
    nav.userAgent || "",
    nav.language || "",
    Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    screenBits,
    String(nav.hardwareConcurrency || ""),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return `coarse-v1-${hash.toString(16)}`;
}

function renderHash(text: string): Promise<string> {
  return sha256Hex(text);
}

function DoorHeader() {
  return (
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
  );
}

export default function FrontDoor({
  entry,
  offers,
  admitted,
  needsVisitor,
  initialProduct,
}: Props) {
  const [speed, setSpeed] = useState<SpeedBucket>("medium");
  const [view, setView] = useState<View | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [productId, setProductId] = useState(initialProduct || "");
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [confirmed, setConfirmed] = useState<"yes" | "no" | "pending">("pending");
  const [orderId, setOrderId] = useState("");
  const [orderKey, setOrderKey] = useState("");
  const handed = useRef(false);
  const keepDraft = useRef(true);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const existing = sessionStorage.getItem("fd_order_key");
    if (existing) {
      setOrderKey(existing);
      return;
    }
    const next = randomId(); // getRandomValues when randomUUID is missing on plain HTTP
    sessionStorage.setItem("fd_order_key", next);
    setOrderKey(next);
  }, []);

  useEffect(() => {
    if (entry === "confirm") {
      clearFormDraft(sessionStorage);
      return;
    }
    if (entry !== "order") return;
    // Read after mount so the server HTML and the first client render stay empty.
    const draft = readFormDraft(sessionStorage, offers.terms_version);
    if (draft) {
      setEmail(draft.email);
      setFirstName(draft.firstName);
      setLastName(draft.lastName);
      if (draft.productId) setProductId(draft.productId);
      setTerms(draft.terms);
    }
    setDraftReady(true);
  }, [entry, offers.terms_version]);

  useEffect(() => {
    if (entry !== "order" || !draftReady || !keepDraft.current) return;
    writeFormDraft(
      sessionStorage,
      { email, firstName, lastName, productId, terms },
      offers.terms_version,
    );
  }, [draftReady, email, entry, firstName, lastName, offers.terms_version, productId, terms]);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    const connection = (navigator as Navigator & {
      connection?: { effectiveType?: string; rtt?: number };
    }).connection;
    fetch("/front-door/ping", { cache: "no-store" })
      .then(() => {
        if (cancelled) return;
        setSpeed(
          bucketFromSignals({
            effectiveType: connection?.effectiveType,
            rtt: connection?.rtt,
            probeMs: performance.now() - started,
          }),
        );
      })
      .catch(() => {
        if (!cancelled) setSpeed("slow");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!admitted || entry === "confirm" || !orderKey) return;
    const visitor = orderKey;
    const drop = () => {
      if (handed.current || sessionStorage.getItem("fd_handed") === "1") return;
      const body = JSON.stringify({
        event: "dropoff",
        visitor_key: visitor,
        entry,
        step: "before-handoff",
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/front-door/analytics", new Blob([body], { type: "application/json" }));
      }
    };
    window.addEventListener("pagehide", drop);
    return () => window.removeEventListener("pagehide", drop);
  }, [admitted, entry, orderKey]);

  useEffect(() => {
    if (!admitted || needsVisitor || !orderKey) return;
    let cancelled = false;
    (async () => {
      try {
        if (entry !== "confirm") {
          await postJson("/api/front-door/evidence", {
            moment: "page_load",
            order_key: orderKey,
            payload: {
              user_agent: navigator.userAgent,
              referrer: document.referrer || null,
              client_sent_at: new Date().toISOString(),
            },
          });
          await postJson("/api/front-door/analytics", {
            event: "view",
            visitor_key: orderKey,
            entry,
          });
          if (!cancelled) setRecorded(true);
          const next = (await postJson("/api/front-door/member-state", {})) as View;
          if (!cancelled) setView(next);
        } else {
          const params = new URLSearchParams(window.location.search);
          const wooOrderId = params.get("order_id");
          if (!wooOrderId) {
            if (!cancelled) setConfirmed("no");
            return;
          }
          if (!cancelled) setOrderId(wooOrderId);
          const hash = await renderHash(`confirm|${wooOrderId}|${offers.terms_version}`);
          await postJson("/api/front-door/evidence", {
            moment: "payment_confirmation",
            order_key: orderKey,
            payload: { woo_order_id: wooOrderId, rendered_checkout_sha256: hash },
          });
          await postJson("/api/front-door/analytics", {
            event: "confirmation",
            visitor_key: orderKey,
            entry: "confirm",
            product_id: params.get("product"),
          });
          if (!cancelled) setConfirmed("yes");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Checkout could not be recorded.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admitted, needsVisitor, entry, orderKey, offers.terms_version]);

  useEffect(() => {
    if (!needsVisitor) return;
    let cancelled = false;
    (async () => {
      if (sessionStorage.getItem("fd_visitor_attempt") === "1") return;
      sessionStorage.setItem("fd_visitor_attempt", "1");
      await fetch("/front-door/visitor", { method: "POST" });
      if (!cancelled) window.location.reload();
    })();
    return () => {
      cancelled = true;
    };
  }, [needsVisitor]);

  async function checkEmail(value: string) {
    if (!value.includes("@")) return;
    try {
      const next = (await postJson("/api/front-door/member-state", { email: value.trim() })) as View;
      setView(next);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Membership could not be checked.");
    }
  }

  const purchasableIds = new Set((view?.products || []).map((product) => product.id));
  const choices: FrontDoorProduct[] = view?.can_buy
    ? offers.products.filter((product) => purchasableIds.has(product.id))
    : offers.products;
  const selected = choices.find((product) => product.id === productId) || null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!view?.can_buy) {
      setError("A buy button is not available until membership is checked.");
      return;
    }
    if (!email.includes("@") || !firstName.trim() || !lastName.trim()) {
      setError("Email, first name, and last name are required.");
      return;
    }
    if (!selected) {
      setError("Choose a product.");
      return;
    }
    if (!terms) {
      setError("Accept the terms to continue.");
      return;
    }
    setBusy(true);
    try {
      const seen = [
        selected.name,
        formatPrice(selected),
        selected.disclosure,
        offers.terms_url,
        offers.privacy_url,
        offers.terms_version,
      ].join("\n");
      const hash = await renderHash(seen);
      await postJson("/api/front-door/evidence", {
        moment: "terms_acceptance",
        order_key: orderKey,
        payload: {
          checkbox: true,
          terms_version: offers.terms_version,
          privacy_notice_version: offers.privacy_notice_version,
          clicked_at: new Date().toISOString(),
          device_fingerprint: coarseFingerprint(),
          rendered_checkout_sha256: hash,
        },
      });
      const handoff = await postJson("/api/front-door/handoff", {
        product_id: selected.id,
        email: email.trim(),
        order_key: orderKey,
      });
      await postJson("/api/front-door/analytics", {
        event: "handoff",
        visitor_key: orderKey,
        entry: "order",
        product_id: selected.id,
      });
      handed.current = true;
      keepDraft.current = false;
      clearFormDraft(sessionStorage);
      sessionStorage.setItem("fd_handed", "1");
      window.location.assign(String(handoff.url));
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Checkout could not start.");
    }
  }

  if (!admitted) {
    return (
      <div className="fd" data-testid="fd-root" data-entry={entry} data-admitted="0">
        <div className="fd-wrap">
          <DoorHeader />
          <h1>This page is not open</h1>
          <p className="fd-detail" data-testid="fd-closed">
            The front door is switched off. Nothing here sends you anywhere else.
          </p>
          <LegalFooter offers={offers} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="fd"
      data-testid="fd-root"
      data-entry={entry}
      data-speed={speed}
      data-state={view?.state || "pending"}
      data-admitted="1"
    >
      <div className="fd-wrap">
        <DoorHeader />
        {entry === "start" && <Sales offers={offers} speed={speed} />}
        {entry === "watch" && <Watch offers={offers} speed={speed} />}
        {entry === "confirm" && (
          <Confirm confirmed={confirmed} error={error} orderId={orderId} />
        )}
        {entry === "order" && (
          <form data-testid="fd-order-form" onSubmit={submit} noValidate>
            <h1>{view?.headline || "Order"}</h1>
            {view?.nudge && (
              <div className="fd-nudge" data-testid="fd-nudge" role="status">
                <strong>{view.nudge.title}</strong>
                <p>{view.nudge.body}</p>
                {view.card_update_url && (
                  <a href={view.card_update_url}>{view.nudge.action}</a>
                )}
              </div>
            )}
            {!view?.can_buy && view && view.view !== "unchecked" && (
              <p className="fd-status" data-testid="fd-covered">
                {view.headline}
              </p>
            )}
            <div className="fd-card">
              <div className="fd-float">
                <input
                  id="fd-email"
                  data-testid="fd-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder=" "
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => checkEmail(email)}
                  required
                />
                <label htmlFor="fd-email">Email</label>
              </div>
              <div className="fd-float">
                <input
                  id="fd-first-name"
                  data-testid="fd-first-name"
                  type="text"
                  autoComplete="given-name"
                  placeholder=" "
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
                <label htmlFor="fd-first-name">First name</label>
              </div>
              <div className="fd-float">
                <input
                  id="fd-last-name"
                  data-testid="fd-last-name"
                  type="text"
                  autoComplete="family-name"
                  placeholder=" "
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
                <label htmlFor="fd-last-name">Last name</label>
              </div>
              <div className="fd-choices" role="radiogroup" aria-label="Products">
              {choices.map((product) => {
                const on = product.id === (selected?.id || "");
                return (
                  <label
                    key={product.id}
                    className="fd-choice"
                    data-testid={`fd-product-${product.id}`}
                    aria-checked={on}
                  >
                    <input
                      type="radio"
                      name="product"
                      checked={on}
                      disabled={!view?.can_buy}
                      onChange={() => setProductId(product.id)}
                    />
                    <span>
                      <span className="fd-price">
                        {product.name} · {formatPrice(product)}
                      </span>
                      <span className="fd-disclosure">{product.disclosure}</span>
                    </span>
                  </label>
                );
              })}
              </div>
              <label className="fd-check" data-testid="fd-terms">
                <input
                  id="fd-terms-box"
                  type="checkbox"
                  checked={terms}
                  aria-describedby="fd-terms-notice"
                  onChange={(event) => setTerms(event.target.checked)}
                />
                <span className="fd-check-mark" data-testid="fd-terms-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      d="M5 12.5 10 17.5 19 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span id="fd-terms-notice" className="fd-check-copy">
                  I accept the{" "}
                  <LegalLink href={offers.terms_url} testId="fd-link-terms">
                    terms
                  </LegalLink>{" "}
                  and the{" "}
                  <LegalLink href={offers.privacy_url} testId="fd-link-privacy">
                    privacy notice
                  </LegalLink>
                  .
                </span>
              </label>
            </div>
            {error && (
              <p className="fd-error" data-testid="fd-error" role="alert">
                {error}
              </p>
            )}
            {view?.can_buy && (
              <div className="fd-bar">
                <button
                  className="fd-submit"
                  data-testid="fd-submit"
                  type="submit"
                  disabled={busy || !recorded}
                >
                  Continue to checkout
                </button>
              </div>
            )}
          </form>
        )}
        <nav className="fd-links" aria-label="Other ways in">
          {entry !== "start" && (
            <a data-testid="fd-link-start" href="/front-door/start">
              The six weeks
            </a>
          )}
          {entry !== "watch" && (
            <a data-testid="fd-link-watch" href="/front-door/watch">
              Short video
            </a>
          )}
          {entry !== "order" && (
            <a data-testid="fd-link-order" href="/front-door/order">
              Order form
            </a>
          )}
        </nav>
        <LegalFooter offers={offers} />
      </div>
    </div>
  );
}

function LegalLink({
  href,
  testId,
  children,
}: {
  href: string;
  testId: string;
  children: string;
}) {
  return (
    <a
      className="fd-legal"
      data-testid={testId}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      {children}
    </a>
  );
}

function LegalFooter({ offers }: { offers: FrontDoorOffers }) {
  return (
    <footer className="fd-legal-footer">
      <LegalLink href={offers.terms_url} testId="fd-footer-terms">
        terms
      </LegalLink>
      <LegalLink href={offers.privacy_url} testId="fd-footer-privacy">
        privacy notice
      </LegalLink>
    </footer>
  );
}

function Sales({ offers, speed }: { offers: FrontDoorOffers; speed: SpeedBucket }) {
  const observer = offers.products.find((product) => product.id === "observer");
  return (
    <section>
      <h1>{HOOK}</h1>
      <p className="fd-lead">
        Quiet training for people who want the process before the tools.
        {observer ? ` ${observer.disclosure}` : ""}
      </p>
      <ol className="fd-weeks">
        {WEEKS.map((row) => (
          <li key={row.week}>
            <strong>{row.week}</strong>
            <span>{row.line}</span>
          </li>
        ))}
      </ol>
      {speed !== "slow" && (
        <p className="fd-extra fd-detail">
          Search and ads land here. The order form is one screen, and the video page is linked below.
        </p>
      )}
      <div className="fd-bar">
        <a className="fd-cta" data-testid="fd-sales-cta" href="/front-door/order?product=observer">
          {observer ? `Continue · ${formatPrice(observer)}` : "Continue to the order form"}
        </a>
      </div>
    </section>
  );
}

function Watch({ offers, speed }: { offers: FrontDoorOffers; speed: SpeedBucket }) {
  const showVideo = speed !== "slow" && offers.vsl_url.startsWith("https://");
  return (
    <section>
      <h1>A short video, then the order form</h1>
      {showVideo ? (
        <video className="fd-video" controls preload="none" src={offers.vsl_url} />
      ) : (
        <p className="fd-detail" data-testid="fd-no-video">
          {speed === "slow"
            ? "The video stays off on a slow connection. The words are below."
            : "No video file is attached. The words are below."}
        </p>
      )}
      {VSL_TRANSCRIPT.map((line) => (
        <p key={line} className="fd-detail">
          {line}
        </p>
      ))}
      <div className="fd-bar">
        <a className="fd-cta" href="/front-door/order">
          Continue to the order form
        </a>
      </div>
    </section>
  );
}

function Confirm({
  confirmed,
  error,
  orderId,
}: {
  confirmed: "yes" | "no" | "pending";
  error: string;
  orderId: string;
}) {
  if (confirmed === "yes") {
    return (
      <section>
        <h1>Payment handed off</h1>
        <p className="fd-status" data-testid="fd-success" role="status">
          WooCommerce took the payment. Order <span data-testid="fd-order-id">{orderId}</span> is
          recorded with this checkout. Keep this confirmation.
        </p>
      </section>
    );
  }
  if (confirmed === "no") {
    return (
      <section>
        <h1>Payment is not confirmed</h1>
        <p className="fd-error" data-testid="fd-error" role="alert">
          This page needs an order id from checkout. Nothing was marked paid.
        </p>
      </section>
    );
  }
  return (
    <section>
      <h1>Recording confirmation</h1>
      {error && (
        <p className="fd-error" data-testid="fd-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
