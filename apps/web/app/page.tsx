"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { FileText, Sparkles } from "lucide-react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SuggestionChips, getSuggestionsForStep } from "@/components/chat/suggestion-chips";
import { useFlowProgress } from "@/hooks/use-flow-progress";

/** Max age for a restorable draft session (2 hours) */
const DRAFT_MAX_AGE_MS = 2 * 60 * 60 * 1000;

type SavedDraftMeta = {
  companyName?: string;
  hasAdCopy: boolean;
  savedAt: number;
};

/** Synchronously read and validate saved session from localStorage */
function readSavedSession(): { messages: UIMessage[]; meta: SavedDraftMeta } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("doost:draft-session");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // Check timestamp — reject if older than 2 hours
    const timestampRaw = localStorage.getItem("doost:draft-session-ts");
    const savedAt = timestampRaw ? Number(timestampRaw) : 0;
    if (savedAt > 0 && Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem("doost:draft-session");
      localStorage.removeItem("doost:draft-session-ts");
      return null;
    }

    // Extract metadata from saved messages
    let companyName: string | undefined;
    let hasAdCopy = false;
    for (const m of parsed) {
      if (!m.parts) continue;
      for (const p of m.parts) {
        if (p.toolName === "analyze_brand" && p.state === "output-available" && p.output?.name) {
          companyName = p.output.name;
        }
        if (p.toolName === "generate_ad_copy" && p.state === "output-available") {
          hasAdCopy = true;
        }
      }
    }

    return { messages: parsed as UIMessage[], meta: { companyName, hasAdCopy, savedAt } };
  } catch {
    return null;
  }
}

/** The active chat area — mounted/remounted with the correct initial messages */
function ChatArea({ initialMessages }: { initialMessages?: UIMessage[] }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    onError: (err) => {
      setError(err.message ?? "Något gick fel. Försök igen.");
    },
  });

  // Handle OAuth callback query params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("linkedin_connected") === "true") {
      setToast("LinkedIn anslutet! Ditt konto är redo att användas.");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("meta_connected") === "true") {
      setToast("Meta anslutet!");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("google_connected") === "true") {
      setToast("Google Ads anslutet!");
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Persist chat session to localStorage (restore on reload)
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("doost:draft-session", JSON.stringify(messages));
        localStorage.setItem("doost:draft-session-ts", String(Date.now()));
      } catch {}
    }
  }, [messages]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Listen for signup completion
  useEffect(() => {
    function handleSignup() {
      setAuthenticated(true);
      setToast("Klart! Ditt konto är skapat.");
    }
    window.addEventListener("doost:signup-complete", handleSignup);
    return () => window.removeEventListener("doost:signup-complete", handleSignup);
  }, []);

  const isLoading = status === "submitted" || status === "streaming";
  const flowStep = useFlowProgress(messages);

  // Debounced sendMessage — prevents double-clicks but NEVER blocks component actions
  const [sending, setSending] = useState(false);
  const safeSendMessage = (text: string) => {
    if (sending || !text.trim()) return;
    setSending(true);
    sendMessage({ text: text.trim() });
    setTimeout(() => setSending(false), 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || sending) return;
    safeSendMessage(trimmed);
    setInput("");
  };

  const isEmpty = messages.length === 0;

  return (
    <>
      <ChatHeader authenticated={authenticated} />

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <h1 className="text-center font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
            Skippa byrån.
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-center text-base text-muted-foreground">
            Klistra in din URL. Vi sköter resten.
          </p>
          <div className="mt-4 w-full max-w-2xl">
            <ChatInput
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSendMessage={safeSendMessage}
            />
          </div>
          <div className="shrink-0 mx-auto w-full max-w-2xl px-4 sm:px-6">
            {!isLoading && messages.length > 0 && !input && (
              <SuggestionChips
                suggestions={getSuggestionsForStep(flowStep)}
                onSelect={safeSendMessage}
              />
            )}
          </div>
          <ChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </>
      )}

      {error && (
        <div className="mx-auto mb-4 flex max-w-2xl items-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-medium underline">Stäng</button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 mx-4 max-w-[calc(100vw-2rem)] -translate-x-1/2 animate-message-in rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700 shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

export default function Home() {
  // "pending" = checking for draft, "resume" = restore saved session, "fresh" = start new
  const [restoreChoice, setRestoreChoice] = useState<"pending" | "resume" | "fresh">("pending");
  const [draftData] = useState(() => readSavedSession());

  // If no draft exists, go straight to fresh
  useEffect(() => {
    if (!draftData && restoreChoice === "pending") {
      setRestoreChoice("fresh");
    }
  }, [draftData, restoreChoice]);

  const showResumeBanner = restoreChoice === "pending" && draftData !== null;

  return (
    <div className="flex h-screen flex-col bg-background">
      {showResumeBanner && (
        <>
          <ChatHeader authenticated={false} />
          <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
            <div className="animate-card-in w-full max-w-sm overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-sm backdrop-blur-xl">
              <div className="px-5 py-4 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                  {draftData.meta.hasAdCopy ? (
                    <FileText className="h-5 w-5 text-indigo-500" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                  )}
                </div>
                <h3 className="text-sm font-semibold">
                  {draftData.meta.hasAdCopy
                    ? `Du har ett utkast${draftData.meta.companyName ? ` för ${draftData.meta.companyName}` : ""}`
                    : `Välkommen tillbaka${draftData.meta.companyName ? `, ${draftData.meta.companyName}` : ""}!`}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {draftData.meta.hasAdCopy
                    ? "Dina annonser finns kvar. Fortsätt där du slutade."
                    : "Du har en pågående session. Vill du fortsätta?"}
                </p>
              </div>
              <div className="flex gap-2 border-t border-border/20 px-5 py-3">
                <button
                  onClick={() => {
                    localStorage.removeItem("doost:draft-session");
                    localStorage.removeItem("doost:draft-session-ts");
                    setRestoreChoice("fresh");
                  }}
                  className="flex-1 rounded-xl border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/40"
                >
                  Börja om
                </button>
                <button
                  onClick={() => setRestoreChoice("resume")}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700"
                >
                  Fortsätt
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {restoreChoice === "resume" && (
        <ChatArea initialMessages={draftData?.messages} />
      )}

      {restoreChoice === "fresh" && (
        <ChatArea />
      )}
    </div>
  );
}
