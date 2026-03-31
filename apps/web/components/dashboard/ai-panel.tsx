"use client";

import { useState } from "react";
import { ArrowUp, MoreHorizontal, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AIPanel — 380px slide-out panel from the right.
 * Phase 1: shell with placeholder messages.
 * Phase 4: full chat with tool calling, model selector, reasoning toggle.
 */
export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState("");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--doost-ai-panel-w)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="shrink-0 overflow-hidden border-l bg-[var(--doost-bg-secondary)]"
          style={{ borderColor: "var(--doost-border)" }}
        >
          <div className="flex h-full flex-col" style={{ width: "var(--doost-ai-panel-w)" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-[var(--doost-text-secondary)]" />
                <span className="text-[13px] font-semibold text-[var(--doost-text)]">AI-assistent</span>
              </div>
              <div className="flex items-center gap-1">
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-white">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {/* Placeholder — Phase 4 will add real chat */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--doost-bg-active)] px-4 py-2.5 text-[13px] text-white">
                  Vad bör jag fokusera på idag?
                </div>
              </div>

              <div className="mt-4">
                <button className="mb-2 flex items-center gap-1 text-[12px] text-[var(--doost-text-secondary)] hover:text-[var(--doost-text)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/symbol.svg" alt="" className="h-4 w-4" />
                  Show reasoning <ChevronRight className="h-3 w-3" />
                </button>
                <div className="text-[13px] leading-relaxed text-[var(--doost-text-secondary)]">
                  <p>Baserat på dina kampanjer ser jag att <strong className="text-[var(--doost-text)]">Holiday Sale 2025</strong> presterar bäst med 3.2x ROAS.</p>
                  <p className="mt-3 text-[14px] font-semibold text-[var(--doost-text)]">Fokusera på det som redan fungerar</p>
                  <p className="mt-1">Din bästa kampanj har stabil ROAS och kan skalas upp med högre budget utan att tappa effektivitet.</p>
                  <ul className="mt-2 space-y-1 text-[13px]">
                    <li className="flex items-start gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--doost-text)]" />Stabil ROAS över tid</li>
                    <li className="flex items-start gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--doost-text)]" />Pålitlig räckvidd</li>
                    <li className="flex items-start gap-2"><span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--doost-text)]" />Bra CTR jämfört med branschsnitt</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2" style={{ border: `1px solid var(--doost-border)` }}>
                <span className="text-[13px] text-[var(--doost-text-muted)]">+</span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask for marketing recommendations"
                  className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)]"
                />
                <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white transition-opacity hover:opacity-80">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
