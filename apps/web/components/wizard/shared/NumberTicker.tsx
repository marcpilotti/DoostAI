"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

type NumberTickerProps = {
  value: number;
  format?: (n: number) => string;
  className?: string;
};

export function NumberTicker({
  value,
  format = (n) => Math.round(n).toLocaleString("sv-SE"),
  className,
}: NumberTickerProps) {
  const spring = useSpring(0, { damping: 30, stiffness: 100 });
  const display = useTransform(spring, (latest) => format(latest));
  const [text, setText] = useState(format(value));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setText(v));
    return unsubscribe;
  }, [display]);

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {text}
    </motion.span>
  );
}
