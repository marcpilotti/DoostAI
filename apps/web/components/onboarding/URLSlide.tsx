"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

import { extractDomain } from "@/lib/utils/url-blocklist";

/**
 * URLSlide — Slide 1. Full viewport. Prompt box centered.
 *
 * Uses EXACT same input design as chat-input.tsx:
 * - rainbow-glow container
 * - rounded-2xl border bg-white/60 backdrop-blur-xl
 * - ArrowUp submit button (rounded-full bg-primary)
 */
export function URLSlide({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Detect URL in input
  useEffect(() => {
    const domain = extractDomain(input);
    setUrlHint(domain ?? null);
  }, [input]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 56)}px`;
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    // Normalize URL — add https:// if missing
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    onSubmit(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      {/* Hero text — exact same pattern as page.tsx empty state */}
      <h1 className="text-center font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
        Skippa byrån.
      </h1>
      <p className="mx-auto mt-4 max-w-xs text-center text-base text-muted-foreground">
        Klistra in din hemsida — vi gör resten.
      </p>

      {/* Input — exact same design as ChatInput */}
      <div className="mt-6 w-full max-w-2xl">
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rainbow-glow mx-auto max-w-2xl"
        >
          <div className="rounded-2xl border border-border/40 bg-white/60 p-2 shadow-sm backdrop-blur-xl transition-all focus-within:border-indigo-300/60 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]">
            {urlHint && (
              <div className="mb-1 px-3 text-xs text-indigo-500">
                Tryck Enter för att analysera{" "}
                <span className="font-medium">{urlHint}</span>
              </div>
            )}
            {/* Domain suffix suggestions */}
            {input.length >= 3 &&
              !urlHint &&
              /^[a-zåäö]/i.test(input) && (
                <div className="mb-1 flex gap-1 px-3">
                  {[".se", ".com", ".nu"].map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => setInput(`${input.trim()}${ext}`)}
                      className="rounded bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    >
                      {input.trim()}
                      {ext}
                    </button>
                  ))}
                </div>
              )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Klistra in din hemsida, t.ex. företag.se"
              rows={1}
              className="max-h-[56px] w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-end px-1 pt-1">
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-all hover:bg-primary/90 disabled:opacity-30 disabled:shadow-none"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>

        {/* Example URLs */}
        <p className="mt-3 text-center text-xs text-muted-foreground/60">
          Testa med:{" "}
          <button
            type="button"
            onClick={() => setInput("idawargbeauty.se")}
            className="underline transition-colors hover:text-muted-foreground"
          >
            idawargbeauty.se
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => setInput("florist.se")}
            className="underline transition-colors hover:text-muted-foreground"
          >
            florist.se
          </button>
        </p>
      </div>
    </div>
  );
}
