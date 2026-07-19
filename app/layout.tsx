import type { Metadata } from "next";
import { IBM_Plex_Sans, Noto_Sans_Sinhala, Noto_Sans_Tamil } from "next/font/google";
import "./globals.css";

const body = IBM_Plex_Sans({
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

export const metadata: Metadata = {
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
    <html lang="en" className={`${body.variable} ${sinhala.variable} ${tamil.variable}`}>
      <body className="min-h-screen bg-transparent text-zinc-100 antialiased">
        {children}
      </body>
    </html>
  );
}
