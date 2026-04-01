"use client";

import { Calendar, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";

import { CHANNELS, TIME_RANGES } from "@/lib/mock-data";

export function ChannelFilter({
  timeRange,
  channel,
  onTimeRangeChange,
  onChannelChange,
}: {
  timeRange: string;
  channel: string;
  onTimeRangeChange: (id: string) => void;
  onChannelChange: (id: string) => void;
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedTime = TIME_RANGES.find((t) => t.id === timeRange);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selectedChannel = CHANNELS.find((c) => c.id === channel);

  return (
    <div className="flex items-center gap-2">
      {/* Time range */}
      <div className="relative">
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[13px] font-medium text-[var(--doost-text)] focus-within:ring-2 focus-within:ring-[var(--doost-bg-active)]" style={{ border: `1px solid var(--doost-border)` }}>
          <Calendar className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <select
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
          >
            {TIME_RANGES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        </div>
      </div>

      {/* Channel filter */}
      <div className="relative">
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[13px] font-medium text-[var(--doost-text)] focus-within:ring-2 focus-within:ring-[var(--doost-bg-active)]" style={{ border: `1px solid var(--doost-border)` }}>
          {/* Platform icon circles */}
          <div className="flex -space-x-1">
            <div className="h-4 w-4 rounded-full bg-[var(--brand-meta)] ring-2 ring-[var(--doost-bg)]" />
            <div className="h-4 w-4 rounded-full bg-[var(--brand-google)] ring-2 ring-[var(--doost-bg)]" />
            <div className="h-4 w-4 rounded-full bg-[var(--brand-linkedin)] ring-2 ring-[var(--doost-bg)]" />
          </div>
          <select
            value={channel}
            onChange={(e) => onChannelChange(e.target.value)}
            className="appearance-none bg-transparent pr-4 outline-none cursor-pointer"
          >
            {CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Analytics link */}
      <Link
        href="/dashboard/analytics"
        className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[13px] font-medium text-[var(--doost-text)] transition-colors hover:bg-[var(--doost-bg-secondary)]"
        style={{ border: `1px solid var(--doost-border)` }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Analytics
      </Link>
    </div>
  );
}
