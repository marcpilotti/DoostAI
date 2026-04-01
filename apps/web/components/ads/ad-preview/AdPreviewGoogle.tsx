"use client";

/**
 * AdPreviewGoogle — Pixel-perfect Google Search ad mockup.
 * No background image — compensates with micro-animations and detail.
 *
 * Layers:
 * 1. White background (Google's actual bg)
 * 2. Search bar chrome
 * 3. Ad badge + URL line
 * 4. Blue headline links
 * 5. Gray description text
 * 6. Sitelink chips (optional)
 */

import { Search } from "lucide-react";

import type { AdData } from "./types";

// ── Google Search Preview ────────────────────────────────────────

export function AdPreviewGoogle({ data }: { data: AdData }) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const displayUrl = data.displayUrlPaths?.length
    ? `${domain} › ${data.displayUrlPaths.join(" › ")}`
    : domain;

  // Split headline into parts (Google RSA: up to 3 headlines separated by |)
  const headlineParts = data.headlines?.length
    ? data.headlines.filter((h) => h.trim())
    : [data.headline];
  const headlineText = headlineParts.join(" | ");

  // Description lines
  const descLines = data.descriptions?.length
    ? data.descriptions.filter((d) => d.trim())
    : [data.primaryText];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-sm">
      {/* Google search bar */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 shadow-sm">
          {/* Google "G" logo */}
          <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="truncate text-[11px] text-gray-600">
            {data.brandName.toLowerCase().replace(/\s+/g, "+")}
          </span>
          <Search className="ml-auto h-3 w-3 shrink-0 text-gray-400" />
        </div>
      </div>

      {/* Search result content */}
      <div className="flex-1 px-4 py-3">
        {/* Ad badge + URL line */}
        <div className="flex items-center gap-1.5">
          {/* Favicon circle */}
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-bold text-white"
            style={{ backgroundColor: data.brandColor }}
          >
            {data.brandName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate text-[11px] text-gray-800">{data.brandName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="truncate text-[10px] text-gray-500">{displayUrl}</span>
            </div>
          </div>
        </div>

        {/* Headline — blue, clickable look */}
        <div className="group mt-1.5">
          <h3 className="text-[13px] font-medium leading-snug text-[#1a0dab] group-hover:underline">
            {headlineText}
            {/* Blinking cursor on hover */}
            <span className="ml-0.5 hidden animate-pulse text-[#1a0dab] group-hover:inline">|</span>
          </h3>
        </div>

        {/* Ad badge */}
        <div className="mt-1 inline-flex items-center rounded border border-gray-300 px-1 py-0.5">
          <span className="text-[8px] font-bold text-gray-500">Sponsrad</span>
        </div>

        {/* Description lines */}
        <div className="mt-1.5 space-y-0.5">
          {descLines.map((desc, i) => (
            <p key={i} className="text-[11px] leading-relaxed text-gray-600">
              {desc}
            </p>
          ))}
        </div>

        {/* Sitelinks (chips) */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["Priser", "Kom igång", "Kontakt", "Om oss"].map((link) => (
            <span
              key={link}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[9px] font-medium text-[#1a0dab] transition-colors hover:bg-[#1a0dab]/5"
            >
              {link}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom — subtle Google footer */}
      <div className="border-t border-gray-100 px-4 py-1.5">
        <div className="text-[8px] text-gray-400">Ungefär 1 240 000 resultat (0,42 sekunder)</div>
      </div>
    </div>
  );
}
