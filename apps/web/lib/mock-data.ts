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
  { id: "1", platform: "meta", campaignName: "Holiday Sale 2025", action: "Budget optimized", timestamp: "Just now" },
  { id: "2", platform: "meta", campaignName: "Holiday Sale 2025", action: "Campaign published", statusFrom: "In review", statusTo: "Ready", timestamp: "18 min ago" },
  { id: "3", platform: "google", campaignName: "Black Friday", action: "Budget optimized", timestamp: "2h ago" },
  { id: "4", platform: "meta", campaignName: "Holiday Sale 2025", action: "Campaign ready for review", timestamp: "4h ago" },
];

// ── Creatives ────────────────────────────────────────────────────

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

// ── Campaigns ────────────────────────────────────────────────────

export type Campaign = {
  id: string;
  name: string;
  platform: "meta" | "google" | "linkedin";
  status: "live" | "paused" | "review" | "draft" | "completed";
  dailyBudget: number;
  totalSpend: number;
  roas: number;
  clicks: number;
  impressions: number;
  ctr: number;
  startDate: string;
  endDate?: string;
};

export const MOCK_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Holiday Sale 2025", platform: "meta", status: "live", dailyBudget: 150, totalSpend: 2100, roas: 3.2, clicks: 4521, impressions: 125000, ctr: 3.6, startDate: "2025-11-15" },
  { id: "c2", name: "Black Friday", platform: "google", status: "live", dailyBudget: 300, totalSpend: 4200, roas: 4.8, clicks: 8930, impressions: 310000, ctr: 2.9, startDate: "2025-11-20" },
  { id: "c3", name: "Spring Collection", platform: "meta", status: "review", dailyBudget: 100, totalSpend: 0, roas: 0, clicks: 0, impressions: 0, ctr: 0, startDate: "2026-03-01" },
  { id: "c4", name: "Brand Awareness Q1", platform: "linkedin", status: "completed", dailyBudget: 200, totalSpend: 5600, roas: 2.1, clicks: 3200, impressions: 89000, ctr: 3.6, startDate: "2026-01-01", endDate: "2026-03-31" },
  { id: "c5", name: "Summer Launch", platform: "meta", status: "draft", dailyBudget: 250, totalSpend: 0, roas: 0, clicks: 0, impressions: 0, ctr: 0, startDate: "2026-06-01" },
];

// ── Audiences ────────────────────────────────────────────────────

export type Audience = {
  id: string;
  name: string;
  platform: "meta" | "google" | "linkedin";
  type: "custom" | "lookalike" | "saved" | "interest";
  sizeEstimate: number;
  linkedCampaigns: number;
};

export const MOCK_AUDIENCES: Audience[] = [
  { id: "a1", name: "Website visitors 30d", platform: "meta", type: "custom", sizeEstimate: 12400, linkedCampaigns: 2 },
  { id: "a2", name: "Lookalike — Top customers", platform: "meta", type: "lookalike", sizeEstimate: 850000, linkedCampaigns: 1 },
  { id: "a3", name: "Interest: Skincare", platform: "meta", type: "interest", sizeEstimate: 2100000, linkedCampaigns: 3 },
  { id: "a4", name: "In-market: Beauty", platform: "google", type: "saved", sizeEstimate: 450000, linkedCampaigns: 1 },
  { id: "a5", name: "Decision makers", platform: "linkedin", type: "saved", sizeEstimate: 34000, linkedCampaigns: 1 },
];

// ── Products ─────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  currency: string;
  category: string;
  status: "active" | "draft";
};

export const MOCK_PRODUCTS: Product[] = [
  { id: "p1", name: "Self-Tan Mousse", imageUrl: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=300&h=300&fit=crop", price: 299, currency: "SEK", category: "Tanning", status: "active" },
  { id: "p2", name: "Face Serum", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop", price: 399, currency: "SEK", category: "Skincare", status: "active" },
  { id: "p3", name: "Body Lotion", imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=300&h=300&fit=crop", price: 249, currency: "SEK", category: "Body", status: "active" },
  { id: "p4", name: "Hair Mask", imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=300&h=300&fit=crop", price: 199, currency: "SEK", category: "Hair", status: "draft" },
];

// ── Integrations ─────────────────────────────────────────────────

export type Integration = {
  id: string;
  platform: "meta" | "google" | "linkedin";
  label: string;
  status: "connected" | "disconnected" | "error";
  accountName?: string;
  lastSync?: string;
};

export const MOCK_INTEGRATIONS: Integration[] = [
  { id: "i1", platform: "meta", label: "Meta Business", status: "connected", accountName: "IDA WARG Beauty", lastSync: "5 min ago" },
  { id: "i2", platform: "google", label: "Google Ads", status: "connected", accountName: "123-456-7890", lastSync: "1h ago" },
  { id: "i3", platform: "linkedin", label: "LinkedIn Ads", status: "disconnected" },
];

// ── Credit transactions ──────────────────────────────────────────

export type CreditTransaction = {
  id: string;
  type: "monthly_refill" | "ai_chat" | "image_generation" | "campaign_launch";
  amount: number;
  balanceAfter: number;
  description: string;
  model?: string;
  createdAt: string;
};

export const MOCK_TRANSACTIONS: CreditTransaction[] = [
  { id: "t1", type: "image_generation", amount: -4, balanceAfter: 2496, description: "FLUX Pro — Product photo", model: "flux_pro", createdAt: "2 min ago" },
  { id: "t2", type: "ai_chat", amount: -2, balanceAfter: 2500, description: "AI chat (Sonnet)", model: "claude-sonnet-4-6", createdAt: "15 min ago" },
  { id: "t3", type: "campaign_launch", amount: -10, balanceAfter: 2502, description: "Holiday Sale 2025 — launch", createdAt: "2h ago" },
  { id: "t4", type: "monthly_refill", amount: 2500, balanceAfter: 2512, description: "Monthly refill — Growth plan", createdAt: "Mar 1" },
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
