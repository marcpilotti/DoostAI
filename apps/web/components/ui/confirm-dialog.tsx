"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus confirm button when dialog opens
  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-sm rounded-xl bg-[var(--doost-bg)] p-6 shadow-xl"
            style={{ border: "1px solid var(--doost-border)" }}
          >
            <h3 className="text-[15px] font-semibold text-[var(--doost-text)]">
              {title}
            </h3>
            <p className="mt-2 text-[13px] text-[var(--doost-text-secondary)]">
              {description}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={onCancel}
                className="rounded-lg px-3 py-2 text-[12px] font-medium text-[var(--doost-text-secondary)] hover:bg-[var(--doost-bg-secondary)]"
              >
                {cancelLabel}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className={`rounded-lg px-3 py-2 text-[12px] font-medium text-white transition-opacity hover:opacity-90 ${
                  variant === "danger" ? "bg-red-600" : "bg-[var(--doost-bg-active)]"
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
