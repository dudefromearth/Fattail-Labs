"use client";

export function PayPalReturn() {
  return (
    <button
      type="button"
      className="fd-cta fd-paypal-return"
      data-testid="fd-paypal-return"
      onClick={() => window.close()}
    >
      Return to the order
    </button>
  );
}
