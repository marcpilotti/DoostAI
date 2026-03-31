/**
 * Mock data for dashboard development.
 * Replace with real Supabase queries in production.
 */

// ── KPIs ─────────────────────────────────────────────────────────

export type KPI = {
  id: string;
  label: string;
  value: number;
  change: number;
  prefix?: string;
  suffix?: string;
  format?: "number" | "currency" | "multiplier";
};

export const MOCK_KPIS: KPI[] = [
  { id: "clicks", label: "Clicks", value: 72853, change: 16, format: "number" },
  { id: "views", label: "Views", value: 2120759, change: 16, format: "number" },
  { id: "roas", label: "ROAS", value: 12.5, change: 16, suffix: "x", format: "multiplier" },
  { id: "spend", label: "Ad Spend", value: 5904, change: 32, prefix: "$", format: "currency" },
  { id: "revenue", label: "Gross revenue", value: 70833.32, change: 32, prefix: "$", format: "currency" },
];

// ── Chart data (6 months) ────────────────────────────────────────

export type ChartDataPoint = {
  month: string;
  current: number;
  previous: number;
};

export const MOCK_CHART_DATA: ChartDataPoint[] = [
  { month: "Jan", current: 4.2, previous: 3.1 },
  { month: "Feb", current: 5.8, previous: 4.5 },
  { month: "Mar", current: 7.8, previous: 6.1 },
  { month: "Apr", current: 9.2, previous: 7.3 },
  { month: "May", current: 11.1, previous: 8.8 },
  { month: "Jun", current: 12.5, previous: 9.5 },
];

// ── Activity feed ────────────────────────────────────────────────

export type ActivityItem = {
  id: string;
  platform: "meta" | "google" | "linkedin";
  campaignName: string;
  action: string;
  statusFrom?: string;
  statusTo?: string;
  timestamp: string;
};

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    platform: "meta",
    campaignName: "Holiday Sale 2025",
    action: "Budget optimized",
    timestamp: "Just now",
  },
  {
    id: "2",
    platform: "meta",
    campaignName: "Holiday Sale 2025",
    action: "Campaign published",
    statusFrom: "In review",
    statusTo: "Ready",
    timestamp: "18 min ago",
  },
  {
    id: "3",
    platform: "google",
    campaignName: "Black Friday",
    action: "Budget optimized",
    timestamp: "2h ago",
  },
  {
    id: "4",
    platform: "meta",
    campaignName: "Holiday Sale 2025",
    action: "Campaign ready for review",
    timestamp: "4h ago",
  },
];

// ── Creatives (for Phase 3) ──────────────────────────────────────

export type Creative = {
  id: string;
  name: string;
  imageUrl: string;
  roas: number;
  spend: number;
  ctr: number;
};

export const MOCK_CREATIVES: Creative[] = [
  { id: "1", name: "Weekend Gold", imageUrl: "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=400&fit=crop", roas: 3.2, spend: 2018, ctr: 1.8 },
  { id: "2", name: "Weekend Ritual", imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop", roas: 5.2, spend: 972, ctr: 2.2 },
  { id: "3", name: "Weekend Still Life", imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400&h=400&fit=crop", roas: 3.2, spend: 117, ctr: 1.8 },
  { id: "4", name: "Seasonal Indulgence", imageUrl: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop", roas: 2.8, spend: 1574, ctr: 1.5 },
  { id: "5", name: "Curated Essentials", imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop", roas: 4.9, spend: 192, ctr: 2.5 },
  { id: "6", name: "Curated Selection", imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400&h=400&fit=crop", roas: 3.0, spend: 720, ctr: 1.7 },
];

// ── Channels ─────────────────────────────────────────────────────

export const CHANNELS = [
  { id: "all", label: "All channels" },
  { id: "meta", label: "Meta" },
  { id: "google", label: "Google" },
  { id: "linkedin", label: "LinkedIn" },
];

export const TIME_RANGES = [
  { id: "7d", label: "Past week" },
  { id: "30d", label: "Past month" },
  { id: "6m", label: "Past 6 months" },
  { id: "1y", label: "Past year" },
];

// ── Helpers ──────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return n.toLocaleString("en-US");
  return n.toString();
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: n % 1 !== 0 ? 2 : 0 });
}
