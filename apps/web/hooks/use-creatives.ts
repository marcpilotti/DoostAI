"use client";

import { useMemo } from "react";
import { MOCK_CREATIVES } from "@/lib/mock-data";
import type { Creative } from "@/lib/mock-data";

/**
 * useCreatives — fetches creatives with performance metrics.
 * Currently uses mock data. Replace with Supabase query joining
 * creatives + performance_daily.
 */
export function useCreatives(options?: {
  timeRange?: string;
  sort?: string;
  spendRange?: string;
  page?: number;
  perPage?: number;
}) {
  const perPage = options?.perPage ?? 12;
  const page = options?.page ?? 1;

  const filtered = useMemo(() => {
    let result = [...MOCK_CREATIVES];

    // Spend range filter
    if (options?.spendRange === "0-500") result = result.filter((c) => c.spend <= 500);
    else if (options?.spendRange === "500-2000") result = result.filter((c) => c.spend > 500 && c.spend <= 2000);
    else if (options?.spendRange === "2000+") result = result.filter((c) => c.spend > 2000);

    // Sort
    switch (options?.sort) {
      case "roas_desc": result.sort((a, b) => b.roas - a.roas); break;
      case "roas_asc": result.sort((a, b) => a.roas - b.roas); break;
      case "spend_desc": result.sort((a, b) => b.spend - a.spend); break;
      case "spend_asc": result.sort((a, b) => a.spend - b.spend); break;
      case "ctr_desc": result.sort((a, b) => b.ctr - a.ctr); break;
      case "ctr_asc": result.sort((a, b) => a.ctr - b.ctr); break;
      default: result.sort((a, b) => b.roas - a.roas);
    }

    return result;
  }, [options?.sort, options?.spendRange]);

  // Pagination
  const total = filtered.length;
  const totalPages = Math.ceil(total / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return {
    creatives: paginated,
    total,
    totalPages,
    page,
    isLoading: false,
    error: null,
  };
}
