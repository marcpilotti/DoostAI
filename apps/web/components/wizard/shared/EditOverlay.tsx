"use client";

import { AnimatePresence,motion } from "motion/react";

import { transitions } from "@/lib/motion";

type EditOverlayProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function EditOverlay({ open, onClose, children }: EditOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[44]"
            style={{ background: "rgba(0, 0, 0, 0.4)" }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={transitions.gentle}
            className="absolute inset-x-0 bottom-0 z-[45] p-6"
            style={{
              maxHeight: "80%",
              background: "var(--color-bg-elevated)",
              borderTop: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
              boxShadow: "0 -8px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
