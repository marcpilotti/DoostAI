"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";

import type { BrandProfile } from "./OnboardingShell";

const TIMEOUT_MS = 60_000; // 60 seconds

export function LoadingSlide({
  url,
  onComplete,
  onError,
}: {
  url: string;
  onComplete: (profile: BrandProfile) => void;
  onError?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [thinkingPhase, setThinkingPhase] = useState(0);
  const [failed, setFailed] = useState(false);
  const [failReason, setFailReason] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const attemptRef = useRef(0);

  const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const addMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, text]);
  }, []);

  const thinkingTexts = [
    "Läser er hemsida...",
    "Identifierar varumärkesröst...",
    "Analyserar visuell identitet...",
    "Kartlägger målgrupp...",
    "Bygger varumärkesprofil...",
  ];

  useEffect(() => {
    if (progress >= 100 || progress < 30 || failed) return;
    const interval = setInterval(() => {
      setThinkingPhase((p) => (p + 1) % thinkingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, failed]);

  // #24 Micro-steps: while waiting, nudge progress by 2-3% every 3 seconds
  useEffect(() => {
    if (progress >= 100 || failed) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95 || p >= 100) return p;
        const bump = 2 + Math.random();
        return Math.min(p + bump, 95);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [progress >= 100, failed]); // eslint-disable-line react-hooks/exhaustive-deps

  const analyze = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    attemptRef.current++;

    setFailed(false);
    setFailReason("");
    setMessages([]);
    setProgress(0);
    setExtractedColors([]);
    addMessage(`Hämtar ${domain}...`);
    setProgress(10);

    // Timeout timer
    const timeoutId = setTimeout(() => {
      controller.abort();
      setFailed(true);
      setFailReason("Analysen tog för lång tid. Prova en annan URL eller försök igen.");
    }, TIMEOUT_MS);

    try {
      const res = await fetch("/api/brand/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        clearTimeout(timeoutId);
        setFailed(true);
        setFailReason("Kunde inte analysera hemsidan. Kontrollera URL:en och försök igen.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.message) addMessage(data.message);
            if (data.progress) setProgress(data.progress);

            if (data.profile?.colors) {
              const c = data.profile.colors;
              setExtractedColors([c.primary, c.secondary, c.accent].filter(Boolean));
            }

            if (data.event === "error") {
              clearTimeout(timeoutId);
              setFailed(true);
              setFailReason(data.message ?? "Kontrollera att adressen st\u00e4mmer och att hemsidan \u00e4r tillg\u00e4nglig, och f\u00f6rs\u00f6k igen.");
              return;
            }

            if (data.event === "complete" && data.profile) {
              clearTimeout(timeoutId);
              setProgress(100);
              if (data.profile.colors) {
                setExtractedColors([data.profile.colors.primary, data.profile.colors.secondary, data.profile.colors.accent].filter(Boolean));
              }
              addMessage("Klar!");
              await new Promise((r) => setTimeout(r, 800));
              onComplete(data.profile as BrandProfile);
              return;
            }
          } catch { /* skip malformed */ }
        }
      }

      clearTimeout(timeoutId);
      // Stream ended without complete event
      if (!controller.signal.aborted) {
        setFailed(true);
        setFailReason("Analysen avbröts oväntat. Försök igen.");
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if ((err as Error).name === "AbortError") return;
      setFailed(true);
      setFailReason("Nätverksfel. Kontrollera din anslutning och försök igen.");
    }
  }, [url, domain, addMessage, onComplete]);

  // Start analysis on mount
  useEffect(() => {
    analyze();
    return () => abortRef.current?.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const latestMessage = messages[messages.length - 1] ?? "";

  // Error state
  if (failed) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6" role="alert">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted-foreground/5">
          <RefreshCw className="h-5 w-5 text-muted-foreground/40" />
        </div>
        <h3 className="mb-1 text-[15px] font-semibold text-foreground">{`Vi kunde inte analysera ${domain}`}</h3>
        <p className="mb-5 max-w-xs text-center text-[13px] text-muted-foreground/50">
          {failReason || "Kontrollera att adressen st\u00e4mmer och att hemsidan \u00e4r tillg\u00e4nglig, och f\u00f6rs\u00f6k igen."}
        </p>
        <div className="flex items-center gap-3">
          {onError && (
            <button onClick={onError} className="flex items-center gap-1.5 text-[12px] text-muted-foreground/40 hover:text-muted-foreground">
              <ArrowLeft className="h-3 w-3" /> Byt URL
            </button>
          )}
          <button
            onClick={analyze}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13px] font-semibold text-white hover:opacity-90 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="mb-6 h-10 w-10 animate-spin motion-reduce:animate-none rounded-full border-[3px] border-muted-foreground/10 border-t-foreground/60" />
      <p className="mb-4 text-[15px] font-semibold tracking-tight text-foreground">{domain}</p>

      <AnimatePresence>
        {extractedColors.length > 0 && (
          <motion.div initial={prefersReduced ? false : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 flex items-center gap-2">
            {extractedColors.map((color, i) => (
              <motion.div key={color} initial={prefersReduced ? false : { scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.15 }} className="h-5 w-5 rounded-full ring-2 ring-white" style={{ backgroundColor: color }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-[60px] text-center" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.p key={latestMessage} initial={prefersReduced ? false : { opacity: 0, y: 4 }} animate={{ opacity: 0.6, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }} className="text-[13px] text-muted-foreground">
            {latestMessage}
          </motion.p>
        </AnimatePresence>
        {progress >= 30 && progress < 100 && (
          <AnimatePresence mode="wait">
            <motion.p key={thinkingPhase} initial={prefersReduced ? false : { opacity: 0 }} animate={{ opacity: 0.3 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="mt-1 text-[11px] text-muted-foreground">
              {thinkingTexts[thinkingPhase]}
            </motion.p>
          </AnimatePresence>
        )}
      </div>

      <div className="mt-6 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted-foreground/10">
          <motion.div className="h-full rounded-full bg-foreground/60" animate={{ width: `${progress}%` }} transition={{ duration: 1.5, ease: "easeOut" }} />
        </div>
      </div>
    </div>
  );
}
