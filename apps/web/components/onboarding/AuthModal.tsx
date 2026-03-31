"use client";

import { useEffect } from "react";
import { SignUp, useAuth } from "@clerk/nextjs";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AuthModal — slides up when user tries to publish without being signed in.
 * Shows Clerk's SignUp component with email/password + social logins.
 * Automatically closes and calls onAuthenticated when signup completes.
 */
export function AuthModal({
  open,
  onClose,
  onAuthenticated,
}: {
  open: boolean;
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const { isSignedIn } = useAuth();

  // When user signs in/up, auto-close and proceed
  useEffect(() => {
    if (isSignedIn && open) {
      onAuthenticated();
    }
  }, [isSignedIn, open, onAuthenticated]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-x-4 bottom-4 top-auto z-50 mx-auto max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div>
                <h2 className="text-[16px] font-semibold text-[var(--doost-text)]">
                  Skapa konto för att publicera
                </h2>
                <p className="mt-0.5 text-[13px] text-[var(--doost-text-muted)]">
                  Din annons är redo — registrera dig för att gå live.
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--doost-text-muted)] hover:bg-[var(--doost-bg-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Clerk SignUp */}
            <div className="px-2 pb-4">
              <SignUp
                appearance={{
                  elements: {
                    rootBox: "w-full",
                    card: "shadow-none border-0 w-full",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                    socialButtonsBlockButton: "rounded-xl",
                    formButtonPrimary: "bg-[var(--doost-bg-active)] hover:opacity-90 rounded-xl",
                    footerAction: "text-[var(--doost-text-muted)]",
                  },
                }}
                signInUrl="/sign-in"
                forceRedirectUrl="/dashboard"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
