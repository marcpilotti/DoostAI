"use client";

import { Command } from "cmdk";
import {
  BarChart3,
  FileText,
  Globe,
  Keyboard,
  MessageSquare,
  Pause,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { usePathname,useRouter } from "next/navigation";
import { useCallback,useEffect, useState } from "react";

type CommandItem = {
  group: string;
  label: string;
  shortcut?: string;
  icon?: React.ReactNode;
  action: () => void;
};

const RECENT_KEY = "doost-cmd-recent";

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function addRecent(label: string) {
  const recent = getRecent().filter((r) => r !== label);
  recent.unshift(label);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Cmd+K / Ctrl+K
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") { setOpen(false); setShowShortcuts(false); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Vim-style two-key combos
  useEffect(() => {
    let pending: string | null = null;
    let timer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      if (open) return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (pending === "g") {
        clearTimeout(timer);
        pending = null;
        if (e.key === "c") { router.push("/"); return; }
        if (e.key === "m") { router.push("/dashboard/campaigns"); return; }
        if (e.key === "a") { router.push("/dashboard/analytics"); return; }
        if (e.key === "s") { router.push("/dashboard/settings"); return; }
      }

      if (e.key === "g") {
        pending = "g";
        timer = setTimeout(() => { pending = null; }, 500);
        return;
      }

      if (e.key === "n") {
        router.push("/?new=true");
        return;
      }

      if (e.key === "?") {
        setShowShortcuts((s) => !s);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        const input = document.querySelector("textarea") as HTMLTextAreaElement;
        input?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, router]);

  const run = useCallback(
    (cmd: CommandItem) => {
      addRecent(cmd.label);
      setOpen(false);
      cmd.action();
    },
    [],
  );

  const commands: CommandItem[] = [
    // Navigation
    { group: "Navigation", label: "Gå till chat", shortcut: "G C", icon: <MessageSquare className="h-4 w-4" />, action: () => router.push("/") },
    { group: "Navigation", label: "Gå till kampanjer", shortcut: "G M", icon: <BarChart3 className="h-4 w-4" />, action: () => router.push("/dashboard/campaigns") },
    { group: "Navigation", label: "Gå till analys", shortcut: "G A", icon: <BarChart3 className="h-4 w-4" />, action: () => router.push("/dashboard/analytics") },
    { group: "Navigation", label: "Gå till inställningar", shortcut: "G S", icon: <Settings className="h-4 w-4" />, action: () => router.push("/dashboard/settings") },

    // Actions
    { group: "Åtgärder", label: "Ny kampanj", shortcut: "N", icon: <Plus className="h-4 w-4" />, action: () => router.push("/?new=true") },
    { group: "Åtgärder", label: "Analysera ny URL", icon: <Globe className="h-4 w-4" />, action: () => { router.push("/"); setTimeout(() => { (document.querySelector("textarea") as HTMLTextAreaElement)?.focus(); }, 100); } },
    { group: "Åtgärder", label: "Pausa alla kampanjer", icon: <Pause className="h-4 w-4" />, action: () => router.push("/") },
    { group: "Åtgärder", label: "Generera prestationsrapport", icon: <FileText className="h-4 w-4" />, action: () => router.push("/") },
    { group: "Hjälp", label: "Visa tangentbordsgenvägar", shortcut: "?", icon: <Keyboard className="h-4 w-4" />, action: () => setShowShortcuts(true) },
  ];

  // Contextual commands based on current page
  if (pathname?.startsWith("/dashboard/campaigns")) {
    commands.push(
      { group: "Kampanjer", label: "Skapa ny kampanj", icon: <Plus className="h-4 w-4" />, action: () => router.push("/") },
    );
  }

  if (pathname === "/") {
    commands.push(
      { group: "Chat", label: "Regenerera annonser", icon: <MessageSquare className="h-4 w-4" />, action: () => {} },
      { group: "Chat", label: "Ändra mall", icon: <Settings className="h-4 w-4" />, action: () => {} },
    );
  }

  // Recent
  const recent = getRecent();
  const recentCommands = recent
    .map((label) => commands.find((c) => c.label === label))
    .filter(Boolean) as CommandItem[];

  if (!open && !showShortcuts) return null;

  if (showShortcuts) {
    const shortcuts = [
      { section: "Navigation", items: [
        { keys: "⌘ K", desc: "Öppna sök" },
        { keys: "G C", desc: "Gå till chat" },
        { keys: "G M", desc: "Gå till kampanjer" },
        { keys: "G A", desc: "Gå till analys" },
        { keys: "G S", desc: "Gå till inställningar" },
      ]},
      { section: "Åtgärder", items: [
        { keys: "N", desc: "Ny kampanj" },
        { keys: "/", desc: "Fokusera chattfält" },
        { keys: "?", desc: "Visa tangentbordsgenvägar" },
      ]},
    ];

    return (
      <div className="fixed inset-0 z-[100]">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowShortcuts(false)}
        />
        <div className="flex items-start justify-center pt-[20vh]">
          <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border/60 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold">Tangentbordsgenvägar</h2>
              <kbd className="rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">ESC</kbd>
            </div>
            {shortcuts.map((section) => (
              <div key={section.section} className="mb-4 last:mb-0">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">{section.section}</p>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div key={item.keys} className="flex items-center justify-between">
                      <span className="text-[13px] text-foreground/70">{item.desc}</span>
                      <kbd className="rounded border border-border/40 bg-muted/30 px-2 py-0.5 font-mono text-[11px] text-muted-foreground/60">{item.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!open) return null;

  const groups = new Map<string, CommandItem[]>();
  if (recentCommands.length > 0) groups.set("Senaste", recentCommands);
  for (const cmd of commands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  return (
    <div className="fixed inset-0 z-[110]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="flex items-start justify-center pt-[20vh]">
        <Command className="relative w-full max-w-[640px] overflow-hidden rounded-xl border border-border/60 bg-white shadow-2xl">
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground/50" />
            <Command.Input
              placeholder="Sök kommandon..."
              className="w-full border-0 bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <kbd className="shrink-0 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/60">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[320px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground/60">
              Inga kommandon hittades.
            </Command.Empty>
            {[...groups.entries()].map(([group, items]) => (
              <Command.Group key={group} heading={group} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground/50">
                {items.map((cmd) => (
                  <Command.Item
                    key={cmd.label}
                    onSelect={() => run(cmd)}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-foreground/80 aria-selected:bg-indigo-50 aria-selected:text-indigo-700"
                  >
                    <span className="text-muted-foreground/50">{cmd.icon}</span>
                    <span className="flex-1">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="rounded border border-border/40 bg-muted/30 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground/40">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
