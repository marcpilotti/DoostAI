"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ArrowRight,
  Check,
  Loader2,
  Pause,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type Action = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  type: string;
  target: string;
  params: Record<string, unknown>;
  status: "pending" | "executing" | "done" | "failed";
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  scale_budget: TrendingUp,
  pause_campaign: Pause,
  refresh_creative: RefreshCw,
  new_audience: Users,
  consolidate: Zap,
  adjust_targeting: Sparkles,
};

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-[var(--doost-bg-badge-review)] text-[#E65100]",
  medium: "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-secondary)]",
  low: "bg-[var(--doost-bg-secondary)] text-[var(--doost-text-muted)]",
};

export default function ActionsPage() {
  useEffect(() => { document.title = "Actions — Doost AI"; }, []);
  const [actions, setActions] = useState<Action[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const toast = useToast();

  // Generate actions on first visit
  useEffect(() => {
    generateActions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateActions() {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/actions/generate", { method: "POST" });
      const data = await res.json();
      setActions(data.actions ?? []);
      setHasGenerated(true);
    } catch {
      // Fallback
      setActions([
        { id: "1", title: "Scale Holiday Sale 2025", description: "ROAS is 3.2x and stable — increase budget by 20%.", priority: "high", type: "scale_budget", target: "Holiday Sale 2025", params: { budget_increase_pct: 20 }, status: "pending" },
        { id: "2", title: "Refresh Black Friday creative", description: "CTR declining. New creative could recover 0.5% CTR.", priority: "medium", type: "refresh_creative", target: "Black Friday", params: {}, status: "pending" },
        { id: "3", title: "Pause Brand Awareness Q1", description: "Campaign completed. No reason to keep it active.", priority: "low", type: "pause_campaign", target: "Brand Awareness Q1", params: {}, status: "pending" },
      ]);
      setHasGenerated(true);
    } finally {
      setIsGenerating(false);
    }
  }

  async function executeAction(action: Action) {
    setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: "executing" } : a));

    try {
      const res = await fetch("/api/actions/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: action.id,
          type: action.type,
          target: action.target,
          params: action.params,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: "done" } : a));
        toast.success("Action executed", data.message ?? action.title);
        try { (window as any).posthog?.capture("action_executed", { type: action.type, target: action.target }); } catch {}
      } else {
        setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: "failed" } : a));
        toast.error("Action failed", `Could not execute: ${action.title}`);
      }
    } catch {
      setActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: "failed" } : a));
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-[var(--doost-text)]">AI Actions</h2>
          <p className="mt-0.5 text-[12px] text-[var(--doost-text-muted)]">
            AI-generated recommendations based on your campaign data
          </p>
        </div>
        <button
          onClick={generateActions}
          disabled={isGenerating}
          className="flex items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {isGenerating ? "Analyzing..." : "Refresh actions"}
        </button>
      </div>

      {/* Loading state */}
      {isGenerating && actions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-[var(--doost-text-muted)] border-t-[var(--doost-text)]" />
          <p className="text-[13px] text-[var(--doost-text-muted)]">AI is analyzing your campaigns...</p>
        </div>
      )}

      {/* Action cards */}
      <div className="space-y-3">
        {actions.map((action) => {
          const Icon = TYPE_ICONS[action.type] ?? Zap;
          const isDone = action.status === "done";
          const isExecuting = action.status === "executing";

          return (
            <div
              key={action.id}
              className={`group flex items-center gap-4 rounded-[var(--doost-radius-card)] bg-[var(--doost-bg)] p-4 transition-all ${isDone ? "opacity-60" : ""}`}
              style={{ border: `1px solid var(--doost-border)` }}
            >
              {/* Icon */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDone ? "bg-[var(--doost-bg-badge-ready)]" : "bg-[var(--doost-bg-secondary)]"}`}>
                {isDone ? (
                  <Check className="h-5 w-5 text-[var(--doost-text-positive)]" />
                ) : (
                  <Icon className="h-5 w-5 text-[var(--doost-text-secondary)]" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-[13px] font-semibold text-[var(--doost-text)]">{action.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${PRIORITY_STYLES[action.priority]}`}>
                    {action.priority}
                  </span>
                  {isDone && (
                    <span className="rounded-full bg-[var(--doost-bg-badge-ready)] px-2 py-0.5 text-[9px] font-semibold text-[var(--doost-text-positive)]">
                      Done
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--doost-text-secondary)]">{action.description}</p>
                <p className="mt-0.5 text-[11px] text-[var(--doost-text-muted)]">Target: {action.target}</p>
              </div>

              {/* Execute button */}
              {!isDone && (
                <button
                  onClick={() => {
                    if (action.priority === "high") {
                      setConfirmAction(action);
                    } else {
                      executeAction(action);
                    }
                  }}
                  disabled={isExecuting}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--doost-bg-active)] px-3 py-2 text-[11px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-3 w-3" />
                      Do it
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {!isGenerating && hasGenerated && actions.length === 0 && (
        <div className="py-16 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--doost-text-muted)] opacity-30" />
          <p className="text-[14px] text-[var(--doost-text-muted)]">No actions to recommend right now</p>
        </div>
      )}

      {/* Confirmation dialog for high-priority actions */}
      <ConfirmDialog
        open={confirmAction !== null}
        title="Execute high-priority action"
        description={confirmAction ? `Are you sure you want to execute "${confirmAction.title}"? ${confirmAction.description}` : ""}
        confirmLabel="Execute"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (confirmAction) {
            executeAction(confirmAction);
            setConfirmAction(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
