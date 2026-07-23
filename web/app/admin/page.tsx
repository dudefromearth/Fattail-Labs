import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

// Course builder remains in-place on course pages. This hub links operator tools.
export default function AdminPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <p className="text-zinc-500">
        Course editing is in-place on production pages. Operator tools:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <Link className="underline" href="/admin/ai" data-testid="admin-link-ai">
            Agent workbench
          </Link>{" "}
          — live Grok/Claude agent tasks (browser validation)
        </li>
        <li>
          <Link className="underline" href="/admin/media">
            Media library
          </Link>
        </li>
      </ul>
    </main>
  );
}
