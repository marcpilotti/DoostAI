"use client";

import { useMemo } from "react";
import { MOCK_KPIS, MOCK_CHART_DATA } from "@/lib/mock-data";
import type { KPI, ChartDataPoint } from "@/lib/mock-data";

/**
 * useKPIs — fetches KPI data for the dashboard.
 * Currently uses mock data. Replace with Supabase query on performance_daily.
 */
export function useKPIs(options?: { timeRange?: string; channel?: string }) {
  // TODO: Replace with real query
  // const { data } = useQuery({
  //   queryKey: ["kpis", options?.timeRange, options?.channel],
  //   queryFn: () => fetch(`/api/kpis?range=${options?.timeRange}&channel=${options?.channel}`).then(r => r.json()),
  // });

  const kpis = useMemo(() => MOCK_KPIS, []);
  const chartData = useMemo(() => MOCK_CHART_DATA, []);

  return {
    kpis,
    chartData,
    isLoading: false,
    error: null,
  };
}
