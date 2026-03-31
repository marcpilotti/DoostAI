"use client";

import { useMemo } from "react";
import { MOCK_ACTIVITY } from "@/lib/mock-data";
import type { ActivityItem } from "@/lib/mock-data";

/**
 * useCampaignActivity — fetches recent campaign activity.
 * Currently uses mock data. Replace with Supabase query on activity_log.
 */
export function useCampaignActivity(options?: { limit?: number }) {
  const limit = options?.limit ?? 10;

  const items = useMemo(() => MOCK_ACTIVITY.slice(0, limit), [limit]);

  return {
    items,
    isLoading: false,
    error: null,
  };
}
