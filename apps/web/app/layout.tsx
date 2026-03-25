import type { Metadata } from "next";
import { DM_Sans, Instrument_Sans, Outfit, Permanent_Marker, Space_Grotesk } from "next/font/google";
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

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["700", "800"],
  display: "swap",
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-marker",
  weight: ["400"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
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
        className={`${outfit.variable} ${instrumentSans.variable} ${dmSans.variable} ${marker.variable} ${spaceGrotesk.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
