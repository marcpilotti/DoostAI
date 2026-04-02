"use client";

import { useEffect,useRef, useState } from "react";

import { extractDomain } from "@/lib/utils/url-blocklist";

// #15 Recent URLs helpers
const RECENT_URLS_KEY = "doost:recent-urls";
const MAX_RECENT_URLS = 3;

function loadRecentUrls(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_URLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT_URLS);
    return [];
  } catch {
    return [];
  }
}

function saveRecentUrl(url: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadRecentUrls();
    const deduped = [url, ...existing.filter((u) => u !== url)].slice(0, MAX_RECENT_URLS);
    localStorage.setItem(RECENT_URLS_KEY, JSON.stringify(deduped));
  } catch { /* quota exceeded — ignore */ }
}

export function URLSlide({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [recentUrls, setRecentUrls] = useState<string[]>([]);

  // Auto-fill from URL params (e.g. ?url=canon.se)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("url");
    if (!urlParam) return;
    setInput(urlParam);
    const timerId = setTimeout(() => {
      let url = urlParam;
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      onSubmit(url);
    }, 800);
    return () => clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // #15 Load recent URLs on mount
  useEffect(() => {
    setRecentUrls(loadRecentUrls());
  }, []);

  useEffect(() => {
    setUrlHint(extractDomain(input) ?? null);
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || submitting) return;
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setSubmitting(true);
    // #15 Save to recent URLs
    saveRecentUrl(url);
    onSubmit(url);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* "Skippa byrån." in sketch font */}
      <h1 className="text-center font-sketch text-[36px] sm:text-[48px] md:text-[64px] text-[#0f172a]">
        Skippa byrån.
      </h1>
      <p className="mt-3 max-w-sm text-center text-[15px] text-[#64748b]">
        Klistra in din hemsida — vi skapar din annons med AI.
      </p>

      {/* Input card */}
      <div className="mt-10 w-full max-w-lg px-2 sm:px-0">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-[#e2e8f0] bg-white px-5 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <input
              ref={inputRef}
              type="text"
              inputMode="url"
              autoComplete="off"
              enterKeyHint="go"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={submitting}
              onPaste={() => {
                // Don't auto-submit — user may want to edit the pasted URL first
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); if (input.trim()) formRef.current?.requestSubmit(); }
              }}
              placeholder="Klistra in din hemsida, t.ex. företag.se"
              className="min-h-[28px] min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none focus-visible:outline-none placeholder:text-muted-foreground/35 disabled:opacity-50"
            />
            {/* Submit — Doost AI symbol + label */}
            <button
              type="submit"
              disabled={!input.trim() || submitting}
              aria-label="Analysera"
              className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#0f172a] px-4 py-2.5 text-sm font-semibold text-white transition-opacity active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/symbol.svg" alt="" className="h-5 w-5 brightness-0 invert" />
                  Analysera
                </>
              )}
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
                className="rounded-full bg-white px-3 py-2 min-h-[40px] text-[12px] flex items-center font-medium text-[#64748b] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#e2e8f0] transition-colors hover:text-[#0f172a]"
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

        {/* #15 Recent URLs */}
        {recentUrls.length > 0 && (
          <div className="mt-4 text-center">
            <p className="mb-2 text-[11px] text-muted-foreground/30">Senast analyserade</p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {recentUrls.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => { setInput(url.replace(/^https?:\/\//, "")); }}
                  className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-[#64748b] shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-[#e2e8f0] transition-colors hover:text-[#0f172a]"
                >
                  {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Social proof */}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/40">
          Betrodd av svenska företag — från enskild firma till börsbolag
        </p>
      </div>
    </div>
  );
}
