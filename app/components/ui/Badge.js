"use client";

import { cn } from "@/lib/utils";

const badgeStyles = {
  active: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  pending: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)]",
  paid: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  unpaid: "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  completed: "bg-[var(--color-success-bg)] text-[var(--color-success-text)]",
  overdue: "bg-[var(--color-error-bg)] text-[var(--color-error-text)]",
  processing: "bg-[var(--color-processing-bg)] text-[var(--color-processing-text)]",
  cancelled: "bg-[var(--color-base)] text-[var(--color-muted)]",
  info: "bg-[var(--color-info-bg)] text-[var(--color-info-text)]",
};

const dotColors = {
  active: "var(--color-success)",
  pending: "var(--color-warning)",
  paid: "var(--color-success)",
  unpaid: "var(--color-error)",
  completed: "var(--color-success)",
  overdue: "var(--color-error)",
  processing: "var(--color-warning)",
  cancelled: "var(--color-muted)",
  info: "var(--color-primary)",
};

export default function Badge({ variant = "info", children, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[var(--space-1)] h-[24px] px-[var(--space-2)] rounded-[var(--radius-sm)] font-semibold leading-none text-[var(--text-xs)] tracking-[0.05em]",
        badgeStyles[variant],
        className
      )}
      role="status"
      aria-label={`Status: ${variant.charAt(0).toUpperCase() + variant.slice(1)}`}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: "6px", height: "6px", backgroundColor: dotColors[variant] }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}