"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect,useState } from "react";

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
    if (delay === 0) { setVisible(true); return; }
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;

  return (
    <motion.p
      initial={prefersReduced ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: isLatest ? 0.6 : 0.25, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="text-center text-[13px] text-muted-foreground"
    >
      {text}
    </motion.p>
  );
}

export function AIMessageStack({ messages }: { messages: string[] }) {
  const visible = messages.slice(-4);
  return (
    <div className="flex flex-col items-center gap-1.5">
      {visible.map((text, i) => (
        <AIMessage key={`${text}-${i}`} text={text} delay={0} isLatest={i === visible.length - 1} />
      ))}
    </div>
  );
}
