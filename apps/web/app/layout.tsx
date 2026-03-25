import type { Metadata } from "next";
import { Instrument_Sans, Outfit, Signika } from "next/font/google";
import { PostHogProvider } from "@/lib/posthog/provider";
import { QueryProvider } from "@/lib/query-provider";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const signika = Signika({
  subsets: ["latin"],
  variable: "--font-signika",
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Doost AI",
  description: "AI-powered marketing campaigns",
  icons: {
    icon: "/favicon.png",
    apple: "/symbol.png",
  },
  openGraph: {
    title: "Doost AI",
    description: "AI-powered marketing campaigns for Nordic businesses",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sv">
      <body
        className={`${outfit.variable} ${instrumentSans.variable} ${signika.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
