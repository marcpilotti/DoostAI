"use client";

import { AlertTriangle, Check, Info,X } from "lucide-react";
import { AnimatePresence,motion } from "motion/react";
import { createContext, useCallback, useContext, useState } from "react";

// ── Types ────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
};

type ToastContextType = {
  toast: (t: Omit<Toast, "id">) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ── Icons ────────────────────────────────────────────────────────

const ICONS: Record<ToastType, React.ComponentType<{ className?: string }>> = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "bg-[var(--doost-bg-badge-ready)]", icon: "text-[var(--doost-text-positive)]" },
  error: { bg: "bg-[var(--color-error-light,#FEF2F2)]", icon: "text-[var(--color-error,#DC2626)]" },
  warning: { bg: "bg-[var(--doost-bg-badge-review)]", icon: "text-[var(--color-warning,#E65100)]" },
  info: { bg: "bg-[var(--color-info-light,#EFF6FF)]", icon: "text-[var(--color-info,#3B82F6)]" },
};

// ── Provider ─────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...t, id }]);

    // Auto-dismiss
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, t.duration ?? 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (title, description) => addToast({ type: "success", title, description }),
    error: (title, description) => addToast({ type: "error", title, description }),
    warning: (title, description) => addToast({ type: "warning", title, description }),
    info: (title, description) => addToast({ type: "info", title, description }),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}

      {/* Toast container — bottom right */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2" role="status" aria-live="polite">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type];
            const style = STYLES[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="flex w-80 items-start gap-3 rounded-xl bg-[var(--doost-bg)] p-3 shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.06)]"
                style={{ border: "1px solid var(--doost-border)" }}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                  <Icon className={`h-3 w-3 ${style.icon}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[var(--doost-text)]">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 text-[11px] text-[var(--doost-text-muted)]">{t.description}</p>
                  )}
                  {t.action && (
                    <button
                      onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                      className="mt-1.5 text-[11px] font-semibold text-foreground underline underline-offset-2 hover:text-foreground/80"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismiss(t.id)}
                  className="shrink-0 text-[var(--doost-text-muted)] hover:text-[var(--doost-text)]"
                  aria-label="Stäng notis"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
