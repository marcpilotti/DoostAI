"use client";

import { useState, useEffect, useCallback } from "react";

import { AIMessageStack } from "./AIMessage";
import type { BrandProfile } from "./OnboardingShell";

export function LoadingSlide({
  url,
  onComplete,
}: {
  url: string;
  onComplete: (profile: BrandProfile) => void;
}) {
  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const addMessage = useCallback((text: string) => {
    setMessages((prev) => [...prev, text]);
  }, []);

  const domain = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

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
              if (data.event === "complete" && data.profile && !cancelled) {
                setProgress(100);
                await new Promise((r) => setTimeout(r, 500));
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
            await new Promise((r) => setTimeout(r, 500));
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

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Spinner */}
      <div className="mb-8 h-10 w-10 animate-spin rounded-full border-[3px] border-muted-foreground/10 border-t-foreground/60" />

      {/* Domain */}
      <p className="mb-6 text-[15px] font-semibold tracking-tight text-foreground">
        {domain}
      </p>

      {/* Messages */}
      <div className="min-h-[100px]">
        <AIMessageStack messages={messages} />
      </div>

      {/* Progress */}
      <div className="mt-8 w-full max-w-xs">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted-foreground/10">
          <div
            className="h-full rounded-full bg-foreground/60 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
