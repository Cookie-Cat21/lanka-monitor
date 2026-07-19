import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lanka Monitor",
  description:
    "Real-time situational awareness for Sri Lanka — money, weather, power, health, news.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-zinc-100">{children}</body>
    </html>
  );
}
