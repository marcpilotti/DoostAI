"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { extractDomain } from "@/lib/utils/url-blocklist";

/**
 * URLSlide — Slide 1. Full viewport. Prompt box centered.
 * Premium feel: subtle gradient background, floating particles, polished input.
 */
export function URLSlide({ onSubmit }: { onSubmit: (url: string) => void }) {
  const [input, setInput] = useState("");
  const [urlHint, setUrlHint] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const domain = extractDomain(input);
    setUrlHint(domain ?? null);
  }, [input]);

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
    let url = trimmed;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    onSubmit(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) formRef.current?.requestSubmit();
    }
  };

  return (
    <div className="relative flex h-full flex-col items-center justify-center px-6 overflow-hidden">
      {/* Ambient background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          animate={prefersReduced ? {} : { x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl"
        />
        <motion.div
          animate={prefersReduced ? {} : { x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-32 bottom-1/4 h-80 w-80 rounded-full bg-purple-100/30 blur-3xl"
        />
        <motion.div
          animate={prefersReduced ? {} : { scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-50/30 blur-3xl"
        />
      </div>

      {/* Logo mark */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200/50"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </motion.div>

      {/* Hero text */}
      <motion.h1
        initial={prefersReduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="text-center font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]"
      >
        Skippa byrån.
      </motion.h1>
      <motion.p
        initial={prefersReduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mx-auto mt-3 max-w-sm text-center text-base leading-relaxed text-muted-foreground"
      >
        Klistra in din hemsida — vi skapar din första annons med AI.
      </motion.p>

      {/* Input */}
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="relative z-10 mt-8 w-full max-w-xl"
      >
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="rainbow-glow mx-auto"
        >
          <div className="rounded-2xl border border-border/40 bg-white/70 p-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_12px_40px_rgba(99,102,241,0.06)] backdrop-blur-xl transition-all focus-within:border-indigo-300/60 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1),0_12px_40px_rgba(99,102,241,0.1)]">
            {urlHint && (
              <div className="mb-1 px-3 text-xs font-medium text-indigo-500">
                Tryck Enter för att analysera{" "}
                <span className="font-semibold">{urlHint}</span>
              </div>
            )}
            {input.length >= 3 &&
              !urlHint &&
              /^[a-zåäö]/i.test(input) && (
                <div className="mb-1 flex gap-1 px-3">
                  {[".se", ".com", ".nu"].map((ext) => (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => setInput(`${input.trim()}${ext}`)}
                      className="rounded-md bg-indigo-50/60 px-2 py-0.5 text-[10px] font-medium text-indigo-500 transition-colors hover:bg-indigo-100 hover:text-indigo-700"
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
              className="max-h-[56px] w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center justify-end px-1 pt-0.5">
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-200/50 transition-all hover:shadow-lg hover:shadow-indigo-300/50 disabled:opacity-30 disabled:shadow-none"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </form>

        {/* Example URLs */}
        <motion.p
          initial={prefersReduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 text-center text-xs text-muted-foreground/40"
        >
          Testa med:{" "}
          <button
            type="button"
            onClick={() => setInput("idawargbeauty.se")}
            className="font-medium underline decoration-muted-foreground/20 underline-offset-2 transition-colors hover:text-muted-foreground hover:decoration-muted-foreground/40"
          >
            idawargbeauty.se
          </button>
          {" · "}
          <button
            type="button"
            onClick={() => setInput("florist.se")}
            className="font-medium underline decoration-muted-foreground/20 underline-offset-2 transition-colors hover:text-muted-foreground hover:decoration-muted-foreground/40"
          >
            florist.se
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
