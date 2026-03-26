"use client";

import { useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Sparkles } from "lucide-react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { SuggestionChips, getSuggestionsForStep } from "@/components/chat/suggestion-chips";
import { useFlowProgress } from "@/hooks/use-flow-progress";

export default function Home() {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const { messages, sendMessage, status } = useChat({
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
      try { localStorage.setItem("doost:draft-session", JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Listen for signup completion → show nav
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const [savedSession, setSavedSession] = useState<{ companyName?: string } | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem("doost:draft-session");
      if (draft && messages.length === 0) {
        const parsed = JSON.parse(draft);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Try to extract company name from tool results
          const brandResult = parsed.find((m: { parts?: Array<{ toolName?: string; output?: { name?: string } }> }) =>
            m.parts?.some((p: { toolName?: string }) => p.toolName === "analyze_brand")
          );
          const name = brandResult?.parts?.find((p: { toolName?: string }) => p.toolName === "analyze_brand")?.output?.name;
          setSavedSession({ companyName: name });
        }
      }
    } catch {}
  }, [messages.length]);

  const isEmpty = messages.length === 0 && !savedSession;

  return (
    <div className="flex h-screen flex-col bg-background">
      <ChatHeader authenticated={authenticated} />

      {/* Resume saved session */}
      {savedSession && messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <div className="animate-card-in w-full max-w-sm overflow-hidden rounded-2xl border border-border/30 bg-white/80 shadow-sm backdrop-blur-xl">
            <div className="px-5 py-4 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <h3 className="text-sm font-semibold">Välkommen tillbaka{savedSession.companyName ? `, ${savedSession.companyName}` : ""}!</h3>
              <p className="mt-1 text-xs text-muted-foreground">Du har en pågående session. Vill du fortsätta?</p>
            </div>
            <div className="flex gap-2 border-t border-border/20 px-5 py-3">
              <button
                onClick={() => { localStorage.removeItem("doost:draft-session"); setSavedSession(null); }}
                className="flex-1 rounded-xl border border-border/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:bg-muted/40"
              >
                Börja om
              </button>
              <button
                onClick={() => { setSavedSession(null); /* session will restore via useChat */ }}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:from-indigo-600 hover:to-indigo-700"
              >
                Fortsätt
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-8">
          <h1 className="text-center font-sketch text-[48px] leading-[1.05] tracking-[-0.02em] text-foreground sm:text-[64px]">
            Skippa byrån.
          </h1>
          <p className="mx-auto mt-4 max-w-xs text-center text-base text-muted-foreground">
            Klistra in din URL. Vi sköter resten.
          </p>
          {/* Tooltip hint */}
          <div className="mt-4 flex items-center gap-2 rounded-full bg-indigo-50/80 px-4 py-1.5 text-[11px] font-medium text-indigo-600 animate-message-in">
            <span className="inline-block animate-bounce text-base">↓</span>
            Prova med ditt företags hemsida — det tar 10 sekunder
          </div>
          {/* Social proof */}
          <div className="mt-2 animate-message-in text-[11px] text-emerald-600/70" style={{ animationDelay: "300ms" }}>
            ✓ 1 247 svenska företag har redan skapat sin första kampanj
          </div>
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
          <div className="min-h-0 flex-1">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              onSendMessage={(text) => {
                sendMessage({ text });
              }}
            />
          </div>
          <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
            {!isLoading && messages.length > 0 && !input && (
              <SuggestionChips
                suggestions={getSuggestionsForStep(flowStep)}
                onSelect={(msg) => sendMessage({ text: msg })}
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
    </div>
  );
}
