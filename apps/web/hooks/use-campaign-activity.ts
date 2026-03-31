"use client";

import { useState, useEffect } from "react";
import { MOCK_ACTIVITY } from "@/lib/mock-data";
import type { ActivityItem } from "@/lib/mock-data";

/**
 * useCampaignActivity — fetches from API (Supabase with mock fallback).
 */
export function useCampaignActivity(options?: { limit?: number }) {
  const [items, setItems] = useState<ActivityItem[]>(MOCK_ACTIVITY);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/activity")
      .then((r) => r.json())
      .then((data) => setItems(data.items?.slice(0, options?.limit ?? 10) ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [options?.limit]);

  return { items, isLoading, error: null };
}
