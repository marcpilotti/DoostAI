"use client";

import { useState } from "react";

import { Sidebar } from "./sidebar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, slide-in on mobile */}
      <div
        className={`sidebar-panel md:relative md:!transform-none ${sidebarOpen ? "open" : ""}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
