import type { Metadata } from "next";
import Link from "next/link";
import CoconutIndexCard from "@/components/cards/CoconutIndexCard";
import { getCoconutIndexData } from "@/lib/coconut-index";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Coconut Index · Lanka Monitor",
  description:
    "Colombo retail coconut price from HARTI — one number, one sparkline, shareable.",
  openGraph: {
    title: "Coconut Index · Lanka Monitor",
    description: "The unofficial Sri Lankan grocery pulse — HARTI retail, updated daily.",
    type: "website",
  },
};

export default function CoconutIndexPage() {
  const data = getCoconutIndexData();

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <CoconutIndexCard data={data} standalone />

      <p className="mt-6 text-center text-xs text-muted">
        <Link
          href="/"
          className="underline decoration-panel-edge underline-offset-2 hover:text-ink-soft"
        >
          Back to Lanka Monitor
        </Link>
      </p>
    </main>
  );
}
