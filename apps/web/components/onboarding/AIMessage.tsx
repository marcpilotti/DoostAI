"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * AIMessage — animated micro-message that fades in after a delay.
 *
 * NOT a chat bubble. NOT with an avatar. Just muted text that appears
 * with a subtle y-offset — like a status line with personality.
 *
 * Style: text-sm, muted color, centered, fade-in with subtle letter-spacing.
 */
export function AIMessage({
  text,
  delay = 0,
  isLatest = true,
}: {
  text: string;
  delay?: number;
  isLatest?: boolean;
}) {
  const [visible, setVisible] = useState(delay === 0);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (delay === 0) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.p
      initial={prefersReduced ? false : { opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{
        opacity: isLatest ? 0.8 : 0.3,
        y: 0,
        filter: "blur(0px)",
      }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center text-[13px] tracking-[-0.01em] text-muted-foreground"
    >
      {text}
    </motion.p>
  );
}

/**
 * AIMessageStack — shows up to 4 messages, latest is full opacity,
 * older ones fade out. Oldest messages beyond 4 are removed.
 */
export function AIMessageStack({ messages }: { messages: string[] }) {
  const visible = messages.slice(-4);

  return (
    <div className="flex flex-col items-center gap-2">
      {visible.map((text, i) => (
        <AIMessage
          key={`${text}-${i}`}
          text={text}
          delay={0}
          isLatest={i === visible.length - 1}
        />
      ))}
    </div>
  );
}
