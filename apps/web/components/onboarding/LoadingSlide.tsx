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

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Pulsing spinner */}
      <motion.div
        animate={prefersReduced ? {} : { scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100"
      >
        <motion.div
          animate={prefersReduced ? {} : { rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 rounded-full border-2 border-indigo-300 border-t-indigo-600"
        />
      </motion.div>

      {/* URL reference */}
      <p className="mb-6 text-sm font-medium text-foreground/70">
        {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </p>

      {/* AI messages stack — max 4 visible */}
      <div className="min-h-[120px]">
        <AIMessageStack messages={messages} />
      </div>

      {/* Progress bar */}
      <div className="mt-6 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground/50">
          {progress}%
        </p>
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
