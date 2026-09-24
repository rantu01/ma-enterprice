"use client";

import { cn } from "@/lib/utils";

export default function FormField({
  label,
  error,
  helperText,
  children,
  required,
  id,
  className,
}) {
  const errorId = error ? `${id}-error` : undefined;
  const helperId = helperText ? `${id}-helper` : undefined;
  const describedBy = [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-[var(--space-1)] w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[var(--text-xs)] font-semibold text-[var(--color-ink)] dark:text-[var(--color-ink)] leading-[1.4] tracking-[0.025em]"
        >
          {label}
          {required && (
            <span className="text-[var(--color-error)] ml-1" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p id={helperId} className="text-[var(--text-xs)] text-[var(--color-ink-3)] leading-[1.4] mt-0.5">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-[var(--text-xs)] text-[var(--color-error)] leading-[1.4] mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}