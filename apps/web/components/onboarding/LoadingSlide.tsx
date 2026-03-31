"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessageStack } from "./AIMessage";
import type { BrandProfile } from "./OnboardingShell";

/**
 * LoadingSlide — Slide 2. Full viewport. Centered spinner + sequential AI messages.
 *
 * Connects to the brand analysis SSE endpoint. Each server event pushes
 * a new AI message. When "complete" fires → calls onComplete with profile data.
 *
 * Fallback: if SSE fails, uses timed messages + POST to /api/brand/analyze.
 */
export function LoadingSlide({
  url,
  onComplete,
}: {
  url: string;
  onComplete: (profile: BrandProfile) => void;
}) {
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const prefersReduced = useReducedMotion();

  const addMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, text]);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      const domain = url
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "");
      addMessage(`Hämtar ${domain}...`);
      setProgress(10);

      try {
        // Try SSE stream first
        const res = await fetch("/api/brand/analyze/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok || !res.body) {
          throw new Error("SSE not available");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done || cancelled) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.message && !cancelled) {
                addMessage(data.message);
              }
              if (data.progress && !cancelled) {
                setProgress(data.progress);
              }
              if (data.event === "complete" && data.profile && !cancelled) {
                setProgress(100);
                addMessage("Klar! Här är din profil");
                // Short pause before transitioning
                await sleep(600);
                onComplete(data.profile as BrandProfile);
                return;
              }
            } catch {
              // Skip malformed SSE lines
            }
          }
        }
      } catch {
        // Fallback: direct POST with timed messages
        if (cancelled) return;

        const timers = [
          setTimeout(() => { if (!cancelled) { addMessage("Analyserar ert varumärke..."); setProgress(30); } }, 2000),
          setTimeout(() => { if (!cancelled) { addMessage("Extraherar färger och typsnitt..."); setProgress(50); } }, 5000),
          setTimeout(() => { if (!cancelled) { addMessage("Bygger din varumärkesprofil..."); setProgress(70); } }, 8000),
        ];

        try {
          const res = await fetch("/api/brand/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });

          timers.forEach(clearTimeout);

          if (!res.ok) throw new Error("Analysis failed");
          const data = await res.json();

          if (!cancelled && data.profile) {
            setProgress(100);
            addMessage("Klar! Här är din profil");
            await sleep(600);
            onComplete(data.profile as BrandProfile);
          }
        } catch {
          timers.forEach(clearTimeout);
          if (!cancelled) {
            addMessage("Något gick fel — försök igen.");
          }
        }
      }
    }

    analyze();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Animated orb — layered rings + spinning core */}
      <div className="relative mb-8">
        {/* Outer glow ring */}
        <motion.div
          animate={prefersReduced ? {} : { scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -inset-4 rounded-full bg-gradient-to-br from-indigo-400/20 via-purple-400/10 to-violet-400/20 blur-xl"
        />
        {/* Middle pulse ring */}
        <motion.div
          animate={prefersReduced ? {} : { scale: [1, 1.06, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_8px_32px_rgba(99,102,241,0.12)]"
        >
          {/* Spinning arc */}
          <motion.div
            animate={prefersReduced ? {} : { rotate: 360 }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
            className="h-10 w-10 rounded-full border-[2.5px] border-indigo-200/60 border-t-indigo-500"
          />
          {/* Center dot */}
          <motion.div
            animate={prefersReduced ? {} : { scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute h-2.5 w-2.5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"
          />
        </motion.div>
      </div>

      {/* Domain with favicon */}
      <div className="mb-6 flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="h-5 w-5 rounded-sm"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <p className="text-sm font-semibold tracking-tight text-foreground/80">
          {domain}
        </p>
      </div>

      {/* AI messages stack — max 4 visible */}
      <div className="min-h-[120px]">
        <AIMessageStack messages={messages} />
      </div>

      {/* Progress bar — thicker, with glow */}
      <div className="mt-8 w-full max-w-xs">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
          {/* Shimmer overlay on the filled part */}
          <motion.div
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={prefersReduced ? {} : { x: ["-100%", "400%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          />
        </div>
        <div className="mt-2 flex items-center justify-center gap-1.5">
          <motion.div
            animate={prefersReduced ? {} : { opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="h-1 w-1 rounded-full bg-indigo-400"
          />
          <p className="text-[11px] font-medium text-muted-foreground/40">
            {progress}%
          </p>
        </div>
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
