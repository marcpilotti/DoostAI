import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Pill — Doost design system badge/tag.
 * Matches spec: 20px radius, 11-12px text, semantic color variants.
 */

const pillVariants = cva(
  "inline-flex items-center rounded-pill px-2.5 py-0.5 text-pill font-semibold tracking-[0.01em] border transition-colors",
  {
    variants: {
      variant: {
        blue: "bg-accent-light text-accent border-accent-border",
        green: "bg-d-success-light text-d-success border-d-success-border",
        amber: "bg-d-warning-light text-d-warning border-d-warning-border",
        red: "bg-d-danger-light text-d-danger border-transparent",
        gray: "bg-surface text-d-text-secondary border-d-border-light",
      },
    },
    defaultVariants: {
      variant: "gray",
    },
  },
);

type PillProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof pillVariants>;

function Pill({ className, variant, ...props }: PillProps) {
  return (
    <span className={cn(pillVariants({ variant }), className)} {...props} />
  );
}

export { Pill, pillVariants };
