"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Image, Mic, Paperclip } from "lucide-react";

import { extractDomain } from "@/lib/utils/url-blocklist";

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [urlHint, setUrlHint] = useState<string | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Detect URL in input and show hint
  useEffect(() => {
    const domain = extractDomain(input);
    if (domain) {
      setUrlHint(domain);
    } else {
      setUrlHint(null);
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        formRef.current?.requestSubmit();
      }
    }
  };

  return (
    <div className="px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="rainbow-glow mx-auto max-w-lg"
      >
        <div className="rounded-xl border border-border/40 bg-white/60 p-1.5 shadow-sm backdrop-blur-xl">
          {urlHint && (
            <div className="mb-1 px-3 text-[11px] text-indigo-500">
              Tryck Enter för att analysera <span className="font-medium">{urlHint}</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Börja med att skriva in ditt företags URL här..."
            rows={1}
            className="max-h-[150px] w-full resize-none rounded-lg bg-white px-3 py-2 text-xs outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex gap-0.5">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#6366f1] text-white shadow-sm transition-all hover:bg-[#5558e6] disabled:opacity-30 disabled:shadow-none"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
