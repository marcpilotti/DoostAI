"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (!key || key.startsWith("phc_...")) return;

    posthog.init(key, {
      api_host: host ?? "https://eu.posthog.com",
      capture_pageview: true,
      capture_pageleave: true,
      persistence: "localStorage",
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

// Track custom events
export function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
}

export function identifyUser(
  userId: string,
  properties?: Record<string, unknown>,
) {
  if (typeof window !== "undefined") {
    posthog.identify(userId, properties);
  }
}
