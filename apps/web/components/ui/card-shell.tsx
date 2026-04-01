"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * CardShell — Doost design system card container.
 * Matches spec: 14px radius, 1.5px border, card shadow, optional active state.
 */

type CardShellProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Show active/selected state (accent ring) */
  active?: boolean;
  /** Remove padding (for custom layouts) */
  noPadding?: boolean;
};

const CardShell = React.forwardRef<HTMLDivElement, CardShellProps>(
  ({ className, active, noPadding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card bg-card shadow-card",
        "border-[1.5px] border-d-border",
        "transition-shadow duration-150",
        active && "shadow-card-active border-accent",
        !noPadding && "p-card-p sm:p-card-p-lg",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
CardShell.displayName = "CardShell";

export { CardShell };
