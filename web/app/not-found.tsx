import Link from "next/link";
import AdminDraftRedirect from "@/components/edit/AdminDraftRedirect";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        This page doesn&apos;t exist — or isn&apos;t published yet.
      </p>
      <AdminDraftRedirect />
      <Link
        href="/courses"
        className="mt-8 rounded-full bg-emerald-500 px-6 py-2.5 font-medium text-white transition-colors hover:bg-emerald-600"
      >
        Browse the courses
      </Link>
    </main>
  );
}
