"use client";

import { useMemo } from "react";
import { MOCK_CHART_DATA } from "@/lib/mock-data";
import type { ChartDataPoint } from "@/lib/mock-data";

/**
 * useROASChart — fetches chart data for selected metric.
 * Currently returns mock data. Replace with Supabase aggregation
 * on performance_daily grouped by month.
 */
export function useROASChart(options?: {
  metric?: string;
  timeRange?: string;
  channel?: string;
}) {
  // TODO: Fetch real data based on metric (clicks/views/roas/spend/revenue)
  const data = useMemo(() => MOCK_CHART_DATA, []);

  const metricSuffix = useMemo(() => {
    switch (options?.metric) {
      case "clicks": return "";
      case "views": return "";
      case "roas": return "x";
      case "spend": return "$";
      case "revenue": return "$";
      default: return "x";
    }
  }, [options?.metric]);

  return {
    data,
    metricSuffix,
    isLoading: false,
    error: null,
  };
}
