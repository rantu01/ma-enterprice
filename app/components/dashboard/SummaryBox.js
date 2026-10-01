"use client";

import { cn } from "@/lib/utils";
import Card from "../ui/Card";

const variantStyles = {
  default: { bg: "bg-[var(--color-primary-subtle)]", text: "text-[var(--color-primary)]" },
  success: { bg: "bg-[var(--color-success-bg)]", text: "text-[var(--color-success-text)]" },
  warning: { bg: "bg-[var(--color-warning-bg)]", text: "text-[var(--color-warning-text)]" },
  error: { bg: "bg-[var(--color-error-bg)]", text: "text-[var(--color-error-text)]" },
  info: { bg: "bg-[var(--color-info-bg)]", text: "text-[var(--color-info-text)]" },
};

const toneStyles = {
  default: "text-[var(--color-ink)]",
  success: "text-[var(--color-success-text)]",
  error: "text-[var(--color-error-text)]",
  muted: "text-[var(--color-ink-2)]",
};

/**
 * Summary box with a heading, an optional trailing label (e.g. a month name)
 * and a stack of label/value rows.
 */
export default function SummaryBox({ title, caption, icon, variant = "default", rows = [], className }) {
  const style = variantStyles[variant] || variantStyles.default;

  return (
    <Card className={cn("hover:shadow-[var(--shadow-md)]", className)}>
      <div className="flex items-start justify-between gap-[var(--space-3)]">
        <div className="flex flex-col gap-[var(--space-2)] min-w-0">
          <p className="text-[var(--text-xs)] font-medium text-[var(--color-ink-3)] uppercase tracking-[0.05em]">
            {title}
          </p>
          {caption ? (
            <p className="text-[var(--text-sm)] font-semibold text-[var(--color-ink-2)]">{caption}</p>
          ) : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "flex shrink-0 items-center justify-center w-[40px] h-[40px] rounded-[var(--radius-md)]",
              style.bg,
              style.text
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        ) : null}
      </div>

      <dl className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)] border-t border-[var(--color-border)] pt-[var(--space-4)]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-[var(--space-3)]">
            <dt className="text-[var(--text-xs)] text-[var(--color-ink-3)]">{row.label}</dt>
            <dd
              className={cn(
                "text-[var(--text-lg)] font-bold leading-tight text-right",
                toneStyles[row.tone] || toneStyles.default
              )}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}