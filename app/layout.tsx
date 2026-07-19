import type { Metadata } from "next";
import {
  Fraunces,
  Noto_Sans_Sinhala,
  Noto_Sans_Tamil,
  Source_Sans_3,
} from "next/font/google";
import AnalyticsBeacon from "@/components/AnalyticsBeacon";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-si",
  display: "swap",
});

const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ta",
  display: "swap",
});

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://lanka-monitor.vercel.app");

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: "Lanka Monitor",
  description:
    "Real-time situational awareness for Sri Lanka — money, weather, power, health, news.",
  openGraph: {
    title: "Lanka Monitor",
    description:
      "The real-time daily-life dashboard for Sri Lanka — money, weather, power, health, news, cricket.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${sinhala.variable} ${tamil.variable}`}
    >
      <body className="min-h-screen bg-transparent text-ink antialiased">
        <AnalyticsBeacon />
        {children}
      </body>
    </html>
  );
}
