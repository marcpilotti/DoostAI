"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import type { BrandProfile } from "./OnboardingShell";

/**
 * LoadingSlide — #2 live color extraction, #3 AI thinking indicators, #4 auto-advance.
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
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [thinkingPhase, setThinkingPhase] = useState(0);

  const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const addMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, text]);
  }, []);

  // #3 AI thinking phases — rotate through intelligent-sounding sub-tasks
  const thinkingTexts = [
    "Läser er hemsida...",
    "Identifierar varumärkesröst...",
    "Analyserar visuell identitet...",
    "Kartlägger målgrupp...",
    "Bygger varumärkesprofil...",
  ];

  useEffect(() => {
    if (progress >= 100 || progress < 30) return;
    const interval = setInterval(() => {
      setThinkingPhase((p) => (p + 1) % thinkingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      addMessage(`Hämtar ${domain}...`);
      setProgress(10);

      try {
        const res = await fetch("/api/brand/analyze/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!res.ok || !res.body) throw new Error("SSE not available");

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
              if (data.message && !cancelled) addMessage(data.message);
              if (data.progress && !cancelled) setProgress(data.progress);

              // #2 Extract colors from profile as they arrive
              if (data.profile?.colors && !cancelled) {
                const c = data.profile.colors;
                const found = [c.primary, c.secondary, c.accent].filter(Boolean);
                setExtractedColors(found);
              }

              // #4 Auto-advance — no button needed
              if (data.event === "complete" && data.profile && !cancelled) {
                setProgress(100);
                // Extract colors for the reveal
                if (data.profile.colors) {
                  const c = data.profile.colors;
                  setExtractedColors([c.primary, c.secondary, c.accent].filter(Boolean));
                }
                addMessage("Klar!");
                // Brief pause then auto-advance
                await new Promise((r) => setTimeout(r, 800));
                onComplete(data.profile as BrandProfile);
                return;
              }
            } catch { /* skip */ }
          }
        }
      } catch {
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
          if (!res.ok) throw new Error("fail");
          const data = await res.json();
          if (!cancelled && data.profile) {
            setProgress(100);
            addMessage("Klar!");
            await new Promise((r) => setTimeout(r, 800));
            onComplete(data.profile as BrandProfile);
          }
        } catch {
          timers.forEach(clearTimeout);
          if (!cancelled) addMessage("Något gick fel — försök igen.");
        }
      }
    }

    analyze();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const latestMessage = messages[messages.length - 1] ?? "";

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Spinner */}
      <div className="mb-6 h-10 w-10 animate-spin rounded-full border-[3px] border-muted-foreground/10 border-t-foreground/60" />

      {/* Domain */}
      <p className="mb-4 text-[15px] font-semibold tracking-tight text-foreground">{domain}</p>

      {/* #2 Live color dots — appear as AI extracts them */}
      <AnimatePresence>
        {extractedColors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 flex items-center gap-2"
          >
            {extractedColors.map((color, i) => (
              <motion.div
                key={color}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15 }}
                className="h-5 w-5 rounded-full ring-2 ring-white"
                style={{ backgroundColor: color }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* #3 Latest message with animated thinking sub-text */}
      <div className="min-h-[60px] text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={latestMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            className="text-[13px] text-muted-foreground"
          >
            {latestMessage}
          </motion.p>
        </AnimatePresence>

        {/* Thinking sub-text — rotates through AI phases */}
        {progress >= 30 && progress < 100 && (
          <AnimatePresence mode="wait">
            <motion.p
              key={thinkingPhase}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-1 text-[11px] text-muted-foreground"
            >
              {thinkingTexts[thinkingPhase]}
            </motion.p>
          </AnimatePresence>
        )}
      </div>

      {/* Progress */}
      <div className="mt-6 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted-foreground/10">
          <motion.div
            className="h-full rounded-full bg-foreground/60"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
