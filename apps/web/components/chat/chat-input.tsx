"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Image, Mic, Paperclip } from "lucide-react";

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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
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
    <div className="px-6 pb-6 pt-2">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="rainbow-glow mx-auto max-w-2xl"
      >
        <div className="rounded-2xl border border-border/40 bg-white/60 p-2 shadow-sm backdrop-blur-xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            rows={1}
            className="max-h-[200px] w-full resize-none rounded-xl bg-white px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex gap-0.5">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Image className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-muted-foreground"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6366f1] text-white shadow-sm transition-all hover:bg-[#5558e6] disabled:opacity-30 disabled:shadow-none"
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
