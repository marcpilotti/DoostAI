"use client";

import { Menu, Sparkles } from "lucide-react";
import { useState } from "react";

import { ToastProvider } from "@/components/ui/toast";
import { useAIPanelStore } from "@/lib/stores/ai-panel";

import { AIPanel } from "./ai-panel";
import { Breadcrumbs } from "./breadcrumbs";
import { PageTransition } from "./page-transition";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { open: aiPanelOpen, toggle: toggleAI, setOpen: setAIPanelOpen } = useAIPanelStore();

  return (
    <ToastProvider>
    <div className="flex h-screen bg-[var(--doost-bg-secondary)]">
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Stäng sidomeny"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden" style={{ borderColor: "var(--doost-border)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg)]"
            aria-label="Öppna sidomeny"
            aria-expanded={sidebarOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Doost AI" className="h-5" />
        </div>

        <div className="hidden md:block">
          <TopBar onToggleAI={toggleAI} />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <main id="main" className="flex-1 overflow-y-auto">
            <Breadcrumbs />
            <PageTransition>{children}</PageTransition>
          </main>
          <AIPanel open={aiPanelOpen} onClose={() => setAIPanelOpen(false)} />
        </div>

        {/* Mobile FAB for AI panel */}
        {!aiPanelOpen && (
          <button
            onClick={() => setAIPanelOpen(true)}
            className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 md:hidden"
            aria-label="Öppna AI-assistent"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
    </ToastProvider>
  );
}
