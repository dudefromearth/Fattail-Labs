"use client";

import { useEffect, useRef, useState } from "react";
import {
  bucketFromSignals,
  canonicalCheckoutOrigin,
  canonicalCheckoutProduct,
  checkoutLabel,
  checkoutProducts,
  checkoutShortName,
  describeProduct,
  formatPrice,
  memberDisclosure,
  orderRequestPath,
  originLabel,
  regularPrice,
  salePriceLine,
  type CheckoutOrigin,
  type FrontDoorOffers,
  type SpeedBucket,
} from "@/lib/frontDoor/offers";
import { HOOK, VSL_TRANSCRIPT, WEEKS } from "@/lib/frontDoor/copy";
import { emailAddressProblem } from "@/lib/frontDoor/emailAddress";
import { contactProblem, isNavigatorProduct, type Contact } from "@/lib/frontDoor/contact";
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

type SignedIn = { kind: "login" | "new"; name: string; email: string };

type PasswordMail = { email: string; previewPath: string };

type Props = {
  entry: DoorEntry;
  offers: FrontDoorOffers;
  admitted: boolean;
  needsVisitor: boolean;
  initialProduct?: string;
  initialOrigin?: string;
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

const FORM_KEY = "fd_form";

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatCardExp(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCardCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
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
  initialOrigin,
}: Props) {
  const [speed, setSpeed] = useState<SpeedBucket>("medium");
  const [view, setView] = useState<View | null>(null);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("");
  const [passwordMail, setPasswordMail] = useState<PasswordMail | null>(null);
  const [productId, setProductId] = useState(() => canonicalCheckoutProduct(initialProduct));
  const [origin] = useState<CheckoutOrigin>(() => canonicalCheckoutOrigin(initialOrigin));
  const [terms, setTerms] = useState(false);
  const [notAdvice, setNotAdvice] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountMode, setAccountMode] = useState<"" | "login" | "create">("");
  const [sessionChecked, setSessionChecked] = useState(entry !== "order");
  const [sessionToken, setSessionToken] = useState("");
  const [passwordNeeded, setPasswordNeeded] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [existsPrompt, setExistsPrompt] = useState(false);
  const [signedIn, setSignedIn] = useState<SignedIn | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [weeksOpen, setWeeksOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"" | "card" | "paypal">("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState<"yes" | "no" | "pending">("pending");
  const [orderId, setOrderId] = useState("");
  const [orderKey, setOrderKey] = useState("");
  const handed = useRef(false);
  const keepDraft = useRef(true);
  const sessionEpoch = useRef(0);
  const termsRecorded = useRef(false);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const existing = sessionStorage.getItem("fd_order_key");
    if (existing) {
      setOrderKey(existing);
      return;
    }
    const next = randomId();
    sessionStorage.setItem("fd_order_key", next);
    setOrderKey(next);
  }, []);

  useEffect(() => {
    if (entry !== "order") return;
    try {
      const raw = sessionStorage.getItem(FORM_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>;
        if (typeof data.email === "string") setEmail(data.email);
        if (typeof data.confirmEmail === "string") setConfirmEmail(data.confirmEmail);
        if (typeof data.firstName === "string") setFirstName(data.firstName);
        if (typeof data.lastName === "string") setLastName(data.lastName);
        if (typeof data.username === "string") setUsername(data.username);
        if (typeof data.phone === "string") setPhone(data.phone);
        if (typeof data.street === "string") setStreet(data.street);
        if (typeof data.city === "string") setCity(data.city);
        if (typeof data.region === "string") setRegion(data.region);
        if (typeof data.postal === "string") setPostal(data.postal);
        if (typeof data.country === "string") setCountry(data.country);
        if (data.passwordMail && typeof data.passwordMail === "object") {
          const mail = data.passwordMail as PasswordMail;
          if (typeof mail.email === "string") {
            setPasswordMail({
              email: mail.email,
              previewPath: typeof mail.previewPath === "string" ? mail.previewPath : "",
            });
          }
        }
        if (!canonicalCheckoutProduct(initialProduct) && typeof data.productId === "string" && data.productId) {
          setProductId(data.productId);
        }
        if (data.terms === true) setTerms(true);
        if (data.notAdvice === true) setNotAdvice(true);
        if (data.accountOpen === true) setAccountOpen(true);
        if (data.paymentOpen === true) setPaymentOpen(true);
        if (data.accountMode === "login" || data.accountMode === "create") {
          setAccountMode(data.accountMode);
        }
        if (data.passwordSaved === true) setPasswordSaved(true);
        if (data.passwordNeeded === true) setPasswordNeeded(true);
        const savedSession = sessionStorage.getItem("fd_belong_session");
        if (typeof savedSession === "string") setSessionToken(savedSession);
        if (data.paymentMethod === "card" || data.paymentMethod === "paypal") setPaymentMethod(data.paymentMethod);
        if (data.signedIn && typeof data.signedIn === "object") {
          const saved = data.signedIn as SignedIn;
          if ((saved.kind === "login" || saved.kind === "new") && typeof saved.name === "string") {
            setSignedIn({ kind: saved.kind, name: saved.name, email: typeof saved.email === "string" ? saved.email : "" });
          }
        }
      }
    } catch {
      /* a damaged draft is ignored */
    }
    setDraftReady(true);
  }, [entry]);

  useEffect(() => {
    if (entry !== "order" || !draftReady || !keepDraft.current) return;
    sessionStorage.setItem(
      FORM_KEY,
      JSON.stringify({
        email,
        confirmEmail,
        firstName,
        lastName,
        username,
        phone,
        street,
        city,
        region,
        postal,
        country,
        passwordMail,
        productId,
        terms,
        notAdvice,
        accountOpen,
        paymentOpen,
        accountMode,
        passwordNeeded,
        passwordSaved,
        paymentMethod,
        signedIn,
      }),
    );
  }, [
    accountMode,
    accountOpen,
    city,
    confirmEmail,
    country,
    draftReady,
    email,
    entry,
    firstName,
    lastName,
    notAdvice,
    paymentMethod,
    passwordMail,
    passwordNeeded,
    passwordSaved,
    paymentOpen,
    phone,
    postal,
    productId,
    region,
    signedIn,
    street,
    terms,
    username,
  ]);

  useEffect(() => {
    if (entry !== "order" || !draftReady) return;
    const epoch = sessionEpoch.current;
    let cancelled = false;
    const headers: Record<string, string> = {};
    const token = sessionStorage.getItem("fd_belong_session");
    if (token) headers["X-Fd-Session"] = token;
    fetch("/api/auth/me", { credentials: "same-origin", headers })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
        return { ok: response.ok, data };
      })
      .then(({ ok, data }) => {
        if (cancelled || epoch !== sessionEpoch.current) return;
        const emailValue = typeof data.email === "string" ? data.email.trim() : "";
        const member =
          ok &&
          emailValue.length > 0 &&
          !(data.preview === true && data.member !== true);
        if (!member) {
          if (ok === false || data.preview === true) {
            setSignedIn(null);
            setPasswordNeeded(false);
            setPasswordSaved(false);
          }
          setSessionChecked(true);
          return;
        }
        const name =
          typeof data.display_name === "string" && data.display_name.trim()
            ? data.display_name.trim()
            : emailValue;
        setSignedIn({ kind: data.password_set === false ? "new" : "login", name, email: emailValue });
        if (token) setSessionToken(token);
        if (data.password_set === false) {
          setPasswordNeeded(true);
          setPasswordSaved(false);
        } else {
          setPasswordNeeded(false);
          setPasswordSaved(true);
        }
        setSessionChecked(true);
      })
      .catch(() => {
        if (!cancelled && epoch === sessionEpoch.current) setSessionChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [draftReady, entry]);

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
        product_id: productId || null,
        origin,
        email: signedIn?.email || null,
        step: "before-handoff",
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/front-door/analytics", new Blob([body], { type: "application/json" }));
      }
    };
    window.addEventListener("pagehide", drop);
    return () => window.removeEventListener("pagehide", drop);
  }, [admitted, entry, orderKey, origin, productId, signedIn?.email]);

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
            product_id: productId || null,
            origin,
            email: signedIn?.email || null,
          });
          if (!sessionStorage.getItem("fd_belong_session")) {
            const next = (await postJson("/api/front-door/member-state", {})) as View;
            if (!cancelled) setView(next);
          }
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
            origin,
            email: signedIn?.email || null,
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

  async function checkEmail(value: string): Promise<View | null> {
    if (!value.trim()) return null;
    const problem = emailAddressProblem(value);
    if (problem) {
      setError(problem);
      return null;
    }
    try {
      const next = (await postJson("/api/front-door/member-state", { email: value.trim() })) as View;
      setView(next);
      setError("");
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Membership could not be checked.");
      return null;
    }
  }

  const catalog = checkoutProducts(offers.products);
  const selected =
    catalog.find((product) => product.id === productId) ||
    catalog.find((product) => product.id === "observer") ||
    catalog[0] ||
    null;
  const upgrade =
    view?.state === "observer" ||
    view?.state === "finished_observer" ||
    view?.state === "lapsed_annual";
  const purchaseClosed = Boolean(
    view &&
      view.view !== "unchecked" &&
      (!view.can_buy || (upgrade && selected?.id === "observer")),
  );
  const showBelonging = Boolean(
    signedIn && (view?.state === "belonging" || !view || view.view === "unchecked"),
  );
  const payReady = notAdvice && terms && !purchaseClosed;
  const navigatorOrder = Boolean(selected && isNavigatorProduct(selected.id));
  const contactOk = contactProblem(contact()) === "";
  const accountReady = Boolean(signedIn) && (!navigatorOrder || contactOk);

  useEffect(() => {
    if (entry !== "order" || !selected) return;
    const path = orderRequestPath(origin, selected.id);
    if (`${window.location.pathname}${window.location.search}` !== path) {
      window.history.replaceState(null, "", path);
    }
  }, [entry, origin, selected]);

  useEffect(() => {
    if (!admitted || entry !== "order" || !signedIn?.email) return;
    let cancelled = false;
    postJson("/api/front-door/member-state", { email: signedIn.email })
      .then((next) => {
        if (!cancelled) setView(next as View);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [admitted, entry, signedIn?.email]);

  useEffect(() => {
    if (!admitted || entry !== "order" || !orderKey || !productId) return;
    void postJson("/api/front-door/analytics", {
      event: "product_selected",
      visitor_key: orderKey,
      entry,
      product_id: productId,
      origin,
      email: signedIn?.email || null,
    }).catch(() => {});
  }, [admitted, entry, orderKey, productId, origin, signedIn?.email]);

  useEffect(() => {
    if (!admitted || !orderKey || !view?.nudge) return;
    void postJson("/api/front-door/analytics", {
      event: "nudge_shown",
      visitor_key: orderKey,
      entry,
      product_id: productId || null,
      origin,
      email: signedIn?.email || null,
    }).catch(() => {});
  }, [admitted, orderKey, view?.nudge, entry, productId, origin, signedIn?.email]);

  function choosePayPal() {
    setPaymentMethod("paypal");
    setError("");
    if (!selected) return;
    const params = new URLSearchParams({
      product: checkoutLabel(selected),
      price: salePriceLine(selected),
    });
    const popup = window.open(
      `/front-door/paypal?${params.toString()}`,
      "fd-paypal",
      "popup,width=460,height=720",
    );
    if (!popup) {
      setError("Allow the PayPal window to open, then choose PayPal again.");
      return;
    }
    popup.focus();
  }

  async function signInExisting() {
    setError("");
    setExistsPrompt(false);
    if (!username.trim()) {
      setError("Enter your username.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/front-door/login", {
        email: username.trim(),
        password,
        origin,
        product_id: selected?.id || null,
      });
      const to = typeof data.email === "string" ? data.email : username.trim();
      const name = typeof data.name === "string" ? data.name : to;
      const session = typeof data.session === "string" ? data.session : "";
      sessionEpoch.current += 1;
      setSignedIn({ kind: "login", name, email: to });
      setSessionToken(session);
      setPasswordNeeded(false);
      setPasswordSaved(true);
      setPassword("");
      if (session) sessionStorage.setItem("fd_belong_session", session);
      document.cookie = `fd_preview_member=${encodeURIComponent(to)}; Path=/; SameSite=Lax`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That email and password do not match.");
    } finally {
      setBusy(false);
    }
  }

  function contact(): Contact {
    return { phone, street, city, region, postal, country };
  }

  async function join() {
    setError("");
    setExistsPrompt(false);
    const problem = emailAddressProblem(email);
    if (problem) {
      setError(problem);
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }
    if (confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setError("Enter the same email address in both email fields.");
      return;
    }
    setBusy(true);
    try {
      const data = await postJson("/api/front-door/join", {
        door: "account",
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        origin,
        product_id: selected?.id || null,
      });
      const to = typeof data.email === "string" ? data.email : email.trim();
      const fallback = `${firstName.trim()} ${lastName.trim()}`;
      const name = typeof data.name === "string" && data.name ? data.name : fallback;
      const session = typeof data.session === "string" ? data.session : "";
      sessionEpoch.current += 1;
      setSignedIn({ kind: "new", name, email: to });
      setSessionToken(session);
      setPasswordNeeded(true);
      setPasswordSaved(false);
      setNewPassword("");
      setConfirmPassword("");
      if (session) sessionStorage.setItem("fd_belong_session", session);
      document.cookie = `fd_preview_member=${encodeURIComponent(to)}; Path=/; SameSite=Lax`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "The account could not be created.";
      setError(message);
      if (message === "An account already exists for this email.") setExistsPrompt(true);
    } finally {
      setBusy(false);
    }
  }

  async function saveSessionPassword() {
    setError("");
    if (newPassword.length < 10) {
      setError("Use at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Enter the same password in both fields.");
      return;
    }
    setBusy(true);
    try {
      await postJson("/api/front-door/session-password", {
        session: sessionToken,
        password: newPassword,
      });
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNeeded(false);
      setPasswordSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The password could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function resetDemo() {
    keepDraft.current = false;
    try {
      await postJson("/api/front-door/reset", {});
    } catch {
      /* The page still starts over. */
    }
    sessionStorage.removeItem(FORM_KEY);
    sessionStorage.removeItem("fd_belong_session");
    sessionStorage.removeItem("fd_order_key");
    sessionStorage.removeItem("fd_visitor_attempt");
    document.cookie = "fd_preview_member=; Path=/; Max-Age=0";
    window.location.assign("/front-door/demo");
  }

  async function noteAcceptance(advice: boolean, accepted: boolean) {
    if (!advice || !accepted || termsRecorded.current || !orderKey || !selected) return;
    termsRecorded.current = true;
    try {
      const seen = [
        checkoutLabel(selected),
        salePriceLine(selected),
        memberDisclosure(selected),
        offers.terms_url,
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
      await postJson("/api/front-door/analytics", {
        event: "terms_checked",
        visitor_key: orderKey,
        entry,
        product_id: selected.id,
        origin,
        email: signedIn?.email || null,
      });
    } catch {
      termsRecorded.current = false;
    }
  }

  function ContactFields() {
    return (
      <div data-testid="fd-contact">
        <div className="fd-float">
          <input
            id="fd-phone"
            data-testid="fd-phone"
            type="text"
            autoComplete="tel"
            inputMode="tel"
            placeholder=" "
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <label htmlFor="fd-phone">Phone</label>
        </div>
        <div className="fd-float">
          <input
            id="fd-street"
            data-testid="fd-street"
            type="text"
            autoComplete="street-address"
            placeholder=" "
            value={street}
            onChange={(event) => setStreet(event.target.value)}
          />
          <label htmlFor="fd-street">Street address</label>
        </div>
        <div className="fd-float">
          <input
            id="fd-city"
            data-testid="fd-city"
            type="text"
            autoComplete="address-level2"
            placeholder=" "
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <label htmlFor="fd-city">City</label>
        </div>
        <div className="fd-split">
          <div className="fd-float">
            <input
              id="fd-region"
              data-testid="fd-region"
              type="text"
              autoComplete="address-level1"
              placeholder=" "
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            />
            <label htmlFor="fd-region">State</label>
          </div>
          <div className="fd-float">
            <input
              id="fd-postal"
              data-testid="fd-postal"
              type="text"
              autoComplete="postal-code"
              placeholder=" "
              value={postal}
              onChange={(event) => setPostal(event.target.value)}
            />
            <label htmlFor="fd-postal">ZIP code</label>
          </div>
        </div>
        <div className="fd-float">
          <input
            id="fd-country"
            data-testid="fd-country"
            type="text"
            autoComplete="country-name"
            placeholder=" "
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          />
          <label htmlFor="fd-country">Country</label>
        </div>
      </div>
    );
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
        {entry === "order" && selected && (
          <div data-testid="fd-order-form" data-product={selected.id} data-origin={origin}>
            {view?.nudge && (
              <div className="fd-nudge" data-testid="fd-nudge" role="status">
                <strong>{view.nudge.title}</strong>
                <p>{view.nudge.body}</p>
                {view.card_update_url && (
                  <a href={view.card_update_url}>{view.nudge.action}</a>
                )}
              </div>
            )}
            {view && view.view !== "unchecked" && (
              <p className="fd-status" data-testid="fd-covered">
                {view.headline}
              </p>
            )}
            {view && view.view !== "unchecked" && view.detail && (
              <p className="fd-detail" data-testid="fd-state-detail">
                {view.detail}
              </p>
            )}
            <article className="fd-card" data-testid="fd-product-offer">
              <p className="fd-arrival" data-testid="fd-arrival">
                {originLabel(origin)} · {checkoutShortName(selected.id)} · {salePriceLine(selected)}
              </p>
              {origin === "website" && (
                <p className="fd-detail">
                  <a className="fd-quiet" data-testid="fd-change-product" href="/front-door/choose">
                    Change product
                  </a>
                </p>
              )}
              <h1>{checkoutLabel(selected)}</h1>
              <p className="fd-detail">{describeProduct(selected)}</p>
              <div className="fd-prices">
                {regularPrice(selected) && (
                  <p className="fd-price-regular">{regularPrice(selected)}</p>
                )}
                <p className="fd-price fd-price-sale">{salePriceLine(selected)}</p>
              </div>
              {memberDisclosure(selected) && (
                <p className="fd-disclosure">{memberDisclosure(selected)}</p>
              )}
              {selected.id === "observer" && (
                <div className="fd-draw fd-panel-weeks" data-testid="fd-weeks-card">
                  <button
                    type="button"
                    className="fd-draw-toggle"
                    data-testid="fd-weeks-toggle"
                    aria-expanded={weeksOpen}
                    onClick={() => setWeeksOpen((open) => !open)}
                  >
                    <span>The six weeks</span>
                  </button>
                  {weeksOpen && (
                    <div className="fd-draw-body" data-testid="fd-weeks-body">
                      <ol className="fd-weeks">
                        {WEEKS.map((row) => (
                          <li key={row.week}>
                            <strong>{row.week}</strong>
                            <span>{row.line}</span>
                          </li>
                        ))}
                      </ol>
                      <h2 className="fd-subhead">Short video</h2>
                      <VideoWords offers={offers} speed={speed} />
                    </div>
                  )}
                </div>
              )}
            </article>
            {error && (
              <p className="fd-error" data-testid="fd-error" role="alert">
                {error}
              </p>
            )}
            <section className="fd-draw fd-card" data-testid="fd-account-card">
              <button
                type="button"
                className="fd-draw-toggle"
                data-testid="fd-account"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((open) => !open)}
              >
                <span>Account</span>
                {signedIn && <span className="fd-draw-note">Signed in</span>}
              </button>
              {accountOpen && (
                <div className="fd-draw-body">
                  {signedIn ? (
                    <>
                      <p className="fd-detail" data-testid="fd-signed-in">
                        Signed in as {signedIn.email && signedIn.email !== signedIn.name
                          ? `${signedIn.name} · ${signedIn.email}`
                          : signedIn.name}
                        .
                      </p>
                      {showBelonging && (
                        <div data-testid="fd-youre-in">
                          <p className="fd-detail">
                            You're in. You have a login, you're on the mail list, and the content that
                            comes with an account is open.
                          </p>
                          <p className="fd-detail">
                            <a className="fd-quiet" data-testid="fd-content-link" href="/pathway">
                              Open that content
                            </a>
                          </p>
                          {!purchaseClosed && (
                            <p className="fd-detail">The purchase below is optional.</p>
                          )}
                        </div>
                      )}
                      {passwordNeeded && (
                        <div data-testid="fd-set-password">
                          <p className="fd-detail">Choose a password of at least 10 characters.</p>
                          <div className="fd-float">
                            <input
                              id="fd-new-password"
                              data-testid="fd-new-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder=" "
                              value={newPassword}
                              onChange={(event) => {
                                setNewPassword(event.target.value);
                                setError("");
                              }}
                            />
                            <label htmlFor="fd-new-password">New password</label>
                          </div>
                          <div className="fd-float">
                            <input
                              id="fd-confirm-password"
                              data-testid="fd-confirm-password"
                              type="password"
                              autoComplete="new-password"
                              placeholder=" "
                              value={confirmPassword}
                              onChange={(event) => {
                                setConfirmPassword(event.target.value);
                                setError("");
                              }}
                            />
                            <label htmlFor="fd-confirm-password">Confirm password</label>
                          </div>
                          <button
                            type="button"
                            className="fd-cta"
                            data-testid="fd-save-password"
                            disabled={busy}
                            onClick={saveSessionPassword}
                          >
                            Save password
                          </button>
                        </div>
                      )}
                      {passwordSaved && (
                        <p className="fd-detail" data-testid="fd-password-saved">
                          Your password is set. Use it the next time you sign in.
                        </p>
                      )}
                      {navigatorOrder && !contactOk && (
                        <>
                          <p className="fd-detail">Phone and address are required for Navigator.</p>
                          <ContactFields />
                        </>
                      )}
                      {navigatorOrder && contactOk && (
                        <p className="fd-detail" data-testid="fd-contact-saved">
                          Phone and address are on this order.
                        </p>
                      )}
                    </>
                  ) : !sessionChecked ? (
                    <p className="fd-detail">Checking the session.</p>
                  ) : (
                    <>
                      <div className="fd-mode" role="group" aria-label="Account type">
                        <button
                          type="button"
                          data-testid="fd-account-login"
                          aria-pressed={accountMode === "login"}
                          onClick={() => {
                            setAccountMode("login");
                            setError("");
                          }}
                        >
                          Login
                        </button>
                        <span className="fd-or">or</span>
                        <button
                          type="button"
                          data-testid="fd-account-create"
                          aria-pressed={accountMode === "create"}
                          onClick={() => {
                            setAccountMode("create");
                            setError("");
                          }}
                        >
                          Create Account
                        </button>
                      </div>
                      {existsPrompt && (
                        <button
                          type="button"
                          className="fd-quiet"
                          data-testid="fd-exists-login"
                          onClick={() => {
                            setAccountMode("login");
                            setExistsPrompt(false);
                            setError("");
                          }}
                        >
                          Sign in
                        </button>
                      )}
                      {accountMode === "login" && (
                        <>
                          <div className="fd-float">
                            <input
                              id="fd-username"
                              data-testid="fd-username"
                              type="text"
                              autoComplete="username"
                              placeholder=" "
                              value={username}
                              onChange={(event) => setUsername(event.target.value)}
                            />
                            <label htmlFor="fd-username">Username</label>
                          </div>
                          <div className="fd-float">
                            <input
                              id="fd-password"
                              data-testid="fd-password"
                              type="password"
                              autoComplete="current-password"
                              placeholder=" "
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                            />
                            <label htmlFor="fd-password">Password</label>
                          </div>
                          <button
                            type="button"
                            className="fd-cta"
                            data-testid="fd-account-submit"
                            onClick={signInExisting}
                          >
                            Sign in
                          </button>
                        </>
                      )}
                      {accountMode === "create" && (
                        <>
                          <div className="fd-float">
                            <input
                              id="fd-first-name"
                              data-testid="fd-first-name"
                              type="text"
                              autoComplete="given-name"
                              placeholder=" "
                              value={firstName}
                              onChange={(event) => setFirstName(event.target.value)}
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
                            />
                            <label htmlFor="fd-last-name">Last name</label>
                          </div>
                          <div className="fd-float">
                            <input
                              id="fd-email"
                              data-testid="fd-email"
                              type="email"
                              autoComplete="email"
                              inputMode="email"
                              placeholder=" "
                              value={email}
                              onChange={(event) => {
                                setEmail(event.target.value);
                                setError("");
                              }}
                            />
                            <label htmlFor="fd-email">Email</label>
                          </div>
                          <div className="fd-float">
                            <input
                              id="fd-email-confirm"
                              data-testid="fd-email-confirm"
                              type="email"
                              autoComplete="email"
                              inputMode="email"
                              placeholder=" "
                              value={confirmEmail}
                              onChange={(event) => setConfirmEmail(event.target.value)}
                            />
                            <label htmlFor="fd-email-confirm">Confirm email</label>
                          </div>
                          {navigatorOrder && <ContactFields />}
                          <p className="fd-detail">Creating an account puts you on the mail list.</p>
                          <button
                            type="button"
                            className="fd-cta"
                            data-testid="fd-account-submit"
                            disabled={busy}
                            onClick={() => void join()}
                          >
                            Create account
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
            {!purchaseClosed && (
            <section
              className="fd-draw fd-card"
              data-testid="fd-payment-card"
              data-locked={accountReady ? "false" : "true"}
            >
              <button
                type="button"
                className="fd-draw-toggle"
                data-testid="fd-payment"
                aria-expanded={accountReady && paymentOpen}
                disabled={!accountReady}
                onClick={() => {
                  if (!accountReady) return;
                  setPaymentOpen((open) => !open);
                }}
              >
                <span>Payment</span>
                {sessionChecked && !signedIn && <span className="fd-draw-note">Finish the account first</span>}
                {signedIn && navigatorOrder && !contactOk && (
                  <span className="fd-draw-note">Phone and address</span>
                )}
              </button>
              {paymentOpen && accountReady && !purchaseClosed && (
                <div className="fd-draw-body">
                  <div className="fd-check" data-testid="fd-not-advice">
                    <input
                      id="fd-not-advice-box"
                      type="checkbox"
                      checked={notAdvice}
                      onChange={(event) => {
                        const on = event.target.checked;
                        setNotAdvice(on);
                        if (!on) setPaymentMethod("");
                        void noteAcceptance(on, terms);
                      }}
                    />
                    <span className="fd-check-copy">
                      <label htmlFor="fd-not-advice-box">
                        I agree that FatTail and Coach Ernie, employees, and service providers are
                        not fiduciaries or financial advisors, and none of FatTail&apos;s content
                        constitutes financial advice.
                      </label>
                    </span>
                  </div>
                  <div className="fd-check" data-testid="fd-terms">
                    <input
                      id="fd-terms-box"
                      type="checkbox"
                      checked={terms}
                      onChange={(event) => {
                        const on = event.target.checked;
                        setTerms(on);
                        if (!on) setPaymentMethod("");
                        void noteAcceptance(notAdvice, on);
                      }}
                    />
                    <span className="fd-check-copy">
                      <label htmlFor="fd-terms-box">I have read and agree to the full</label>{" "}
                      <LegalLink href={offers.terms_url} testId="fd-link-terms">
                        Terms and Conditions
                      </LegalLink>
                      <label htmlFor="fd-terms-box">.</label>
                    </span>
                  </div>
                  {payReady && (
                    <div className="fd-pay-methods" role="group" aria-label="Payment method">
                      <button
                        type="button"
                        className="fd-pay"
                        data-testid="fd-pay-card"
                        aria-pressed={paymentMethod === "card"}
                        onClick={() => setPaymentMethod("card")}
                      >
                        Credit Card
                      </button>
                      <button
                        type="button"
                        className="fd-pay"
                        data-testid="fd-pay-paypal"
                        aria-pressed={paymentMethod === "paypal"}
                        onClick={choosePayPal}
                      >
                        PayPal
                      </button>
                    </div>
                  )}
                  {payReady && paymentMethod === "card" && (
                    <div className="fd-cc" data-testid="fd-cc">
                      <div className="fd-float">
                        <input
                          id="fd-cc-name"
                          data-testid="fd-cc-name"
                          type="text"
                          autoComplete="cc-name"
                          placeholder=" "
                          value={cardName}
                          onChange={(event) => setCardName(event.target.value)}
                        />
                        <label htmlFor="fd-cc-name">Name on card</label>
                      </div>
                      <div className="fd-float">
                        <input
                          id="fd-cc-number"
                          data-testid="fd-cc-number"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-number"
                          placeholder=" "
                          value={cardNumber}
                          onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                        />
                        <label htmlFor="fd-cc-number">Card number</label>
                      </div>
                      <div className="fd-cc-row">
                        <div className="fd-float">
                          <input
                            id="fd-cc-exp"
                            data-testid="fd-cc-exp"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            placeholder=" "
                            value={cardExp}
                            onChange={(event) => setCardExp(formatCardExp(event.target.value))}
                          />
                          <label htmlFor="fd-cc-exp">Expiration</label>
                        </div>
                        <div className="fd-float">
                          <input
                            id="fd-cc-cvc"
                            data-testid="fd-cc-cvc"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            placeholder=" "
                            value={cardCvc}
                            onChange={(event) => setCardCvc(formatCardCvc(event.target.value))}
                          />
                          <label htmlFor="fd-cc-cvc">Security code</label>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
            )}
          </div>
        )}
        {entry !== "order" && (
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
            <a data-testid="fd-link-order" href="/front-door/order">
              Order form
            </a>
          </nav>
        )}
        <LegalFooter offers={offers} />
        <button
          type="button"
          className="fd-reset"
          data-testid="fd-reset-demo"
          onClick={() => void resetDemo()}
        >
          Reset demo
        </button>
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
      <a className="fd-cta fd-sales-cta" data-testid="fd-sales-cta" href="/front-door/order?product=observer">
        {observer ? `Continue · ${formatPrice(observer)}` : "Continue to the order form"}
      </a>
    </section>
  );
}

function VideoWords({ offers, speed }: { offers: FrontDoorOffers; speed: SpeedBucket }) {
  const showVideo = speed !== "slow" && offers.vsl_url.startsWith("https://");
  return (
    <>
      {showVideo ? (
        <video
          className="fd-video"
          controls
          preload="none"
          src={offers.vsl_url}
          data-testid="fd-weeks-video"
        />
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
    </>
  );
}

function Watch({ offers, speed }: { offers: FrontDoorOffers; speed: SpeedBucket }) {
  return (
    <section>
      <h1>A short video, then the order form</h1>
      <VideoWords offers={offers} speed={speed} />
      <a className="fd-cta fd-watch-cta" data-testid="fd-watch-cta" href="/front-door/order">
        Continue to the order form
      </a>
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
