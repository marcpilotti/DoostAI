"use client";

import { useUser } from "@clerk/nextjs";
import { Bell, Moon, Sparkles, Sun } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("doost-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored === "dark" || (!stored && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = useCallback(() => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("doost-theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  return { dark, toggle };
}

export function TopBar({ onToggleAI }: { onToggleAI?: () => void }) {
  const { user } = useUser();
  const firstName = user?.firstName ?? user?.fullName?.split(" ")[0] ?? "";
  const { dark, toggle: toggleDark } = useDarkMode();

  return (
    <div className="flex h-14 shrink-0 items-center justify-between px-6 glass-surface gradient-border-bottom">
      <p className="text-[15px] font-medium text-[var(--doost-text-secondary)]">
        {firstName ? `Välkommen tillbaka, ${firstName}` : "Doost AI"}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)] transition-colors"
          aria-label={dark ? "Byt till ljust läge" : "Byt till mörkt läge"}
          title={dark ? "Ljust läge" : "Mörkt läge"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)]"
          aria-label="Notiser (3 olästa)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--doost-bg-active)]" />
        </button>

        {onToggleAI && (
          <button
            onClick={onToggleAI}
            className="relative flex h-9 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium text-white transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, var(--doost-bg-active), #7C3AED)",
              boxShadow: "0 2px 12px -2px rgba(99,102,241,0.4)",
            }}
            aria-label="Öppna AI-assistent"
            title="AI-assistent"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI
          </button>
        )}
      </div>
    </div>
  );
}
