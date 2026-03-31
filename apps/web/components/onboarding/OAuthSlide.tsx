"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  ExternalLink,
  Shield,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { AIMessage } from "./AIMessage";

// ── Platform configs ────────────────────────────────────────────

const PLATFORM_CONFIG = {
  meta: {
    label: "Meta (Facebook + Instagram)",
    color: "#1877F2",
    icon: "f",
    callbackParam: "meta_connected",
  },
  google: {
    label: "Google Ads",
    color: "#4285F4",
    icon: "G",
    callbackParam: "google_connected",
  },
  linkedin: {
    label: "LinkedIn",
    color: "#0A66C2",
    icon: "in",
    callbackParam: "linkedin_connected",
  },
} as const;

type PlatformId = keyof typeof PLATFORM_CONFIG;

// ── Component ────────────────────────────────────────────────────

export function OAuthSlide({
  platform,
  onConnected,
  onSkip,
}: {
  platform: PlatformId;
  onConnected: () => void;
  onSkip?: () => void;
}) {
  const prefersReduced = useReducedMotion();
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const config = PLATFORM_CONFIG[platform];

  // Listen for OAuth callback
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "oauth-callback" && event.data?.platform === platform) {
        setConnected(true);
        setTimeout(onConnected, 800);
      }
    }

    // Also check URL params (popup callback sets these)
    function checkUrlParams() {
      const params = new URLSearchParams(window.location.search);
      if (params.get(config.callbackParam) === "true") {
        window.history.replaceState({}, "", window.location.pathname);
        setConnected(true);
        setTimeout(onConnected, 800);
      }
    }

    window.addEventListener("message", handleMessage);
    // Check on mount + poll for redirect-based OAuth
    checkUrlParams();
    const poll = setInterval(checkUrlParams, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(poll);
    };
  }, [platform, config.callbackParam, onConnected]);

  const handleConnect = useCallback(async () => {
    setConnecting(true);

    // Fetch OAuth URL from API
    try {
      const res = await fetch(`/api/platforms/${platform}/oauth-url`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          // Open OAuth in popup
          const popup = window.open(
            data.url,
            `${platform}-oauth`,
            "width=600,height=700,left=200,top=100",
          );

          // Poll for popup close (fallback for browsers that block postMessage)
          if (popup) {
            const timer = setInterval(() => {
              if (popup.closed) {
                clearInterval(timer);
                setConnecting(false);
              }
            }, 500);
          }
          return;
        }
      }
    } catch {
      // Fallback: show error state
    }
    setConnecting(false);
  }, [platform]);

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <motion.div
        initial={prefersReduced ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Title */}
        <h2 className="mb-6 text-center text-lg font-bold tracking-tight">
          Koppla ditt annonskonto
        </h2>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={connecting || connected}
          className="flex w-full items-center gap-3 rounded-xl border border-border/30 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-xl transition-all hover:border-indigo-300 hover:shadow-md disabled:opacity-60"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: config.color }}
          >
            {connected ? (
              <Check className="h-5 w-5" strokeWidth={3} />
            ) : (
              config.icon
            )}
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-semibold">
              {connected ? `${config.label} ansluten!` : `Koppla ${config.label}`}
            </div>
            <div className="text-xs text-muted-foreground">
              {connected
                ? "Ditt konto är redo"
                : connecting
                  ? "Öppnar inloggning..."
                  : "Öppnar inloggning i nytt fönster"}
            </div>
          </div>
          {!connected && !connecting && (
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          )}
          {connecting && (
            <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />
          )}
        </button>

        {/* Trust signals */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Shield className="h-3 w-3 shrink-0" />
            Vi får aldrig tillgång till privata meddelanden
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
            <Check className="h-3 w-3 shrink-0" />
            Du kan koppla bort när som helst
          </div>
        </div>

        {/* AI message */}
        <div className="mt-6">
          <AIMessage text="Sista steget innan din annons är live!" />
        </div>

        {/* Skip option */}
        {onSkip && !connected && (
          <div className="mt-4 text-center">
            <button
              onClick={onSkip}
              className="text-xs font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground"
            >
              Hoppa över — vi skapar ett konto åt dig
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
