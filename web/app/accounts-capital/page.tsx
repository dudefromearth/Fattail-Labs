import type { Metadata } from "next";
import AccountsCapitalApp from "@/components/capital/AccountsCapitalApp";

export const metadata: Metadata = {
  title: "Accounts & Capital",
  robots: { index: false, follow: false },
};

export default function AccountsCapitalPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        Accounts &amp; Capital
      </h1>
      <p className="mt-2 text-[var(--color-label-secondary)]">
        Your trade books, cash movements, and master drawdown tolerance. Money
        is campaign-blind — Practice charters are optional direction, not a
        second bank account.
      </p>
      <div className="mt-8">
        <AccountsCapitalApp />
      </div>
    </main>
  );
}
