"use client";

import { useRef, useState, useEffect } from "react";

import { extractDomain } from "@/lib/utils/url-blocklist";

export function URLSlide({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-fill from URL params (e.g. ?url=canon.se)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (urlParam) {
      setInput(urlParam);
      // Auto-submit after a short delay
      setTimeout(() => {
        let url = urlParam;
        if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
        onSubmit(url);
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    setUrlHint(extractDomain(input) ?? null);
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onSubmit(url);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* "Skippa byrån." in sketch font */}
      <h1 className="text-center font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
        Skippa byrån.
      </h1>
      <p className="mt-3 max-w-sm text-center text-[15px] leading-relaxed text-muted-foreground">
        Klistra in din hemsida — vi skapar din annons med AI.
      </p>

      {/* Input card */}
      <div className="mt-10 w-full max-w-md px-2 sm:px-0">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={() => {
                // Don't auto-submit — user may want to edit the pasted URL first
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); if (input.trim()) formRef.current?.requestSubmit(); }
              }}
              placeholder="Klistra in din hemsida, t.ex. företag.se"
              className="min-h-[28px] min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/35"
            />
            {/* Submit — Doost AI symbol as button */}
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Analysera"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity active:scale-95 disabled:opacity-20"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/symbol.svg" alt="Analysera" className="h-7 w-7" />
            </button>
          </div>
        </form>

        {/* URL hint */}
        {urlHint && (
          <p className="mt-2.5 text-center text-[13px] text-muted-foreground">
            Tryck Enter för att analysera <span className="font-medium text-foreground">{urlHint}</span>
          </p>
        )}

        {/* Domain suggestions */}
        {input.length >= 3 && !urlHint && /^[a-zåäö]/i.test(input) && (
          <div className="mt-2.5 flex justify-center gap-1.5">
            {[".se", ".com", ".nu"].map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => setInput(`${input.trim()}${ext}`)}
                className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground"
              >
                {input.trim()}{ext}
              </button>
            ))}
          </div>
        )}

        {/* Example URLs */}
        <p className="mt-6 text-center text-[12px] text-muted-foreground/40">
          Testa med{" "}
          <button type="button" onClick={() => setInput("idawargbeauty.se")} className="underline underline-offset-2 hover:text-muted-foreground">idawargbeauty.se</button>
          {" eller "}
          <button type="button" onClick={() => setInput("canon.se")} className="underline underline-offset-2 hover:text-muted-foreground">canon.se</button>
        </p>

        {/* Social proof */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/25">
          2,847 annonser skapade med Doost AI
        </p>
      </div>
    </div>
  );
}
