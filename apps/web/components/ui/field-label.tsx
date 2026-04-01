import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * FieldLabel — Doost design system section label.
 * Matches spec: 11px, 600 weight, 0.06em tracking, uppercase, hint color.
 */

type FieldLabelProps = React.HTMLAttributes<HTMLParagraphElement>;

const FieldLabel = React.forwardRef<HTMLParagraphElement, FieldLabelProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        "text-section-label uppercase tracking-[0.06em] text-d-text-hint",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  ),
);
FieldLabel.displayName = "FieldLabel";

export { FieldLabel };
