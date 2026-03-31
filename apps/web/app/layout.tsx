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
      </head>
      <body
        className={`${inter.variable} ${marker.variable} font-sans antialiased`}
      >
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
