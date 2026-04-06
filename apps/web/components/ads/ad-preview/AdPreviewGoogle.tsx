"use client";

/**
 * AdPreviewGoogle — Pixel-perfect Google Search ad (SERP replica).
 *
 * Style-isolated: uses Arial + Google's own colors, ignoring project theme.
 * No background image — compensates with typing animation and stagger reveals.
 *
 * Layout:
 * 1. Search bar with typing animation
 * 2. "Sponsrad" badge (pulse on mount)
 * 3. Favicon + URL row
 * 4. Blue headline (#1a0dab, normal weight)
 * 5. Grey description
 * 6. Sitelink chips (2×2 grid)
 * 7. Separator + organic results (0.6 opacity)
 */

import { Search } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { transitions } from "@/lib/motion";

import type { AdData } from "./types";

// ── Google Search Preview ────────────────────────────────────────

export function AdPreviewGoogle({ data }: { data: AdData }) {
  const domain = data.brandUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const displayUrl = data.displayUrlPaths?.length
    ? `https://www.${domain}/${data.displayUrlPaths.join("/")}`
    : `https://www.${domain}`;

  const headlineParts = data.headlines?.length
    ? data.headlines.filter((h) => h.trim())
    : [data.headline];
  const headlineText = headlineParts.join(" | ");

  const descLines = data.descriptions?.length
    ? data.descriptions.filter((d) => d.trim())
    : [data.primaryText];
  const descText = descLines.join(" ");

  // Typing animation
  const searchQuery = data.brandName.toLowerCase().replace(/\s+/g, " ");
  const [typedChars, setTypedChars] = useState(0);
  const typingDone = typedChars >= searchQuery.length;
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTypedChars((prev) => {
        if (prev >= searchQuery.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, 40);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [searchQuery]);

  // Sitelinks (hardcoded Swedish)
  const sitelinks = [
    { title: "Priser", desc: "Se våra paket och priser" },
    { title: "Kom igång", desc: "Starta enkelt på 5 minuter" },
    { title: "Kontakt", desc: "Ring eller mejla oss direkt" },
    { title: "Om oss", desc: "Lär känna företaget bakom" },
  ];

  return (
    <div
      className="w-full max-w-[600px] overflow-hidden rounded-xl shadow-sm"
      style={{ fontFamily: "Arial, sans-serif", color: "#202124", backgroundColor: "#FFFFFF" }}
    >
      {/* Search bar */}
      <div style={{ padding: "16px 20px 12px" }}>
        <div
          className="flex items-center gap-3 transition-shadow duration-200 hover:shadow-[0_1px_6px_rgba(32,33,36,0.28)]"
          style={{
            borderRadius: 24,
            border: "1px solid #dfe1e5",
            padding: "8px 16px",
            backgroundColor: "#FFFFFF",
          }}
        >
          {/* Google G logo */}
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="min-w-0 flex-1 truncate" style={{ fontSize: 16, color: "#202124" }}>
            {searchQuery.slice(0, typedChars)}
            {!typingDone && <span className="animate-pulse" style={{ color: "#202124" }}>|</span>}
          </span>
          <Search className="h-5 w-5 shrink-0" style={{ color: "#4285F4" }} />
        </div>
      </div>

      {/* Tabs bar */}
      <div className="flex gap-4 border-b" style={{ borderColor: "#ebebeb", padding: "0 20px" }}>
        <span style={{ fontSize: 13, color: "#1a73e8", fontWeight: 500, borderBottom: "3px solid #1a73e8", paddingBottom: 8 }}>Alla</span>
        <span style={{ fontSize: 13, color: "#70757a", paddingBottom: 8 }}>Bilder</span>
        <span style={{ fontSize: 13, color: "#70757a", paddingBottom: 8 }}>Kartor</span>
        <span style={{ fontSize: 13, color: "#70757a", paddingBottom: 8 }}>Nyheter</span>
      </div>

      {/* Results count */}
      <div style={{ padding: "8px 20px 0", fontSize: 12, color: "#70757a" }}>
        Ungefär 1 240 000 resultat (0,42 sekunder)
      </div>

      {/* ── Sponsored ad result ─────────────────────── */}
      <motion.div
        style={{ padding: "12px 20px 16px" }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitions.spring, delay: 0.1 }}
      >
        {/* "Sponsrad" badge */}
        <motion.span
          style={{ fontSize: 12, fontWeight: 700, color: "#202124" }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Sponsrad
        </motion.span>

        {/* Favicon + URL */}
        <div className="mt-2 flex items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              border: "1px solid #dadce0",
              backgroundColor: data.brandColor,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>
              {data.brandName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#202124" }} className="truncate">
              {data.brandName}
            </div>
            <div style={{ fontSize: 12, color: "#4d5156" }} className="truncate">
              {displayUrl}
            </div>
          </div>
        </div>

        {/* Blue headline */}
        <motion.div
          className="mt-1.5 cursor-pointer hover:underline"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.spring, delay: 0.2 }}
        >
          <h3 style={{ fontSize: 20, fontWeight: 400, color: "#1a0dab", lineHeight: 1.3 }}>
            {headlineText}
          </h3>
        </motion.div>

        {/* Description */}
        <motion.div
          className="mt-1"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.spring, delay: 0.25 }}
        >
          <p className="line-clamp-2" style={{ fontSize: 14, lineHeight: 1.58, color: "#4d5156" }}>
            {descText}
          </p>
        </motion.div>

        {/* Sitelink chips — 2×2 grid */}
        <motion.div
          className="mt-3 grid grid-cols-2 gap-2"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitions.spring, delay: 0.3 }}
        >
          {sitelinks.map((link) => (
            <div
              key={link.title}
              className="cursor-pointer rounded-lg transition-colors hover:bg-[#f8f9fa]"
              style={{ border: "1px solid #dadce0", padding: "10px 12px" }}
            >
              <div style={{ fontSize: 14, color: "#1a0dab" }}>{link.title}</div>
              <div className="mt-0.5 truncate" style={{ fontSize: 12, color: "#4d5156" }}>
                {link.desc}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Separator ─────────────────────────────── */}
      <div style={{ margin: "0 20px", borderTop: "1px solid #ebebeb" }} />

      {/* ── Organic result 1 (faded) ──────────────── */}
      <div style={{ padding: "14px 20px", opacity: 0.55 }}>
        <div className="flex items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 28, height: 28, border: "1px solid #dadce0", backgroundColor: "#70757a" }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>W</span>
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#202124" }}>Wikipedia</div>
            <div style={{ fontSize: 12, color: "#4d5156" }}>https://sv.wikipedia.org</div>
          </div>
        </div>
        <h3 className="mt-1" style={{ fontSize: 20, fontWeight: 400, color: "#1a0dab", lineHeight: 1.3 }}>
          {data.brandName} – Wikipedia
        </h3>
        <p className="mt-0.5 line-clamp-2" style={{ fontSize: 14, lineHeight: 1.58, color: "#4d5156" }}>
          {data.brandName} är ett företag som erbjuder produkter och tjänster inom sin bransch. Läs mer om företagets historia och utveckling...
        </p>
      </div>

      {/* ── Organic result 2 (more faded) ─────────── */}
      <div style={{ padding: "0 20px 16px", opacity: 0.4 }}>
        <div className="flex items-center gap-2">
          <div
            className="flex shrink-0 items-center justify-center rounded-full"
            style={{ width: 28, height: 28, border: "1px solid #dadce0", backgroundColor: "#34A853" }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF" }}>R</span>
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 14, fontWeight: 700, color: "#202124" }}>Recensioner.se</div>
            <div style={{ fontSize: 12, color: "#4d5156" }}>https://www.recensioner.se</div>
          </div>
        </div>
        <h3 className="mt-1" style={{ fontSize: 20, fontWeight: 400, color: "#1a0dab", lineHeight: 1.3 }}>
          {data.brandName} omdömen och betyg 2025
        </h3>
        <p className="mt-0.5 line-clamp-1" style={{ fontSize: 14, lineHeight: 1.58, color: "#4d5156" }}>
          Läs vad andra kunder tycker om {data.brandName}. Genomsnittligt betyg: 4,3 av 5 baserat på 127 omdömen.
        </p>
      </div>
    </div>
  );
}
