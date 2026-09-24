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

const trendColors = {
  up: "text-[var(--color-success)]",
  down: "text-[var(--color-error)]",
};

export default function StatCard({
  title,
  value,
  trend,
  trendLabel,
  icon,
  variant = "default",
  className,
}) {
  const style = variantStyles[variant] || variantStyles.default;
  const isUp = trend === "up" || (typeof trend === "number" && trend >= 0);
  const trendDir = isUp ? "up" : "down";

  return (
    <Card className={cn("hover:shadow-[var(--shadow-md)]", className)}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-[var(--space-2)]">
          <p className="text-[var(--text-xs)] font-medium text-[var(--color-ink-3)] uppercase tracking-[0.05em]">
            {title}
          </p>
          <p className="text-[var(--text-2xl)] font-bold text-[var(--color-ink)] leading-tight">
            {value}
          </p>
          {trend !== undefined && trendLabel && (
            <div
              className={cn(
                "inline-flex items-center gap-1 text-[var(--text-xs)] font-medium",
                trendColors[trendDir]
              )}
              aria-label={`${trendDir === "up" ? "Up" : "Down"} ${trendLabel}`}
            >
              {isUp ? (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
              <span>{trendLabel}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-[40px] h-[40px] rounded-[var(--radius-md)]",
            style.bg,
            style.text
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}