import type { Metadata } from "next";
import { Inter, Permanent_Marker } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { CommandPalette } from "@/components/command-palette";
import { PostHogProvider } from "@/lib/posthog/provider";
import { QueryProvider } from "@/lib/query-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const marker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-marker",
  weight: ["400"],
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
      <head>
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.variable} ${marker.variable} font-sans antialiased`}
      >
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-[var(--doost-bg)] focus:px-4 focus:py-2 focus:text-[var(--doost-text)] focus:shadow-lg focus:ring-2 focus:ring-[var(--doost-bg-active)]">
          Hoppa till innehåll
        </a>
        <ClerkProvider>
          <QueryProvider>
            <PostHogProvider>
              {children}
              <CommandPalette />
            </PostHogProvider>
          </QueryProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
