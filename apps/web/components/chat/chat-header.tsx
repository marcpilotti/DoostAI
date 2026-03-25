"use client";

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
          <span className="text-sm font-bold text-white">D</span>
        </div>
        <span className="font-heading text-lg font-semibold tracking-tight">
          Doost AI
        </span>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-600">
          Beta
        </span>
      </div>
    </header>
  );
}
