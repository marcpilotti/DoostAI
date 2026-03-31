"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";

import { extractDomain } from "@/lib/utils/url-blocklist";

export function URLSlide({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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
      {/* Hero */}
      <h1 className="text-center text-[42px] font-bold leading-[1.1] tracking-tight text-foreground sm:text-[56px]">
        Skapa din första annons
      </h1>
      <p className="mt-3 max-w-md text-center text-[15px] leading-relaxed text-muted-foreground">
        Klistra in din hemsida — vi analyserar ditt varumärke och skapar en annons med AI.
      </p>

      {/* Input card */}
      <div className="mt-10 w-full max-w-md">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.04)]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); if (input.trim()) formRef.current?.requestSubmit(); }
              }}
              placeholder="företag.se"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground/40"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-white transition-opacity disabled:opacity-20"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* URL hint */}
        {urlHint && (
          <p className="mt-2 text-center text-[13px] text-muted-foreground">
            Tryck Enter för att analysera <span className="font-medium text-foreground">{urlHint}</span>
          </p>
        )}

        {/* Domain suggestions */}
        {input.length >= 3 && !urlHint && /^[a-zåäö]/i.test(input) && (
          <div className="mt-2 flex justify-center gap-1.5">
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
      </div>
    </div>
  );
}
