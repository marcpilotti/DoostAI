"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Check, ChevronDown, ChevronRight, MoreHorizontal, X, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";

// ── Types ────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
};

type PageContext = {
  page: string;
  summary: string;
  suggestedPrompts: string[];
};

// ── Models ───────────────────────────────────────────────────────

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku", cost: 1 },
  { id: "claude-sonnet-4-6", label: "Sonnet", cost: 2 },
  { id: "claude-opus-4-6", label: "Opus", cost: 5 },
];

// ── Page context builder ─────────────────────────────────────────

function getPageContext(pathname: string): PageContext {
  if (pathname === "/dashboard" || pathname === "/dashboard/") {
    return {
      page: "home",
      summary: "User is on the Home dashboard viewing KPIs (clicks, views, ROAS, ad spend, revenue), a performance chart, and campaign activity feed.",
      suggestedPrompts: [
        "What should I focus on today?",
        "Summarize this week's performance",
        "Any underperforming campaigns?",
      ],
    };
  }
  if (pathname.startsWith("/dashboard/creatives")) {
    return {
      page: "creatives",
      summary: "User is on the Creatives page viewing a grid of ad creatives with ROAS, Spend, and CTR metrics. They can sort and filter creatives.",
      suggestedPrompts: [
        "Which creatives should I scale?",
        "Compare my top performers",
        "Generate new ad variants",
      ],
    };
  }
  if (pathname.startsWith("/dashboard/campaigns")) {
    return {
      page: "campaigns",
      summary: "User is on the Campaigns page viewing their active and past campaigns.",
      suggestedPrompts: [
        "How are my campaigns performing?",
        "Which campaign should I pause?",
        "Suggest budget optimizations",
      ],
    };
  }
  if (pathname.startsWith("/dashboard/analytics")) {
    return {
      page: "analytics",
      summary: "User is on the Analytics page viewing detailed performance data.",
      suggestedPrompts: [
        "What are the key trends?",
        "Compare channels",
        "Where am I wasting budget?",
      ],
    };
  }
  return {
    page: "other",
    summary: "User is browsing the dashboard.",
    suggestedPrompts: [
      "What should I focus on?",
      "Give me an overview",
    ],
  };
}

// ── Reasoning toggle ─────────────────────────────────────────────

function ReasoningToggle({ reasoning }: { reasoning: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[12px] text-[var(--doost-text-secondary)] transition-colors hover:text-[var(--doost-text)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/symbol.svg" alt="" className="h-3.5 w-3.5" />
        Show reasoning
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 rounded-lg bg-[var(--doost-bg)] px-3 py-2 text-[11px] leading-relaxed text-[var(--doost-text-muted)]">
              {reasoning}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Message component ────────────────────────────────────────────

// ── Action block parser ──────────────────────────────────────────

function ActionBlock({ type, target }: { type: string; target: string }) {
  const [status, setStatus] = useState<"idle" | "executing" | "done">("idle");

  async function execute() {
    setStatus("executing");
    try {
      const res = await fetch("/api/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: `chat_${Date.now()}`, type, target, params: {} }),
      });
      setStatus(res.ok ? "done" : "idle");
    } catch {
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div className="my-1.5 flex items-center gap-2 rounded-lg bg-[var(--doost-bg-badge-ready)] px-3 py-2 text-[11px] font-medium text-[var(--doost-text-positive)]">
        <Check className="h-3 w-3" /> Executed: {target}
      </div>
    );
  }

  return (
    <button
      onClick={execute}
      disabled={status === "executing"}
      className="my-1.5 flex items-center gap-2 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[11px] font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {status === "executing" ? (
        <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
      ) : (
        <Zap className="h-3 w-3" />
      )}
      Execute: {target}
    </button>
  );
}

function TypewriterText({ content, onComplete }: { content: string; onComplete?: () => void }) {
  const [displayedText, setDisplayedText] = useState("");
  const [skipped, setSkipped] = useState(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!content || skipped) return;
    let idx = 0;
    setDisplayedText("");
    completedRef.current = false;

    const interval = setInterval(() => {
      idx++;
      if (idx >= content.length) {
        setDisplayedText(content);
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete?.();
        }
        return;
      }
      setDisplayedText(content.slice(0, idx));
    }, 20);

    return () => clearInterval(interval);
  }, [content, onComplete, skipped]);

  function skip() {
    setSkipped(true);
    setDisplayedText(content);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }

  return (
    <div onClick={skip} className="cursor-pointer">
      <ReactMarkdown>{skipped ? content : displayedText}</ReactMarkdown>
    </div>
  );
}

function ChatMessage({ message, isLatest }: { message: Message; isLatest?: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-[var(--doost-bg-active)] px-4 py-2.5 text-[13px] text-white">
          {message.content}
        </div>
      </div>
    );
  }

  // Parse action blocks from AI response: "> Type: scale_budget\n> Target: Holiday Sale"
  const actionMatch = message.content.match(/> Type: (\w+)\n> Target: (.+)/);

  return (
    <div className="mt-1">
      {message.reasoning && <ReasoningToggle reasoning={message.reasoning} />}
      <div className="prose-sm text-[13px] leading-relaxed text-[var(--doost-text-secondary)] [&_strong]:text-[var(--doost-text)] [&_h3]:mt-3 [&_h3]:text-[14px] [&_h3]:font-semibold [&_h3]:text-[var(--doost-text)] [&_ul]:mt-1.5 [&_ul]:space-y-1 [&_li]:flex [&_li]:items-start [&_li]:gap-2 [&_p]:mt-1.5">
        {isLatest && message.content ? (
          <TypewriterText content={message.content} />
        ) : (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        )}
      </div>
      {actionMatch && <ActionBlock type={actionMatch[1]!} target={actionMatch[2]!} />}
    </div>
  );
}

// ── Main panel ───────────────────────────────────────────────────

export function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const ctx = getPageContext(pathname);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-6");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep ref in sync so callbacks always have fresh messages
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens (with cleanup)
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Unique ID counter
  const idRef = useRef(0);
  function nextId(suffix?: string) { return `msg_${++idRef.current}${suffix ?? ""}`; }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: nextId(), role: "user", content: text.trim() };
    const aiMsgId = nextId("-ai");
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const systemContext = `You are the Doost AI marketing assistant. The user is on the ${ctx.page} page. Context: ${ctx.summary}. Respond in the same language as the user. Be concise and actionable. Use markdown for formatting.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemContext },
            ...messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text.trim() },
          ],
          model: selectedModel,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Chat failed");

      // Stream the response — Vercel AI SDK data stream format
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        const captured = fullText;
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, content: captured } : m),
        );
      }

      // Final update
      setMessages((prev) =>
        prev.map((m) => m.id === aiMsgId ? { ...m, content: fullText || "Jag kunde inte generera ett svar." } : m),
      );
    } catch {
      // Fallback static responses
      const fallbackResponses: Record<string, string> = {
        home: "Jag kunde inte ansluta till AI just nu. Kontrollera att ANTHROPIC_API_KEY är konfigurerad. Jag kan hjälpa dig analysera dina KPIs, kampanjer och kreativ när anslutningen fungerar.",
        creatives: "Jag kunde inte ansluta till AI just nu. Kontrollera att ANTHROPIC_API_KEY är konfigurerad. Jag kan hjälpa dig analysera och skala dina kreativ.",
        campaigns: "Jag kunde inte ansluta till AI just nu. Kontrollera att ANTHROPIC_API_KEY är konfigurerad.",
      };

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== aiMsgId),
        {
          id: aiMsgId,
          role: "assistant",
          content: fallbackResponses[ctx.page] ?? "Jag hjälper dig gärna med din marknadsföring. Vad vill du veta?",
          reasoning: "Använder lokalt fallback-svar. Anslut ANTHROPIC_API_KEY för riktiga AI-svar.",
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [isStreaming, selectedModel, ctx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[1]!;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "var(--doost-ai-panel-w)", opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="shrink-0 overflow-hidden border-l bg-[var(--doost-bg-secondary)] max-md:fixed max-md:inset-y-0 max-md:right-0 max-md:z-50 max-md:shadow-xl"
          style={{ borderColor: "var(--doost-border)" }}
        >
          <div className="flex h-full flex-col w-[var(--doost-ai-panel-w)] max-md:w-[min(var(--doost-ai-panel-w),calc(100vw-48px))]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-4 w-4 text-[var(--doost-text-secondary)]" />
                <span className="text-[13px] font-semibold text-[var(--doost-text)]">AI-assistent</span>
              </div>
              <div className="flex items-center gap-1">
                {/* Model selector */}
                <div className="relative">
                  <button
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    onKeyDown={(e) => { if (e.key === "Escape") setShowModelPicker(false); }}
                    aria-haspopup="listbox"
                    aria-expanded={showModelPicker}
                    aria-label={`Välj AI-modell, nuvarande: ${currentModel.label}`}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg)]"
                  >
                    {currentModel.label}
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {showModelPicker && (
                    <>
                      <button className="fixed inset-0 z-10" onClick={() => setShowModelPicker(false)} />
                      <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-lg bg-[var(--doost-bg)] py-1 shadow-lg" role="listbox" onKeyDown={(e) => { if (e.key === "Escape") setShowModelPicker(false); }} style={{ border: `1px solid var(--doost-border)` }}>
                        {MODELS.map((m) => (
                          <button
                            key={m.id}
                            role="option"
                            aria-selected={selectedModel === m.id}
                            onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                            className={`flex w-full items-center justify-between px-3 py-2 text-[12px] transition-colors hover:bg-[var(--doost-bg-secondary)] ${selectedModel === m.id ? "font-semibold text-[var(--doost-text)]" : "text-[var(--doost-text-secondary)]"}`}
                          >
                            {m.label}
                            <span className="text-[var(--doost-text-muted)]">{m.cost} credits</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg)]" aria-label="Stäng AI-panel">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/symbol.svg" alt="" className="mb-3 h-8 w-8 opacity-20" />
                  <p className="text-[13px] font-medium text-[var(--doost-text-secondary)]">
                    Doost AI-assistent
                  </p>
                  <p className="mt-1 text-[12px] text-[var(--doost-text-muted)]">
                    Fråga om kampanjer, kreativ eller resultat.
                  </p>
                  <div className="mt-4 w-full space-y-2">
                    {[
                      { q: "Vilka kreativ presterar bäst?", desc: "Analysera toppresterande annonser" },
                      { q: "Optimera min budget", desc: "Hitta var du slösar pengar" },
                      { q: "Hur ser mina kampanjer ut?", desc: "Sammanfattning av resultat" },
                    ].map((example) => (
                      <button
                        key={example.q}
                        onClick={() => sendMessage(example.q)}
                        className="w-full rounded-lg p-2.5 text-left transition-colors hover:bg-[var(--doost-bg)]"
                        style={{ border: "1px solid var(--doost-border)" }}
                      >
                        <p className="text-[12px] font-medium text-[var(--doost-text)]">{example.q}</p>
                        <p className="text-[11px] text-[var(--doost-text-muted)]">{example.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isLatest={msg.role === "assistant" && idx === messages.length - 1}
                />
              ))}
              {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex items-center gap-1 px-3 py-2">
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--doost-text-muted)]" style={{ animationDelay: "0ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--doost-text-muted)]" style={{ animationDelay: "150ms" }} />
                  <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--doost-text-muted)]" style={{ animationDelay: "300ms" }} />
                </div>
              )}
            </div>

            {/* Suggested prompts — shown when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 border-t px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
                {ctx.suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full bg-[var(--doost-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--doost-text-secondary)] transition-colors hover:bg-[var(--doost-bg)] hover:text-[var(--doost-text)]"
                    style={{ border: `1px solid var(--doost-border)` }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t px-4 py-3" style={{ borderColor: "var(--doost-border)" }}>
              <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-xl bg-[var(--doost-bg)] px-3 py-2" style={{ border: `1px solid var(--doost-border)` }}>
                <span className="pb-0.5 text-[13px] text-[var(--doost-text-muted)]">+</span>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    // Auto-resize for all browsers (fieldSizing not widely supported)
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Fråga om dina kampanjer, kreativ eller resultat"
                  disabled={isStreaming}
                  rows={1}
                  className="min-w-0 max-h-24 flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white transition-opacity hover:opacity-80 disabled:opacity-30"
                  aria-label={isStreaming ? "Skickar..." : "Skicka meddelande"}
                >
                  {isStreaming ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-white/30 border-t-white" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
