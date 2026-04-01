"use client";

import { ArrowUp, Sparkles, X } from "lucide-react";
import { useCallback,useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { useCampaignBuilderStore } from "@/lib/stores/campaign-builder";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Create a campaign for my brand on Instagram",
  "Write a compelling ad headline",
  "Switch to Google Search format",
  "Increase budget to 300 SEK/day",
  "Regenerate the image with warmer tones",
  "Use Nano Banana Pro for the creative",
];

export function BuilderAIChat({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const store = useCampaignBuilderStore();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  // Build context from current canvas state
  function getCanvasContext(): string {
    const nodeDescs = store.nodes.map((n) => {
      const d = n.data as Record<string, unknown>;
      return `- ${n.type}: ${JSON.stringify(d)}`;
    }).join("\n");
    return `The user is building a campaign in a visual node editor. Current nodes:\n${nodeDescs}\n\nCampaign name: ${store.campaignName}`;
  }

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const aiMsgId = `${Date.now()}-ai`;
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);

    const systemPrompt = `You are the Doost AI campaign builder assistant. You help users create ad campaigns by editing nodes in a visual editor.

${getCanvasContext()}

You can:
1. Suggest prompt text for image generation
2. Recommend platforms and settings
3. Write ad copy (headlines, body text, CTAs)
4. Suggest budget and scheduling
5. Recommend which AI model to use for image generation

When the user asks to change something, describe what should change. Be concise. Use markdown.
Respond in the same language as the user.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text.trim() },
          ],
          model: "claude-sonnet-4-6",
        }),
      });

      if (!res.ok || !res.body) throw new Error("fail");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      setMessages((prev) => [...prev, { id: aiMsgId, role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        const captured = fullText;
        setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: captured } : m));
      }

      setMessages((prev) => prev.map((m) => m.id === aiMsgId ? { ...m, content: fullText || "I couldn't generate a response." } : m));
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== aiMsgId),
        { id: aiMsgId, role: "assistant", content: "Jag hjälper dig gärna! Beskriv vad du vill ändra i din kampanj." },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, store]);

  if (!open) return null;

  return (
    <div className="flex h-full w-[340px] shrink-0 flex-col border-l bg-[var(--doost-bg)]" style={{ borderColor: "var(--doost-border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--doost-border)" }}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[var(--doost-text-muted)]" />
          <span className="text-[12px] font-semibold text-[var(--doost-text)]">AI Assistant</span>
        </div>
        <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-2 h-6 w-6 text-[var(--doost-text-muted)] opacity-20" />
            <p className="text-[12px] text-[var(--doost-text-muted)]">Ask me to build or edit your campaign</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] text-white">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="text-[12px] leading-relaxed text-[var(--doost-text-secondary)] [&_strong]:text-[var(--doost-text)] [&_h3]:mt-2 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:text-[var(--doost-text)] [&_p]:mt-1">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--doost-text-muted)]">
            <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
            Thinking...
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1 border-t px-3 py-2" style={{ borderColor: "var(--doost-border)" }}>
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <button key={s} onClick={() => sendMessage(s)} className="rounded-full bg-[var(--doost-bg-secondary)] px-2.5 py-1 text-[10px] text-[var(--doost-text-secondary)] hover:text-[var(--doost-text)]">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t px-3 py-2.5" style={{ borderColor: "var(--doost-border)" }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }} className="flex items-center gap-2 rounded-lg bg-[var(--doost-bg-secondary)] px-2.5 py-1.5">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Edit campaign with AI..."
            disabled={isStreaming}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--doost-text)] outline-none placeholder:text-[var(--doost-text-muted)]"
          />
          <button type="submit" disabled={!input.trim() || isStreaming} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--doost-bg-active)] text-white disabled:opacity-30">
            <ArrowUp className="h-3 w-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
