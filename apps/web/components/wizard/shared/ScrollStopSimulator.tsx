"use client";

import { motion,useAnimation } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type ScrollStopSimulatorProps = {
  adContent: React.ReactNode;
  brandName: string;
  onComplete?: () => void;
};

const FAKE_POSTS = [
  { user: "emma.travels", text: "Solnedgång i Lissabon 🌅", color: "#E87461" },
  { user: "foodie_sthlm", text: "Bästa pastan i Söder 🍝", color: "#8B5E3C" },
  { user: "nordic.design", text: "Minimalism at its finest", color: "#4A6741" },
  { user: "gym_motivation", text: "Morgonpass kl 06 💪", color: "#2C3E50" },
  { user: "plantlife_se", text: "Min monstera blev enorm!", color: "#27AE60" },
];

function FakePost({ user, text, color }: { user: string; text: string; color: string }) {
  return (
    <div className="flex-shrink-0 w-full" style={{ height: 280 }}>
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-7 w-7 rounded-full" style={{ background: color }} />
        <span className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {user}
        </span>
      </div>
      <div className="w-full" style={{ height: 220, background: `linear-gradient(135deg, ${color}40, ${color}20)` }} />
      <div className="px-3 py-2">
        <span className="text-[12px]" style={{ color: "var(--color-text-secondary)" }}>{text}</span>
      </div>
    </div>
  );
}

export function ScrollStopSimulator({ adContent, brandName, onComplete }: ScrollStopSimulatorProps) {
  const [phase, setPhase] = useState<"scrolling" | "stopped" | "message">("scrolling");
  const scrollRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  const startScroll = useCallback(async () => {
    setPhase("scrolling");

    // Fast scroll through posts
    await controls.start({
      y: -850,
      transition: { duration: 2.5, ease: "linear" },
    });

    // Decelerate at the ad
    await controls.start({
      y: -1050,
      transition: { duration: 1.2, ease: [0.2, 0, 0, 1] },
    });

    setPhase("stopped");

    // Show message after pause
    setTimeout(() => {
      setPhase("message");
      onComplete?.();
    }, 1000);
  }, [controls, onComplete]);

  useEffect(() => {
    const t = setTimeout(startScroll, 500);
    return () => clearTimeout(t);
  }, [startScroll]);

  return (
    <div className="relative mx-auto overflow-hidden" style={{ maxWidth: 320, height: 420, borderRadius: 20 }}>
      {/* Phone frame */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          borderRadius: 20,
          border: "2px solid rgba(255,255,255,0.08)",
          boxShadow: "inset 0 0 30px rgba(0,0,0,0.3)",
        }}
      />

      {/* Status bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-1"
        style={{ background: "rgba(9,9,11,0.9)", height: 28 }}
      >
        <span className="text-[10px] font-semibold" style={{ color: "var(--color-text-primary)" }}>9:41</span>
        <div className="flex gap-1">
          <div className="h-2 w-3 rounded-sm" style={{ background: "var(--color-text-muted)" }} />
          <div className="h-2 w-2 rounded-sm" style={{ background: "var(--color-text-muted)" }} />
          <div className="h-2.5 w-4 rounded-sm" style={{ background: "var(--color-text-muted)" }} />
        </div>
      </div>

      {/* Instagram header */}
      <div
        className="absolute left-0 right-0 z-20 flex items-center px-3"
        style={{ top: 28, height: 36, background: "rgba(9,9,11,0.95)" }}
      >
        <span className="text-[14px] font-bold" style={{ color: "var(--color-text-primary)", fontFamily: "serif" }}>
          Instagram
        </span>
      </div>

      {/* Scrollable feed */}
      <motion.div
        ref={scrollRef}
        animate={controls}
        className="pt-16"
        style={{ background: "var(--color-bg-base)" }}
      >
        {FAKE_POSTS.slice(0, 3).map((post, i) => (
          <FakePost key={i} {...post} />
        ))}

        {/* THE AD */}
        <div className="flex-shrink-0 w-full">
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="h-7 w-7 rounded-full" style={{ background: "var(--color-primary)" }} />
            <div>
              <span className="text-[12px] font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {brandName}
              </span>
              <span className="ml-1 text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                Sponsrad
              </span>
            </div>
          </div>
          <div className="w-full" style={{ height: 280 }}>
            {adContent}
          </div>
        </div>

        {FAKE_POSTS.slice(3).map((post, i) => (
          <FakePost key={i + 3} {...post} />
        ))}
      </motion.div>

      {/* Scroll-stop message */}
      {phase === "message" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="absolute bottom-4 left-0 right-0 z-30 text-center"
        >
          <span
            className="inline-block rounded-full px-4 py-1.5 text-[12px] font-semibold"
            style={{
              background: "rgba(99, 102, 241, 0.9)",
              color: "#fff",
              backdropFilter: "blur(8px)",
            }}
          >
            ✓ Din annons stoppade scrollen
          </span>
        </motion.div>
      )}

      {/* Simulated thumb */}
      {phase === "scrolling" && (
        <motion.div
          className="absolute z-20 rounded-full"
          style={{
            width: 40,
            height: 40,
            background: "rgba(255,255,255,0.15)",
            bottom: 60,
            right: 30,
            filter: "blur(1px)",
          }}
          animate={{ y: [0, -30, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Replay button */}
      {phase === "message" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => {
            controls.set({ y: 0 });
            startScroll();
          }}
          className="absolute bottom-14 left-0 right-0 z-30 text-center"
        >
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            Kör igen →
          </span>
        </motion.button>
      )}
    </div>
  );
}
