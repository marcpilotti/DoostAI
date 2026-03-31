"use client";

import { useState, useEffect } from "react";
import { MOCK_KPIS, MOCK_CHART_DATA } from "@/lib/mock-data";
import type { KPI, ChartDataPoint } from "@/lib/mock-data";

/**
 * useKPIs — fetches KPI data from API (Supabase with mock fallback).
 */
export function useKPIs(options?: { timeRange?: string; channel?: string }) {
  const [kpis, setKpis] = useState<KPI[]>(MOCK_KPIS);
  const [chartData, setChartData] = useState<ChartDataPoint[]>(MOCK_CHART_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [source, setSource] = useState<"mock" | "supabase">("mock");

  useEffect(() => {
    const params = new URLSearchParams();
    if (options?.timeRange) params.set("range", options.timeRange);
    if (options?.channel) params.set("channel", options.channel);

    fetch(`/api/dashboard/kpis?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setKpis(data.kpis);
        setChartData(data.chartData);
        setSource(data.source);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [options?.timeRange, options?.channel]);

  return { kpis, chartData, isLoading, source, error: null };
}
