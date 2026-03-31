"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { AIPanel } from "./ai-panel";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--doost-bg-secondary)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Stäng sidomeny"
        />
      )}

      {/* Sidebar — slide-in on mobile, always visible on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b px-4 py-3 md:hidden" style={{ borderColor: "var(--doost-border)" }}>
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--doost-text-secondary)] hover:bg-white"
            aria-label="Öppna sidomeny"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Doost AI" className="h-5" />
        </div>

        {/* Desktop top bar */}
        <div className="hidden md:block">
          <TopBar onToggleAI={() => setAiPanelOpen(!aiPanelOpen)} />
        </div>

        {/* Content + AI Panel side by side */}
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <AIPanel open={aiPanelOpen} onClose={() => setAiPanelOpen(false)} />
        </div>
      </div>
    </div>
  );
}
